/**
 * File: lib/utils.ts
 * Purpose: Shared UI and formatting helpers used across the app (Tailwind class merging,
 *          time formatting, market cap/price formatting, date utilities, and news helpers).
 * Exports: `cn`, `formatTimeAgo`, `delay`, `formatMarketCapValue`, `getDateRange`,
 *          `getTodayDateRange`, `calculateNewsDistribution`, `validateArticle`,
 *          `getTodayString`, `formatArticle`, `formatChangePercent`,
 *          `getChangeColorClass`, `formatPrice`, `formatDateToday`, `getAlertText`,
 *          `getFormattedTodayDate`.
 *
 * Key ideas:
 * - Keep utilities **pure** and UI-agnostic where possible.
 * - Do not throw on missing/partial data: return safe fallbacks like `"N/A"` or `""`.
 * - Prefer preformatted strings in UI to avoid repeating locale logic.
 *
 * @remarks
 * - `cn` is the canonical way to merge Tailwind classNames (clsx + tailwind-merge).
 * - Time and date helpers assume **UTC** unless specified.
 * - News helpers operate on the global `RawNewsArticle` type.
 *
 * @see https://github.com/lukeed/clsx
 * @see https://github.com/dcastil/tailwind-merge
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine/merge Tailwind class names.
 * @summary Safely merges conditional class strings using `clsx` and resolves Tailwind conflicts via `tailwind-merge`.
 * @param inputs - Class name values or conditionals.
 * @returns Merged class string with conflicts resolved (e.g., `px-2` overrides `px-4`).
 * @example
 * <div className={cn("px-4", isCompact && "px-2")} />
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Human-friendly "time ago" label for timestamps.
 * @summary Converts a UNIX timestamp (in **seconds**) to a relative label like "5 minutes ago".
 * @param timestamp - UNIX timestamp in **seconds** (not ms).
 * @returns Relative time label: minutes, hours, or days.
 * @example
 * formatTimeAgo( Math.floor(Date.now()/1000) - 90 ); // "1 minute ago"
 * @remarks
 * Expects a past UNIX timestamp in **seconds**. Passing milliseconds or a future
 * timestamp will produce negative or incorrect durations.
 */
export const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diffInMs = now - timestamp * 1000;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInHours > 24) {
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (diffInHours >= 1) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
};

/**
 * Delay helper for async flows.
 * @summary Promise-based timeout.
 * @param ms - Milliseconds to wait.
 * @returns Promise that resolves after `ms`.
 * @example
 * await delay(300); // useful in demos/tests/backoffs
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Market cap formatter (USD).
 * @summary Formats numbers to compact strings: "$3.10T", "$900.00B", "$25.00M".
 * @param marketCapUsd - Market cap in raw USD.
 * @returns Formatted string or "N/A" for invalid/non-positive values.
 * @example
 * formatMarketCapValue(3200000000000) // "$3.20T"
 */
export function formatMarketCapValue(marketCapUsd: number): string {
  if (!Number.isFinite(marketCapUsd) || marketCapUsd <= 0) return "N/A";

  if (marketCapUsd >= 1e12) return `$${(marketCapUsd / 1e12).toFixed(2)}T`; // Trillions
  if (marketCapUsd >= 1e9) return `$${(marketCapUsd / 1e9).toFixed(2)}B`; // Billions
  if (marketCapUsd >= 1e6) return `$${(marketCapUsd / 1e6).toFixed(2)}M`; // Millions
  return `$${marketCapUsd.toFixed(2)}`; // Below one million, show full USD amount
}

/**
 * Date range helper.
 * @summary Returns `{from,to}` (YYYY-MM-DD) for the last N days ending today (UTC).
 * @param days - Number of days to go back from today.
 * @returns Object with `from` and `to` ISO date strings (YYYY-MM-DD).
 */
export const getDateRange = (days: number) => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - days);
  return {
    to: toDate.toISOString().split("T")[0],
    from: fromDate.toISOString().split("T")[0],
  };
};

/**
 * Today's date range.
 * @summary Returns `{from,to}` both equal to today (YYYY-MM-DD, UTC).
 */
export const getTodayDateRange = () => {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  return {
    to: todayString,
    from: todayString,
  };
};

/**
 * News distribution heuristic.
 * @summary Decide how many news items to show per symbol given watchlist size.
 * @param symbolsCount - Number of symbols in the watchlist.
 * @returns Items per symbol and a target total count cap (default 6).
 * @example
 * // 2 symbols => 3 items each; 3 symbols => 2 each; >3 => 1 each (up to 6 total)
 */
