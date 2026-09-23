import { requireRole } from "@/lib/auth/session";
import { listRecentBackups } from "@/lib/backup/repository";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(1)} ${units[exponent]}`;
}

export default async function BackupsPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const backups = await listRecentBackups(50);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-light">Backups</h1>
      <p className="mb-10 text-sm text-muted">
        Automated database backups — runs once daily, uploaded to S3.
      </p>

      {backups.length === 0 ? (
        <p className="text-sm text-muted">No backups recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {backups.map((backup) => (
            <li key={backup.id} className="border border-white/10 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`tracked-label ${backup.success ? "text-green-400" : "text-red-400"}`}
                >
                  {backup.success ? "Success" : "Failed"}
                </span>
                <span className="tracked-label text-muted">{formatBytes(backup.sizeBytes)}</span>
              </div>
              <p className="mt-2 text-white/70">{backup.filename}</p>
              {backup.error && (
                <p className="mt-2 break-words text-xs text-red-400">{backup.error}</p>
              )}
              <p className="mt-2 text-xs text-muted">
                {backup.createdAt.toISOString().slice(0, 19).replace("T", " ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
