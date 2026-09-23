"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import {
  createAvailabilityRuleRecord,
  deleteAvailabilityRuleRecord,
  createBlockedDateRecord,
  deleteBlockedDateRecord,
} from "@/lib/booking/repository";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const timeToMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

const isValidTime = (minutes: number, allowMidnightEnd = false) =>
  minutes >= 0 && minutes <= (allowMidnightEnd ? 1440 : 1439);

const ruleSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .transform((data) => ({
    dayOfWeek: data.dayOfWeek,
    startMinute: timeToMinutes(data.startTime),
    endMinute: timeToMinutes(data.endTime),
  }))
  .refine((data) => isValidTime(data.startMinute) && isValidTime(data.endMinute, true), {
    message: "Please enter valid times.",
  })
  .refine((data) => data.startMinute < data.endMinute, {
    message: "Start time must be before end time.",
  });

export type ActionState = { error: string } | null;

export async function createAvailabilityRule(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = ruleSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await createAvailabilityRuleRecord(parsed.data);
  revalidatePath("/admin/availability");
  return null;
}

export async function deleteAvailabilityRule(id: string): Promise<void> {
  await requireRoleForAction([...MANAGE_ROLES]);
  await deleteAvailabilityRuleRecord(id);
  revalidatePath("/admin/availability");
}

const blockedDateSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    reason: z.string().max(200).optional(),
  })
  .transform((data) => {
    const [year, month, day] = data.date.split("-").map(Number);
    const hasRange = !!data.startTime && !!data.endTime;
    return {
      date: new Date(Date.UTC(year, month - 1, day)),
      startMinute: hasRange ? timeToMinutes(data.startTime!) : null,
      endMinute: hasRange ? timeToMinutes(data.endTime!) : null,
      reason: data.reason || null,
    };
  })
  .refine(
    (data) =>
      (data.startMinute === null && data.endMinute === null) ||
      (data.startMinute !== null &&
        data.endMinute !== null &&
        isValidTime(data.startMinute) &&
        isValidTime(data.endMinute, true) &&
        data.startMinute < data.endMinute),
    { message: "Please enter a valid blocked time range." }
  );

export async function createBlockedDate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRoleForAction([...MANAGE_ROLES]);

  const parsed = blockedDateSchema.safeParse({
    date: formData.get("date"),
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await createBlockedDateRecord(parsed.data);
  revalidatePath("/admin/availability");
  return null;
}

export async function deleteBlockedDate(id: string): Promise<void> {
  await requireRoleForAction([...MANAGE_ROLES]);
  await deleteBlockedDateRecord(id);
  revalidatePath("/admin/availability");
}
