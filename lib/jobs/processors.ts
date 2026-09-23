import "server-only";

import { container, EMAIL_SENDER } from "@/lib/container";
import type { EmailSender } from "@/lib/email/interfaces";
import { requireSiteUrl } from "@/lib/email/resend";
import { formatAthensDate, formatAthensTime } from "@/lib/booking/slots";
import { signedAttachmentUrl } from "@/lib/storage/cloudinary";
import BookingConfirmationEmail from "@/lib/email/templates/booking-confirmation";
import ContactNotificationEmail from "@/lib/email/templates/contact-notification";
import NewsletterWelcomeEmail from "@/lib/email/templates/newsletter-welcome";
import OrderConfirmationEmail from "@/lib/email/templates/order-confirmation";
import OrderStatusUpdateEmail from "@/lib/email/templates/order-status-update";
import { jobPayloadSchemas, type JobType } from "./types";

type Processor = (payload: unknown) => Promise<void>;

function emailSender(): EmailSender {
  return container.resolve<EmailSender>(EMAIL_SENDER);
}

const processors: Record<JobType, Processor> = {
  "email.bookingConfirmation": async (raw) => {
    const payload = jobPayloadSchemas["email.bookingConfirmation"].parse(raw);
    const start = new Date(payload.start);
    await emailSender().send({
      to: payload.email,
      subject:
        payload.reason === "rescheduled"
          ? "Your call has been rescheduled"
          : "Your call is confirmed",
      react: BookingConfirmationEmail({
        name: payload.name,
        dateLabel: formatAthensDate(start),
        timeLabel: formatAthensTime(start),
        manageUrl: `${requireSiteUrl()}/contact/book/manage/${payload.manageToken}`,
      }),
    });
  },

  "email.contactNotification": async (raw) => {
    const payload = jobPayloadSchemas["email.contactNotification"].parse(raw);
    const attachmentUrl =
      payload.attachmentPublicId && payload.attachmentName
        ? signedAttachmentUrl(
            payload.attachmentPublicId,
            payload.attachmentName.split(".").pop() ?? "bin",
            (payload.attachmentType ?? "").startsWith("image/"),
            7 * 24 * 60 * 60
          )
        : undefined;

    await emailSender().send({
      to: payload.studioEmail,
      replyTo: payload.email,
      subject: `New message from ${payload.name}`,
      react: ContactNotificationEmail({
        name: payload.name,
        email: payload.email,
        message: payload.message,
        attachmentUrl,
        attachmentName: payload.attachmentName,
      }),
    });
  },

  "email.newsletterWelcome": async (raw) => {
    const payload = jobPayloadSchemas["email.newsletterWelcome"].parse(raw);
    await emailSender().send({
      to: payload.email,
      subject: "You're subscribed",
      react: NewsletterWelcomeEmail({
        unsubscribeUrl: `${requireSiteUrl()}/newsletter/unsubscribe/${payload.unsubscribeToken}`,
      }),
    });
  },

  "email.orderConfirmation": async (raw) => {
    const payload = jobPayloadSchemas["email.orderConfirmation"].parse(raw);
    await emailSender().send({
      to: payload.email,
      subject: "Your order is confirmed",
      react: OrderConfirmationEmail({
        totalCents: payload.totalCents,
        currency: payload.currency,
        trackingToken: payload.trackingToken,
        trackUrl: `${requireSiteUrl()}/orders/track/${payload.trackingToken}`,
      }),
    });
  },

  "email.orderStatusUpdate": async (raw) => {
    const payload = jobPayloadSchemas["email.orderStatusUpdate"].parse(raw);
    await emailSender().send({
      to: payload.email,
      subject:
        payload.status === "FULFILLED" ? "Your order has shipped" : "Your order was cancelled",
      react: OrderStatusUpdateEmail({
        status: payload.status,
        trackingNumber: payload.trackingNumber,
        trackUrl: `${requireSiteUrl()}/orders/track/${payload.trackingToken}`,
      }),
    });
  },
};

export function getProcessor(type: string): Processor | undefined {
  return processors[type as JobType];
}
