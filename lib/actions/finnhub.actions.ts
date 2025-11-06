/**
 * File: lib/actions/finnhub.actions.ts
 * Purpose: Server actions and helpers for interacting with the Finnhub API:
 *          market news, symbol search, and enriched stock details.
 * Exports: `fetchJSON`, `getNews`, `searchStocks`, `getStocksDetails`
 *
 * Key ideas:
 * - Uses Next.js `fetch` caching (`next.revalidate`) to balance freshness & API limits.
 * - Respects auth: server actions read BetterAuth session from `headers()` and
 *   redirect to `/sign-in` when absent (per UX).
 * - Normalizes Finnhub responses into UI-friendly shapes via utils.
 *
 * @remarks
 * - API keys: most functions prefer `FINNHUB_API_KEY` and fall back to `NEXT_PUBLIC_FINNHUB_API_KEY`.
 *   Note: `getStocksDetails` uses `NEXT_PUBLIC_FINNHUB_API_KEY` directly.
 *   Keep private keys server-side; only use `NEXT_PUBLIC_…` when intentionally exposing.
 * - Auth scope: only actions that need a session perform auth/redirect (e.g., `searchStocks`);
 *   others (e.g., `getNews`, `getStocksDetails`) do not require auth.
 * - Rate limits: cache durations are tuned (e.g., profile 1h, metrics 30m) to reduce calls.
 * - Error policy: fail fast on transport errors; return safe empties where appropriate.
 *
 * @see https://finnhub.io/docs/api
 */

"use server";

import {
  getDateRange,
  validateArticle,
  formatArticle,
  formatPrice,
  formatChangePercent,
  formatMarketCapValue,
} from "@/lib/utils";
import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import { cache } from "react";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getWatchlistSymbolsByEmail } from "./watchlist.actions";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY =
  process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

/**
 * Fetch JSON with optional ISR-style revalidation.
 * @summary Wraps `fetch(url, { next: { revalidate } })` for typed JSON responses.
 * @typeParam T - Expected JSON shape.
 * @param url - Absolute endpoint URL.
 * @param revalidateSeconds - If provided, enables Next.js cache with this TTL; otherwise `no-store`.
 * @returns Parsed JSON as type `T`.
 * @throws Error with status and body text when response is not OK.
 * @example
 * const quote = await fetchJSON<QuoteData>("https://finnhub.io/api/v1/quote?symbol=AAPL&token=…", 300);
 */
async function fetchJSON<T>(
  url: string,
  revalidateSeconds?: number
): Promise<T> {
  // Use ISR-style revalidation when provided; otherwise disable caching for correctness
  const options: RequestInit & { next?: { revalidate?: number } } =
    revalidateSeconds
      ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

/**
 * Get market news, optionally personalized by symbol list.
 * @summary For given symbols, fetch per-symbol company news and select up to 6 items round-robin;
 *          otherwise fall back to general market news (deduped, capped, formatted).
 * @param symbols - Optional array of symbols to personalize by; case/whitespace normalized.
 * @returns Up to 6 `MarketNewsArticle` items, newest first.
 * @remarks
 * - Company news window uses the last 5 days (via `getDateRange(5)`).
 * - Each symbol fetch is cached for 5 minutes (`revalidate: 300`); general news also 5 minutes.
 * - Deduplication uses a composite key `{id-url-headline}` for safety across feeds.
 * - Uses `validateArticle` before formatting; `formatArticle` trims & truncates summaries.
 * @throws Error `"Failed to fetch news"` on transport failures (logged server-side).
 */
export async function getNews(
  symbols?: string[]
): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error("FINNHUB API key is not configured");
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(
              sym
            )}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error("Error fetching company news for", sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin across symbols to avoid clumping all 6 from a single ticker
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      // Deduplicate conservatively across mixed feeds (ID/url/headline)
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique
      .slice(0, maxArticles)
      .map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error("getNews error:", err);
    throw new Error("Failed to fetch news");
  }
}

/**
 * Search stocks for the authenticated user with watchlist flags.
 * @summary When `query` is empty, returns top popular profiles (10); otherwise
 *          proxies Finnhub search and maps to a common shape with `isInWatchlist`.
 * @param query - Optional free text; empty/whitespace triggers the “popular” branch.
 * @returns Up to 15 items `{ symbol, name, exchange, type, isInWatchlist }`.
 * @remarks
 * - Auth required: may trigger a Next.js redirect to `/sign-in` if no BetterAuth session.
 * - Popular branch fetches `/stock/profile2` per symbol (revalidate 1h).
 * - Search branch uses `/search` (revalidate 30m).
 * - Exchange is best-effort: derived from `displaySymbol` or `profile.exchange`, else "US".
 * - Graceful failure: returns `[]` on missing API key or transport error.
 * - Wrapped in React `cache(...)` to memoize across a request lifecycle and avoid duplicate calls.
 */
