"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm">
        <p className="tracked-label mb-2 text-muted">Diamantes 3Designs</p>
        <h1 className="mb-8 text-3xl font-light">Admin Login</h1>

        <form action={formAction} className="flex flex-col gap-4">
          <label htmlFor="login-email" className="sr-only">
            Email
          </label>
          <Input
            required
            id="login-email"
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="username"
            size="md"
          />

          <label htmlFor="login-password" className="sr-only">
            Password
          </label>
          <Input
            required
            id="login-password"
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            size="md"
          />

          <FormError error={state?.error} />

          <Button
            type="submit"
            pending={pending}
            pendingLabel="Signing in…"
            className="mt-2 px-8 py-3"
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
