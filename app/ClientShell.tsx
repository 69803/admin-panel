"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { ACTIVO } from "../lib/license";
import PricingPage from "./pricing/page";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

const AUTH_KEY = "admin_auth_v1";
const OWNER_EMAIL = "kristianbarrios8@gmail.com";

function readAuthedFromLS(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.email;
  } catch {
    return false;
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

function PricingWrapper() {
  return <PricingPage />;
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [subscriptionAllowed, setSubscriptionAllowed] = useState<boolean | null>(null);

  const isLoginRoute   = pathname === "/login" || pathname?.startsWith("/login/") || pathname === "/hello" || pathname?.startsWith("/hello/");
  const isPricingRoute = pathname === "/pricing";
  const isProtected    = pathname === "/admin" || pathname?.startsWith("/admin/");

  // ✅ Evita hydration mismatch: nada que dependa de localStorage antes de montar
  useEffect(() => {
    setMounted(true);
    setAuthed(readAuthedFromLS());
  }, []);

  // ✅ Si cambia la ruta, re-leemos auth (por si el login guardó el token)
  useEffect(() => {
    if (!mounted) return;
    setAuthed(readAuthedFromLS());
  }, [mounted, pathname]);

  // Registrar actividad cuando el usuario está autenticado
  useEffect(() => {
    if (!mounted || !authed) return;
    try {
      const raw = localStorage.getItem("admin_auth_v1");
      const email = raw ? JSON.parse(raw)?.email : null;
      if (email) {
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).catch(() => {});
      }
    } catch {}
  }, [mounted, authed]);

  // ── CHECK DE SUSCRIPCIÓN — solo si está autenticado ─────────────
  useEffect(() => {
    if (!mounted || !authed) return;
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      const email = raw ? JSON.parse(raw)?.email : null;
      if (!email) { setSubscriptionAllowed(false); return; }
      // Owner bypass — always allow regardless of subscription
      if (email === OWNER_EMAIL) { setSubscriptionAllowed(true); return; }
      fetch(`/api/subscription-check?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data) => setSubscriptionAllowed(!!data?.allowed))
        .catch(() => setSubscriptionAllowed(false));
    } catch {
      setSubscriptionAllowed(false);
    }
  }, [mounted, authed]);
  // ─────────────────────────────────────────────────────────────────

  // 1. Hydration guard
  if (!mounted) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // 2. Rutas públicas — nunca verifican suscripción ni auth
  if (isLoginRoute || isPricingRoute) return <>{children}</>;

  // 3. No autenticado → redirigir a /login
  if (!authed) {
    router.replace("/login");
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // 4. Kill switch de licencia
  if (!ACTIVO) {
    router.replace("/pricing");
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // 5. Esperando resultado del check de suscripción
  if (subscriptionAllowed === null) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // 6. Sin suscripción válida → redirigir a /pricing
  if (!subscriptionAllowed) {
    router.replace("/pricing");
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // 7. Autenticado + suscripción válida → panel con sidebar y theme
  return (
    <ThemeProvider>
      <Shell>{children}</Shell>
    </ThemeProvider>
  );
}
