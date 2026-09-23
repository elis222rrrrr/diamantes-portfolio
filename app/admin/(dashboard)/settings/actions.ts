"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/session";
import { updateSiteSettings } from "@/lib/settings/repository";
import { recordAudit } from "@/lib/audit/repository";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

const settingsSchema = z.object({
  addressStreet: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || null),
  addressCity: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || null),
  addressPostalCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => v || null),
  addressCountry: z.string().trim().length(2).toUpperCase(),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => v || null),
  email: z.string().trim().toLowerCase().email(),
  instagramUrl: z.string().trim().url(),
  tiktokUrl: z.string().trim().url(),
  shippingCountries: z
    .array(z.string().trim().length(2))
    .min(1, "At least one shipping country is required.")
    // Raised from 50 — the studio ships worldwide, and Stripe Checkout's
    // own allowed_countries enum tops out at 238 entries (its full
    // supported-country list), so this only needs to not be lower than that.
    .max(240)
    .transform((codes) => codes.map((c) => c.toUpperCase())),
});

export type ActionState = { error: string } | null;

export async function updateSettingsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRoleForAction([...MANAGE_ROLES]);

  let shippingCountries: unknown;
  try {
    shippingCountries = JSON.parse((formData.get("shippingCountries") as string | null) ?? "[]");
  } catch {
    return { error: "Invalid form submission." };
  }

  const parsed = settingsSchema.safeParse({
    addressStreet: formData.get("addressStreet") || undefined,
    addressCity: formData.get("addressCity") || undefined,
    addressPostalCode: formData.get("addressPostalCode") || undefined,
    addressCountry: formData.get("addressCountry"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email"),
    instagramUrl: formData.get("instagramUrl"),
    tiktokUrl: formData.get("tiktokUrl"),
    shippingCountries,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await updateSiteSettings(parsed.data);
  await recordAudit({ actorId: user.id, action: "settings.studio_updated" });
  revalidatePath("/admin/settings");
  // "layout" cascades to every route sharing the root layout (JSON-LD
  // address/sameAs) and the site layout (Footer's social links) — a plain
  // revalidatePath("/") would only bust the homepage itself, leaving every
  // other page's cached Footer/JSON-LD stale until it happened to revalidate
  // on its own.
  revalidatePath("/", "layout");
  return null;
}
