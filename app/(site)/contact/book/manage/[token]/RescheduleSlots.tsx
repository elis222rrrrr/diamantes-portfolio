"use client";

import { useActionState } from "react";
import BracketButton from "@/components/ui/BracketButton";
import FormError from "@/components/ui/FormError";
import { rescheduleBooking } from "./actions";

type Props = {
  token: string;
  slots: { iso: string; label: string }[];
};

export default function RescheduleSlots({ token, slots }: Props) {
  const [state, formAction, pending] = useActionState(rescheduleBooking, null);

  if (slots.length === 0) {
    return <p className="text-sm text-muted">No open slots on this date, try another day.</p>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <BracketButton
            key={slot.iso}
            type="submit"
            name="newStart"
            value={slot.iso}
            pending={pending}
            small
            className="px-4 py-2"
          >
            {slot.label}
          </BracketButton>
        ))}
      </div>
      <FormError error={state?.error} className="mt-4" />
    </form>
  );
}
