"use client";

import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: number;
  nombre: string;
  precio: number;
};

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchMenu = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!baseUrl) {
      setError("Falta NEXT_PUBLIC_API_URL en .env.local");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${baseUrl}/menu`)
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, order]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Menú</h1>

      <p style={{ marginBottom: 16 }}>
        API: <b>{process.env.NEXT_PUBLIC_API_URL}</b>
      </p>

      {/* Controles */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
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
          disabled={loading}
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 8,
            background: loading ? "#f3f3f3" : "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Cargando..." : "Refrescar"}
        </button>
      </div>

      {error && (
        <p style={{ color: "crimson" }}>
          Error: <b>{error}</b>
        </p>
      )}

      {!loading && !error && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 700 }}>
            <p style={{ marginBottom: 10 }}>
              Mostrando <b>{pagedItems.length}</b> de <b>{filtered.length}</b> (total DB:{" "}
              <b>{menu.length}</b>)
            </p>

            {/* Paginación */}
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
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  ID
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Nombre
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Precio
                </th>
              </tr>
            </thead>

            <tbody>
              {pagedItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{item.id}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{item.nombre}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>${item.precio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
