import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import ProjectGrid from "@/components/ProjectGrid";
import PortfolioHero from "@/components/PortfolioHero";
import { listActiveByGroup, findBySlug } from "@/lib/portfolio/repository";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Portfolio",
  description:
    "Selected work from Diamantes 3Designs: 3D fashion, experimental parametric forms, and engineering projects.",
  path: "/portfolio",
});

// The project whose lookbook drives the Portfolio page's hero carousel —
// swap this to feature a different project without touching layout code.
const HERO_PROJECT_SLUG = "undefined-waves";

export default async function PortfolioPage() {
  // No Personal Projects grid section anymore, per feedback — Undefined
  // Waves (the one PERSONAL-group project) stays live only as the hero
  // carousel above, fetched separately via HERO_PROJECT_SLUG, so the
  // PERSONAL group is never queried for the grid here at all.
  const [commissionedProjects, heroProject] = await Promise.all([
    listActiveByGroup("COMMISSIONED"),
    findBySlug(HERO_PROJECT_SLUG),
  ]);

  const heroImages = heroProject
    ? [
        heroProject.imageUrl,
        ...(Array.isArray(heroProject.images) ? heroProject.images : []),
      ].filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Portfolio", path: "/portfolio" },
        ]}
      />

      <section className="bg-black text-white">
        <div className="section-container">
          {/* Falls back to a plain heading if the featured project is ever
              renamed/deactivated, rather than a hero with no images. */}
          {heroProject && heroImages.length > 0 ? (
            <div className="mb-20 lg:mb-28">
              <PortfolioHero
                project={{
                  slug: heroProject.slug,
                  title: heroProject.title,
                  category: heroProject.category,
                  images: heroImages,
                }}
              />
            </div>
          ) : (
            <div className="mb-14">
              <h1 className="section-heading">Portfolio</h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Exploring the intersection of technology, materials and form. Selected work from our
                studio.
              </p>
            </div>
          )}

          {commissionedProjects.length > 0 && (
            <div>
              <h2 className="mb-6 text-lg font-light">Studio Projects</h2>
              <ProjectGrid projects={commissionedProjects} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
