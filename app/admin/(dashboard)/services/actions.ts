"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleForAction } from "@/lib/auth/session";
import { create, update, remove } from "@/lib/services/repository";
import { recordAudit } from "@/lib/audit/repository";
import { slugify } from "@/lib/journal/slugify";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const serviceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(500),
  details: z.string().trim().max(4000).default(""),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #202426."),
  order: z.coerce.number().int().min(0).default(0),
});

export type ActionState = { error: string } | null;

// One "https://... | Label" per line, matching the textarea's own
// placeholder — parsed here rather than asking the admin to hand-write
// JSON for a field with only a handful of rows.
function parseExamples(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, ...rest] = line.split("|");
      return { url: url.trim(), label: rest.join("|").trim() || "Example" };
    })
    .filter((e) => e.url.length > 0);
}

function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    details: formData.get("details") || "",
    accent: formData.get("accent"),
    order: formData.get("order") || 0,
  });
}

export async function createServiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = parseServiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const examples = parseExamples(String(formData.get("examples") || ""));

  const service = await create({
    ...parsed.data,
    slug: slugify(parsed.data.title),
    examples,
  });
  await recordAudit({ actorId: user.id, action: "service.created", targetId: service.id });
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/");
  redirect("/admin/services");
}

export async function updateServiceAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = parseServiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const isActive = formData.get("isActive") === "on";
  const examples = parseExamples(String(formData.get("examples") || ""));

  const service = await update(id, {
    ...parsed.data,
    slug: slugify(parsed.data.title),
    examples,
    isActive,
  });
  await recordAudit({ actorId: user.id, action: "service.updated", targetId: id });
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/");
  redirect("/admin/services");
}

export async function deleteServiceAction(id: string): Promise<void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  await remove(id);
  await recordAudit({ actorId: user.id, action: "service.deleted", targetId: id });
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
}
