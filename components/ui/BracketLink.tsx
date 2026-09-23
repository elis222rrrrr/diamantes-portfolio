import Link from "next/link";
import type { ComponentProps } from "react";
import CornerBrackets from "./CornerBrackets";

type Props = ComponentProps<typeof Link> & { small?: boolean };

/** Link-flavored `BracketButton` — same viewfinder corner brackets, for
 * navigation rather than form submission. */
export default function BracketLink({ className = "", children, small, ...rest }: Props) {
  return (
    <Link
      className={`focus-ring relative text-foreground transition hover:text-[var(--focus-ring)] ${className}`}
      {...rest}
    >
      <CornerBrackets small={small} />
      {children}
    </Link>
  );
}
