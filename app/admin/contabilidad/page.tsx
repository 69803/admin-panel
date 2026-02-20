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

  return (
    <main style={{ padding: 40 }}>
      <h1>PRUEBA CONTROLADA</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("home")}>
          Home
        </button>

        <button onClick={() => setTab("balance")}>
          Balance mensual
        </button>
      </div>

      {tab === "home" && <div>HOME FUNCIONANDO</div>}

      {tab === "balance" && (
        <div>
          {error && <div>❌ {error}</div>}
          {loading && <div>Cargando...</div>}

          <table border={1} cellPadding={10}>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {balance.map((r, i) => (
                <tr key={i}>
                  <td>{r.mes}</td>
                  <td>{r.ingresos}</td>
                  <td>{r.gastos}</td>
                  <td>{r.balance}</td>
                </tr>
              ))}

              {balance.length === 0 && !loading && (
                <tr>
                  <td colSpan={4}>
                    No hay datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}