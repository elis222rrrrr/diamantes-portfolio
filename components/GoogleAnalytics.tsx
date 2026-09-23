"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_EVENT } from "./CookieConsent";

type Props = {
  measurementId: string;
};

function subscribe(listener: () => void): () => void {
  window.addEventListener(COOKIE_CONSENT_EVENT, listener);
  return () => window.removeEventListener(COOKIE_CONSENT_EVENT, listener);
}

function getSnapshot(): boolean {
  return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

function getServerSnapshot(): boolean {
  return false;
}

/** Only loads gtag.js once consent has been given — re-checked whenever
 * CookieConsent's Accept/Decline choice fires, so accepting takes effect
 * immediately without a page reload. */
export default function GoogleAnalytics({ measurementId }: Props) {
  const consented = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
