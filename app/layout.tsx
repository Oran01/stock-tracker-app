/**
 * File: app/layout.tsx
 * Purpose: Global app shell for the Next.js App Router—sets HTML structure,
 *          global fonts/theme, and cross-app UI providers (e.g., toast).
 * Exports: <RootLayout/>, `metadata`
 *
 * Key ideas:
 * - App Router root layout: wraps every route with consistent HTML/Body.
 * - Loads Geist/Geist_Mono as CSS variables for Tailwind consumption.
 * - Applies dark theme globally (`<html class="dark">`) and antialiasing.
 * - Mounts a global <Toaster/> for transient notifications.
 *
 * @remarks
 * - `metadata` is statically exported for automatic head management.
 * - Fonts are loaded via next/font and exposed as CSS variables:
 *   `--font-geist-sans`, `--font-geist-mono`.
 * - If you introduce theme switching, move `className="dark"` to a provider
 *   (e.g., next-themes) and toggle via `data-theme` or `class`.
 * - Keep <Toaster/> close to the root so any client component can trigger toasts.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Register fonts as CSS variables for use in Tailwind or custom CSS.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// App-wide metadata (title/description). Extend per-route with dynamic metadata if needed.
export const metadata: Metadata = {
  title: "Signalist",
  description:
    "Track real-time stock price, get personalized alerts and explore detailed company insights.",
};

/**
 * RootLayout
 * @summary Global layout wrapper for the entire application.
 *
 * @param props.children - The page content for the current route.
 *
 * @example
 * // App Router automatically uses this for all routes under /app
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return ( ... );
 * }
 *
 * @remarks
 * - Adds `class="dark"` at the <html> level for a dark default theme.
 * - Applies font variables to <body> and enables font smoothing via `antialiased`.
 * - Renders the global <Toaster/> once, accessible from any client component.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Global toast portal (sonner) */}
        <Toaster />
      </body>
    </html>
  );
}
