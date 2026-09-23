type Props = {
  error?: string | null;
  className?: string;
};

/** Renders nothing when there's no error — callers don't need their own `&&` guard. */
export default function FormError({ error, className = "" }: Props) {
  if (!error) return null;
  return (
    <p role="alert" className={`text-sm text-red-400 ${className}`}>
      {error}
    </p>
  );
}
