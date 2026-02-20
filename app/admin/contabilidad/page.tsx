"use client";

import React, { useEffect, useState } from "react";

type BalanceRow = {
  mes: string | null;
  ingresos: number;
  gastos: number;
  balance: number;
};

type Gasto = {
  id: number;
  fecha: string | null;
  concepto: string;
  monto: number;
  categoria: string;
};

export default function ContabilidadPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [tab, setTab] = useState<"home" | "balance" | "gastos">("home");

  // BALANCE
  const [balance, setBalance] = useState<BalanceRow[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // GASTOS
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loadingGastos, setLoadingGastos] = useState(false);

  const [newConcepto, setNewConcepto] = useState("");
  const [newMonto, setNewMonto] = useState("");

  // ---------------- BALANCE ----------------
  const fetchBalance = async () => {
    if (!baseUrl) return;
    setLoadingBalance(true);

    try {
      const res = await fetch(
        `${baseUrl}/contabilidad/balance_mensual`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setBalance(Array.isArray(data) ? data : []);
    } finally {
      setLoadingBalance(false);
    }
  };

  // ---------------- GASTOS ----------------
  const fetchGastos = async () => {
    if (!baseUrl) return;
    setLoadingGastos(true);

    try {
      const res = await fetch(`${baseUrl}/gastos?limit=50`, {
        cache: "no-store",
      });
      const data = await res.json();
      setGastos(Array.isArray(data) ? data : []);
    } finally {
      setLoadingGastos(false);
    }
  };

  const createGasto = async () => {
    if (!baseUrl) return;
    if (!newConcepto || !newMonto) return;

    await fetch(`${baseUrl}/gastos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: null,
        concepto: newConcepto,
        monto: Number(newMonto),
        categoria: "OTROS",
      }),
    });

    setNewConcepto("");
    setNewMonto("");
    fetchGastos();
  };

  // ---------------- EFFECT ----------------
  useEffect(() => {
    if (tab === "balance") fetchBalance();
    if (tab === "gastos") fetchGastos();
  }, [tab]);

  // ---------------- STYLES ----------------
  const s = {
    wrap: {
      minHeight: "100vh",
      padding: 40,
      background: "#0b1220",
      color: "white",
      fontFamily: "system-ui",
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
    active: {
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
    input: {
      padding: 10,
      marginRight: 10,
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,.2)",
      background: "rgba(255,255,255,.1)",
      color: "white",
    } as React.CSSProperties,
  };

  return (
    <main style={s.wrap}>
      <div style={s.card}>
        <h1>💰 CONTABILIDAD</h1>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setTab("home")}
            style={tab === "home" ? s.active : s.button}
          >
            Home
          </button>

          <button
            onClick={() => setTab("balance")}
            style={tab === "balance" ? s.active : s.button}
          >
            Balance
          </button>

          <button
            onClick={() => setTab("gastos")}
            style={tab === "gastos" ? s.active : s.button}
          >
            Gastos
          </button>
        </div>

        {/* HOME */}
        {tab === "home" && <div style={{ marginTop: 30 }}>HOME OK</div>}

        {/* BALANCE */}
        {tab === "balance" && (
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
            </tbody>
          </table>
        )}

        {/* GASTOS */}
        {tab === "gastos" && (
          <>
            <div style={{ marginTop: 20 }}>
              <input
                placeholder="Concepto"
                value={newConcepto}
                onChange={(e) => setNewConcepto(e.target.value)}
                style={s.input}
              />
              <input
                placeholder="Monto"
                value={newMonto}
                onChange={(e) => setNewMonto(e.target.value)}
                style={s.input}
              />
              <button onClick={createGasto} style={s.button}>
                Guardar
              </button>
            </div>

            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>Concepto</th>
                  <th style={s.th}>Monto</th>
                  <th style={s.th}>Categoría</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id}>
                    <td style={s.td}>{g.id}</td>
                    <td style={s.td}>{g.concepto}</td>
                    <td style={s.td}>{g.monto}</td>
                    <td style={s.td}>{g.categoria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </main>
  );
}