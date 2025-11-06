/**
 * File: components/WatchlistButton.tsx
 * Purpose: Toggle a symbol in/out of the user's watchlist with optimistic UI and debounce.
 * Exports: <WatchlistButton />
 *
 * Key ideas:
 * - Optimistic UI: flips local state immediately; server call follows.
 * - Debounced mutations: prevents rapid double-clicks from spamming the API.
 * - Two render modes:
 *    - `type="icon"`: star-only control for dense table rows.
 *    - `type="button"`: label button, optionally with trash icon when removing.
 *
 * @remarks
 * - Clicks call `stopPropagation()` to avoid triggering parent row navigation (e.g., table rows).
 * - Parent can sync external state via `onWatchlistChange(symbol, isAdded)`.
 * - Toasts provide user feedback for add/remove actions.
 */

"use client";

import { useDebounce } from "@/hooks/useDebounce";
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import { Star, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * WatchlistButton
 * @summary UI control that adds/removes a stock from the user's watchlist.
 *
 * @param props.symbol - Ticker symbol (e.g., "AAPL").
 * @param props.company - Human-readable company name (used in toasts).
 * @param props.isInWatchlist - Initial membership state for optimistic UI.
 * @param props.showTrashIcon - When `type="button"` and removing, show a trash icon.
 * @param props.type - "icon" | "button" (defaults to "button").
 * @param props.onWatchlistChange - Optional callback for parent state sync `(symbol, isAdded)`.
 * @returns A button that toggles watchlist membership.
 *
 * @example
 * <WatchlistButton
 *   symbol="AAPL"
 *   company="Apple Inc."
 *   isInWatchlist={true}
 *   type="icon"
 *   onWatchlistChange={(sym, added) => console.log(sym, added)}
 * />
 *
 * @remarks
 * - Debounced 300ms to coalesce repeated clicks and reduce API load.
 * - Optimistic update first; server mutation follows. On server failure, consider adding a rollback.
 * - Accessibility: supplies `title`/`aria-label` in icon mode for SR users.
 */

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  // Optimistic local state reflecting current watchlist membership
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  // Server mutation: add or remove depending on current optimistic state
  const toggleWatchlist = async () => {
    const result = added
      ? await removeFromWatchlist(symbol)
      : await addToWatchlist(symbol, company);

    if (result.success) {
      toast.success(added ? "Removed from Watchlist" : "Added to Watchlist", {
        description: `${company} ${
          added ? "removed from" : "added to"
        } your watchlist`,
      });

      // Notify parent component of watchlist change for state synchronization
      onWatchlistChange?.(symbol, !added);
    }
    // Note: If desired, handle server failure by reverting `setAdded(prev => !prev)`
  };

  // Debounce the toggle function to avoid rapid-fire API calls on repeated clicks
  const debouncedToggle = useDebounce(toggleWatchlist, 300);

  // Click handler uses optimistic update + debounced server call
  const handleClick = (e: React.MouseEvent) => {
    // Prevent row-level navigation (e.g., parent <TableRow onClick>)
    e.stopPropagation();
    e.preventDefault();

    setAdded(!added);
    debouncedToggle();
  };

  if (type === "icon") {
    return (
      <button
        title={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        aria-label={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
      >
        <Star fill={added ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <button
      className={`watchlist-btn ${added ? "watchlist-remove" : ""}`}
      onClick={handleClick}
    >
      {showTrashIcon && added ? <Trash2 /> : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;
