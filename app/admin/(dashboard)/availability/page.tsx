import { requireRole } from "@/lib/auth/session";
import {
  getAvailableSlots,
  formatAthensTime,
  formatAthensDate,
  getAthensToday,
  toDateParam,
  addDays,
} from "@/lib/booking/slots";
import { listAvailabilityRules, listBlockedDates } from "@/lib/booking/repository";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  createBlockedDate,
  deleteBlockedDate,
} from "./actions";
import AvailabilityForms from "./AvailabilityForms";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default async function AvailabilityPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const [rules, blockedDates] = await Promise.all([listAvailabilityRules(), listBlockedDates()]);

  const previewDays = Array.from({ length: 7 }, (_, i) => addDays(getAthensToday(), i));
  const preview = await Promise.all(
    previewDays.map(async (day) => ({
      day,
      slots: await getAvailableSlots(day),
    }))
  );

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-light">Availability</h1>
      <p className="mb-10 text-sm text-muted">
        Define your recurring weekly hours, then block out specific dates or times as needed. Times
        are in Europe/Athens.
      </p>

      <AvailabilityForms
        createAvailabilityRule={createAvailabilityRule}
        createBlockedDate={createBlockedDate}
      />

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-light">Weekly hours</h2>
        {rules.length === 0 ? (
          <p className="text-sm text-muted">No availability defined yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between border border-white/10 px-4 py-3 text-sm"
              >
                <span>
                  {DAY_LABELS[rule.dayOfWeek]} · {minutesToTime(rule.startMinute)}–
                  {minutesToTime(rule.endMinute)}
                </span>
                <ConfirmSubmitButton
                  action={deleteAvailabilityRule.bind(null, rule.id)}
                  triggerLabel="Remove"
                  triggerClassName="focus-ring text-white/70 transition hover:text-white"
                  title="Remove these weekly hours?"
                  message={`${DAY_LABELS[rule.dayOfWeek]} · ${minutesToTime(rule.startMinute)}–${minutesToTime(rule.endMinute)} will no longer be bookable.`}
                  confirmLabel="Remove"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-light">Blocked dates</h2>
        {blockedDates.length === 0 ? (
          <p className="text-sm text-muted">No blocked dates yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {blockedDates.map((block) => {
              const blockLabel = `${block.date.toISOString().slice(0, 10)}${
                block.startMinute !== null && block.endMinute !== null
                  ? ` · ${minutesToTime(block.startMinute)}–${minutesToTime(block.endMinute)}`
                  : " · whole day"
              }${block.reason ? ` · ${block.reason}` : ""}`;
              return (
                <li
                  key={block.id}
                  className="flex items-center justify-between border border-white/10 px-4 py-3 text-sm"
                >
                  <span>{blockLabel}</span>
                  <ConfirmSubmitButton
                    action={deleteBlockedDate.bind(null, block.id)}
                    triggerLabel="Remove"
                    triggerClassName="focus-ring text-white/70 transition hover:text-white"
                    title="Remove this blocked date?"
                    message={`${blockLabel} will become bookable again.`}
                    confirmLabel="Remove"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-light">Next 7 days preview</h2>
        <div className="flex flex-col gap-3">
          {preview.map(({ day, slots }) => {
            const label = slots[0] ? formatAthensDate(slots[0]) : toDateParam(day);
            return (
              <div key={toDateParam(day)} className="border border-white/10 px-4 py-3 text-sm">
                <p className="mb-2 text-white/70">{label}</p>
                {slots.length === 0 ? (
                  <p className="text-muted">No open slots</p>
                ) : (
                  <p className="text-muted">{slots.map((s) => formatAthensTime(s)).join(", ")}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
