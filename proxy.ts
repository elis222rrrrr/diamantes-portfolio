import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Optimistic redirect only — checks cookie presence, no DB call, so this stays fast.
 * The real authorization boundary is requireSession()/requireRole() in lib/auth/session.ts,
 * called by every admin page and Server Action. Next's own docs warn Server Actions are
 * POST requests to their host route, so a matcher gap here would silently skip them too —
 * this proxy is a UX shortcut, not the security boundary.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
