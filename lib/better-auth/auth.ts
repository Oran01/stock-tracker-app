/**
 * File: lib/better-auth/auth.ts
 * Purpose: Initialize and export a configured BetterAuth instance backed by MongoDB.
 * Exports: `getAuth()` (lazy initializer) and `auth` (singleton instance)
 *
 * Key ideas:
 * - Lazy-load the BetterAuth instance to ensure database availability.
 * - Uses MongoDB via the official BetterAuth Mongo adapter.
 * - `nextCookies()` plugin integrates BetterAuth with Next.js middleware & server actions.
 * - Centralizes all BetterAuth configuration in one place.
 *
 * @remarks
 * - **Server-only:** This module must not be imported in client components.
 * - Requires environment variables:
 *      - `BETTER_AUTH_SECRET`
 *      - `BETTER_AUTH_URL` (your deployed origin, e.g. https://signalist.app)
 * - `autoSignIn: true` means users are logged in immediately on registration.
 * - The singleton pattern ensures BetterAuth is instantiated only once in development
 *   (important for Next.js hot reload).
 *
 * @see https://www.better-auth.com/docs
 */

import { connectToDatabase } from "@/database/mongoose";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

// Singleton cache to avoid creating multiple BetterAuth instances (especially during Next.js dev hot reload)
let authInstance: ReturnType<typeof betterAuth> | null = null;

/**
 * Initialize (or return) a BetterAuth instance.
 * @summary Ensures the BetterAuth server is created only once and connected to MongoDB.
 * @returns A fully configured BetterAuth server instance.
 *
 * @remarks
 * - Lazy initialization: the instance is created only on first call.
 * - Uses `mongodbAdapter` with the active Mongoose connection.
 * - Throws an error if the underlying MongoDB connection is not ready.
 * - Includes the `nextCookies()` plugin to sync session cookies with Next.js middleware.
 *
 * @throws Error if the MongoDB connection (`mongoose.connection.db`) is missing.
 */
export const getAuth = async () => {
  if (authInstance) return authInstance;

  // Ensure MongoDB is connected before initializing BetterAuth
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) throw new Error("MongoDB connection not found");

  authInstance = betterAuth({
    database: mongodbAdapter(db as any),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    plugins: [nextCookies()],
  });

  return authInstance;
};

/**
 * BetterAuth singleton instance.
 * @summary Eagerly initialized BetterAuth server for use in routes, server actions, and middleware.
 *
 * @remarks
 * - Do NOT import this in client-side code.
 * - Equivalent to calling `await getAuth()` once at module load.
 */
export const auth = await getAuth();
