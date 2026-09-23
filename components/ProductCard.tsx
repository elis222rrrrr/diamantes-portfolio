"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPriceCents } from "@/lib/shop/format";
import { swatchColorFor, isLightSwatch } from "@/lib/shop/swatchColor";
import { initialVariantId } from "@/lib/shop/variant";
import { objectTypeForProduct } from "@/lib/shop/productMeta";
import CartActionButton from "@/components/CartActionButton";

type Variant = {
  id: string;
  color: string;
  imageUrl: string | null;
  images: unknown; // Prisma Json — narrowed to string[] below
  isDefault: boolean;
  stock: number | null;
  isActive: boolean;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  type: "PHYSICAL" | "DIGITAL" | "COMMISSION";
  priceCents: number;
  currency: string;
  stock: number | null;
  images: { url: string }[];
  variants: Variant[];
};

const TYPE_LABELS = {
  PHYSICAL: "PHYSICAL OBJECT",
  DIGITAL: "DIGITAL ASSET",
  COMMISSION: "COMMISSIONED WORK",
} as const;

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const hasVariants = product.variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? initialVariantId(product.variants, product.slug) : null
  );

  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.id === selectedVariantId)
    : undefined;

  const outOfStock = hasVariants
    ? product.variants.every((v) => v.stock === 0)
    : product.stock !== null && product.stock <= 0;
  const variantSoldOut = !!selectedVariant && selectedVariant.stock === 0;

  const displayImage = selectedVariant?.imageUrl ?? product.images[0]?.url ?? null;
  const objectType = objectTypeForProduct(product.slug);

  // "System status" language instead of plain ecommerce labels — grounded
  // in the real fields we actually track (stock, isActive, product.type),
  // not invented ones. Commission-type products are made-to-order by
  // nature, so they read as an ongoing process rather than a stock level.
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isSoldOut = hasVariants ? variantSoldOut || outOfStock : outOfStock;
  const status =
    product.type === "COMMISSION"
      ? "FABRICATION QUEUE"
      : isSoldOut
        ? "OFFLINE"
        : typeof currentStock === "number" && currentStock > 0 && currentStock <= 3
          ? "LIMITED"
          : "ONLINE";
  const statusIsLive = status !== "OFFLINE";
  const statusColor = statusIsLive ? "var(--focus-ring)" : undefined;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault(); // this control sits inside the card's <Link> — don't navigate
    if (hasVariants && (!selectedVariant || variantSoldOut)) return;
    if (!hasVariants && outOfStock) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      currency: product.currency,
      imageUrl: displayImage,
      type: product.type,
      variantId: selectedVariant?.id,
      color: selectedVariant?.color,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  const quickAddDisabled = hasVariants ? !selectedVariant || variantSoldOut : outOfStock;

  return (
    // Floats on the page background rather than sitting in a bordered
    // "file" box, per feedback — now the same no-container treatment the
    // individual product/portfolio detail pages already used.
    <div className="group relative flex flex-col">
      <Link href={`/shop/${product.slug}`} className="focus-ring flex flex-1 flex-col">
        <div className="flex items-center justify-between px-1 pt-1 font-mono text-[11px] text-white/40">
          <span>[{String(index + 1).padStart(3, "0")}]</span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: statusColor ?? "rgba(255,255,255,0.3)" }}
            />
            {product.type}
          </span>
        </div>

        {/* Large, sculptural image — this is an exhibit, not a thumbnail.
            bg-black is this site's semantic page-surface token: black in
            the default dark theme, white once toggled light — same
            treatment as the product/portfolio pages' own galleries. */}
        <div className="relative mt-2 aspect-square w-full overflow-hidden bg-black p-6">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-contain p-2 transition duration-500 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : null}
        </div>

        <div className="px-1 pb-1 pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-base font-semibold">{product.name}</p>
            {objectType && <span className="tracked-label shrink-0 text-muted">{objectType}</span>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatPriceCents(product.priceCents, product.currency)}
          </p>
        </div>

        <div className="mt-2 space-y-0.5 px-1 font-mono text-[11px] leading-relaxed text-white/35">
          <p>TYPE: {TYPE_LABELS[product.type]}</p>
          <p>
            STATUS: <span style={{ color: statusColor }}>{status}</span>
          </p>
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between gap-1.5 px-1 py-1 sm:gap-3">
        {hasVariants ? (
          <div className="flex gap-1 sm:gap-1.5">
            {product.variants.map((variant) => {
              const soldOut = !variant.isActive || variant.stock === 0;
              const selected = variant.id === selectedVariantId;
              const hex = swatchColorFor(variant.color);
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={soldOut}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariantId(variant.id);
                  }}
                  aria-pressed={selected}
                  aria-label={variant.color}
                  title={soldOut ? `${variant.color} (sold out)` : variant.color}
                  style={{ backgroundColor: hex }}
                  className={`focus-ring relative h-6 w-6 shrink-0 rounded-full border transition sm:h-8 sm:w-8 ${
                    selected ? "border-[var(--focus-ring)]" : "border-white/25"
                  } ${soldOut ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:border-white/50"}`}
                >
                  {selected && (
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ color: isLightSwatch(hex) ? "#161616" : "#f5f5f3" }}
                    >
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <span />
        )}

        <CartActionButton added={added} disabled={quickAddDisabled} onClick={handleQuickAdd} small>
          {added ? "Added" : "Add to cart"}
        </CartActionButton>
      </div>
    </div>
  );
}
