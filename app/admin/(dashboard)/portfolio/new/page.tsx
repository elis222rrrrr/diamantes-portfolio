import { requireRole } from "@/lib/auth/session";
import ProjectForm from "../ProjectForm";
import { createProjectAction } from "../actions";

export default async function NewProjectPage() {
  await requireRole(["OWNER", "ADMIN"]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">New project</h1>
      <ProjectForm action={createProjectAction} submitLabel="Create project" />
    </div>
  );
}
