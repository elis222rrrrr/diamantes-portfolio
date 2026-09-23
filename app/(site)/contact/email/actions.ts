"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadAttachment } from "@/lib/storage/cloudinary";
import { publishEvent } from "@/lib/events";
import { runJobWorker } from "@/lib/jobs/worker";
import { checkContactRateLimit } from "@/lib/rate-limit";

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8MB — leaves headroom under the 10MB Server Action body limit
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(255),
  message: z.string().trim().min(1).max(5000),
});

export type ContactEmailState = { error?: string; success?: boolean };

export async function submitContactEmail(
  _prevState: ContactEmailState,
  formData: FormData
): Promise<ContactEmailState> {
  const ipAddress = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (await checkContactRateLimit(ipAddress)) {
    return { error: "Too many messages sent. Please try again later." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
  }

  const { name, email, message } = parsed.data;

  let attachment: { name: string; publicId: string } | null = null;
  const file = formData.get("attachment");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { error: "Attachment is too large (8MB max)." };
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return { error: "Attachment must be an image or PDF." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      attachment = await uploadAttachment(buffer, file.name);
    } catch {
      return { error: "Could not upload the attachment. Please try again." };
    }
  }

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      message,
      attachmentPublicId: attachment?.publicId,
      attachmentName: attachment?.name,
      attachmentType: file instanceof File ? file.type : undefined,
    },
  });

  // The event is published unconditionally — "a message was received" is a
  // fact regardless of notification config. The subscriber (lib/events/subscribers.ts)
  // decides whether STUDIO_NOTIFICATION_EMAIL warrants enqueuing a job, and the
  // job processor regenerates the Cloudinary signed URL fresh at send time
  // rather than one computed here at enqueue time.
  await publishEvent({
    type: "contact.message.received",
    name,
    email,
    message,
    attachmentPublicId: attachment?.publicId,
    attachmentName: attachment?.name,
    attachmentType: file instanceof File ? file.type : undefined,
  });
  after(() => runJobWorker());

  return { success: true };
}
