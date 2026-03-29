"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

type Item = {
  href: string;
  label: string;
  icon: string;
};

const items: Item[] = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/", label: "Menú", icon: "🍽️" },
  { href: "/admin/kds", label: "Cuentas", icon: "🏦" },
  { href: "/admin/kds/mensual", label: "KDS Mensual", icon: "📅" },
  { href: "/admin/reportes", label: "Reportes", icon: "📊" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/iq", label: "IQ Análisis", icon: "🧠" },
  { href: "/admin/config", label: "Configuración", icon: "⚙️" },
];

const devItems = [
  { href: "/dev/pagos", icon: "💳", label: "Panel de Pagos" },
  { href: "/dev/usuarios", icon: "👥", label: "Actividad de Usuarios" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [devOpen, setDevOpen] = useState(false);
  const devRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    localStorage.removeItem("admin_auth_v1");
    router.replace("/login");
  }

  // Cerrar popup al click fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (devRef.current && !devRef.current.contains(e.target as Node)) {
        setDevOpen(false);
      }
    }
    if (devOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [devOpen]);

  return (
    <aside
      style={{
        width: 68,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#1A1D2E",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "18px 0 14px",
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", padding: "0 8px" }}>
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/" && pathname?.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              title={it.label}
              style={{
                height: 46,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                textDecoration: "none",
                fontSize: 20,
                background: active ? "rgba(255,255,255,0.13)" : "transparent",
                boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.08)" : "none",
                transition: "background 120ms ease",
              }}
            >
              <span aria-hidden>{it.icon}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Botón desarrollador */}
      <div ref={devRef} style={{ position: "relative", width: "100%", padding: "0 8px", marginBottom: 6 }}>
        <button
          onClick={() => setDevOpen((v) => !v)}
          title="Herramientas de desarrollador"
          style={{
            width: "100%",
            height: 46,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: devOpen
              ? "rgba(59,130,246,0.35)"
              : "rgba(59,130,246,0.18)",
            border: "1px solid rgba(59,130,246,0.45)",
            cursor: "pointer",
            fontSize: 18,
            transition: "background 120ms ease",
          }}
          onMouseEnter={(e) => {
            if (!devOpen) e.currentTarget.style.background = "rgba(59,130,246,0.28)";
          }}
          onMouseLeave={(e) => {
            if (!devOpen) e.currentTarget.style.background = "rgba(59,130,246,0.18)";
          }}
        >
          🔧
        </button>

        {/* Popup */}
        {devOpen && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "calc(100% + 10px)",
              background: "#1A1D2E",
              border: "1px solid rgba(59,130,246,0.35)",
              borderRadius: 14,
              padding: 8,
              minWidth: 210,
              boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
              zIndex: 200,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#60a5fa",
                letterSpacing: "0.1em",
                padding: "4px 10px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                marginBottom: 6,
              }}
            >
              🔧 SOLO DESARROLLADORES
            </div>

            {devItems.map((d) => (
              <button
                key={d.href}
                onClick={() => { setDevOpen(false); router.push(d.href); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 9,
                  border: "none",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: "left",
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 17 }}>{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Logout rápido */}
      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 19,
          transition: "background 120ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        🔒
      </button>

      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>v1</div>
    </aside>
  );
}