export const calculateNewsDistribution = (symbolsCount: number) => {
  let itemsPerSymbol: number;
  let targetNewsCount = 6;

  if (symbolsCount < 3) {
    itemsPerSymbol = 3; // Fewer symbols, more news each
  } else if (symbolsCount === 3) {
    itemsPerSymbol = 2; // Exactly 3 symbols, 2 news each = 6 total
  } else {
    itemsPerSymbol = 1; // Many symbols, 1 news each
    targetNewsCount = 6; // Don't exceed 6 total
  }

  return { itemsPerSymbol, targetNewsCount };
};

/**
 * Article field guard.
 * @summary Check that a raw article has the minimum required fields.
 * @param article - Raw article object.
 * @returns Truthy if headline, summary, url, and datetime exist.
 */
export const validateArticle = (article: RawNewsArticle) =>
  article.headline && article.summary && article.url && article.datetime;

/**
 * Today's date (YYYY-MM-DD).
 * @summary Shortcut to today's UTC date string.
 */
export const getTodayString = () => new Date().toISOString().split("T")[0];

/**
 * Format an article for the UI layer.
 * @summary Normalizes `RawNewsArticle` into `MarketNewsArticle` shape with safe fallbacks.
 * @param article - Raw article (may have optional fields).
 * @param isCompanyNews - Whether this is company-specific context (affects defaults/truncation).
 * @param symbol - Optional related symbol used when `isCompanyNews` is true.
 * @param index - Offset used to produce unique IDs in list contexts.
 * @returns A normalized article object suitable for rendering.
 * @remarks
 * - Assumes the caller has already validated the article using `validateArticle()`.
 * - When `isCompanyNews` is true, `symbol` must be provided.
 * - Summaries are trimmed and truncated (200 chars for company news, 150 otherwise).
 * - For company news, the generated `id` is non-deterministic (Date.now + Math.random),
 *   which is suitable for rendering keys but not for persistent storage.
 */
export const formatArticle = (
  article: RawNewsArticle,
  isCompanyNews: boolean,
  symbol?: string,
  index: number = 0
) => ({
  id: isCompanyNews ? Date.now() + Math.random() : article.id + index,
  headline: article.headline!.trim(),
  summary:
    article.summary!.trim().substring(0, isCompanyNews ? 200 : 150) + "...",
  source: article.source || (isCompanyNews ? "Company News" : "Market News"),
  url: article.url!,
  datetime: article.datetime!,
  image: article.image || "",
  category: isCompanyNews ? "company" : article.category || "general",
  related: isCompanyNews ? symbol! : article.related || "",
});

/**
 * Change percent formatter.
 * @summary Convert a number like -1.234 to "-1.23%"; adds "+" sign for positives.
 * @param changePercent - Raw percent value (e.g., 1.23 for +1.23%).
 * @returns A formatted percent string. Returns an empty string when the value is
 *          `undefined`, `null`, or `0` (zero is treated as “no change”).
 */
export const formatChangePercent = (changePercent?: number) => {
  if (!changePercent) return "";
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(2)}%`;
};

/**
 * Change-based color helper.
 * @summary Returns a Tailwind text color class based on sign of the change.
 * @param changePercent - Raw percent value.
 * @returns "text-green-500" | "text-red-500" | "text-gray-400".
 *          Zero and undefined are treated as “no change”.
 */
export const getChangeColorClass = (changePercent?: number) => {
  if (!changePercent) return "text-gray-400";
  return changePercent > 0 ? "text-green-500" : "text-red-500";
};

/**
 * USD price formatter.
 * @summary Formats a number as USD currency using the `en-US` locale.
 * @param price - Raw price number.
 * @returns Currency string (e.g., "$1,234.56").
 * @remarks Always formats in USD; does not auto-detect user locale or currency.
 * @see https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
 */
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
};

/**
 * Human-readable "today" (UTC).
 * @summary Example: "Thursday, January 1, 1970".
 * @remarks
 * Evaluated once at module import time. If you need a dynamic “today” value,
 * use `getFormattedTodayDate()` instead. Fixed to UTC for consistency.
 */
export const formatDateToday = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Alert text builder.
 * @summary Create a human-readable condition string for an alert threshold.
 * @param alert - Alert object containing type ("upper" | "lower") and threshold.
 * @returns Example: "Price > $120.00".
 */
export const getAlertText = (alert: Alert) => {
  const condition = alert.alertType === "upper" ? ">" : "<";
  return `Price ${condition} ${formatPrice(alert.threshold)}`;
};

/**
 * Today's date (UTC, long form).
 * @summary Equivalent to `formatDateToday`, kept for semantic clarity in call sites.
 */
export const getFormattedTodayDate = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
