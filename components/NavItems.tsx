/**
 * File: components/NavItems.tsx
 * Purpose: Render the top-level navigation items, including the SearchCommand trigger.
 * Exports: <NavItems />
 *
 * Key ideas:
 * - Highlights the active route using `usePathname()`.
 * - Supports both static nav links and the special `/search` item, which renders
 *   the global SearchCommand palette.
 * - Responsive: vertical list on mobile, horizontal on desktop.
 *
 * @remarks
 * - `initialStocks` hydrates the SearchCommand so it can show popular stocks
 *   instantly before 서버 search.
 * - Active state logic is prefix-based (`pathname.startsWith`) except for `/`.
 */

"use client";

import SearchCommand from "@/components/SearchCommand";
import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * NavItems
 * @summary Renders the navigation bar links and inserts a SearchCommand trigger
 *          where the config defines `href: "/search"`.
 *
 * @param props.initialStocks - Prefetched stock list passed into SearchCommand.
 *
 * @example
 * <NavItems initialStocks={popularStocks} />
 */
const NavItems = ({
  initialStocks,
}: {
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const pathname = usePathname();

  // Route match helper: exact match for "/", prefix match for everything else
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";

    return pathname.startsWith(path);
  };
  return (
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {NAV_ITEMS.map(({ href, label }) => {
        if (href === "/search")
          return (
            <li key="search-trigger">
              <SearchCommand
                renderAs="text"
                label="Search"
                initialStocks={initialStocks}
              />
            </li>
          );

        return (
          <li key={href}>
            <Link
              href={href}
              className={`hover:text-yellow-500 transition-colors ${
                isActive(href) ? "text-gray-100" : ""
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;
