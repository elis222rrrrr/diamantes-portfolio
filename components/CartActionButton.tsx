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
      className={`focus-ring relative flex w-fit items-center text-foreground transition hover:text-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-foreground ${
        small ? "gap-3 px-3 py-2" : "gap-5 px-5 py-3"
      }`}
    >
      <CornerBrackets small={small} />
      <span className={`tracked-label font-bold ${small ? "text-[10px]" : ""}`}>{children}</span>
      {added ? (
        <Check size={small ? 12 : 16} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Plus size={small ? 12 : 16} strokeWidth={2.5} aria-hidden="true" />
      )}
    </button>
  );
}
