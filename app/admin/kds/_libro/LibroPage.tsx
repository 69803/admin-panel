"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CUENTAS, CUENTAS_POR_TIPO, TipoCuenta, findCuenta } from "./cuentas";
import { Asiento, loadAsientos, addAsiento, deleteAsiento, filtrarPorTipo, calcTotales } from "./store";

type Props = {
  tipo:   TipoCuenta;
  label:  string;
  icon:   string;
  accent: string;
  bg:     string;
  border: string;
};

function fmtMoney(v: number) {
  const abs = Math.abs(v);
  const str = `€ ${abs.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return v < 0 ? `−${str}` : str;
}

function today() { return new Date().toISOString().slice(0, 10); }
function uid()    { return `${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

const TIPO_LABEL: Record<TipoCuenta, string> = { activo: "Activo", pasivo: "Pasivo", capital: "Capital" };
const TIPO_COLOR: Record<TipoCuenta, string> = { activo: "#2563eb", pasivo: "#dc2626", capital: "#7c3aed" };

// Select de cuentas agrupado
function CuentaSelect({ value, onChange, label, placeholder }: {
  value: string; onChange: (v: string) => void; label: string; placeholder: string;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    borderRadius: 10, border: "1px solid var(--t-border3)",
    background: "var(--t-input)", color: "var(--t-text)",
    fontSize: 14, outline: "none", boxSizing: "border-box",
  };
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text3)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5, display: "block" }}>
        {label}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        <option value="">{placeholder}</option>
        <optgroup label="── ACTIVOS ──────────────">
          {CUENTAS_POR_TIPO.activo.map((c) => (
            <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>
          ))}
        </optgroup>
        <optgroup label="── PASIVOS ──────────────">
          {CUENTAS_POR_TIPO.pasivo.map((c) => (
            <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>
          ))}
        </optgroup>
        <optgroup label="── CAPITAL ──────────────">
          {CUENTAS_POR_TIPO.capital.map((c) => (
            <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

export default function LibroPage({ tipo, label, icon, accent, bg, border }: Props) {
  const [asientos, setAsientos]   = useState<Asiento[]>([]);
  const [search,   setSearch]     = useState("");
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  // Form
  const [desc,       setDesc]       = useState("");
  const [fecha,      setFecha]      = useState(today());
  const [monto,      setMonto]      = useState("");
  const [debeCod,    setDebeCod]    = useState("");
  const [haberCod,   setHaberCod]   = useState("");
  const [notas,      setNotas]      = useState("");
  const [formErr,    setFormErr]    = useState("");

  useEffect(() => { setAsientos(loadAsientos()); }, []);

  const filtered = filtrarPorTipo(asientos, tipo).filter((a) =>
    !search ||
    a.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    a.debeNombre.toLowerCase().includes(search.toLowerCase()) ||
    a.haberNombre.toLowerCase().includes(search.toLowerCase())
  );

  const totales = calcTotales(asientos);
  const balance = tipo === "activo" ? totales.activos : tipo === "pasivo" ? totales.pasivos : totales.capital;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!desc.trim())  { setFormErr("La descripción es obligatoria."); return; }
    if (!debeCod)      { setFormErr("Selecciona la cuenta DEBE."); return; }
    if (!haberCod)     { setFormErr("Selecciona la cuenta HABER."); return; }
    if (debeCod === haberCod) { setFormErr("DEBE y HABER no pueden ser la misma cuenta."); return; }
    const m = parseFloat(monto);
    if (isNaN(m) || m <= 0) { setFormErr("El monto debe ser mayor que 0."); return; }
    if (!fecha)        { setFormErr("La fecha es obligatoria."); return; }

    const debe  = findCuenta(debeCod)!;
    const haber = findCuenta(haberCod)!;

    const nuevo = addAsiento({
      fecha, descripcion: desc.trim(), monto: m,
      debeCodigo: debe.codigo,   debeNombre: debe.nombre,   debeTipo: debe.tipo,
      haberCodigo: haber.codigo, haberNombre: haber.nombre, haberTipo: haber.tipo,
      notas: notas.trim(),
    });

    setAsientos([nuevo, ...asientos]);
    setDesc(""); setMonto(""); setDebeCod(""); setHaberCod(""); setNotas(""); setFecha(today());
    setFormErr("");
  }

  function handleDelete(id: string) {
    deleteAsiento(id);
    setAsientos(asientos.filter((a) => a.id !== id));
    setDeleteId(null);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    borderRadius: 10, border: "1px solid var(--t-border3)",
    background: "var(--t-input)", color: "var(--t-text)",
    fontSize: 14, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "var(--t-text3)",
    letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5, display: "block",
  };

  return (
    <div style={{ padding: "28px 24px", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <Link href="/admin/kds" style={{
          display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10,
          background: "var(--t-card)", border: "1px solid var(--t-border)",
          color: "var(--t-text2)", fontSize: 18, textDecoration: "none",
        }}>←</Link>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: bg,
          border: `1.5px solid ${border}`, display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0,
        }}>{icon}</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: accent }}>{label}</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--t-text2)" }}>Libro diario con partida doble</p>
        </div>
        {/* Balance */}
        <div style={{
          marginLeft: "auto", background: "var(--t-card)", border: `1px solid ${border}`,
          borderRadius: 14, padding: "10px 20px", textAlign: "right",
          boxShadow: `0 4px 16px ${border}`,
        }}>
          <div style={{ fontSize: 11, color: "var(--t-text3)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Saldo {label}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: balance >= 0 ? accent : "#dc2626" }}>{fmtMoney(balance)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: 22, alignItems: "start" }}>

        {/* ── FORMULARIO PARTIDA DOBLE ── */}
        <div style={{
          background: "var(--t-card)", border: "1px solid var(--t-border)",
          borderRadius: 20, padding: "24px 22px", boxShadow: "var(--t-shadow)",
          position: "sticky", top: 20,
        }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "var(--t-text)" }}>
            ➕ Nuevo asiento
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "var(--t-text3)" }}>Partida doble: cada asiento afecta dos cuentas.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Descripción */}
            <div>
              <label style={labelStyle}>Descripción *</label>
              <input style={inputStyle} placeholder="Ej: Aporte inicial de socio" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>

            {/* Monto + Fecha */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Monto (€) *</label>
                <input style={inputStyle} type="number" min="0.01" step="0.01" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Fecha *</label>
                <input style={inputStyle} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>

            {/* Separador partida doble */}
            <div style={{ background: "var(--t-card2)", border: "1px solid var(--t-border)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "var(--t-text3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Partida doble
              </div>

              {/* DEBE */}
              <div style={{ border: "1px solid rgba(37,99,235,0.3)", borderRadius: 10, padding: "10px 12px", background: "rgba(37,99,235,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#2563eb", marginBottom: 8, letterSpacing: "0.06em" }}>DEBE (Débito)</div>
                <CuentaSelect value={debeCod} onChange={setDebeCod} label="" placeholder="— Selecciona cuenta —" />
                {debeCod && (() => { const c = findCuenta(debeCod); return c ? (
                  <div style={{ marginTop: 6, fontSize: 11, color: TIPO_COLOR[c.tipo], fontWeight: 700 }}>
                    {c.codigo} · {c.nombre} <span style={{ opacity: 0.6 }}>({TIPO_LABEL[c.tipo]})</span>
                  </div>
                ) : null; })()}
              </div>

              {/* HABER */}
              <div style={{ border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, padding: "10px 12px", background: "rgba(124,58,237,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#7c3aed", marginBottom: 8, letterSpacing: "0.06em" }}>HABER (Crédito)</div>
                <CuentaSelect value={haberCod} onChange={setHaberCod} label="" placeholder="— Selecciona cuenta —" />
                {haberCod && (() => { const c = findCuenta(haberCod); return c ? (
                  <div style={{ marginTop: 6, fontSize: 11, color: TIPO_COLOR[c.tipo], fontWeight: 700 }}>
                    {c.codigo} · {c.nombre} <span style={{ opacity: 0.6 }}>({TIPO_LABEL[c.tipo]})</span>
                  </div>
                ) : null; })()}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label style={labelStyle}>Notas (opcional)</label>
              <textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} placeholder="Detalle adicional…" value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>

            {formErr && (
              <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, padding: "8px 12px", background: "rgba(220,38,38,0.08)", borderRadius: 8 }}>
                ⚠️ {formErr}
              </div>
            )}

            <button type="submit" style={{
              padding: "13px 0", borderRadius: 12, border: "none",
              background: accent, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer",
            }}>
              Registrar asiento
            </button>
          </form>
        </div>

        {/* ── LISTA ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--t-text3)" }}>🔍</span>
            <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Buscar asientos…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 16, padding: "48px 24px", textAlign: "center", color: "var(--t-text3)", fontSize: 14 }}>
              {asientos.length === 0
                ? `Aún no hay asientos. Registra tu primer movimiento de ${label.toLowerCase()}.`
                : "Sin resultados para tu búsqueda."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((a) => {
                const esDebePrincipal  = a.debeTipo === tipo;
                const esHaberPrincipal = a.haberTipo === tipo;
                return (
                  <div key={a.id} style={{
                    background: "var(--t-card)", border: "1px solid var(--t-border)",
                    borderRadius: 16, padding: "16px 18px", boxShadow: "var(--t-shadow)",
                  }}>
                    {/* Top row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "var(--t-text)", marginBottom: 6 }}>{a.descripcion}</div>
                        {/* Partida doble visual */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={{
                            background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.2)",
                            borderRadius: 9, padding: "8px 12px",
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: "#2563eb", letterSpacing: "0.06em", marginBottom: 3 }}>DEBE</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--t-text)" }}>{a.debeCodigo} · {a.debeNombre}</div>
                            <div style={{ fontSize: 10, color: TIPO_COLOR[a.debeTipo], fontWeight: 700 }}>{TIPO_LABEL[a.debeTipo]}</div>
                          </div>
                          <div style={{
                            background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)",
                            borderRadius: 9, padding: "8px 12px",
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: "#7c3aed", letterSpacing: "0.06em", marginBottom: 3 }}>HABER</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--t-text)" }}>{a.haberCodigo} · {a.haberNombre}</div>
                            <div style={{ fontSize: 10, color: TIPO_COLOR[a.haberTipo], fontWeight: 700 }}>{TIPO_LABEL[a.haberTipo]}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--t-text3)", marginTop: 8, display: "flex", gap: 12 }}>
                          <span>📅 {a.fecha}</span>
                          {a.notas && <span>📝 {a.notas}</span>}
                        </div>
                      </div>

                      {/* Amount */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: accent }}>
                          {fmtMoney(a.monto)}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--t-text3)", marginTop: 2 }}>
                          {esDebePrincipal ? "↑ Incrementa " + label : "↓ Reduce " + label}
                        </div>
                        {deleteId === a.id ? (
                          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                            <button onClick={() => handleDelete(a.id)} style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 7, background: "#dc2626", border: "none", color: "#fff", cursor: "pointer" }}>Confirmar</button>
                            <button onClick={() => setDeleteId(null)} style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 7, background: "var(--t-card2)", border: "1px solid var(--t-border)", color: "var(--t-text2)", cursor: "pointer" }}>Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(a.id)} style={{ marginTop: 8, fontSize: 11, padding: "4px 10px", borderRadius: 7, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text3)", cursor: "pointer", fontWeight: 700 }}>🗑 Eliminar</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--t-text3)", textAlign: "right" }}>
              {filtered.length} asiento(s) · Saldo: {fmtMoney(balance)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
