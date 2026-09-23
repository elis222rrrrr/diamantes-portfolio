"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { createTagAction } from "./actions";

export default function CreateTagForm() {
  const [state, formAction, pending] = useActionState(createTagAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
        router.refresh();
      }}
      className="flex items-end gap-3"
    >
      <div className="flex-1">
        <label htmlFor="new-tag-name" className="text-xs text-muted">
          New tag
        </label>
        <Input id="new-tag-name" name="name" required className="mt-1 w-full" />
      </div>
      <Button type="submit" pending={pending} pendingLabel="Adding…" className="px-4 py-2">
        Add
      </Button>
      <FormError error={state?.error} />
    </form>
  );
}
