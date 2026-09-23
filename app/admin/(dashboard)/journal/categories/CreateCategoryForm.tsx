"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { createCategoryAction } from "./actions";

export default function CreateCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
        // Called directly rather than through native form-action navigation
        // semantics alone — revalidatePath() marks the route stale
        // server-side, but this client needs an explicit refresh to
        // actually re-fetch and show the newly created row.
        router.refresh();
      }}
      className="flex items-end gap-3"
    >
      <div className="flex-1">
        <label htmlFor="new-category-name" className="text-xs text-muted">
          New category
        </label>
        <Input id="new-category-name" name="name" required className="mt-1 w-full" />
      </div>
      <Button type="submit" pending={pending} pendingLabel="Adding…" className="px-4 py-2">
        Add
      </Button>
      <FormError error={state?.error} />
    </form>
  );
}
