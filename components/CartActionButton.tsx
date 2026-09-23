import type { ReactNode, MouseEvent } from "react";
import { Check, Plus } from "lucide-react";
import CornerBrackets from "./ui/CornerBrackets";

type Props = {
  added: boolean;
  disabled?: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  /** Shop grid's quick-add sits in a tight card footer — smaller brackets,
   * padding, and icon than the full product page's button. */
  small?: boolean;
};

export default function CartActionButton({ added, disabled, onClick, children, small }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`focus-ring relative flex w-fit shrink-0 items-center text-foreground transition hover:text-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-foreground ${
        small ? "gap-1.5 px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2" : "gap-5 px-5 py-3"
      }`}
    >
      <CornerBrackets small={small} />
      {/* whitespace-nowrap: this button sits in a tight card footer beside
          color swatches (ProductCard) — without it, "Add to cart" wrapped
          onto 2-3 lines whenever the swatches left it too little width,
          instead of the button just staying one line at its natural
          (now much smaller) size. */}
      <span
        className={`tracked-label whitespace-nowrap font-bold ${small ? "text-[9px] sm:text-[10px]" : ""}`}
      >
        {children}
      </span>
      {added ? (
        <Check size={small ? 10 : 16} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
      ) : (
        <Plus size={small ? 10 : 16} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
      )}
    </button>
  );
}
