import "server-only";

import type { JobType, JobPayloadFor } from "./types";

export interface JobQueue {
  enqueue<T extends JobType>(type: T, payload: JobPayloadFor<T>): Promise<void>;
}
