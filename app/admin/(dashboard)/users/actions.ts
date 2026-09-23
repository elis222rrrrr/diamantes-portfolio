"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleForAction } from "@/lib/auth/session";
import { create, update, findById, countActiveOwners } from "@/lib/users/repository";
import { recordAudit } from "@/lib/audit/repository";

// User management is deliberately OWNER-only — stricter than every other
// admin section (which allow OWNER + ADMIN) — since it includes granting
// roles, and an ADMIN shouldn't be able to promote themselves to OWNER.
const MANAGE_ROLES = ["OWNER"] as const;

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || undefined),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["OWNER", "ADMIN", "EDITOR"]),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || undefined),
  role: z.enum(["OWNER", "ADMIN", "EDITOR"]),
});

export type ActionState = { error: string } | null;

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = createUserSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let user;
  try {
    user = await create(parsed.data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A user with that email already exists." };
    }
    throw error;
  }

  await recordAudit({ actorId: actor.id, action: "user.created", targetId: user.id });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name") || undefined,
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const isActive = formData.get("isActive") === "on";

  const target = await findById(id);
  if (!target) {
    return { error: "User not found." };
  }

  // Block demoting/deactivating the last active OWNER — the studio should
  // never be able to accidentally lock itself out of the admin panel.
  const losesOwnerStatus = target.role === "OWNER" && (parsed.data.role !== "OWNER" || !isActive);
  if (losesOwnerStatus) {
    const remainingOwners = await countActiveOwners(id);
    if (remainingOwners === 0) {
      return { error: "Can't remove the last active OWNER account." };
    }
  }

  await update(id, { name: parsed.data.name, role: parsed.data.role, isActive });
  await recordAudit({
    actorId: actor.id,
    action: "user.updated",
    targetId: id,
    metadata: { role: parsed.data.role, isActive },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
