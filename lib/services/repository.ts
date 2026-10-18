import "server-only";

import { prisma } from "@/lib/prisma";
import { cachePublicContent, invalidatePublicContent } from "@/lib/cache/public-content";

export function listActive() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

/** listActive() for the homepage, cached — see lib/cache/public-content.ts. */
export const listActiveCached = cachePublicContent(listActive, "services-active");

export function listAll() {
  return prisma.service.findMany({ orderBy: { order: "asc" } });
}

export function findById(id: string) {
  return prisma.service.findUnique({ where: { id } });
}

export function findBySlug(slug: string) {
  return prisma.service.findUnique({ where: { slug } });
}

export type CreateServiceInput = {
  slug: string;
  title: string;
  description: string;
  details?: string;
  examples?: { url: string; label: string }[];
  accent: string;
  order?: number;
};

export async function create(data: CreateServiceInput) {
  const service = await prisma.service.create({ data });
  invalidatePublicContent();
  return service;
}

export async function update(
  id: string,
  data: Partial<CreateServiceInput & { isActive: boolean }>
) {
  const service = await prisma.service.update({ where: { id }, data });
  invalidatePublicContent();
  return service;
}

export async function remove(id: string) {
  const service = await prisma.service.delete({ where: { id } });
  invalidatePublicContent();
  return service;
}
