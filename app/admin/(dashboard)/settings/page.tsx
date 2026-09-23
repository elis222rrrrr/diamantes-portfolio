import { requireRole } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings/repository";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-light">Settings</h1>
      <p className="mb-10 text-sm text-muted">
        Studio contact info and shipping configuration, used across the public site.
      </p>
      <SettingsForm settings={settings} />
    </div>
  );
}
