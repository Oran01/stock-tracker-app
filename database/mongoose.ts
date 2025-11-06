/**
 * File: database/mongoose.ts
 * Purpose: Provide a stable, cached MongoDB connection for all server-side code.
 * Exports: `connectToDatabase`
 *
 * Key ideas:
 * - Uses a global cache (`global.mongooseCache`) to prevent re-opening connections
 *   during hot reloads or across server actions / edge-less SSR calls.
 * - Ensures a single shared Mongoose connection inside the Next.js runtime.
 * - Prevents "Cannot overwrite `X` model once compiled" and connection storms.
 *
 * @remarks
 * - Requires `MONGODB_URI` inside `.env`.
 * - `bufferCommands: false` prevents queued operations when disconnected.
 * - Logs environment + URI (safe for dev; avoid printing full URI in production).
 *
 * @see https://mongoosejs.com/docs/connections.html
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Reuse the memoized global connection in Next.js runtime and hot reload
let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Establish (or reuse) a MongoDB connection via Mongoose.
 * @summary Returns a shared, cached Mongoose connection. Ensures that all
 *          server actions, API routes, and background jobs reuse the same instance.
 *
 * @returns The active Mongoose connection instance.
 * @throws Error if `MONGODB_URI` is missing or if the connection fails.
 *
 * @example
 * const db = await connectToDatabase();
 * const users = await db.connection.db.collection("user").find().toArray();
 *
 * @remarks
 * - First call: creates connection + stores it in the global cache.
 * - Subsequent calls: returns the cached connection instantly.
 * - Avoids multiple connections on hot reload or serverless invocations.
 */
export const connectToDatabase = async () => {
  if (!MONGODB_URI) throw new Error("MONGODB_URI must be set within .env");

  // If an existing connection exists, reuse it
  if (cached.conn) return cached.conn;

  // Otherwise, begin establishing the connection
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset promise to allow retry on next invocation
    cached.promise = null;
    throw err;
  }

  console.log(`Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);

  return cached.conn;
};
