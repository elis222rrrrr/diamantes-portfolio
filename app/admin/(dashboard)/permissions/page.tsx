import { requireSession } from "@/lib/auth/session";

const SECTIONS = [
  {
    label: "Dashboard",
    roles: "OWNER, ADMIN, EDITOR",
  },
  {
    label:
      "Bookings, Availability, Portfolio, Services, Products, Orders, Messages, Newsletter, Jobs, Backups, Login History, Hero, SEO, Settings, Media, Analytics",
    roles: "OWNER, ADMIN",
  },
  {
    label: "Users (create/edit accounts, change roles)",
    roles: "OWNER only",
  },
];

export default async function PermissionsPage() {
  await requireSession();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-light">Permissions</h1>
      <p className="mb-10 text-sm text-muted">
        A reference for what each role can currently access — derived from the access checks each
        admin page already enforces, not a separately configurable setting.
      </p>

      <div className="mb-10 border border-white/10">
        <ul className="flex flex-col divide-y divide-white/10">
          {SECTIONS.map((section) => (
            <li key={section.label} className="flex items-start justify-between gap-6 p-4">
              <p className="text-sm text-white/70">{section.label}</p>
              <p className="tracked-label shrink-0 text-right text-muted">{section.roles}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-muted">
        <strong className="text-white/70">EDITOR</strong> currently only reaches the Dashboard shell
        — no content-management sections are open to it yet. Change a specific page&apos;s access by
        editing its <code className="text-white/70">requireRole([...])</code> call.
      </p>
    </div>
  );
}
