import "server-only";

import { container, EVENT_BUS } from "@/lib/container";
import type { EventBus } from "./interfaces";
import type { DomainEvent } from "./types";

export async function publishEvent(event: DomainEvent): Promise<void> {
  await container.resolve<EventBus>(EVENT_BUS).publish(event);
}

export type { DomainEvent } from "./types";
