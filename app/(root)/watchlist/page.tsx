/**
 * File: app/(root)/watchlist/page.tsx
 * Purpose: Authenticated Watchlist page showing the user's saved tickers with live quotes/metrics.
 * Exports: <Watchlist/> (server component)
 *
 * Key ideas:
 * - Server-loads the user's watchlist with enriched quote + fundamentals via `getWatchlistWithData()`.
 * - Provides a search affordance (⌘/Ctrl+K) to add/remove symbols using <SearchCommand/>.
 * - Renders a consistent empty state (icon, explainer, and search entry point) when no items exist.
 * - Uses <WatchlistTable/> for a real table layout with sticky header and sortable-looking columns.
 *
 * @remarks
 * - Runs as a server component under the auth-gated `(root)` layout, so `searchStocks()` and
 *   `getWatchlistWithData()` are safe to call server-side.
 * - `getWatchlistWithData()` returns a normalized row model (symbol, company, price, change, cap, P/E).
 * - The empty state keeps the page purposeful and routes users into the search flow.
 * - <SearchCommand/> receives `initialStocks` to avoid a cold start UX in the command menu.
 *
 * @see components/WatchlistTable.tsx
 * @see components/SearchCommand.tsx
 * @see lib/actions/watchlist.actions.ts#getWatchlistWithData
 * @see lib/actions/finnhub.actions.ts#searchStocks
 */

import { Star } from "lucide-react";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import SearchCommand from "@/components/SearchCommand";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { WatchlistTable } from "@/components/WatchlistTable";

const Watchlist = async () => {
  const watchlist = await getWatchlistWithData();
  const initialStocks = await searchStocks();

  // Empty state
  if (watchlist.length === 0) {
    return (
      <section className="flex watchlist-empty-container">
        <div className="watchlist-empty">
          <Star className="watchlist-star" />
          <h2 className="empty-title">Your watchlist is empty</h2>
          <p className="empty-description">
            Start building your watchlist by searching for stocks and clicking
            the star icon to add them.
          </p>
        </div>
        <SearchCommand initialStocks={initialStocks} />
      </section>
    );
  }

  return (
    <section className="watchlist">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="watchlist-title">Watchlist</h2>
          <SearchCommand initialStocks={initialStocks} />
        </div>
        <WatchlistTable watchlist={watchlist} />
      </div>
    </section>
  );
};

export default Watchlist;
