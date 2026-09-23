import "server-only";

import { z } from "zod";

export const JOB_TYPES = [
  "email.bookingConfirmation",
  "email.contactNotification",
  "email.newsletterWelcome",
  "email.orderConfirmation",
  "email.orderStatusUpdate",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

const bookingConfirmationPayload = z.object({
  reason: z.enum(["created", "rescheduled"]),
  name: z.string(),
  email: z.string().email(),
  start: z.string().datetime(),
  manageToken: z.string(),
});

const contactNotificationPayload = z.object({
  studioEmail: z.string().email(),
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
  attachmentPublicId: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentType: z.string().optional(),
});

const newsletterWelcomePayload = z.object({
  email: z.string().email(),
  unsubscribeToken: z.string(),
});

const orderConfirmationPayload = z.object({
  email: z.string().email(),
  trackingToken: z.string(),
  totalCents: z.number().int(),
  currency: z.string(),
});

const orderStatusUpdatePayload = z.object({
  email: z.string().email(),
  trackingToken: z.string(),
  status: z.enum(["FULFILLED", "CANCELLED"]),
  trackingNumber: z.string().optional(),
});

export const jobPayloadSchemas = {
  "email.bookingConfirmation": bookingConfirmationPayload,
  "email.contactNotification": contactNotificationPayload,
  "email.newsletterWelcome": newsletterWelcomePayload,
  "email.orderConfirmation": orderConfirmationPayload,
  "email.orderStatusUpdate": orderStatusUpdatePayload,
} satisfies Record<JobType, z.ZodTypeAny>;

export type JobPayloadFor<T extends JobType> = z.infer<(typeof jobPayloadSchemas)[T]>;
