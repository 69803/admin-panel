"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAsientos, updateAsiento, Asiento } from "../_libro/store";
import { CUENTAS_POR_TIPO, TipoCuenta, findCuenta } from "../_libro/cuentas";

function fmtMoney(v: number) {
  return `€ ${Math.abs(v).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TIPO_COLOR: Record<TipoCuenta, string> = { activo: "#2563eb", pasivo: "#dc2626", capital: "#7c3aed" };
const TIPO_LABEL: Record<TipoCuenta, string> = { activo: "Activo", pasivo: "Pasivo", capital: "Capital" };

type CuentaT = {
  codigo: string; nombre: string; tipo: TipoCuenta;
  debe:  { id: string; fecha: string; descripcion: string; monto: number }[];
  haber: { id: string; fecha: string; descripcion: string; monto: number }[];
  totalDebe: number; totalHaber: number; saldo: number;
};

function buildNumeros(asientos: Asiento[]): Map<string, number> {
  const sorted = [...asientos].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  const map = new Map<string, number>();
  sorted.forEach((a, i) => map.set(a.id, i + 1));
  return map;
}

function buildCuentasT(asientos: Asiento[]): CuentaT[] {
  const map = new Map<string, CuentaT>();
  function ensure(codigo: string, nombre: string, tipo: TipoCuenta) {
    if (!map.has(codigo)) map.set(codigo, { codigo, nombre, tipo, debe: [], haber: [], totalDebe: 0, totalHaber: 0, saldo: 0 });
    return map.get(codigo)!;
  }
  for (const a of asientos) {
    const d = ensure(a.debeCodigo, a.debeNombre, a.debeTipo);
    const h = ensure(a.haberCodigo, a.haberNombre, a.haberTipo);
    d.debe.push({ id: a.id, fecha: a.fecha, descripcion: a.descripcion, monto: a.monto });
    d.totalDebe += a.monto;
    h.haber.push({ id: a.id, fecha: a.fecha, descripcion: a.descripcion, monto: a.monto });
    h.totalHaber += a.monto;
  }
  for (const c of map.values()) {
    c.saldo = c.tipo === "activo" ? c.totalDebe - c.totalHaber : c.totalHaber - c.totalDebe;
  }
  return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ asiento, onSave, onClose }: {
  asiento: Asiento;
  onSave: (updated: Asiento) => void;
  onClose: () => void;
}) {
  const [desc,     setDesc]     = useState(asiento.descripcion);
  const [fecha,    setFecha]    = useState(asiento.fecha);
  const [monto,    setMonto]    = useState(String(asiento.monto));
  const [debeCod,  setDebeCod]  = useState(asiento.debeCodigo);
  const [haberCod, setHaberCod] = useState(asiento.haberCodigo);
  const [notas,    setNotas]    = useState(asiento.notas);
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
    if (!desc.trim())      { setErr("La descripción es obligatoria."); return; }
    if (!debeCod)          { setErr("Selecciona la cuenta DEBE."); return; }
    if (!haberCod)         { setErr("Selecciona la cuenta HABER."); return; }
    if (debeCod === haberCod) { setErr("DEBE y HABER no pueden ser la misma cuenta."); return; }
    const m = parseFloat(monto);
    if (isNaN(m) || m <= 0) { setErr("Monto inválido."); return; }
    const debe  = findCuenta(debeCod)!;
    const haber = findCuenta(haberCod)!;
    const updated: Asiento = {
      ...asiento, descripcion: desc.trim(), fecha, monto: m, notas: notas.trim(),
      debeCodigo: debe.codigo,   debeNombre: debe.nombre,   debeTipo: debe.tipo,
      haberCodigo: haber.codigo, haberNombre: haber.nombre, haberTipo: haber.tipo,
    };
    updateAsiento(asiento.id, updated);
    onSave(updated);
  }

  // Grouped select
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
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "var(--t-card)", border: "1px solid var(--t-border)",
        borderRadius: 20, padding: "28px 26px", width: "100%", maxWidth: 480,
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "var(--t-text)" }}>✏️ Editar asiento</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--t-text3)" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <label style={lbl}>Descripción *</label>
            <input style={inp} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Monto (€) *</label>
              <input style={inp} type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Fecha *</label>
              <input style={inp} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>

          <div style={{ background: "var(--t-card2)", border: "1px solid var(--t-border)", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ ...lbl, color: "#2563eb" }}>DEBE (Débito)</label>
              <CuentaSelect value={debeCod} onChange={setDebeCod} highlight="rgba(37,99,235,0.4)" />
            </div>
            <div>
              <label style={{ ...lbl, color: "#7c3aed" }}>HABER (Crédito)</label>
              <CuentaSelect value={haberCod} onChange={setHaberCod} highlight="rgba(124,58,237,0.4)" />
            </div>
          </div>

          <div>
            <label style={lbl}>Notas</label>
            <input style={inp} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional…" />
          </div>

          {err && <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, padding: "7px 12px", background: "rgba(220,38,38,0.08)", borderRadius: 8 }}>⚠️ {err}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "11px 0", borderRadius: 11,
              border: "1px solid var(--t-border3)", background: "var(--t-card2)",
              color: "var(--t-text2)", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Cancelar</button>
            <button onClick={handleSave} style={{
              flex: 2, padding: "11px 0", borderRadius: 11, border: "none",
              background: "#0f766e", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
            }}>Guardar cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CuentasTPage() {
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [cuentas,  setCuentas]  = useState<CuentaT[]>([]);
  const [filter,   setFilter]   = useState<TipoCuenta | "todas">("todas");
  const [editing,  setEditing]  = useState<Asiento | null>(null);

  useEffect(() => {
    const data = loadAsientos();
    setAsientos(data);
    setCuentas(buildCuentasT(data));
  }, []);

  const numeros = buildNumeros(asientos);

  function handleSave(updated: Asiento) {
    const newList = asientos.map((a) => a.id === updated.id ? updated : a);
    setAsientos(newList);
    setCuentas(buildCuentasT(newList));
    setEditing(null);
  }

  const visible = filter === "todas" ? cuentas : cuentas.filter((c) => c.tipo === filter);

  const filterBtn = (f: typeof filter, label: string, color: string) => (
    <button onClick={() => setFilter(f)} style={{
      padding: "7px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
      border: filter === f ? "1px solid transparent" : "1px solid var(--t-border3)",
      background: filter === f ? color : "var(--t-card)",
      color: filter === f ? "#fff" : "var(--t-text2)",
    }}>{label}</button>
  );

  return (
    <div style={{ padding: "28px 24px", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <Link href="/admin/kds" style={{
          display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10,
          background: "var(--t-card)", border: "1px solid var(--t-border)",
          color: "var(--t-text2)", fontSize: 18, textDecoration: "none",
        }}>←</Link>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(15,118,110,0.1)", border: "1.5px solid rgba(15,118,110,0.3)", display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0 }}>🗂</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f766e" }}>Cuentas T</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--t-text2)" }}>{cuentas.length} cuenta(s) con movimientos</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filterBtn("todas",   "Todas",    "#0f766e")}
          {filterBtn("activo",  "Activos",  "#2563eb")}
          {filterBtn("pasivo",  "Pasivos",  "#dc2626")}
          {filterBtn("capital", "Capital",  "#7c3aed")}
        </div>
      </div>

      {cuentas.length === 0 ? (
        <div style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 16, padding: "60px 24px", textAlign: "center", color: "var(--t-text3)", fontSize: 15 }}>
          Aún no hay asientos. Registra operaciones desde Activos, Pasivos o Capital.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 22 }}>
          {visible.map((c) => {
            const accent = TIPO_COLOR[c.tipo];
            return (
              <div key={c.codigo} style={{
                background: "var(--t-card)", border: `1.5px solid ${accent}44`,
                borderRadius: 18, overflow: "hidden", boxShadow: `0 4px 20px ${accent}18`,
              }}>
                {/* Header */}
                <div style={{ background: `${accent}11`, borderBottom: `1.5px solid ${accent}33`, padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: accent, letterSpacing: "0.08em" }}>{c.codigo}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "var(--t-text)", marginLeft: 10 }}>{c.nombre}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, background: `${accent}18`, border: `1px solid ${accent}44`, color: accent }}>
                    {TIPO_LABEL[c.tipo]}
                  </span>
                </div>

                {/* T columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  {/* DEBE */}
                  <div style={{ borderRight: `2px solid ${accent}33` }}>
                    <div style={{ background: "rgba(37,99,235,0.06)", borderBottom: "1px solid var(--t-border2)", padding: "7px 14px", textAlign: "center", fontSize: 11, fontWeight: 900, color: "#2563eb", letterSpacing: "0.1em" }}>DEBE</div>
                    {c.debe.length === 0
                      ? <div style={{ padding: "16px", fontSize: 12, color: "var(--t-text3)", textAlign: "center" }}>—</div>
                      : c.debe.map((d, i) => {
                          const src = asientos.find((a) => a.id === d.id);
                          return (
                            <div key={i} style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "8px 14px",
                              borderBottom: i < c.debe.length - 1 ? "1px solid var(--t-border2)" : "none",
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                                  <span style={{ fontSize: 9, fontWeight: 900, color: "var(--t-text3)", background: "var(--t-card2)", border: "1px solid var(--t-border)", borderRadius: 5, padding: "1px 5px" }}>#{numeros.get(d.id) ?? "?"}</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>{d.descripcion}</span>
                                </div>
                                <div style={{ fontSize: 10, color: "var(--t-text3)" }}>{d.fecha}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 900, color: "#2563eb" }}>{fmtMoney(d.monto)}</span>
                                {src && (
                                  <button onClick={() => setEditing(src)} title="Editar" style={{
                                    width: 26, height: 26, borderRadius: 7, border: "1px solid var(--t-border)",
                                    background: "var(--t-card2)", cursor: "pointer", fontSize: 13,
                                    display: "grid", placeItems: "center", flexShrink: 0,
                                    color: "var(--t-text3)",
                                  }}>✏️</button>
                                )}
                              </div>
                            </div>
                          );
                        })
                    }
                    <div style={{ borderTop: `2px solid ${accent}33`, padding: "8px 14px", display: "flex", justifyContent: "space-between", background: "rgba(37,99,235,0.04)" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--t-text3)" }}>Total Debe</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#2563eb" }}>{fmtMoney(c.totalDebe)}</span>
                    </div>
                  </div>

                  {/* HABER */}
                  <div>
                    <div style={{ background: "rgba(124,58,237,0.06)", borderBottom: "1px solid var(--t-border2)", padding: "7px 14px", textAlign: "center", fontSize: 11, fontWeight: 900, color: "#7c3aed", letterSpacing: "0.1em" }}>HABER</div>
                    {c.haber.length === 0
                      ? <div style={{ padding: "16px", fontSize: 12, color: "var(--t-text3)", textAlign: "center" }}>—</div>
                      : c.haber.map((h, i) => {
                          const src = asientos.find((a) => a.id === h.id);
                          return (
                            <div key={i} style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "8px 14px",
                              borderBottom: i < c.haber.length - 1 ? "1px solid var(--t-border2)" : "none",
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                                  <span style={{ fontSize: 9, fontWeight: 900, color: "var(--t-text3)", background: "var(--t-card2)", border: "1px solid var(--t-border)", borderRadius: 5, padding: "1px 5px" }}>#{numeros.get(h.id) ?? "?"}</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>{h.descripcion}</span>
                                </div>
                                <div style={{ fontSize: 10, color: "var(--t-text3)" }}>{h.fecha}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 900, color: "#7c3aed" }}>{fmtMoney(h.monto)}</span>
                                {src && (
                                  <button onClick={() => setEditing(src)} title="Editar" style={{
                                    width: 26, height: 26, borderRadius: 7, border: "1px solid var(--t-border)",
                                    background: "var(--t-card2)", cursor: "pointer", fontSize: 13,
                                    display: "grid", placeItems: "center", flexShrink: 0,
                                    color: "var(--t-text3)",
                                  }}>✏️</button>
                                )}
                              </div>
                            </div>
                          );
                        })
                    }
                    <div style={{ borderTop: `2px solid ${accent}33`, padding: "8px 14px", display: "flex", justifyContent: "space-between", background: "rgba(124,58,237,0.04)" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--t-text3)" }}>Total Haber</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#7c3aed" }}>{fmtMoney(c.totalHaber)}</span>
                    </div>
                  </div>
                </div>

                {/* Saldo */}
                <div style={{ borderTop: `2px solid ${accent}44`, padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: `${accent}08` }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--t-text2)" }}>
                    Saldo {c.tipo === "activo" ? "(Deudor)" : "(Acreedor)"}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: c.saldo >= 0 ? accent : "#dc2626" }}>
                    {fmtMoney(c.saldo)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <EditModal
          asiento={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
