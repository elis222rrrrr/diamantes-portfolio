import "server-only";

import { prisma } from "@/lib/prisma";

export function listActive() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

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

export function create(data: CreateServiceInput) {
  return prisma.service.create({ data });
}

export function update(id: string, data: Partial<CreateServiceInput & { isActive: boolean }>) {
  return prisma.service.update({ where: { id }, data });
}

export function remove(id: string) {
  return prisma.service.delete({ where: { id } });
}
