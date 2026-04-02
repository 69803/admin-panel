"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────
type Movimiento = {
  id: number;
  fecha: string | null;
  tipo: "GASTO" | "INGRESO";
  concepto: string;
  categoria: string;
  monto: number;
  iva: number;
  neto: number;
};

type MonthOption = { label: string; year: number; month: number };

// ── API ───────────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(v: number) { return `€ ${v.toFixed(2)}`; }
function safeNum(v: unknown)  { const n = Number(v); return Number.isFinite(n) ? n : 0; }

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function getMonthStats(movs: Movimiento[], year: number, month: number) {
  const list = movs.filter((m) => {
    const d = m.fecha ? new Date(m.fecha) : null;
    return d && d.getFullYear() === year && d.getMonth() === month;
  });
  const sum = (tipo: "INGRESO" | "GASTO") =>
    list.filter((m) => m.tipo === tipo).reduce((a, m) => a + safeNum(m.monto), 0);
  const ingresos = sum("INGRESO");
  const gastos   = sum("GASTO");
  const balance  = ingresos - gastos;
  const margen   = ingresos > 0 ? (balance / ingresos) * 100 : 0;

  const catMap: Record<string, { ing: number; gas: number }> = {};
  list.forEach((m) => {
    const cat = m.categoria || "Sin categoría";
    if (!catMap[cat]) catMap[cat] = { ing: 0, gas: 0 };
    if (m.tipo === "INGRESO") catMap[cat].ing += safeNum(m.monto);
    else catMap[cat].gas += safeNum(m.monto);
  });
  const topGas = Object.entries(catMap).sort((a, b) => b[1].gas - a[1].gas).slice(0, 2);
  const topIng = Object.entries(catMap).sort((a, b) => b[1].ing - a[1].ing).slice(0, 2);

  return { ingresos, gastos, balance, margen, topGas, topIng, hasData: list.length > 0 };
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 10, started = true, skip = false) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => { setDisplayed(""); idx.current = 0; }, [text]);

  useEffect(() => {
    if (skip && text) { idx.current = text.length; setDisplayed(text); }
  }, [skip, text]);

  useEffect(() => {
    if (skip || !started || !text || idx.current >= text.length) return;
    const t = setTimeout(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
    }, speed);
    return () => clearTimeout(t);
  }, [displayed, text, speed, started, skip]);

  return displayed;
}

