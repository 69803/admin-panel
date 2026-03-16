"use client";

/**
 * ✅ Admin Dashboard (app/admin/page.tsx)
 * - FIX: normaliza NEXT_PUBLIC_API_URL para evitar "//dominio" y forzar HTTPS (quita CORS/redirect)
 * - De aquí salen los tiles (KDS, Reportes, Contabilidad, etc.)
 */

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type Pedido = {
  id: number;
  estado?: string;
  created_at?: string | null;
  fecha_hora?: string | null;
};

type MenuItem = {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string | null;
};

// ✅ Normaliza URL (SIEMPRE https) y arregla cuando viene sin protocolo o como //dominio
function normalizeApiUrl(raw?: string) {
  if (!raw) return null;

  let url = raw.trim();

  // Si viene como "dominio.com" (sin http/https) -> poner https://
  if (!/^https?:\/\//i.test(url) && !url.startsWith("//")) {
    url = `https://${url}`;
  }

  // Si viene como //dominio -> https://dominio
  if (url.startsWith("//")) url = `https:${url}`;

  // Forzar https
  url = url.replace(/^http:\/\//i, "https://");

  // Quitar slash final
  url = url.replace(/\/+$/, "");

  return url;
}

const API_BASE =
  normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL) ||
  "https://restaurante-backend-q43k.onrender.com";

// (debug opcional) abre consola y mira qué URL usa de verdad
console.log("ADMIN DASHBOARD API_BASE =", API_BASE);

