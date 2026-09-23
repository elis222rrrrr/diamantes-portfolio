"use client";

import { useActionState } from "react";
import BracketButton from "@/components/ui/BracketButton";
import FormError from "@/components/ui/FormError";
import { trackOrder, type TrackOrderState } from "./actions";

export default function TrackOrderForm() {
  const [state, formAction, pending] = useActionState<TrackOrderState, FormData>(trackOrder, null);

  return (
    <form action={formAction} className="mt-10 max-w-md">
      <label htmlFor="order-code" className="tracked-label text-muted">
        Order code
      </label>
      <input
        id="order-code"
        name="code"
        type="text"
        required
        autoComplete="off"
        spellCheck={false}
        placeholder="Paste your order code"
        className="mt-3 block h-12 w-full border border-white/15 bg-transparent px-4 font-mono text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[var(--focus-ring)]"
      />
      <FormError error={state?.error} className="mt-3" />
      <BracketButton type="submit" pending={pending} className="mt-5 px-6 py-3">
        Track order
      </BracketButton>
    </form>
  );
}
