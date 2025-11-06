/**
 * File: hooks/useTradingViewWidget.tsx
 * Purpose: Client-side hook for embedding TradingView widgets by dynamically
 *          injecting their script + config into a container.
 * Exports: `useTradingViewWidget`
 *
 * Key ideas:
 * - TradingView widgets are script-based → must run on the client.
 * - Ensures a widget is only injected once per mount (via `data-loaded` flag).
 * - Cleans up on unmount to prevent duplicate widgets during client transitions.
 *
 * @remarks
 * - TradingView scripts must be added with inline JSON config as `script.innerHTML`.
 * - Height is customizable and applied to the inner widget container.
 * - This hook does not validate configs; caller must supply a valid widget config.
 * - Safe for use in any Client Component (Next.js app router).
 */

"use client";

import { useEffect, useRef } from "react";

/**
 * useTradingViewWidget
 * @summary Mounts a TradingView widget by injecting its script and config into a div.
 *
 * @param scriptUrl - The TradingView CDN script for the widget.
 * @param config - The JSON configuration object TradingView expects.
 * @param height - Optional widget height in px (default: 600).
 * @returns A `ref` to attach to the widget container div.
 *
 * @example
 * const ref = useTradingViewWidget(
 *   "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
 *   CONFIG_OBJECT
 * );
 * return <div ref={ref} />;
 *
 * @remarks
 * - Widget loads only once per mount via `data-loaded`.
 * - On unmount, the widget is removed and the container reset.
 * - Must be used in `"use client"` components because TradingView scripts rely on DOM.
 */
const useTradingViewWidget = (
  scriptUrl: string,
  config: Record<string, unknown>,
  height = 600
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.dataset.loaded) return;
    containerRef.current.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.innerHTML = JSON.stringify(config);

    containerRef.current.appendChild(script);
    containerRef.current.dataset.loaded = "true";

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        delete containerRef.current.dataset.loaded;
      }
    };
  }, [scriptUrl, config, height]);

  return containerRef;
};

export default useTradingViewWidget;
