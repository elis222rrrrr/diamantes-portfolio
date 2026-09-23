"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import type { SiteSettingsData } from "@/lib/settings/repository";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import { updateSettingsAction, type ActionState } from "./actions";

const labelClass = "text-xs text-muted";

type Props = {
  settings: SiteSettingsData;
};

export default function SettingsForm({ settings }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateSettingsAction,
    null
  );
  const [countries, setCountries] = useState<string[]>(settings.shippingCountries);

  const cleanCountries = countries.map((c) => c.trim().toUpperCase()).filter((c) => c.length === 2);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input
        type="hidden"
        name="shippingCountries"
        readOnly
        value={JSON.stringify(cleanCountries)}
      />

      <h2 className="mb-2 text-lg font-light">Studio info</h2>

      <label htmlFor="settings-street" className={labelClass}>
        Street address (optional)
      </label>
      <Input
        id="settings-street"
        type="text"
        name="addressStreet"
        defaultValue={settings.addressStreet ?? ""}
      />

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="settings-city" className={labelClass}>
            City (optional)
          </label>
          <Input
            id="settings-city"
            type="text"
            name="addressCity"
            defaultValue={settings.addressCity ?? ""}
            className="w-full"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="settings-postal" className={labelClass}>
            Postal code (optional)
          </label>
          <Input
            id="settings-postal"
            type="text"
            name="addressPostalCode"
            defaultValue={settings.addressPostalCode ?? ""}
            className="w-full"
          />
        </div>
      </div>

      <label htmlFor="settings-country" className={labelClass}>
        Country (2-letter code, e.g. GR)
      </label>
      <Input
        id="settings-country"
        type="text"
        name="addressCountry"
        required
        maxLength={2}
        defaultValue={settings.addressCountry}
        className="w-20 uppercase"
      />

      <label htmlFor="settings-phone" className={labelClass}>
        Phone (optional)
      </label>
      <Input id="settings-phone" type="tel" name="phone" defaultValue={settings.phone ?? ""} />

      <label htmlFor="settings-email" className={labelClass}>
        Notification email (also receives contact-form messages)
      </label>
      <Input id="settings-email" type="email" name="email" required defaultValue={settings.email} />

      <label htmlFor="settings-instagram" className={labelClass}>
        Instagram URL
      </label>
      <Input
        id="settings-instagram"
        type="url"
        name="instagramUrl"
        required
        defaultValue={settings.instagramUrl}
      />

      <label htmlFor="settings-tiktok" className={labelClass}>
        TikTok URL
      </label>
      <Input
        id="settings-tiktok"
        type="url"
        name="tiktokUrl"
        required
        defaultValue={settings.tiktokUrl}
      />

      <h2 className="mb-2 mt-4 text-lg font-light">Shipping</h2>
      <div className="flex flex-col gap-2">
        <span className={labelClass}>Countries Stripe collects a shipping address for</span>
        <div className="flex flex-wrap gap-2">
          {countries.map((code, index) => (
            <div key={index} className="flex items-center border border-white/15">
              <input
                type="text"
                value={code}
                maxLength={2}
                onChange={(e) =>
                  setCountries((current) =>
                    current.map((c, i) => (i === index ? e.target.value : c))
                  )
                }
                className="w-12 bg-transparent px-2 py-1 text-center text-xs uppercase focus:outline-none"
              />
              <button
                type="button"
                aria-label={`Remove ${code}`}
                onClick={() => setCountries((current) => current.filter((_, i) => i !== index))}
                className="focus-ring px-1 text-white/40 transition hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCountries((current) => [...current, ""])}
          className="focus-ring tracked-label flex w-fit items-center gap-1 text-white/60 transition hover:text-white"
        >
          <Plus size={12} /> Add country
        </button>
      </div>

      <FormError error={state?.error} className="mt-2" />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Saving…"
        className="mt-4 w-fit px-6 py-3"
      >
        Save settings
      </Button>
    </form>
  );
}
