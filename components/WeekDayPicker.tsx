import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDayLabel, type DateParts } from "@/lib/booking/slots";

type Day = {
  date: DateParts;
  href: string;
  isActive: boolean;
};

type Props = {
  days: Day[];
  prevHref: string | null;
  nextHref: string | null;
};

const arrowClass =
  "focus-ring shrink-0 border border-white/10 p-2 text-muted transition hover:border-white/30 hover:text-white";
const arrowDisabledClass = "shrink-0 border border-white/5 p-2 text-white/15";

export default function WeekDayPicker({ days, prevHref, nextHref }: Props) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {prevHref ? (
        <Link href={prevHref} aria-label="Previous week" className={arrowClass}>
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span aria-hidden className={arrowDisabledClass}>
          <ChevronLeft size={16} />
        </span>
      )}

      <div className="flex flex-wrap gap-2">
        {days.map((day) => (
          <Link
            key={day.href}
            href={day.href}
            aria-current={day.isActive ? "date" : undefined}
            className={`focus-ring border px-3 py-2 text-xs transition ${
              day.isActive
                ? "border-white/40 text-white"
                : "border-white/10 text-muted hover:border-white/30 hover:text-white"
            }`}
          >
            {formatDayLabel(day.date)}
          </Link>
        ))}
      </div>

      {nextHref ? (
        <Link href={nextHref} aria-label="Next week" className={arrowClass}>
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span aria-hidden className={arrowDisabledClass}>
          <ChevronRight size={16} />
        </span>
      )}
    </div>
  );
}
