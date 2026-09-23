"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import { cancelBookingById } from "@/lib/booking/repository";

export async function cancelBookingAsAdmin(id: string): Promise<void> {
  await requireRoleForAction(["OWNER", "ADMIN"]);
  await cancelBookingById(id);
  revalidatePath("/admin/bookings");
}
