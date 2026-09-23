type Bar = { label: string; value: number };

type Props = {
  bars: Bar[];
  formatValue?: (value: number) => string;
};

/** A minimal CSS bar chart — no charting dependency, matching the site's
 * black/white aesthetic. Fine for a small internal dashboard; worth
 * swapping for a real charting library if this needs to get more
 * interactive later. */
export default function BarChart({ bars, formatValue = (v) => String(v) }: Props) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="flex h-40 items-end gap-1">
      {bars.map((bar) => (
        <div
          key={bar.label}
          className="group relative h-full flex-1"
          title={`${bar.label}: ${formatValue(bar.value)}`}
        >
          <div
            className="absolute bottom-0 w-full bg-white/20 transition group-hover:bg-white/40"
            style={{ height: `${Math.max(2, (bar.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
