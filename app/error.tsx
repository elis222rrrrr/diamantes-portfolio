"use client";

import BracketButton from "@/components/ui/BracketButton";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <p className="tracked-label text-white/40">Error</p>
      <h1 className="text-2xl font-light">Something went wrong</h1>
      <p className="max-w-sm text-sm text-white/50">
        Please try again. If the problem continues, get in touch.
      </p>
      <BracketButton onClick={() => reset()} className="tracked-label mt-4 px-6 py-3">
        Try again
      </BracketButton>
    </div>
  );
}
