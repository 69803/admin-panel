"use client";

import { useEffect, useState } from "react";

type MenuItem = {
  id: number;
  nombre: string;
  precio: number;
};

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      .then((data) => setMenu(data))
      .catch((err) => setError(err.message ?? "Error desconocido"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Menú</h1>

      <p style={{ marginBottom: 16 }}>
        API: <b>{process.env.NEXT_PUBLIC_API_URL}</b>
      </p>

      {loading && <p>Cargando menú...</p>}

      {error && (
        <p style={{ color: "crimson" }}>
          Error: <b>{error}</b>
        </p>
      )}

      {!loading && !error && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            maxWidth: 700,
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Nombre</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Precio</th>
            </tr>
          </thead>
          <tbody>
            {menu.map((item) => (
              <tr key={item.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{item.id}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{item.nombre}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>${item.precio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
