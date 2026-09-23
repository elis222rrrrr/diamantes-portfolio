import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listAll } from "@/lib/portfolio/repository";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";
import { deleteProjectAction } from "./actions";

const GROUP_LABEL = {
  PERSONAL: "Personal Projects",
  COMMISSIONED: "Studio Projects",
} as const;

export default async function PortfolioAdminPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const projects = await listAll();

  return (
    <div className="max-w-3xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-light">Portfolio</h1>
          <p className="text-sm text-muted">Manage the projects shown on /portfolio.</p>
        </div>
        <LinkButton href="/admin/portfolio/new">New project</LinkButton>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">No projects yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => (
            <Card as="li" key={project.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">
                    {project.title}
                    {!project.isActive && (
                      <span className="tracked-label ml-2 text-muted">(inactive)</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {GROUP_LABEL[project.group]} · {project.category}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/admin/portfolio/${project.id}/edit`}
                    className="focus-ring tracked-label text-white/70 transition hover:text-white"
                  >
                    Edit
                  </Link>
                  <ConfirmSubmitButton
                    action={deleteProjectAction.bind(null, project.id)}
                    triggerLabel="Delete"
                    triggerClassName="focus-ring tracked-label text-white/70 transition hover:text-white"
                    title="Delete this project?"
                    message={`This will permanently delete "${project.title}".`}
                    confirmLabel="Delete project"
                  />
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
