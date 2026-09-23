import Hero from "@/components/Hero";
import PortfolioSection from "@/components/PortfolioSection";
import StudioBand from "@/components/StudioBand";
import ShopSection from "@/components/ShopSection";
import ContactSection from "@/components/ContactSection";
import { getSiteSettings } from "@/lib/settings/repository";
import { listActive as listActiveServices } from "@/lib/services/repository";
import { listAll as listAllPortfolio } from "@/lib/portfolio/repository";
import { listActiveProducts } from "@/lib/shop/repository";

export default async function Home() {
  // Portfolio/shop lookups feed both the Hero's right-panel service card
  // and the homepage's portfolio/shop grids below — caught separately so a
  // DB hiccup there (seen in practice — the pool to Neon does occasionally
  // drop) degrades to missing panel content, not a down homepage.
  const [settings, services, portfolioProjects, products] = await Promise.all([
    getSiteSettings(),
    listActiveServices(),
    listAllPortfolio().catch(() => []),
    listActiveProducts().catch(() => []),
  ]);

  // The Hero's right-panel card is text (a featured service), not a photo,
  // per feedback — the studio's first/primary service (listActiveServices()
  // is already ordered by its own `order` field), rather than a product or
  // portfolio shot.
  const featuredService = services[0] ?? null;
  // A real number for the Hero's status row (see its own comment) — same
  // isActive filter the real /portfolio page's listActiveByGroup calls
  // apply, not the raw listAllPortfolio() count above.
  const activeProjects = portfolioProjects.filter((p) => p.isActive);
  const activeProjectCount = activeProjects.length;
  // Real work, not the placeholder "Cyber Organic"/"Parametric Shell"
  // cards PortfolioSection used to hardcode — first three active
  // projects in their own display order, same as the real /portfolio grid.
  const featuredProjects = activeProjects.slice(0, 3);
  // The three pieces meant to represent the shop on the homepage, rather
  // than whichever three happen to be newest. UF Bag stays portfolio-only
  // (not a shop item) per feedback. Falls back to newest-first if any of
  // these three is ever deactivated, so the section never renders fewer
  // than 3 cards silently.
  const HOMEPAGE_SHOP_SLUGS = ["nebula-ring", "ods-32", "shoe-key"];
  const curatedProducts = HOMEPAGE_SHOP_SLUGS.map((slug) =>
    products.find((p) => p.slug === slug)
  ).filter((p): p is (typeof products)[number] => !!p);
  const featuredProducts =
    curatedProducts.length === HOMEPAGE_SHOP_SLUGS.length ? curatedProducts : products.slice(0, 3);

  return (
    <>
      <Hero
        tagline={settings.heroTagline}
        categories={settings.heroCategories}
        projectCount={activeProjectCount}
        featuredService={
          featuredService
            ? {
                title: featuredService.title,
                description: featuredService.description,
                href: `/services/${featuredService.slug}`,
              }
            : null
        }
      />
      <PortfolioSection projects={featuredProjects} />
      <StudioBand />
      <ShopSection products={featuredProducts} />
      <ContactSection />
    </>
  );
}
