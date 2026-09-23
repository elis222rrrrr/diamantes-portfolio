import type { SelectHTMLAttributes } from "react";

type Size = "sm" | "md";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  size?: Size;
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
};

export default function Select({ size = "sm", className = "", children, ...rest }: Props) {
  return (
    <select
      className={`focus-ring border border-white/15 bg-transparent text-sm ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}
