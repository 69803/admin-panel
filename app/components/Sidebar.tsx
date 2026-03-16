"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Item = {
  href: string;
  label: string;
  icon: string;
};

const items: Item[] = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/", label: "Menú", icon: "🍽️" },
  { href: "/admin/kds", label: "KDS Cocina", icon: "👨‍🍳" },
  { href: "/admin/kds/mensual", label: "KDS Mensual", icon: "📅" },
  { href: "/admin/reportes", label: "Reportes", icon: "📊" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/config", label: "Configuración", icon: "⚙️" },
];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  function handleLogout() {
    localStorage.removeItem("admin_auth_v1");
    router.replace("/login");
  }

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
