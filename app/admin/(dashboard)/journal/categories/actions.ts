"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import { createCategory, updateCategory, deleteCategory } from "@/lib/journal/repository";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;
const nameSchema = z.string().trim().min(1).max(80);

export type ActionState = { error: string } | null;

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRoleForAction([...MANAGE_ROLES]);
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: "Please enter a category name." };

  try {
    await createCategory(parsed.data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A category with that name already exists." };
    }
    throw error;
  }
  revalidatePath("/admin/journal/categories");
  return null;
}

export async function updateCategoryAction(
  id: string,
  name: string
): Promise<{ error: string } | void> {
  await requireRoleForAction([...MANAGE_ROLES]);
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: "Please enter a valid category name." };

  try {
    await updateCategory(id, parsed.data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A category with that name already exists." };
    }
    throw error;
  }
  revalidatePath("/admin/journal/categories");
}

export async function deleteCategoryAction(id: string): Promise<{ error: string } | void> {
  await requireRoleForAction([...MANAGE_ROLES]);
  await deleteCategory(id);
  revalidatePath("/admin/journal/categories");
}
