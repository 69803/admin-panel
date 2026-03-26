"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { ACTIVO } from "../lib/license";
import PricingPage from "./pricing/page";

const AUTH_KEY = "admin_auth_v1";
const ENFORCE_DATE = new Date("2026-04-01T00:00:00");

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

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [subscriptionAllowed, setSubscriptionAllowed] = useState<boolean | null>(null);

  const isLoginRoute = pathname === "/login" || pathname?.startsWith("/login/") || pathname === "/hello" || pathname?.startsWith("/hello/");
  const isProtected = pathname === "/admin" || pathname?.startsWith("/admin/");

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

  // ── CHECK DE SUSCRIPCIÓN (server-side via API) ────────────────────
  useEffect(() => {
    if (!mounted) return;
    if (new Date() < ENFORCE_DATE) {
      setSubscriptionAllowed(true);
      return;
    }
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      const email = raw ? JSON.parse(raw)?.email : null;
      if (!email) { setSubscriptionAllowed(false); return; }
      fetch(`/api/subscription-check?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data) => setSubscriptionAllowed(!!data?.allowed))
        .catch(() => setSubscriptionAllowed(false));
    } catch {
      setSubscriptionAllowed(false);
    }
  }, [mounted]);
  // ─────────────────────────────────────────────────────────────────

  // LOGIN DESACTIVADO — volver a activar cuando el usuario lo indique

  // Mientras monta: render estable (evita hydration mismatch)
  if (!mounted) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // ── BLOQUEO POR LICENCIA ──────────────────────────────────────────
  if (!ACTIVO) return <PricingPage />;
  if (subscriptionAllowed === null) return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  if (!subscriptionAllowed) return <PricingPage />;
  // ─────────────────────────────────────────────────────────────────

  // Login: sin sidebar
  if (isLoginRoute) return <>{children}</>;

  // Resto: con sidebar
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
