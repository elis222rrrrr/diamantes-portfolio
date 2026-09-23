"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import { updateSiteSettings } from "@/lib/settings/repository";
import { recordAudit } from "@/lib/audit/repository";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const tagListSchema = z.array(z.string().trim().min(1).max(100)).max(50);

const seoSchema = z.object({
  seoDefaultTitle: z.string().trim().min(1).max(200),
  seoDefaultDescription: z.string().trim().min(1).max(500),
  areaServed: z.string().trim().min(1).max(100),
  seoKeywords: tagListSchema,
  seoKnowsAbout: tagListSchema,
});

export type ActionState = { error: string } | null;

export async function updateSeoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  let seoKeywords: unknown;
  let seoKnowsAbout: unknown;
  try {
    seoKeywords = JSON.parse((formData.get("seoKeywords") as string | null) ?? "[]");
    seoKnowsAbout = JSON.parse((formData.get("seoKnowsAbout") as string | null) ?? "[]");
  } catch {
    return { error: "Invalid form submission." };
  }

  const parsed = seoSchema.safeParse({
    seoDefaultTitle: formData.get("seoDefaultTitle"),
    seoDefaultDescription: formData.get("seoDefaultDescription"),
    areaServed: formData.get("areaServed"),
    seoKeywords,
    seoKnowsAbout,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await updateSiteSettings(parsed.data);
  await recordAudit({ actorId: user.id, action: "settings.seo_updated" });
  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
  return null;
}
