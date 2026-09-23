import type { TextareaHTMLAttributes } from "react";

type Size = "sm" | "md";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: Size;
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
};

export default function Textarea({ size = "sm", className = "", ...rest }: Props) {
  return (
    <textarea
      className={`focus-ring resize-none border border-white/15 bg-transparent text-sm placeholder:text-white/30 ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    />
  );
}
