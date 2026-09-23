import "server-only";
import "reflect-metadata";

import { container as tsyringeContainer, type InjectionToken } from "tsyringe";
import { ResendEmailSender } from "@/lib/email/sender";
import type { EmailSender } from "@/lib/email/interfaces";
import { PrismaJobQueue } from "@/lib/jobs/queue";
import type { JobQueue } from "@/lib/jobs/interfaces";
import { InProcessEventBus } from "@/lib/events/bus";
import type { EventBus } from "@/lib/events/interfaces";
import { registerSubscribers } from "@/lib/events/subscribers";

export const EMAIL_SENDER: InjectionToken<EmailSender> = "EmailSender";
export const JOB_QUEUE: InjectionToken<JobQueue> = "JobQueue";
export const EVENT_BUS: InjectionToken<EventBus> = "EventBus";

// Guard is tied to *this* container instance's own registration state, not a
// separate globalThis flag — Next.js can bundle this module more than once
// across different route/Server Action chunks, each getting its own copy of
// `tsyringeContainer`. A flag on globalThis would be shared across those
// copies even though the underlying container objects aren't, letting one
// chunk see "already bootstrapped" and skip registering on its own (empty)
// container instance. Checking isRegistered() on the instance in scope
// self-heals per chunk instead.
if (!tsyringeContainer.isRegistered(EVENT_BUS)) {
  tsyringeContainer.registerSingleton<EmailSender>(EMAIL_SENDER, ResendEmailSender);
  tsyringeContainer.registerSingleton<JobQueue>(JOB_QUEUE, PrismaJobQueue);
  tsyringeContainer.registerSingleton<EventBus>(EVENT_BUS, InProcessEventBus);
  registerSubscribers(
    tsyringeContainer.resolve<EventBus>(EVENT_BUS),
    tsyringeContainer.resolve<JobQueue>(JOB_QUEUE)
  );
}

export const container = tsyringeContainer;
