import "server-only";

import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// --- Products ---

const PRODUCT_INCLUDE_ACTIVE = {
  images: { orderBy: { position: "asc" as const } },
  variants: { where: { isActive: true }, orderBy: { color: "asc" as const } },
};

const PRODUCT_INCLUDE_ALL = {
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { color: "asc" as const } },
};

export function listActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true, name: { not: { startsWith: "Starfall" } } },
    orderBy: { createdAt: "desc" },
    include: PRODUCT_INCLUDE_ACTIVE,
  });
}

export function listAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: PRODUCT_INCLUDE_ALL,
  });
}

export function findProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, name: { not: { startsWith: "Starfall" } } },
    include: PRODUCT_INCLUDE_ACTIVE,
  });
}

export function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE_ALL });
}

export function findProductsByIds(ids: string[]) {
  return prisma.product.findMany({ where: { id: { in: ids } }, include: PRODUCT_INCLUDE_ALL });
}

export type ProductImageInput = { url: string };
export type ProductVariantInput = {
  color: string;
  imageUrl?: string | null;
  images?: string[];
  isDefault?: boolean;
  stock: number | null;
  isActive: boolean;
};

export type CreateProductInput = {
  slug: string;
  name: string;
  description: string;
  type: "PHYSICAL" | "DIGITAL" | "COMMISSION";
  priceCents: number;
  stock?: number | null;
  images?: ProductImageInput[];
  variants?: ProductVariantInput[];
};

export function createProduct(data: CreateProductInput) {
  const { images, variants, ...productData } = data;
  return prisma.product.create({
    data: {
      ...productData,
      images: images?.length
        ? { create: images.map((image, index) => ({ url: image.url, position: index })) }
        : undefined,
      variants: variants?.length
        ? {
            create: variants.map((variant) => ({
              color: variant.color,
              imageUrl: variant.imageUrl ?? null,
              images: variant.images ?? [],
              isDefault: variant.isDefault ?? false,
              stock: variant.stock,
              isActive: variant.isActive,
            })),
          }
        : undefined,
    },
  });
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "images" | "variants">> & {
  isActive?: boolean;
  images?: ProductImageInput[];
  variants?: ProductVariantInput[];
};

/** Images are fully replaced on each save (simplest correct behavior for a
 * short admin-managed list). Variants are upserted by color instead — a
 * color dropped from the submitted list is deactivated, not deleted, since
 * it may already be referenced by past OrderItems (same "deactivate, don't
 * destroy history" reasoning Product itself uses). */
export async function updateProduct(id: string, data: UpdateProductInput) {
  const { images, variants, ...productData } = data;

  return prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({ productId: id, url: image.url, position: index })),
        });
      }
    }

    if (variants) {
      const existing = await tx.productVariant.findMany({ where: { productId: id } });
      const submittedColors = new Set(variants.map((v) => v.color));

      for (const variant of variants) {
        await tx.productVariant.upsert({
          where: { productId_color: { productId: id, color: variant.color } },
          create: {
            productId: id,
            color: variant.color,
            imageUrl: variant.imageUrl ?? null,
            images: variant.images ?? [],
            isDefault: variant.isDefault ?? false,
            stock: variant.stock,
            isActive: variant.isActive,
          },
          update: {
            imageUrl: variant.imageUrl ?? null,
            images: variant.images ?? [],
            isDefault: variant.isDefault ?? false,
            stock: variant.stock,
            isActive: variant.isActive,
          },
        });
      }

      const toDeactivate = existing.filter((v) => !submittedColors.has(v.color));
      if (toDeactivate.length) {
        await tx.productVariant.updateMany({
          where: { id: { in: toDeactivate.map((v) => v.id) } },
          data: { isActive: false },
        });
      }
    }

    return tx.product.update({ where: { id }, data: productData });
  });
}

export type DeleteProductResult = { ok: true } | { ok: false; reason: "has_orders" };

