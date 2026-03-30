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
  const [subscriptionAllowed, setSubscriptionAllowed] = useState<boolean | null>(null);
  const [subscriptionCheckedFor, setSubscriptionCheckedFor] = useState<string | null>(null);

  // /login and /hello are the only public routes — everything else requires auth
  const isLoginRoute = pathname === "/login" || pathname?.startsWith("/login/")
                    || pathname === "/hello"  || pathname?.startsWith("/hello/");
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

  // ── 2. /login is the only public route ───────────────────────────
  if (isLoginRoute) return <>{children}</>;

  // ── 3. Not logged in → /login (catches /pricing too) ─────────────
  if (!authed) {
    router.replace("/login");
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 4. License kill switch → pricing (auth required) ─────────────
  if (!ACTIVO) {
    if (!isPricingRoute) router.replace("/pricing");
    return isPricingRoute
      ? <>{children}</>
      : <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 5. Subscription result stale or still loading ─────────────────
  if (subscriptionCheckedFor !== currentEmail || subscriptionAllowed === null) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 6. No subscription → /pricing (auth required) ─────────────────
  if (!subscriptionAllowed) {
    if (!isPricingRoute) router.replace("/pricing");
    return isPricingRoute
      ? <>{children}</>
      : <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 7. Has subscription but landed on /pricing → panel ────────────
  if (isPricingRoute) {
    router.replace("/admin");
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── 8. Authenticated + valid subscription → panel ─────────────────
  return (
    <ThemeProvider>
      <Shell>{children}</Shell>
    </ThemeProvider>
  );
}
