"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/auth/login-schema";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/auth/session";

const GENERIC_ERROR = "Invalid email or password.";
const THROTTLE_ERROR = "Too many attempts. Please try again later.";

// Burned once per server process so a missing-user lookup takes roughly as long
// as a real password check — avoids leaking account existence via response timing.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword("d3d-timing-safety-placeholder");
  }
  return dummyHashPromise;
}

export type LoginState = { error: string } | null;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }

  const { email, password } = parsed.data;

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerList.get("user-agent");

  if (await checkLoginRateLimit(email, ipAddress)) {
    await prisma.loginAttempt.create({
      data: { email, ipAddress, userAgent, success: false },
    });
    return { error: THROTTLE_ERROR };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  let valid: boolean;
  if (user) {
    valid = await verifyPassword(user.passwordHash, password);
  } else {
    // Still run a real argon2 verify against a burned dummy hash, so a
    // nonexistent email takes the same time as a wrong password.
    await verifyPassword(await getDummyHash(), password);
    valid = false;
  }

  if (!user || !valid || !user.isActive) {
    await prisma.loginAttempt.create({
      data: { email, ipAddress, userAgent, success: false, userId: user?.id },
    });
    return { error: GENERIC_ERROR };
  }

  await prisma.loginAttempt.create({
    data: { email, ipAddress, userAgent, success: true, userId: user.id },
  });

  await createSession(user.id);
  redirect("/admin");
}
