/**
 * File: database/models/watchlist.model.ts
 * Purpose: Mongoose model representing a user's watchlist entry.
 * Exports: `Watchlist` (Mongoose Model), `WatchlistItem` (TypeScript interface)
 *
 * Key ideas:
 * - Each entry represents **one stock** added by a **specific user**.
 * - Enforces uniqueness on `{ userId, symbol }` to prevent duplicates.
 * - Symbols are normalized to uppercase and trimmed for consistency.
 *
 * @remarks
 * - No automatic timestamps (`timestamps: false`) since `addedAt` represents
 *   the creation moment explicitly.
 * - `userId` is indexed to optimize frequent queries like
 *   `getWatchlistSymbolsByEmail()` and `getUserWatchlist()`.
 * - Use this model only after establishing a MongoDB connection via
 *   `connectToDatabase()` to avoid model re-registration issues.
 */

import { Schema, model, models, type Document, type Model } from "mongoose";

export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

const WatchlistSchema = new Schema<WatchlistItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Prevent duplicate symbols per user
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Watchlist: Model<WatchlistItem> =
  (models?.Watchlist as Model<WatchlistItem>) ||
  model<WatchlistItem>("Watchlist", WatchlistSchema);
