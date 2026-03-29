"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { loadAsientos, addAsiento, calcTotales } from "./_libro/store";
import { CUENTAS_POR_TIPO, findCuenta, TipoCuenta } from "./_libro/cuentas";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

function fmtMoney(v: number) {
  const abs = Math.abs(v);
  const str = `€ ${abs.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return v < 0 ? `−${str}` : str;
}

function today() { return new Date().toISOString().slice(0, 10); }

const SECCIONES = [
  { label: "Activos",  icon: "🏦", desc: "Bienes y derechos de la empresa",    sub: "Caja, banco, inventario, equipos…",         href: "/admin/kds/activos",  key: "activos"  as const, accent: "#2563eb", bg: "rgba(37,99,235,0.09)",   border: "rgba(37,99,235,0.28)",   glow: "0 8px 32px rgba(37,99,235,0.18)"   },
  { label: "Pasivos",  icon: "📋", desc: "Deudas y obligaciones pendientes",    sub: "Préstamos, cuentas por pagar, deudas…",    href: "/admin/kds/pasivos",  key: "pasivos"  as const, accent: "#dc2626", bg: "rgba(220,38,38,0.09)",   border: "rgba(220,38,38,0.28)",   glow: "0 8px 32px rgba(220,38,38,0.18)"   },
  { label: "Capital",  icon: "💼", desc: "Patrimonio neto del negocio",          sub: "Aportes, utilidades, reservas…",           href: "/admin/kds/capital",  key: "capital"  as const, accent: "#7c3aed", bg: "rgba(124,58,237,0.09)",  border: "rgba(124,58,237,0.28)",  glow: "0 8px 32px rgba(124,58,237,0.18)"  },
];

const TIPO_COLOR: Record<TipoCuenta, string> = { activo: "#2563eb", pasivo: "#dc2626", capital: "#7c3aed" };
const TIPO_LABEL: Record<TipoCuenta, string> = { activo: "Activo", pasivo: "Pasivo", capital: "Capital" };

// ── New Asiento Modal ─────────────────────────────────────────────────────────
function NuevoAsientoModal({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [desc,     setDesc]     = useState("");
  const [fecha,    setFecha]    = useState(today());
  const [monto,    setMonto]    = useState("");
  const [debeCod,  setDebeCod]  = useState("");
  const [haberCod, setHaberCod] = useState("");
  const [notas,    setNotas]    = useState("");
  const [err,      setErr]      = useState("");

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 9,
    border: "1px solid var(--t-border3)", background: "var(--t-input)",
    color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "var(--t-text3)",
    letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4, display: "block",
  };

  function handleSave() {
    if (!desc.trim())         { setErr("La descripción es obligatoria."); return; }
    if (!debeCod)             { setErr("Selecciona la cuenta DEBE."); return; }
    if (!haberCod)            { setErr("Selecciona la cuenta HABER."); return; }
    if (debeCod === haberCod) { setErr("DEBE y HABER no pueden ser la misma cuenta."); return; }
    const m = parseFloat(monto);
    if (isNaN(m) || m <= 0)  { setErr("El monto debe ser mayor que 0."); return; }
    if (!fecha)               { setErr("La fecha es obligatoria."); return; }

    const debe  = findCuenta(debeCod)!;
    const haber = findCuenta(haberCod)!;

    addAsiento({
      fecha, descripcion: desc.trim(), monto: m,
      debeCodigo: debe.codigo,   debeNombre: debe.nombre,   debeTipo: debe.tipo,
      haberCodigo: haber.codigo, haberNombre: haber.nombre, haberTipo: haber.tipo,
      notas: notas.trim(),
    });

    // Notify sub-pages listening
    window.dispatchEvent(new Event("asientos-updated"));
    onSave();
  }

  const CuentaSelect = ({ value, onChange, highlight }: { value: string; onChange: (v: string) => void; highlight: string }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, borderColor: highlight }}>
      <option value="">— Selecciona —</option>
      <optgroup label="── ACTIVOS ──">
        {CUENTAS_POR_TIPO.activo.map((c) => <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
      </optgroup>
      <optgroup label="── PASIVOS ──">
        {CUENTAS_POR_TIPO.pasivo.map((c) => <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
      </optgroup>
      <optgroup label="── CAPITAL ──">
        {CUENTAS_POR_TIPO.capital.map((c) => <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
      </optgroup>
    </select>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "var(--t-card)", border: "1px solid var(--t-border)",
        borderRadius: 24, padding: "30px 28px", width: "100%", maxWidth: 500,
        boxShadow: "0 28px 70px rgba(0,0,0,0.4)",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--t-text)" }}>Nuevo asiento</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--t-text3)" }}>Partida doble — afecta dos cuentas simultáneamente</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--t-text3)", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Descripción */}
          <div>
            <label style={lbl}>Descripción *</label>
            <input style={inp} placeholder="Ej: Aporte inicial de socio" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          {/* Monto + Fecha */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Monto (€) *</label>
              <input style={inp} type="number" min="0.01" step="0.01" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Fecha *</label>
              <input style={inp} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>

          {/* Partida doble */}
          <div style={{ background: "var(--t-card2)", border: "1px solid var(--t-border)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "var(--t-text3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Partida doble</div>

            {/* DEBE */}
            <div style={{ border: "1px solid rgba(37,99,235,0.3)", borderRadius: 10, padding: "10px 12px", background: "rgba(37,99,235,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#2563eb", marginBottom: 8, letterSpacing: "0.06em" }}>DEBE (Débito)</div>
              <CuentaSelect value={debeCod} onChange={setDebeCod} highlight="rgba(37,99,235,0.4)" />
              {debeCod && (() => { const c = findCuenta(debeCod); return c ? (
                <div style={{ marginTop: 6, fontSize: 11, color: TIPO_COLOR[c.tipo], fontWeight: 700 }}>
                  {c.codigo} · {c.nombre} <span style={{ opacity: 0.6 }}>({TIPO_LABEL[c.tipo]})</span>
                </div>
              ) : null; })()}
            </div>

            {/* HABER */}
            <div style={{ border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, padding: "10px 12px", background: "rgba(124,58,237,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#7c3aed", marginBottom: 8, letterSpacing: "0.06em" }}>HABER (Crédito)</div>
              <CuentaSelect value={haberCod} onChange={setHaberCod} highlight="rgba(124,58,237,0.4)" />
              {haberCod && (() => { const c = findCuenta(haberCod); return c ? (
                <div style={{ marginTop: 6, fontSize: 11, color: TIPO_COLOR[c.tipo], fontWeight: 700 }}>
                  {c.codigo} · {c.nombre} <span style={{ opacity: 0.6 }}>({TIPO_LABEL[c.tipo]})</span>
                </div>
              ) : null; })()}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label style={lbl}>Notas (opcional)</label>
            <input style={inp} placeholder="Detalle adicional…" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          {err && (
            <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, padding: "7px 12px", background: "rgba(220,38,38,0.08)", borderRadius: 8 }}>
              ⚠️ {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "12px 0", borderRadius: 12,
              border: "1px solid var(--t-border3)", background: "var(--t-card2)",
              color: "var(--t-text2)", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Cancelar</button>
            <button onClick={handleSave} style={{
              flex: 2, padding: "12px 0", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg,#2563eb,#7c3aed)",
              color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer",
            }}>Registrar asiento</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KdsPage() {
  const [totales,    setTotales]    = useState({ activos: 0, pasivos: 0, capital: 0 });
  const [showModal,  setShowModal]  = useState(false);
  const [animData,   setAnimData]   = useState<object | null>(null);

  function reload() { setTotales(calcTotales(loadAsientos())); }

  useEffect(() => {
    reload();
    fetch("/analysis.json").then((r) => r.json()).then(setAnimData);
  }, []);

  const ecuacionOk = Math.abs(totales.activos - (totales.pasivos + totales.capital)) < 0.01;

  return (
    <div style={{ padding: "36px 28px", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>

      {/* Header */}
      <div style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          {animData && (
            <Lottie animationData={animData} loop style={{ width: 80, height: 80, flexShrink: 0 }} />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--t-text)" }}>Contabilidad General</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--t-text2)" }}>
              Sistema de partida doble — cada asiento afecta dos cuentas simultáneamente.
            </p>
          </div>
        </div>

        {/* BIG + BUTTON */}
        <button
          onClick={() => setShowModal(true)}
          title="Nuevo asiento"
          style={{
            width: 64, height: 64, borderRadius: 20, border: "none",
            background: "linear-gradient(135deg,#2563eb,#7c3aed)",
            color: "#fff", fontSize: 38, fontWeight: 900,
            cursor: "pointer", display: "grid", placeItems: "center",
            boxShadow: "0 8px 32px rgba(37,99,235,0.45)",
            flexShrink: 0, lineHeight: 1,
            transition: "transform .15s, box-shadow .15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >+</button>
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
              <div style={{ fontSize: 13, fontWeight: 800, color: accent }}>Ver registros →</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Card Balance General */}
      <Link href="/admin/kds/balance" style={{ textDecoration: "none", display: "block", marginBottom: 22 }}>
        <div
          style={{ background: "var(--t-card)", border: "1.5px solid rgba(234,179,8,0.35)", borderRadius: 24, padding: "28px 26px", cursor: "pointer", boxShadow: "0 8px 32px rgba(234,179,8,0.12)", display: "flex", alignItems: "center", gap: 20, transition: "transform .18s" }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"}
        >
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(234,179,8,0.1)", border: "1.5px solid rgba(234,179,8,0.3)", display: "grid", placeItems: "center", fontSize: 30, flexShrink: 0 }}>
            ⚖️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#ca8a04" }}>Balance General</div>
            <div style={{ fontSize: 13, color: "var(--t-text2)", marginTop: 4 }}>
              Todas las operaciones en orden — ordena por número, partidas, fecha, debe o haber
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#ca8a04", flexShrink: 0 }}>Ver balance →</div>
        </div>
      </Link>

      {/* Card Cuentas T */}
      <Link href="/admin/kds/cuentas-t" style={{ textDecoration: "none", display: "block", marginBottom: 32 }}>
        <div
          style={{ background: "var(--t-card)", border: "1.5px solid rgba(15,118,110,0.35)", borderRadius: 24, padding: "28px 26px", cursor: "pointer", boxShadow: "0 8px 32px rgba(15,118,110,0.14)", display: "flex", alignItems: "center", gap: 20, transition: "transform .18s" }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"}
        >
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(15,118,110,0.1)", border: "1.5px solid rgba(15,118,110,0.3)", display: "grid", placeItems: "center", fontSize: 30, flexShrink: 0 }}>
            🗂
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f766e" }}>Cuentas T</div>
            <div style={{ fontSize: 13, color: "var(--t-text2)", marginTop: 4 }}>
              Visualiza todas tus operaciones en formato T — DEBE a la izquierda, HABER a la derecha
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f766e", flexShrink: 0 }}>Ver cuentas →</div>
        </div>
      </Link>

      {/* Ecuación contable */}
      <div style={{
        background: "var(--t-card)", border: "1px solid var(--t-border)",
        borderRadius: 20, padding: "24px 28px",
        boxShadow: "var(--t-shadow)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>
          Ecuación contable fundamental
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>ACTIVOS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#2563eb" }}>{fmtMoney(totales.activos)}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--t-text3)" }}>=</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>PASIVOS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626" }}>{fmtMoney(totales.pasivos)}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--t-text3)" }}>+</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>CAPITAL</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#7c3aed" }}>{fmtMoney(totales.capital)}</div>
          </div>
        </div>
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

      {/* Modal */}
      {showModal && (
        <NuevoAsientoModal
          onSave={() => { reload(); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
