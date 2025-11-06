/**
 * Script: scripts/test-db.ts
 * Purpose: Simple health-check script used to verify MongoDB connectivity
 * outside the Next.js runtime (CI, Docker, local diagnostics).
 *
 * Usage:
 *   pnpm ts-node scripts/test-db.ts
 *   or
 *   node dist/scripts/test-db.js
 *
 * Behavior:
 * - Imports the shared `connectToDatabase()` helper.
 * - Attempts to establish a MongoDB connection using environment variables.
 * - Prints a clear "OK" or "ERROR" message for CI/CD pipelines.
 * - Exits with:
 *      0 → connection successful
 *      1 → connection error (prevents deployments or builds)
 *
 * @remarks
 * - Useful for verifying that:
 *     - `MONGODB_URI` is valid
 *     - Network access to MongoDB is available
 *     - SSL/credentials are correctly configured
 * - Does not start any HTTP server — purely a diagnostic utility.
 *
 * @see /database/mongoose.ts
 */

import { connectToDatabase } from "../database/mongoose";

async function main() {
  try {
    await connectToDatabase();
    // If connectToDatabase resolves without throwing, connection is OK
    console.log("OK: Database connection succeeded");
    process.exit(0);
  } catch (err) {
    console.error("ERROR: Database connection failed");
    console.error(err);
    process.exit(1);
  }
}

main();
