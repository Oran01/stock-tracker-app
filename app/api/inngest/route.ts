/**
 * File: app/api/ingest/route.ts
 * Purpose: Exposes Inngest function handlers (HTTP endpoint) to Next.js via the App Router.
 * Exports: GET, POST, PUT (auto-generated handlers)
 *
 * Key ideas:
 * - Uses `serve()` from `inngest/next` to register serverless event endpoints
 *   that trigger Inngest functions.
 * - This is the public-facing entry point that Inngest calls to run queued jobs,
 *   cron tasks, and event-based workflows.
 * - Functions included: `sendSignUpEmail` (welcome email flow) and
 *   `sendDailyNewsSummary` (daily personalized market news digest).
 *
 * @remarks
 * - Route automatically supports GET/POST/PUT, as required by the Inngest platform.
 * - This file must live inside `app/api/[path]/route.ts` for Next.js App Router compatibility.
 * - No auth is needed here; Inngest authenticates requests via signatures.
 * - Do NOT add additional logic or side effects — the serverless runtime
 *   should only delegate to `serve()`.
 *
 * @see https://www.inngest.com/docs
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendDailyNewsSummary, sendSignUpEmail } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendSignUpEmail, sendDailyNewsSummary],
});
