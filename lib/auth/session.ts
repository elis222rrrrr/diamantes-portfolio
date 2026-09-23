import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

/** Periodic sweep (instrumentation.ts) — there's no TTL doing this
 * automatically the way Redis's EXPIRE did, so expired rows accumulate until
 * swept. Safe to run redundantly from more than one replica at once (a plain
 * idempotent DELETE, no lock needed). */
export async function deleteExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
}

// expiresAt is the sole source of truth for expiry, checked on every lookup —
// an expired-but-not-yet-swept row is treated exactly like a missing one, so
// the sweep above is a cleanup convenience, not a correctness requirement.
// role/isActive are deliberately NOT cached on Session: a single indexed
// User PK lookup is cheap, and keeping it live means a deactivated user or a
// changed role takes effect on their very next request instead of waiting
// out the session's full 7-day duration.
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt <= new Date()) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
});

/** For pages/layouts: redirects to login if there's no valid session. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** For pages/layouts: redirects if the session's role isn't in `roles`. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.role)) redirect("/admin");
  return session;
}

/** For Server Actions: throws instead of redirecting, since redirecting mid-mutation is awkward. */
export async function requireSessionForAction(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireRoleForAction(roles: Role[]): Promise<SessionUser> {
  const session = await requireSessionForAction();
  if (!roles.includes(session.role)) throw new UnauthorizedError();
  return session;
}
