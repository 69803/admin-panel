"use client";

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

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://restaurante-backend-q43k.onrender.com"
).replace(/\/$/, "");

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
    background: "#0b1220",
    color: "white",
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
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    padding: 14,
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
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
    border: "1px solid rgba(255,255,255,0.10)",
    width: "fit-content",
  });

  const estadoBadge = (estado: string) => {
    const e = normalizeEstado(estado);
    if (e === "pendiente") return pill("rgba(245,158,11,0.18)", "#F59E0B");
    if (e === "preparando") return pill("rgba(59,130,246,0.18)", "#60A5FA");
    if (e === "listo") return pill("rgba(34,197,94,0.18)", "#34D399");
    if (e === "entregado") return pill("rgba(168,85,247,0.18)", "#C084FC");
    return pill("rgba(239,68,68,0.18)", "#F87171");
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
        <div style={{ opacity: 0.82, lineHeight: 1.25 }}>{desc}</div>
        <div style={{ marginTop: "auto", opacity: 0.9, fontWeight: 900 }}>Abrir →</div>
      </div>
    </Link>
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>Admin Dashboard</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>API: {API_BASE}</div>
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
            background: "rgba(239,68,68,0.10)",
            marginBottom: 12,
          }}
        >
          ⚠️ {error}
        </div>
      ) : null}

      {/* Quick Stats */}
      <div style={{ ...grid, marginBottom: 12 }}>
        <div style={{ ...card, gridColumn: "span 3" }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Platos</div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{loading ? "…" : stats.totalPlatos}</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>Promedio precio: {money(stats.promedioPrecio)}</div>
        </div>

        <div style={{ ...card, gridColumn: "span 3" }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Categorías</div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{loading ? "…" : stats.totalCategorias}</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>Detectadas desde la DB</div>
        </div>

        <div style={{ ...card, gridColumn: "span 6" }}>
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 8 }}>Pedidos en vivo (KDS)</div>
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
            badge={<div style={pill("rgba(34,197,94,0.18)", "#34D399")}>ACTIVO</div>}
          />
        </div>

        <div style={{ gridColumn: "span 4" }}>
          <TileLink
            href="/admin/kds"
            title="KDS — Cocina"
            desc="Pantalla tipo cocina: pendientes → preparando → listo → entregado."
            icon="👨‍🍳"
            badge={<div style={pill("rgba(59,130,246,0.18)", "#60A5FA")}>LIVE</div>}
          />
        </div>

        <div style={{ gridColumn: "span 4" }}>
          <TileLink
            href="/admin/analytics"
            title="Analytics Pro"
            desc="Gráficos estilo acciones: diario / semanal / mensual / anual + filtro por plato."
            icon="📈"
            badge={<div style={pill("rgba(168,85,247,0.18)", "#C084FC")}>PRO</div>}
          />
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <TileLink
            href="/admin/reportes"
            title="Reportes"
            desc="Resumen por periodo + Top platos + acciones administrativas (si las tienes)."
            icon="📊"
            badge={<div style={pill("rgba(245,158,11,0.18)", "#FBBF24")}>RESUMEN</div>}
          />
        </div>

        <div style={{ ...card, gridColumn: "span 6" }}>
          <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 10 }}>Insight rápido</div>
          <div style={{ opacity: 0.85, fontSize: 13, marginBottom: 10 }}>Top 3 platos más caros</div>

          {loading ? (
            <div style={{ opacity: 0.75 }}>Cargando…</div>
          ) : stats.topCaros.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.topCaros.map((x) => (
                <div
                  key={x.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.20)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {x.nombre} <span style={{ opacity: 0.7, fontWeight: 800 }}>#{x.id}</span>
                  </div>
                  <div style={{ fontWeight: 950 }}>{money(Number(x.precio) || 0)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>No hay platos aún</div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/admin/kds/mensual" style={btn}>
              📅 KDS Mensual
            </Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, opacity: 0.7, fontSize: 12 }}>
        Nota: Este dashboard trae datos en vivo desde /menu y /pedidos.
      </div>
    </div>
  );
}
