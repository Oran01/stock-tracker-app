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

export function WatchlistTable({ watchlist }: WatchlistTableProps) {
  const router = useRouter();

  return (
    <>
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
