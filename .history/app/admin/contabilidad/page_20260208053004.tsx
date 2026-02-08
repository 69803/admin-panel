"use client";

import React, { useEffect, useMemo, useState } from "react";

type Gasto = {
  id: number;
  fecha: string | null; // YYYY-MM-DD
  concepto: string;
  monto: number;
  categoria: string;
  created_at?: string | null;
};

type BalanceRow = {
  mes: string | null; // YYYY-MM-DD (primer día del mes)
  ingresos: number;
  gastos: number;
  balance: number;
};

function normalizeApiUrl(raw?: string) {
  if (!raw) return null;
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  url = url.replace(/^http:\/\//i, "https://");
  url = url.replace(/\/+$/, "");
  return url;
}

function up(s?: string) {
  return (s ?? "").trim().toUpperCase();
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function moneyEUR(v: number) {
  return `€ ${safeNum(v).toFixed(2)}`;
}

export default function ContabilidadPage() {
  const baseUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  const [tab, setTab] = useState<"gastos" | "balance">("gastos");

  // ---------- GASTOS ----------
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState<string | null>(null);
  const [gBusy, setGBusy] = useState(false);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cat, setCat] = useState("");

  // crear gasto
  const [newFecha, setNewFecha] = useState("");
  const [newConcepto, setNewConcepto] = useState("");
  const [newMonto, setNewMonto] = useState("");
  const [newCategoria, setNewCategoria] = useState("OTROS");

  // editar gasto
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFecha, setEditFecha] = useState("");
  const [editConcepto, setEditConcepto] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editCategoria, setEditCategoria] = useState("");

  const fetchGastos = async () => {
    if (!baseUrl) {
      setGError("Falta NEXT_PUBLIC_API_URL en Vercel / .env.local");
      return;
    }

    setGLoading(true);
    setGError(null);

    try {
      const qs = new URLSearchParams();
      if (desde.trim()) qs.set("desde", desde.trim());
      if (hasta.trim()) qs.set("hasta", hasta.trim());
      if (cat.trim()) qs.set("categoria", cat.trim());
      qs.set("limit", "200");

      const res = await fetch(`${baseUrl}/gastos?${qs.toString()}`, { cache: "no-store" });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`GET /gastos (HTTP ${res.status}) ${txt}`);
      }

      const data = (await res.json()) as Gasto[];
      setGastos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setGError(e?.message ?? "Error cargando gastos");
    } finally {
      setGLoading(false);
    }
  };

  const createGasto = async () => {
    if (!baseUrl) return;

    const concepto = newConcepto.trim();
    const montoNum = Number(newMonto);
    const categoria = up(newCategoria) || "OTROS";
    const fecha = newFecha.trim() || null;

    if (!concepto) return setGError("Concepto requerido");
    if (!Number.isFinite(montoNum) || montoNum < 0) return setGError("Monto inválido (>= 0)");

    setGBusy(true);
    setGError(null);

    try {
      const res = await fetch(`${baseUrl}/gastos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, concepto, monto: montoNum, categoria }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`POST /gastos (HTTP ${res.status}) ${txt}`);
      }

      setNewFecha("");
      setNewConcepto("");
      setNewMonto("");
      setNewCategoria("OTROS");

      await fetchGastos();
    } catch (e: any) {
      setGError(e?.message ?? "Error creando gasto");
    } finally {
      setGBusy(false);
    }
  };

  const startEdit = (g: Gasto) => {
    setEditingId(g.id);
    setEditFecha(g.fecha ?? "");
    setEditConcepto(g.concepto ?? "");
    setEditMonto(String(g.monto ?? ""));
    setEditCategoria(g.categoria ?? "OTROS");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFecha("");
    setEditConcepto("");
    setEditMonto("");
    setEditCategoria("");
  };

  const saveEdit = async (id: number) => {
    if (!baseUrl) return;

    const concepto = editConcepto.trim();
    const montoNum = Number(editMonto);
    const categoria = up(editCategoria) || "OTROS";
    const fecha = editFecha.trim() || null;

    if (!concepto) return setGError("Concepto requerido");
    if (!Number.isFinite(montoNum) || montoNum < 0) return setGError("Monto inválido (>= 0)");

    setGBusy(true);
    setGError(null);

    try {
      const res = await fetch(`${baseUrl}/gastos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, concepto, monto: montoNum, categoria }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`PUT /gastos/${id} (HTTP ${res.status}) ${txt}`);
      }

      cancelEdit();
      await fetchGastos();
    } catch (e: any) {
      setGError(e?.message ?? "Error editando gasto");
    } finally {
      setGBusy(false);
    }
  };

  const deleteGasto = async (id: number) => {
    if (!baseUrl) return;
    const ok = confirm(`¿Borrar gasto ID ${id}?`);
    if (!ok) return;

    setGBusy(true);
    setGError(null);

    try {
      const res = await fetch(`${baseUrl}/gastos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`DELETE /gastos/${id} (HTTP ${res.status}) ${txt}`);
      }

      if (editingId === id) cancelEdit();
      await fetchGastos();
    } catch (e: any) {
      setGError(e?.message ?? "Error borrando gasto");
    } finally {
      setGBusy(false);
    }
  };

  const categoriasDetectadas = useMemo(() => {
    const set = new Set<string>();
    for (const g of gastos) set.add(up(g.categoria) || "OTROS");
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [gastos]);

  // ✅ PASO 2: Totales (Gastos)
  const gastosStats = useMemo(() => {
    const rows = Array.isArray(gastos) ? gastos : [];
    const total = rows.reduce((acc, g) => acc + safeNum(g.monto), 0);
    const count = rows.length;
    const avg = count ? total / count : 0;

    let max = 0;
    let maxRow: Gasto | null = null;
    for (const g of rows) {
      const m = safeNum(g.monto);
      if (m >= max) {
        max = m;
        maxRow = g;
      }
    }

    return {
      count,
      total,
      avg,
      max,
      maxRow,
    };
  }, [gastos]);

  // ---------- BALANCE ----------
  const [balance, setBalance] = useState<BalanceRow[]>([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!baseUrl) {
      setBError("Falta NEXT_PUBLIC_API_URL en Vercel / .env.local");
      return;
    }
    setBLoading(true);
    setBError(null);

    try {
      const res = await fetch(`${baseUrl}/contabilidad/balance_mensual`, { cache: "no-store" });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`GET /contabilidad/balance_mensual (HTTP ${res.status}) ${txt}`);
      }

      const data = (await res.json()) as BalanceRow[];
      setBalance(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setBError(e?.message ?? "Error cargando balance");
    } finally {
      setBLoading(false);
    }
  };

  // ✅ PASO 2: Totales (Balance)
  const balanceStats = useMemo(() => {
    const rows = Array.isArray(balance) ? balance : [];
    const totalIngresos = rows.reduce((acc, r) => acc + safeNum(r.ingresos), 0);
    const totalGastos = rows.reduce((acc, r) => acc + safeNum(r.gastos), 0);
    const totalBalance = rows.reduce((acc, r) => acc + safeNum(r.balance), 0);
    return { meses: rows.length, totalIngresos, totalGastos, totalBalance };
  }, [balance]);

  // cargar gastos al entrar
  useEffect(() => {
    fetchGastos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cargar balance cuando cambias a la pestaña
  useEffect(() => {
    if (tab === "balance") fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ---------- UI ----------
  const s = {
    wrap: {
      minHeight: "100vh",
      padding: 26,
      background: "#0b1220",
      color: "white",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
    } as React.CSSProperties,
    card: {
      maxWidth: 1200,
      margin: "0 auto",
      background: "rgba(255,255,255,.06)",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: 18,
      padding: 18,
      boxShadow: "0 18px 50px rgba(0,0,0,.25)",
    } as React.CSSProperties,
    row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" } as React.CSSProperties,
    input: {
      padding: 10,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.18)",
      background: "rgba(0,0,0,.25)",
      color: "white",
      outline: "none",
      fontSize: 14,
    } as React.CSSProperties,
    btn: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.18)",
      background: "rgba(255,255,255,.08)",
      color: "white",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 14,
    } as React.CSSProperties,
    btnPrimary: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(124,58,237,.9)",
      background: "rgba(124,58,237,.95)",
      color: "white",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 14,
    } as React.CSSProperties,
    btnDanger: {
      padding: "8px 12px",
      borderRadius: 12,
      border: "1px solid rgba(239,68,68,.5)",
      background: "rgba(239,68,68,.15)",
      color: "#fecaca",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 13,
    } as React.CSSProperties,
    badge: {
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(255,255,255,.10)",
      border: "1px solid rgba(255,255,255,.16)",
      fontSize: 12,
      fontWeight: 900,
    } as React.CSSProperties,
    table: {
      width: "100%",
      borderCollapse: "collapse",
      overflow: "hidden",
      borderRadius: 14,
    } as React.CSSProperties,
    th: { textAlign: "left", padding: 12, fontSize: 12, color: "rgba(255,255,255,.75)" } as React.CSSProperties,
    td: { padding: 12, borderTop: "1px solid rgba(255,255,255,.10)" } as React.CSSProperties,

    // ✅ Stats cards
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
      gap: 10,
      marginBottom: 12,
    } as React.CSSProperties,
    statCard: {
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(255,255,255,.05)",
      padding: 12,
    } as React.CSSProperties,
    statLabel: { opacity: 0.8, fontSize: 12, marginBottom: 6 } as React.CSSProperties,
    statValue: { fontSize: 18, fontWeight: 1000 } as React.CSSProperties,
    statSub: { opacity: 0.8, fontSize: 12, marginTop: 4 } as React.CSSProperties,
  };

  return (
    <main style={s.wrap}>
      <div style={s.card}>
        <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 1000 }}>💰 Contabilidad</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
              API: <span style={{ fontWeight: 900 }}>{baseUrl ?? "(no definido)"}</span>
            </div>
          </div>

          <div style={s.row}>
            <button onClick={() => setTab("gastos")} style={tab === "gastos" ? s.btnPrimary : s.btn}>
              Gastos
            </button>
            <button onClick={() => setTab("balance")} style={tab === "balance" ? s.btnPrimary : s.btn}>
              Balance mensual
            </button>
          </div>
        </div>

        {tab === "gastos" ? (
          <>
            {gError && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(239,68,68,.12)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: "#fecaca",
                  fontWeight: 900,
                }}
              >
                ❌ {gError}
              </div>
            )}

            {/* ✅ PASO 2: Totales arriba */}
            <div style={s.statsGrid}>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total gastos (filtrado)</div>
                <div style={s.statValue}>{gLoading ? "…" : moneyEUR(gastosStats.total)}</div>
                <div style={s.statSub}>Suma de los registros mostrados</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Promedio por gasto</div>
                <div style={s.statValue}>{gLoading ? "…" : moneyEUR(gastosStats.avg)}</div>
                <div style={s.statSub}>Promedio del listado actual</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Gasto más alto</div>
                <div style={s.statValue}>{gLoading ? "…" : moneyEUR(gastosStats.max)}</div>
                <div style={s.statSub}>
                  {gastosStats.maxRow ? `${gastosStats.maxRow.concepto}` : "—"}
                </div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Registros</div>
                <div style={s.statValue}>{gLoading ? "…" : gastosStats.count}</div>
                <div style={s.statSub}>{gLoading ? "Cargando…" : "Listo"}</div>
              </div>
            </div>

            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
              <div style={s.row}>
                <span style={s.badge}>Registros: {gastos.length}</span>
                {gLoading ? <span style={s.badge}>Cargando…</span> : <span style={s.badge}>Listo</span>}
              </div>

              <div style={s.row}>
                <button onClick={fetchGastos} style={s.btn} disabled={gLoading || gBusy}>
                  🔄 Refrescar
                </button>
              </div>
            </div>

            {/* Crear */}
            <div
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.05)",
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>➕ Nuevo gasto</div>
              <div style={s.row}>
                <input type="date" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} style={s.input} />
                <input
                  value={newConcepto}
                  onChange={(e) => setNewConcepto(e.target.value)}
                  placeholder="Concepto (ej: Harina PAN)"
                  style={{ ...s.input, minWidth: 260 }}
                />
                <input
                  value={newMonto}
                  onChange={(e) => setNewMonto(e.target.value)}
                  placeholder="Monto (ej: 12.50)"
                  inputMode="decimal"
                  style={{ ...s.input, width: 160 }}
                />
                <input
                  value={newCategoria}
                  onChange={(e) => setNewCategoria(e.target.value)}
                  placeholder="Categoría (ej: INSUMOS)"
                  style={{ ...s.input, width: 220 }}
                  list="cat-sugs"
                />
                <button onClick={createGasto} style={s.btnPrimary} disabled={gBusy}>
                  Guardar
                </button>
              </div>
            </div>

            <datalist id="cat-sugs">
              {["OTROS", "INSUMOS", "SERVICIOS", "ALQUILER", "SUELDOS", "TRANSPORTE", ...categoriasDetectadas]
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .map((c) => (
                  <option key={c} value={c} />
                ))}
            </datalist>

            {/* Filtros */}
            <div style={{ ...s.row, marginBottom: 12 }}>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={s.input} />
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={s.input} />
              <input
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                placeholder="Filtrar categoría (opcional)"
                style={{ ...s.input, width: 240 }}
              />
              <button onClick={fetchGastos} style={s.btn} disabled={gLoading || gBusy}>
                Aplicar filtros
              </button>
              <button
                onClick={() => {
                  setDesde("");
                  setHasta("");
                  setCat("");
                  setTimeout(fetchGastos, 0);
                }}
                style={s.btn}
                disabled={gLoading || gBusy}
              >
                Limpiar
              </button>
            </div>

            {/* Tabla */}
            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, overflow: "hidden" }}>
              <table style={s.table}>
                <thead style={{ background: "rgba(255,255,255,.06)" }}>
                  <tr>
                    <th style={s.th}>ID</th>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Concepto</th>
                    <th style={s.th}>Monto</th>
                    <th style={s.th}>Categoría</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {gastos.map((g) => {
                    const isEditing = editingId === g.id;
                    return (
                      <tr key={g.id}>
                        <td style={{ ...s.td, fontWeight: 1000 }}>{g.id}</td>

                        <td style={s.td}>
                          {isEditing ? (
                            <input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} style={s.input} />
                          ) : (
                            <span style={{ opacity: 0.9 }}>{g.fecha ?? "-"}</span>
                          )}
                        </td>

                        <td style={s.td}>
                          {isEditing ? (
                            <input value={editConcepto} onChange={(e) => setEditConcepto(e.target.value)} style={{ ...s.input, minWidth: 260 }} />
                          ) : (
                            <span style={{ fontWeight: 800 }}>{g.concepto}</span>
                          )}
                        </td>

                        <td style={s.td}>
                          {isEditing ? (
                            <input value={editMonto} onChange={(e) => setEditMonto(e.target.value)} inputMode="decimal" style={{ ...s.input, width: 140 }} />
                          ) : (
                            <span style={{ fontWeight: 1000 }}>€ {safeNum(g.monto).toFixed(2)}</span>
                          )}
                        </td>

                        <td style={s.td}>
                          {isEditing ? (
                            <input value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} style={{ ...s.input, width: 200 }} list="cat-sugs" />
                          ) : (
                            <span style={s.badge}>{up(g.categoria) || "OTROS"}</span>
                          )}
                        </td>

                        <td style={s.td}>
                          {!isEditing ? (
                            <div style={s.row}>
                              <button onClick={() => startEdit(g)} style={s.btn} disabled={gBusy}>
                                ✏️ Editar
                              </button>
                              <button onClick={() => deleteGasto(g.id)} style={s.btnDanger} disabled={gBusy}>
                                ✖ Borrar
                              </button>
                            </div>
                          ) : (
                            <div style={s.row}>
                              <button onClick={() => saveEdit(g.id)} style={s.btnPrimary} disabled={gBusy}>
                                💾 Guardar
                              </button>
                              <button onClick={cancelEdit} style={s.btn} disabled={gBusy}>
                                Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {gastos.length === 0 && !gLoading && (
                    <tr>
                      <td colSpan={6} style={{ ...s.td, opacity: 0.8 }}>
                        No hay gastos todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {bError && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(239,68,68,.12)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: "#fecaca",
                  fontWeight: 900,
                }}
              >
                ❌ {bError}
              </div>
            )}

            {/* ✅ PASO 2: Totales arriba (Balance) */}
            <div style={s.statsGrid}>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total ingresos</div>
                <div style={s.statValue}>{bLoading ? "…" : moneyEUR(balanceStats.totalIngresos)}</div>
                <div style={s.statSub}>Suma de todos los meses</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total gastos</div>
                <div style={s.statValue}>{bLoading ? "…" : moneyEUR(balanceStats.totalGastos)}</div>
                <div style={s.statSub}>Suma de todos los meses</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Balance total</div>
                <div style={s.statValue}>{bLoading ? "…" : moneyEUR(balanceStats.totalBalance)}</div>
                <div style={s.statSub}>Ingresos - Gastos</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Meses</div>
                <div style={s.statValue}>{bLoading ? "…" : balanceStats.meses}</div>
                <div style={s.statSub}>{bLoading ? "Cargando…" : "Listo"}</div>
              </div>
            </div>

            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
              <div style={s.row}>
                <span style={s.badge}>Meses: {balance.length}</span>
                {bLoading ? <span style={s.badge}>Cargando…</span> : <span style={s.badge}>Listo</span>}
              </div>

              <button onClick={fetchBalance} style={s.btn} disabled={bLoading}>
                🔄 Refrescar
              </button>
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, overflow: "hidden" }}>
              <table style={s.table}>
                <thead style={{ background: "rgba(255,255,255,.06)" }}>
                  <tr>
                    <th style={s.th}>Mes</th>
                    <th style={s.th}>Ingresos</th>
                    <th style={s.th}>Gastos</th>
                    <th style={s.th}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.map((r, idx) => (
                    <tr key={`${r.mes ?? "null"}-${idx}`}>
                      <td style={{ ...s.td, fontWeight: 1000 }}>{r.mes ?? "-"}</td>
                      <td style={s.td}>€ {safeNum(r.ingresos).toFixed(2)}</td>
                      <td style={s.td}>€ {safeNum(r.gastos).toFixed(2)}</td>
                      <td style={{ ...s.td, fontWeight: 1000 }}>€ {safeNum(r.balance).toFixed(2)}</td>
                    </tr>
                  ))}

                  {balance.length === 0 && !bLoading && (
                    <tr>
                      <td colSpan={4} style={{ ...s.td, opacity: 0.8 }}>
                        No hay datos de balance todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
