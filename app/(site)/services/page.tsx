import ServicesSection from "@/components/ServicesSection";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { listActive } from "@/lib/services/repository";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Studio",
  description:
    "3D fashion, engineering, product design, and digital fabrication work from Diamantes 3Designs — open to creative collaborations, concept to production.",
  path: "/services",
});

export default async function ServicesPage() {
  const services = await listActive();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Studio", path: "/services" },
        ]}
      />
      {/* No ServiceSchema (JSON-LD "ProfessionalService" structured data)
          here — that's a formal, machine-readable declaration of licensed
          commercial services to search engines, and this business doesn't
          currently hold the license for commissioned/custom design work,
          only the retail shop (per feedback). The component file itself
          is untouched — reinstate this once that's sorted. */}
      <ServicesSection as="h1" services={services} />
    </>
  );
}
