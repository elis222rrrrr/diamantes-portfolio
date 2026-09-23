"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { findProductsByIds, createPendingOrder } from "@/lib/shop/repository";
import { stripe } from "@/lib/shop/stripe";
import { requireSiteUrl } from "@/lib/email/resend";
import { checkCheckoutRateLimit } from "@/lib/rate-limit";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(20),
});

const checkoutSchema = z.array(cartItemSchema).min(1).max(50);
const contactSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().toLowerCase().email().max(255),
});
const shippingSchema = z.object({
  address: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(100),
});

function isGreece(country: string): boolean {
  return ["greece", "ελλάδα", "ellada", "gr"].includes(country.trim().toLowerCase());
}

export type CheckoutState = { error: string } | null;

export async function createCheckoutSession(
  _prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const ipAddress = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (await checkCheckoutRateLimit(ipAddress)) {
    return { error: "Too many attempts. Please try again shortly." };
  }

  const raw = formData.get("cart");
  if (typeof raw !== "string") return { error: "Your cart is empty." };

  let cartInput: unknown;
  try {
    cartInput = JSON.parse(raw);
  } catch {
    return { error: "Your cart could not be read." };
  }

  const parsed = checkoutSchema.safeParse(cartInput);
  if (!parsed.success || parsed.data.length === 0) {
    return { error: "Your cart is empty." };
  }

  // The client cart only ever contributes a productId/variantId + quantity
  // past this point — price, name, color, and availability are all re-read
  // fresh below, never trusted from what the browser sent.
  type RequestedLine = { productId: string; variantId?: string; quantity: number };
  const requestedLines = new Map<string, RequestedLine>();
  for (const item of parsed.data) {
    const key = `${item.productId}:${item.variantId ?? ""}`;
    const existing = requestedLines.get(key);
    requestedLines.set(key, {
      productId: item.productId,
      variantId: item.variantId,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }

  const products = await findProductsByIds([
    ...new Set([...requestedLines.values()].map((l) => l.productId)),
  ]);
  const productById = new Map(products.map((product) => [product.id, product]));

  type Line = {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPriceCents: number;
    name: string;
  };
  const lines: Line[] = [];
  let hasPhysicalItem = false;
  const currency = "eur";

  for (const { productId, variantId, quantity } of requestedLines.values()) {
    const product = productById.get(productId);
    if (!product || !product.isActive) {
      return { error: "One of the items in your cart is no longer available." };
    }

    if (product.variants.length > 0) {
      const variant = variantId ? product.variants.find((v) => v.id === variantId) : undefined;
      if (!variant || !variant.isActive) {
        return { error: `Please choose a color for "${product.name}".` };
      }
      if (variant.stock !== null && variant.stock < quantity) {
        return {
          error:
            variant.stock === 0
              ? `"${product.name}" in ${variant.color} just sold out.`
              : `Only ${variant.stock} left of "${product.name}" in ${variant.color}, please adjust the quantity.`,
        };
      }
      if (product.type === "PHYSICAL") hasPhysicalItem = true;
      lines.push({
        productId: product.id,
        variantId: variant.id,
        quantity,
        unitPriceCents: product.priceCents,
        name: `${product.name} (${variant.color})`,
      });
      continue;
    }

    if (product.stock !== null && product.stock < quantity) {
      return {
        error:
          product.stock === 0
            ? `"${product.name}" just sold out.`
            : `Only ${product.stock} left of "${product.name}", please adjust the quantity.`,
      };
    }
    if (product.type === "PHYSICAL") hasPhysicalItem = true;
    lines.push({
      productId: product.id,
      quantity,
      unitPriceCents: product.priceCents,
      name: product.name,
    });
  }

  const totalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const contact = contactSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
  });
  if (!contact.success) return { error: "Please enter your name and a valid email address." };

  const shipping = hasPhysicalItem
    ? shippingSchema.safeParse({
        address: formData.get("address"),
        city: formData.get("city"),
        postalCode: formData.get("postalCode"),
        country: formData.get("country"),
      })
    : null;
  if (hasPhysicalItem && (!shipping || !shipping.success)) {
    return { error: "Please complete your shipping information." };
  }

  const shippingCents =
    shipping?.success && isGreece(shipping.data.country) ? 290 : hasPhysicalItem ? 1500 : 0;
  const shippingAddress = shipping?.success
    ? {
        address: shipping.data.address,
        city: shipping.data.city,
        postalCode: shipping.data.postalCode,
        country: shipping.data.country,
      }
    : undefined;
  const siteUrl = requireSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: contact.data.customerEmail,
    line_items: [
      ...lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency,
          unit_amount: line.unitPriceCents,
          product_data: { name: line.name },
        },
      })),
      ...(shippingCents
        ? [
            {
              quantity: 1,
              price_data: {
                currency,
                unit_amount: shippingCents,
                product_data: { name: "Boxed shipping" },
              },
            },
          ]
        : []),
    ],
    // {CHECKOUT_SESSION_ID} is a Stripe-only template token substituted at
    // redirect time — /orders/success looks the session back up to find the
    // order's own tracking token, since that isn't known until the order is
    // created just below (which itself needs this session's id first).
    success_url: `${siteUrl}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cart`,
  });

  if (!session.url) {
    return { error: "Could not start checkout. Please try again." };
  }

  await createPendingOrder({
    stripeCheckoutSessionId: session.id,
    totalCents: totalCents + shippingCents,
    customerEmail: contact.data.customerEmail,
    customerName: contact.data.customerName,
    shippingAddress,
    items: lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
    })),
  });

  redirect(session.url);
}
