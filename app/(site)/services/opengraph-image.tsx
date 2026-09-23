import { buildOgImage, ogImageSize, ogImageContentType } from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return buildOgImage("Studio", "Concept to Production");
}
