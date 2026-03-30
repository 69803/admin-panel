"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { ACTIVO } from "../lib/license";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

const AUTH_KEY = "admin_auth_v1";
const OWNER_EMAIL = "kristianbarrios8@gmail.com";

// Read synchronously — safe only after mount (no SSR)
function readEmailFromLS(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.email ?? null;
  } catch {
    return null;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  const { bg } = useTheme();
  return (
    <div id="admin-shell" style={{ display: "flex", minHeight: "100vh", background: bg }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  // subscriptionAllowed: null = loading, true = allowed, false = blocked
  const [subscriptionAllowed, setSubscriptionAllowed] = useState<boolean | null>(null);
  // Tracks which email the current subscriptionAllowed value was checked for.
  // If it doesn't match the current email, the result is stale and we wait.
  const [subscriptionCheckedFor, setSubscriptionCheckedFor] = useState<string | null>(null);

  const isLoginRoute   = pathname === "/login" || pathname?.startsWith("/login/") || pathname === "/hello" || pathname?.startsWith("/hello/");
  const isPricingRoute = pathname === "/pricing";

  // Hydration — one-time
  useEffect(() => {
    setMounted(true);
  }, []);

  // Activity tracking
  useEffect(() => {
    if (!mounted) return;
    const email = readEmailFromLS();
    if (!email) return;
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
  }, [mounted]);

  // Subscription check — re-runs on every pathname change so it re-validates after login
  useEffect(() => {
    if (!mounted) return;
    const email = readEmailFromLS();

    if (!email) {
      setSubscriptionCheckedFor(null);
      setSubscriptionAllowed(false);
      return;
    }

    if (email === OWNER_EMAIL) {
      setSubscriptionCheckedFor(email);
      setSubscriptionAllowed(true);
      return;
    }

    // Mark as "checking for this email" and reset result while fetching
    setSubscriptionCheckedFor(email);
    setSubscriptionAllowed(null);
    fetch(`/api/subscription-check?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => setSubscriptionAllowed(!!data?.allowed))
      .catch(() => setSubscriptionAllowed(false));
  }, [mounted, pathname]);

  // ── 1. Hydration guard ────────────────────────────────────────────
  if (!mounted) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // Read auth synchronously — always current, never stale
  const currentEmail = readEmailFromLS();
  const authed = !!currentEmail;

  // ── 2. Public routes — no auth or subscription checks ────────────
  if (isLoginRoute || isPricingRoute) return <>{children}</>;

  // ── 3. Not logged in → /login ─────────────────────────────────────
  if (!authed) {
    router.replace("/login");
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 4. License kill switch ────────────────────────────────────────
  if (!ACTIVO) {
    router.replace("/pricing");
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 5. Subscription result is stale or still loading ─────────────
  // subscriptionCheckedFor must match currentEmail before we trust the result
  if (subscriptionCheckedFor !== currentEmail || subscriptionAllowed === null) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 6. No valid subscription → /pricing ──────────────────────────
  if (!subscriptionAllowed) {
    router.replace("/pricing");
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 7. Authenticated + valid subscription → panel ─────────────────
  return (
    <ThemeProvider>
      <Shell>{children}</Shell>
    </ThemeProvider>
  );
}
