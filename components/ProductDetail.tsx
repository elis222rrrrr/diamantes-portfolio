"use client";

import { useState } from "react";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import ShopProductionNote from "@/components/ShopProductionNote";
import { formatPriceCents } from "@/lib/shop/format";
import { highlightTerms } from "@/lib/text/highlightTerms";
import type { CartItem } from "@/lib/cart/CartContext";
import { objectTypeForProduct } from "@/lib/shop/productMeta";

type Variant = {
  id: string;
  color: string;
  imageUrl: string | null;
  images: unknown; // Prisma Json — narrowed to string[] below
  isDefault: boolean;
  stock: number | null;
  isActive: boolean;
};

const TYPE_LABELS = {
  PHYSICAL: "Physical piece",
  DIGITAL: "Digital good",
  COMMISSION: "Commissioned work",
} as const;

// A small material/spec tag next to the title — for pieces where the build
// material itself is worth calling out up front (e.g. real sterling silver,
// not the usual resin print).
const PRODUCT_TAGS: Record<string, string> = {
  "nebula-ring": "SILVER 925",
};

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    type: keyof typeof TYPE_LABELS;
    priceCents: number;
    currency: string;
    images: { url: string }[];
    variants: Variant[];
  };
  outOfStock: boolean;
};

// Owns the one piece of state ProductGallery and AddToCartButton need to
// share — which color is selected — so picking a color swaps the displayed
// photo set. Split out of the (server) product page because that state has
// to live in a client component somewhere between the two.
export default function ProductDetail({ product, outOfStock }: Props) {
  const [variantImages, setVariantImages] = useState<string[] | null>(null);

  const cartProduct: Omit<CartItem, "quantity" | "variantId" | "color"> = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: product.priceCents,
    currency: product.currency,
    imageUrl: product.images[0]?.url ?? null,
    type: product.type,
  };

  const variants = product.variants.map((v) => ({
    ...v,
    images: Array.isArray(v.images)
      ? v.images.filter((u): u is string => typeof u === "string")
      : [],
  }));

  const tag = PRODUCT_TAGS[product.slug];
  const objectType = objectTypeForProduct(product.slug);

  return (
    <div className="section-container">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} overrideImages={variantImages} />

        <div className="flex flex-col justify-center">
          <p className="tracked-label mb-3 text-muted">{TYPE_LABELS[product.type]}</p>
          <div className="mb-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
          <div className="mb-4 flex items-center gap-3">
            {/* No title icon here anymore (per feedback) — it used to show
                either a bespoke simplified mark or a brightness-0 silhouette
                of the product photo, but the silhouette fallback often
                rendered as an unrecognizable solid black blob. */}
            <h1 className="text-lg font-semibold">{product.name}</h1>
            {objectType && <span className="tracked-label ml-auto text-muted">{objectType}</span>}
            {tag && <span className="tracked-label text-muted">{tag}</span>}
          </div>
          <p className="mb-8 text-lg text-white/70">
            {formatPriceCents(product.priceCents, product.currency)}
          </p>
          <p className="mb-10 max-w-md text-sm leading-snug text-foreground">
            {highlightTerms(product.description, [product.name])}
          </p>

          <AddToCartButton
            product={cartProduct}
            outOfStock={outOfStock}
            variants={variants}
            onVariantChange={setVariantImages}
          />
        </div>
      </div>

      {/* Same production-timeline strip as the shop listing page — repeated
          here since a buyer on a single product page shouldn't have to go
          back to /shop to see how long their piece takes to make. Physical
          pieces only: digital goods aren't 3D-printed/finished/dispatched. */}
      {product.type === "PHYSICAL" && <ShopProductionNote />}
    </div>
  );
}
