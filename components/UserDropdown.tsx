/**
 * File: components/UserDropdown.tsx
 * Purpose: Authenticated-user menu shown in the navbar. Displays user info,
 *          provides logout, and exposes navigation items on mobile.
 * Exports: <UserDropdown />
 *
 * Key ideas:
 * - Uses shadcn/ui DropdownMenu for consistent styling.
 * - Shows avatar + name; falls back to user initial when no image.
 * - Logout executes server action `signOut()` and redirects to `/sign-in`.
 * - On small screens, NavItems are injected inside the dropdown (mobile UX).
 *
 * @remarks
 * - Never import this in server components (uses `use client` + routing).
 * - `initialStocks` is passed through to NavItems for search suggestions.
 * - AvatarImage here is static; you can later swap with user.profileImage if added.
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import { LogOut } from "lucide-react";
import NavItems from "@/components/NavItems";
import { signOut } from "@/lib/actions/auth.actions";

/**
 * UserDropdown
 * @summary Displays the authenticated user’s avatar, name, and menu actions.
 *
 * @param props.user - Authenticated user object (id, name, email).
 * @param props.initialStocks - Preloaded stock results passed to mobile NavItems.
 *
 * @example
 * <UserDropdown user={session.user} initialStocks={stocks} />
 *
 * @remarks
 * - Logout uses BetterAuth signOut server action; router pushes immediately after.
 * - NavItems are only rendered inside the dropdown for screens `< sm`.
 * - Avatar fallback uses the user's first character.
 */
const UserDropdown = ({
  user,
  initialStocks,
}: {
  user: User;
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const router = useRouter();

  // Log out, then redirect (avoids stale session UI)
  const handelSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 text-gray-400 hover:text-yellow-500"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
              {user.name[0]}
            </AvatarFallback>
          </Avatar>

          {/* Hide name on smaller screens for cleaner UI */}
          <div className="hidden md:flex flex-col items-start">
            <span className="text-base font-medium text-gray-400">
              {user.name}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-gray-400">
        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-base font-medium text-gray-400">
                {user.name}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-600" />
        <DropdownMenuItem
          onClick={handelSignOut}
          className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
          Logout
        </DropdownMenuItem>
        <DropdownMenuSeparator className="hidden sm:block bg-gray-600" />

        {/* On mobile, inject navigation items here (desktop has top nav bar) */}
        <nav className="sm:hidden">
          <NavItems initialStocks={initialStocks} />
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
