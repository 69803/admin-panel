"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  icon: string; // emoji por ahora (simple y seguro)
};

const items: Item[] = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/", label: "Menú", icon: "🍽️" },
  { href: "/admin/kds", label: "KDS Cocina", icon: "👨‍🍳" },
  { href: "/admin/kds/mensual", label: "KDS Mensual", icon: "📅" },
  { href: "/admin/reportes", label: "Reportes", icon: "📊" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/config", label: "Config", icon: "⚙️" },
  { href: "/login", label: "Login", icon: "🔐" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 84,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#0b1220",
        borderRight: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 10px",
        gap: 12,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "grid",
          placeItems: "center",
          fontWeight: 950,
          color: "white",
        }}
        title="Admin Panel"
      >
        A
      </div>

      <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.10)" }} />

      {/* Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname?.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              title={it.label}
              style={{
                width: 54,
                height: 54,
                margin: "0 auto",
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                textDecoration: "none",
                color: "white",
                border: active ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.10)",
                background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                transform: active ? "scale(1.03)" : "scale(1)",
                transition: "all 140ms ease",
                fontSize: 20,
              }}
            >
              <span aria-hidden>{it.icon}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Footer (opcional) */}
      <div style={{ opacity: 0.6, fontSize: 10, color: "white" }}>v1</div>
    </aside>
  );
}
