import "server-only";

import { prisma } from "@/lib/prisma";
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

export function create(data: CreatePortfolioProjectInput) {
  return prisma.portfolioProject.create({ data });
}

export function update(
  id: string,
  data: Partial<CreatePortfolioProjectInput & { isActive: boolean }>
) {
  return prisma.portfolioProject.update({ where: { id }, data });
}

export function remove(id: string) {
  return prisma.portfolioProject.delete({ where: { id } });
}
