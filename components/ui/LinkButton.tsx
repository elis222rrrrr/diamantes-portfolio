import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    className?: string;
    children: ReactNode;
  };

/** Same visual identity as Button, for navigation rather than a form action
 * — the "New product" / "New project" style link at the top of every admin
 * list page. */
export default function LinkButton({ className = "", children, ...rest }: Props) {
  return (
    <Link
      className={`focus-ring tracked-label border border-white/15 px-4 py-2 text-white/70 transition hover:border-white/40 hover:text-white ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
