import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: string;
};

/**
 * The one button style this app uses everywhere — outlined, never filled.
 * Owns the identity classes (border, focus-ring, hover, disabled) that were
 * previously copy-pasted across ~15 files; padding/width/layout stay
 * per-call-site via `className`, since those genuinely vary by context.
 */
export default function Button({
  pending,
  pendingLabel,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled ?? pending}
      aria-busy={pending}
      className={`focus-ring border border-white/15 text-sm transition hover:border-white/40 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
