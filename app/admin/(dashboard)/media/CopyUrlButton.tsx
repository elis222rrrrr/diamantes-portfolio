"use client";

import { useState } from "react";

export default function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="focus-ring tracked-label text-white/70 transition hover:text-white"
    >
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}
