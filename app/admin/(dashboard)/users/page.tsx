import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listAll } from "@/lib/users/repository";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";

export default async function UsersPage() {
  await requireRole(["OWNER"]);
  const users = await listAll();

  return (
    <div className="max-w-3xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-light">Users</h1>
          <p className="text-sm text-muted">
            Admin panel accounts. Only OWNER can manage users and roles.
          </p>
        </div>
        <LinkButton href="/admin/users/new">New user</LinkButton>
      </div>

      <ul className="flex flex-col gap-3">
        {users.map((user) => (
          <Card as="li" key={user.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm">
                  {user.name ?? user.email}
                  {!user.isActive && (
                    <span className="tracked-label ml-2 text-muted">(inactive)</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-white/70">{user.email}</p>
                <p className="tracked-label mt-1 text-muted">{user.role}</p>
              </div>
              <Link
                href={`/admin/users/${user.id}/edit`}
                className="focus-ring tracked-label text-white/70 transition hover:text-white"
              >
                Edit
              </Link>
            </div>
          </Card>
        ))}
      </ul>
    </div>
  );
}
