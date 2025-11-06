/**
 * File: lib/nodemailer/index.ts
 * Purpose: Configure the Nodemailer transporter and expose email-sending helpers
 *          for welcome emails and daily news summary emails.
 * Exports: `transporter`, `sendWelcomeEmail`, `sendNewsSummaryEmail`
 *
 * Key ideas:
 * - Uses Gmail SMTP via Nodemailer with credentials from environment variables.
 * - HTML templates are injected via simple string replacement (lightweight, fast).
 * - Email formatting stays here; template markup lives in `./templates`.
 *
 * @remarks
 * - Server-only: import from server actions, API routes, Inngest jobs, or other Node contexts.
 *   Do NOT import in client components.
 * - Transporter is created once and reused (singleton).
 * - Requires `NODEMAILER_EMAIL` and `NODEMAILER_PASSWORD` env vars (e.g., `.env.local`, Vercel).
 * - Templates follow a `{{placeholder}}` convention for dynamic injection.
 * - For best deliverability, ensure the From domain has proper SPF/DKIM set up.
 *
 * @see https://nodemailer.com/smtp/
 * @see https://nodemailer.com/message/
 */

import {
  NEWS_SUMMARY_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";
import nodemailer from "nodemailer";

/**
 * Nodemailer SMTP transporter (Gmail).
 * @summary Reusable SMTP client configured for Gmail via environment variables.
 * @remarks
 * - Uses password auth. For Gmail, create an **App Password** on accounts with 2-Step Verification.
 * - Google no longer supports “Less secure apps”; use App Passwords or a proper SMTP account.
 */
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

/**
 * Send a personalized welcome email.
 * @summary Injects name + intro into the HTML template and sends via SMTP.
 * @param email - Recipient's email address.
 * @param name - Recipient's name used inside the greeting.
 * @param intro - Custom intro text injected into the template.
 * @returns Promise that resolves when the email is successfully sent.
 * @example
 * await sendWelcomeEmail({ email, name: "Oran", intro: "Let's get started!" });
 * @throws SMTP/auth/network errors if delivery fails.
 */
export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro
  );

  const mailOptions = {
    from: `"Signalist" <signalist@jsupport.pro>`,
    to: email,
    subject: `Welcome to Signalist - your stock market toolkit is ready!`,
    text: "Thanks for joining Signalist",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send a daily market news summary email.
 * @summary Injects date + HTML content into the news email template.
 * @param email - Recipient address.
 * @param date - Date string in human-readable format (e.g., "January 5, 2025").
 * @param newsContent - Already-rendered HTML list/summary of news items.
 * @returns Promise<void> once SMTP delivery is completed.
 * @remarks
 * - `newsContent` should be sanitized HTML since it is inserted as-is.
 * - Template placeholders: `{{date}}`, `{{newsContent}}`.
 * @throws SMTP/auth/network errors if delivery fails.
 */
export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date
  ).replace("{{newsContent}}", newsContent);

  const mailOptions = {
    from: `"Signalist News" <signalist@jsupport.pro>`,
    to: email,
    subject: `Market News Summary Today - ${date}`,
    text: `Today's market news summary from Signalist`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
