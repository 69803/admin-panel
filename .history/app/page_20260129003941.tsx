"use client";

import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string; // ahora puede venir del backend
};

function normalizeApiUrl(raw?: string) {
  if (!raw) return null;

  let url = raw.trim();

  // Si viene como //dominio -> convertir a https://dominio
  if (url.startsWith("//")) url = `https:${url}`;

  // Forzar https si viene http
  url = url.replace(/^http:\/\//i, "https://");

  // Quitar slash final
  url = url.replace(/\/+$/, "");

  return url;
}

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // CREATE form
  const [newNombre, setNewNombre] = useState("");
  const [newPrecio, setNewPrecio] = useState("");
  const [newCategoria, setNewCategoria] = useState("otros");

  // EDIT state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");

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

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let items = query
      ? menu.filter((item) => item.nombre.toLowerCase().includes(query))
      : menu;

    items = [...items].sort((a, b) =>
      order === "asc" ? a.precio - b.precio : b.precio - a.precio
    );

    return items;
  }, [menu, q, order]);

  useEffect(() => {
    setPage(1);
  }, [q, order]);

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

    if (!nombre) return setError("El nombre no puede estar vacío.");
    if (!Number.isFinite(precioNum) || precioNum < 0)
      return setError("El precio debe ser un número válido (>= 0).");

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          precio: precioNum,
          categoria: newCategoria, // ✅ enviamos categoria
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`POST /menu falló (HTTP ${res.status}) ${txt}`);
      }

      setNewNombre("");
      setNewPrecio("");
      setNewCategoria("otros");
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
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNombre("");
    setEditPrecio("");
  }

  async function saveEdit(id: number) {
    if (!baseUrl) return;

    const nombre = editNombre.trim();
    const precioNum = Number(editPrecio);

    if (!nombre) return setError("El nombre no puede estar vacío.");
    if (!Number.isFinite(precioNum) || precioNum < 0)
      return setError("El precio debe ser un número válido (>= 0).");

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio: precioNum }),
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
      const res = await fetch(`${baseUrl}/menu/${id}`, {
        method: "DELETE",
      });

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

          {/* ✅ SELECT de categoría */}
          <select
            value={newCategoria}
            onChange={(e) => setNewCategoria(e.target.value)}
            style={{
              padding: 10,
              width: "100%",
              maxWidth: 220,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <option value="hamburguesas">Hamburguesas</option>
            <option value="hotdog">Hot dog / Pepito</option>
            <option value="cachapas">Cachapas</option>
            <option value="especialidades">Especialidades</option>
            <option value="postres">Postres</option>
            <option value="bebidas">Bebidas</option>
            <option value="otros">Otros</option>
          </select>

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
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar plato..."
          style={{
            padding: 10,
            width: "100%",
            maxWidth: 350,
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
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {pagedItems.map((item) => {
                const isEditing = editingId === item.id;

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
