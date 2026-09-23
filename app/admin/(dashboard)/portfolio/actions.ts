"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleForAction } from "@/lib/auth/session";
import { create, update, remove } from "@/lib/portfolio/repository";
import { recordAudit } from "@/lib/audit/repository";
import { TOOL_IDS } from "@/lib/portfolio/tools";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const imagesSchema = z.array(z.string().trim().url()).max(20);
const downloadsSchema = z
  .array(z.object({ url: z.string().trim().url(), label: z.string().trim().min(1).max(200) }))
  .max(20);
const toolsSchema = z.array(z.enum(TOOL_IDS)).max(TOOL_IDS.length);

const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  group: z.enum(["PERSONAL", "COMMISSIONED"]),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #202426."),
  imageUrl: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  images: imagesSchema,
  videoUrl: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  // Not .url() — self-hosted models are referenced by a relative path (e.g.
  // "/models/letrion-ai-logo.glb", same convention as HeroModel.tsx), not a
  // full URL, so this only checks it looks like a path/URL ending in .glb.
  modelUrl: z
    .string()
    .trim()
    .regex(/^(\/|https?:\/\/).*\.glb$/i, "Must be a path or URL ending in .glb.")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  modelTint: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #366cfa.")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  downloads: downloadsSchema,
  tools: toolsSchema,
  order: z.coerce.number().int().min(0).default(0),
});

export type ActionState = { error: string } | null;

function parseProjectForm(formData: FormData) {
  let images: unknown = [];
  let downloads: unknown = [];
  let tools: unknown = [];
  try {
    images = JSON.parse((formData.get("images") as string | null) ?? "[]");
    downloads = JSON.parse((formData.get("downloads") as string | null) ?? "[]");
    tools = JSON.parse((formData.get("tools") as string | null) ?? "[]");
  } catch {
    return {
      success: false as const,
      error: { issues: [{ message: "Invalid form submission." }] },
    };
  }

  return projectSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description") || "",
    group: formData.get("group"),
    accent: formData.get("accent"),
    imageUrl: formData.get("imageUrl") || "",
    images,
    videoUrl: formData.get("videoUrl") || "",
    modelUrl: formData.get("modelUrl") || "",
    modelTint: formData.get("modelTint") || "",
    downloads,
    tools,
    order: formData.get("order") || 0,
  });
}

export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const project = await create(parsed.data);
  await recordAudit({ actorId: user.id, action: "portfolio.created", targetId: project.id });
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  redirect("/admin/portfolio");
}

export async function updateProjectAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const isActive = formData.get("isActive") === "on";

  await update(id, { ...parsed.data, isActive });
  await recordAudit({ actorId: user.id, action: "portfolio.updated", targetId: id });
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  redirect("/admin/portfolio");
}

export async function deleteProjectAction(id: string): Promise<void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  await remove(id);
  await recordAudit({ actorId: user.id, action: "portfolio.deleted", targetId: id });
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
}
