import "server-only";

import { Prisma, JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jobPayloadSchemas, type JobType, type JobPayloadFor } from "./types";

export type JobRow = {
  id: string;
  type: string;
  payload: Prisma.JsonValue;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  runAt: Date;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function enqueueJob<T extends JobType>(
  type: T,
  payload: JobPayloadFor<T>,
  opts: { runAt?: Date } = {}
): Promise<void> {
  const validated = jobPayloadSchemas[type].parse(payload);
  await prisma.job.create({
    data: {
      type,
      payload: validated as Prisma.InputJsonValue,
      runAt: opts.runAt ?? new Date(),
    },
  });
}

/**
 * Atomically claims up to `limit` due jobs in a single statement — the row
 * locks taken by the inner SELECT ... FOR UPDATE SKIP LOCKED are held only
 * for this statement's duration, long enough to flip them to PROCESSING.
 * Two overlapping callers (e.g. the in-process interval and a manual trigger
 * firing at once) can never claim the same row, with no separate transaction
 * wrapper needed.
 */
export async function claimBatch(limit: number): Promise<JobRow[]> {
  return prisma.$queryRaw<JobRow[]>`
    UPDATE "Job"
    SET status = 'PROCESSING', attempts = attempts + 1, "updatedAt" = now()
    WHERE id IN (
      SELECT id FROM "Job"
      WHERE status = 'PENDING' AND "runAt" <= now()
      ORDER BY "runAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, type, payload, status, attempts, "maxAttempts", "runAt", "lastError", "createdAt", "updatedAt"
  `;
}

export async function markCompleted(id: string): Promise<void> {
  await prisma.job.update({
    where: { id },
    data: { status: JobStatus.COMPLETED, lastError: null },
  });
}

/** `nextRunAt: null` means attempts have hit maxAttempts — the job stays terminally FAILED. */
export async function markFailed(id: string, error: string, nextRunAt: Date | null): Promise<void> {
  await prisma.job.update({
    where: { id },
    data: {
      status: nextRunAt ? JobStatus.PENDING : JobStatus.FAILED,
      runAt: nextRunAt ?? undefined,
      lastError: error,
    },
  });
}

export async function countJobsByStatus(): Promise<Record<JobStatus, number>> {
  const groups = await prisma.job.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<JobStatus, number> = {
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    FAILED: 0,
  };
  for (const group of groups) {
    counts[group.status] = group._count._all;
  }
  return counts;
}

export function listFailedJobs(limit: number) {
  return prisma.job.findMany({
    where: { status: JobStatus.FAILED },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
