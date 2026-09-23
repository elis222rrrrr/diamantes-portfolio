import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ProjectCardModelPreview from "@/components/ProjectCardModelPreviewLoader";
import PortfolioModelPreloader from "@/components/PortfolioModelPreloaderLoader";

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  accent: string;
  imageUrl?: string | null;
  modelUrl?: string | null;
  modelTint?: string | null;
};

type Props = {
  projects: Project[];
};

export default function ProjectGrid({ projects }: Props) {
  const modelUrls = projects.map((p) => p.modelUrl).filter((url): url is string => Boolean(url));

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
      <PortfolioModelPreloader urls={modelUrls} />
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/portfolio/${project.slug}`}
          className="focus-ring group block"
        >
          {/* Plain white, not the shared .card-gradient (still used as-is
              by Services/Journal/Cart) — per feedback, Portfolio's own
              gradient-fallback tiles read as a plain white card instead of
              each project's accent-color gradient. */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ffffff]">
            {project.imageUrl ? (
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                className={
                  // Logo marks (e.g. Letrion AI) get cropped/zoomed by
                  // object-cover on this 4:5 portrait frame, since the mark
                  // itself is closer to square — object-contain shows the
                  // whole logo, smaller within the frame, instead.
                  project.category === "Website Logo Design"
                    ? "object-contain p-10 transition duration-500 group-hover:scale-[1.03]"
                    : "object-cover transition duration-500 group-hover:scale-[1.03]"
                }
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                quality={90}
              />
            ) : project.modelUrl ? (
              // A .glb with no card image (e.g. "CEO Assistant") gets a
              // live, spinning 3D preview instead of the plain gradient, so
              // the model reads as alive before a visitor clicks through.
              <ProjectCardModelPreview
                url={project.modelUrl}
                tint={project.modelTint ?? undefined}
              />
            ) : null}
            <ArrowUpRight
              size={18}
              className="absolute right-4 top-4 text-black/30 transition group-hover:text-black"
            />
          </div>

          {/* No border-t divider — the tile floats on the page background
              instead of sitting in a bordered box, per feedback. */}
          {/* flex-wrap + a guaranteed gap: a long title ("Femmes In Arts
              Keychain") plus its category could add up to wider than the
              card at 3-up desktop width, and justify-between alone doesn't
              add space it doesn't have — the category was sitting flush
              against the title instead of wrapping to its own line. */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 pt-4">
            <span className="text-sm">{project.title}</span>
            <span className="tracked-label text-muted">{project.category}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
