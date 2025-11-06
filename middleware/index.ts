/**
 * File: middleware/index.ts
 * Purpose: Gatekeep protected routes by verifying the BetterAuth session cookie.
 * Exports: `middleware` (Next.js edge middleware) and a `config.matcher` to scope it.
 *
 * Key ideas:
 * - Runs at the edge before your route handlers/pages.
 * - Fast check: only verifies that a session cookie exists (no DB lookup here).
 * - Redirects unauthenticated users to `/sign-in`.
 *
 * @remarks
 * Lightweight presence check to keep latency low. Deep validation (token, roles)
 * belongs in API routes/server actions. Matcher excludes static assets and auth
 * pages to avoid loops.
 *
 * @see https://www.better-auth.com/docs/integrations/waku#middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next.js Edge Middleware
 * @summary Redirect unauthenticated users to the sign-in page.
 * @param request - The incoming request (edge runtime).
 * @returns Redirect for unauthenticated requests; otherwise `NextResponse.next()`.
 */
export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // If the user is not authenticated, redirect to the sign-in page.
  // Note: This does NOT preserve the original destination.
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

/**
 * Middleware configuration
 * @summary Scope middleware to app routes while excluding assets and auth pages.
 */
export const config = {
  matcher: [
    // Everything except public/asset/auth routes
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)",
  ],
};
