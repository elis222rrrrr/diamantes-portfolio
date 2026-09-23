import "server-only";

import { Resend } from "resend";

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

function createResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.");
  }
  return new Resend(apiKey);
}

export const resend = globalForResend.resend ?? createResendClient();

if (process.env.NODE_ENV !== "production") {
  globalForResend.resend = resend;
}

export function requireFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not set.");
  return from;
}

export function requireSiteUrl(): string {
  const url = process.env.SITE_URL;
  if (!url) throw new Error("SITE_URL is not set.");
  return url;
}
