export default function MessagesLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="mb-2 h-7 w-32 bg-white/10" />
      <div className="mb-10 h-4 w-56 bg-white/10" />

      <ul className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="border border-white/10 p-4">
            <div className="mb-2 h-4 w-48 bg-white/10" />
            <div className="h-3 w-full bg-white/5" />
          </li>
        ))}
      </ul>
    </div>
  );
}
