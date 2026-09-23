"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { after } from "next/server";
import { upsertSubscriber } from "@/lib/newsletter/repository";
import { publishEvent } from "@/lib/events";
import { runJobWorker } from "@/lib/jobs/worker";
import { checkNewsletterRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

export type NewsletterState = { error?: string; success?: boolean };

export async function subscribeToNewsletter(
  _prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const ipAddress = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (await checkNewsletterRateLimit(ipAddress)) {
    return { error: "Too many attempts. Please try again later." };
  }

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Please enter a valid email." };
  }

  const subscriber = await upsertSubscriber(parsed.data.email);

  await publishEvent({
    type: "newsletter.subscribed",
    email: subscriber.email,
    unsubscribeToken: subscriber.unsubscribeToken,
  });
  after(() => runJobWorker());

  return { success: true };
}
