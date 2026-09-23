import { SITE_URL } from "@/lib/seo/site";
import { safeJsonLd } from "@/lib/seo/json-ld";

type Props = {
  project: {
    title: string;
    category: string;
    imageUrl: string | null;
    slug: string;
  };
};

/** schema.org CreativeWork for a portfolio project — pulled entirely from
 * fields the PortfolioProject record already has (no new data entry).
 * dateCreated is deliberately omitted: the schema doesn't track a real
 * project date, and guessing one would be exactly the kind of
 * unverifiable claim this site avoids elsewhere. */
export default function CreativeWorkSchema({ project }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    creator: { "@type": "Person", name: "Elisavet Nithavrianaki" },
    about: project.category,
    url: `${SITE_URL}/portfolio/${project.slug}`,
    ...(project.imageUrl ? { image: project.imageUrl } : {}),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
  );
}
