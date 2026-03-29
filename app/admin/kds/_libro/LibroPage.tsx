"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Entrada = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  monto: number;
  fecha: string;
  notas: string;
  creadoEn: string;
};

type Props = {
  tipo:   "activos" | "pasivos" | "capital";
  label:  string;
  icon:   string;
  accent: string;
  bg:     string;
  border: string;
};

const STORAGE_KEY = (tipo: string) => `libro_${tipo}`;

const CATEGORIAS: Record<string, string[]> = {
  activos: ["Efectivo / Caja", "Banco", "Cuentas por cobrar", "Inventario", "Equipos", "Inmuebles", "Vehículos", "Otros activos"],
  pasivos: ["Préstamo bancario", "Cuentas por pagar", "Deuda con proveedores", "Impuestos por pagar", "Nómina pendiente", "Otros pasivos"],
  capital: ["Aporte de socio", "Utilidad retenida", "Reservas", "Capital inicial", "Reinversión", "Otros"],
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmtMoney(v: number) {
  return `€ ${v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = { titulo: "", descripcion: "", categoria: "", monto: "", fecha: today(), notas: "" };

export default function LibroPage({ tipo, label, icon, accent, bg, border }: Props) {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [error, setError]       = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch]     = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(tipo));
      if (raw) setEntradas(JSON.parse(raw));
    } catch {}
  }, [tipo]);

  function save(list: Entrada[]) {
    setEntradas(list);
    localStorage.setItem(STORAGE_KEY(tipo), JSON.stringify(list));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim())    { setError("El título es obligatorio."); return; }
    if (!form.categoria)        { setError("Selecciona una categoría."); return; }
    if (!form.fecha)            { setError("La fecha es obligatoria."); return; }
    const monto = parseFloat(form.monto);
    if (isNaN(monto) || monto < 0) { setError("El monto debe ser un número positivo."); return; }
    setError("");
    const nueva: Entrada = {
      id:         uid(),
      titulo:     form.titulo.trim(),
      descripcion:form.descripcion.trim(),
      categoria:  form.categoria,
      monto,
      fecha:      form.fecha,
      notas:      form.notas.trim(),
      creadoEn:   new Date().toISOString(),
    };
    save([nueva, ...entradas]);
    setForm({ ...EMPTY_FORM });
  }

  function handleDelete(id: string) {
    save(entradas.filter((e) => e.id !== id));
    setDeleteId(null);
  }

  const categorias = CATEGORIAS[tipo] ?? [];
  const filtered   = entradas.filter((e) =>
    !search || e.titulo.toLowerCase().includes(search.toLowerCase()) ||
    e.categoria.toLowerCase().includes(search.toLowerCase()) ||
    e.descripcion.toLowerCase().includes(search.toLowerCase())
  );
  const total = entradas.reduce((a, e) => a + e.monto, 0);

  // Styles
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
          display: "grid", placeItems: "center",
          width: 36, height: 36, borderRadius: 10,
          background: "var(--t-card)", border: "1px solid var(--t-border)",
          color: "var(--t-text2)", fontSize: 18, textDecoration: "none",
        }}>←</Link>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: bg, border: `1.5px solid ${border}`,
          display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0,
        }}>{icon}</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: accent }}>{label}</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--t-text2)" }}>Libro diario de {label.toLowerCase()}</p>
        </div>
        {/* Total */}
        <div style={{
          marginLeft: "auto",
          background: "var(--t-card)", border: `1px solid ${border}`,
          borderRadius: 14, padding: "10px 20px", textAlign: "right",
          boxShadow: `0 4px 16px ${border}`,
        }}>
          <div style={{ fontSize: 11, color: "var(--t-text3)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Total {label}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{fmtMoney(total)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 22, alignItems: "start" }}>

        {/* ── FORMULARIO ── */}
        <div style={{
          background: "var(--t-card)", border: "1px solid var(--t-border)",
          borderRadius: 20, padding: "24px 22px", boxShadow: "var(--t-shadow)",
        }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "var(--t-text)" }}>
            ➕ Nuevo registro
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Título */}
            <div>
              <label style={labelStyle}>Título *</label>
              <input
                style={inputStyle}
                placeholder={`Ej: ${tipo === "activos" ? "Caja principal" : tipo === "pasivos" ? "Préstamo banco" : "Aporte inicial"}`}
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>

            {/* Descripción */}
            <div>
              <label style={labelStyle}>Descripción</label>
              <input
                style={inputStyle}
                placeholder="Descripción breve"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            {/* Categoría */}
            <div>
              <label style={labelStyle}>Categoría *</label>
              <select
                style={inputStyle}
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                <option value="">— Selecciona —</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Monto + Fecha */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Monto (€)</label>
                <input
                  style={inputStyle}
                  type="number" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Fecha *</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label style={labelStyle}>Notas adicionales</label>
              <textarea
                style={{ ...inputStyle, height: 72, resize: "vertical" }}
                placeholder="Cualquier detalle extra…"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, padding: "8px 12px", background: "rgba(220,38,38,0.08)", borderRadius: 8 }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" style={{
              padding: "12px 0", borderRadius: 12, border: "none",
              background: accent, color: "#fff",
              fontWeight: 900, fontSize: 15, cursor: "pointer",
              letterSpacing: "0.02em",
            }}>
              Guardar registro
            </button>
          </form>
        </div>

        {/* ── LISTA ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--t-text3)" }}>🔍</span>
            <input
              style={{ ...inputStyle, paddingLeft: 36 }}
              placeholder="Buscar registros…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Entries */}
          {filtered.length === 0 ? (
            <div style={{
              background: "var(--t-card)", border: "1px solid var(--t-border)",
              borderRadius: 16, padding: "40px 24px",
              textAlign: "center", color: "var(--t-text3)", fontSize: 14,
            }}>
              {entradas.length === 0 ? `Aún no hay registros de ${label.toLowerCase()}. ¡Agrega el primero!` : "Sin resultados para tu búsqueda."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((e) => (
                <div key={e.id} style={{
                  background: "var(--t-card)", border: "1px solid var(--t-border)",
                  borderRadius: 16, padding: "18px 20px",
                  boxShadow: "var(--t-shadow)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--t-text)" }}>{e.titulo}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 999,
                          background: bg, border: `1px solid ${border}`, color: accent,
                        }}>{e.categoria}</span>
                      </div>
                      {e.descripcion && (
                        <div style={{ fontSize: 13, color: "var(--t-text2)", marginTop: 4 }}>{e.descripcion}</div>
                      )}
                      <div style={{ fontSize: 12, color: "var(--t-text3)", marginTop: 6, display: "flex", gap: 14 }}>
                        <span>📅 {e.fecha}</span>
                        {e.notas && <span>📝 {e.notas}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: accent }}>{fmtMoney(e.monto)}</div>
                      {deleteId === e.id ? (
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <button onClick={() => handleDelete(e.id)} style={{
                            fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 7,
                            background: "#dc2626", border: "none", color: "#fff", cursor: "pointer",
                          }}>Confirmar</button>
                          <button onClick={() => setDeleteId(null)} style={{
                            fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 7,
                            background: "var(--t-card2)", border: "1px solid var(--t-border)", color: "var(--t-text2)", cursor: "pointer",
                          }}>Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(e.id)} style={{
                          marginTop: 8, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 7,
                          background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text3)", cursor: "pointer",
                        }}>🗑 Eliminar</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Count */}
          {entradas.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--t-text3)", textAlign: "right" }}>
              {filtered.length} de {entradas.length} registros · Total: {fmtMoney(total)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
