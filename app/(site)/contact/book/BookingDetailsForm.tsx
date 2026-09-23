"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import BracketButton from "@/components/ui/BracketButton";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormError from "@/components/ui/FormError";
import { createBooking } from "./actions";

type Props = {
  startIso: string;
  dateLabel: string;
  timeLabel: string;
  backHref: string;
};

export default function BookingDetailsForm({ startIso, dateLabel, timeLabel, backHref }: Props) {
  const [state, formAction, pending] = useActionState(createBooking, null);

  return (
    <div>
      <Link
        href={backHref}
        className="focus-ring tracked-label mb-6 inline-flex items-center gap-2 text-muted transition hover:text-white"
      >
        <ArrowLeft size={14} />
        Choose a different time
      </Link>

      <p className="mb-8 text-sm text-white/70">
        {dateLabel} at {timeLabel} (Greece time)
      </p>

      <form action={formAction} className="flex max-w-md flex-col gap-4">
        <input type="hidden" name="start" value={startIso} />

        <label htmlFor="booking-name" className="sr-only">
          Name
        </label>
        <Input required id="booking-name" type="text" name="name" placeholder="Name" size="md" />

        <label htmlFor="booking-email" className="sr-only">
          Email
        </label>
        <Input
          required
          id="booking-email"
          type="email"
          name="email"
          placeholder="Email"
          size="md"
        />

        <label htmlFor="booking-notes" className="sr-only">
          Notes (optional)
        </label>
        <Textarea
          id="booking-notes"
          name="notes"
          placeholder="Anything we should know ahead of the call? (optional)"
          rows={3}
          size="md"
        />

        <FormError error={state?.error} />

        <BracketButton
          type="submit"
          pending={pending}
          className="mt-2 flex items-center justify-center gap-3 px-8 py-4"
        >
          {pending ? "Booking…" : "Confirm booking"}
          <ArrowRight size={18} />
        </BracketButton>
      </form>
    </div>
  );
}
