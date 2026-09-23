import type { InputHTMLAttributes } from "react";

type Size = "sm" | "md";

// Omit the native `size` attribute (a number, for character width) — this
// component's `size` prop is a styling variant instead, same name by
// coincidence.
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** sm = compact admin CRUD forms (px-3 py-2, the majority). md = the few
   * roomier, sparser public-facing forms (login, contact, booking) that
   * already used px-4 py-3 before this component existed. */
  size?: Size;
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
};

export default function Input({ size = "sm", className = "", ...rest }: Props) {
  return (
    <input
      className={`focus-ring border border-white/15 bg-transparent text-sm placeholder:text-white/30 ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    />
  );
}
