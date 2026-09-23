import BracketLink from "@/components/ui/BracketLink";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <p className="tracked-label text-white/40">404</p>
      <h1 className="text-2xl font-light">Page not found</h1>
      <p className="max-w-sm text-sm text-white/50">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <BracketLink href="/" className="tracked-label mt-4 px-6 py-3">
        Back to site
      </BracketLink>
    </div>
  );
}
