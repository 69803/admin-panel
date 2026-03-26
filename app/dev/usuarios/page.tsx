"use client";

import { useState } from "react";

const DEV_KEY = "devpanel2026";

type UserActivity = {
  email: string;
  lastSeen: string;
  visits: string[];
};

function visitasHoy(visits: string[]): number {
  const hoy = new Date().toDateString();
  return visits.filter((v) => new Date(v).toDateString() === hoy).length;
}

function visitasPorDia(visits: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const v of visits) {
    const dia = new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    map[dia] = (map[dia] ?? 0) + 1;
  }
  return map;
}

export default function DevUsuariosPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [usuarios, setUsuarios] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function login() {
    if (key !== DEV_KEY) { setError("Clave incorrecta."); return; }
    setAuthed(true);
    fetchUsuarios(key);
  }

  async function fetchUsuarios(k: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/activity?key=${k}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a: UserActivity, b: UserActivity) =>
          new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );
      setUsuarios(sorted);
    } catch (e: any) {
      try {
        const body = await e?.response?.json?.();
        setError(body?.error ?? e?.message ?? "Error desconocido");
      } catch {
        setError(e?.message ?? "Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  }

  const s = {
    wrap: {
      minHeight: "100vh",
      background: "#0b1220",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      padding: "48px 24px",
    } as React.CSSProperties,
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
          <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
          <h1 style={{ fontSize: 24, fontWeight: 1000, marginBottom: 8 }}>Actividad de Usuarios</h1>
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
          {error && <div style={{ color: "#fca5a5", fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</div>}
        </div>
      </main>
    );
  }

  return (
    <main style={s.wrap}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 1000, margin: 0 }}>👥 Actividad de Usuarios</h1>
            <div style={{ opacity: 0.5, fontSize: 13, marginTop: 4 }}>
              {usuarios.length} cuenta{usuarios.length !== 1 ? "s" : ""} registrada{usuarios.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={() => fetchUsuarios(key)}
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

        {usuarios.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", opacity: 0.4 }}>
            No hay actividad registrada todavía.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {usuarios.map((u) => {
              const hoy = visitasHoy(u.visits);
              const porDia = visitasPorDia(u.visits);
              const diasRecientes = Object.entries(porDia).reverse();
              const isOpen = expanded === u.email;

              return (
                <div
                  key={u.email}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.10)",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  {/* Fila principal */}
                  <div
                    onClick={() => setExpanded(isOpen ? null : u.email)}
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      cursor: "pointer",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Avatar inicial */}
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 900, fontSize: 16, flexShrink: 0,
                    }}>
                      {u.email[0].toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{u.email}</div>
                      <div style={{ opacity: 0.5, fontSize: 12, marginTop: 2 }}>
                        Última visita: {new Date(u.lastSeen).toLocaleString("es-ES")}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 900 }}>{u.visits.length}</div>
                        <div style={{ opacity: 0.45, fontSize: 11 }}>total visitas</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: hoy > 0 ? "#86efac" : "#fff" }}>{hoy}</div>
                        <div style={{ opacity: 0.45, fontSize: 11 }}>hoy</div>
                      </div>
                      <div style={{ opacity: 0.4, fontSize: 18 }}>{isOpen ? "▲" : "▼"}</div>
                    </div>
                  </div>

                  {/* Detalle expandible */}
                  {isOpen && (
                    <div style={{
                      borderTop: "1px solid rgba(255,255,255,.07)",
                      padding: "16px 20px 20px",
                    }}>
                      <div style={{ opacity: 0.5, fontSize: 12, marginBottom: 12, fontWeight: 700, letterSpacing: "0.08em" }}>
                        VISITAS POR DÍA (TODO EL HISTORIAL)
                      </div>
                      {diasRecientes.length === 0 ? (
                        <div style={{ opacity: 0.4, fontSize: 13 }}>Sin datos</div>
                      ) : (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {diasRecientes.map(([dia, count]) => (
                            <div key={dia} style={{
                              background: "rgba(124,58,237,.18)",
                              border: "1px solid rgba(124,58,237,.35)",
                              borderRadius: 10,
                              padding: "8px 14px",
                              textAlign: "center",
                            }}>
                              <div style={{ fontWeight: 900, fontSize: 18 }}>{count}</div>
                              <div style={{ opacity: 0.6, fontSize: 11 }}>{dia}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
