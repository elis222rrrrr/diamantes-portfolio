"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

type Props = { title: string; url: string };

export default function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context) —
      // the other three share links still work, so this just no-ops.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="tracked-label text-muted">Share</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring tracked-label text-white/70 transition hover:text-white"
        >
          {link.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="focus-ring tracked-label flex items-center gap-1 text-white/70 transition hover:text-white"
      >
        {copied ? <Check size={12} /> : <Link2 size={12} />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
