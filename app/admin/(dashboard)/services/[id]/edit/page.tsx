import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { findById } from "@/lib/services/repository";
import ServiceForm from "../../ServiceForm";
import { updateServiceAction } from "../../actions";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["OWNER", "ADMIN"]);
  const { id } = await params;

  const service = await findById(id);
  if (!service) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">Edit service</h1>
      <ServiceForm
        action={updateServiceAction.bind(null, id)}
        service={service}
        submitLabel="Save changes"
      />
    </div>
  );
}
