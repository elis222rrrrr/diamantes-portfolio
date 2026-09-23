import { buildOgImage, ogImageSize, ogImageContentType } from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return buildOgImage("Let's Talk", "Email × Book a Call");
}
