import { SITE_URL } from "@/lib/seo/site";
import { safeJsonLd } from "@/lib/seo/json-ld";

type Variant = { color: string; stock: number | null; isActive: boolean };

type Props = {
  product: {
    slug: string;
    name: string;
    description: string;
    priceCents: number;
    currency: string;
    stock: number | null;
    images: { url: string }[];
    variants: Variant[];
  };
};

/** schema.org Product + Offer — what Google Shopping, rich results, and
 * AI shopping assistants actually read to recommend/price-compare a
 * product. Missing this entirely (as every product page previously was)
 * means these pages can rank on text relevance but never surface as a
 * priced, purchasable item. */
export default function ProductSchema({ product }: Props) {
  const hasStockField = product.variants.length > 0 || product.stock !== null;
  const inStock =
    product.variants.length > 0
      ? product.variants.some((v) => v.isActive && (v.stock === null || v.stock > 0))
      : product.stock === null || product.stock > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    url: `${SITE_URL}/shop/${product.slug}`,
    brand: { "@type": "Brand", name: "Diamantes 3Designs" },
    ...(product.variants.length > 0
      ? {
          hasVariant: product.variants
            .filter((v) => v.isActive)
            .map((v) => ({
              "@type": "Product",
              name: `${product.name} (${v.color})`,
            })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/shop/${product.slug}`,
      priceCurrency: product.currency.toUpperCase(),
      price: (product.priceCents / 100).toFixed(2),
      ...(hasStockField
        ? { availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }
        : { availability: "https://schema.org/InStock" }),
      itemCondition: "https://schema.org/NewCondition",
      areaServed: "Worldwide",
      seller: { "@type": "Organization", name: "Diamantes 3Designs" },
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
  );
}
