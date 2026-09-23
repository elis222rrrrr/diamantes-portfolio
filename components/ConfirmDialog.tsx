"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import FormError from "@/components/ui/FormError";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  error?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  error,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(isOpen, dialogRef, onCancel);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6"
        >
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-sm border border-white/15 bg-black p-6 text-white"
          >
            <h2 id="confirm-dialog-title" className="mb-3 text-lg font-light">
              {title}
            </h2>
            <p
              id="confirm-dialog-message"
              className={`text-sm text-muted ${error ? "mb-3" : "mb-8"}`}
            >
              {message}
            </p>
            <FormError error={error} className="mb-8" />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={pending}
                className="focus-ring tracked-label border border-white/15 px-4 py-2 text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                aria-busy={pending}
                className="focus-ring tracked-label border border-white/40 px-4 py-2 text-white transition hover:border-white disabled:opacity-50"
              >
                {pending ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
