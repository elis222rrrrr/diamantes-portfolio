import "server-only";

import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export function listAll() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export function findById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function countActiveOwners(excludingId?: string) {
  return prisma.user.count({
    where: {
      role: "OWNER",
      isActive: true,
      ...(excludingId ? { id: { not: excludingId } } : {}),
    },
  });
}

export type CreateUserInput = {
  name?: string;
  email: string;
  password: string;
  role: Role;
};

export async function create(data: CreateUserInput) {
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role },
  });
}

export function update(id: string, data: { name?: string; role?: Role; isActive?: boolean }) {
  return prisma.user.update({ where: { id }, data });
}
