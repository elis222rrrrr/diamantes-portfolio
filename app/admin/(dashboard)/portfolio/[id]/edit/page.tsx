import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { findById } from "@/lib/portfolio/repository";
import ProjectForm from "../../ProjectForm";
import { updateProjectAction } from "../../actions";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["OWNER", "ADMIN"]);
  const { id } = await params;

  const project = await findById(id);
  if (!project) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">Edit project</h1>
      <ProjectForm
        action={updateProjectAction.bind(null, id)}
        project={project}
        submitLabel="Save changes"
      />
    </div>
  );
}
