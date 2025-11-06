/**
 * File: lib/inngest/functions.ts
 * Purpose: Inngest background functions for transactional emails (welcome)
 *          and daily market news summaries (fetch → summarize via AI → email).
 * Exports: `sendSignUpEmail`, `sendDailyNewsSummary`
 *
 * Key ideas:
 * - Event-driven + cron-based orchestration using Inngest.
 * - Steps are explicit (`step.run`, `step.ai.infer`) for observability and retries.
 * - Finishes with Nodemailer delivery using HTML templates.
 *
 * @remarks
 * - Privacy: Prompts include user metadata (country/goals/risk/industry). Avoid
 *   including any additional PII. Log only non-sensitive data.
 * - Idempotency: Inngest provides safe retries per step; ensure downstream
 *   actions (like email) are effectively idempotent (e.g., step names + delivery logs).
 * - Scheduling: Cron `"0 12 * * *"` runs at **12:00 UTC** daily (adjust content timing accordingly).
 * - Dependencies: `getNews`, `getWatchlistSymbolsByEmail`, and mail templates must
 *   remain stable; failures should be handled step-by-step to avoid aborting the batch.
 *
 * @see https://www.inngest.com/docs/functions
 * @see https://www.inngest.com/docs/schedules/cron
 */

import { getNews } from "@/lib/actions/finnhub.actions";
import { getAllUsersFormNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getFormattedTodayDate } from "@/lib/utils";

/**
 * Personalized welcome email on user creation.
 * @summary Listens to `app/user.created`, generates an intro via AI from the user's
 *          sign-up profile, and sends a welcome email via Nodemailer.
 * @event app/user.created
 * @steps
 * - Build a small user profile snippet (country/goals/risk/industry).
 * - `step.ai.infer`: generate friendly intro with Gemini 2.5 (flash-lite).
 * - `step.run("send-welcome-email")`: deliver via `sendWelcomeEmail`.
 * @returns `{ success: true, message: string }` on completion.
 * @remarks
 * - Fallback intro is used if the AI response is empty or unstructured.
 * - Keep prompts minimal to reduce token usage and latency.
 * - AI model: `gemini-2.5-flash-lite` for fast, low-cost text generation.
 * - Avoid logging `event.data.email` directly; prefer masked logging if needed.
 * @throws Network/SMTP errors during email delivery will be surfaced by the step.
 * @see https://www.inngest.com/docs/functions/steps
 */
export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

/**
 * Daily personalized market news summaries.
 * @summary Triggers by event (`app/send.daily.news`) or daily cron (`0 12 * * *`),
 *          fetches per-user watchlist news, summarizes via AI, and emails results.
 * @triggers
 * - `app/send.daily.news` (manual/event-based)
 * - Cron: `0 12 * * *` (12:00 UTC daily)
 * @steps
 * 1) `get-all-users`: fetch recipients for news delivery.
 * 2) `fetch-user-news`: for each user, get watchlist symbols → fetch news (fallback to general).
 * 3) `step.ai.infer`: summarize article list into HTML snippets per user.
 * 4) `send-news-emails`: parallelized Nodemailer delivery with date + summary.
 * @returns `{ success: boolean, message: string }` with a high-level status.
 * @remarks
 * - Caps articles per user to 6 to keep emails concise and within token limits.
 * - `newsContent` is inserted as HTML; ensure upstream sanitization.
 * - AI failures for a given user fall back to `"No market news."` content (or skip).
 * - Cron executes in UTC; ensure “today” formatting via `getFormattedTodayDate()`.
 * - Consider recording delivery outcomes (success/failure) for auditability/idempotency.
 * @throws Upstream fetch/AI/SMTP errors are isolated by steps; the function continues
 *         for other users whenever possible.
 * @see https://www.inngest.com/docs/schedules/cron
 * @see https://www.inngest.com/docs/functions/ai
 */
export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  // [{ event: "app/send.daily.news" }, { cron: "* * * * *" }],
  async ({ step }) => {
    // Step #1: Get all users fore news delivery
    const users = await step.run("get-all-users", getAllUsersFormNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };

    // Step #2: Fetch personalized news for each user
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{ user: User; articles: MarketNewsArticle[] }> = [];
      for (const user of users as User[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // Step #3: Summarize news via AI for each user
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newData}}",
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent });
      } catch (e) {
        console.error("Failed to summarize news for :", user.email);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: Send emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);
