import "server-only";

import { prisma } from "@/lib/prisma";

export function upsertSubscriber(email: string) {
  return prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { unsubscribedAt: null },
    create: { email },
  });
}

export function findSubscriberByToken(token: string) {
  return prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
}

export async function markUnsubscribed(token: string): Promise<void> {
  await prisma.newsletterSubscriber.updateMany({
    where: { unsubscribeToken: token },
    data: { unsubscribedAt: new Date() },
  });
}

export function listSubscribers() {
  return prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: "desc" } });
}
