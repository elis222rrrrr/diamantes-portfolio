import "server-only";

import type { EventBus } from "./interfaces";
import type { JobQueue } from "@/lib/jobs/interfaces";
import { getSiteSettings } from "@/lib/settings/repository";

/** Wires each domain event to the job(s) it should enqueue. Called once at container bootstrap. */
export function registerSubscribers(bus: EventBus, jobQueue: JobQueue): void {
  bus.subscribe("booking.created", async (event) => {
    await jobQueue.enqueue("email.bookingConfirmation", {
      reason: "created",
      name: event.name,
      email: event.email,
      start: event.start,
      manageToken: event.manageToken,
    });
  });

  bus.subscribe("booking.rescheduled", async (event) => {
    await jobQueue.enqueue("email.bookingConfirmation", {
      reason: "rescheduled",
      name: event.name,
      email: event.email,
      start: event.start,
      manageToken: event.manageToken,
    });
  });

  bus.subscribe("contact.message.received", async (event) => {
    const { email: studioEmail } = await getSiteSettings();

    await jobQueue.enqueue("email.contactNotification", {
      studioEmail,
      name: event.name,
      email: event.email,
      message: event.message,
      attachmentPublicId: event.attachmentPublicId,
      attachmentName: event.attachmentName,
      attachmentType: event.attachmentType,
    });
  });

  bus.subscribe("newsletter.subscribed", async (event) => {
    await jobQueue.enqueue("email.newsletterWelcome", {
      email: event.email,
      unsubscribeToken: event.unsubscribeToken,
    });
  });

  bus.subscribe("order.paid", async (event) => {
    await jobQueue.enqueue("email.orderConfirmation", {
      email: event.email,
      trackingToken: event.trackingToken,
      totalCents: event.totalCents,
      currency: event.currency,
    });
  });

  bus.subscribe("order.status.changed", async (event) => {
    await jobQueue.enqueue("email.orderStatusUpdate", {
      email: event.email,
      trackingToken: event.trackingToken,
      status: event.status,
      trackingNumber: event.trackingNumber,
    });
  });
}