// ── Build main analysis ───────────────────────────────────────────────────────
function buildAnalysis(movs: Movimiento[], selYear?: number, selMonth?: number) {
  const now       = new Date();
  const thisMonth = selMonth ?? now.getMonth();
  const thisYear  = selYear  ?? now.getFullYear();
  const monthName = MONTH_NAMES[thisMonth];

  const lastD      = new Date(thisYear, thisMonth - 1, 1);
  const lastMonth  = lastD.getMonth();
  const lastYear   = lastD.getFullYear();
  const lastMonthName = MONTH_NAMES[lastMonth];

  const isCurrentMonth = thisYear === now.getFullYear() && thisMonth === now.getMonth();
  const dayOfMonth  = isCurrentMonth ? now.getDate() : new Date(thisYear, thisMonth + 1, 0).getDate();
  const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  const monthDone   = !isCurrentMonth || dayOfMonth >= daysInMonth;
  const progress    = dayOfMonth / daysInMonth;

  const cur  = getMonthStats(movs, thisYear, thisMonth);
  const prev = getMonthStats(movs, lastYear,  lastMonth);

  const projIngresos = progress > 0 ? cur.ingresos / progress : 0;
  const projBalance  = progress > 0 ? cur.balance  / progress : 0;

  let score = 50;
  if (cur.ingresos > 0) {
    if (cur.margen > 40)      score = 95;
    else if (cur.margen > 25) score = 82;
    else if (cur.margen > 10) score = 68;
    else if (cur.margen > 0)  score = 52;
    else                      score = 30;
  }
  if (prev.balance > 0 && cur.balance > prev.balance)       score = Math.min(100, score + 5);
  if (prev.balance > 0 && cur.balance < prev.balance * 0.8) score = Math.max(10,  score - 8);

  const period   = monthDone ? `Este mes de ${monthName}` : `Lo que va de ${monthName}`;
  const projLine = !monthDone && projIngresos > 0
    ? `\n\nA este ritmo, proyectamos cerrar el mes con ingresos de ${fmtMoney(projIngresos)} y un balance de ${fmtMoney(projBalance)}.`
    : "";

  let titulo = "";
  let letra  = "";

  if (score >= 85) {
    titulo = `¡Felicidades! Excelente mes 🎉`;
    letra  =
      `${period} ha sido excepcional.\n\n` +
      `📈 Ingresos: ${fmtMoney(cur.ingresos)}\n` +
      `📉 Gastos: ${fmtMoney(cur.gastos)}\n` +
      `💰 Balance neto: ${fmtMoney(cur.balance)} (margen ${cur.margen.toFixed(1)}%)${projLine}\n\n` +
      `Los números hablan solos — la operación está funcionando muy bien. ` +
      `Tu mayor fuente de ingresos viene de ${cur.topIng[0]?.[0] ?? "ventas"}.` +
      (prev.balance > 0 ? `\n\nAdemás, superaste el balance del mes anterior (${fmtMoney(prev.balance)}). ¡Sigue así!` : "") +
      `\n\n✅ ¿Qué puedes hacer para mantener el ritmo?\n` +
      `• Refuerza lo que más vende: ${cur.topIng[0]?.[0] ?? "tus productos estrella"}.\n` +
      `• Revisa si puedes reducir gastos en ${cur.topGas[0]?.[0] ?? "la categoría más cara"} (${fmtMoney(cur.topGas[0]?.[1].gas ?? 0)}).\n` +
      `• Considera reinvertir parte del margen en marketing o mejoras del local.`;
  } else if (score >= 60) {
    titulo = `¡Vas bien! Sigue mejorando 💪`;
    letra  =
      `${period} va por buen camino, aunque hay margen de mejora.\n\n` +
      `📈 Ingresos: ${fmtMoney(cur.ingresos)}\n` +
      `📉 Gastos: ${fmtMoney(cur.gastos)}\n` +
      `💰 Balance neto: ${fmtMoney(cur.balance)} (margen ${cur.margen.toFixed(1)}%)${projLine}\n\n` +
      (prev.balance > 0 && cur.balance >= prev.balance
        ? `Estás por encima del mes de ${lastMonthName} (${fmtMoney(prev.balance)}). Buen trabajo.\n\n`
        : prev.balance > 0 ? `El mes de ${lastMonthName} cerró con ${fmtMoney(prev.balance)}. Estás un poco por debajo.\n\n`
        : "") +
      `📌 Áreas de mejora:\n` +
      cur.topGas.map(([cat, v]) => `• ${cat}: gastos de ${fmtMoney(v.gas)} — evalúa si es optimizable.`).join("\n") +
      `\n\n💡 Acciones recomendadas:\n` +
      `• Potencia tu categoría más rentable: ${cur.topIng[0]?.[0] ?? "tus mejores productos"}.\n` +
      `• Negocia mejores condiciones en ${cur.topGas[0]?.[0] ?? "tus principales gastos"}.\n` +
      `• Mantén el control de gastos variables para mejorar el margen.`;
  } else if (score >= 35) {
    titulo = monthDone ? `Este mes fue difícil — aprendamos 📋` : `Vamos un poco mal, pero podemos mejorar 🔄`;
    letra  =
      `${period} los números muestran algunos desafíos.\n\n` +
      `📈 Ingresos: ${fmtMoney(cur.ingresos)}\n` +
      `📉 Gastos: ${fmtMoney(cur.gastos)}\n` +
      `💰 Balance neto: ${fmtMoney(cur.balance)} (margen ${cur.margen.toFixed(1)}%)${projLine}\n\n` +
      (prev.balance > 0 ? `En ${lastMonthName} el balance fue ${fmtMoney(prev.balance)}. Hay una diferencia notable que vale revisar.\n\n` : "") +
      `🔍 Lo que más está pesando:\n` +
      cur.topGas.map(([cat, v]) => `• ${cat}: ${fmtMoney(v.gas)} en gastos.`).join("\n") +
      `\n\n🚀 Plan de acción:\n` +
      `• Identifica y recorta gastos no esenciales en ${cur.topGas[0]?.[0] ?? "las categorías más altas"}.\n` +
      `• Busca aumentar ingresos en ${cur.topIng[0]?.[0] ?? "tus productos principales"} con promociones.\n` +
      `• Revisa la estructura de costes: ¿hay gastos fijos renegociables?\n` +
      `• Establece un presupuesto mensual máximo por categoría.`;
  } else {
    titulo = monthDone ? `Mes crítico — hay que tomar acción 🚨` : `Situación crítica — actuemos ya 🚨`;
    letra  =
      `${period} los números requieren atención inmediata.\n\n` +
      `📈 Ingresos: ${fmtMoney(cur.ingresos)}\n` +
      `📉 Gastos: ${fmtMoney(cur.gastos)}\n` +
      `💰 Balance neto: ${fmtMoney(cur.balance)}${projLine}\n\n` +
      (cur.balance < 0 ? `⚠️ El negocio está operando en pérdida este período.\n\n` : "") +
      `🛑 Principales problemas:\n` +
      cur.topGas.map(([cat, v]) => `• ${cat}: ${fmtMoney(v.gas)} — revisión urgente.`).join("\n") +
      `\n\n🔧 Acciones prioritarias:\n` +
      `• Reduce o elimina gastos no críticos de forma inmediata.\n` +
      `• Revisa precios de venta: ¿cubren todos los costes?\n` +
      `• Organiza una reunión de equipo para analizar la situación.\n` +
      `• Habla con tu asesor financiero esta semana.`;
  }

  return { titulo, letra, score, curIngresos: cur.ingresos, curGastos: cur.gastos, curBalance: cur.balance, curMargen: cur.margen, monthDone, monthName };
}

