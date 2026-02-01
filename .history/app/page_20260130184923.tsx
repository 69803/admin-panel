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

  useEffect(() => {
    setPage(1);
  }, [q, order, catFilter]);

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

  // ✅ NUEVO: "Eliminar categoría" (seguro)
  // Acción: todos los platos de esa categoría pasan a OTROS (NO se borran platos)
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
      // Tomamos los items de esa categoría (según DB actual)
      const itemsInCategory = menu.filter(
        (it) => normalizeCategoriaFree(it.categoria) === categoryToRemove
      );

      if (itemsInCategory.length === 0) {
        setCatFilter("ALL");
        fetchMenu();
        return;
      }

      // Actualizamos uno por uno a OTROS (sin tocar nombre/precio)
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

      // Reset filtro y refrescar
      setCatFilter("ALL");
      fetchMenu();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando categoría");
    } finally {
      setBusy(false);
    }
  }

  // ---------- UI ----------
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Menú (CRUD)</h1>

      <p style={{ marginBottom: 16 }}>
        API: <b>{baseUrl ?? "(no definido)"}</b>
      </p>

      {/* CREATE */}
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          maxWidth: 700,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 10, fontSize: 18 }}>
          Crear nuevo plato
        </h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            placeholder="Nombre (ej: Pizza Margarita)"
            style={{
              padding: 10,
              width: "100%",
              maxWidth: 380,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />

          <input
            value={newPrecio}
            onChange={(e) => setNewPrecio(e.target.value)}
            placeholder="Precio (ej: 10.5)"
            inputMode="decimal"
            style={{
              padding: 10,
              width: "100%",
              maxWidth: 160,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />

          {/* ✅ categoría libre con sugerencias */}
          <div style={{ width: "100%", maxWidth: 220 }}>
            <input
              value={newCategoria}
              onChange={(e) => setNewCategoria(e.target.value)}
              placeholder="Categoría (ej: SOPAS)"
              list="cat-suggestions"
              style={{
                padding: 10,
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            />
          </div>

          <button
            onClick={createItem}
            disabled={busy}
            style={{
              padding: "10px 14px",
              border: "1px solid #ddd",
              borderRadius: 8,
              background: busy ? "#f3f3f3" : "white",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "..." : "Crear"}
          </button>
        </div>
      </div>

      {/* datalist sugerencias */}
      <datalist id="cat-suggestions">
        {categorySuggestions.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {/* Controles lista */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
          maxWidth: 700,
        }}
      >
        {/* ✅ filtro por categoría */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <option value="ALL">Categoría: TODAS</option>
          {categoriesFromDb.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          onClick={deleteCategory}
          disabled={busy || catFilter === "ALL"}
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 8,
            background: busy || catFilter === "ALL" ? "#f3f3f3" : "white",
            cursor: busy || catFilter === "ALL" ? "not-allowed" : "pointer",
          }}
        >
          Eliminar categoría
        </button>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar plato..."
          style={{
            padding: 10,
            width: "100%",
            maxWidth: 280,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />

        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
          style={{
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <option value="asc">Precio: menor a mayor</option>
          <option value="desc">Precio: mayor a menor</option>
        </select>

        <button
          onClick={fetchMenu}
          disabled={loading || busy}
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 8,
            background: loading || busy ? "#f3f3f3" : "white",
            cursor: loading || busy ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Cargando..." : "Refrescar"}
        </button>
      </div>

      {error && (
        <p style={{ color: "crimson", maxWidth: 700 }}>
          Error: <b>{error}</b>
        </p>
      )}

      {loading && <p>Cargando menú...</p>}

      {!loading && !error && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              maxWidth: 700,
              marginBottom: 10,
            }}
          >
            <p style={{ margin: 0 }}>
              Mostrando <b>{pagedItems.length}</b> de <b>{filtered.length}</b>{" "}
              (total DB: <b>{menu.length}</b>)
            </p>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: !canPrev ? "#f3f3f3" : "white",
                  cursor: !canPrev ? "not-allowed" : "pointer",
                }}
              >
                ←
              </button>

              <span>
                Página <b>{page}</b> / <b>{totalPages}</b>
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!canNext}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: !canNext ? "#f3f3f3" : "white",
                  cursor: !canNext ? "not-allowed" : "pointer",
                }}
              >
                →
              </button>
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              maxWidth: 700,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                    padding: 8,
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                    padding: 8,
                  }}
                >
                  Nombre
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                    padding: 8,
                  }}
                >
                  Precio
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                    padding: 8,
                  }}
                >
                  Categoría
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ddd",
                    padding: 8,
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {pagedItems.map((item) => {
                const isEditing = editingId === item.id;
                const shownCategoria = normalizeCategoriaFree(item.categoria);

                return (
                  <tr key={item.id}>
                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                      {item.id}
                    </td>

                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                      {isEditing ? (
                        <input
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          style={{
                            padding: 8,
                            width: "100%",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        item.nombre
                      )}
                    </td>

                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                      {isEditing ? (
                        <input
                          value={editPrecio}
                          onChange={(e) => setEditPrecio(e.target.value)}
                          inputMode="decimal"
                          style={{
                            padding: 8,
                            width: 120,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        `$${item.precio}`
                      )}
                    </td>

                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                      {isEditing ? (
                        <input
                          value={editCategoria}
                          onChange={(e) => setEditCategoria(e.target.value)}
                          placeholder="Categoría (ej: SOPAS)"
                          list="cat-suggestions"
                          style={{
                            padding: 8,
                            width: 220,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        shownCategoria
                      )}
                    </td>

                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                      {!isEditing ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => startEdit(item)}
                            disabled={busy}
                            style={{
                              padding: "6px 10px",
                              border: "1px solid #ddd",
                              borderRadius: 8,
                              background: "white",
                              cursor: busy ? "not-allowed" : "pointer",
                            }}
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => deleteItem(item.id)}
                            disabled={busy}
                            style={{
                              padding: "6px 10px",
                              border: "1px solid #ddd",
                              borderRadius: 8,
                              background: "white",
                              cursor: busy ? "not-allowed" : "pointer",
                            }}
                          >
                            Borrar
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={busy}
                            style={{
                              padding: "6px 10px",
                              border: "1px solid #ddd",
                              borderRadius: 8,
                              background: "white",
                              cursor: busy ? "not-allowed" : "pointer",
                            }}
                          >
                            Guardar
                          </button>

                          <button
                            onClick={cancelEdit}
                            disabled={busy}
                            style={{
                              padding: "6px 10px",
                              border: "1px solid #ddd",
                              borderRadius: 8,
                              background: "white",
                              cursor: busy ? "not-allowed" : "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
