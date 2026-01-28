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

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!baseUrl) {
      setError("Falta NEXT_PUBLIC_API_URL en .env.local");
      setLoading(false);
      return;
    }

    fetch(`${baseUrl}/menu`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MenuItem[]) => setMenu(data))
      .catch((err: any) => setError(err?.message ?? "Error desconocido"))
      .finally(() => setLoading(false));
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

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Menú</h1>

      <p style={{ marginBottom: 16 }}>
        API: <b>{process.env.NEXT_PUBLIC_API_URL}</b>
      </p>

      {/* Controles */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
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
      </div>

      {loading && <p>Cargando menú...</p>}

      {error && (
        <p style={{ color: "crimson" }}>
          Error: <b>{error}</b>
        </p>
      )}

      {!loading && !error && (
        <>
          <p style={{ marginBottom: 10 }}>
            Mostrando <b>{filtered.length}</b> de <b>{menu.length}</b>
          </p>

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
              {filtered.map((item) => (
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
