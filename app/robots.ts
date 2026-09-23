import type { MetadataRoute } from "next";
import { SITE_URL as siteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cart", "/contact/book/manage", "/newsletter/unsubscribe"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
