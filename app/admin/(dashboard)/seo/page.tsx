import { requireRole } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings/repository";
import SeoForm from "./SeoForm";

export default async function SeoPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-light">SEO</h1>
      <p className="mb-10 text-sm text-muted">
        Default metadata and structured-data fields used sitewide.
      </p>
      <SeoForm settings={settings} />
    </div>
  );
}
