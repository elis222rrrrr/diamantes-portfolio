import "server-only";

import { prisma } from "@/lib/prisma";

export function recordBackup(data: {
  filename: string;
  sizeBytes: number;
  success: boolean;
  error?: string;
}) {
  return prisma.backupLog.create({ data });
}

export function listRecentBackups(limit: number) {
  return prisma.backupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function findLastSuccessfulBackup() {
  return prisma.backupLog.findFirst({
    where: { success: true },
    orderBy: { createdAt: "desc" },
  });
}
