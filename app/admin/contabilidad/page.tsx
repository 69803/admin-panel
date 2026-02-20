"use client";

import React, { useEffect, useState } from "react";

type BalanceRow = {
  mes: string | null;
  ingresos: number;
  gastos: number;
  balance: number;
};

export default function ContabilidadPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [tab, setTab] = useState<"home" | "balance">("home");
  const [balance, setBalance] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!baseUrl) {
      setError("Falta NEXT_PUBLIC_API_URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${baseUrl}/contabilidad/balance_mensual`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setBalance(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "balance") {
      fetchBalance();
    }
  }, [tab]);

  const s = {
    wrap: {
      minHeight: "100vh",
      padding: 40,
      background: "#0b1220",
      color: "white",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
    } as React.CSSProperties,
    card: {
      maxWidth: 1100,
      margin: "0 auto",
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: 18,
      padding: 24,
    } as React.CSSProperties,
    button: {
      padding: "10px 16px",
      marginRight: 10,
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,.2)",
      background: "rgba(255,255,255,.08)",
      color: "white",
      cursor: "pointer",
      fontWeight: 700,
    } as React.CSSProperties,
    buttonActive: {
      padding: "10px 16px",
      marginRight: 10,
      borderRadius: 10,
      border: "1px solid #7c3aed",
      background: "#7c3aed",
      color: "white",
      cursor: "pointer",
      fontWeight: 900,
    } as React.CSSProperties,
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 20,
    } as React.CSSProperties,
    th: {
      textAlign: "left",
      padding: 12,
      borderBottom: "1px solid rgba(255,255,255,.2)",
      fontSize: 13,
      opacity: 0.8,
    } as React.CSSProperties,
    td: {
      padding: 12,
      borderBottom: "1px solid rgba(255,255,255,.08)",
    } as React.CSSProperties,
  };

  return (
    <main style={s.wrap}>
      <div style={s.card}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>
          💰 CONTABILIDAD (CONTROLADA)
        </h1>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setTab("home")}
            style={tab === "home" ? s.buttonActive : s.button}
          >
            Home
          </button>

          <button
            onClick={() => setTab("balance")}
            style={tab === "balance" ? s.buttonActive : s.button}
          >
            Balance mensual
          </button>
        </div>

        {tab === "home" && (
          <div style={{ marginTop: 30 }}>
            HOME FUNCIONANDO
          </div>
        )}

        {tab === "balance" && (
          <div style={{ marginTop: 30 }}>
            {error && (
              <div style={{ color: "#f87171", marginBottom: 10 }}>
                ❌ {error}
              </div>
            )}

            {loading && <div>Cargando...</div>}

            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Mes</th>
                  <th style={s.th}>Ingresos</th>
                  <th style={s.th}>Gastos</th>
                  <th style={s.th}>Balance</th>
                </tr>
              </thead>

              <tbody>
                {balance.map((r, i) => (
                  <tr key={i}>
                    <td style={s.td}>{r.mes}</td>
                    <td style={s.td}>{r.ingresos}</td>
                    <td style={s.td}>{r.gastos}</td>
                    <td style={{ ...s.td, fontWeight: 900 }}>
                      {r.balance}
                    </td>
                  </tr>
                ))}

                {balance.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} style={s.td}>
                      No hay datos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}