"use client";

import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string; // viene del backend
};

function normalizeApiUrl(raw?: string) {
  if (!raw) return null;

  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  url = url.replace(/^http:\/\//i, "https://");
  url = url.replace(/\/+$/, "");
  return url;
}

// ✅ Normaliza categoría para que coincida con Flutter: MAYÚSCULA + trim
function normalizeCategoriaFree(raw?: string) {
  const c = (raw ?? "").trim().toUpperCase();
  return c.length ? c : "OTROS";
}

// ✅ Sugerencias base (no obligatorias)
const CATEGORY_SUGGESTIONS_BASE = [
  "AREPAS",
  "EMPANADAS",
  "HAMBURGUESAS",
  "HOT DOG / PEPITO",
  "CACHAPAS",
  "ESPECIALIDADES",
  "POSTRES",
  "BEBIDAS",
  "REFRESCOS",
  "OTROS",
] as const;

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ✅ filtro por categoría (para que salgan categorías nuevas)
  const [catFilter, setCatFilter] = useState<string>("ALL");

  // CREATE form
  const [newNombre, setNewNombre] = useState("");
  const [newPrecio, setNewPrecio] = useState("");
  const [newCategoria, setNewCategoria] = useState("OTROS");

  // EDIT state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [editCategoria, setEditCategoria] = useState("OTROS");

  const baseUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  const fetchMenu = () => {
    if (!baseUrl) {
      setError("Falta NEXT_PUBLIC_API_URL en .env.local");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${baseUrl}/menu`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MenuItem[]) => setMenu(data))
      .catch((err: any) => setError(err?.message ?? "Error desconocido"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ categorías reales detectadas desde DB
  const categoriesFromDb = useMemo(() => {
    const set = new Set<string>();
    for (const it of menu) {
      set.add(normalizeCategoriaFree(it.categoria));
    }
    const arr = Array.from(set);
    arr.sort((a, b) => a.localeCompare(b));
    return arr;
  }, [menu]);

  // ✅ sugerencias del input = base + las que existan en DB
  const categorySuggestions = useMemo(() => {
    const set = new Set<string>(
      CATEGORY_SUGGESTIONS_BASE as unknown as string[]
    );
    for (const c of categoriesFromDb) set.add(c);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categoriesFromDb]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let items = menu;

    // ✅ filtro por categoría
    if (catFilter !== "ALL") {
      items = items.filter(
        (it) => normalizeCategoriaFree(it.categoria) === catFilter
      );
    }

    // ✅ filtro por nombre
    if (query) {
      items = items.filter((item) => item.nombre.toLowerCase().includes(query));
    }

    // ✅ ordenar por precio
    items = [...items].sort((a, b) =>
      order === "asc" ? a.precio - b.precio : b.precio - a.precio
    );

    return items;
  }, [menu, q, order, catFilter]);

  // ✅ si cambia buscar/categoría/orden, volver a página 1
  useEffect(() => {
    setPage(1);
  }, [q, catFilter, order]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  // ---------- CRUD CALLS ----------
  async function createItem() {
    if (!baseUrl) return;

    const nombre = newNombre.trim();
    const precioNum = Number(newPrecio);
    const categoria = normalizeCategoriaFree(newCategoria);

    if (!nombre) return setError("El nombre no puede estar vacío.");
    if (!Number.isFinite(precioNum) || precioNum < 0)
      return setError("El precio debe ser un número válido (>= 0).");

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio: precioNum, categoria }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`POST /menu falló (HTTP ${res.status}) ${txt}`);
      }

      setNewNombre("");
      setNewPrecio("");
      setNewCategoria("OTROS");
      fetchMenu();
    } catch (e: any) {
      setError(e?.message ?? "Error creando plato");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditNombre(item.nombre);
    setEditPrecio(String(item.precio));
    setEditCategoria(normalizeCategoriaFree(item.categoria));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNombre("");
    setEditPrecio("");
    setEditCategoria("OTROS");
  }

  async function saveEdit(id: number) {
    if (!baseUrl) return;

    const nombre = editNombre.trim();
    const precioNum = Number(editPrecio);
    const categoria = normalizeCategoriaFree(editCategoria);

    if (!nombre) return setError("El nombre no puede estar vacío.");
    if (!Number.isFinite(precioNum) || precioNum < 0)
      return setError("El precio debe ser un número válido (>= 0).");

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio: precioNum, categoria }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`PUT /menu/${id} falló (HTTP ${res.status}) ${txt}`);
      }

      cancelEdit();
      fetchMenu();
    } catch (e: any) {
      setError(e?.message ?? "Error editando plato");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(id: number) {
    if (!baseUrl) return;

    const ok = confirm(`¿Borrar el plato ID ${id}?`);
    if (!ok) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/menu/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`DELETE /menu/${id} falló (HTTP ${res.status}) ${txt}`);
      }

      if (editingId === id) cancelEdit();
      fetchMenu();
    } catch (e: any) {
      setError(e?.message ?? "Error borrando plato");
    } finally {
      setBusy(false);
    }
  }

  // ✅ "Eliminar categoría" (seguro): mueve todo a OTROS
  async function deleteCategory() {
    if (!baseUrl) return;
    if (catFilter === "ALL") return;

    const categoryToRemove = catFilter;

    const ok = confirm(
      `¿Eliminar la categoría "${categoryToRemove}"?\n\nEsto NO borra platos.\nSolo cambia la categoría de todos a "OTROS".`
    );
    if (!ok) return;

    setBusy(true);
    setError(null);

    try {
      const itemsInCategory = menu.filter(
        (it) => normalizeCategoriaFree(it.categoria) === categoryToRemove
      );

      if (itemsInCategory.length === 0) {
        setCatFilter("ALL");
        fetchMenu();
        return;
      }

      for (const it of itemsInCategory) {
        const res = await fetch(`${baseUrl}/menu/${it.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: it.nombre,
            precio: it.precio,
            categoria: "OTROS",
          }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            `Falló al mover ID ${it.id} a OTROS (HTTP ${res.status}) ${txt}`
          );
        }
      }

      setCatFilter("ALL");
      fetchMenu();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando categoría");
    } finally {
      setBusy(false);
    }
  }

  // ---------- UI STYLES (solo presentación) ----------
  const s = {
    input: {
      padding: 10,
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      outline: "none",
      background: "white",
      fontSize: 14,
    } as React.CSSProperties,
    select: {
      padding: 10,
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      outline: "none",
      background: "white",
      fontSize: 14,
    } as React.CSSProperties,
    btn: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "white",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
    } as React.CSSProperties,
    btnPrimary: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid #7c3aed",
      background: "#7c3aed",
      color: "white",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 14,
    } as React.CSSProperties,
    btnDanger: {
      padding: "8px 12px",
      borderRadius: 12,
      border: "1px solid #fecaca",
      background: "#fff1f2",
      color: "#be123c",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 13,
    } as React.CSSProperties,
    btnMuted: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#f3f4f6",
      cursor: "not-allowed",
      fontWeight: 600,
      fontSize: 14,
      color: "#6b7280",
    } as React.CSSProperties,
    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      background: "#f3f4f6",
      border: "1px solid #e5e7eb",
      fontSize: 12,
      fontWeight: 700,
      color: "#111827",
    } as React.CSSProperties,
    priceBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      background: "#ecfdf5",
      border: "1px solid #bbf7d0",
      fontSize: 12,
      fontWeight: 800,
      color: "#065f46",
    } as React.CSSProperties,
  };

  return (
    <main
      style={{
        background: "#f4f6f8",
        minHeight: "100vh",
        padding: 32,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: "white",
          borderRadius: 20,
          padding: 26,
          boxShadow: "0 18px 40px rgba(0,0,0,.08)",
          border: "1px solid #eef2f7",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, margin: 0 }}>🍽️ Panel de Menú</h1>
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              API:{" "}
              <span style={{ fontWeight: 700, color: "#111827" }}>
                {baseUrl ?? "(no definido)"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={s.badge}>Items DB: {menu.length}</span>
            {busy ? (
              <span style={s.badge}>Procesando…</span>
            ) : (
              <span style={{ ...s.badge, background: "#eef2ff", borderColor: "#c7d2fe", color: "#3730a3" }}>
                Listo
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: "#fff1f2",
              border: "1px solid #fecaca",
              color: "#9f1239",
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* CREATE card */}
        <div
          style={{
            border: "1px solid #eef2f7",
            borderRadius: 18,
            padding: 16,
            background: "#fbfcfe",
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 10, color: "#111827" }}>
            Crear nuevo plato
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Nombre (ej: Pizza Margarita)"
              style={{ ...s.input, width: "100%", maxWidth: 360 }}
            />

            <input
              value={newPrecio}
              onChange={(e) => setNewPrecio(e.target.value)}
              placeholder="Precio (ej: 10.5)"
              inputMode="decimal"
              style={{ ...s.input, width: "100%", maxWidth: 160 }}
            />

            <input
              value={newCategoria}
              onChange={(e) => setNewCategoria(e.target.value)}
              placeholder="Categoría (ej: SOPAS)"
              list="cat-suggestions"
              style={{ ...s.input, width: "100%", maxWidth: 220 }}
            />

            <button
              onClick={createItem}
              disabled={busy}
              style={busy ? s.btnMuted : s.btnPrimary}
            >
              ➕ Crear
            </button>
          </div>
        </div>

        {/* datalist sugerencias */}
        <datalist id="cat-suggestions">
          {categorySuggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{ ...s.select, minWidth: 200 }}
          >
            <option value="ALL">Todas las categorías</option>
            {categoriesFromDb.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={deleteCategory}
            disabled={busy || catFilter === "ALL"}
            style={busy || catFilter === "ALL" ? s.btnMuted : s.btn}
          >
            🗂️ Eliminar categoría
          </button>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar plato…"
            style={{ ...s.input, width: "100%", maxWidth: 260 }}
          />

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
            style={{ ...s.select, minWidth: 210 }}
          >
            <option value="asc">Precio: menor a mayor</option>
            <option value="desc">Precio: mayor a menor</option>
          </select>

          <button
            onClick={fetchMenu}
            disabled={loading || busy}
            style={loading || busy ? s.btnMuted : s.btn}
          >
            {loading ? "Cargando…" : "Refrescar"}
          </button>
        </div>

        {/* Table */}
        <div
          style={{
            border: "1px solid #eef2f7",
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: 12, fontSize: 13, color: "#475569" }}>ID</th>
                <th style={{ textAlign: "left", padding: 12, fontSize: 13, color: "#475569" }}>Nombre</th>
                <th style={{ textAlign: "left", padding: 12, fontSize: 13, color: "#475569" }}>Precio</th>
                <th style={{ textAlign: "left", padding: 12, fontSize: 13, color: "#475569" }}>Categoría</th>
                <th style={{ textAlign: "left", padding: 12, fontSize: 13, color: "#475569" }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pagedItems.map((item) => {
                const isEditing = editingId === item.id;
                const shownCategoria = normalizeCategoriaFree(item.categoria);

                return (
                  <tr key={item.id} style={{ borderTop: "1px solid #eef2f7" }}>
                    <td style={{ padding: 12, fontWeight: 800, color: "#111827" }}>
                      {item.id}
                    </td>

                    <td style={{ padding: 12 }}>
                      {isEditing ? (
                        <input
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          style={{ ...s.input, width: "100%", maxWidth: 420 }}
                        />
                      ) : (
                        <span style={{ fontWeight: 700, color: "#111827" }}>
                          {item.nombre}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: 12 }}>
                      {isEditing ? (
                        <input
                          value={editPrecio}
                          onChange={(e) => setEditPrecio(e.target.value)}
                          inputMode="decimal"
                          style={{ ...s.input, width: 140 }}
                        />
                      ) : (
                        <span style={s.priceBadge}>${item.precio}</span>
                      )}
                    </td>

                    <td style={{ padding: 12 }}>
                      {isEditing ? (
                        <input
                          value={editCategoria}
                          onChange={(e) => setEditCategoria(e.target.value)}
                          placeholder="Categoría (ej: SOPAS)"
                          list="cat-suggestions"
                          style={{ ...s.input, width: 240 }}
                        />
                      ) : (
                        <span style={s.badge}>{shownCategoria}</span>
                      )}
                    </td>

                    <td style={{ padding: 12 }}>
                      {!isEditing ? (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            onClick={() => startEdit(item)}
                            disabled={busy}
                            style={busy ? s.btnMuted : s.btn}
                          >
                            ✏️ Editar
                          </button>

                          <button
                            onClick={() => deleteItem(item.id)}
                            disabled={busy}
                            style={busy ? s.btnMuted : s.btnDanger}
                          >
                            ✖ Borrar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={busy}
                            style={busy ? s.btnMuted : s.btnPrimary}
                          >
                            💾 Guardar
                          </button>

                          <button
                            onClick={cancelEdit}
                            disabled={busy}
                            style={busy ? s.btnMuted : s.btn}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {pagedItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 18, color: "#6b7280" }}>
                    No hay resultados con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 14,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            Mostrando <b>{pagedItems.length}</b> de <b>{filtered.length}</b> (total DB:{" "}
            <b>{menu.length}</b>)
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
              style={!canPrev ? s.btnMuted : s.btn}
            >
              ←
            </button>

            <span style={{ fontSize: 14, color: "#374151" }}>
              Página <b>{page}</b> / <b>{totalPages}</b>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canNext}
              style={!canNext ? s.btnMuted : s.btn}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
