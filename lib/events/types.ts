import "server-only";

export type DomainEvent =
  | {
      type: "booking.created";
      email: string;
      name: string;
      start: string;
      manageToken: string;
    }
  | {
      type: "booking.rescheduled";
      email: string;
      name: string;
      start: string;
      manageToken: string;
    }
  | {
      type: "contact.message.received";
      name: string;
      email: string;
      message: string;
      attachmentPublicId?: string;
      attachmentName?: string;
      attachmentType?: string;
    }
  | {
      type: "newsletter.subscribed";
      email: string;
      unsubscribeToken: string;
    }
  | {
      type: "order.paid";
      orderId: string;
      email: string;
      trackingToken: string;
      totalCents: number;
      currency: string;
    }
  | {
      type: "order.status.changed";
      email: string;
      trackingToken: string;
      status: "FULFILLED" | "CANCELLED";
      trackingNumber?: string;
    };

export type DomainEventType = DomainEvent["type"];
