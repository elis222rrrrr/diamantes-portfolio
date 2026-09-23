import "server-only";

import { singleton } from "tsyringe";
import type { EventBus } from "./interfaces";
import type { DomainEvent, DomainEventType } from "./types";

type Handler = (event: DomainEvent) => Promise<void>;

@singleton()
export class InProcessEventBus implements EventBus {
  private handlers = new Map<DomainEventType, Handler[]>();

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  subscribe<T extends DomainEventType>(
    type: T,
    handler: (event: Extract<DomainEvent, { type: T }>) => Promise<void>
  ): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler as Handler);
    this.handlers.set(type, list);
  }
}
