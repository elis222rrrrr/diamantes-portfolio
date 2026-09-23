import { SITE_URL } from "@/lib/seo/site";
import { safeJsonLd } from "@/lib/seo/json-ld";

type Service = { title: string; description: string };

type Props = {
  services: Service[];
};

export default function ServiceSchema({ services }: Props) {
  const jsonLd = services.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: {
      "@type": "ProfessionalService",
      name: "Diamantes 3Designs",
      url: SITE_URL,
    },
    areaServed: "Worldwide",
  }));

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
  );
}
