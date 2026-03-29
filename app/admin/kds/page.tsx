"use client";

import Link from "next/link";

const SECCIONES = [
  {
    label:  "Activos",
    icon:   "🏦",
    desc:   "Bienes y derechos de la empresa",
    sub:    "Registra propiedades, dinero en caja, cuentas por cobrar, inventario…",
    href:   "/admin/kds/activos",
    accent: "#2563eb",
    bg:     "rgba(37,99,235,0.09)",
    border: "rgba(37,99,235,0.28)",
    glow:   "0 8px 32px rgba(37,99,235,0.18)",
  },
  {
    label:  "Pasivos",
    icon:   "📋",
    desc:   "Deudas y obligaciones pendientes",
    sub:    "Registra préstamos, cuentas por pagar, deudas con proveedores…",
    href:   "/admin/kds/pasivos",
    accent: "#dc2626",
    bg:     "rgba(220,38,38,0.09)",
    border: "rgba(220,38,38,0.28)",
    glow:   "0 8px 32px rgba(220,38,38,0.18)",
  },
  {
    label:  "Capital",
    icon:   "💼",
    desc:   "Patrimonio neto del negocio",
    sub:    "Registra inversiones, aportes de socios, utilidades retenidas…",
    href:   "/admin/kds/capital",
    accent: "#7c3aed",
    bg:     "rgba(124,58,237,0.09)",
    border: "rgba(124,58,237,0.28)",
    glow:   "0 8px 32px rgba(124,58,237,0.18)",
  },
];

export default function KdsPage() {
  return (
    <div style={{ padding: "36px 28px", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--t-text)" }}>
          Contabilidad General
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--t-text2)" }}>
          Selecciona una sección para registrar y consultar tus movimientos contables.
        </p>
      </div>

      {/* 3 Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
        {SECCIONES.map(({ label, icon, desc, sub, href, accent, bg, border, glow }) => (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "var(--t-card)",
                border: `1.5px solid ${border}`,
                borderRadius: 24,
                padding: "36px 28px",
                cursor: "pointer",
                boxShadow: glow,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                transition: "transform .18s, box-shadow .18s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = glow.replace("0.18", "0.32");
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = glow;
              }}
            >
              {/* Icon + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: bg, border: `1.5px solid ${border}`,
                  display: "grid", placeItems: "center",
                  fontSize: 30, flexShrink: 0,
                }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: accent, lineHeight: 1.1 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "var(--t-text2)", marginTop: 4 }}>{desc}</div>
                </div>
              </div>

              {/* Sub description */}
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--t-text2)", lineHeight: 1.65 }}>
                {sub}
              </p>

              {/* CTA */}
              <div style={{
                marginTop: 4,
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 800, color: accent,
                letterSpacing: "0.03em",
              }}>
                Ver y registrar →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Ecuación contable */}
      <div style={{
        marginTop: 40,
        background: "var(--t-card)",
        border: "1px solid var(--t-border)",
        borderRadius: 18,
        padding: "22px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        boxShadow: "var(--t-shadow)",
      }}>
        <span style={{ fontSize: 13, color: "var(--t-text3)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ecuación contable</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#2563eb" }}>Activos</span>
          <span style={{ color: "var(--t-text3)", fontWeight: 700 }}>=</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#dc2626" }}>Pasivos</span>
          <span style={{ color: "var(--t-text3)", fontWeight: 700 }}>+</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#7c3aed" }}>Capital</span>
        </div>
      </div>
    </div>
  );
}
