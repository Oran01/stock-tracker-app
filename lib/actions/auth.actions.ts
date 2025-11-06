/**
 * File: lib/actions/auth.actions.ts
 * Purpose: Server actions for BetterAuth authentication flows (sign-up, sign-in, sign-out)
 *          and dispatching onboarding events to Inngest.
 * Exports: `signUpWithEmail`, `signInWithEmail`, `signOut`
 *
 * Key ideas:
 * - Thin wrappers around BetterAuth's `auth.api.*` server methods.
 * - Uses Next.js Server Actions (`"use server"`) — never runs on the client.
 * - Sign-up triggers an Inngest event (`app/user.created`) to generate a personalized welcome email.
 *
 * @remarks
 * - Auth: all actions call `auth.api.*` directly, no session required except for sign-out.
 * - Error policy: catch & return a consistent `{ success, error }` response instead of throwing.
 * - Inngest events: only sign-up emits onboarding data; sign-in and sign-out are synchronous.
 * - Security: passwords never logged; headers must come from `next/headers()` for server-side auth.
 */

"use server";

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";

/**
 * Create a new BetterAuth email/password user and emit an Inngest onboarding event.
 * @summary Wraps `auth.api.signUpEmail` and forwards extended profile fields to Inngest.
 * @returns `{ success, data }` on success; `{ success: false, error }` on failure.
 * @remarks
 * - Inngest event: `app/user.created` triggers personalized welcome email generation.
 * - Does NOT sign the user in automatically (BetterAuth handles this via config).
 */
export const signUpWithEmail = async ({
  email,
  password,
  fullName,
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({
      body: { email, password: password, name: fullName },
    });

    if (response) {
      await inngest.send({
        name: "app/user.created",
        data: {
          email,
          name: fullName,
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
        },
      });
    }

    return { success: true, data: response };
  } catch (e) {
    console.log("Sign up failed", e);
    return { success: false, error: "Sign up failed" };
  }
};

/**
 * Sign out the current user.
 * @summary Calls BetterAuth `auth.api.signOut` with server request headers.
 * @remarks
 * - Requires server `headers()` so BetterAuth can read the session cookie.
 * - Returns a safe `{ success, error }` instead of throwing.
 */
export const signOut = async () => {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (e) {
    console.log("Sign out failed", e);
    return { success: false, error: "Sign out failed" };
  }
};

/**
 * Sign in a user using BetterAuth email/password.
 * @summary Wrapper around `auth.api.signInEmail`.
 * @returns `{ success, data }` or `{ success: false, error }` on failure.
 */
export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    const response = await auth.api.signInEmail({
      body: { email, password: password },
    });

    return { success: true, data: response };
  } catch (e) {
    console.log("Sign in failed", e);
    return { success: false, error: "Sign in failed" };
  }
};
