import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getAvailableSlots,
  getAthensToday,
  formatAthensDate,
  formatAthensTime,
  parseDateParam,
  toDateParam,
  addDays,
  clampBookingWeek,
  MAX_BOOKING_WEEK,
} from "@/lib/booking/slots";
import { buildMetadata } from "@/lib/seo/metadata";
import WeekDayPicker from "@/components/WeekDayPicker";
import BracketLink from "@/components/ui/BracketLink";
import BookingDetailsForm from "./BookingDetailsForm";

export const metadata = buildMetadata({
  title: "Book a Call",
  description: "Book a 30-minute call with Diamantes 3Designs.",
  path: "/contact/book",
});

export const dynamic = "force-dynamic";

export default async function BookCallPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; slot?: string; week?: string }>;
}) {
  const params = await searchParams;
  const week = clampBookingWeek(Number(params.week ?? 0));
  const weekStart = addDays(getAthensToday(), week * 7);
  const selectedDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? parseDateParam(params.date)
      : weekStart;
  const slots = await getAvailableSlots(selectedDate);

  const selectedSlot = params.slot ? slots.find((s) => s.toISOString() === params.slot) : undefined;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const param = toDateParam(date);
    return {
      date,
      href: `/contact/book?date=${param}&week=${week}`,
      isActive: param === toDateParam(selectedDate),
    };
  });
  const prevHref = week > 0 ? `/contact/book?week=${week - 1}` : null;
  const nextHref = week < MAX_BOOKING_WEEK ? `/contact/book?week=${week + 1}` : null;

  return (
    <section className="flex flex-1 flex-col px-6 py-24 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/#contact"
          className="focus-ring tracked-label mb-8 inline-flex items-center gap-2 text-muted transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        <p className="tracked-label mb-3 text-muted">Book a call</p>
        <div className="mb-3 h-px w-6" style={{ backgroundColor: "var(--focus-ring)" }} />
        <h1 className="mb-10 text-3xl font-light">30 minutes, Greece time.</h1>

        {selectedSlot ? (
          <BookingDetailsForm
            startIso={selectedSlot.toISOString()}
            dateLabel={formatAthensDate(selectedSlot)}
            timeLabel={formatAthensTime(selectedSlot)}
            backHref={`/contact/book?date=${toDateParam(selectedDate)}&week=${week}`}
          />
        ) : (
          <>
            <WeekDayPicker days={weekDays} prevHref={prevHref} nextHref={nextHref} />

            {slots.length === 0 ? (
              <p className="text-sm text-muted">No open slots on this date, try another day.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <BracketLink
                    key={slot.toISOString()}
                    href={`/contact/book?date=${toDateParam(selectedDate)}&week=${week}&slot=${encodeURIComponent(slot.toISOString())}`}
                    small
                    className="px-4 py-2"
                  >
                    {formatAthensTime(slot)}
                  </BracketLink>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
