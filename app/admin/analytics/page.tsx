"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
type Movimiento = {
  id: number;
  fecha: string | null;
  tipo: "GASTO" | "INGRESO";
  concepto: string;
  categoria: string;
  monto: number;
  iva: number;
  neto: number;
  proveedor?: string | null;
  created_at?: string;
};

type Granularity = "diario" | "semanal" | "mensual" | "anual";

// ── Helpers ──────────────────────────────────────────────────────────────────
function normalizeApiUrl(raw?: string) {
  if (!raw) return null;
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  if (!url.includes("localhost") && !url.includes("127.0.0.1"))
    url = url.replace(/^http:\/\//i, "https://");
  return url.replace(/\/+$/, "");
}

const API_BASE =
  normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL) ||
  "https://restaurante-backend-q43k.onrender.com";

function fmtISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtMoney(v: number) { return `€ ${v.toFixed(2)}`; }
function safeNum(v: any) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function startOfDay(d: Date)   { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d: Date)  { const x = startOfDay(d); const dy = x.getDay(); x.setDate(x.getDate() - (dy === 0 ? 6 : dy - 1)); return x; }
function startOfMonth(d: Date) { const x = startOfDay(d); x.setDate(1); return x; }
function startOfYear(d: Date)  { const x = startOfDay(d); x.setMonth(0, 1); return x; }
function addDays(d: Date, n: number)   { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }
function addYears(d: Date, n: number)  { const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x; }

function bucketStart(d: Date, g: Granularity): Date {
  if (g === "diario")  return startOfDay(d);
  if (g === "semanal") return startOfWeek(d);
  if (g === "mensual") return startOfMonth(d);
  return startOfYear(d);
}

function nextBucket(d: Date, g: Granularity): Date {
  if (g === "diario")  return addDays(d, 1);
  if (g === "semanal") return addDays(d, 7);
  if (g === "mensual") return addMonths(d, 1);
  return addYears(d, 1);
}

