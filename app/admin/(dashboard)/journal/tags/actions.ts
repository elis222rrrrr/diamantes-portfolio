"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import { createTag, updateTag, deleteTag } from "@/lib/journal/repository";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;
const nameSchema = z.string().trim().min(1).max(50);

export type ActionState = { error: string } | null;

export async function createTagAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRoleForAction([...MANAGE_ROLES]);
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: "Please enter a tag name." };

  try {
    await createTag(parsed.data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A tag with that name already exists." };
    }
    throw error;
  }
  revalidatePath("/admin/journal/tags");
  return null;
}

export async function updateTagAction(id: string, name: string): Promise<{ error: string } | void> {
  await requireRoleForAction([...MANAGE_ROLES]);
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: "Please enter a valid tag name." };

  try {
    await updateTag(id, parsed.data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A tag with that name already exists." };
    }
    throw error;
  }
  revalidatePath("/admin/journal/tags");
}

export async function deleteTagAction(id: string): Promise<{ error: string } | void> {
  await requireRoleForAction([...MANAGE_ROLES]);
  await deleteTag(id);
  revalidatePath("/admin/journal/tags");
}
