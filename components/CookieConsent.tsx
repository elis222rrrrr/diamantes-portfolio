"use client";

import { useSyncExternalStore } from "react";
import BracketButton from "@/components/ui/BracketButton";

export const COOKIE_CONSENT_KEY = "d3d-cookie-consent";
export const COOKIE_CONSENT_EVENT = "d3d-cookie-consent-changed";

function subscribe(listener: () => void): () => void {
  window.addEventListener(COOKIE_CONSENT_EVENT, listener);
  return () => window.removeEventListener(COOKIE_CONSENT_EVENT, listener);
}

function getSnapshot(): string | null {
  return window.localStorage.getItem(COOKIE_CONSENT_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function choose(value: "accepted" | "declined") {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export default function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (consent !== null) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-black px-6 py-5 text-white"
    >
      <div className="mx-auto flex max-w-[var(--content-width)] flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="max-w-xl text-sm text-muted">
          We use cookies for analytics to understand how visitors use this site. You can accept or
          decline. Declining means no analytics cookies are set.
        </p>
        <div className="flex shrink-0 gap-3">
          <BracketButton
            type="button"
            onClick={() => choose("declined")}
            small
            className="tracked-label px-4 py-2"
          >
            Decline
          </BracketButton>
          <BracketButton
            type="button"
            onClick={() => choose("accepted")}
            small
            className="tracked-label px-4 py-2 !text-white hover:!text-[var(--focus-ring)]"
          >
            Accept
          </BracketButton>
        </div>
      </div>
    </div>
  );
}
