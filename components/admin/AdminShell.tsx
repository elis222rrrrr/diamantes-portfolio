import type { SessionUser } from "@/lib/auth/session";
import { logout } from "@/app/admin/(dashboard)/logout/actions";
import AdminMobileNav from "./AdminMobileNav";

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

const navGroups = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/admin" }],
  },
  {
    label: "Content",
    items: [
      { label: "Journal", href: "/admin/journal" },
      { label: "Journal Categories", href: "/admin/journal/categories" },
      { label: "Journal Tags", href: "/admin/journal/tags" },
      { label: "Portfolio", href: "/admin/portfolio" },
      { label: "Services", href: "/admin/services" },
      { label: "Hero", href: "/admin/hero" },
      { label: "SEO", href: "/admin/seo" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Products", href: "/admin/products" },
      { label: "Orders", href: "/admin/orders" },
    ],
  },
  {
    label: "Bookings",
    items: [
      { label: "Bookings", href: "/admin/bookings" },
      { label: "Availability", href: "/admin/availability" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/admin/messages" },
      { label: "Newsletter", href: "/admin/newsletter" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Jobs", href: "/admin/jobs" },
      { label: "Backups", href: "/admin/backups" },
      { label: "Login History", href: "/admin/login-history" },
      { label: "Media", href: "/admin/media" },
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Users", href: "/admin/users" },
      { label: "Permissions", href: "/admin/permissions" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
];

export default function AdminShell({ user, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white lg:flex-row">
      <AdminMobileNav
        navGroups={navGroups}
        userLabel={user.name ?? user.email}
        userRole={user.role}
        logout={logout}
      />

      <aside className="hidden w-56 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/10 p-6 lg:flex">
        <div>
          <p className="tracked-label mb-8 text-muted">Diamantes 3Designs</p>
          <nav className="flex flex-col gap-6">
            {navGroups.map((group) => (
              <div key={group.label ?? "root"}>
                {group.label && <p className="tracked-label mb-2 text-muted">{group.label}</p>}
                <div className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="focus-ring text-sm text-white/70 transition hover:text-white"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-6">
          <p className="text-sm">{user.name ?? user.email}</p>
          <p className="tracked-label mb-4 text-muted">{user.role}</p>
          <form action={logout}>
            <button
              type="submit"
              className="focus-ring tracked-label text-muted transition hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
