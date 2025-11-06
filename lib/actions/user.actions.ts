/**
 * File: lib/actions/user.actions.ts
 * Purpose: Server action to fetch a minimal list of users eligible for news emails.
 * Exports: `getAllUsersFormNewsEmail`
 *
 * Key ideas:
 * - Server-only action (uses `"use server"`).
 * - Reads the BetterAuth `user` collection via the raw MongoDB handle from Mongoose.
 * - Returns a compact shape `{ id, email, name }` filtered to valid recipients.
 *
 * @remarks
 * - Privacy: Only the fields required for email delivery are returned.
 * - Projection is used to reduce payload (`_id`, `id`, `email`, `name`, `country`).
 * - Errors are caught and logged; the function returns `[]` on failure.
 */

"use server";

import { connectToDatabase } from "@/database/mongoose";

/**
 * Fetch users for news email delivery.
 * @summary Returns a minimal list of users `{ id, email, name }` where `email` and `name` exist.
 * @returns Array of `{ id: string; email: string; name: string }`. Returns `[]` on any error.
 * @remarks
 * - Uses the raw MongoDB database handle from the active Mongoose connection.
 * - Reads from the BetterAuth `user` collection and applies a projection to limit fields.
 * - `id` falls back to Mongo `_id` string if BetterAuth `id` is missing.
 * - Intended for background jobs (e.g., Inngest daily news summary).
 * - Logging includes an error message; consider masking PII in production logs.
 * @throws Never throws; errors are caught and an empty array is returned.
 */
export const getAllUsersFormNewsEmail = async () => {
  try {
    const mongoose = await connectToDatabase();

    // Ensure a live MongoDB connection before querying the BetterAuth `user` collection
    const db = mongoose.connection.db;
    if (!db) throw new Error("Mongoose connection not connected");

    // Fetch only records with a non-null email and project just the fields we need
    const users = await db
      .collection("user")
      .find(
        { email: { $exists: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      )
      .toArray();

    // Normalize to a minimal, transport-friendly shape for downstream email jobs
    return users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: user.id || user._id?.toString() || "",
        email: user.email,
        name: user.name,
      }));
  } catch (e) {
    console.error("Error fetching users for news email:", e);
    return [];
  }
};
