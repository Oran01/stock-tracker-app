/**
 * File: components/Header.tsx
 * Purpose: Top-level site header containing the logo, navigation items,
 *          and the authenticated user's dropdown menu.
 * Exports: <Header />
 *
 * Key ideas:
 * - Server Component: fetches `initialStocks` on the server via `searchStocks()`
 *   so SearchCommand (inside NavItems/UserDropdown) can hydrate instantly.
 * - Responsive: navigation items hidden on mobile; user menu always visible.
 * - Sticky: remains fixed at the top of the viewport for persistent navigation.
 *
 * @remarks
 * - `searchStocks()` is invoked without a query → returns the "popular stocks" set.
 * - Logo uses Next.js <Image> for optimized loading.
 * - UserDropdown receives both `user` (BetterAuth session user) and `initialStocks`
 *   for watchlist-aware search UI.
 */

import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import Image from "next/image";
import Link from "next/link";

/**
 * Header
 * @summary Renders the site-wide header: logo, navigation links, and user dropdown.
 *
 * @param props.user - Authenticated user object from BetterAuth.
 *
 * @example
 * <Header user={session.user} />
 */
const Header = async ({ user }: { user: User }) => {
  // Prefetch "popular stocks" for instantaneous search experience.
  const initialStocks = await searchStocks();
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        {/* Logo → returns home */}
        <Link href="/">
          <Image
            src="/assets/icons/logo.svg"
            alt="Signalist logo"
            width={140}
            height={32}
            className="h-8 w-auto cursor-pointer"
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden sm:block">
          <NavItems initialStocks={initialStocks} />
        </nav>

        {/* User menu (always visible) */}
        <UserDropdown user={user} initialStocks={initialStocks} />
      </div>
    </header>
  );
};

export default Header;
