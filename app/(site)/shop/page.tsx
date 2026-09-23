import { ShoppingBag } from "lucide-react";
import { listActiveProducts } from "@/lib/shop/repository";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import ProductCard from "@/components/ProductCard";
import ShopHero from "@/components/ShopHero";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/seo/site";
import { safeJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Shop: Designer Accessories, Made in Greece",
  description:
    "Designer rings, keychains and accessories designed and made in Greece, cast in sterling silver or 3D-printed in resin. Limited pieces, worldwide shipping.",
  path: "/shop",
});

export default async function ShopPage() {
  const products = await listActiveProducts();
  const lastUpdate =
    products.length > 0
      ? new Date(Math.max(...products.map((p) => p.updatedAt.getTime())))
      : new Date();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
        ]}
      />
      {/* CollectionPage + ItemList — tells search/AI crawlers this page is a
          browsable product catalog (and what's currently in it), on top of
          each individual product's own Product/Offer schema. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Shop | Diamantes 3Designs",
            description:
              "Designer rings, keychains and accessories designed and made in Greece, shipped worldwide.",
            url: `${SITE_URL}/shop`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: products.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${SITE_URL}/shop/${product.slug}`,
                name: product.name,
              })),
            },
          }),
        }}
      />
      {/* Follows the site's own light/dark toggle like everywhere else —
          bg-black/text-white are this site's semantic dark-surface tokens
          (black in the default dark theme, white once toggled light), not
          hardcoded to force-dark. An earlier pass locked this page to
          always-black regardless of the toggle; reverted per feedback that
          the light theme should give a plain white background here too. */}
      <section className="bg-black text-white">
        <div className="section-container">
          <ShopHero objectCount={products.length} lastUpdate={lastUpdate} />

          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 border border-white/10 px-8 py-24 text-center">
              <ShoppingBag size={28} className="text-white/30" />
              <p className="text-sm text-muted">Nothing in the shop yet, check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-6 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
