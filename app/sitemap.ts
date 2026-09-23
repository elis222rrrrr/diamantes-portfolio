import type { MetadataRoute } from "next";
import { SITE_URL as siteUrl } from "@/lib/seo/site";
import { prisma } from "@/lib/prisma";

/** Journal articles are the one part of this sitemap that's actually
 * DB-driven — every other route is static, but "automatic sitemap
 * generation" for the Journal specifically means new articles need to show
 * up here with no code change. */
async function journalEntries(): Promise<MetadataRoute.Sitemap> {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: { slug: true, updatedAt: true },
  });

  return articles.map((article) => ({
    url: `${siteUrl}/journal/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

/** Individual product pages — previously absent from this sitemap
 * entirely, so every shop item depended on internal links alone to ever
 * get crawled/indexed. Priority sits above the /shop listing itself:
 * these are the pages that actually convert. */
async function shopEntries(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  return products.map((product) => ({
    url: `${siteUrl}/shop/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));
}

async function portfolioEntries(): Promise<MetadataRoute.Sitemap> {
  const projects = await prisma.portfolioProject.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  return projects.map((project) => ({
    url: `${siteUrl}/portfolio/${project.slug}`,
    lastModified: project.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}

async function serviceEntries(): Promise<MetadataRoute.Sitemap> {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  return services.map((service) => ({
    url: `${siteUrl}/services/${service.slug}`,
    lastModified: service.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const [shop, portfolio, services, journal] = await Promise.all([
    shopEntries(),
    portfolioEntries(),
    serviceEntries(),
    journalEntries(),
  ]);

  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/shop`, lastModified, changeFrequency: "daily", priority: 0.9 },
    ...shop,
    { url: `${siteUrl}/portfolio`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...portfolio,
    { url: `${siteUrl}/services`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    ...services,
    { url: `${siteUrl}/journal`, lastModified, changeFrequency: "daily", priority: 0.8 },
    ...journal,
    { url: `${siteUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/contact/email`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/contact/book`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
