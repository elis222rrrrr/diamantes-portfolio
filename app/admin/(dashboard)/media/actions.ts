"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import { deleteMediaAsset } from "@/lib/storage/cloudinary";
import { recordAudit } from "@/lib/audit/repository";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

export async function deleteMediaAction(publicId: string): Promise<void> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);
  await deleteMediaAsset(publicId);
  await recordAudit({ actorId: user.id, action: "media.deleted", targetId: publicId });
  revalidatePath("/admin/media");
}
