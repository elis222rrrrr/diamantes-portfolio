"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormError from "@/components/ui/FormError";
import type { ActionState } from "./actions";

const DAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

type Props = {
  createAvailabilityRule: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  createBlockedDate: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

const labelClass = "text-xs text-muted";

export default function AvailabilityForms({ createAvailabilityRule, createBlockedDate }: Props) {
  const [ruleState, ruleAction, rulePending] = useActionState(createAvailabilityRule, null);
  const [blockState, blockAction, blockPending] = useActionState(createBlockedDate, null);

  return (
    <div className="mb-12 grid gap-8 sm:grid-cols-2">
      <form action={ruleAction} className="border border-white/10 p-4">
        <fieldset className="flex flex-col gap-3">
          <legend className="tracked-label mb-1 text-muted">Add weekly hours</legend>

          <label htmlFor="rule-day" className={labelClass}>
            Day of week
          </label>
          <Select id="rule-day" name="dayOfWeek" defaultValue={1}>
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value} className="bg-black">
                {d.label}
              </option>
            ))}
          </Select>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="rule-start" className={labelClass}>
                Start time
              </label>
              <Input
                id="rule-start"
                type="time"
                name="startTime"
                required
                className="w-full"
                defaultValue="09:00"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="rule-end" className={labelClass}>
                End time
              </label>
              <Input
                id="rule-end"
                type="time"
                name="endTime"
                required
                className="w-full"
                defaultValue="17:00"
              />
            </div>
          </div>

          <FormError error={ruleState?.error} />
          <Button type="submit" pending={rulePending} pendingLabel="Adding…" className="px-4 py-2">
            Add
          </Button>
        </fieldset>
      </form>

      <form action={blockAction} className="border border-white/10 p-4">
        <fieldset className="flex flex-col gap-3">
          <legend className="tracked-label mb-1 text-muted">Block a date</legend>

          <label htmlFor="block-date" className={labelClass}>
            Date
          </label>
          <Input id="block-date" type="date" name="date" required />

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="block-start" className={labelClass}>
                Start time (optional)
              </label>
              <Input id="block-start" type="time" name="startTime" className="w-full" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="block-end" className={labelClass}>
                End time (optional)
              </label>
              <Input id="block-end" type="time" name="endTime" className="w-full" />
            </div>
          </div>

          <label htmlFor="block-reason" className={labelClass}>
            Reason (optional)
          </label>
          <Input id="block-reason" type="text" name="reason" />

          <p className="text-xs text-muted">Leave start/end blank to block the whole day.</p>
          <FormError error={blockState?.error} />
          <Button type="submit" pending={blockPending} pendingLabel="Adding…" className="px-4 py-2">
            Add
          </Button>
        </fieldset>
      </form>
    </div>
  );
}
