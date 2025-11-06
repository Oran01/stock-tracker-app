/**
 * File: app/(root)/stocks/[symbol]/page.tsx
 * Purpose: Full stock details page with TradingView widgets, analytics charts,
 *          and watchlist integration for an authenticated user.
 * Exports: <StockDetails/> (server component)
 *
 * Key ideas:
 * - Server-loads all data needed for the page: quote, fundamentals, and watchlist state.
 * - Uses multiple TradingView widgets (symbol info, candlestick, baseline, TA, profile, financials).
 * - Supports add/remove watchlist actions via <WatchlistButton/>.
 * - Falls back to Next.js `notFound()` when invalid symbol data is returned.
 *
 * @remarks
 * - Runs as a **server component** within the authenticated `(root)` layout.
 *   `getStocksDetails()` and `getUserWatchlist()` execute safely on the server.
 * - Watchlist membership is determined by comparing normalized symbols
 *   (`item.symbol === symbol.toUpperCase()`).
 * - TradingView widgets are embedded via `<TradingViewWidget/>` which handles script injection
 *   and container lifecycle on the client.
 * - If a user navigates to an unsupported or unknown symbol, `notFound()` renders Next.js'
 *   404 UI.
 *
 * @see lib/actions/finnhub.actions.ts#getStocksDetails
 * @see lib/actions/watchlist.actions.ts#getUserWatchlist
 * @see components/TradingViewWidget.tsx
 * @see components/WatchlistButton.tsx
 */

import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import { WatchlistItem } from "@/database/models/watchlist.model";
import { getStocksDetails } from "@/lib/actions/finnhub.actions";
import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { notFound } from "next/navigation";

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  // Fetch stock fundamentals + pricing
  const stockData = await getStocksDetails(symbol.toUpperCase());
  const watchlist = await getUserWatchlist();

  // If API returns missing/invalid data → 404
  const isInWatchlist = watchlist.some(
    (item: WatchlistItem) => item.symbol === symbol.toUpperCase()
  );

  if (!stockData) notFound();

  return (
    <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left column — Price & charting */}
        <div className="flex flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
            height={170}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={600}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={600}
          />
        </div>

        {/* Right column — Actions & fundamentals */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <WatchlistButton
              symbol={symbol}
              company={stockData.company}
              isInWatchlist={isInWatchlist}
              type="button"
            />
          </div>

          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            height={400}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={440}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            height={464}
          />
        </div>
      </section>
    </div>
  );
}
