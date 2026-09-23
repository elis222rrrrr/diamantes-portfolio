"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import type { ActionState } from "../actions";

type Props = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export default function MarkShippedForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 border border-white/10 p-4">
      <label htmlFor="tracking-number" className="text-xs text-muted">
        Tracking number
      </label>
      <Input id="tracking-number" type="text" name="trackingNumber" required />

      <FormError error={state?.error} />

      <Button type="submit" pending={pending} pendingLabel="Saving…" className="w-fit px-4 py-2">
        Mark as shipped
      </Button>
    </form>
  );
}
