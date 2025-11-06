/**
 * File: lib/inngest/client.ts
 * Purpose: Initialize and export a singleton Inngest client configured for this app,
 *          including Gemini AI credentials for `step.ai` usage inside functions.
 * Exports: `inngest`
 *
 * Key ideas:
 * - Single shared client across all Inngest functions.
 * - App identity via `id` ensures events & runs are scoped to this application.
 * - AI configuration enables `step.ai.infer` with Gemini in function steps.
 *
 * @remarks
 * - **Server-only:** Import from server actions, API routes, or Inngest functions.
 *   Do NOT import in client components.
 * - Requires `GEMINI_API_KEY` in the environment.
 * - Keep the `id` stable across environments (dev/staging/prod may append suffixes if desired).
 *
 * @see https://www.inngest.com/docs
 */

import { Inngest } from "inngest";

/**
 * Inngest client (singleton).
 * @summary Configures the Inngest runtime for this app and wires Gemini credentials
 *          so functions can call `step.ai.infer(...)` without re-supplying keys.
 * @remarks
 * - `id: "Signalist"` identifies the app within Inngest.
 * - `ai.gemini.apiKey` reads from `process.env.GEMINI_API_KEY`.
 * - Prefer importing this client in your `lib/inngest/functions.ts` and related modules.
 */
export const inngest = new Inngest({
  id: "Signalist",
  ai: { gemini: { apiKey: process.env.GEMINI_API_KEY } },
});
