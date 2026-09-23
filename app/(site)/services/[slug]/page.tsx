import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { findBySlug } from "@/lib/services/repository";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import BracketLink from "@/components/ui/BracketLink";
import { buildMetadata } from "@/lib/seo/metadata";

type Example = { url: string; label: string; href?: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await findBySlug(slug);
  if (!service || !service.isActive) {
    return buildMetadata({
      title: "Service not found",
      description: "This service is no longer listed.",
      path: `/services/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: service.title,
    description: service.description,
    path: `/services/${service.slug}`,
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await findBySlug(slug);
  if (!service || !service.isActive) notFound();

  const examples = (Array.isArray(service.examples) ? service.examples : []).filter(
    (e): e is Example =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as Example).url === "string" &&
      typeof (e as Example).label === "string"
  );

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Studio", path: "/services" },
          { name: service.title, path: `/services/${service.slug}` },
        ]}
      />
      <section className="bg-black text-white">
        <div className="section-container">
          <Link
            href="/services"
            className="focus-ring tracked-label mb-10 inline-flex items-center gap-2 text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Studio
          </Link>

          {/* The /services list stays plain text (per feedback — these
              categories had no photo to anchor a tile to, so empty
              gradient boxes there read as broken imagery). This detail
              page is different: rather than naming specific projects in
              prose, real photos of past work in this category go here
              instead — proof by example, not a name-drop. */}
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <p className="tracked-label text-muted">
                <span style={{ color: "var(--focus-ring)" }}>[ 03 ]</span> STUDIO
              </p>
              <h1 className="section-heading mt-4">{service.title}</h1>
              <p className="mt-4 text-lg text-white/70">{service.description}</p>

              {service.details && (
                <p className="mt-8 max-w-xl text-sm leading-relaxed text-foreground">
                  {service.details}
                </p>
              )}

              <BracketLink
                href="/contact"
                className="group mt-12 inline-flex items-center gap-2 px-6 py-3"
              >
                Get in touch about this
                <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
              </BracketLink>
            </div>

            {examples.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {examples.map((example) => {
                  // Real proof-of-work photos, now actually linked to the
                  // project/product they're from — previously just static
                  // images with no path back to the page they illustrate.
                  const tile = (
                    <>
                      <div className="relative aspect-square w-full overflow-hidden bg-[#0a0a0c]">
                        <Image
                          src={example.url}
                          alt={example.label}
                          fill
                          className="object-contain transition group-hover:scale-[1.02]"
                          sizes="(min-width: 1024px) 320px, 45vw"
                          quality={90}
                        />
                      </div>
                      <p className="tracked-label mt-2 text-muted transition group-hover:text-white/70">
                        {example.label}
                      </p>
                    </>
                  );
                  return example.href ? (
                    <Link key={example.url} href={example.href} className="focus-ring group block">
                      {tile}
                    </Link>
                  ) : (
                    <div key={example.url}>{tile}</div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
