"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleForAction } from "@/lib/auth/session";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  duplicateArticle,
  type ArticleInput,
} from "@/lib/journal/repository";
import { uploadPublicImage } from "@/lib/storage/cloudinary";
import { recordAudit } from "@/lib/audit/repository";
import { prisma } from "@/lib/prisma";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const articleSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(300).optional(),
  excerpt: z.string().trim().max(300).optional(),
  content: z.string().min(1, "The article body can't be empty."),
  // Which submit button was clicked — see ArticleForm.tsx's comment on why
  // this can't be a hidden input driven by React state instead.
  intent: z.enum(["draft", "publish"]),
  publishedAt: z.string().optional(),
  featuredImageUrl: z.string().trim().url().optional().or(z.literal("")),
  featuredImageAlt: z.string().trim().max(200).optional(),
  featuredImageCaption: z.string().trim().max(300).optional(),
  authorName: z.string().trim().max(120).optional(),
  categoryId: z.string().optional(),
  tagNames: z.array(z.string()).max(20),
  seoTitle: z.string().trim().max(200).optional(),
  metaDescription: z.string().trim().max(300).optional(),
  canonicalUrl: z.string().trim().url().optional().or(z.literal("")),
  ogImageUrl: z.string().trim().url().optional().or(z.literal("")),
  focusKeyword: z.string().trim().max(100).optional(),
});

export type ActionState = { error: string } | null;

function parseArticleForm(formData: FormData) {
  let tagNames: unknown = [];
  try {
    tagNames = JSON.parse((formData.get("tagNames") as string | null) ?? "[]");
  } catch {
    return { success: false as const, error: { issues: [{ message: "Invalid tag list." }] } };
  }

  return articleSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    intent: formData.get("intent"),
    publishedAt: formData.get("publishedAt") || undefined,
    featuredImageUrl: formData.get("featuredImageUrl") || undefined,
    featuredImageAlt: formData.get("featuredImageAlt") || undefined,
    featuredImageCaption: formData.get("featuredImageCaption") || undefined,
    authorName: formData.get("authorName") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    tagNames,
    seoTitle: formData.get("seoTitle") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
    canonicalUrl: formData.get("canonicalUrl") || undefined,
    ogImageUrl: formData.get("ogImageUrl") || undefined,
    focusKeyword: formData.get("focusKeyword") || undefined,
  });
}

function toArticleInput(data: z.infer<typeof articleSchema>): ArticleInput {
  const status = data.intent === "draft" ? ("DRAFT" as const) : ("PUBLISHED" as const);
  // DRAFT never carries a publish date; PUBLISHED with no explicit date
  // means "publish now"; PUBLISHED with a future date is what "scheduled"
  // actually is (see the Article model's doc comment) — there's no
  // separate scheduling flag to set.
  const publishedAt =
    status === "DRAFT" ? null : data.publishedAt ? new Date(data.publishedAt) : new Date();

  return {
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle || null,
    excerpt: data.excerpt || null,
    content: data.content,
    status,
    publishedAt,
    featuredImageUrl: data.featuredImageUrl || null,
    featuredImageAlt: data.featuredImageAlt || null,
    featuredImageCaption: data.featuredImageCaption || null,
    authorName: data.authorName || null,
    categoryId: data.categoryId || null,
    tagNames: data.tagNames,
    seoTitle: data.seoTitle || null,
    metaDescription: data.metaDescription || null,
    canonicalUrl: data.canonicalUrl || null,
    ogImageUrl: data.ogImageUrl || null,
    focusKeyword: data.focusKeyword || null,
  };
}

export async function createArticleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.article.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { error: "That slug is already in use by another article." };
  }

  const article = await createArticle(toArticleInput(parsed.data));
  await recordAudit({ actorId: user.id, action: "journal.article_created", targetId: article.id });
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  redirect("/admin/journal");
}

export async function updateArticleAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.article.findFirst({
    where: { slug: parsed.data.slug, id: { not: id } },
  });
  if (existing) {
    return { error: "That slug is already in use by another article." };
  }

  await updateArticle(id, toArticleInput(parsed.data));
  await recordAudit({ actorId: user.id, action: "journal.article_updated", targetId: id });
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  redirect("/admin/journal");
}

export async function deleteArticleAction(id: string): Promise<{ error: string } | void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  await deleteArticle(id);
  await recordAudit({ actorId: user.id, action: "journal.article_deleted", targetId: id });
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}

export async function duplicateArticleAction(id: string): Promise<void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  const copy = await duplicateArticle(id);
  if (!copy) return;
  await recordAudit({ actorId: user.id, action: "journal.article_duplicated", targetId: copy.id });
  revalidatePath("/admin/journal");
  redirect(`/admin/journal/${copy.id}/edit`);
}

export async function archiveArticleAction(id: string): Promise<void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  await prisma.article.update({ where: { id }, data: { status: "ARCHIVED" } });
  await recordAudit({ actorId: user.id, action: "journal.article_archived", targetId: id });
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}

export async function restoreToDraftAction(id: string): Promise<void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  await prisma.article.update({ where: { id }, data: { status: "DRAFT", publishedAt: null } });
  await recordAudit({
    actorId: user.id,
    action: "journal.article_restored_to_draft",
    targetId: id,
  });
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function uploadJournalImageAction(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  await requireRoleForAction([...MANAGE_ROLES]);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image is too large (8MB max)." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const { url } = await uploadPublicImage(buffer, "journal");
    return { url };
  } catch {
    return { error: "Upload failed. Please try again." };
  }
}
