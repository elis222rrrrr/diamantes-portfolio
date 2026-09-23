export default function JobsLoading() {
  return (
    <div className="max-w-4xl animate-pulse">
      <div className="mb-2 h-7 w-24 bg-white/10" />
      <div className="mb-10 h-4 w-full max-w-lg bg-white/10" />

      <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-white/10 px-4 py-3">
            <div className="mb-2 h-3 w-16 bg-white/10" />
            <div className="h-6 w-10 bg-white/5" />
          </div>
        ))}
      </div>

      <div className="mb-4 h-5 w-28 bg-white/10" />
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="h-16 border border-white/10 bg-white/5" />
        ))}
      </ul>
    </div>
  );
}
