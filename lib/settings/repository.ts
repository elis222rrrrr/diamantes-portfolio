import "server-only";

import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

export type SiteSettingsData = {
  heroTagline: string;
  heroCategories: string[];
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  seoKeywords: string[];
  seoKnowsAbout: string[];
  areaServed: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostalCode: string | null;
  addressCountry: string;
  phone: string | null;
  email: string;
  instagramUrl: string;
  tiktokUrl: string;
  shippingCountries: string[];
};

type JsonFieldKeys = "heroCategories" | "seoKeywords" | "seoKnowsAbout" | "shippingCountries";

type SettingsRow = Omit<SiteSettingsData, JsonFieldKeys> & Record<JsonFieldKeys, unknown>;

function toSettingsData(row: SettingsRow): SiteSettingsData {
  return {
    ...row,
    heroCategories: row.heroCategories as string[],
    seoKeywords: row.seoKeywords as string[],
    seoKnowsAbout: row.seoKnowsAbout as string[],
    shippingCountries: row.shippingCountries as string[],
  };
}

/** Upserts the single settings row on every read so callers never have to
 * null-check — the row is created with schema defaults the first time
 * anything asks for settings. Wrapped in React's cache() so the several
 * places that read settings within one request (layout metadata, layout
 * JSON-LD, page components) share a single DB round-trip — same pattern
 * lib/auth/session.ts's getSession() already uses. */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  const row = await prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID },
    update: {},
  });
  return toSettingsData(row);
});

export async function updateSiteSettings(data: Partial<SiteSettingsData>): Promise<void> {
  const jsonData = data as Partial<SiteSettingsData> &
    Record<
      "heroCategories" | "seoKeywords" | "seoKnowsAbout" | "shippingCountries",
      Prisma.InputJsonValue | undefined
    >;

  await prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...jsonData },
    update: jsonData,
  });
}
