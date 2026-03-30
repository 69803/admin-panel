"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { ACTIVO } from "../lib/license";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

const AUTH_KEY = "admin_auth_v2";
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

  // Helper — clears auth and sends to login
  function forceLogout(email: string, reason: string) {
    console.log(`[ClientShell] FORCED LOGOUT — email=${email} reason=${reason}`);
    localStorage.removeItem(AUTH_KEY);
    router.replace("/login");
  }

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

  // ── Forced-logout polling ────────────────────────────────────────────
  // Re-validates subscription every 90 s in the background.
  // If the server says allowed=false (expired, cancelled, removed from clients),
  // the session is cleared and the user is sent to /login immediately —
  // without waiting for them to navigate or refresh.
  // Owner email is always exempt. Network errors are swallowed (no false positives).
  useEffect(() => {
    if (!mounted) return;

    const poll = async () => {
      const email = readEmailFromLS();
      if (!email) return;
      if (email === OWNER_EMAIL) return;

      // Don't kick while already on a public route (avoids redirect loops)
      const p = window.location.pathname;
      const onPublic = p === "/login" || p.startsWith("/login/")
                    || p === "/hello"  || p.startsWith("/hello/");
      if (onPublic) return;

      try {
        const r = await fetch(`/api/subscription-check?email=${encodeURIComponent(email)}`);
        const data = await r.json();
        if (!data?.allowed) {
          forceLogout(email, data?.reason ?? "poll_denied");
        }
      } catch {
        // Network error — do NOT force logout; wait for next cycle
      }
    };

    const id = setInterval(poll, 90_000); // every 90 seconds
    return () => clearInterval(id);
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

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
