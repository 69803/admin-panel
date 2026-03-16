"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

const menuItems = [
  { icon: "🖼️", label: "Cambiar foto de perfil", action: "foto" },
  { icon: "👤", label: "Datos personales", action: "perfil" },
  { icon: "💳", label: "Plan de pago", action: "plan", href: "/admin/config" },
  { icon: "🔑", label: "Cambiar contraseña", action: "password" },
  { icon: "⚙️", label: "Configuración", action: "config", href: "/admin/config" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    localStorage.removeItem("admin_auth_v1");
    router.replace("/login");
  }

  // Cierra el menú si se hace click fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

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
      {/* ── Avatar / Logo con dropdown ── */}
      <div ref={menuRef} style={{ position: "relative", marginBottom: 20 }}>
        <button
          onClick={() => setOpen((v) => !v)}
          title="Mi perfil"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            color: "#fff",
            fontSize: 17,
            border: open ? "2px solid rgba(255,255,255,0.45)" : "2px solid transparent",
            cursor: "pointer",
            transition: "border 140ms ease",
            flexShrink: 0,
          }}
        >
          A
        </button>

        {/* ── Dropdown panel ── */}
        {open && (
          <div
            style={{
              position: "absolute",
              left: 48,
              top: 0,
              width: 230,
              background: "#FFFFFF",
              borderRadius: 14,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
              border: "1px solid #EAECF0",
              overflow: "hidden",
              zIndex: 200,
            }}
          >
            {/* Header del perfil */}
            <div
              style={{
                padding: "16px 16px 12px",
                background: "linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.25)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  color: "#fff",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                A
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>Admin</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>El Rincón de Domingo</div>
              </div>
            </div>

            {/* Opciones */}
            <div style={{ padding: "6px 0" }}>
              {menuItems.map((item) => {
                const content = (
                  <div
                    key={item.action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      cursor: "pointer",
                      transition: "background 100ms ease",
                      fontSize: 13,
                      color: "#222222",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6FA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => {
                      setOpen(false);
                      if (!item.href) {
                        // acciones sin ruta: mostrar un alert básico por ahora
                        alert(`Función "${item.label}" próximamente disponible.`);
                      }
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </div>
                );

                return item.href ? (
                  <Link
                    key={item.action}
                    href={item.href}
                    style={{ textDecoration: "none" }}
                    onClick={() => setOpen(false)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 16px",
                        cursor: "pointer",
                        transition: "background 100ms ease",
                        fontSize: 13,
                        color: "#222222",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6FA")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      {item.label}
                    </div>
                  </Link>
                ) : content;
              })}
            </div>

            {/* Separador + Cerrar sesión */}
            <div style={{ height: 1, background: "#EAECF0", margin: "2px 0" }} />
            <div style={{ padding: "6px 0 6px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#DC2626",
                  fontWeight: 600,
                  transition: "background 100ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => { setOpen(false); handleLogout(); }}
              >
                <span style={{ fontSize: 16 }}>🚪</span>
                Cerrar sesión
              </div>
            </div>
          </div>
        )}
      </div>

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
