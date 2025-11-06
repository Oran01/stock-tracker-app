/**
 * File: app/(root)/layout.tsx
 * Purpose: Auth-gated layout that wraps all protected dashboard routes.
 * Exports: <Layout/> (server component)
 *
 * Key ideas:
 * - Runs on the server and validates the BetterAuth session before
 *   rendering any protected application pages.
 * - Redirects unauthenticated users to `/sign-in`.
 * - Injects the authenticated user into <Header/> for personalized UI.
 * - Provides consistent shell structure (Header + container + padding).
 *
 * @remarks
 * - `auth.api.getSession()` must run on the server with request headers
 *   provided by `next/headers`.
 * - All routes under `(root)` are protected; this layout enforces that.
 * - Keep this component free of client-side hooks; it must stay server-only.
 * - Changes to this layout affect all dashboard pages (watchlist, search, etc.).
 *
 * @see https://www.better-auth.com/docs
 */

import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <main className="min-h-screen text-gray-400">
      <Header user={user} />
      <div className="container py-10">{children}</div>
    </main>
  );
};

export default Layout;
