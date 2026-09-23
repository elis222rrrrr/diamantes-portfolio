import "server-only";

import { injectable } from "tsyringe";
import { enqueueJob } from "./repository";
import type { JobQueue } from "./interfaces";
import type { JobType, JobPayloadFor } from "./types";

/** Thin DI adapter — the Prisma logic itself stays in the plain repository.ts functions. */
@injectable()
export class PrismaJobQueue implements JobQueue {
  enqueue<T extends JobType>(type: T, payload: JobPayloadFor<T>): Promise<void> {
    return enqueueJob(type, payload);
  }
}
