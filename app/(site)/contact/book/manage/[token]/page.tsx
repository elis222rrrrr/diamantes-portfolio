import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
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
import { findBookingByToken } from "@/lib/booking/repository";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import BracketLink from "@/components/ui/BracketLink";
import WeekDayPicker from "@/components/WeekDayPicker";
import { buildMetadata } from "@/lib/seo/metadata";
import { cancelBooking } from "./actions";
import RescheduleSlots from "./RescheduleSlots";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Manage Your Booking",
  description: "Manage or reschedule your call with Diamantes 3Designs.",
  path: "/contact/book/manage",
  noIndex: true,
});

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    justBooked?: string;
    cancelled?: string;
    rescheduled?: string;
    date?: string;
    week?: string;
  }>;
}) {
  const { token } = await params;
  const query = await searchParams;

  if (query.cancelled) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center text-white">
        <h1 className="mb-4 text-2xl font-light">Booking cancelled</h1>
        <p className="text-sm text-muted">
          Your call has been cancelled. Hope to hear from you again.
        </p>
        <Link href="/contact" className="focus-ring tracked-label mt-8 text-muted hover:text-white">
          Back to site
        </Link>
      </section>
    );
  }

  const booking = await findBookingByToken(token);
  if (!booking) notFound();

  // Right after booking or rescheduling, show a clean standalone confirmation
  // rather than dropping straight into the cancel/reschedule management UI.
  if (query.justBooked || query.rescheduled) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center text-white">
        <CheckCircle2 size={32} className="mb-6 text-white/70" />
        <p className="tracked-label mb-3 text-muted">
          {query.rescheduled ? "Rescheduled" : "Thank you"}
        </p>
        <h1 className="mb-4 text-3xl font-light">
          {query.rescheduled ? "Your call has been rescheduled" : "Your call is booked"}
        </h1>
        <p className="mb-2 text-lg text-white/70">
          {formatAthensDate(booking.start)} at {formatAthensTime(booking.start)} (Greece time)
        </p>
        <p className="mb-10 text-sm text-muted">
          A confirmation email is on its way to {booking.email}.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <BracketLink href={`/contact/book/manage/${token}`} className="tracked-label px-6 py-3">
            Manage this booking
          </BracketLink>
          <Link href="/" className="focus-ring tracked-label text-muted hover:text-white">
            Back to site
          </Link>
        </div>
      </section>
    );
  }

  const week = clampBookingWeek(Number(query.week ?? 0));
  const weekStart = addDays(getAthensToday(), week * 7);
  const selectedDate =
    query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? parseDateParam(query.date) : weekStart;
  const slots = await getAvailableSlots(selectedDate);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const param = toDateParam(date);
    return {
      date,
      href: `/contact/book/manage/${token}?date=${param}&week=${week}`,
      isActive: param === toDateParam(selectedDate),
    };
  });
  const prevHref = week > 0 ? `/contact/book/manage/${token}?week=${week - 1}` : null;
  const nextHref =
    week < MAX_BOOKING_WEEK ? `/contact/book/manage/${token}?week=${week + 1}` : null;

  return (
    <section className="flex flex-1 flex-col px-6 py-24 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <p className="tracked-label mb-3 text-muted">Manage booking</p>
        <h1 className="mb-2 text-3xl font-light">
          {formatAthensDate(booking.start)} at {formatAthensTime(booking.start)}
        </h1>
        <p className="mb-10 text-sm text-muted">
          {booking.name} · {booking.email}
        </p>

        <div className="mb-12">
          <ConfirmSubmitButton
            action={cancelBooking.bind(null, token)}
            triggerLabel="Cancel this booking"
            triggerClassName="focus-ring tracked-label relative w-fit px-6 py-3 text-foreground transition hover:text-[var(--focus-ring)]"
            bracket
            title="Cancel this booking?"
            message="This will cancel your call and free up the slot for someone else."
            confirmLabel="Cancel booking"
          />
        </div>

        <h2 className="mb-4 text-lg font-light">Reschedule</h2>
        <WeekDayPicker days={weekDays} prevHref={prevHref} nextHref={nextHref} />

        <RescheduleSlots
          token={token}
          slots={slots.map((slot) => ({ iso: slot.toISOString(), label: formatAthensTime(slot) }))}
        />
      </div>
    </section>
  );
}
