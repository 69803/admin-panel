"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAsientos, deleteAsiento, Asiento } from "../_libro/store";
import { TipoCuenta } from "../_libro/cuentas";

function fmtMoney(v: number) {
  return `€ ${v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TIPO_COLOR: Record<TipoCuenta, string> = { activo: "#2563eb", pasivo: "#dc2626", capital: "#7c3aed" };
const TIPO_LABEL: Record<TipoCuenta, string> = { activo: "Activo", pasivo: "Pasivo", capital: "Capital" };
const TIPO_ORDER: Record<TipoCuenta, number> = { activo: 0, pasivo: 1, capital: 2 };

type OrdenCol = "numero" | "partidas" | "fecha" | "debe" | "haber";
type OrdenDir = "asc" | "desc";

function buildNumeros(asientos: Asiento[]): Map<string, number> {
  const sorted = [...asientos].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  const map = new Map<string, number>();
  sorted.forEach((a, i) => map.set(a.id, i + 1));
  return map;
}

function sortAsientos(asientos: Asiento[], numeros: Map<string, number>, col: OrdenCol, dir: OrdenDir) {
  const factor = dir === "asc" ? 1 : -1;
  return [...asientos].sort((a, b) => {
    let cmp = 0;
    switch (col) {
      case "numero":
        cmp = (numeros.get(a.id) ?? 0) - (numeros.get(b.id) ?? 0);
        break;
      case "partidas":
        // Ordena por tipo del DEBE: activo → pasivo → capital
        cmp = TIPO_ORDER[a.debeTipo] - TIPO_ORDER[b.debeTipo];
        if (cmp === 0) cmp = a.debeNombre.localeCompare(b.debeNombre);
        break;
      case "fecha":
        cmp = a.fecha.localeCompare(b.fecha);
        break;
      case "debe":
        cmp = a.debeNombre.localeCompare(b.debeNombre);
        break;
      case "haber":
        cmp = a.haberNombre.localeCompare(b.haberNombre);
        break;
    }
    return cmp * factor;
  });
}

// ── Modal confirmación borrado ────────────────────────────────────────────────
function DeleteModal({ asiento, numero, onConfirm, onClose }: {
  asiento: Asiento; numero: number | undefined;
  onConfirm: () => void; onClose: () => void;
}) {
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

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>🗑️</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#dc2626" }}>
            ¿Eliminar operación{numero !== undefined ? ` #${numero}` : ""}?
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--t-text2)" }}>
            <strong>"{asiento.descripcion}"</strong>
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--t-text3)" }}>
            Se eliminarán <strong>ambas partidas</strong> del asiento:
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
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

        <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, padding: "8px 12px", background: "rgba(220,38,38,0.07)", borderRadius: 9, marginBottom: 18, textAlign: "center" }}>
          ⚠️ Ambas partidas desaparecerán del libro. Esta acción no se puede deshacer.
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid var(--t-border3)", background: "var(--t-card2)", color: "var(--t-text2)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "#dc2626", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default function BalancePage() {
  const [asientos,     setAsientos]     = useState<Asiento[]>([]);
  const [col,          setCol]          = useState<OrdenCol>("numero");
  const [dir,          setDir]          = useState<OrdenDir>("asc");
  const [deleteTarget, setDeleteTarget] = useState<Asiento | null>(null);

  useEffect(() => {
    setAsientos(loadAsientos());
  }, []);

  const numeros = buildNumeros(asientos);
  const sorted  = sortAsientos(asientos, numeros, col, dir);

  function handleSort(nuevo: OrdenCol) {
    if (nuevo === col) setDir((d) => d === "asc" ? "desc" : "asc");
    else { setCol(nuevo); setDir("asc"); }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteAsiento(deleteTarget.id);
    setAsientos((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const totalDebe  = asientos.reduce((s, a) => s + a.monto, 0);
  const totalHaber = totalDebe; // partida doble, siempre iguales

  // Cabecera de columna clickeable
  function Th({ id, children, style }: { id: OrdenCol; children: React.ReactNode; style?: React.CSSProperties }) {
    const active = col === id;
    return (
      <th
        onClick={() => handleSort(id)}
        style={{
          padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 900,
          letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer",
          userSelect: "none", whiteSpace: "nowrap",
          color: active ? "#0f766e" : "var(--t-text3)",
          borderBottom: `2px solid ${active ? "#0f766e" : "var(--t-border)"}`,
          background: active ? "rgba(15,118,110,0.06)" : "transparent",
          transition: "all .15s",
          ...style,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {children}
          <span style={{ fontSize: 13, opacity: active ? 1 : 0.3 }}>
            {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </span>
      </th>
    );
  }

  return (
    <div style={{ padding: "28px 24px", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <Link href="/admin/kds" style={{
          display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10,
          background: "var(--t-card)", border: "1px solid var(--t-border)",
          color: "var(--t-text2)", fontSize: 18, textDecoration: "none",
        }}>←</Link>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(15,118,110,0.1)", border: "1.5px solid rgba(15,118,110,0.3)", display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0 }}>
          ⚖️
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f766e" }}>Balance General</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--t-text2)" }}>
            {asientos.length} operación(es) · haz click en cualquier columna para ordenar
          </p>
        </div>

        {/* Totales rápidos */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 12, padding: "9px 18px", textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" }}>Total Debe</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#2563eb" }}>{fmtMoney(totalDebe)}</div>
          </div>
          <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 12, padding: "9px 18px", textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase" }}>Total Haber</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#7c3aed" }}>{fmtMoney(totalHaber)}</div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {asientos.length === 0 ? (
        <div style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 16, padding: "60px 24px", textAlign: "center", color: "var(--t-text3)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Sin operaciones registradas</div>
          <div style={{ fontSize: 13 }}>Usa el botón + en Contabilidad General para empezar.</div>
        </div>
      ) : (
        <div style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 18, overflow: "hidden", boxShadow: "var(--t-shadow)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--t-card2)" }}>
                  <Th id="numero"   style={{ width: 60 }}>#</Th>
                  <Th id="partidas">Descripción / Partidas</Th>
                  <Th id="fecha"    style={{ width: 120 }}>Fecha</Th>
                  <Th id="debe"     style={{ width: 220 }}>DEBE</Th>
                  <Th id="haber"    style={{ width: 220 }}>HABER</Th>
                  <th style={{ padding: "11px 14px", width: 60 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((a, i) => {
                  const num = numeros.get(a.id);
                  const isEven = i % 2 === 0;
                  return (
                    <tr key={a.id} style={{ background: isEven ? "transparent" : "var(--t-card2)", borderBottom: "1px solid var(--t-border2)" }}>

                      {/* # Operación */}
                      <td style={{ padding: "13px 14px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", minWidth: 32, padding: "3px 8px",
                          borderRadius: 8, background: "rgba(15,118,110,0.1)",
                          border: "1px solid rgba(15,118,110,0.25)",
                          fontSize: 12, fontWeight: 900, color: "#0f766e",
                        }}>
                          #{num}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ fontWeight: 800, color: "var(--t-text)", marginBottom: 3 }}>{a.descripcion}</div>
                        {a.notas && <div style={{ fontSize: 11, color: "var(--t-text3)" }}>📝 {a.notas}</div>}
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: "13px 14px", color: "var(--t-text2)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        📅 {a.fecha}
                      </td>

                      {/* DEBE */}
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)",
                            display: "grid", placeItems: "center",
                            fontSize: 9, fontWeight: 900, color: "#2563eb",
                          }}>D</div>
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--t-text)", fontSize: 12 }}>
                              {a.debeCodigo} · {a.debeNombre}
                            </div>
                            <div style={{ fontSize: 10, color: TIPO_COLOR[a.debeTipo], fontWeight: 700 }}>
                              {TIPO_LABEL[a.debeTipo]}
                            </div>
                          </div>
                          <div style={{ marginLeft: "auto", fontWeight: 900, color: "#2563eb", whiteSpace: "nowrap" }}>
                            {fmtMoney(a.monto)}
                          </div>
                        </div>
                      </td>

                      {/* HABER */}
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                            display: "grid", placeItems: "center",
                            fontSize: 9, fontWeight: 900, color: "#7c3aed",
                          }}>H</div>
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--t-text)", fontSize: 12 }}>
                              {a.haberCodigo} · {a.haberNombre}
                            </div>
                            <div style={{ fontSize: 10, color: TIPO_COLOR[a.haberTipo], fontWeight: 700 }}>
                              {TIPO_LABEL[a.haberTipo]}
                            </div>
                          </div>
                          <div style={{ marginLeft: "auto", fontWeight: 900, color: "#7c3aed", whiteSpace: "nowrap" }}>
                            {fmtMoney(a.monto)}
                          </div>
                        </div>
                      </td>

                      {/* Eliminar */}
                      <td style={{ padding: "13px 10px", textAlign: "center" }}>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          title="Eliminar operación"
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: "1px solid var(--t-border)",
                            background: "transparent", cursor: "pointer", fontSize: 15,
                            display: "grid", placeItems: "center", color: "var(--t-text3)",
                            transition: "background .15s, color .15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(220,38,38,0.3)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--t-text3)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--t-border)"; }}
                        >🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer totales */}
              <tfoot>
                <tr style={{ background: "var(--t-card2)", borderTop: "2px solid var(--t-border)" }}>
                  <td colSpan={4} style={{ padding: "12px 14px", fontWeight: 900, fontSize: 12, color: "var(--t-text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Total · {asientos.length} operaciones
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#2563eb", textAlign: "right" }}>
                      {fmtMoney(totalDebe)}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#7c3aed", textAlign: "right" }}>
                      {fmtMoney(totalHaber)}
                    </div>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal confirmación */}
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
