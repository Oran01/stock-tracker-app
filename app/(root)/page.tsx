/**
 * File: app/(root)/page.tsx
 * Purpose: Dashboard home page showing real-time market widgets powered by TradingView.
 * Exports: <Home/> (server component)
 *
 * Key ideas:
 * - Renders four primary TradingView widgets: Market Overview, Heatmap,
 *   Top Stories, and Market Data.
 * - Uses <TradingViewWidget/> to unify script loading, container setup,
 *   configuration passing, and cleanup.
 * - Layout is split into two vertical sections, each using a responsive grid.
 *
 * @remarks
 * - This page is server-rendered but includes client-side widgets injected
 *   at runtime via the TradingView embed script.
 * - All widget configs live in `lib/constants.ts` to keep UI declarative.
 * - You can adjust height and layout without touching embed logic.
 * - The base TradingView script URL is composed dynamically using the
 *   widget type (market-overview.js, timeline.js, etc.).
 *
 * @see https://www.tradingview.com/widget/timeline/
 * @see https://www.tradingview.com/widget/market-overview/
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
 */

import TradingViewWidget from "@/components/TradingViewWidget";
import {
  HEATMAP_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  MARKET_OVERVIEW_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
} from "@/lib/constants";

const Home = () => {
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
  return (
    <div className="flex min-h-screen home-wrapper">
      <section className="grid w-full gap-8 home-section">
        <div className="md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            title="Market Overview"
            scriptUrl={`${scriptUrl}market-overview.js`}
            config={MARKET_OVERVIEW_WIDGET_CONFIG}
            className="custom-chart"
            height={600}
          />
        </div>
        <div className="md:col-span-1 xl:col-span-2">
          <TradingViewWidget
            title="Stock Heatmap"
            scriptUrl={`${scriptUrl}stock-heatmap.js`}
            config={HEATMAP_WIDGET_CONFIG}
            height={600}
          />
        </div>
      </section>
      <section className="grid w-full gap-8 home-section">
        <div className="h-full md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}timeline.js`}
            config={TOP_STORIES_WIDGET_CONFIG}
            className="custom-chart"
            height={600}
          />
        </div>
        <div className="h-full md:col-span-1 xl:col-span-2">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}market-quotes.js`}
            config={MARKET_DATA_WIDGET_CONFIG}
            height={600}
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
