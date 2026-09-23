"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart/CartContext";
import { swatchColorFor, isLightSwatch } from "@/lib/shop/swatchColor";
import { initialVariantId } from "@/lib/shop/variant";
import CartActionButton from "@/components/CartActionButton";

type Variant = {
  id: string;
  color: string;
  imageUrl: string | null;
  /** Additional angles for this color (3/4, top, bottom, ...), shown after
   * imageUrl once this color is picked. */
  images: string[];
  isDefault: boolean;
  stock: number | null;
  isActive: boolean;
};

type Props = {
  product: Omit<CartItem, "quantity" | "variantId" | "color">;
  outOfStock?: boolean;
  variants?: Variant[];
  /** Fires whenever the selected color changes (including the initial
   * auto-select of the default/sole variant) so the product gallery can
   * swap to that color's full photo set — `null` when nothing is selected
   * or the selected color has no photos of its own. */
  onVariantChange?: (images: string[] | null) => void;
};

export default function AddToCartButton({ product, outOfStock, variants, onVariantChange }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const hasVariants = !!variants && variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? initialVariantId(variants!, product.slug) : null
  );

  const selectedVariantImages = hasVariants
    ? (() => {
        const v = variants!.find((variant) => variant.id === selectedVariantId);
        if (!v) return null;
        const urls = [v.imageUrl, ...v.images].filter((u): u is string => !!u);
        return urls.length > 0 ? urls : null;
      })()
    : null;

  useEffect(() => {
    onVariantChange?.(selectedVariantImages);
    // selectedVariantImages is recomputed fresh each render from
    // selectedVariantId — comparing by value here would just re-run every
    // render for no reason, so key off the id instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId, onVariantChange]);

  if (!hasVariants && outOfStock) {
    return (
      <span className="tracked-label inline-block border border-white/10 px-6 py-3 text-muted">
        Sold out
      </span>
    );
  }

  const selectedVariant = hasVariants
    ? variants!.find((v) => v.id === selectedVariantId)
    : undefined;
  const variantSoldOut = !!selectedVariant && selectedVariant.stock === 0;

  function handleAdd() {
    if (hasVariants && !selectedVariant) return;
    addItem({ ...product, variantId: selectedVariant?.id, color: selectedVariant?.color });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      {hasVariants && (
        <div className="flex flex-wrap items-center gap-3">
          {variants!.map((variant) => {
            const soldOut = !variant.isActive || variant.stock === 0;
            const selected = variant.id === selectedVariantId;
            const hex = swatchColorFor(variant.color);
            return (
              <button
                key={variant.id}
                type="button"
                disabled={soldOut}
                onClick={() => setSelectedVariantId(variant.id)}
                aria-pressed={selected}
                aria-label={variant.color}
                title={soldOut ? `${variant.color} (sold out)` : variant.color}
                style={{ backgroundColor: hex }}
                className={`focus-ring relative h-11 w-11 shrink-0 rounded-full border border-white/25 transition ${
                  soldOut ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:border-white/50"
                }`}
              >
                {selected && (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ color: isLightSwatch(hex) ? "#161616" : "#f5f5f3" }}
                  >
                    <Check size={18} strokeWidth={3} />
                  </span>
                )}
                {soldOut && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[linear-gradient(to_top_right,transparent_46%,white_50%,transparent_54%)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {hasVariants && variantSoldOut ? (
        <span className="tracked-label inline-block w-fit border border-white/10 px-6 py-3 text-muted">
          Sold out
        </span>
      ) : (
        <CartActionButton
          added={added}
          disabled={hasVariants && !selectedVariant}
          onClick={handleAdd}
        >
          {added ? "Added" : hasVariants && !selectedVariant ? "Choose a color" : "Add to cart"}
        </CartActionButton>
      )}
    </div>
  );
}
