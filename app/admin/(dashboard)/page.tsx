import { requireSession } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  const user = await requireSession();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-light">Dashboard</h1>
      <p className="text-sm text-white/60">
        Signed in as {user.email} ({user.role}).
      </p>
      <p className="mt-6 text-sm text-white/40">
        This is the Phase 1 foundation shell. Content management, media library, bookings, shop, and
        everything else land in later phases.
      </p>
    </div>
  );
}
