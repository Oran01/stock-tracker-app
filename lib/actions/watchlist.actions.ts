/**
 * File: lib/actions/watchlist.actions.ts
 * Purpose: Server-side actions for CRUD operations on the user watchlist and
 *          for enriching watchlist items with stock data.
 * Exports: `getWatchlistSymbolsByEmail`, `addToWatchlist`, `removeFromWatchlist`,
 *          `getUserWatchlist`, `getWatchlistWithData`
 *
 * Key ideas:
 * - **Server actions** (uses `"use server"` pragma).
 * - Auth via BetterAuth (`auth.api.getSession`) with `headers()` from Next.js.
 * - MongoDB/Mongoose data access; `.lean()` + JSON stringify to strip Mongoose docs.
 * - Revalidation of `/watchlist` after mutations.
 *
 * @remarks
 * - Server-only: do not import into client components.
 * - Assumes BetterAuth user records are stored in the `user` collection.
 * - Symbols are normalized to uppercase; company names are trimmed.
 * - Errors from DB/HTTP are caught and surfaced as generic messages (logged to server).
 *
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
 */

"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { revalidatePath } from "next/cache";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStocksDetails } from "@/lib/actions/finnhub.actions";

/**
 * Get all watchlist symbols for a given email.
 * @summary Looks up the BetterAuth user by email and returns their saved symbols.
 * @param email - User's email address.
 * @returns Array of ticker symbols (uppercase). Returns `[]` on not found or error.
 * @remarks
 * - Uses the raw MongoDB connection from the active Mongoose instance to read the `user` collection.
 * - Falls back safely (empty array) on any error.
 * - This helper is used by background jobs (e.g., news summaries) that operate by email.
 * @throws Never throws (errors are caught and logged).
 */
export async function getWatchlistSymbolsByEmail(
  email: string
): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // BetterAuth stores users in the "user" collection; we query it directly by email
    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || "");
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail error:", err);
    return [];
  }
}

/**
 * Add a stock to the authenticated user's watchlist.
 * @summary Requires a valid BetterAuth session; prevents duplicate symbols.
 * @param symbol - Stock symbol (will be normalized to uppercase).
 * @param company - Display name (trimmed).
 * @returns `{ success: true, message }` on success; `{ success: false, error }` if duplicate.
 * @remarks
 * - Authentication: derives the session from request `headers()` via BetterAuth.
 * - Revalidates the `/watchlist` path to refresh the UI after mutation.
 * - Duplicate prevention is done via a `findOne` check; consider a unique index on `{userId, symbol}` for stronger guarantees.
 * @throws May trigger a Next.js redirect to `/sign-in` when unauthenticated; otherwise throws a generic error on DB failure.
 */
export const addToWatchlist = async (symbol: string, company: string) => {
  try {
    const session = await auth.api.getSession({
      // Retrieve request headers for BetterAuth session extraction inside a server action
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    // Check if stock already exists in watchlist
    const existingItem = await Watchlist.findOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    if (existingItem) {
      return { success: false, error: "Stock already in watchlist" };
    }

    // Add to watchlist
    const newItem = new Watchlist({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
      company: company.trim(),
    });

    await newItem.save();
    // Ensure the Watchlist page reflects the latest changes immediately
    revalidatePath("/watchlist");

    return { success: true, message: "Stock added to watchlist" };
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw new Error("Failed to add stock to watchlist");
  }
};

/**
 * Remove a stock from the authenticated user's watchlist.
 * @summary Requires a valid BetterAuth session; deletes by `{ userId, symbol }`.
 * @param symbol - Stock symbol (will be normalized to uppercase).
 * @returns `{ success: true, message }` on success.
 * @remarks
 * - Revalidates `/watchlist` after deletion.
 * - Silent if the symbol was not present; no error if nothing was removed.
 * @throws Redirects to `/sign-in` if unauthenticated; throws generic error on DB failure.
 */
export const removeFromWatchlist = async (symbol: string) => {
  try {
    const session = await auth.api.getSession({
      // Retrieve request headers for BetterAuth session extraction inside a server action
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    // Remove from watchlist
    await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });
    revalidatePath("/watchlist");

    return { success: true, message: "Stock removed from watchlist" };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw new Error("Failed to remove stock from watchlist");
  }
};

/**
 * Fetch the authenticated user's raw watchlist items.
 * @summary Returns an array of watchlist documents sorted by `addedAt` (desc).
 * @returns Plain JSON (Mongoose docs are stripped via `lean()` + `JSON.stringify/parse`).
 * @remarks
 * - Use this when you need raw watchlist fields from the DB schema.
 * - For UI display with pricing/changes, prefer `getWatchlistWithData()`.
 * @throws Redirects to `/sign-in` if unauthenticated; throws generic error on DB failure.
 */
export const getUserWatchlist = async () => {
  try {
    const session = await auth.api.getSession({
      // Retrieve request headers for BetterAuth session extraction inside a server action
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    const watchlist = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(watchlist));
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};

/**
 * Fetch the authenticated user's watchlist with live stock data.
 * @summary Enriches each watchlist item with current price, change %, market cap, and P/E.
 * @returns Array of items; fully enriched when data is available, otherwise the original DB item is returned for that symbol. Returns `[]` if none.
 * @remarks
 * - Calls `getStocksDetails(symbol)` for each item; on failure, logs a warning and returns the original watchlist item (not fully enriched).
 * - Consider pagination for large lists (one request per symbol).
 * - Returns plain JSON objects (no Mongoose prototypes).
 * @throws Redirects to `/sign-in` if unauthenticated; throws generic error on data/DB failure.
 * @see {@link getStocksDetails}
 */
export const getWatchlistWithData = async () => {
  try {
    const session = await auth.api.getSession({
      // Retrieve request headers for BetterAuth session extraction inside a server action
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    const watchlist = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    if (watchlist.length === 0) return [];

    const stocksWithData = await Promise.all(
      watchlist.map(async (item) => {
        const stockData = await getStocksDetails(item.symbol);

        if (!stockData) {
          console.warn(`Failed to fetch data for ${item.symbol}`);
          return item;
        }

        return {
          company: stockData.company,
          symbol: stockData.symbol,
          currentPrice: stockData.currentPrice,
          priceFormatted: stockData.priceFormatted,
          changeFormatted: stockData.changeFormatted,
          changePercent: stockData.changePercent,
          marketCap: stockData.marketCapFormatted,
          peRatio: stockData.peRatio,
        };
      })
    );

    return JSON.parse(JSON.stringify(stocksWithData));
  } catch (error) {
    console.error("Error loading watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};