// ── Build comparison text ─────────────────────────────────────────────────────
function buildComparison(movs: Movimiento[], a: MonthOption, b: MonthOption): string {
  const sa = getMonthStats(movs, a.year, a.month);
  const sb = getMonthStats(movs, b.year, b.month);

  if (!sa.hasData && !sb.hasData)
    return `⚠️ No hay datos registrados para ninguno de los dos meses seleccionados.`;
  if (!sa.hasData)
    return `⚠️ No hay datos registrados para ${a.label}. Prueba con otro mes.`;
  if (!sb.hasData)
    return `⚠️ No hay datos registrados para ${b.label}. Prueba con otro mes.`;

  const balDiff  = sa.balance  - sb.balance;
  const ingDiff  = sa.ingresos - sb.ingresos;
  const gasDiff  = sa.gastos   - sb.gastos;
  const margenA  = sa.margen.toFixed(1);
  const margenB  = sb.margen.toFixed(1);

  const ingLine = ingDiff > 0
    ? `${a.label} generó ${fmtMoney(Math.abs(ingDiff))} más en ingresos.`
    : ingDiff < 0
    ? `${b.label} generó ${fmtMoney(Math.abs(ingDiff))} más en ingresos.`
    : `Ingresos idénticos en ambos meses.`;

  const gasLine = gasDiff > 0
    ? `${a.label} tuvo ${fmtMoney(Math.abs(gasDiff))} más en gastos.`
    : gasDiff < 0
    ? `${b.label} tuvo ${fmtMoney(Math.abs(gasDiff))} más en gastos.`
    : `Gastos idénticos en ambos meses.`;

  const catA = sa.topIng[0]?.[0] ?? "—";
  const catB = sb.topIng[0]?.[0] ?? "—";
  const catLine = catA === catB
    ? `En ambos meses la principal fuente de ingresos fue "${catA}".`
    : `La fuente principal de ingresos cambió: "${catA}" en ${a.label} vs "${catB}" en ${b.label}.`;

  const balPct = sb.balance !== 0 ? Math.abs((balDiff / Math.abs(sb.balance)) * 100) : 0;
  let veredicto = "";
  if (Math.abs(balDiff) < 5) {
    veredicto = `Ambos meses fueron prácticamente iguales. La diferencia de balance es mínima.`;
  } else if (balDiff > 0) {
    veredicto = `${a.label} fue el mes más fuerte, con ${fmtMoney(Math.abs(balDiff))} más de balance neto` +
      (balPct > 0 ? ` (${balPct.toFixed(0)}% mejor).` : ".") +
      (sa.margen > sb.margen ? ` El margen también fue superior: ${margenA}% vs ${margenB}%.` : "");
  } else {
    veredicto = `${b.label} fue el mes más fuerte, con ${fmtMoney(Math.abs(balDiff))} más de balance neto` +
      (balPct > 0 ? ` (${balPct.toFixed(0)}% mejor).` : ".") +
      (sb.margen > sa.margen ? ` El margen también fue superior: ${margenB}% vs ${margenA}%.` : "");
  }

  const winner = balDiff >= 0 ? a.label : b.label;
  const loser  = balDiff >= 0 ? b.label : a.label;

  return (
    `📊 Comparativa: ${a.label} vs ${b.label}\n\n` +
    `┌─ ${a.label}\n` +
    `│  📈 Ingresos: ${fmtMoney(sa.ingresos)}\n` +
    `│  📉 Gastos:   ${fmtMoney(sa.gastos)}\n` +
    `│  💰 Balance:  ${fmtMoney(sa.balance)}  (margen ${margenA}%)\n\n` +
    `┌─ ${b.label}\n` +
    `│  📈 Ingresos: ${fmtMoney(sb.ingresos)}\n` +
    `│  📉 Gastos:   ${fmtMoney(sb.gastos)}\n` +
    `│  💰 Balance:  ${fmtMoney(sb.balance)}  (margen ${margenB}%)\n\n` +
    `🔍 Diferencias clave:\n` +
    `• ${ingLine}\n` +
    `• ${gasLine}\n` +
    `• ${catLine}\n\n` +
    `🏆 Veredicto: ${veredicto}\n\n` +
    `💡 Aprende del mes ganador (${winner}): analiza qué fue diferente y repítelo.\n` +
    `🔧 En ${loser}: identifica si hubo gastos extraordinarios o caída de ventas.`
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r    = 44;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : score >= 35 ? "#f97316" : "#ef4444";
  return (
    <div style={{ position: "relative", width: 110, height: 110 }}>
      <svg width={110} height={110} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
        <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>IQ</span>
      </div>
    </div>
  );
}

// ── Letter card (only typewriter, no comparison) ──────────────────────────────
function LetterCard({ titulo, letra }: { titulo: string; letra: string }) {
  const [phase,   setPhase]   = useState<"idle"|"title"|"body">("idle");
  const [skipped, setSkipped] = useState(false);
  const typedTitle = useTypewriter(titulo, 20, phase === "title" || phase === "body", skipped);
  const typedBody  = useTypewriter(letra,   6, phase === "body", skipped);
  const titleDone  = typedTitle === titulo && titulo.length > 0;
  const bodyDone   = typedBody  === letra  && letra.length > 0;

  useEffect(() => {
    if (!titulo) return;
    setPhase("idle");
    setSkipped(false);
    const t = setTimeout(() => setPhase("title"), 400);
    return () => clearTimeout(t);
  }, [titulo]);

  useEffect(() => {
    if (phase === "title" && titleDone) {
      const t = setTimeout(() => setPhase("body"), 300);
      return () => clearTimeout(t);
    }
  }, [phase, titleDone]);

  const [cursorOn, setCursorOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: "var(--t-card)",
      border: "1px solid var(--t-border)",
      borderRadius: 18,
      padding: "32px 36px",
      flex: 1,
      boxShadow: "var(--t-shadow)",
      minHeight: 380,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      position: "relative",
    }}>
      {/* Paper lines */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 18 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute", left: 56, right: 20,
            top: 72 + i * 28, height: 1,
            background: "var(--t-border2)", opacity: 0.6,
          }} />
        ))}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 52, width: 1, background: "rgba(239,68,68,0.2)" }} />
      </div>

      {/* Top-right controls */}
      <div style={{ position: "absolute", top: 14, right: 16, display: "flex", gap: 8, alignItems: "center", zIndex: 2 }}>
        {!bodyDone && (
          <button
            onClick={() => { setSkipped(true); setPhase("body"); }}
            style={{
              fontSize: 10, fontWeight: 700, color: "var(--t-text3)",
              background: "var(--t-card2)", border: "1px solid var(--t-border)",
              borderRadius: 6, padding: "3px 8px", cursor: "pointer",
            }}
          >
            VER TODO
          </button>
        )}
        <span style={{ fontSize: 22, opacity: 0.35 }}>✏️</span>
      </div>

      {/* Title */}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--t-text)", margin: 0, lineHeight: 1.3, position: "relative", zIndex: 1 }}>
        {typedTitle}
        {phase === "title" && !titleDone && <span style={{ opacity: cursorOn ? 1 : 0, color: "#6366f1" }}>|</span>}
      </h2>

      {/* Body */}
      <div style={{ fontSize: 13.5, lineHeight: 1.8, color: "var(--t-text2)", whiteSpace: "pre-wrap", position: "relative", zIndex: 1 }}>
        {typedBody}
        {phase === "body" && !bodyDone && <span style={{ opacity: cursorOn ? 1 : 0, color: "#6366f1" }}>|</span>}
      </div>
    </div>
  );
}

