"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
        width: 84,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#EDF0F3",
        borderRight: "1px solid #C8CDD4",
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
          background: "#F2F4F6",
          border: "1px solid #C8CDD4",
          display: "grid",
          placeItems: "center",
          fontWeight: 950,
          color: "#2C2C2C",
        }}
        title="Admin Panel"
      >
        A
      </div>

      <div style={{ width: "100%", height: 1, background: "#C8CDD4" }} />

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
                color: active ? "#2C2C2C" : "#555555",
                border: active ? "1px solid #C8CDD4" : "1px solid #C8CDD4",
                background: active ? "#F2F4F6" : "#E4E8EC",
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

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        style={{
          width: 54,
          height: 54,
          margin: "0 auto",
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          color: "#555555",
          border: "1px solid #C8CDD4",
          background: "#E4E8EC",
          cursor: "pointer",
          fontSize: 20,
        }}
      >
        🔒
      </button>

      {/* Footer */}
      <div style={{ fontSize: 10, color: "#555555" }}>v1</div>
    </aside>
  );
}
