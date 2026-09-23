import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listAll } from "@/lib/services/repository";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";
import { deleteServiceAction } from "./actions";

export default async function ServicesAdminPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const services = await listAll();

  return (
    <div className="max-w-3xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-light">Services</h1>
          <p className="text-sm text-muted">Manage the services shown sitewide.</p>
        </div>
        <LinkButton href="/admin/services/new">New service</LinkButton>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-muted">No services yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {services.map((service) => (
            <Card as="li" key={service.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">
                    {service.title}
                    {!service.isActive && (
                      <span className="tracked-label ml-2 text-muted">(inactive)</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{service.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/admin/services/${service.id}/edit`}
                    className="focus-ring tracked-label text-white/70 transition hover:text-white"
                  >
                    Edit
                  </Link>
                  <ConfirmSubmitButton
                    action={deleteServiceAction.bind(null, service.id)}
                    triggerLabel="Delete"
                    triggerClassName="focus-ring tracked-label text-white/70 transition hover:text-white"
                    title="Delete this service?"
                    message={`This will permanently delete "${service.title}".`}
                    confirmLabel="Delete service"
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
