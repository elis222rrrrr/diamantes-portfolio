import { requireRole } from "@/lib/auth/session";
import ServiceForm from "../ServiceForm";
import { createServiceAction } from "../actions";

export default async function NewServicePage() {
  await requireRole(["OWNER", "ADMIN"]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light">New service</h1>
      <ServiceForm action={createServiceAction} submitLabel="Create service" />
    </div>
  );
}