function fmtLabel(d: Date, g: Granularity): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (g === "diario")  return `${day}/${m}`;
  if (g === "semanal") return `${day}/${m}`;
  if (g === "mensual") return `${m}/${y}`;
  return `${y}`;
}

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchMovimientos(): Promise<Movimiento[]> {
  const res = await fetch(`${API_BASE}/contabilidad/movimientos?limit=2000`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error movimientos HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ── Resize hook ───────────────────────────────────────────────────────────────
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => { const w = e[0]?.contentRect.width; if (w) setWidth(w); });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

// ── Chart: Ingresos vs Gastos (dual area) ─────────────────────────────────────
type BarPoint = { label: string; ingreso: number; gasto: number; balance: number };

function DualChart({ points }: { points: BarPoint[] }) {
  const { ref, width: W } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(400, W);
  const h = 280;
  const padL = 58, padR = 16, padT = 20, padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const maxVal = Math.max(1, ...points.flatMap((p) => [p.ingreso, p.gasto]));
  const xAt  = (i: number) => padL + (points.length <= 1 ? 0 : (i / (points.length - 1)) * innerW);
  const yAt  = (v: number) => padT + (1 - v / maxVal) * innerH;

  const linePath = (key: "ingreso" | "gasto") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p[key]).toFixed(1)}`).join(" ");

  const areaPath = (key: "ingreso" | "gasto") =>
    linePath(key) +
    ` L ${xAt(points.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)}` +
    ` L ${padL.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];
  const cur = hover != null ? points[hover] : null;

  return (
    <div style={{ borderRadius: 18, background: "var(--t-card)", border: "1px solid var(--t-sborder)", boxShadow: "var(--t-shadow)", overflow: "hidden" }}>
      {/* Tooltip row */}
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: "var(--t-text)" }}>Ingresos vs Gastos por período</div>
        {cur ? (
          <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
            <span style={{ fontWeight: 900, color: "var(--t-text2)" }}>{cur.label}</span>
            <span style={{ color: "#16a34a", fontWeight: 900 }}>▲ {fmtMoney(cur.ingreso)}</span>
            <span style={{ color: "#dc2626", fontWeight: 900 }}>▼ {fmtMoney(cur.gasto)}</span>
            <span style={{ color: cur.balance >= 0 ? "#16a34a" : "#dc2626", fontWeight: 900 }}>
              = {fmtMoney(cur.balance)}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--t-text3)" }}>Pasa el cursor sobre el gráfico</span>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, padding: "0 18px 10px", fontSize: 12, fontWeight: 700 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 3, background: "#16a34a", borderRadius: 2, display: "inline-block" }} />
          <span style={{ color: "var(--t-text2)" }}>Ingresos</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 3, background: "#dc2626", borderRadius: 2, display: "inline-block" }} />
          <span style={{ color: "var(--t-text2)" }}>Gastos</span>
        </span>
      </div>

      <div ref={ref} style={{ width: "100%", overflow: "hidden" }}>
        <svg width={w} height={h} style={{ display: "block" }}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const bb = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const mx = e.clientX - bb.left;
            if (points.length === 0) return;
            const i = Math.round(Math.max(0, Math.min(points.length - 1, ((mx - padL) / innerW) * (points.length - 1))));
            setHover(i);
          }}
        >
          <defs>
            <linearGradient id="gradIn" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(22,163,74,0.45)" />
              <stop offset="100%" stopColor="rgba(22,163,74,0.02)" />
            </linearGradient>
            <linearGradient id="gradOut" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(220,38,38,0.35)" />
              <stop offset="100%" stopColor="rgba(220,38,38,0.02)" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {gridTicks.map((t) => {
            const y = padT + t * innerH;
            const v = maxVal * (1 - t);
            return (
              <g key={t}>
                <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="var(--t-border2)" strokeDasharray="4 3" />
                <text x={padL - 6} y={y + 4} fill="var(--t-text3)" fontSize="11" textAnchor="end">
                  €{Math.round(v)}
                </text>
              </g>
            );
          })}

          {/* Areas */}
          {points.length > 1 && <>
            <path d={areaPath("ingreso")} fill="url(#gradIn)" />
            <path d={areaPath("gasto")}   fill="url(#gradOut)" />
            <path d={linePath("ingreso")} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d={linePath("gasto")}   fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </>}

          {/* X labels */}
          {points.length > 0 && [0, Math.floor((points.length - 1) * 0.33), Math.floor((points.length - 1) * 0.66), points.length - 1]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((i) => (
              <text key={i} x={xAt(i)} y={padT + innerH + 22} fill="var(--t-text3)" fontSize="11" textAnchor="middle">
                {points[i]?.label}
              </text>
            ))}

          {/* Hover */}
          {hover != null && points[hover] && (
            <>
              <line x1={xAt(hover)} x2={xAt(hover)} y1={padT} y2={padT + innerH} stroke="var(--t-border)" strokeDasharray="4 2" />
              <circle cx={xAt(hover)} cy={yAt(points[hover].ingreso)} r={5} fill="#16a34a" stroke="var(--t-card)" strokeWidth={2} />
              <circle cx={xAt(hover)} cy={yAt(points[hover].gasto)}   r={5} fill="#dc2626" stroke="var(--t-card)" strokeWidth={2} />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Chart: Balance acumulado (sube con ingresos) ───────────────────────────────
type CumPoint = { label: string; saldo: number };

function BalanceChart({ points }: { points: CumPoint[] }) {
  const { ref, width: W } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(400, W);
  const h = 220;
  const padL = 68, padR = 16, padT = 20, padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const vals    = points.map((p) => p.saldo);
  const maxVal  = Math.max(1, ...vals.map(Math.abs));
  const minVal  = Math.min(0, ...vals);
  const range   = maxVal - minVal || 1;

  const xAt = (i: number) => padL + (points.length <= 1 ? 0 : (i / (points.length - 1)) * innerW);
  const yAt = (v: number) => padT + (1 - (v - minVal) / range) * innerH;
  const zeroY = yAt(0);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.saldo).toFixed(1)}`).join(" ");
  const areaPath = linePath +
    ` L ${xAt(points.length - 1).toFixed(1)} ${zeroY.toFixed(1)}` +
    ` L ${padL.toFixed(1)} ${zeroY.toFixed(1)} Z`;

  const cur = hover != null ? points[hover] : null;
  const positive = !cur || cur.saldo >= 0;

  return (
    <div style={{ borderRadius: 18, background: "var(--t-card)", border: "1px solid var(--t-sborder)", boxShadow: "var(--t-shadow)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: "var(--t-text)" }}>
          📈 Balance acumulado — saldo en el tiempo
        </div>
        {cur ? (
          <span style={{ fontWeight: 900, fontSize: 14, color: cur.saldo >= 0 ? "#16a34a" : "#dc2626" }}>
            {cur.label} → {fmtMoney(cur.saldo)}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--t-text3)" }}>Muestra cómo crece el saldo acumulado</span>
        )}
      </div>

      <div ref={ref} style={{ width: "100%", overflow: "hidden" }}>
        <svg width={w} height={h} style={{ display: "block" }}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const bb = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const mx = e.clientX - bb.left;
            if (!points.length) return;
            const i = Math.round(Math.max(0, Math.min(points.length - 1, ((mx - padL) / innerW) * (points.length - 1))));
            setHover(i);
          }}
        >
          <defs>
            <linearGradient id="gradBal" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={positive ? "rgba(22,163,74,0.40)" : "rgba(220,38,38,0.40)"} />
              <stop offset="100%" stopColor={positive ? "rgba(22,163,74,0.02)" : "rgba(220,38,38,0.02)"} />
            </linearGradient>
            <linearGradient id="lineGradBal" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="60%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + t * innerH;
            const v = minVal + (1 - t) * range;
            return (
              <g key={t}>
                <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="var(--t-border2)" strokeDasharray="4 3" />
                <text x={padL - 6} y={y + 4} fill="var(--t-text3)" fontSize="10" textAnchor="end">
                  {v >= 0 ? "" : "-"}€{Math.round(Math.abs(v))}
                </text>
              </g>
            );
          })}

          {/* Zero line */}
          {minVal < 0 && (
            <line x1={padL} x2={padL + innerW} y1={zeroY} y2={zeroY}
              stroke="var(--t-text3)" strokeWidth={1.5} strokeDasharray="6 3" />
          )}

          {/* Area + line */}
          {points.length > 1 && (
            <>
              <path d={areaPath} fill="url(#gradBal)" />
              <path d={linePath} fill="none" stroke="url(#lineGradBal)" strokeWidth={3}
                strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {/* X labels */}
          {points.length > 0 && [0, Math.floor((points.length - 1) * 0.33), Math.floor((points.length - 1) * 0.66), points.length - 1]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((i) => (
              <text key={i} x={xAt(i)} y={padT + innerH + 22} fill="var(--t-text3)" fontSize="11" textAnchor="middle">
                {points[i]?.label}
              </text>
            ))}

          {/* Hover */}
          {hover != null && points[hover] && (
            <>
              <line x1={xAt(hover)} x2={xAt(hover)} y1={padT} y2={padT + innerH}
                stroke="var(--t-border)" strokeDasharray="4 2" />
              <circle cx={xAt(hover)} cy={yAt(points[hover].saldo)} r={5}
                fill={points[hover].saldo >= 0 ? "#16a34a" : "#dc2626"}
                stroke="var(--t-card)" strokeWidth={2} />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [granularity, setGranularity] = useState<Granularity>("mensual");
  const [fromISO, setFromISO] = useState(() => fmtISO(addMonths(new Date(), -12)));
  const [toISO, setToISO] = useState(() => fmtISO(new Date()));

  const load = useCallback(async () => {
    try {
      setBusy(true); setError(null);
      const data = await fetchMovimientos();
      setMovimientos(data);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando datos");
    } finally {
      setBusy(false); setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function setPreset(g: Granularity) {
    const now = new Date();
    setGranularity(g);
    if (g === "diario")  { setFromISO(fmtISO(addDays(now, -30)));     setToISO(fmtISO(now)); }
    if (g === "semanal") { setFromISO(fmtISO(addMonths(now, -6)));     setToISO(fmtISO(now)); }
    if (g === "mensual") { setFromISO(fmtISO(addMonths(now, -12)));    setToISO(fmtISO(now)); }
    if (g === "anual")   { setFromISO(fmtISO(addYears(now, -5)));      setToISO(fmtISO(now)); }
  }

  // ── Filter by date range ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const from = startOfDay(new Date(fromISO)).getTime();
    const to   = addDays(startOfDay(new Date(toISO)), 1).getTime();
    return movimientos.filter((m) => {
      const d = parseDate(m.fecha);
      if (!d) return false;
      const t = d.getTime();
      return t >= from && t < to;
    });
  }, [movimientos, fromISO, toISO]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    let ingresos = 0, gastos = 0;
    for (const m of filtered) {
      if (m.tipo === "INGRESO") ingresos += safeNum(m.monto);
      else                      gastos   += safeNum(m.monto);
    }
    const balance  = ingresos - gastos;
    const margen   = ingresos ? (balance / ingresos) * 100 : 0;
    return { ingresos, gastos, balance, margen };
  }, [filtered]);

  // ── Bucket data ───────────────────────────────────────────────────────────
  const { barPoints, cumPoints } = useMemo(() => {
    const from = startOfDay(new Date(fromISO));
    const to   = startOfDay(new Date(toISO));

    // Build bucket map
    const map = new Map<string, BarPoint>();
    let cur = bucketStart(from, granularity);
    const end = bucketStart(to, granularity);

    for (let i = 0; i < 2000; i++) {
      const key = cur.toISOString();
      map.set(key, { label: fmtLabel(cur, granularity), ingreso: 0, gasto: 0, balance: 0 });
      if (cur.getTime() >= end.getTime()) break;
      cur = nextBucket(cur, granularity);
    }

    // Fill with data
    for (const m of filtered) {
      const d = parseDate(m.fecha);
      if (!d) continue;
      const key = bucketStart(d, granularity).toISOString();
      const pt  = map.get(key);
      if (!pt) continue;
      const v = safeNum(m.monto);
      if (m.tipo === "INGRESO") pt.ingreso += v;
      else                      pt.gasto   += v;
    }

    // Compute balance per period & cumulative
    const barPoints: BarPoint[] = [];
    const cumPoints: CumPoint[] = [];
    let running = 0;

    for (const pt of map.values()) {
      pt.balance = pt.ingreso - pt.gasto;
      barPoints.push(pt);
      running += pt.balance;
      cumPoints.push({ label: pt.label, saldo: running });
    }

    return { barPoints, cumPoints };
  }, [filtered, fromISO, toISO, granularity]);

  // ── Top categorías ────────────────────────────────────────────────────────
  const topCats = useMemo(() => {
    const map = new Map<string, { ingreso: number; gasto: number }>();
    for (const m of filtered) {
      const cat = m.categoria || "Sin categoría";
      if (!map.has(cat)) map.set(cat, { ingreso: 0, gasto: 0 });
      const e = map.get(cat)!;
      if (m.tipo === "INGRESO") e.ingreso += safeNum(m.monto);
      else                      e.gasto   += safeNum(m.monto);
    }
    return Array.from(map.entries())
      .map(([cat, v]) => ({ cat, ...v, total: v.ingreso + v.gasto }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filtered]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "var(--t-card)", border: "1px solid var(--t-sborder)",
    borderRadius: 16, padding: "16px 20px", boxShadow: "var(--t-shadow)",
  };

  const btn: React.CSSProperties = {
    padding: "9px 14px", borderRadius: 12,
    border: "1px solid var(--t-border3)", background: "var(--t-card)",
    color: "var(--t-text)", fontWeight: 800, cursor: "pointer",
    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px", borderRadius: 999, fontWeight: 800, cursor: "pointer", fontSize: 13,
    border: active ? "1px solid #6C5CE7" : "1px solid var(--t-border3)",
    background: active ? "#6C5CE7" : "var(--t-card2)",
    color: active ? "#fff" : "var(--t-text2)",
    transition: "all 0.15s ease",
  });

  const selectStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 12, fontWeight: 700, fontSize: 13,
    border: "1px solid var(--t-border3)", background: "var(--t-input)", color: "var(--t-text)",
  };

  const kpiDelta = (v: number): React.CSSProperties => ({
    fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
    background: v >= 0 ? "#D1FAE5" : "#FEE2E2",
    color: v >= 0 ? "#15803d" : "#dc2626",
    display: "inline-block",
  });

  return (
    <div style={{ padding: "24px 28px", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>
            📊 Analytics Pro — Contabilidad
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--t-text2)" }}>
            Ingresos, gastos y balance acumulado en el tiempo
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/contabilidad" style={btn}>📒 Contabilidad</Link>
          <Link href="/admin/reportes"     style={btn}>📋 Reportes</Link>
          <button onClick={load} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ ...card, background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.3)", color: "#991B1B" }}>
          ⚠️ {error} — Verifica NEXT_PUBLIC_API_URL
        </div>
      )}

      {/* ── Filters ── */}
      <div style={card}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {/* Granularity chips */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["diario", "semanal", "mensual", "anual"] as Granularity[]).map((g) => (
              <button key={g} style={chip(granularity === g)} onClick={() => setPreset(g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--t-text2)" }}>
            Desde
            <input type="date" value={fromISO} onChange={(e) => setFromISO(e.target.value)} style={selectStyle} />
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--t-text2)" }}>
            Hasta
            <input type="date" value={toISO} onChange={(e) => setToISO(e.target.value)} style={selectStyle} />
          </label>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--t-text3)" }}>
          {filtered.length} movimientos en el rango · {movimientos.length} totales cargados
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {/* Ingresos */}
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text2)", marginBottom: 8 }}>
            💰 Total Ingresos
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#16a34a", lineHeight: 1 }}>
            {loading ? "…" : fmtMoney(kpis.ingresos)}
          </div>
          <div style={{ fontSize: 12, color: "var(--t-text3)", marginTop: 6 }}>
            {filtered.filter(m => m.tipo === "INGRESO").length} entradas
          </div>
        </div>

        {/* Gastos */}
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text2)", marginBottom: 8 }}>
            📤 Total Gastos
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626", lineHeight: 1 }}>
            {loading ? "…" : fmtMoney(kpis.gastos)}
          </div>
          <div style={{ fontSize: 12, color: "var(--t-text3)", marginTop: 6 }}>
            {filtered.filter(m => m.tipo === "GASTO").length} entradas
          </div>
        </div>

        {/* Balance neto */}
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text2)", marginBottom: 8 }}>
            ⚖️ Balance Neto
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: kpis.balance >= 0 ? "#16a34a" : "#dc2626", lineHeight: 1 }}>
            {loading ? "…" : fmtMoney(kpis.balance)}
          </div>
          <div style={{ marginTop: 6 }}>
            <span style={kpiDelta(kpis.balance)}>
              {kpis.balance >= 0 ? "▲ Positivo" : "▼ Negativo"}
            </span>
          </div>
        </div>

        {/* Margen */}
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text2)", marginBottom: 8 }}>
            📈 Margen Neto
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: kpis.margen >= 0 ? "#16a34a" : "#dc2626", lineHeight: 1 }}>
            {loading ? "…" : `${kpis.margen.toFixed(1)}%`}
          </div>
          <div style={{ fontSize: 12, color: "var(--t-text3)", marginTop: 6 }}>
            Balance ÷ Ingresos
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      {loading ? (
        <div style={card}>Cargando datos de contabilidad…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 40, color: "var(--t-text2)" }}>
          Sin movimientos en el rango seleccionado
        </div>
      ) : (
        <>
          {/* Dual chart: Ingresos vs Gastos */}
          <DualChart points={barPoints} />

          {/* Cumulative balance */}
          <BalanceChart points={cumPoints} />

          {/* ── Top categorías ── */}
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 16 }}>
              🏷️ Top categorías del período
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topCats.map(({ cat, ingreso, gasto, total }) => {
                const maxTotal = topCats[0]?.total || 1;
                const pct = (total / maxTotal) * 100;
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{cat}</span>
                      <div style={{ display: "flex", gap: 14 }}>
                        {ingreso > 0 && <span style={{ color: "#16a34a", fontWeight: 700 }}>▲ {fmtMoney(ingreso)}</span>}
                        {gasto > 0   && <span style={{ color: "#dc2626", fontWeight: 700 }}>▼ {fmtMoney(gasto)}</span>}
                      </div>
                    </div>
                    <div style={{ height: 6, background: "var(--t-card2)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: ingreso > gasto
                          ? "linear-gradient(90deg,#16a34a,#22c55e)"
                          : "linear-gradient(90deg,#dc2626,#f87171)",
                        borderRadius: 99, transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div style={{ fontSize: 11, color: "var(--t-text3)", paddingBottom: 8 }}>
        Datos desde <strong>/contabilidad/movimientos</strong> · Ingresos en verde, gastos en rojo
      </div>
    </div>
  );
}
