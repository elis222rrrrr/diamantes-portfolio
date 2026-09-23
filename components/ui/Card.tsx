import type { ReactNode } from "react";

type Props = {
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
};

/** The bordered list-item box used across every admin list page. */
export default function Card({ as = "div", className = "", children }: Props) {
  const Tag = as;
  return <Tag className={`border border-white/10 p-4 ${className}`}>{children}</Tag>;
}
