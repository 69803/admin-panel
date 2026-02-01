"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PedidoItem = { plato_id: number; cantidad: number };

type Pedido = {
  id: number;
  mesa_id: number;
  estado?: string;
  items?: PedidoItem[];
  comentario?: string | null;
  nota?: string | null;
  observaciones?: string | null;
  observacion?: string | null;
  comment?: string | null;
  fecha_hora?: string | null;
  created_at?: string | null;
};

type MenuItem = { id: number; nombre?: string; precio: number };

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "https://restaurante-backend-q43k.onrender.com").replace(/\/$/, "");

const ESTADOS = ["pendiente", "preparando", "listo", "entregado", "cancelado"] as const;
type Estado = (typeof ESTADOS)[number];

function normalizeEstado(raw: any): Estado {
  const s = String(raw ?? "pendiente").trim().toLowerCase();
  return (ESTADOS as readonly string[]).includes(s) ? (s as Estado) : "pendiente";
}

function pickComentario(p: Pedido): string | null {
  const v =
    p.comentario ??
    p.nota ??
    p.observaciones ??
    p.observacion ??
    p.comment ??
    null;
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

function parseDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtFecha(raw?: string | null) {
  const d = parseDate(raw);
  if (!d) return raw ?? "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/menu`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error menú ${res.status}`);
  const data = (await res.json()) as MenuItem[];
  return Array.isArray(data) ? data : [];
}

async function fetchPedidosHistorial(): Promise<Pedido[]> {
  const res = await fetch(`${API_BASE}/pedidos_historial?limit=500`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error historial ${res.status}`);
  const data = (await res.json()) as Pedido[];
  return Array.isArray(data) ? data : [];
}

function estadoColor(estado: Estado) {
  switch (estado) {
    case "pendiente":
      return { bg: "#FFF4E5", fg: "#B45309", border: "#FED7AA" };
    case "preparando":
      return { bg: "#E8F1FF", fg: "#1D4ED8", border: "#BFDBFE" };
    case "listo":
      return { bg: "#E9FBEF", fg: "#15803D", border: "#BBF7D0" };
    case "entregado":
      return { bg: "#F3E8FF", fg: "#6D28D9", border: "#E9D5FF" };
    case "cancelado":
      return { bg: "#FEECEC", fg: "#B91C1C", border: "#FECACA" };
  }
}

export default function KdsMensualPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [menuMap, setMenuMap] = useState<Map<number, MenuItem>>(new Map());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [menu, hist] = await Promise.all([fetchMenu(), fetchPedidosHistorial()]);
      const m = new Map<number, MenuItem>();
      for (const it of menu) m.set(Number(it.id), it);
      setMenuMap(m);

      // filtro últimos 30 días (como tu Flutter)
      const now = new Date();
      const filtered = hist
        .filter((p) => {
          const d = parseDate(p.fecha_hora ?? p.created_at ?? null);
          if (!d) return false;
          const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 30;
        })
        .sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0));

      setPedidos(filtered);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando historial");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // refresca cada 1 min
    return () => clearInterval(t);
  }, [load]);

  const rows = useMemo(() => {
    return pedidos.map((p) => {
      const items = Array.isArray(p.items) ? p.items : [];
      const itemsCount = items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
      const total = items.reduce((acc, it) => {
        const platoId = Number(it.plato_id);
        const cant = Number(it.cantidad) || 0;
        const precio = Number(menuMap.get(platoId)?.precio ?? 0);
        return acc + precio * cant;
      }, 0);

      return {
        id: p.id,
        mesa_id: p.mesa_id,
        estado: normalizeEstado(p.estado),
        fecha: fmtFecha(p.fecha_hora ?? p.created_at ?? null),
        comentario: pickComentario(p),
        itemsCount,
        total,
      };
    });
  }, [pedidos, menuMap]);

  const pageStyle: React.CSSProperties = {
    padding: 16,
    background: "#0b1220",
    minHeight: "100vh",
    color: "white",
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 12,
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Historial mensual</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>Últimos 30 días • API: {API_BASE}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/admin/kds" style={btn}>
            ← Volver a KDS
          </Link>

          <button onClick={load} style={btn}>
            🔄 Refrescar
          </button>
        </div>
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

      {loading ? (
        <div style={card}>Cargando historial…</div>
      ) : rows.length === 0 ? (
        <div style={card}>No hay pedidos en los últimos 30 días.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => {
            const c = estadoColor(r.estado);
            return (
              <div key={r.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>
                      Pedido #{r.id} <span style={{ opacity: 0.7, fontWeight: 700 }}>— Mesa {r.mesa_id}</span>
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>
                      🕒 {r.fecha} • 🍽️ {r.itemsCount} ítems • 💰 € {r.total.toFixed(2)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: c.bg,
                      color: c.fg,
                      border: `1px solid ${c.border}`,
                      fontSize: 12,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      whiteSpace: "nowrap",
                      height: "fit-content",
                    }}
                  >
                    {r.estado}
                  </div>
                </div>

                {r.comentario ? (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      fontSize: 13,
                    }}
                  >
                    📝 <span style={{ fontStyle: "italic" }}>{r.comentario}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
