import "server-only";

import { prisma } from "@/lib/prisma";
import { cachePublicContent, invalidatePublicContent } from "@/lib/cache/public-content";
import type { ToolId } from "@/lib/portfolio/tools";

export function listActiveByGroup(group: "PERSONAL" | "COMMISSIONED") {
  return prisma.portfolioProject.findMany({
    where: { group, isActive: true },
    orderBy: { order: "asc" },
  });
}

export function listAll() {
  return prisma.portfolioProject.findMany({
    orderBy: [{ group: "asc" }, { order: "asc" }],
  });
}

/** listAll() for the homepage, cached — see lib/cache/public-content.ts. */
export const listAllCached = cachePublicContent(listAll, "portfolio-all");

export function findById(id: string) {
  return prisma.portfolioProject.findUnique({ where: { id } });
}

export function findBySlug(slug: string) {
  return prisma.portfolioProject.findUnique({ where: { slug } });
}

export type PortfolioDownload = { url: string; label: string };

export type CreatePortfolioProjectInput = {
  slug: string;
  title: string;
  category: string;
  description?: string | null;
  group: "PERSONAL" | "COMMISSIONED";
  accent: string;
  imageUrl?: string | null;
  images?: string[];
  videoUrl?: string | null;
  modelUrl?: string | null;
  modelTint?: string | null;
  downloads?: PortfolioDownload[];
  tools?: ToolId[];
  order?: number;
};

export async function create(data: CreatePortfolioProjectInput) {
  const project = await prisma.portfolioProject.create({ data });
  invalidatePublicContent();
  return project;
}

export async function update(
  id: string,
  data: Partial<CreatePortfolioProjectInput & { isActive: boolean }>
) {
  const project = await prisma.portfolioProject.update({ where: { id }, data });
  invalidatePublicContent();
  return project;
}

export async function remove(id: string) {
  const project = await prisma.portfolioProject.delete({ where: { id } });
  invalidatePublicContent();
  return project;
}
