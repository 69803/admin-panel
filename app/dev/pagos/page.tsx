"use client";

import { useState } from "react";

const DEV_KEY = "devpanel2026";

type Pago = {
  id: number;
  plan: string;
  precio: string;
  referencia: string;
  fecha: string;
  recibido: string;
  estado: "pendiente" | "verificado" | "rechazado";
};

const ESTADO_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  pendiente: { bg: "rgba(234,179,8,.12)", border: "rgba(234,179,8,.35)", color: "#fde68a" },
  verificado: { bg: "rgba(34,197,94,.12)", border: "rgba(34,197,94,.35)", color: "#86efac" },
  rechazado: { bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.35)", color: "#fca5a5" },
};

export default function DevPagosPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    if (key !== DEV_KEY) {
      setError("Clave incorrecta.");
      return;
    }
    setAuthed(true);
    fetchPagos(key);
  }

  async function fetchPagos(k: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pagos?key=${k}`);
      if (!res.ok) throw new Error("No autorizado");
      const data = await res.json();
      setPagos(Array.isArray(data) ? data.reverse() : []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pagos");
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(id: number, estado: string) {
    await fetch(`/api/pagos?key=${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    fetchPagos(key);
  }

  const s = {
    wrap: {
      minHeight: "100vh",
      background: "#0b1220",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      padding: "48px 24px",
    },
    card: {
      maxWidth: 1000,
      margin: "0 auto",
    },
    input: {
      padding: "12px 14px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.18)",
      background: "rgba(0,0,0,.3)",
      color: "#fff",
      fontSize: 15,
      outline: "none",
      width: 280,
    } as React.CSSProperties,
    btn: {
      padding: "12px 24px",
      borderRadius: 12,
      border: "none",
      background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
      color: "#fff",
      fontWeight: 900,
      fontSize: 15,
      cursor: "pointer",
    } as React.CSSProperties,
  };

  if (!authed) {
    return (
      <main style={s.wrap}>
        <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
          <h1 style={{ fontSize: 24, fontWeight: 1000, marginBottom: 8 }}>Panel de Desarrollador</h1>
          <p style={{ opacity: 0.55, fontSize: 14, marginBottom: 28 }}>Introduce la clave de acceso</p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Clave secreta"
              style={s.input}
            />
            <button onClick={login} style={s.btn}>Entrar</button>
          </div>

          {error && (
            <div style={{ color: "#fca5a5", fontSize: 13, marginTop: 12, fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={s.wrap}>
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 1000, margin: 0 }}>💳 Pagos recibidos</h1>
            <div style={{ opacity: 0.5, fontSize: 13, marginTop: 4 }}>Panel de desarrollador — solo visible para ti</div>
          </div>
          <button
            onClick={() => fetchPagos(key)}
            disabled={loading}
            style={{ ...s.btn, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", fontSize: 14 }}
          >
            {loading ? "Cargando..." : "🔄 Refrescar"}
          </button>
        </div>

        {error && (
          <div style={{ padding: 14, borderRadius: 12, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", color: "#fca5a5", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {pagos.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", opacity: 0.4 }}>
            No hay pagos registrados todavía.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pagos.map((p) => {
              const est = ESTADO_COLORS[p.estado] ?? ESTADO_COLORS.pendiente;
              return (
                <div
                  key={p.id}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.10)",
                    borderRadius: 14,
                    padding: "18px 20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 1000, fontSize: 16 }}>Plan {p.plan}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, opacity: 0.7 }}>{p.precio}</span>
                        <span style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: est.bg,
                          border: `1px solid ${est.border}`,
                          color: est.color,
                        }}>
                          {p.estado.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px 20px" }}>
                        <div>
                          <span style={{ opacity: 0.45, fontSize: 12 }}>Referencia: </span>
                          <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>{p.referencia}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.45, fontSize: 12 }}>Transferencia: </span>
                          <span style={{ fontSize: 13 }}>{p.fecha ? new Date(p.fecha).toLocaleString("es-ES") : "-"}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.45, fontSize: 12 }}>Recibido: </span>
                          <span style={{ fontSize: 13 }}>{p.recibido ? new Date(p.recibido).toLocaleString("es-ES") : "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {p.estado !== "verificado" && (
                        <button
                          onClick={() => cambiarEstado(p.id, "verificado")}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(34,197,94,.4)",
                            background: "rgba(34,197,94,.12)",
                            color: "#86efac",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          ✓ Verificar
                        </button>
                      )}
                      {p.estado !== "rechazado" && (
                        <button
                          onClick={() => cambiarEstado(p.id, "rechazado")}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(239,68,68,.4)",
                            background: "rgba(239,68,68,.12)",
                            color: "#fca5a5",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          ✕ Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
