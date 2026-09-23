"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import FormError from "@/components/ui/FormError";
import { updateCategoryAction, deleteCategoryAction } from "./actions";

type Props = { id: string; name: string; articleCount: number };

export default function CategoryRow({ id, name, articleCount }: Props) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    if (value.trim() === name) return;
    startTransition(async () => {
      const result = await updateCategoryAction(id, value);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        router.refresh();
      }
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
        action={deleteCategoryAction.bind(null, id)}
        triggerLabel="Delete"
        triggerClassName="focus-ring tracked-label text-white/70 transition hover:text-white"
        title="Delete this category?"
        message={
          articleCount > 0
            ? `${articleCount} article(s) use this category — they'll become uncategorized, not deleted.`
            : "This category isn't used by any articles."
        }
        confirmLabel="Delete category"
      />
      <FormError error={error} />
    </li>
  );
}
