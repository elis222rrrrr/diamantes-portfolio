type Props = {
  label: string;
  side?: "left" | "right";
  className?: string;
  /** Opt-in — most DotLine usages (About, PortfolioHero) are static; only
   * the Hero's asked to blink. See .dot-flash in globals.css. */
  flash?: boolean;
  /** Opt-in — tints the dot with the site's one accent color instead of
   * the neutral --nav-dot-color, for the handful of Hero dots meant to
   * read as a "live" indicator rather than plain bullet-point styling. */
  accent?: boolean;
};

export default function DotLine({
  label,
  side = "left",
  className = "",
  flash = false,
  accent = false,
}: Props) {
  const line = <div className="h-px w-16 bg-white/15" />;
  const dot = (
    <span
      className={`nav-dot${flash ? " dot-flash" : ""}`}
      style={accent ? { background: "var(--focus-ring)" } : undefined}
    />
  );
  const text = <span className="tracked-label text-white/50">{label}</span>;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {side === "left" ? (
        <>
          {text}
          {dot}
          {line}
        </>
      ) : (
        <>
          {line}
          {dot}
          {text}
        </>
      )}
    </div>
  );
}
