/**
 * File: components/WatchlistTable.tsx
 * Purpose: Render the user's watchlist as a sortable-looking, data-dense table.
 * Exports: <WatchlistTable />
 *
 * Key ideas:
 * - Uses shadcn/ui Table primitives for consistent styling + semantics.
 * - Headers come from `WATCHLIST_TABLE_HEADER` to keep the column order/config in one place.
 * - Entire row is clickable → navigates to the stock details page.
 *
 * @remarks
 * - The star/trash icon lives in its own leading column; row click is handled on <TableRow>.
 * - Formatters (price, change %, market cap) are precomputed upstream and passed in props.
 * - For large lists, consider windowing/virtualization to reduce DOM cost.
 */

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { cn, getChangeColorClass } from "@/lib/utils";
import WatchlistButton from "@/components/WatchlistButton";

/**
 * WatchlistTable
 * @summary Displays the authenticated user's watchlist with price, change, market cap, and P/E.
 *
 * @param props.watchlist - Array of watchlist rows already enriched for display
 *                          (see `StockWithData` type: includes formatted strings).
 * @returns A styled table with one row per symbol; clicking a row opens the symbol page.
 *
 * @example
 * <WatchlistTable watchlist={await getWatchlistWithData()} />
 *
 * @remarks
 * - Row navigation: clicking anywhere in the row (except interactive children that stop propagation)
 *   routes to `/stocks/[symbol]`.
 * - Visual polish: alternating row background, sticky header, borders that read like a real table.
 * - Accessibility: shadcn Table provides table semantics; consider adding `aria-label` on wrapper if needed.
 */
export function WatchlistTable({ watchlist }: WatchlistTableProps) {
  const router = useRouter();

  return (
    <>
      {/* Sticky header + bordered container to visually match a “real” financial table */}
      <Table className="scrollbar-hide-default watchlist-table border border-gray-700 rounded-xl overflow-hidden w-full">
        <TableHeader>
          <TableRow className="table-header-row bg-[#0f0f0f] border-b border-gray-700 sticky top-0 z-20">
            {WATCHLIST_TABLE_HEADER.map((label) => (
              <TableHead
                className="table-header px-4 py-3 font-medium text-gray-300 tracking-wide text-sm border-r border-gray-700 last:border-r-0 uppercase"
                key={label}
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlist.map((item, index) => (
            <TableRow
              key={item.symbol + index}
              className="table-row hover:bg-[#1a1a1a] cursor-pointer border-b border-gray-800 even:bg-[#0e0e0e]"
              onClick={() =>
                router.push(`/stocks/${encodeURIComponent(item.symbol)}`)
              }
            >
              {/* Leading control cell: watchlist toggle (icon only). Kept in its own 8x8 circle for visual consistency. */}
              <TableCell className="table-cell px-2 py-3 border-r border-gray-700">
                <div className="w-8 h-8 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-gray-800">
                  <WatchlistButton
                    symbol={item.symbol}
                    company={item.company}
                    isInWatchlist={true}
                    showTrashIcon={true}
                    type="icon"
                  />
                </div>
              </TableCell>

              <TableCell className="table-cell px-4 py-3 font-medium text-gray-200 border-r border-gray-700">
                {item.company}
              </TableCell>
              <TableCell className="table-cell px-4 py-3 text-sm border-r border-gray-700 last:border-r-0">
                {item.symbol}
              </TableCell>
              <TableCell className="table-cell px-4 py-3 text-sm border-r border-gray-700 last:border-r-0">
                {item.priceFormatted || "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "table-cell px-4 py-3 text-sm border-r border-gray-700 last:border-r-0",
                  getChangeColorClass(item.changePercent)
                )}
              >
                {item.changeFormatted || "—"}
              </TableCell>
              <TableCell className="table-cell px-4 py-3 text-sm border-r border-gray-700 last:border-r-0">
                {item.marketCap || "—"}
              </TableCell>
              <TableCell className="table-cell px-4 py-3 text-sm border-r border-gray-700 last:border-r-0">
                {item.peRatio || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
