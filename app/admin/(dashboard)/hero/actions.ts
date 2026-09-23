"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import { updateSiteSettings } from "@/lib/settings/repository";
import { recordAudit } from "@/lib/audit/repository";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const heroSchema = z.object({
  heroTagline: z.string().trim().min(1).max(200),
  heroCategories: z.array(z.string().trim().min(1).max(50)).max(20),
});

export type ActionState = { error: string } | null;

export async function updateHeroAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  let heroCategories: unknown;
  try {
    heroCategories = JSON.parse((formData.get("heroCategories") as string | null) ?? "[]");
  } catch {
    return { error: "Invalid form submission." };
  }

  const parsed = heroSchema.safeParse({
    heroTagline: formData.get("heroTagline"),
    heroCategories,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await updateSiteSettings(parsed.data);
  await recordAudit({ actorId: user.id, action: "settings.hero_updated" });
  revalidatePath("/admin/hero");
  revalidatePath("/");
  return null;
}
