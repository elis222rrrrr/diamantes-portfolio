"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./ConfirmDialog";
import CornerBrackets from "./ui/CornerBrackets";

type ActionResult = { error: string } | void;

type Props = {
  action: () => Promise<ActionResult>;
  triggerLabel: string;
  triggerClassName: string;
  triggerStyle?: CSSProperties;
  /** Renders the trigger with the "Add to cart" corner-bracket treatment
   * (see components/ui/BracketButton.tsx) instead of a plain bordered
   * button — `triggerClassName` still supplies layout/padding, just add
   * `relative` to it and skip the corner brackets. */
  bracket?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
};

/** Matches the shape Next.js's `redirect()` throws (a plain object with a
 * `digest` starting "NEXT_REDIRECT") — the same convention Next's own
 * RedirectBoundary uses internally to recognize it. There's no stable public
 * export for this check (only deep `next/dist/...` internals, which aren't
 * safe to import directly), so this checks the documented error shape
 * instead of a version-fragile internal module path. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default function ConfirmSubmitButton({
  action,
  triggerLabel,
  triggerClassName,
  triggerStyle,
  bracket,
  title,
  message,
  confirmLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      try {
        const result = await action();
        if (result?.error) {
          setError(result.error);
          return;
        }
        setOpen(false);
        // Action was called directly (not through a <form action={...}>
        // binding), so Next doesn't automatically refresh this route's
        // Server Components the way it does for form-action-driven
        // mutations — without this, a deleted/updated row stays visible
        // until the next manual navigation or reload.
        router.refresh();
      } catch (err) {
        // redirect() throws to signal navigation, not failure — letting it
        // propagate lets Next's own RedirectBoundary perform the redirect.
        // Swallowing it here (as this catch used to) silently deletes/
        // updates the record but shows a false "Something went wrong" and
        // never navigates.
        if (isRedirectError(err)) throw err;
        setError("Something went wrong. Please try again.");
      }
    });
  }

  function handleOpen() {
    setError(null);
    setOpen(true);
  }

  function handleCancel() {
    setError(null);
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={triggerClassName} style={triggerStyle}>
        {bracket && <CornerBrackets />}
        {triggerLabel}
      </button>
      <ConfirmDialog
        isOpen={open}
        title={title}
        message={message}
        error={error}
        confirmLabel={confirmLabel}
        pending={isPending}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
