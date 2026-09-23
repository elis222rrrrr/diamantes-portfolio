"use server";

import { redirect } from "next/navigation";
import { markUnsubscribed } from "@/lib/newsletter/repository";

export async function unsubscribe(token: string): Promise<void> {
  await markUnsubscribed(token);
  redirect(`/newsletter/unsubscribe/${token}?done=1`);
}
