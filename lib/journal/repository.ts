import "server-only";

import { prisma } from "@/lib/prisma";
import type { Article, ArticleStatus, Prisma } from "@prisma/client";
import { slugify } from "./slugify";
import { sanitizeArticleContent } from "./sanitize";

const ARTICLE_INCLUDE = { category: true, tags: true };

/** Articles visible to a site visitor: PUBLISHED, and not scheduled for the
 * future — a scheduled article (PUBLISHED with a future `publishedAt`) isn't
 * "promoted" by a sweep job, it's just excluded by this filter until its
 * time arrives. See the `Article` model's doc comment in schema.prisma. */
function publicVisibilityWhere(): Prisma.ArticleWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() } };
}

export type ArticleListFilters = {
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export async function listPublishedArticles(filters: ArticleListFilters = {}) {
  const { categorySlug, tagSlug, search, sort = "newest", page = 1, pageSize = 12 } = filters;

  const where: Prisma.ArticleWhereInput = {
    ...publicVisibilityWhere(),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { excerpt: { contains: search, mode: "insensitive" } },
            { subtitle: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: ARTICLE_INCLUDE,
      orderBy: { publishedAt: sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return { articles, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function findPublishedArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, ...publicVisibilityWhere() },
    include: ARTICLE_INCLUDE,
  });
}

export async function incrementViewCount(id: string): Promise<void> {
  await prisma.article.update({ where: { id }, data: { viewCount: { increment: 1 } } });
}

/** Same category first, then shared tags, then most recent — always excludes itself. */
export async function getRelatedArticles(article: Article, limit = 3) {
  const tags = await prisma.article
    .findUnique({ where: { id: article.id }, select: { tags: { select: { id: true } } } })
    .then((a) => a?.tags.map((t) => t.id) ?? []);

  const byCategory = article.categoryId
    ? await prisma.article.findMany({
        where: {
          ...publicVisibilityWhere(),
          categoryId: article.categoryId,
          id: { not: article.id },
        },
        include: ARTICLE_INCLUDE,
        orderBy: { publishedAt: "desc" },
        take: limit,
      })
    : [];

  if (byCategory.length >= limit) return byCategory;

  const excludeIds = [article.id, ...byCategory.map((a) => a.id)];
  const byTag =
    tags.length > 0
      ? await prisma.article.findMany({
          where: {
            ...publicVisibilityWhere(),
            id: { notIn: excludeIds },
            tags: { some: { id: { in: tags } } },
          },
          include: ARTICLE_INCLUDE,
          orderBy: { publishedAt: "desc" },
          take: limit - byCategory.length,
        })
      : [];

  if (byCategory.length + byTag.length >= limit) return [...byCategory, ...byTag];

  const excludeIds2 = [...excludeIds, ...byTag.map((a) => a.id)];
  const latest = await prisma.article.findMany({
    where: { ...publicVisibilityWhere(), id: { notIn: excludeIds2 } },
    include: ARTICLE_INCLUDE,
    orderBy: { publishedAt: "desc" },
    take: limit - byCategory.length - byTag.length,
  });

  return [...byCategory, ...byTag, ...latest];
}

export async function getAdjacentArticles(article: Article) {
  const [prev, next] = await Promise.all([
    prisma.article.findFirst({
      where: { ...publicVisibilityWhere(), publishedAt: { lt: article.publishedAt ?? new Date() } },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.article.findFirst({
      where: { ...publicVisibilityWhere(), publishedAt: { gt: article.publishedAt ?? new Date() } },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);
  return { prev, next };
}

export function getLatestArticles(limit = 5, excludeId?: string) {
  return prisma.article.findMany({
    where: { ...publicVisibilityWhere(), ...(excludeId ? { id: { not: excludeId } } : {}) },
    include: ARTICLE_INCLUDE,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export function listPublicCategories() {
  return prisma.journalCategory.findMany({ orderBy: { name: "asc" } });
}

export function listPublicTags() {
  return prisma.journalTag.findMany({ orderBy: { name: "asc" } });
}

// --- Admin ---

export type AdminArticleFilters = { status?: ArticleStatus; categoryId?: string; search?: string };

export function listAllArticlesAdmin(filters: AdminArticleFilters = {}) {
  const { status, categoryId, search } = filters;
  return prisma.article.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
    },
    include: ARTICLE_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export function findArticleById(id: string) {
  return prisma.article.findUnique({ where: { id }, include: ARTICLE_INCLUDE });
}

export type ArticleInput = {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content: string;
  status: ArticleStatus;
  publishedAt?: Date | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  featuredImageCaption?: string | null;
  authorName?: string | null;
  categoryId?: string | null;
  tagNames: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImageUrl?: string | null;
  focusKeyword?: string | null;
};

function tagConnectOrCreate(tagNames: string[]) {
  const clean = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];
  return clean.map((name) => ({
    where: { name },
    create: { name, slug: slugify(name) },
  }));
}

export async function createArticle(input: ArticleInput) {
  const { tagNames, content, ...rest } = input;
  return prisma.article.create({
    data: {
      ...rest,
      content: sanitizeArticleContent(content),
      tags: { connectOrCreate: tagConnectOrCreate(tagNames) },
    },
    include: ARTICLE_INCLUDE,
  });
}

export async function updateArticle(id: string, input: ArticleInput) {
  const { tagNames, content, ...rest } = input;
  return prisma.article.update({
    where: { id },
    data: {
      ...rest,
      content: sanitizeArticleContent(content),
      tags: { set: [], connectOrCreate: tagConnectOrCreate(tagNames) },
    },
    include: ARTICLE_INCLUDE,
  });
}

export async function deleteArticle(id: string): Promise<void> {
  await prisma.article.delete({ where: { id } });
}

/** Copies every field except id/slug/status/publishedAt/viewCount — the
 * duplicate always starts as an untitled draft, never inherits the
 * original's publish state or view count. */
export async function duplicateArticle(id: string) {
  const original = await prisma.article.findUnique({ where: { id }, include: ARTICLE_INCLUDE });
  if (!original) return null;

  let slug = `${original.slug}-copy`;
  let suffix = 2;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${original.slug}-copy-${suffix}`;
    suffix += 1;
  }

  return prisma.article.create({
    data: {
      slug,
      title: `${original.title} (Copy)`,
      subtitle: original.subtitle,
      excerpt: original.excerpt,
      content: original.content,
      status: "DRAFT",
      featuredImageUrl: original.featuredImageUrl,
      featuredImageAlt: original.featuredImageAlt,
      featuredImageCaption: original.featuredImageCaption,
      authorName: original.authorName,
      categoryId: original.categoryId,
      seoTitle: original.seoTitle,
      metaDescription: original.metaDescription,
      canonicalUrl: original.canonicalUrl,
      ogImageUrl: original.ogImageUrl,
      focusKeyword: original.focusKeyword,
      tags: { connect: original.tags.map((t) => ({ id: t.id })) },
    },
    include: ARTICLE_INCLUDE,
  });
}

export async function getDashboardStats() {
  const now = new Date();
  const [total, draft, published, archived, scheduled, totalViewsAgg, mostViewed, categories] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.article.count({ where: { status: "PUBLISHED", publishedAt: { lte: now } } }),
      prisma.article.count({ where: { status: "ARCHIVED" } }),
      prisma.article.count({ where: { status: "PUBLISHED", publishedAt: { gt: now } } }),
      prisma.article.aggregate({ _sum: { viewCount: true } }),
      prisma.article.findMany({
        orderBy: { viewCount: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, viewCount: true },
      }),
      prisma.journalCategory.findMany({
        select: { name: true, slug: true, _count: { select: { articles: true } } },
        orderBy: { articles: { _count: "desc" } },
        take: 5,
      }),
    ]);

  return {
    total,
    draft,
    published,
    archived,
    scheduled,
    totalViews: totalViewsAgg._sum.viewCount ?? 0,
    mostViewed,
    topCategories: categories,
  };
}

// --- Categories ---

export function listAllCategories() {
  return prisma.journalCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
}

export function createCategory(name: string) {
  return prisma.journalCategory.create({ data: { name, slug: slugify(name) } });
}

export function updateCategory(id: string, name: string) {
  return prisma.journalCategory.update({ where: { id }, data: { name, slug: slugify(name) } });
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.journalCategory.delete({ where: { id } });
}

// --- Tags ---

export function listAllTags() {
  return prisma.journalTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
}

export function createTag(name: string) {
  return prisma.journalTag.create({ data: { name, slug: slugify(name) } });
}

export function updateTag(id: string, name: string) {
  return prisma.journalTag.update({ where: { id }, data: { name, slug: slugify(name) } });
}

export async function deleteTag(id: string): Promise<void> {
  await prisma.journalTag.delete({ where: { id } });
}
