"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Periodo = "diario" | "semanal" | "mensual";

type TopPlato = {
  plato_id: number;
  nombre?: string;
  cantidad: number;
  ingreso: number;
};

type ReporteResumen = {
  periodo: string;
  desde: string;
  hasta: string;
  total_platos_vendidos: number;
  total_ganancia: number;
  top_platos: TopPlato[];
};

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://restaurante-backend-q43k.onrender.com"
  ).replace(/\/$/, "");

// ⚠️ Igual que tu Flutter (solo para demo/admin local)
// Ideal: mover a auth luego.
const ADMIN_PURGE_PASS = "4321";

function fmtISODate(d: Date) {
  const y = String(d.getFullYear()).padStart(4, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtMoney(v: number) {
  return `€ ${v.toFixed(2)}`;
}

async function fetchReporte(periodo: Periodo, fechaISO: string): Promise<ReporteResumen> {
  const url = `${API_BASE}/reportes/resumen?periodo=${periodo}&fecha=${fechaISO}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ReporteResumen;
}

async function deleteHistorial(): Promise<void> {
  const url = `${API_BASE}/admin/pedidos`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} — ${txt}`);
  }
}

function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>("diario");
  const [fechaISO, setFechaISO] = useState<string>(() => fmtISODate(new Date()));

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReporteResumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const json = await fetchReporte(periodo, fechaISO);
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [periodo, fechaISO]);

  useEffect(() => {
    load();
  }, [load]);

  const top = useMemo(() => data?.top_platos ?? [], [data]);

  function exportCSV() {
    if (!data) return;

    const lines: string[] = [];
    lines.push("Periodo,Desde,Hasta,Total platos,Total ganancia");
    lines.push(
      `${data.periodo},${data.desde},${data.hasta},${data.total_platos_vendidos},${data.total_ganancia}`
    );
    lines.push("");
    lines.push("TOP PLATOS");
    lines.push("plato_id,nombre,cantidad,ingreso");

    for (const t of top) {
      const nombre = String(t.nombre ?? "").replaceAll(",", " ");
      lines.push(`${t.plato_id},${nombre},${t.cantidad},${t.ingreso}`);
    }

    const csv = lines.join("\n");
    downloadText(`reporte_${periodo}_${fechaISO}.csv`, csv, "text/csv");
  }

  async function confirmAndClear() {
    const pass = window.prompt("Contraseña de administrador:");
    if (pass == null) return;
    if (pass.trim() !== ADMIN_PURGE_PASS) {
      alert("Contraseña incorrecta");
      return;
    }
    const ok = window.confirm("Esto borrará TODO el historial. ¿Seguro?");
    if (!ok) return;

    try {
      setLoading(true);
      await deleteHistorial();
      alert("Historial borrado");
      await load(); // refresca
    } catch (e: any) {
      alert(`Error: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  const pageStyle: React.CSSProperties = {
    padding: 16,
    background: "#0b1220",
    minHeight: "100vh",
    color: "white",
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 12,
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  const dangerBtn: React.CSSProperties = {
    ...btn,
    background: "rgba(239,68,68,0.18)",
    border: "1px solid rgba(239,68,68,0.35)",
  };

  const statBox: React.CSSProperties = {
    ...card,
    padding: 14,
    display: "flex",
    gap: 12,
    alignItems: "center",
    minWidth: 240,
  };

  const miniIcon: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  };

  const maxCantidad = Math.max(1, ...top.map((t) => Number(t.cantidad) || 0));

  return (
    <div style={pageStyle}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Reportes</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>API: {API_BASE}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/admin/kds" style={btn}>
            ← KDS
          </Link>

          <button onClick={load} disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
            🔄 Actualizar
          </button>

          <button onClick={confirmAndClear} disabled={loading} style={{ ...dangerBtn, opacity: loading ? 0.6 : 1 }}>
            🗑️ Borrar historial
          </button>

          <button onClick={exportCSV} disabled={!data || loading} style={{ ...btn, opacity: !data || loading ? 0.6 : 1 }}>
            ⬇️ Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ opacity: 0.85, fontSize: 13 }}>Periodo</span>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              style={{
                padding: "10px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                fontWeight: 800,
              }}
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ opacity: 0.85, fontSize: 13 }}>Fecha</span>
            <input
              type="date"
              value={fechaISO}
              onChange={(e) => setFechaISO(e.target.value)}
              style={{
                padding: "10px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                fontWeight: 800,
              }}
            />
          </label>

          {loading ? <span style={{ opacity: 0.85 }}>Cargando…</span> : null}
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

      {!data ? (
        <div style={card}>Sin datos</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={statBox}>
              <div style={miniIcon}>🍽️</div>
              <div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>Platos vendidos</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{data.total_platos_vendidos}</div>
              </div>
            </div>

            <div style={statBox}>
              <div style={miniIcon}>💰</div>
              <div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>Ganancia</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{fmtMoney(Number(data.total_ganancia) || 0)}</div>
              </div>
            </div>

            <div style={statBox}>
              <div style={miniIcon}>⏱️</div>
              <div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>Desde</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{data.desde}</div>
              </div>
            </div>

            <div style={statBox}>
              <div style={miniIcon}>🗓️</div>
              <div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>Hasta</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{data.hasta}</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>
              Top platos por cantidad
            </div>

            {top.length === 0 ? (
              <div style={{ opacity: 0.8 }}>Sin ventas en el periodo</div>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", overflowX: "auto", paddingBottom: 6 }}>
                {top.slice(0, 12).map((t) => {
                  const h = Math.round(((Number(t.cantidad) || 0) / maxCantidad) * 180);
                  return (
                    <div key={t.plato_id} style={{ minWidth: 90 }}>
                      <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6, textAlign: "center" }}>
                        {t.cantidad}
                      </div>
                      <div
                        style={{
                          height: h,
                          borderRadius: 12,
                          background: "rgba(59,130,246,0.55)",
                          border: "1px solid rgba(59,130,246,0.35)",
                        }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85, textAlign: "center" }}>
                        {(t.nombre ?? `Plato ${t.plato_id}`).toString().slice(0, 12)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Table/list */}
          <div style={card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>Top platos (lista)</div>
            {top.length === 0 ? (
              <div style={{ opacity: 0.8 }}>Sin ventas en el periodo</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {top.map((t) => (
                  <div
                    key={t.plato_id}
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      background: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900 }}>
                        #{t.plato_id} — {(t.nombre ?? "").toString() || `Plato ${t.plato_id}`}
                      </div>
                      <div style={{ opacity: 0.85, fontSize: 13 }}>Cantidad: {t.cantidad}</div>
                    </div>
                    <div style={{ fontWeight: 900 }}>{fmtMoney(Number(t.ingreso) || 0)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
