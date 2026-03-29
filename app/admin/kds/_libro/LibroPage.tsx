"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CUENTAS, TipoCuenta } from "./cuentas";
import { Asiento, loadAsientos, deleteAsiento, calcTotales } from "./store";

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

const TIPO_LABEL: Record<TipoCuenta, string> = { activo: "Activo", pasivo: "Pasivo", capital: "Capital" };
const TIPO_COLOR: Record<TipoCuenta, string> = { activo: "#2563eb", pasivo: "#dc2626", capital: "#7c3aed" };

// Para cada cuenta de este tipo, agrupa sus movimientos
type MovimientoCuenta = {
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  movimientos: {
    asiento: Asiento;
    lado: "debe" | "haber"; // el lado en que aparece ESTA cuenta
    contrapartida: { codigo: string; nombre: string; tipo: TipoCuenta };
  }[];
  saldo: number;
};

function buildMovimientos(asientos: Asiento[], tipo: TipoCuenta): MovimientoCuenta[] {
  // Cuentas de este tipo que tienen movimientos
  const mapaConCodigo = new Map<string, MovimientoCuenta>();

  for (const a of asientos) {
    // ¿Esta cuenta aparece en el DEBE?
    if (a.debeTipo === tipo) {
      if (!mapaConCodigo.has(a.debeCodigo)) {
        mapaConCodigo.set(a.debeCodigo, {
          codigo: a.debeCodigo, nombre: a.debeNombre, tipo,
          movimientos: [], saldo: 0,
        });
      }
      mapaConCodigo.get(a.debeCodigo)!.movimientos.push({
        asiento: a,
        lado: "debe",
        contrapartida: { codigo: a.haberCodigo, nombre: a.haberNombre, tipo: a.haberTipo },
      });
    }

    // ¿Esta cuenta aparece en el HABER?
    if (a.haberTipo === tipo) {
      if (!mapaConCodigo.has(a.haberCodigo)) {
        mapaConCodigo.set(a.haberCodigo, {
          codigo: a.haberCodigo, nombre: a.haberNombre, tipo,
          movimientos: [], saldo: 0,
        });
      }
      mapaConCodigo.get(a.haberCodigo)!.movimientos.push({
        asiento: a,
        lado: "haber",
        contrapartida: { codigo: a.debeCodigo, nombre: a.debeNombre, tipo: a.debeTipo },
      });
    }
  }

  // Calcular saldo por cuenta
  for (const c of mapaConCodigo.values()) {
    let debe = 0, haber = 0;
    for (const m of c.movimientos) {
      if (m.lado === "debe")  debe  += m.asiento.monto;
      else                    haber += m.asiento.monto;
    }
    // Activos: saldo deudor (debe - haber); Pasivos/Capital: saldo acreedor (haber - debe)
    c.saldo = tipo === "activo" ? debe - haber : haber - debe;
  }

  // Ordenar por código
  return Array.from(mapaConCodigo.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

// Mapa id → número de operación (cronológico, el más antiguo = #1)
function buildNumeros(asientos: Asiento[]): Map<string, number> {
  const sorted = [...asientos].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  const map = new Map<string, number>();
  sorted.forEach((a, i) => map.set(a.id, i + 1));
  return map;
}

type FiltroTipo = "descripcion" | "cuenta" | "numero";

// ── Modal de confirmación de borrado ──────────────────────────────────────────
function DeleteModal({ asiento, numero, onConfirm, onClose }: {
  asiento: Asiento;
  numero: number | undefined;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const TIPO_COLOR: Record<TipoCuenta, string> = { activo: "#2563eb", pasivo: "#dc2626", capital: "#7c3aed" };
  const TIPO_LABEL: Record<TipoCuenta, string> = { activo: "Activo", pasivo: "Pasivo", capital: "Capital" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "var(--t-card)", border: "1.5px solid rgba(220,38,38,0.35)",
        borderRadius: 22, padding: "28px 26px", width: "100%", maxWidth: 440,
        boxShadow: "0 24px 60px rgba(220,38,38,0.2)",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Icono + título */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🗑️</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#dc2626" }}>
            ¿Eliminar operación{numero !== undefined ? ` #${numero}` : ""}?
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--t-text2)" }}>
            <strong>"{asiento.descripcion}"</strong>
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--t-text3)" }}>
            Esta acción eliminará <strong>ambas partidas</strong> del asiento:
          </p>
        </div>

        {/* Las dos partidas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {/* DEBE */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.2)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: "#2563eb" }}>DEBE</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-text)" }}>{asiento.debeCodigo} · {asiento.debeNombre}</div>
              <div style={{ fontSize: 11, color: TIPO_COLOR[asiento.debeTipo], fontWeight: 700 }}>{TIPO_LABEL[asiento.debeTipo]}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#2563eb" }}>
              € {asiento.monto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* HABER */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: "#7c3aed" }}>HABER</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-text)" }}>{asiento.haberCodigo} · {asiento.haberNombre}</div>
              <div style={{ fontSize: 11, color: TIPO_COLOR[asiento.haberTipo], fontWeight: 700 }}>{TIPO_LABEL[asiento.haberTipo]}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#7c3aed" }}>
              € {asiento.monto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, padding: "8px 12px", background: "rgba(220,38,38,0.07)", borderRadius: 9, marginBottom: 18, textAlign: "center" }}>
          ⚠️ Ambas partidas desaparecerán del libro diario. Esta acción no se puede deshacer.
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px 0", borderRadius: 12,
            border: "1px solid var(--t-border3)", background: "var(--t-card2)",
            color: "var(--t-text2)", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: "#dc2626", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
          }}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default function LibroPage({ tipo, label, icon, accent, bg, border }: Props) {
  const [asientos,     setAsientos]     = useState<Asiento[]>([]);
  const [search,       setSearch]       = useState("");
  const [filtro,       setFiltro]       = useState<FiltroTipo>("descripcion");
  const [deleteTarget, setDeleteTarget] = useState<Asiento | null>(null);

  useEffect(() => {
    const handler = () => setAsientos(loadAsientos());
    handler();
    window.addEventListener("asientos-updated", handler);
    return () => window.removeEventListener("asientos-updated", handler);
  }, []);

  const numeros = buildNumeros(asientos);
  const cuentasConMovs = buildMovimientos(asientos, tipo);

  const cuentasFiltradas = search.trim() === ""
    ? cuentasConMovs
    : cuentasConMovs.map((c) => ({
        ...c,
        movimientos: c.movimientos.filter((m) => {
          const q = search.trim().toLowerCase();
          if (filtro === "descripcion") {
            return m.asiento.descripcion.toLowerCase().includes(q);
          }
          if (filtro === "cuenta") {
            return (
              c.nombre.toLowerCase().includes(q) ||
              c.codigo.toLowerCase().includes(q) ||
              m.contrapartida.nombre.toLowerCase().includes(q) ||
              m.contrapartida.codigo.toLowerCase().includes(q)
            );
          }
          if (filtro === "numero") {
            const num = numeros.get(m.asiento.id);
            return num !== undefined && String(num).startsWith(q.replace("#", ""));
          }
          return true;
        }),
      })).filter((c) => c.movimientos.length > 0);

  const totales = calcTotales(asientos);
  const balance = tipo === "activo" ? totales.activos : tipo === "pasivo" ? totales.pasivos : totales.capital;

  function handleDelete() {
    if (!deleteTarget) return;
    deleteAsiento(deleteTarget.id);
    setAsientos((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  // Todas las cuentas del catálogo de este tipo (para mostrar cuántas hay)
  const totalCuentasCatalogo = CUENTAS.filter((c) => c.tipo === tipo).length;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    borderRadius: 10, border: "1px solid var(--t-border3)",
    background: "var(--t-input)", color: "var(--t-text)",
    fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "28px 24px", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
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
          <p style={{ margin: 0, fontSize: 13, color: "var(--t-text2)" }}>
            {cuentasConMovs.length} de {totalCuentasCatalogo} cuentas con movimientos
          </p>
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

      {/* Search + filtros */}
      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Pills de filtro */}
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { key: "descripcion", label: "Descripción", icon: "📝" },
            { key: "cuenta",      label: "Cuenta",      icon: "🏷" },
            { key: "numero",      label: "# Operación", icon: "#" },
          ] as { key: FiltroTipo; label: string; icon: string }[]).map(({ key, label: lbl, icon: ic }) => (
            <button
              key={key}
              onClick={() => { setFiltro(key); setSearch(""); }}
              style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                border: filtro === key ? "none" : "1px solid var(--t-border3)",
                background: filtro === key ? accent : "var(--t-card)",
                color: filtro === key ? "#fff" : "var(--t-text2)",
                boxShadow: filtro === key ? `0 4px 14px ${accent}44` : "none",
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 13 }}>{ic}</span> {lbl}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--t-text3)" }}>🔍</span>
          <input
            style={{ ...inputStyle, paddingLeft: 36 }}
            placeholder={
              filtro === "descripcion" ? "Buscar por descripción del asiento…" :
              filtro === "cuenta"      ? "Buscar por nombre o código de cuenta…" :
                                        "Escribe el número de operación (ej: 3)…"
            }
            value={search}
            type={filtro === "numero" ? "number" : "text"}
            min={filtro === "numero" ? 1 : undefined}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sin asientos */}
      {cuentasConMovs.length === 0 ? (
        <div style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 16, padding: "56px 24px", textAlign: "center", color: "var(--t-text3)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Sin movimientos en {label}</div>
          <div style={{ fontSize: 13 }}>Usa el botón <strong>+</strong> en Contabilidad General para registrar asientos.</div>
        </div>
      ) : cuentasFiltradas.length === 0 ? (
        <div style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 16, padding: "40px 24px", textAlign: "center", color: "var(--t-text3)", fontSize: 14 }}>
          Sin resultados para tu búsqueda.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {cuentasFiltradas.map((cuenta) => (
            <div key={cuenta.codigo} style={{
              background: "var(--t-card)", border: `1.5px solid ${accent}33`,
              borderRadius: 18, overflow: "hidden", boxShadow: `0 4px 20px ${accent}12`,
            }}>
              {/* Cuenta header */}
              <div style={{
                background: `${accent}0e`, borderBottom: `1.5px solid ${accent}22`,
                padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: `1.5px solid ${border}`, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900, color: accent }}>
                    {cuenta.codigo}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--t-text)" }}>{cuenta.nombre}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginTop: 1 }}>{TIPO_LABEL[cuenta.tipo]}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--t-text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Saldo</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: cuenta.saldo >= 0 ? accent : "#dc2626" }}>{fmtMoney(cuenta.saldo)}</div>
                </div>
              </div>

              {/* Movimientos */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {cuenta.movimientos.map((m, i) => {
                  const esUltimo = i === cuenta.movimientos.length - 1;
                  // Para activos: DEBE = entrada (+), HABER = salida (−)
                  // Para pasivos/capital: HABER = entrada (+), DEBE = salida (−)
                  const esEntrada = tipo === "activo" ? m.lado === "debe" : m.lado === "haber";
                  return (
                    <div key={m.asiento.id} style={{
                      padding: "14px 20px",
                      borderBottom: esUltimo ? "none" : "1px solid var(--t-border2)",
                      display: "flex", alignItems: "center", gap: 14,
                    }}>
                      {/* Número de operación */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: "var(--t-card2)", border: "1px solid var(--t-border)",
                        display: "grid", placeItems: "center",
                        fontSize: 11, fontWeight: 900, color: "var(--t-text3)",
                      }}>
                        #{numeros.get(m.asiento.id) ?? "?"}
                      </div>

                      {/* Signo */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: esEntrada ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.12)",
                        border: `1px solid ${esEntrada ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`,
                        display: "grid", placeItems: "center",
                        fontSize: 16, fontWeight: 900,
                        color: esEntrada ? "#16a34a" : "#dc2626",
                      }}>
                        {esEntrada ? "+" : "−"}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)", marginBottom: 3 }}>{m.asiento.descripcion}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          {/* Lado de la cuenta actual */}
                          <span style={{
                            fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 999,
                            background: m.lado === "debe" ? "rgba(37,99,235,0.1)" : "rgba(124,58,237,0.1)",
                            color: m.lado === "debe" ? "#2563eb" : "#7c3aed",
                            border: `1px solid ${m.lado === "debe" ? "rgba(37,99,235,0.25)" : "rgba(124,58,237,0.25)"}`,
                          }}>
                            {m.lado === "debe" ? "DEBE" : "HABER"}
                          </span>
                          {/* Contrapartida */}
                          <span style={{ fontSize: 11, color: "var(--t-text3)" }}>
                            vs{" "}
                            <span style={{ fontWeight: 700, color: TIPO_COLOR[m.contrapartida.tipo] }}>
                              {m.contrapartida.codigo} · {m.contrapartida.nombre}
                            </span>
                          </span>
                          <span style={{ fontSize: 11, color: "var(--t-text3)" }}>📅 {m.asiento.fecha}</span>
                          {m.asiento.notas && <span style={{ fontSize: 11, color: "var(--t-text3)" }}>📝 {m.asiento.notas}</span>}
                        </div>
                      </div>

                      {/* Monto + delete */}
                      <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: esEntrada ? "#16a34a" : "#dc2626" }}>
                          {esEntrada ? "+" : "−"}{fmtMoney(m.asiento.monto)}
                        </div>
                        <button
                          onClick={() => setDeleteTarget(m.asiento)}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text3)", cursor: "pointer", fontWeight: 700 }}
                        >🗑 Eliminar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Resumen */}
          <div style={{ fontSize: 12, color: "var(--t-text3)", textAlign: "right", paddingBottom: 8 }}>
            {cuentasConMovs.length} cuenta(s) · Saldo total {label}: {fmtMoney(balance)}
          </div>
        </div>
      )}

      {/* Modal confirmación borrado */}
      {deleteTarget && (
        <DeleteModal
          asiento={deleteTarget}
          numero={numeros.get(deleteTarget.id)}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
