import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { findBySlug } from "@/lib/portfolio/repository";
import { isToolId, type ToolId } from "@/lib/portfolio/tools";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import CreativeWorkSchema from "@/components/CreativeWorkSchema";
import ProductGallery from "@/components/ProductGallery";
import PortfolioModelViewer from "@/components/PortfolioModelViewerLoader";
import ToolIcon from "@/components/ToolIcon";
import BracketLink from "@/components/ui/BracketLink";
import { buildMetadata } from "@/lib/seo/metadata";
import { highlightTerms } from "@/lib/text/highlightTerms";

export const dynamic = "force-dynamic";

const GROUP_LABELS = {
  PERSONAL: "Personal Project",
  COMMISSIONED: "Studio Project",
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await findBySlug(slug);
  if (!project || !project.isActive) {
    return buildMetadata({
      title: "Project not found",
      description: "This project is no longer available.",
      path: `/portfolio/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: project.title,
    description: `${project.category}. ${GROUP_LABELS[project.group]} from Diamantes 3Designs.`,
    path: `/portfolio/${project.slug}`,
  });
}

export default async function PortfolioProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await findBySlug(slug);
  if (!project || !project.isActive) notFound();

  const galleryImages = [
    project.imageUrl,
    ...(Array.isArray(project.images) ? (project.images as string[]) : []),
  ]
    .filter((url): url is string => typeof url === "string" && url.length > 0)
    .map((url) => ({ url }));

  const downloads = Array.isArray(project.downloads)
    ? (project.downloads as { url: string; label: string }[])
    : [];

  const tools = (Array.isArray(project.tools) ? project.tools : []).filter(
    (tool): tool is ToolId => typeof tool === "string" && isToolId(tool)
  );

  // A project with no gallery photos (e.g. ceo-assistant, which only has a
  // .glb) would otherwise show an empty gradient placeholder in the main
  // slot while its 3D viewer sat small and secondary under the text — make
  // the viewer the primary visual instead in that case. Projects that do
  // have real photos keep the gallery as primary, with the viewer as a
  // secondary "see it in 3D" extra underneath the text.
  const hasGalleryImages = galleryImages.length > 0;
  const showModelAsMain = !hasGalleryImages && !!project.modelUrl;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Portfolio", path: "/portfolio" },
          { name: project.title, path: `/portfolio/${project.slug}` },
        ]}
      />
      <CreativeWorkSchema project={project} />
      <section className="force-light">
        <div className="section-container">
          <Link
            href="/portfolio"
            className="focus-ring tracked-label mb-10 inline-flex items-center gap-2 text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Portfolio
          </Link>

          <div className="grid gap-10 lg:grid-cols-2">
            {showModelAsMain ? (
              <div>
                <PortfolioModelViewer
                  url={project.modelUrl!}
                  tint={project.modelTint ?? undefined}
                />
                <p className="tracked-label mt-3 text-white/50">Drag to rotate, scroll to zoom</p>
              </div>
            ) : (
              // The render-animation video (if any) is folded in as the
              // gallery's first slide, so it's the first thing a visitor
              // sees on page load — the still renders follow after it,
              // rather than sitting in a separate block off to the side.
              // website-hero-animation is the one exception: its cover
              // photo leads instead, with the clip after it, per feedback.
              <ProductGallery
                images={galleryImages}
                alt={project.title}
                video={
                  project.videoUrl
                    ? { url: project.videoUrl, label: "Render Animation" }
                    : undefined
                }
                videoFirst={project.slug !== "website-hero-animation"}
              />
            )}

            <div className="flex flex-col justify-center">
              <p className="tracked-label mb-3 text-muted">{GROUP_LABELS[project.group]}</p>
              <div className="mb-6 flex items-center gap-3">
                {/* No title icon here anymore (per feedback) — it used to
                    squeeze galleryImages[0] into a ~24px brightness-0
                    silhouette, which for some pieces (e.g. Letrion AI)
                    rendered as an unrecognizable black rectangle rather
                    than a legible mark. */}
                <h1 className="text-lg font-semibold">{project.title}</h1>
              </div>
              <p className="mb-6 text-sm text-white/70">{project.category}</p>

              {project.description && (
                <p className="mb-10 max-w-md text-sm leading-snug text-foreground">
                  {highlightTerms(project.description, [project.title])}
                </p>
              )}

              {tools.length > 0 && (
                <div className="mb-10">
                  <p className="tracked-label mb-3 text-muted">Software Used</p>
                  <div className="flex items-center gap-3">
                    {tools.map((tool) => (
                      <ToolIcon key={tool} tool={tool} />
                    ))}
                  </div>
                </div>
              )}

              {/* Only reachable when showModelAsMain is true and the project
                  also has a video — the video's normal home is the gallery
                  above, this is just a fallback so a future project with
                  both a model-only main slot and a video doesn't silently
                  lose that video. No current project hits this. */}
              {project.videoUrl && showModelAsMain && (
                <video
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="mb-8 w-full border border-white/10"
                  src={project.videoUrl}
                />
              )}

              {project.modelUrl && !showModelAsMain && (
                <div className="mb-8">
                  <PortfolioModelViewer
                    url={project.modelUrl}
                    tint={project.modelTint ?? undefined}
                  />
                  <p className="tracked-label mt-3 text-white/50">Drag to rotate, scroll to zoom</p>
                </div>
              )}

              {downloads.length > 0 && (
                <div className="flex flex-col gap-3">
                  {downloads.map((file) => (
                    <BracketLink
                      key={file.url}
                      href={file.url}
                      download
                      className="tracked-label inline-flex items-center gap-2 px-4 py-3"
                    >
                      <Download size={14} />
                      {file.label}
                    </BracketLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
