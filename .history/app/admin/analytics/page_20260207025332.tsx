"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PedidoItem = { plato_id: number; cantidad: number };
type Pedido = {
  id: number;
  mesa_id: number;
  estado?: string;
  items?: PedidoItem[];
  fecha_hora?: string | null;
  created_at?: string | null;
};

type MenuItem = { id: number; nombre: string; precio: number; categoria?: string | null };

type Granularity = "diario" | "semanal" | "mensual" | "anual";
type Metric = "monto" | "items" | "pedidos" | "ticket";

// ✅ FIX: normaliza NEXT_PUBLIC_API_URL para evitar que quede en http:// o // (CORS en localhost)
function normalizeApiUrl(raw?: string) {
  if (!raw) return null;

  let url = raw.trim();

  // Si viene como //dominio -> forzar https://
  if (url.startsWith("//")) url = `https:${url}`;

  // Forzar https si viene http
  url = url.replace(/^http:\/\//i, "https://");

  // Quitar slash final
  url = url.replace(/\/+$/, "");

  return url;
}

// ✅ SIEMPRE termina en https://...
const API_BASE =
  normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL) ||
  "https://restaurante-backend-q43k.onrender.com";

function toDateSafe(raw?: string | null): Date | null {
  if (!raw) return null;
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtISO(d: Date) {
  const y = String(d.getFullYear()).padStart(4, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  // Monday as start (like most dashboards)
  const day = x.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function startOfYear(d: Date) {
  const x = startOfDay(d);
  x.setMonth(0, 1);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function addYears(d: Date, n: number) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + n);
  return x;
}

function formatLabel(d: Date, g: Granularity) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  if (g === "diario") return `${day}/${m}`;
  if (g === "semanal") return `Sem ${day}/${m}`;
  if (g === "mensual") return `${m}/${y}`;
  return `${y}`;
}

async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/menu`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error menú ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchHistorial(limit = 2000): Promise<Pedido[]> {
  // Usa tu endpoint de historial (ya lo tienes en backend)
  const res = await fetch(`${API_BASE}/pedidos_historial?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error historial ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Pedido[]) : [];
}

type Point = {
  t: Date; // bucket start time
  label: string;
  monto: number; // revenue
  items: number; // items qty
  pedidos: number; // orders count
};

function buildBuckets(rangeFrom: Date, rangeTo: Date, g: Granularity): Date[] {
  const from = new Date(rangeFrom);
  const to = new Date(rangeTo);

  let cur: Date;
  let inc: (d: Date) => Date;
  let startFn: (d: Date) => Date;

  if (g === "diario") {
    startFn = startOfDay;
    inc = (d) => addDays(d, 1);
  } else if (g === "semanal") {
    startFn = startOfWeek;
    inc = (d) => addDays(d, 7);
  } else if (g === "mensual") {
    startFn = startOfMonth;
    inc = (d) => addMonths(d, 1);
  } else {
    startFn = startOfYear;
    inc = (d) => addYears(d, 1);
  }

  cur = startFn(from);
  const end = startFn(to);

  const buckets: Date[] = [];
  // include bucket that contains end
  for (let safety = 0; safety < 5000; safety++) {
    buckets.push(new Date(cur));
    if (cur.getTime() >= end.getTime()) break;
    cur = inc(cur);
    if (cur.getTime() > end.getTime() && buckets[buckets.length - 1].getTime() !== end.getTime()) {
      // keep safe
    }
  }
  return buckets;
}

function bucketKey(d: Date, g: Granularity) {
  if (g === "diario") return startOfDay(d).toISOString();
  if (g === "semanal") return startOfWeek(d).toISOString();
  if (g === "mensual") return startOfMonth(d).toISOString();
  return startOfYear(d).toISOString();
}

function sumPedidoRevenue(p: Pedido, priceMap: Map<number, number>, dishId: number | "ALL") {
  const items = Array.isArray(p.items) ? p.items : [];
  let monto = 0;
  let countItems = 0;

  for (const it of items) {
    const id = Number(it.plato_id);
    const cant = Number(it.cantidad) || 0;
    if (dishId !== "ALL" && id !== dishId) continue;
    const precio = Number(priceMap.get(id) ?? 0);
    monto += precio * cant;
    countItems += cant;
  }

  return { monto, items: countItems };
}

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return (a / b) * 100;
}

function formatMoney(v: number) {
  return `€ ${v.toFixed(2)}`;
}

function niceNumber(n: number) {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1000) return n.toLocaleString();
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

