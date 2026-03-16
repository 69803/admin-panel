"use client";

/** ✅ KDS NORMAL — Cocina (columnas por estado) */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// ✅ Normaliza URL (SIEMPRE https) y arregla cuando viene sin protocolo
function normalizeApiUrl(raw?: string) {
  if (!raw) return null;

  let url = raw.trim();

  // solo quitar slash final
  url = url.replace(/\/+$/, "");

  return url;
}

const API_BASE =
  normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL) ||
  "https://restaurante-backend-q43k.onrender.com";

console.log("KDS API_BASE =", API_BASE);

// helper: arma URL segura
function api(path: string) {
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

const ESTADOS = ["pendiente", "preparando", "listo", "entregado", "cancelado"] as const;
type Estado = (typeof ESTADOS)[number];

function normalizeEstado(raw: any): Estado {
  const s = String(raw ?? "pendiente").trim().toLowerCase();
  return (ESTADOS as readonly string[]).includes(s) ? (s as Estado) : "pendiente";
}

function pickComentario(p: Pedido): string | null {
  const v = p.comentario ?? p.nota ?? p.observaciones ?? p.observacion ?? p.comment ?? null;
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

function fmtFecha(raw?: string | null) {
  if (!raw) return "";
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return raw;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

async function fetchPedidos(): Promise<Pedido[]> {
  const res = await fetch(api("/pedidos"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Error pedidos ${res.status}`);
  const data = (await res.json()) as Pedido[];
  return Array.isArray(data) ? data : [];
}

async function patchEstado(pedidoId: number, estado: Estado): Promise<boolean> {
  const res = await fetch(api(`/pedidos/${pedidoId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
  return res.ok;
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

export default function KdsPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalSec, setIntervalSec] = useState(10);

  // Sonido
  const [soundEnabled, setSoundEnabled] = useState(false);
  const lastMaxIdRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(
    async (initial = false) => {
      try {
        if (initial) setLoading(true);
        setError(null);

        const data = await fetchPedidos();
        data.sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0));
        setPedidos(data);

        const maxId = data.length ? Math.max(...data.map((p) => p.id)) : null;
        if (initial) {
          lastMaxIdRef.current = maxId;
        } else if (
          soundEnabled &&
          maxId != null &&
          lastMaxIdRef.current != null &&
          maxId > lastMaxIdRef.current
        ) {
          try {
            if (audioRef.current) audioRef.current.currentTime = 0;
            await audioRef.current?.play();
          } catch {}
          lastMaxIdRef.current = maxId;
        } else {
          lastMaxIdRef.current = maxId;
        }
      } catch (e: any) {
        setError(e?.message ?? "Error cargando pedidos");
      } finally {
        if (initial) setLoading(false);
      }
    },
    [soundEnabled]
  );

  useEffect(() => {
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    load(true);
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const ms = Math.max(3, intervalSec) * 1000;
    const t = setInterval(() => load(false), ms);
    return () => clearInterval(t);
  }, [autoRefresh, intervalSec, load]);

  const grouped = useMemo(() => {
    const buckets: Record<Estado, Pedido[]> = {
      pendiente: [],
      preparando: [],
      listo: [],
      entregado: [],
      cancelado: [],
    };
    for (const p of pedidos) buckets[normalizeEstado(p.estado)].push(p);
    return buckets;
  }, [pedidos]);

  async function onMove(p: Pedido, next: Estado) {
    setBusyId(p.id);
    const ok = await patchEstado(p.id, next);
    setBusyId(null);

    if (!ok) {
      setError("No se pudo cambiar el estado (PATCH falló).");
      return;
    }
    await load(false);
  }

  const pageStyle: React.CSSProperties = {
    padding: 16,
    background: "#F4F6FA",
    minHeight: "100vh",
    color: "#111111",
  };

  const topBar: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 14,
  };

  const card: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 16,
    padding: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
  };

  const columnsWrap: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(240px, 1fr))",
    gap: 12,
    alignItems: "start",
    overflowX: "auto",
    paddingBottom: 10,
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #DDE3E8",
    background: "#FFFFFF",
    color: "#111111",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  const colHeader = (estado: Estado, count: number) => {
    const c = estadoColor(estado);
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
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
            }}
          >
            {estado}
          </span>
          <span style={{ color: "#777777", fontSize: 12 }}>{count}</span>
        </div>
      </div>
    );
  };

  const pedidoCard = (p: Pedido) => {
    const estado = normalizeEstado(p.estado);
    const c = estadoColor(estado);
    const comentario = pickComentario(p);

    const itemsCount = Array.isArray(p.items)
      ? p.items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)
      : 0;

    const fecha = fmtFecha(p.fecha_hora ?? p.created_at ?? null);

    const btnBase: React.CSSProperties = {
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px solid #DDE3E8",
      background: "#FFFFFF",
      color: "#111111",
      fontWeight: 800,
      cursor: "pointer",
      fontSize: 12,
    };

    const disabled = busyId === p.id;

    function nextButtons() {
      if (estado === "pendiente") {
        return (
          <button
            disabled={disabled}
            onClick={() => onMove(p, "preparando")}
            style={{ ...btnBase, opacity: disabled ? 0.5 : 1 }}
          >
            → PREPARANDO
          </button>
        );
      }
      if (estado === "preparando") {
        return (
          <button
            disabled={disabled}
            onClick={() => onMove(p, "listo")}
            style={{ ...btnBase, opacity: disabled ? 0.5 : 1 }}
          >
            → LISTO
          </button>
        );
      }
      if (estado === "listo") {
        return (
          <button
            disabled={disabled}
            onClick={() => onMove(p, "entregado")}
            style={{ ...btnBase, opacity: disabled ? 0.5 : 1 }}
          >
            → ENTREGADO
          </button>
        );
      }
      return null;
    }

    return (
      <div
        key={p.id}
        style={{
          borderRadius: 14,
          padding: 12,
          background: "#F8F9FB",
          border: "1px solid #EAECF0",
        }}
      >
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 950 }}>
              Pedido #{p.id} <span style={{ color: "#777777", fontWeight: 800 }}>— Mesa {p.mesa_id}</span>
            </div>
            <div style={{ color: "#777777", fontSize: 12, marginTop: 2 }}>
              {fecha ? `🕒 ${fecha}` : ""}
              {itemsCount ? `  •  🍽️ ${itemsCount} ítems` : ""}
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
              fontWeight: 950,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              whiteSpace: "nowrap",
            }}
          >
            {estado}
          </div>
        </div>

        {comentario ? (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 12,
              background: "#F8F9FB",
              border: "1px solid #EAECF0",
              fontSize: 13,
              lineHeight: 1.25,
            }}
          >
            📝 <span style={{ fontStyle: "italic" }}>{comentario}</span>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {nextButtons()}

          {estado !== "cancelado" ? (
            <button
              disabled={disabled}
              onClick={() => onMove(p, "cancelado")}
              style={{
                ...btnBase,
                background: "#FEF2F2",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#991B1B",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <div style={topBar}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950 }}>KDS — Cocina</div>
          <div style={{ color: "#777777", fontSize: 13 }}>API: {API_BASE}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => load(true)} style={btn}>
            🔄 Refrescar
          </button>

          <Link href="/admin/kds/mensual" style={btn}>
            📅 Historial mensual
          </Link>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#777777" }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#777777" }}>
            Intervalo (s)
            <input
              type="number"
              min={3}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Math.max(3, Number(e.target.value) || 10))}
              style={{
                width: 70,
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #DDE3E8",
                background: "#FFFFFF",
                color: "#111111",
              }}
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#777777" }}>
            <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
            🔔 Sonido
          </label>
        </div>
      </div>

      {error ? (
        <div
          style={{
            ...card,
            borderColor: "rgba(239,68,68,0.35)",
            background: "#FEF2F2",
            color: "#991B1B",
            marginBottom: 12,
          }}
        >
          ⚠️ {error}
        </div>
      ) : null}

      {loading ? (
        <div style={card}>Cargando pedidos…</div>
      ) : (
        <div style={columnsWrap}>
          {(ESTADOS as readonly Estado[]).map((estado) => (
            <div key={estado} style={card}>
              {colHeader(estado, grouped[estado].length)}
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {grouped[estado].length ? grouped[estado].map((p) => pedidoCard(p)) : <div style={{ color: "#777777", fontSize: 13 }}>Sin pedidos</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
