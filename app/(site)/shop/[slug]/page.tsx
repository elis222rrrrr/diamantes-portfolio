import { notFound } from "next/navigation";
import { findProductBySlug } from "@/lib/shop/repository";
import ProductDetail from "@/components/ProductDetail";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import ProductSchema from "@/components/ProductSchema";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatPriceCents } from "@/lib/shop/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  if (!product || !product.isActive) {
    return buildMetadata({
      title: "Product not found",
      description: "This item is no longer available.",
      path: `/shop/${slug}`,
      noIndex: true,
    });
  }
  const price = formatPriceCents(product.priceCents, product.currency);
  const metadata = buildMetadata({
    title: product.name,
    // Price folded into the meta description itself — this is what shows
    // up as the snippet text in search/social/AI-assistant previews, and
    // "designer piece, made in Greece, ships worldwide" is the framing
    // that should travel with every product mention, not just live on
    // the page itself.
    description: `${product.description} ${price}. Designer piece made in Greece, ships worldwide.`,
    path: `/shop/${product.slug}`,
  });
  const image = product.images[0]?.url;
  if (!image) return metadata;
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: [{ url: image }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  // Only meaningful for a product with no color variants — a variant product's
  // availability is decided per color, inside AddToCartButton.
  const outOfStock = product.variants.length === 0 && product.stock !== null && product.stock <= 0;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: product.name, path: `/shop/${product.slug}` },
        ]}
      />
      <ProductSchema product={product} />
      <section className="force-light">
        <ProductDetail product={product} outOfStock={outOfStock} />
      </section>
    </>
  );
}
