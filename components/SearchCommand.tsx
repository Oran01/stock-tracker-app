/**
 * File: components/SearchCommand.tsx
 * Purpose: Command palette for discovering stocks and adding them to the watchlist.
 * Exports: <SearchCommand />
 *
 * Key ideas:
 * - Uses shadcn/ui Command dialog for a fast, keyboard-first search experience.
 * - Debounced server search (`searchStocks`) with loading state and empty results UX.
 * - Defaults to curated "popular stocks" when the query is empty.
 * - Inline WatchlistButton lets users add/remove without leaving the dialog.
 *
 * @remarks
 * - Keyboard: toggles with ⌘/Ctrl + K (listener registered in `useEffect`).
 * - Auth: `searchStocks` enforces auth and may redirect if the session is missing.
 * - Accessibility: Command primitives provide ARIA semantics; keep labels meaningful.
 * - Performance: result list is small (≤15); for larger sets consider virtualization.
 */

"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";
import WatchlistButton from "./WatchlistButton";

/**
 * SearchCommand
 * @summary Command palette to search stocks and toggle watchlist entries in place.
 *
 * @param props.renderAs - Render trigger as a "button" (default) or inline "text".
 * @param props.label - Trigger label text (default: "Add stock").
 * @param props.initialStocks - Prefetched/popular results shown when there is no query.
 * @returns A keyboard-friendly search dialog with watchlist actions.
 *
 * @example
 * <SearchCommand renderAs="button" label="Add stock" initialStocks={popular} />
 *
 * @remarks
 * - Debounces search by 300ms to avoid spamming the API while typing.
 * - When a result is clicked, the dialog closes and the query resets.
 * - WatchlistButton uses optimistic UI and notifies the local list via `onWatchlistChange`.
 */
export default function SearchCommand({
  renderAs = "button",
  label = "Add stock",
  initialStocks,
}: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  // Keyboard shortcut: ⌘/Ctrl + K toggles the palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Server search with loading/empty handling
  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);

    setLoading(true);
    try {
      const results = await searchStocks(searchTerm.trim());
      setStocks(results);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce keystrokes to throttle network calls
  const debouncedSearch = useDebounce(handleSearch, 300);

  // Re-query when the term changes (debounced)
  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  // Selecting a stock: close dialog and reset state
  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  };

  // Keep local "isInWatchlist" flags in sync when user toggles
  const handleWatchlistChange = async (symbol: string, isAdded: boolean) => {
    setStocks(
      initialStocks?.map((stock) =>
        stock.symbol === symbol ? { ...stock, isInWatchlist: isAdded } : stock
      ) || []
    );
  };

  return (
    <>
      {renderAs === "text" ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {label}
        </Button>
      )}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="search-dialog"
      >
        <div className="search-field">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search stocks..."
            className="search-input"
          />
          {loading && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty className="search-list-empty">
              Loading stocks...
            </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <div className="search-list-indicator">
              {isSearchMode ? "No results found" : "No stocks available"}
            </div>
          ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? "Search results" : "Popular stocks"}
                {` `}({displayStocks?.length || 0})
              </div>
              {displayStocks?.map((stock, i) => (
                <li key={stock.symbol} className="search-item">
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    onClick={handleSelectStock}
                    className="search-item-link"
                  >
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="search-item-name">{stock.name}</div>
                      <div className="text-sm text-gray-500">
                        {stock.symbol} | {stock.exchange} | {stock.type}
                      </div>
                    </div>

                    {/* Inline star toggle for quick add/remove without leaving the dialog */}
                    <WatchlistButton
                      type="icon"
                      symbol={stock.symbol}
                      company={stock.name}
                      isInWatchlist={stock.isInWatchlist}
                      onWatchlistChange={handleWatchlistChange}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
