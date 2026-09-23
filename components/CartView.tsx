"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPriceCents } from "@/lib/shop/format";
import BracketButton from "@/components/ui/BracketButton";
import BracketLink from "@/components/ui/BracketLink";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import { createCheckoutSession } from "@/app/(site)/checkout/actions";

export default function CartView() {
  const { items, subtotalCents, removeItem, setQuantity, hasPhysicalItem } = useCart();
  const [state, formAction, pending] = useActionState(createCheckoutSession, null);
  const [country, setCountry] = useState("");
  const isGreece = ["greece", "ελλάδα", "ellada", "gr"].includes(country.trim().toLowerCase());
  const shippingCents = hasPhysicalItem && country.trim() ? (isGreece ? 290 : 1500) : 0;

  if (items.length === 0) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-32 text-white">
        <ShoppingBag size={28} className="text-white/30" />
        <p className="tracked-label text-muted">Cart</p>
        <h1 className="text-2xl font-light">Your cart is empty</h1>
        <p className="max-w-sm text-center text-sm text-white/50">
          Nothing here yet, browse the shop or portfolio to find something.
        </p>
        <BracketLink href="/shop" className="tracked-label mt-4 px-6 py-3">
          Visit the shop
        </BracketLink>
      </section>
    );
  }

  return (
    <section className="bg-black text-white">
      <div className="section-container max-w-3xl">
        <p className="tracked-label text-muted">SHOP / CART</p>
        <div className="mt-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
        <h1 className="section-heading mb-10 mt-4">Your cart</h1>

        <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10">
          {items.map((item) => (
            <li
              key={`${item.productId}:${item.variantId ?? ""}`}
              className="flex flex-wrap items-center gap-4 py-5"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-white/10 bg-black p-2">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                    sizes="80px"
                  />
                ) : null}
              </div>

              {/* min-w-0 so a long name/color actually shrinks instead of
                  forcing this column past its fair share of the row —
                  flex items default to a min-width of their own content,
                  which for a long enough name is wider than what's left
                  once the quantity/price/remove group's fixed widths are
                  subtracted from a phone-width row. */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/shop/${item.slug}`}
                  className="focus-ring text-sm transition hover:text-white/70"
                >
                  {item.name}
                </Link>
                {item.color && <p className="mt-1 text-xs text-white/60">{item.color}</p>}
                <p className="mt-1 text-xs text-muted">
                  {formatPriceCents(item.priceCents, item.currency)} each
                </p>
              </div>

              {/* w-full below sm: (with flex-wrap on the <li> above) drops
                  this whole group to its own row under the image/name
                  instead of squeezing quantity+price+remove into
                  whatever sliver is left next to a long product name on
                  a phone-width screen. */}
              <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                <div className="flex items-center gap-1 rounded-full border border-white/15 px-1">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${item.name}`}
                    onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="focus-ring p-2.5 text-white/60 transition hover:text-white"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="min-w-3 text-center text-xs" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${item.name}`}
                    onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="focus-ring p-2.5 text-white/60 transition hover:text-white"
                  >
                    <Plus size={10} />
                  </button>
                </div>

                <span className="w-20 text-right text-sm">
                  {formatPriceCents(item.priceCents * item.quantity, item.currency)}
                </span>

                <button
                  type="button"
                  aria-label={`Remove ${item.name} from cart`}
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="focus-ring p-2.5 text-white/40 transition hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center justify-between">
          <span className="tracked-label text-muted">Subtotal</span>
          <span className="text-lg">
            {formatPriceCents(subtotalCents, items[0]?.currency ?? "eur")}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          Shipping and final total are calculated at checkout.
        </p>

        <form action={formAction} className="mt-10 border border-white/10 p-5 sm:p-8">
          <input
            type="hidden"
            name="cart"
            readOnly
            value={JSON.stringify(
              items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              }))
            )}
          />

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex items-center justify-between gap-4">
              <p className="tracked-label text-muted">Customer information</p>
              <span className="font-mono text-[10px] text-white/25">01 / 02</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="tracked-label text-white/45">Full name</span>
                <Input
                  required
                  name="customerName"
                  type="text"
                  placeholder="Your name"
                  size="md"
                  className="checkout-field mt-2 w-full"
                />
              </label>
              <label className="block">
                <span className="tracked-label text-white/45">Email address</span>
                <Input
                  required
                  name="customerEmail"
                  type="email"
                  placeholder="you@example.com"
                  size="md"
                  className="checkout-field mt-2 w-full"
                />
              </label>
            </div>
          </div>

          {hasPhysicalItem && (
            <div className="mt-8 border-t border-white/10 pt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="tracked-label text-muted">Shipping information</p>
                <span className="font-mono text-[10px] text-white/25">02 / 02</span>
                <p className="text-xs text-muted">Greece €2.90 · Worldwide €15.00</p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="tracked-label text-white/45">Country</span>
                  <Input
                    required
                    name="country"
                    type="text"
                    placeholder="Country"
                    size="md"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="checkout-field mt-2 w-full"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="tracked-label text-white/45">Street address</span>
                  <Input
                    required
                    name="address"
                    type="text"
                    placeholder="Street and number"
                    size="md"
                    className="checkout-field mt-2 w-full"
                  />
                </label>
                <label className="block">
                  <span className="tracked-label text-white/45">City</span>
                  <Input
                    required
                    name="city"
                    type="text"
                    placeholder="City"
                    size="md"
                    className="checkout-field mt-2 w-full"
                  />
                </label>
                <label className="block">
                  <span className="tracked-label text-white/45">Postal code</span>
                  <Input
                    required
                    name="postalCode"
                    type="text"
                    placeholder="Postal code"
                    size="md"
                    className="checkout-field mt-2 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          <FormError error={state?.error} className="mb-4" />

          {hasPhysicalItem && (
            <div className="mt-10 border-t border-white/10 pt-5 text-sm">
              <div className="flex items-center justify-between text-muted">
                <span>Shipping</span>
                <span>{country ? formatPriceCents(shippingCents, "eur") : "—"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base text-white">
                <span>Total</span>
                <span>{formatPriceCents(subtotalCents + shippingCents, "eur")}</span>
              </div>
            </div>
          )}

          <BracketButton
            type="submit"
            pending={pending}
            pendingLabel="Redirecting to checkout…"
            className="mt-10 w-full px-8 py-4 text-center sm:w-auto"
          >
            Checkout
          </BracketButton>
        </form>
      </div>
    </section>
  );
}
