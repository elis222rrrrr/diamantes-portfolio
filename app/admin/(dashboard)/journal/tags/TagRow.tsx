"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import FormError from "@/components/ui/FormError";
import { updateTagAction, deleteTagAction } from "./actions";

type Props = { id: string; name: string; articleCount: number };

export default function TagRow({ id, name, articleCount }: Props) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    if (value.trim() === name) return;
    startTransition(async () => {
      const result = await updateTagAction(id, value);
      setError(result?.error ?? null);
      if (!result?.error) router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-4 border border-white/10 p-4">
      <Input value={value} onChange={(e) => setValue(e.target.value)} className="flex-1" />
      <span className="text-xs text-muted">{articleCount} articles</span>
      <Button type="button" onClick={handleSave} pending={pending} className="px-3 py-1.5">
        Save
      </Button>
      <ConfirmSubmitButton
        action={deleteTagAction.bind(null, id)}
        triggerLabel="Delete"
        triggerClassName="focus-ring tracked-label text-white/70 transition hover:text-white"
        title="Delete this tag?"
        message="Articles using this tag will keep their other tags — this only removes the tag itself."
        confirmLabel="Delete tag"
      />
      <FormError error={error} />
    </li>
  );
}
