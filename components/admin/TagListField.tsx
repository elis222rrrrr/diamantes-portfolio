"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import Input from "@/components/ui/Input";

type Props = {
  name: string;
  initialValues: string[];
  label: string;
  placeholder?: string;
};

/** A repeatable text-tag list (add/remove rows) submitted as a JSON array
 * via a hidden input — shared by every admin form that edits a string[]
 * field (SEO keywords/knows-about, Hero categories, etc). */
export default function TagListField({ name, initialValues, label, placeholder }: Props) {
  const [values, setValues] = useState<string[]>(initialValues.length > 0 ? initialValues : [""]);
  const clean = values.map((v) => v.trim()).filter((v) => v !== "");

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted">{label}</span>
      <input type="hidden" name={name} readOnly value={JSON.stringify(clean)} />
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) =>
              setValues((current) => current.map((v, i) => (i === index ? e.target.value : v)))
            }
            className="flex-1"
          />
          <button
            type="button"
            aria-label="Remove"
            onClick={() => setValues((current) => current.filter((_, i) => i !== index))}
            className="focus-ring border border-white/15 px-2 text-white/50 transition hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setValues((current) => [...current, ""])}
        className="focus-ring tracked-label flex w-fit items-center gap-1 text-white/60 transition hover:text-white"
      >
        <Plus size={12} /> Add
      </button>
    </div>
  );
}
