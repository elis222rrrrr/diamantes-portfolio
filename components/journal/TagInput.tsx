"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Input from "@/components/ui/Input";

type Props = {
  name: string;
  initialTags: string[];
  suggestions?: string[];
};

/** Type a tag name + Enter/comma to add it as a chip — new names get created
 * as real `JournalTag` rows on save (repository.ts's connectOrCreate), so
 * there's no separate "create the tag first" step. */
export default function TagInput({ name, initialTags, suggestions = [] }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");

  function addTag(value: string) {
    const clean = value.trim();
    if (!clean || tags.includes(clean)) return;
    setTags((current) => [...current, clean]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags((current) => current.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} readOnly value={JSON.stringify(tags)} />
      <div className="flex flex-wrap items-center gap-2 border border-white/15 p-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 border border-white/15 px-2 py-1 text-xs text-white/70"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => setTags((current) => current.filter((t) => t !== tag))}
              className="focus-ring text-white/40 hover:text-white"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder="Add a tag…"
          className="min-w-[120px] flex-1 border-0 p-1"
          list="journal-tag-suggestions"
        />
      </div>
      {suggestions.length > 0 && (
        <datalist id="journal-tag-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}
