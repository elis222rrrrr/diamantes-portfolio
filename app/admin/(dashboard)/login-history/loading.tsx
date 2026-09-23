export default function LoginHistoryLoading() {
  return (
    <div className="max-w-4xl animate-pulse">
      <div className="mb-2 h-7 w-40 bg-white/10" />
      <div className="mb-10 h-4 w-64 bg-white/10" />

      <ul className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="h-12 border border-white/10 bg-white/5" />
        ))}
      </ul>
    </div>
  );
}
