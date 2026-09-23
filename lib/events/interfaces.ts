import "server-only";

import type { DomainEvent, DomainEventType } from "./types";

type HandlerFor<T extends DomainEventType> = (
  event: Extract<DomainEvent, { type: T }>
) => Promise<void>;

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEventType>(type: T, handler: HandlerFor<T>): void;
}
