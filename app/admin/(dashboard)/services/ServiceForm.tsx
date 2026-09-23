"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormError from "@/components/ui/FormError";
import type { ActionState } from "./actions";

const labelClass = "text-xs text-muted";

type Service = {
  title: string;
  description: string;
  details: string;
  examples: unknown;
  accent: string;
  order: number;
  isActive: boolean;
};

function examplesToLines(examples: unknown): string {
  if (!Array.isArray(examples)) return "";
  return examples
    .filter(
      (e): e is { url: string; label: string } =>
        typeof e === "object" && e !== null && typeof (e as { url?: unknown }).url === "string"
    )
    .map((e) => `${e.url} | ${e.label}`)
    .join("\n");
}

type Props = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  service?: Service;
  submitLabel: string;
};

export default function ServiceForm({ action, service, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label htmlFor="service-title" className={labelClass}>
        Title
      </label>
      <Input id="service-title" type="text" name="title" required defaultValue={service?.title} />

      <label htmlFor="service-description" className={labelClass}>
        Description
      </label>
      <Textarea
        id="service-description"
        name="description"
        required
        rows={3}
        defaultValue={service?.description}
      />

      <label htmlFor="service-details" className={labelClass}>
        Details (shown on the service&apos;s own page — /services/[slug])
      </label>
      <Textarea id="service-details" name="details" rows={5} defaultValue={service?.details} />

      <label htmlFor="service-examples" className={labelClass}>
        Example images — one per line, as: image URL | Label
      </label>
      <Textarea
        id="service-examples"
        name="examples"
        rows={4}
        placeholder="https://res.cloudinary.com/.../photo.png | Project name"
        defaultValue={examplesToLines(service?.examples)}
      />

      <label htmlFor="service-accent" className={labelClass}>
        Accent color (hex)
      </label>
      <Input
        id="service-accent"
        type="text"
        name="accent"
        required
        placeholder="#262b30"
        defaultValue={service?.accent ?? "#262b30"}
        className="w-32"
      />

      <label htmlFor="service-order" className={labelClass}>
        Order (lower shows first)
      </label>
      <Input
        id="service-order"
        type="number"
        name="order"
        min={0}
        step={1}
        defaultValue={service?.order ?? 0}
        className="w-24"
      />

      {service && (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="isActive" defaultChecked={service.isActive} />
          Active (visible on the site)
        </label>
      )}

      <FormError error={state?.error} />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Saving…"
        className="mt-2 w-fit px-6 py-3"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
