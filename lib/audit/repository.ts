import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function recordAudit(data: {
  actorId?: string | null;
  action: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({ data });
}

export function listRecentAudits(limit: number) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