function useResizeObserver<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [rect, setRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setRect({ width: r.width, height: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, rect };
}

/** Simple “stock-like” chart (area + line + crosshair tooltip) with SVG */
function StockChart({ points, metric }: { points: Point[]; metric: Metric }) {
  const { ref, rect } = useResizeObserver<HTMLDivElement>();
  const w = Math.max(320, rect.width || 0);
  const h = 260;

  const values = points.map((p) => {
    if (metric === "monto") return p.monto;
    if (metric === "items") return p.items;
    if (metric === "pedidos") return p.pedidos;
    // ticket promedio
    return p.pedidos ? p.monto / p.pedidos : 0;
  });

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);

  const padL = 46;
  const padR = 14;
  const padT = 14;
  const padB = 34;

  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const xAt = (i: number) => padL + (points.length <= 1 ? 0 : (i / (points.length - 1)) * innerW);
  const yAtVal = (v: number) => {
    const t = max === min ? 0.5 : (v - min) / (max - min);
    return padT + (1 - t) * innerH;
  };

  const lineD = points
    .map((p, i) => {
      const v = values[i];
      const x = xAt(i);
      const y = yAtVal(v);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const areaD =
    lineD +
    ` L ${(padL + innerW).toFixed(2)} ${(padT + innerH).toFixed(2)}` +
    ` L ${padL.toFixed(2)} ${(padT + innerH).toFixed(2)} Z`;

  const [hover, setHover] = useState<number | null>(null);

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => i);

  const current = hover != null ? points[hover] : null;
  const curVal = hover != null ? values[hover] : null;

  return (
    <div
      ref={ref}
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 900, fontSize: 14, opacity: 0.92 }}>
          {metric === "monto"
            ? "Monto (ingresos)"
            : metric === "items"
              ? "Items vendidos"
              : metric === "pedidos"
                ? "Pedidos"
                : "Ticket promedio"}
        </div>
        <div style={{ opacity: 0.85, fontSize: 12 }}>
          {current ? (
            <>
              <span style={{ fontWeight: 900 }}>{current.label}</span> ·{" "}
              <span style={{ fontWeight: 900 }}>
                {metric === "monto" ? formatMoney(curVal ?? 0) : niceNumber(curVal ?? 0)}
              </span>
            </>
          ) : (
            <span>Pasa el mouse sobre el gráfico</span>
          )}
        </div>
      </div>

      <svg
        width={w}
        height={h}
        style={{ display: "block" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const bb = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const mx = e.clientX - bb.left;
          const i = clamp(Math.round(((mx - padL) / innerW) * (points.length - 1)), 0, Math.max(0, points.length - 1));
          setHover(points.length ? i : null);
        }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.55)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.05)" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(59,130,246,0.95)" />
            <stop offset="50%" stopColor="rgba(99,102,241,0.95)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.95)" />
          </linearGradient>
        </defs>

        {/* grid */}
        {ticks.map((t) => {
          const y = padT + (t / gridLines) * innerH;
          return <line key={t} x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" />;
        })}

        {/* y labels */}
        {ticks.map((t) => {
          const v = max - (t / gridLines) * (max - min);
          const y = padT + (t / gridLines) * innerH;
          return (
            <text key={`yl-${t}`} x={padL - 8} y={y + 4} fill="rgba(255,255,255,0.55)" fontSize="11" textAnchor="end">
              {metric === "monto" ? (v >= 0 ? `€${Math.round(v)}` : `-€${Math.round(Math.abs(v))}`) : Math.round(v)}
            </text>
          );
        })}

        {/* area */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* line */}
        <path d={lineD} fill="none" stroke="url(#lineGrad)" strokeWidth={2.5} />

        {/* x labels (few) */}
        {points.length > 1
          ? [0, Math.floor((points.length - 1) * 0.33), Math.floor((points.length - 1) * 0.66), points.length - 1]
              .filter((x, i, arr) => arr.indexOf(x) === i)
              .map((i) => (
                <text
                  key={`xl-${i}`}
                  x={xAt(i)}
                  y={padT + innerH + 22}
                  fill="rgba(255,255,255,0.60)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {points[i]?.label ?? ""}
                </text>
              ))
          : null}

        {/* hover */}
        {hover != null && points[hover] ? (
          <>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={padT} y2={padT + innerH} stroke="rgba(255,255,255,0.16)" />
            <circle
              cx={xAt(hover)}
              cy={yAtVal(values[hover])}
              r={4.5}
              fill="rgba(255,255,255,0.95)"
              stroke="rgba(99,102,241,0.95)"
              strokeWidth={2}
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [granularity, setGranularity] = useState<Granularity>("diario");
  const [metric, setMetric] = useState<Metric>("monto");

  const [fromISO, setFromISO] = useState<string>(() => {
    const d = new Date();
    return fmtISO(addDays(d, -30));
  });
  const [toISO, setToISO] = useState<string>(() => fmtISO(new Date()));

  const [dishId, setDishId] = useState<number | "ALL">("ALL");

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [hist, setHist] = useState<Pedido[]>([]);

  const priceMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const it of menu) m.set(Number(it.id), Number(it.precio) || 0);
    return m;
  }, [menu]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      setError(null);
      const [m, h] = await Promise.all([fetchMenu(), fetchHistorial(2500)]);
      setMenu(m);
      setHist(h);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const range = useMemo(() => {
    const from = startOfDay(new Date(fromISO));
    const to = startOfDay(new Date(toISO));
    // ensure from <= to
    return from.getTime() <= to.getTime() ? { from, to } : { from: to, to: from };
  }, [fromISO, toISO]);

  const points = useMemo<Point[]>(() => {
    // build bucket list
    const buckets = buildBuckets(range.from, range.to, granularity);
    const map = new Map<string, Point>();

    for (const b of buckets) {
      const key = b.toISOString();
      map.set(key, { t: b, label: formatLabel(b, granularity), monto: 0, items: 0, pedidos: 0 });
    }

    // aggregate from historial within range
    const fromT = range.from.getTime();
    const toT = addDays(range.to, 1).getTime(); // inclusive end-day

    for (const p of hist) {
      const dt = toDateSafe(p.fecha_hora ?? p.created_at ?? null);
      if (!dt) continue;
      const t = dt.getTime();
      if (t < fromT || t >= toT) continue;

      const key = bucketKey(dt, granularity);
      const pt = map.get(key);
      if (!pt) continue;

      const { monto, items } = sumPedidoRevenue(p, priceMap, dishId);
      if (dishId !== "ALL" && items === 0 && monto === 0) continue;

      pt.monto += monto;
      pt.items += items;
      pt.pedidos += 1;
    }

    return Array.from(map.values()).sort((a, b) => a.t.getTime() - b.t.getTime());
  }, [hist, priceMap, dishId, range.from, range.to, granularity]);

  const totals = useMemo(() => {
    const monto = points.reduce((acc, p) => acc + p.monto, 0);
    const items = points.reduce((acc, p) => acc + p.items, 0);
    const pedidos = points.reduce((acc, p) => acc + p.pedidos, 0);
    const ticket = pedidos ? monto / pedidos : 0;

    // change vs previous same-length window
    const lenDays = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const prevFrom = addDays(range.from, -lenDays);
    const prevTo = addDays(range.to, -lenDays);

    let prevMonto = 0;
    let prevItems = 0;
    let prevPedidos = 0;

    const prevFromT = prevFrom.getTime();
    const prevToT = addDays(prevTo, 1).getTime();

    for (const p of hist) {
      const dt = toDateSafe(p.fecha_hora ?? p.created_at ?? null);
      if (!dt) continue;
      const t = dt.getTime();
      if (t < prevFromT || t >= prevToT) continue;
      const { monto: m, items: it } = sumPedidoRevenue(p, priceMap, dishId);
      if (dishId !== "ALL" && m === 0 && it === 0) continue;
      prevMonto += m;
      prevItems += it;
      prevPedidos += 1;
    }

    return {
      monto,
      items,
      pedidos,
      ticket,
      prevMonto,
      prevItems,
      prevPedidos,
      deltaMonto: prevMonto ? pct(monto - prevMonto, prevMonto) : 0,
      deltaItems: prevItems ? pct(items - prevItems, prevItems) : 0,
      deltaPedidos: prevPedidos ? pct(pedidos - prevPedidos, prevPedidos) : 0,
      deltaTicket: prevPedidos ? pct(ticket - prevMonto / prevPedidos, prevMonto / prevPedidos) : 0,
    };
  }, [points, hist, priceMap, dishId, range.from, range.to]);

  function setPreset(g: Granularity) {
    const now = new Date();
    const to = startOfDay(now);
    let from: Date;

    if (g === "diario") from = addDays(to, -30);
    else if (g === "semanal") from = addDays(to, -(26 * 7));
    else if (g === "mensual") from = addMonths(to, -24);
    else from = addYears(to, -5);

    setGranularity(g);
    setFromISO(fmtISO(from));
    setToISO(fmtISO(to));
  }

  const pageStyle: React.CSSProperties = {
    padding: 16,
    background: "#0b1220",
    minHeight: "100vh",
    color: "white",
  };

  const topBar: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 14,
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

  const ghost: React.CSSProperties = {
    ...btn,
    background: "rgba(255,255,255,0.06)",
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: active ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.07)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
  });

  const statCard: React.CSSProperties = {
    ...card,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 240,
    flex: "1 1 240px",
  };

  const deltaStyle = (v: number): React.CSSProperties => ({
    fontWeight: 900,
    fontSize: 12,
    opacity: 0.95,
    padding: "3px 8px",
    borderRadius: 999,
    display: "inline-block",
    border: "1px solid rgba(255,255,255,0.10)",
    background: v >= 0 ? "rgba(34,197,94,0.16)" : "rgba(239,68,68,0.16)",
  });

  return (
    <div style={pageStyle}>
      <div style={topBar}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950 }}>Analytics — Reportes Pro</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>API: {API_BASE}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/admin/kds" style={ghost}>
            ← KDS
          </Link>
          <Link href="/admin/reportes" style={ghost}>
            📊 Reportes
          </Link>
          <button onClick={load} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>
            🔄 Recargar
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

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setPreset("diario")} style={chip(granularity === "diario")}>
              Diario
            </button>
            <button onClick={() => setPreset("semanal")} style={chip(granularity === "semanal")}>
              Semanal
            </button>
            <button onClick={() => setPreset("mensual")} style={chip(granularity === "mensual")}>
              Mensual
            </button>
            <button onClick={() => setPreset("anual")} style={chip(granularity === "anual")}>
              Anual
            </button>
          </div>

          <div style={{ flex: "1 1 12px" }} />

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.95 }}>
            Desde
            <input
              type="date"
              value={fromISO}
              onChange={(e) => setFromISO(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                fontWeight: 900,
              }}
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.95 }}>
            Hasta
            <input
              type="date"
              value={toISO}
              onChange={(e) => setToISO(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                fontWeight: 900,
              }}
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.95 }}>
            Plato
            <select
              value={dishId === "ALL" ? "ALL" : String(dishId)}
              onChange={(e) => {
                const v = e.target.value;
                setDishId(v === "ALL" ? "ALL" : Number(v));
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                fontWeight: 900,
                maxWidth: 260,
              }}
            >
              <option value="ALL">Todos</option>
              {menu
                .slice()
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} (#{m.id})
                  </option>
                ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.95 }}>
            Métrica
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                fontWeight: 900,
              }}
            >
              <option value="monto">Monto</option>
              <option value="items">Items</option>
              <option value="pedidos">Pedidos</option>
              <option value="ticket">Ticket</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 10, opacity: 0.85, fontSize: 12 }}>
          Ventana: <span style={{ fontWeight: 900 }}>{fromISO}</span> → <span style={{ fontWeight: 900 }}>{toISO}</span>{" "}
          · Fuente: <span style={{ fontWeight: 900 }}>/pedidos_historial</span> + <span style={{ fontWeight: 900 }}>/menu</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={statCard}>
          <div style={{ opacity: 0.82, fontSize: 12 }}>Monto total</div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>{formatMoney(totals.monto)}</div>
          <div style={deltaStyle(totals.deltaMonto)}>
            {totals.deltaMonto >= 0 ? "▲" : "▼"} {Math.abs(totals.deltaMonto).toFixed(1)}%
          </div>
        </div>

        <div style={statCard}>
          <div style={{ opacity: 0.82, fontSize: 12 }}>Items vendidos</div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>{totals.items.toLocaleString()}</div>
          <div style={deltaStyle(totals.deltaItems)}>
            {totals.deltaItems >= 0 ? "▲" : "▼"} {Math.abs(totals.deltaItems).toFixed(1)}%
          </div>
        </div>

        <div style={statCard}>
          <div style={{ opacity: 0.82, fontSize: 12 }}>Pedidos</div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>{totals.pedidos.toLocaleString()}</div>
          <div style={deltaStyle(totals.deltaPedidos)}>
            {totals.deltaPedidos >= 0 ? "▲" : "▼"} {Math.abs(totals.deltaPedidos).toFixed(1)}%
          </div>
        </div>

        <div style={statCard}>
          <div style={{ opacity: 0.82, fontSize: 12 }}>Ticket promedio</div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>{formatMoney(totals.ticket)}</div>
          <div style={deltaStyle(totals.deltaTicket)}>
            {totals.deltaTicket >= 0 ? "▲" : "▼"} {Math.abs(totals.deltaTicket).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? <div style={card}>Cargando…</div> : <StockChart points={points} metric={metric} />}

      <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
        Tip: cambia “Plato” a uno específico para ver su curva como si fuera una acción 📈
      </div>
    </div>
  );
}
