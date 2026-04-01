"use client";

import { useState } from "react";

const DEV_KEY = "devpanel2026";

type UserActivity = {
  email: string;
  lastSeen: string;
  visits: string[];
};

type PageEvent = {
  id: number;
  session_id: string;
  event_type: "page_enter" | "page_exit" | "action";
  route: string;
  module: string | null;
  event_name: string | null;
  metadata: Record<string, unknown>;
  duration_ms: number | null;
  ts: string;
};

type DaySummary = {
  first_activity: string | null;
  last_activity:  string | null;
  total_active_ms: number;
  pages_visited:  string[];
  total_events:   number;
  navigation_flow: string[];
};

type DayDetail = {
  events: PageEvent[];
  summary: DaySummary;
};

type DayCard = {
  display: string;  // "30 mar"
  isoDate: string;  // "2026-03-30"
  count: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function visitasHoy(visits: string[]): number {
  const hoy = new Date().toDateString();
  return visits.filter((v) => new Date(v).toDateString() === hoy).length;
}

function visitasPorDia(visits: string[]): DayCard[] {
  const map: Record<string, { display: string; count: number }> = {};
  for (const v of visits) {
    const d = new Date(v);
    const isoDate = d.toISOString().slice(0, 10);
    const display = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    if (!map[isoDate]) map[isoDate] = { display, count: 0 };
    map[isoDate].count++;
  }
  return Object.entries(map)
    .map(([isoDate, { display, count }]) => ({ display, isoDate, count }))
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDuration(ms: number | null): string {
  if (!ms || ms < 1000) return "";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

function fmtTotalTime(ms: number): string {
  if (ms < 1000) return "< 1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}

function eventIcon(ev: PageEvent): string {
  if (ev.event_type === "page_enter") return "→";
  if (ev.event_type === "page_exit")  return "←";
  const name = ev.event_name ?? "";
  if (name === "session_start")    return "🔑";
  if (name.includes("checkout"))   return "💳";
  if (name.includes("export"))     return "📤";
  if (name.includes("filter"))     return "🔍";
  if (name.includes("tab"))        return "🗂";
  if (name.includes("config"))     return "⚙️";
  return "•";
}

function eventLabel(ev: PageEvent): string {
  if (ev.event_type === "page_enter") {
    return `Entró a ${ev.module ?? ev.route}`;
  }
  if (ev.event_type === "page_exit") {
    const dur = fmtDuration(ev.duration_ms);
    return `Salió de ${ev.module ?? ev.route}${dur ? ` · estuvo ${dur}` : ""}`;
  }
  // action
  const name = ev.event_name ?? "evento";
  if (name === "session_start") return "Inició sesión en el panel";
  return name.replace(/_/g, " ");
}

function eventColor(ev: PageEvent): string {
  if (ev.event_type === "page_enter") return "#7c3aed";
  if (ev.event_type === "page_exit")  return "#64748b";
  if (ev.event_name === "session_start") return "#16a34a";
  return "#3b82f6";
}

// ── Modal de detalle de día ───────────────────────────────────────────────────

function DayDetailModal({
  email, date, display, devKey, onClose,
}: {
  email: string;
  date: string;
  display: string;
  devKey: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Fetch al montar
  useState(() => {
    fetch(`/api/events?email=${encodeURIComponent(email)}&date=${date}&key=${devKey}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setErr(d.error); } else { setData(d); }
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  });

  const s = data?.summary;
  const events = data?.events ?? [];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
        padding: 24,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--t-card)",
          border: "1px solid var(--t-border)",
          borderRadius: 20,
          width: "min(680px, 100%)",
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,.35)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--t-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: "var(--t-text)" }}>
              📅 {display} · {email}
            </div>
            <div style={{ fontSize: 12, color: "var(--t-text2)", marginTop: 3 }}>
              Historial detallado del día
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--t-card2)", border: "1px solid var(--t-border)",
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              color: "var(--t-text)", fontWeight: 700, fontSize: 13,
            }}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Content */}
        <div style={{ overflow: "auto", padding: "20px 24px", flex: 1 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t-text2)" }}>
              Cargando historial...
            </div>
          )}

          {err && (
            <div style={{
              background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 14,
            }}>
              Error: {err}
            </div>
          )}

          {!loading && !err && events.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t-text3)" }}>
              Sin actividad detallada registrada para este día.
              <br />
              <span style={{ fontSize: 12, marginTop: 8, display: "block" }}>
                El tracking detallado empieza a registrarse desde ahora.
              </span>
            </div>
          )}

          {/* Resumen del día */}
          {s && events.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10, marginBottom: 24,
            }}>
              {[
                { label: "Primera actividad", value: s.first_activity ? fmtTime(s.first_activity) : "—" },
                { label: "Última actividad",  value: s.last_activity  ? fmtTime(s.last_activity)  : "—" },
                { label: "Tiempo activo",     value: fmtTotalTime(s.total_active_ms) },
                { label: "Páginas visitadas", value: String(s.pages_visited.length) },
                { label: "Total eventos",     value: String(s.total_events) },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: "var(--t-card2)",
                  border: "1px solid var(--t-border)",
                  borderRadius: 12, padding: "12px 14px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--t-text)" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t-text2)", marginTop: 3 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Flujo de navegación */}
          {s && s.navigation_flow.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text2)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 10 }}>
                Flujo de navegación
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {s.navigation_flow.map((page, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      background: "rgba(124,58,237,.12)",
                      border: "1px solid rgba(124,58,237,.3)",
                      borderRadius: 8, padding: "3px 10px",
                      fontSize: 12, fontWeight: 700, color: "#7c3aed",
                    }}>
                      {page}
                    </span>
                    {i < s.navigation_flow.length - 1 && (
                      <span style={{ color: "var(--t-text3)", fontSize: 12 }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline de eventos */}
          {events.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text2)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 14 }}>
                Timeline completo
              </div>
              <div style={{ position: "relative" }}>
                {/* Línea vertical */}
                <div style={{
                  position: "absolute", left: 14, top: 0, bottom: 0,
                  width: 2, background: "var(--t-border)",
                }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {events.map((ev, i) => (
                    <div key={ev.id ?? i} style={{
                      display: "flex", gap: 14, alignItems: "flex-start",
                      paddingBottom: 12,
                      opacity: ev.event_type === "page_exit" ? 0.65 : 1,
                    }}>
                      {/* Dot */}
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                        background: eventColor(ev),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 900, color: "#fff",
                        position: "relative", zIndex: 1,
                        boxShadow: `0 0 0 3px var(--t-card)`,
                      }}>
                        {eventIcon(ev)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingTop: 4 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text3)", fontVariantNumeric: "tabular-nums" }}>
                            {fmtTime(ev.ts)}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: ev.event_type === "page_enter" ? 700 : 400, color: "var(--t-text)" }}>
                            {eventLabel(ev)}
                          </span>
                        </div>

                        {/* Metadata extra */}
                        {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                          <div style={{
                            marginTop: 4, fontSize: 11, color: "var(--t-text2)",
                            background: "var(--t-card2)", borderRadius: 6,
                            padding: "3px 8px", display: "inline-block",
                          }}>
                            {JSON.stringify(ev.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function DevUsuariosPage() {
  const [key, setKey]         = useState("");
  const [authed, setAuthed]   = useState(false);
  const [usuarios, setUsuarios] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Modal detalle de día
  const [dayModal, setDayModal] = useState<{ email: string; date: string; display: string } | null>(null);

  // Crear cliente
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function createClient() {
    if (!newEmail.trim()) return;
    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateMsg({ ok: false, text: data?.error ?? `Error ${res.status}` });
      } else {
        setCreateMsg({ ok: true, text: `✓ Cliente ${data.email} creado correctamente.` });
        setNewEmail("");
      }
    } catch (e: any) {
      setCreateMsg({ ok: false, text: e?.message ?? "Error desconocido" });
    } finally {
      setCreating(false);
    }
  }

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
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const s = {
    wrap: {
      minHeight: "100vh",
      background: "var(--t-bg)",
      color: "var(--t-text)",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      padding: "48px 24px",
    } as React.CSSProperties,
    input: {
      padding: "12px 14px",
      borderRadius: 12,
      border: "1px solid var(--t-border)",
      background: "var(--t-input)",
      color: "var(--t-text)",
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
          <p style={{ color: "var(--t-text2)", fontSize: 14, marginBottom: 28 }}>Introduce la clave de acceso</p>
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
          {error && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</div>}
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Modal de detalle de día */}
      {dayModal && (
        <DayDetailModal
          email={dayModal.email}
          date={dayModal.date}
          display={dayModal.display}
          devKey={key}
          onClose={() => setDayModal(null)}
        />
      )}

      <main style={s.wrap}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 1000, margin: 0 }}>👥 Actividad de Usuarios</h1>
              <div style={{ color: "var(--t-text2)", fontSize: 13, marginTop: 4 }}>
                {usuarios.length} cuenta{usuarios.length !== 1 ? "s" : ""} registrada{usuarios.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button
              onClick={() => fetchUsuarios(key)}
              disabled={loading}
              style={{ ...s.btn, background: "var(--t-card2)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 14 }}
            >
              {loading ? "Cargando..." : "🔄 Refrescar"}
            </button>
          </div>

          {/* Crear cliente */}
          <div style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.3)", borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 14 }}>➕ Crear nuevo cliente</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createClient()}
                placeholder="correo@cliente.com"
                style={{ ...s.input, flex: 1, minWidth: 220 }}
              />
              <button onClick={createClient} disabled={creating || !newEmail.trim()} style={{ ...s.btn, opacity: creating || !newEmail.trim() ? 0.5 : 1 }}>
                {creating ? "Creando..." : "Crear cliente"}
              </button>
            </div>
            {createMsg && (
              <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: createMsg.ok ? "#16a34a" : "#ef4444" }}>
                {createMsg.text}
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", color: "#ef4444", marginBottom: 16, fontSize: 14 }}>
              {error}
            </div>
          )}

          {usuarios.length === 0 && !loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--t-text3)" }}>
              No hay actividad registrada todavía.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {usuarios.map((u) => {
                const hoy     = visitasHoy(u.visits);
                const porDia  = visitasPorDia(u.visits);
                const isOpen  = expanded === u.email;

                return (
                  <div
                    key={u.email}
                    style={{
                      background: "var(--t-card)",
                      border: "1px solid var(--t-border)",
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
                      {/* Avatar */}
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 900, fontSize: 16, color: "#fff", flexShrink: 0,
                      }}>
                        {u.email[0].toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--t-text)" }}>{u.email}</div>
                        <div style={{ color: "var(--t-text2)", fontSize: 12, marginTop: 2 }}>
                          Última visita: {new Date(u.lastSeen).toLocaleString("es-ES")}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--t-text)" }}>{u.visits.length}</div>
                          <div style={{ color: "var(--t-text3)", fontSize: 11 }}>total visitas</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: hoy > 0 ? "#16a34a" : "var(--t-text)" }}>{hoy}</div>
                          <div style={{ color: "var(--t-text3)", fontSize: 11 }}>hoy</div>
                        </div>
                        <div style={{ color: "var(--t-text3)", fontSize: 18 }}>{isOpen ? "▲" : "▼"}</div>
                      </div>
                    </div>

                    {/* Detalle expandible — visitas por día */}
                    {isOpen && (
                      <div style={{
                        borderTop: "1px solid var(--t-border)",
                        padding: "16px 20px 20px",
                      }}>
                        <div style={{ color: "var(--t-text2)", fontSize: 12, marginBottom: 12, fontWeight: 700, letterSpacing: "0.08em" }}>
                          VISITAS POR DÍA — haz clic en un día para ver el historial detallado
                        </div>
                        {porDia.length === 0 ? (
                          <div style={{ color: "var(--t-text3)", fontSize: 13 }}>Sin datos</div>
                        ) : (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {[...porDia].reverse().map(({ display, isoDate, count }) => (
                              <button
                                key={isoDate}
                                onClick={() => setDayModal({ email: u.email, date: isoDate, display })}
                                title={`Ver detalle del ${display}`}
                                style={{
                                  background: "rgba(124,58,237,.12)",
                                  border: "1px solid rgba(124,58,237,.35)",
                                  borderRadius: 10,
                                  padding: "8px 14px",
                                  textAlign: "center",
                                  cursor: "pointer",
                                  transition: "background .15s, transform .1s",
                                  minWidth: 56,
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,.25)";
                                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,.12)";
                                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                                }}
                              >
                                <div style={{ fontWeight: 900, fontSize: 18, color: "#7c3aed" }}>{count}</div>
                                <div style={{ color: "var(--t-text2)", fontSize: 11, marginTop: 2 }}>{display}</div>
                                <div style={{ fontSize: 9, color: "#7c3aed", marginTop: 1, opacity: 0.7 }}>ver detalle</div>
                              </button>
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
    </>
  );
}
