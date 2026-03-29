"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAsientos, calcTotales } from "./_libro/store";

function fmtMoney(v: number) {
  const abs = Math.abs(v);
  const str = `€ ${abs.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return v < 0 ? `−${str}` : str;
}

const SECCIONES = [
  { label: "Activos",  icon: "🏦", desc: "Bienes y derechos de la empresa",    sub: "Caja, banco, inventario, equipos…",         href: "/admin/kds/activos",  key: "activos"  as const, accent: "#2563eb", bg: "rgba(37,99,235,0.09)",   border: "rgba(37,99,235,0.28)",   glow: "0 8px 32px rgba(37,99,235,0.18)"   },
  { label: "Pasivos",  icon: "📋", desc: "Deudas y obligaciones pendientes",    sub: "Préstamos, cuentas por pagar, deudas…",    href: "/admin/kds/pasivos",  key: "pasivos"  as const, accent: "#dc2626", bg: "rgba(220,38,38,0.09)",   border: "rgba(220,38,38,0.28)",   glow: "0 8px 32px rgba(220,38,38,0.18)"   },
  { label: "Capital",  icon: "💼", desc: "Patrimonio neto del negocio",          sub: "Aportes, utilidades, reservas…",           href: "/admin/kds/capital",  key: "capital"  as const, accent: "#7c3aed", bg: "rgba(124,58,237,0.09)",  border: "rgba(124,58,237,0.28)",  glow: "0 8px 32px rgba(124,58,237,0.18)"  },
];

export default function KdsPage() {
  const [totales, setTotales] = useState({ activos: 0, pasivos: 0, capital: 0 });

  useEffect(() => {
    setTotales(calcTotales(loadAsientos()));
  }, []);

  const ecuacionOk = Math.abs(totales.activos - (totales.pasivos + totales.capital)) < 0.01;

  return (
    <div style={{ padding: "36px 28px", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--t-text)" }}>Contabilidad General</h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--t-text2)" }}>
          Sistema de partida doble — cada asiento afecta dos cuentas simultáneamente.
        </p>
      </div>

      {/* 3 Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22, marginBottom: 32 }}>
        {SECCIONES.map(({ label, icon, desc, sub, href, key, accent, bg, border, glow }) => (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            <div
              style={{ background: "var(--t-card)", border: `1.5px solid ${border}`, borderRadius: 24, padding: "32px 26px", cursor: "pointer", boxShadow: glow, display: "flex", flexDirection: "column", gap: 14, transition: "transform .18s, box-shadow .18s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: bg, border: `1.5px solid ${border}`, display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{label}</div>
                  <div style={{ fontSize: 13, color: "var(--t-text2)", marginTop: 2 }}>{desc}</div>
                </div>
              </div>

              {/* Total real */}
              <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>Saldo actual</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{fmtMoney(totales[key])}</div>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: "var(--t-text2)", lineHeight: 1.6 }}>{sub}</p>
              <div style={{ fontSize: 13, fontWeight: 800, color: accent }}>Ver y registrar →</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Ecuación contable con números reales */}
      <div style={{
        background: "var(--t-card)", border: "1px solid var(--t-border)",
        borderRadius: 20, padding: "24px 28px",
        boxShadow: "var(--t-shadow)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>
          Ecuación contable fundamental
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Activos */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>ACTIVOS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#2563eb" }}>{fmtMoney(totales.activos)}</div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--t-text3)" }}>=</div>

          {/* Pasivos */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>PASIVOS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626" }}>{fmtMoney(totales.pasivos)}</div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--t-text3)" }}>+</div>

          {/* Capital */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>CAPITAL</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#7c3aed" }}>{fmtMoney(totales.capital)}</div>
          </div>
        </div>

        {/* Balance check */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <span style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 999,
            background: ecuacionOk ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.12)",
            border: `1px solid ${ecuacionOk ? "rgba(34,197,94,0.35)" : "rgba(220,38,38,0.35)"}`,
            color: ecuacionOk ? "#16a34a" : "#dc2626",
            fontSize: 12, fontWeight: 800,
          }}>
            {ecuacionOk ? "✓ Ecuación en equilibrio" : "⚠️ Ecuación desequilibrada — revisa los asientos"}
          </span>
        </div>
      </div>
    </div>
  );
}
