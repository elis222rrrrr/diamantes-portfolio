import type { ButtonHTMLAttributes } from "react";
import CornerBrackets from "./CornerBrackets";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: string;
  small?: boolean;
};

/**
 * The "Add to cart" viewfinder look (`CartActionButton`'s corner brackets,
 * no border line, hover-to-accent-color) generalized into a shared button —
 * most of the site's CTAs are on this now. The Hero's EXPLORE link and the
 * Journal filter bar keep their own dashed-frame + solid-corner-square
 * treatment instead (hand-authored inline, not this component).
 */
export default function BracketButton({
  pending,
  pendingLabel,
  disabled,
  className = "",
  children,
  type = "button",
  small,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled ?? pending}
      aria-busy={pending}
      className={`focus-ring relative text-foreground transition hover:text-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-foreground ${className}`}
      {...rest}
    >
      <CornerBrackets small={small} />
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
