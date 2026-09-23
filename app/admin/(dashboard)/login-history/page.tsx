import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function LoginHistoryPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const attempts = await prisma.loginAttempt.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-light">Login History</h1>
      <p className="mb-10 text-sm text-muted">Most recent 100 login attempts, newest first.</p>

      {attempts.length === 0 ? (
        <p className="text-sm text-muted">No login attempts recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attempts.map((attempt) => (
            <li
              key={attempt.id}
              className="flex flex-col gap-1 border border-white/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`tracked-label ${attempt.success ? "text-green-400" : "text-red-400"}`}
                >
                  {attempt.success ? "Success" : "Failed"}
                </span>
                <span>{attempt.email}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>{attempt.ipAddress ?? "unknown IP"}</span>
                <span className="max-w-xs truncate" title={attempt.userAgent ?? undefined}>
                  {attempt.userAgent ?? "unknown device"}
                </span>
                <span>{attempt.createdAt.toISOString().slice(0, 19).replace("T", " ")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
