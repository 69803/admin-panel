"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const AUTH_KEY = "admin_auth_v2";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEmail(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw)?.email ?? null) : null;
  } catch {
    return null;
  }
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("track_sid");
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("track_sid", sid);
    }
    return sid;
  } catch {
    return "nosession";
  }
}

// Mapa ruta → nombre legible del módulo
const ROUTE_NAMES: Record<string, string> = {
  "/":                       "Menú",
  "/admin":                  "Dashboard",
  "/admin/contabilidad":     "Contabilidad",
  "/admin/kds":              "KDS",
  "/admin/kds/cuentas-t":   "Cuentas T",
  "/admin/kds/balance":      "Balance",
  "/admin/kds/capital":      "Capital",
  "/admin/kds/activos":      "Activos",
  "/admin/kds/pasivos":      "Pasivos",
  "/admin/kds/mensual":      "KDS Mensual",
  "/admin/analytics":        "Analytics",
  "/admin/iq":               "IQ Análisis",
  "/admin/reportes":         "Reportes",
  "/admin/config":           "Configuración",
  "/admin/profile":          "Perfil",
  "/pricing":                "Pricing",
  "/checkout":               "Checkout",
  "/planes":                 "Planes",
};

function routeToModule(route: string): string {
  return ROUTE_NAMES[route] ?? route;
}

function sendEvent(payload: object) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function sendBeacon(payload: object) {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/events",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
    } else {
      sendEvent(payload);
    }
  } catch {
    // silencioso
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface TrackCtx {
  /** Registra un evento de acción del usuario (click, export, etc.) */
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => void;
}

const TrackContext = createContext<TrackCtx>({ trackEvent: () => {} });
export const useTrack = () => useContext(TrackContext);

// ── Provider ─────────────────────────────────────────────────────────────────

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // refs para no generar closures estancados
  const enteredAtRef  = useRef<number>(Date.now());
  const prevRouteRef  = useRef<string | null>(null);
  const sessionFired  = useRef<boolean>(false);

  // ── Tracking de navegación ────────────────────────────────────────────────
  useEffect(() => {
    const email = getEmail();
    if (!email) return;

    const sessionId = getSessionId();
    const now       = Date.now();
    const route     = pathname;
    const module    = routeToModule(route);

    // session_start — solo una vez por sesión de pestaña
    if (!sessionFired.current) {
      sessionFired.current = true;
      sendEvent({
        email,
        session_id: sessionId,
        event_type: "action",
        route,
        module,
        event_name: "session_start",
        metadata:   {},
      });
    }

    // page_exit para la ruta anterior
    if (prevRouteRef.current !== null && prevRouteRef.current !== route) {
      const durationMs = now - enteredAtRef.current;
      sendEvent({
        email,
        session_id:  sessionId,
        event_type:  "page_exit",
        route:       prevRouteRef.current,
        module:      routeToModule(prevRouteRef.current),
        duration_ms: durationMs,
      });
    }

    // page_enter para la ruta nueva
    sendEvent({
      email,
      session_id: sessionId,
      event_type: "page_enter",
      route,
      module,
    });

    prevRouteRef.current = route;
    enteredAtRef.current = now;
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tracking al cerrar pestaña ────────────────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      const email = getEmail();
      if (!email || prevRouteRef.current === null) return;
      sendBeacon({
        email,
        session_id:  getSessionId(),
        event_type:  "page_exit",
        route:       prevRouteRef.current,
        module:      routeToModule(prevRouteRef.current),
        duration_ms: Date.now() - enteredAtRef.current,
      });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // ── trackEvent — para usar desde cualquier componente ────────────────────
  const trackEvent = (eventName: string, metadata: Record<string, unknown> = {}) => {
    const email = getEmail();
    if (!email) return;
    sendEvent({
      email,
      session_id: getSessionId(),
      event_type: "action",
      route:      pathname,
      module:     routeToModule(pathname),
      event_name: eventName,
      metadata,
    });
  };

  return (
    <TrackContext.Provider value={{ trackEvent }}>
      {children}
    </TrackContext.Provider>
  );
}
