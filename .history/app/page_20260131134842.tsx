"use client";

import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string;
};

function normalizeApiUrl(raw?: string) {
  if (!raw) return null;
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  url = url.replace(/^http:\/\//i, "https://").replace(/\/+$/, "");
  return url;
}

function normalizeCategoriaFree(raw?: string) {
  const c = (raw ?? "").trim().toUpperCase();
  return c.length ? c : "OTROS";
}

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

  const [catFilter, setCatFilter] = useState("ALL");

  const [newNombre, setNewNombre] = useState("");
  const [newPrecio, setNewPrecio] = useState("");
  const [newCategoria, setNewCategoria] = useState("OTROS");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [editCategoria, setEditCategoria] = useState("OTROS");

  const baseUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  const fetchMenu = () => {
    if (!baseUrl) return;
    setLoading(true);
    fetch(`${baseUrl}/menu`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setMenu)
      .finally(() => setLoading(false));
  };

  useEffect(fetchMenu, []);

  const categoriesFromDb = useMemo(() => {
    const set = new Set<string>();
    menu.forEach((m) => set.add(normalizeCategoriaFree(m.categoria)));
    return Array.from(set).sort();
  }, [menu]);

  const categorySuggestions = useMemo(() => {
    const set = new Set<string>(CATEGORY_SUGGESTIONS_BASE as unknown as string[]);
    categoriesFromDb.forEach((c) => set.add(c));
    return Array.from(set).sort();
  }, [categoriesFromDb]);

  const filtered = useMemo(() => {
    let items = menu;
    if (catFilter !== "ALL") {
      items = items.filter(
        (i) => normalizeCategoriaFree(i.categoria) === catFilter
      );
    }
    if (q.trim()) {
      items = items.filter((i) =>
        i.nombre.toLowerCase().includes(q.toLowerCase())
      );
    }
    return [...items].sort((a, b) =>
      order === "asc" ? a.precio - b.precio : b.precio - a.precio
    );
  }, [menu, q, order, catFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedItems = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  async function createItem() {
    if (!baseUrl) return;
    setBusy(true);
    await fetch(`${baseUrl}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: newNombre.trim(),
        precio: Number(newPrecio),
        categoria: normalizeCategoriaFree(newCategoria),
      }),
    });
    setNewNombre("");
    setNewPrecio("");
    setNewCategoria("OTROS");
    fetchMenu();
    setBusy(false);
  }

  async function deleteItem(id: number) {
    if (!confirm("¿Eliminar este plato?")) return;
    setBusy(true);
    await fetch(`${baseUrl}/menu/${id}`, { method: "DELETE" });
    fetchMenu();
    setBusy(false);
  }

  async function saveEdit(id: number) {
    setBusy(true);
    await fetch(`${baseUrl}/menu/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: editNombre,
        precio: Number(editPrecio),
        categoria: normalizeCategoriaFree(editCategoria),
      }),
    });
    setEditingId(null);
    fetchMenu();
    setBusy(false);
  }

  async function deleteCategory() {
    if (catFilter === "ALL") return;
    if (!confirm(`Eliminar categoría ${catFilter}?`)) return;
    setBusy(true);
    for (const it of menu.filter(
      (m) => normalizeCategoriaFree(m.categoria) === catFilter
    )) {
      await fetch(`${baseUrl}/menu/${it.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: it.nombre,
          precio: it.precio,
          categoria: "OTROS",
        }),
      });
    }
    setCatFilter("ALL");
    fetchMenu();
    setBusy(false);
  }

  return (
    <main
      style={{
        background: "#f4f6f8",
        minHeight: "100vh",
        padding: 32,
        fontFamily: "system-ui, -apple-system",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          background: "white",
          borderRadius: 18,
          padding: 28,
          boxShadow: "0 20px 40px rgba(0,0,0,.08)",
        }}
      >
        <h1 style={{ fontSize: 26, marginBottom: 16 }}>🍽️ Panel de Menú</h1>

        {/* CREAR */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <input placeholder="Nombre" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} />
          <input placeholder="Precio" value={newPrecio} onChange={(e) => setNewPrecio(e.target.value)} />
          <input list="cats" placeholder="Categoría" value={newCategoria} onChange={(e) => setNewCategoria(e.target.value)} />
          <button onClick={createItem} disabled={busy}>➕ Crear</button>
        </div>

        <datalist id="cats">
          {categorySuggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {/* CONTROLES */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="ALL">Todas</option>
            {categoriesFromDb.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button onClick={deleteCategory}>🗑️ Categoría</button>
          <input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {/* TABLA */}
        <table width="100%">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Categoría</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((it) => (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.nombre}</td>
                <td><b>${it.precio}</b></td>
                <td>{normalizeCategoriaFree(it.categoria)}</td>
                <td>
                  <button onClick={() => deleteItem(it.id)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </div>
    </main>
  );
}
