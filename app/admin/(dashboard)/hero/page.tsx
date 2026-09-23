import { requireRole } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings/repository";
import HeroForm from "./HeroForm";

export default async function HeroPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-light">Hero</h1>
      <p className="mb-10 text-sm text-muted">
        The homepage hero&apos;s tagline and category tags. The &quot;DIAMANTES DESIGNS&quot;
        heading itself is the brand name and isn&apos;t editable here.
      </p>
      <HeroForm settings={settings} />
    </div>
  );
}
