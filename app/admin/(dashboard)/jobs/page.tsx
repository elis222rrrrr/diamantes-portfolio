import { requireRole } from "@/lib/auth/session";
import { countJobsByStatus, listFailedJobs } from "@/lib/jobs/repository";

export default async function JobsPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const [counts, failedJobs] = await Promise.all([countJobsByStatus(), listFailedJobs(50)]);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-light">Jobs</h1>
      <p className="mb-10 text-sm text-muted">
        Background job queue — booking confirmations, contact notifications, newsletter welcomes.
      </p>

      <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const).map((status) => (
          <div key={status} className="border border-white/10 px-4 py-3">
            <p className="tracked-label text-muted">{status}</p>
            <p className="mt-1 text-2xl font-light">{counts[status]}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-light">Failed jobs</h2>
      {failedJobs.length === 0 ? (
        <p className="text-sm text-muted">No failed jobs.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {failedJobs.map((job) => (
            <li key={job.id} className="border border-white/10 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span>{job.type}</span>
                <span className="tracked-label text-muted">
                  {job.attempts}/{job.maxAttempts} attempts
                </span>
              </div>
              {job.lastError && (
                <p className="mt-2 text-xs break-words text-red-400">{job.lastError}</p>
              )}
              <p className="mt-2 text-xs text-muted">
                {job.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
