"use client";

import { useActionState } from "react";
import TagListField from "@/components/admin/TagListField";
import type { SiteSettingsData } from "@/lib/settings/repository";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import { updateHeroAction, type ActionState } from "./actions";

const labelClass = "text-xs text-muted";

type Props = {
  settings: SiteSettingsData;
};

export default function HeroForm({ settings }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateHeroAction,
    null
  );

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label htmlFor="hero-tagline" className={labelClass}>
        Tagline
      </label>
      <Input
        id="hero-tagline"
        type="text"
        name="heroTagline"
        required
        defaultValue={settings.heroTagline}
      />

      <TagListField
        name="heroCategories"
        initialValues={settings.heroCategories}
        label="Category tags"
      />

      <FormError error={state?.error} />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Saving…"
        className="mt-2 w-fit px-6 py-3"
      >
        Save hero content
      </Button>
    </form>
  );
}