// ── Comparison section (always visible) ───────────────────────────────────────
function CompareSection({ movs, allMonths }: { movs: Movimiento[]; allMonths: MonthOption[] }) {
  const [mes1, setMes1] = useState("");
  const [mes2, setMes2] = useState("");
  const [skip, setSkip] = useState(false);

  const compareText = useMemo(() => {
    if (!mes1 || !mes2 || mes1 === mes2) return "";
    const a = allMonths.find((m) => `${m.year}-${m.month}` === mes1);
    const b = allMonths.find((m) => `${m.year}-${m.month}` === mes2);
    if (!a || !b) return "";
    setSkip(false);
    return buildComparison(movs, a, b);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes1, mes2]);

  const [cPhase, setCPhase] = useState<"idle"|"writing">("idle");
  const typedC  = useTypewriter(compareText, 8, cPhase === "writing", skip);
  const cDone   = typedC === compareText && compareText.length > 0;

  useEffect(() => {
    setCPhase("idle");
    if (!compareText) return;
    const t = setTimeout(() => setCPhase("writing"), 150);
    return () => clearTimeout(t);
  }, [compareText]);

  const [cursorOn, setCursorOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(t);
  }, []);

  const sel: React.CSSProperties = {
    background: "var(--t-input)", color: "var(--t-text)",
    border: "1px solid var(--t-border3)", borderRadius: 10,
    padding: "10px 14px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", outline: "none", flex: 1, minWidth: 160,
  };

  return (
    <div style={{
      background: "var(--t-card)",
      border: "1px solid var(--t-border)",
      borderRadius: 18,
      padding: "24px 28px",
      boxShadow: "var(--t-shadow)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Question */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>🤔</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)" }}>
          ¿Quieres que comparemos algún mes específico?
        </span>
      </div>

      {/* Selectors */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select value={mes1} onChange={(e) => setMes1(e.target.value)} style={sel}>
          <option value="">— Primer mes —</option>
          {allMonths.map((m) => (
            <option key={`a-${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{m.label}</option>
          ))}
        </select>

        <span style={{ fontWeight: 800, color: "var(--t-text3)", fontSize: 15, flexShrink: 0 }}>vs</span>

        <select value={mes2} onChange={(e) => setMes2(e.target.value)} style={sel}>
          <option value="">— Segundo mes —</option>
          {allMonths.map((m) => (
            <option key={`b-${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{m.label}</option>
          ))}
        </select>

        {(mes1 || mes2) && (
          <button onClick={() => { setMes1(""); setMes2(""); }}
            style={{
              background: "transparent", border: "1px solid var(--t-border3)",
              borderRadius: 9, padding: "9px 14px", cursor: "pointer",
              color: "var(--t-text3)", fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {mes1 && mes2 && mes1 === mes2 && (
        <p style={{ margin: 0, fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>
          ⚠️ Selecciona dos meses diferentes.
        </p>
      )}

      {/* Result */}
      {compareText && (
        <div style={{
          background: "var(--t-card2)",
          border: "1px solid var(--t-border)",
          borderRadius: 12,
          padding: "20px 22px",
          fontSize: 13.5,
          lineHeight: 1.85,
          color: "var(--t-text2)",
          whiteSpace: "pre-wrap",
          position: "relative",
        }}>
          {typedC}
          {cPhase === "writing" && !cDone && (
            <span style={{ opacity: cursorOn ? 1 : 0, color: "#6366f1" }}>|</span>
          )}
          {!cDone && (
            <button
              onClick={() => setSkip(true)}
              style={{
                position: "absolute", top: 10, right: 12,
                fontSize: 10, fontWeight: 700, color: "var(--t-text3)",
                background: "var(--t-card)", border: "1px solid var(--t-border)",
                borderRadius: 6, padding: "3px 8px", cursor: "pointer",
              }}
            >
              VER TODO
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IQPage() {
  const [movs, setMovs]       = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [catAnim, setCatAnim] = useState<object | null>(null);

  const now = new Date();
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());

  function prevMonth() {
    if (selMonth === 0) { setSelYear((y) => y - 1); setSelMonth(11); }
    else setSelMonth((m) => m - 1);
  }
  function nextMonth() {
    const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();
    if (isCurrentMonth) return;
    if (selMonth === 11) { setSelYear((y) => y + 1); setSelMonth(0); }
    else setSelMonth((m) => m + 1);
  }
  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();

  useEffect(() => {
    fetch("/cat-animation.json").then((r) => r.json()).then(setCatAnim).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/contabilidad/movimientos?limit=2000`)
      .then((r) => r.json())
      .then((data: Movimiento[]) => { setMovs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const analysis = useMemo(() => movs.length ? buildAnalysis(movs, selYear, selMonth) : null, [movs, selYear, selMonth]);

  // Last 12 months (always available as options)
  const allMonths = useMemo((): MonthOption[] => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const Pill = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div style={{
      background: "var(--t-card)", border: "1px solid var(--t-border)",
      borderRadius: 12, padding: "10px 18px",
      display: "flex", flexDirection: "column", gap: 2, boxShadow: "var(--t-shadow)",
    }}>
      <span style={{ fontSize: 10, color: "var(--t-text3)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color }}>{value}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--t-bg)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0,
          boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
        }}>🧠</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--t-text)" }}>IQ Financiero</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--t-text2)" }}>Análisis inteligente basado en tus datos de contabilidad</p>
        </div>
        {analysis && <div style={{ marginLeft: "auto" }}><ScoreRing score={analysis.score} /></div>}
      </div>

      {/* Month navigator + Stats pills */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={prevMonth}
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--t-border3)",
              background: "var(--t-card)", color: "var(--t-text)", cursor: "pointer",
              display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700,
              flexShrink: 0, transition: "background 0.15s",
            }}
            title="Mes anterior"
          >‹</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", minWidth: 160, textAlign: "center" }}>
            {MONTH_NAMES[selMonth]} {selYear}
            {isCurrentMonth && <span style={{ fontSize: 11, color: "var(--t-text3)", fontWeight: 500, marginLeft: 6 }}>(actual)</span>}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--t-border3)",
              background: "var(--t-card)", color: isCurrentMonth ? "var(--t-text3)" : "var(--t-text)",
              cursor: isCurrentMonth ? "not-allowed" : "pointer",
              display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700,
              flexShrink: 0, opacity: isCurrentMonth ? 0.35 : 1, transition: "opacity 0.15s",
            }}
            title="Mes siguiente"
          >›</button>
        </div>

        {/* Pills */}
        {analysis && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill label="Ingresos del mes" value={`€ ${analysis.curIngresos.toFixed(2)}`} color="#22c55e" />
            <Pill label="Gastos del mes"   value={`€ ${analysis.curGastos.toFixed(2)}`}   color="#ef4444" />
            <Pill label="Balance neto"     value={`€ ${analysis.curBalance.toFixed(2)}`}
              color={analysis.curBalance >= 0 ? "#22c55e" : "#ef4444"} />
            <Pill label="Margen"           value={`${analysis.curMargen.toFixed(1)}%`}
              color={analysis.curMargen >= 20 ? "#22c55e" : analysis.curMargen >= 0 ? "#f59e0b" : "#ef4444"} />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text3)", fontSize: 15 }}>
          Analizando datos...
        </div>
      ) : !analysis ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text3)", fontSize: 15 }}>
          No hay datos de contabilidad disponibles.
        </div>
      ) : (
        <>
          {/* Two-column: animation + letter */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {/* Cat animation */}
            <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16 }}>
              {catAnim
                ? <Lottie animationData={catAnim} loop style={{ width: 220, height: 220 }} />
                : <div style={{ width: 220, height: 220, display: "grid", placeItems: "center", fontSize: 64 }}>🐱</div>
              }
              <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "var(--t-text3)" }}>
                {analysis.monthDone ? `Mes de ${analysis.monthName} cerrado` : `${analysis.monthName} en progreso`}
              </div>
            </div>

            {/* Letter */}
            <LetterCard titulo={analysis.titulo} letra={analysis.letra} />
          </div>

          {/* Comparison section — ALWAYS visible below */}
          <CompareSection movs={movs} allMonths={allMonths} />
        </>
      )}
    </div>
  );
}
