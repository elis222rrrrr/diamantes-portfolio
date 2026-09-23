"use client";

import { useActionState } from "react";
import TagListField from "@/components/admin/TagListField";
import type { SiteSettingsData } from "@/lib/settings/repository";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormError from "@/components/ui/FormError";
import { updateSeoAction, type ActionState } from "./actions";

const labelClass = "text-xs text-muted";

type Props = {
  settings: SiteSettingsData;
};

export default function SeoForm({ settings }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateSeoAction, null);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label htmlFor="seo-title" className={labelClass}>
        Default page title
      </label>
      <Input
        id="seo-title"
        type="text"
        name="seoDefaultTitle"
        required
        defaultValue={settings.seoDefaultTitle}
      />

      <label htmlFor="seo-description" className={labelClass}>
        Default meta description
      </label>
      <Textarea
        id="seo-description"
        name="seoDefaultDescription"
        required
        rows={3}
        defaultValue={settings.seoDefaultDescription}
      />

      <label htmlFor="seo-area" className={labelClass}>
        Area served
      </label>
      <Input
        id="seo-area"
        type="text"
        name="areaServed"
        required
        defaultValue={settings.areaServed}
      />

      <TagListField name="seoKeywords" initialValues={settings.seoKeywords} label="Keywords" />
      <TagListField
        name="seoKnowsAbout"
        initialValues={settings.seoKnowsAbout}
        label="Knows about (topics)"
      />

      <FormError error={state?.error} />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Saving…"
        className="mt-2 w-fit px-6 py-3"
      >
        Save SEO settings
      </Button>
    </form>
  );
}
