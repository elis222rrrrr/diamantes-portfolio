import "server-only";

import { claimBatch, markCompleted, markFailed } from "./repository";
import { getProcessor } from "./processors";

const BACKOFF_STEP_MS = 60_000;
const BACKOFF_MAX_MS = 30 * 60_000;

function nextBackoff(attempts: number): Date {
  return new Date(Date.now() + Math.min(attempts * BACKOFF_STEP_MS, BACKOFF_MAX_MS));
}

/** Claims and processes up to `limit` due jobs. Shared by the after() fast path, the in-process interval, and the manual trigger route. */
export async function runJobWorker(limit = 10): Promise<void> {
  const jobs = await claimBatch(limit);

  for (const job of jobs) {
    const processor = getProcessor(job.type);
    if (!processor) {
      await markFailed(job.id, `Unknown job type: ${job.type}`, null);
      continue;
    }

    try {
      await processor(job.payload);
      await markCompleted(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const hasAttemptsLeft = job.attempts < job.maxAttempts;
      await markFailed(job.id, message, hasAttemptsLeft ? nextBackoff(job.attempts) : null);
    }
  }
}
