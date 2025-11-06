/**
 * Script: scripts/test-db.mjs
 * Purpose: Standalone ESM-based MongoDB connectivity tester used for
 * CI/CD pipelines, Docker health checks, and local diagnostics.
 *
 * Usage:
 *   node scripts/test-db.mjs
 *
 * Behavior:
 * - Loads environment variables via `dotenv/config`.
 * - Validates that `MONGODB_URI` exists.
 * - Attempts a cold MongoDB connection using native mongoose (no caching).
 * - Measures connection latency in milliseconds.
 * - Prints a detailed success message including:
 *     - Database name
 *     - Host
 *     - Connection time
 * - Exits with:
 *      0 → success
 *      1 → failure (allows CI to halt builds)
 *
 * Differences vs. test-db.ts:
 * - Pure ESM module (no TypeScript, no ts-node).
 * - Connects via `mongoose.connect()` directly instead of the shared wrapper.
 * - Useful in environments where TypeScript or Next.js cannot be executed.
 *
 * @remarks
 * - Always closes the Mongoose connection before exiting.
 * - Safe for repeated CI execution.
 * - Helps diagnose networking, DNS, SSL, or credential issues early.
 */

import "dotenv/config";
import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI must be set in .env");
    process.exit(1);
  }

  try {
    const startedAt = Date.now();
    await mongoose.connect(uri, { bufferCommands: false });
    const elapsed = Date.now() - startedAt;

    const dbName = mongoose.connection?.name || "(unknown)";
    const host = mongoose.connection?.host || "(unknown)";

    console.log(
      `OK: Connected to MongoDB [db="${dbName}", host="${host}", time=${elapsed}ms]`
    );
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("ERROR: Database connection failed");
    console.error(err);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
}

main();