async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/menu`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error menú ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchPedidosLive(): Promise<Pedido[]> {
  const res = await fetch(`${API_BASE}/pedidos`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error pedidos ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function normalizeEstado(raw: any) {
  const s = String(raw ?? "pendiente").trim().toLowerCase();
  const allowed = ["pendiente", "preparando", "listo", "entregado", "cancelado"];
  return allowed.includes(s) ? s : "pendiente";
}

function money(v: number) {
  return `€ ${v.toFixed(2)}`;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      setError(null);
      const [m, p] = await Promise.all([fetchMenu(), fetchPedidosLive()]);
      setMenu(m);
      setPedidos(p);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando datos");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalPlatos = menu.length;

    const categorias = new Set<string>();
    for (const it of menu) {
      const c = (it.categoria ?? "").toString().trim();
      if (c) categorias.add(c.toUpperCase());
    }

    const countByEstado: Record<string, number> = {
      pendiente: 0,
      preparando: 0,
      listo: 0,
      entregado: 0,
      cancelado: 0,
    };

    for (const p of pedidos) {
      countByEstado[normalizeEstado(p.estado)]++;
    }

    const topCaros = menu
      .slice()
      .sort((a, b) => (Number(b.precio) || 0) - (Number(a.precio) || 0))
      .slice(0, 3);

    const promedioPrecio = menu.length
      ? menu.reduce((acc, it) => acc + (Number(it.precio) || 0), 0) / menu.length
      : 0;

    return {
      totalPlatos,
      totalCategorias: categorias.size,
      countByEstado,
      topCaros,
      promedioPrecio,
    };
  }, [menu, pedidos]);

  const page: React.CSSProperties = {
    minHeight: "100vh",
    padding: 18,
    background: "#E4E8EC",
    color: "#111111",
  };

  const header: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  };

  const card: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid #C8CDD4",
    background: "#EDF0F3",
    padding: 14,
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #C8CDD4",
    background: "#F2F4F6",
    color: "#111111",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
    gap: 12,
    alignItems: "start",
  };

  const tile: React.CSSProperties = {
    ...card,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 140,
  };

  const pill = (bg: string, fg: string): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    background: bg,
    color: fg,
    border: "1px solid transparent",
    width: "fit-content",
  });

  const estadoBadge = (estado: string) => {
    const e = normalizeEstado(estado);
    if (e === "pendiente") return pill("#FEF3C7", "#B45309");
    if (e === "preparando") return pill("#DBEAFE", "#1D4ED8");
    if (e === "listo") return pill("#D1FAE5", "#065F46");
    if (e === "entregado") return pill("#EDE9FE", "#5B21B6");
    return pill("#FEE2E2", "#991B1B");
  };

  const TileLink = ({
    href,
    title,
    desc,
    badge,
    icon,
  }: {
    href: string;
    title: string;
    desc: string;
    badge: React.ReactNode;
    icon: string;
  }) => (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{ ...tile, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 28 }}>{icon}</div>
          <div>{badge}</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 950 }}>{title}</div>
        <div style={{ color: "#555555", lineHeight: 1.25 }}>{desc}</div>
        <div style={{ marginTop: "auto", color: "#2C2C2C", fontWeight: 700 }}>Abrir →</div>
      </div>
    </Link>
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>Admin Dashboard</div>
          <div style={{ color: "#555555", fontSize: 13 }}>API: {API_BASE}</div>
        </div>

        <button onClick={load} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>
          🔄 Refrescar
        </button>
      </div>

      {error ? (
        <div
          style={{
            ...card,
            borderColor: "rgba(239,68,68,0.35)",
            background: "#FEF2F2",
            marginBottom: 12,
          }}
        >
          ⚠️ {error}
        </div>
      ) : null}

      {/* Quick Stats */}
      <div style={{ ...grid, marginBottom: 12 }}>
        <div style={{ ...card, gridColumn: "span 3" }}>
          <div style={{ color: "#555555", fontSize: 12 }}>Platos</div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{loading ? "…" : stats.totalPlatos}</div>
          <div style={{ color: "#555555", fontSize: 12 }}>Promedio precio: {money(stats.promedioPrecio)}</div>
        </div>

        <div style={{ ...card, gridColumn: "span 3" }}>
          <div style={{ color: "#555555", fontSize: 12 }}>Categorías</div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{loading ? "…" : stats.totalCategorias}</div>
          <div style={{ color: "#555555", fontSize: 12 }}>Detectadas desde la DB</div>
        </div>

        <div style={{ ...card, gridColumn: "span 6" }}>
          <div style={{ color: "#555555", fontSize: 12, marginBottom: 8 }}>Pedidos en vivo (KDS)</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={estadoBadge("pendiente")}>PENDIENTE · {stats.countByEstado.pendiente}</div>
            <div style={estadoBadge("preparando")}>PREPARANDO · {stats.countByEstado.preparando}</div>
            <div style={estadoBadge("listo")}>LISTO · {stats.countByEstado.listo}</div>
            <div style={estadoBadge("entregado")}>ENTREGADO · {stats.countByEstado.entregado}</div>
            <div style={estadoBadge("cancelado")}>CANCELADO · {stats.countByEstado.cancelado}</div>
          </div>
        </div>
      </div>

      {/* Main tiles */}
      <div style={grid}>
        <div style={{ gridColumn: "span 4" }}>
          <TileLink
            href="/"
            title="Menú (CRUD)"
            desc="Gestiona platos, categorías dinámicas, filtros, búsqueda y paginación."
            icon="🍽️"
            badge={<div style={pill("#D1FAE5", "#065F46")}>ACTIVO</div>}
          />
        </div>

        <div style={{ gridColumn: "span 4" }}>
          <TileLink
            href="/admin/kds"
            title="KDS — Cocina"
            desc="Pantalla tipo cocina: pendientes → preparando → listo → entregado."
            icon="👨‍🍳"
            badge={<div style={pill("#DBEAFE", "#1D4ED8")}>LIVE</div>}
          />
        </div>

        <div style={{ gridColumn: "span 4" }}>
          <TileLink
            href="/admin/analytics"
            title="Analytics Pro"
            desc="Gráficos estilo acciones: diario / semanal / mensual / anual + filtro por plato."
            icon="📈"
            badge={<div style={pill("#EDE9FE", "#5B21B6")}>PRO</div>}
          />
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <TileLink
            href="/admin/reportes"
            title="Reportes"
            desc="Resumen por periodo + Top platos + acciones administrativas (si las tienes)."
            icon="📊"
            badge={<div style={pill("#FEF3C7", "#B45309")}>RESUMEN</div>}
          />
        </div>

        {/* ✅ CONTABILIDAD (tile) */}
        <div style={{ gridColumn: "span 6" }}>
          <TileLink
            href="/admin/contabilidad"
            title="Contabilidad"
            desc="Gastos, balance y control financiero del restaurante"
            icon="📒"
            badge={<div style={pill("#D1FAE5", "#065F46")}>FINANZAS</div>}
          />
        </div>

        <div style={{ ...card, gridColumn: "span 6" }}>
          <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 10 }}>Insight rápido</div>
          <div style={{ color: "#555555", fontSize: 13, marginBottom: 10 }}>Top 3 platos más caros</div>

          {loading ? (
            <div style={{ color: "#555555" }}>Cargando…</div>
          ) : stats.topCaros.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.topCaros.map((x) => (
                <div
                  key={x.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid #C8CDD4",
                    background: "#E4E8EC",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {x.nombre} <span style={{ color: "#555555", fontWeight: 800 }}>#{x.id}</span>
                  </div>
                  <div style={{ fontWeight: 950 }}>{money(Number(x.precio) || 0)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#555555" }}>No hay platos aún</div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/admin/kds/mensual" style={btn}>
              📅 KDS Mensual
            </Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, color: "#555555", fontSize: 12 }}>
        Nota: Este dashboard trae datos en vivo desde /menu y /pedidos.
      </div>
    </div>
  );
}