export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user) redirect("/sign-in");

      const userWatchlistSymbols = await getWatchlistSymbolsByEmail(
        session.user.email
      );

      const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
      if (!token) {
        // If no token, log and return empty to avoid throwing per requirements
        console.error(
          "Error in stock search:",
          new Error("FINNHUB API key is not configured")
        );
        return [];
      }

      const trimmed = typeof query === "string" ? query.trim() : "";

      let results: FinnhubSearchResult[] = [];

      if (!trimmed) {
        // Fetch top 10 popular symbols' profiles
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profiles = await Promise.all(
          top.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
                sym
              )}&token=${token}`;
              // Revalidate every hour
              const profile = await fetchJSON<any>(url, 3600);
              return { sym, profile } as { sym: string; profile: any };
            } catch (e) {
              console.error("Error fetching profile2 for", sym, e);
              return { sym, profile: null } as { sym: string; profile: any };
            }
          })
        );

        results = profiles
          .map(({ sym, profile }) => {
            const symbol = sym.toUpperCase();
            const name: string | undefined =
              profile?.name || profile?.ticker || undefined;
            const exchange: string | undefined = profile?.exchange || undefined;
            if (!name) return undefined;
            const r: FinnhubSearchResult = {
              symbol,
              description: name,
              displaySymbol: symbol,
              type: "Common Stock",
            };
            // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
            // To keep pipeline simple, attach exchange via closure map stage
            // We'll reconstruct exchange when mapping to final type
            (r as any).__exchange = exchange; // internal only
            return r;
          })
          .filter((x): x is FinnhubSearchResult => Boolean(x));
      } else {
        const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(
          trimmed
        )}&token=${token}`;
        const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
        results = Array.isArray(data?.result) ? data.result : [];
      }

      const mapped: StockWithWatchlistStatus[] = results
        .map((r) => {
          const upper = (r.symbol || "").toUpperCase();
          const name = r.description || upper;
          const exchangeFromDisplay =
            (r.displaySymbol as string | undefined) || undefined;
          const exchangeFromProfile = (r as any).__exchange as
            | string
            | undefined;
          const exchange = exchangeFromDisplay || exchangeFromProfile || "US";
          const type = r.type || "Stock";
          const item: StockWithWatchlistStatus = {
            symbol: upper,
            name,
            exchange,
            type,
            isInWatchlist: userWatchlistSymbols.includes(
              r.symbol.toUpperCase()
            ),
          };
          return item;
        })
        .slice(0, 15);

      return mapped;
    } catch (err) {
      console.error("Error in stock search:", err);
      return [];
    }
  }
);

/**
 * Fetch enriched stock details for a single symbol.
 * @summary Parallel requests for quote, profile, and metrics; maps to UI-ready fields
 *          including formatted price, change %, market cap, and P/E.
 * @param symbol - Raw ticker (will be trimmed & uppercased).
 * @returns Object with:
 *  - `symbol`, `company`, `currentPrice`, `changePercent`
 *  - `priceFormatted`, `changeFormatted`, `marketCapFormatted`
 *  - `peRatio` (string; "—" when unavailable)
 * @remarks
 * - Freshness: quote is `no-store`; profile (1h) and metrics (30m) are cached.
 * - API key: this path uses `NEXT_PUBLIC_FINNHUB_API_KEY` directly.
 * - Validity check: throws if missing critical fields (`quote.c` or `profile.name`).
 * - Uses `formatPrice`, `formatChangePercent`, `formatMarketCapValue` for display.
 * - Wrapped with React `cache(...)` to dedupe calls for the same `symbol` in a request.
 * @throws Error `"Failed to fetch stock details"` on API/transport failure.
 */
export const getStocksDetails = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    // Quote must be fresh; profile/metrics change slowly → cache to reduce rate-limit pressure
    // Note: this call path uses NEXT_PUBLIC_FINNHUB_API_KEY directly
    const [quote, profile, financials] = await Promise.all([
      fetchJSON(
        // Price data - no caching for accuracy
        `${FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`
      ),
      fetchJSON(
        // Company info - cache 1hr (rarely changes)
        `${FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
        3600
      ),
      fetchJSON(
        // Financial metrics (P/E, etc.) - cache 30min
        `${FINNHUB_BASE_URL}/stock/metric?symbol=${cleanSymbol}&metric=all&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
        1800
      ),
    ]);

    // Type cast the responses
    const quoteData = quote as QuoteData;
    const profileData = profile as ProfileData;
    const financialsData = financials as FinancialsData;

    // Check if we got valid quote and profile data
    if (!quoteData?.c || !profileData?.name)
      throw new Error("Invalid stock data received from API");

    const changePercent = quoteData.dp || 0;
    const peRatio = financialsData?.metric?.peNormalizedAnnual || null;

    return {
      symbol: cleanSymbol,
      company: profileData?.name,
      currentPrice: quoteData.c,
      changePercent,
      priceFormatted: formatPrice(quoteData.c),
      changeFormatted: formatChangePercent(changePercent),
      peRatio: peRatio?.toFixed(1) || "—",
      marketCapFormatted: formatMarketCapValue(
        profileData?.marketCapitalization || 0
      ),
    };
  } catch (error) {
    console.error(`Error fetching details for ${cleanSymbol}:`, error);
    throw new Error("Failed to fetch stock details");
  }
});