export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  try {
    await prisma.product.delete({ where: { id } });
    return { ok: true };
  } catch (error) {
    // P2003: foreign key violation — OrderItem.productId is a deliberate
    // Restrict (see ARCHITECTURE.md), so this is the expected way "has order
    // history" surfaces, not an exceptional case to let bubble up.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, reason: "has_orders" };
    }
    throw error;
  }
}

// --- Orders ---

export type OrderLineInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPriceCents: number;
};

export type CreatePendingOrderInput = {
  stripeCheckoutSessionId: string;
  totalCents: number;
  customerEmail: string;
  customerName: string;
  shippingAddress?: Prisma.InputJsonValue;
  items: OrderLineInput[];
};

const ORDER_INCLUDE = { items: { include: { product: true, variant: true } } };

export function createPendingOrder(input: CreatePendingOrderInput) {
  return prisma.order.create({
    data: {
      stripeCheckoutSessionId: input.stripeCheckoutSessionId,
      totalCents: input.totalCents,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      shippingAddress: input.shippingAddress,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        })),
      },
    },
    include: { items: true },
  });
}

export function findOrderByCheckoutSessionId(sessionId: string) {
  return prisma.order.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: ORDER_INCLUDE,
  });
}

export function findOrderByTrackingToken(token: string) {
  return prisma.order.findUnique({ where: { trackingToken: token }, include: ORDER_INCLUDE });
}

export function findOrderById(id: string) {
  return prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
}

export function listOrders() {
  return prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: ORDER_INCLUDE });
}

export type MarkPaidResult =
  | { ok: true }
  | { ok: false; reason: "already_processed" }
  | { ok: false; reason: "oversold"; productId: string };

export type ConfirmedCustomerDetails = {
  email: string;
  name?: string;
  shippingAddress?: Prisma.InputJsonValue;
};

/**
 * Atomically decrements stock per line item and flips the order to PAID, or
 * — if a line item can no longer be fulfilled (someone else bought the last
 * unit between checkout-session creation and this webhook firing) — flags
 * the order REFUND_NEEDED instead of silently overselling or silently
 * dropping the sale. Also fills in the customer details Stripe's hosted page
 * collected, which weren't known when the PENDING order was first created.
 */
export async function markOrderPaid(
  orderId: string,
  stripePaymentIntentId: string | null,
  customer: ConfirmedCustomerDetails
): Promise<MarkPaidResult> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== OrderStatus.PENDING) {
      return { ok: false, reason: "already_processed" as const };
    }

    async function markRefundNeeded(productId: string) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.REFUND_NEEDED,
          stripePaymentIntentId,
          customerEmail: customer.email,
          customerName: customer.name,
          shippingAddress: customer.shippingAddress,
        },
      });
      return { ok: false as const, reason: "oversold" as const, productId };
    }

    for (const item of order.items) {
      // A variant, when present, owns stock for this line — the parent
      // Product's own `stock` field is only consulted for simple,
      // variant-less products.
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.stock === null) continue; // unlimited

        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) return await markRefundNeeded(item.productId);
        continue;
      }

      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock === null) continue; // unlimited (digital/commission)

      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (result.count === 0) return await markRefundNeeded(item.productId);
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        stripePaymentIntentId,
        customerEmail: customer.email,
        customerName: customer.name,
        shippingAddress: customer.shippingAddress,
      },
    });
    return { ok: true as const };
  });
}

export function markOrderShipped(orderId: string, trackingNumber: string) {
  return prisma.order
    .updateMany({
      where: { id: orderId, status: OrderStatus.PAID },
      data: { trackingNumber, shippedAt: new Date(), status: OrderStatus.FULFILLED },
    })
    .then((result) => result.count > 0);
}

export function markOrderCancelled(orderId: string) {
  return prisma.order
    .updateMany({
      where: { id: orderId, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CANCELLED },
    })
    .then((result) => result.count > 0);
}

export type { Prisma };
