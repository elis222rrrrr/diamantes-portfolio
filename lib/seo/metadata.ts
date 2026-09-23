import type { Metadata } from "next";
import { SITE_URL } from "./site";

const SITE_NAME = "Diamantes 3Designs";

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Blocks indexing — for tokenized/gated pages that already sit behind robots.txt disallow. */
  noIndex?: boolean;
};

/**
 * Next only applies the root layout's title.template to `metadata.title`,
 * not to `openGraph.title`/`twitter.title` — those are otherwise inherited
 * verbatim from the layout when a page doesn't set `openGraph` itself
 * (confirmed against node_modules/next/dist/docs/.../generate-metadata.md's
 * "Inheriting fields" section). Every page must set these explicitly or its
 * canonical/social tags silently point at the homepage.
 */
export function buildMetadata({ title, description, path, noIndex }: BuildMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
