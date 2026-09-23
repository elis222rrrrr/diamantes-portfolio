export default function ManageBookingLoading() {
  return (
    <section className="flex flex-1 flex-col px-6 py-24 text-white">
      <div className="mx-auto w-full max-w-2xl animate-pulse">
        <div className="mb-3 h-3 w-32 bg-white/10" />
        <div className="mb-2 h-8 w-80 bg-white/10" />
        <div className="mb-10 h-4 w-56 bg-white/10" />

        <div className="mb-12 h-12 w-48 border border-white/15 bg-white/5" />

        <div className="mb-4 h-5 w-28 bg-white/10" />
        <div className="mb-6 flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 w-20 border border-white/10 bg-white/5" />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-20 border border-white/15 bg-white/5" />
          ))}
        </div>
      </div>
    </section>
  );
}
