export default function AvailabilityLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="mb-2 h-7 w-40 bg-white/10" />
      <div className="mb-10 h-4 w-full max-w-lg bg-white/10" />

      <div className="mb-12 grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-3 border border-white/10 p-4">
          <div className="h-3 w-28 bg-white/10" />
          <div className="h-9 w-full bg-white/5" />
          <div className="flex gap-3">
            <div className="h-9 flex-1 bg-white/5" />
            <div className="h-9 flex-1 bg-white/5" />
          </div>
          <div className="h-9 w-20 bg-white/10" />
        </div>
        <div className="flex flex-col gap-3 border border-white/10 p-4">
          <div className="h-3 w-24 bg-white/10" />
          <div className="h-9 w-full bg-white/5" />
          <div className="flex gap-3">
            <div className="h-9 flex-1 bg-white/5" />
            <div className="h-9 flex-1 bg-white/5" />
          </div>
          <div className="h-9 w-20 bg-white/10" />
        </div>
      </div>

      <div className="mb-12">
        <div className="mb-4 h-5 w-32 bg-white/10" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-11 border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 h-5 w-40 bg-white/10" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
