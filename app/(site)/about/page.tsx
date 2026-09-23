import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import AboutSection from "@/components/AboutSection";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/seo/site";
import { safeJsonLd } from "@/lib/seo/json-ld";

export const metadata = buildMetadata({
  title: "About Us",
  description:
    "Diamantes Designs is a creative technology studio where engineering and artistic expression meet: CAD engineering, digital sculpting, and experimental design under one roof.",
  path: "/about",
});

// Person + WebSite — the one place on the site that names the designer
// behind the studio in structured data. worksFor ties her to the
// sitewide ProfessionalService entity (app/layout.tsx) so search/AI
// systems can merge "who is Elisavet Nithavrianaki" and "who is
// Diamantes 3Designs" into one entity instead of two unrelated names.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Elisavet Nithavrianaki",
  jobTitle: "Designer",
  worksFor: {
    "@type": "Organization",
    name: "Diamantes 3Designs",
    url: SITE_URL,
  },
  sameAs: [
    "https://www.instagram.com/diamantesdesigns/",
    "https://www.tiktok.com/@diamantes.designs",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Diamantes 3Designs",
  url: SITE_URL,
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "About Us", path: "/about" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }}
      />
      <AboutSection as="h1" />
    </>
  );
}
