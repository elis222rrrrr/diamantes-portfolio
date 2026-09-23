"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormError from "@/components/ui/FormError";
import type { ActionState } from "./actions";

const labelClass = "text-xs text-muted";

const ROLE_OPTIONS = ["OWNER", "ADMIN", "EDITOR"] as const;

type User = {
  name: string | null;
  email: string;
  role: "OWNER" | "ADMIN" | "EDITOR";
  isActive: boolean;
};

type Props = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  user?: User;
  submitLabel: string;
};

export default function UserForm({ action, user, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label htmlFor="user-name" className={labelClass}>
        Name (optional)
      </label>
      <Input id="user-name" type="text" name="name" defaultValue={user?.name ?? ""} />

      {user ? (
        <>
          <span className={labelClass}>Email</span>
          <p className="text-sm text-white/70">{user.email}</p>
        </>
      ) : (
        <>
          <label htmlFor="user-email" className={labelClass}>
            Email
          </label>
          <Input id="user-email" type="email" name="email" required />

          <label htmlFor="user-password" className={labelClass}>
            Password
          </label>
          <Input id="user-password" type="password" name="password" required minLength={8} />
        </>
      )}

      <label htmlFor="user-role" className={labelClass}>
        Role
      </label>
      <Select id="user-role" name="role" defaultValue={user?.role ?? "EDITOR"}>
        {ROLE_OPTIONS.map((role) => (
          <option key={role} value={role} className="bg-black">
            {role}
          </option>
        ))}
      </Select>

      {user && (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="isActive" defaultChecked={user.isActive} />
          Active (can sign in)
        </label>
      )}

      <FormError error={state?.error} />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Saving…"
        className="mt-2 w-fit px-6 py-3"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
