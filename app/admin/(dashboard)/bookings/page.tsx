import { requireRole } from "@/lib/auth/session";
import { formatAthensDate, formatAthensTime } from "@/lib/booking/slots";
import { listUpcomingBookings } from "@/lib/booking/repository";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Card from "@/components/ui/Card";
import { cancelBookingAsAdmin } from "./actions";

export default async function BookingsPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const bookings = await listUpcomingBookings();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-light">Bookings</h1>
      <p className="mb-10 text-sm text-muted">
        Upcoming calls, soonest first. Times are in Europe/Athens.
      </p>

      {bookings.length === 0 ? (
        <p className="text-sm text-muted">No upcoming bookings.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <Card as="li" key={booking.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">
                    {formatAthensDate(booking.start)} · {formatAthensTime(booking.start)}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{booking.name}</p>
                  <p className="text-sm text-muted">{booking.email}</p>
                  {booking.notes && <p className="mt-2 text-sm text-muted">{booking.notes}</p>}
                </div>
                <ConfirmSubmitButton
                  action={cancelBookingAsAdmin.bind(null, booking.id)}
                  triggerLabel="Cancel"
                  triggerClassName="focus-ring tracked-label text-white/70 transition hover:text-white"
                  title="Cancel this booking?"
                  message={`This will permanently cancel the call with ${booking.name}.`}
                  confirmLabel="Cancel booking"
                />
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
