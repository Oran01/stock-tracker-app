/**
 * File: components/TradingViewWidget.tsx
 * Purpose: Generic wrapper for embedding TradingView widgets via script injection.
 * Exports: <TradingViewWidget /> (memoized)
 *
 * Key ideas:
 * - Wraps the low-level script injection logic provided by `useTradingViewWidget`.
 * - Supports optional title, custom height, and container styling.
 * - Widget is rendered inside a stable ref-controlled DOM node.
 *
 * @remarks
 * - Marked `"use client"` because TradingView requires DOM script injection.
 * - `<memo>` ensures parent re-renders do not recreate the widget unless props change.
 * - TradingView script tags must be appended to the DOM — cannot run on the server.
 * - `config` is JSON-injected into the script element; ensure values are serializable.
 */

"use client";

import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";
import { memo } from "react";

/**
 * TradingViewWidgetProps
 * @summary Props to configure a TradingView widget wrapper.
 *
 * @property title - Optional text displayed above the widget.
 * @property scriptUrl - TradingView script endpoint to load.
 * @property config - JSON config object passed to the script.
 * @property height - Height of the container in pixels (default: 600).
 * @property className - Optional Tailwind overrides for the wrapper.
 */
interface TradingViewWidgetProps {
  title?: string;
  scriptUrl: string;
  config: Record<string, unknown>;
  height?: number;
  className?: string;
}

/**
 * TradingViewWidget
 * @summary Reusable TradingView iframe/script widget with stable container ref.
 *
 * @example
 * <TradingViewWidget
 *   title="Market Overview"
 *   scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
 *   config={MARKET_OVERVIEW_WIDGET_CONFIG}
 *   height={480}
 * />
 *
 * @remarks
 * - Uses `useTradingViewWidget` to ensure the script loads **only once** per mount.
 * - The inner `<div class="tradingview-widget-container__widget">` is required
 *   by TradingView's own script loader — do not remove.
 * - For multiple widgets on the same page, always pass unique configs to avoid reuse.
 */
const TradingViewWidget = ({
  title,
  scriptUrl,
  config,
  height = 600,
  className,
}: TradingViewWidgetProps) => {
  // Hook returns a ref that handles script injection & cleanup.
  const containerRef = useTradingViewWidget(scriptUrl, config, height);

  return (
    <div className="w-full">
      {title && (
        <h3 className="font-semibold text-2xl text-gray-100 mb-5">{title}</h3>
      )}
      <div
        className={cn("tradingview-widget-container", className)}
        ref={containerRef}
      >
        {/* Required TradingView sub-container */}
        <div
          className="tradingview-widget-container__widget"
          style={{ height, width: "100%" }}
        />
      </div>
    </div>
  );
};

export default memo(TradingViewWidget);
