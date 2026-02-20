"use client";

import React, { useEffect, useMemo, useState } from "react";

type Gasto = {
  id: number;
  fecha: string | null;
  concepto: string;
  monto: number;
  categoria: string;
};

type BalanceRow = {
  mes: string | null;
  ingresos: number;
  gastos: number;
  balance: number;
};

type PedidoHistorial = {
  id: number;
  estado: string;
  created_at: string;
  total: number;
};

type Movimiento = {
  id: number;
  fecha: string | null;
  tipo: "INGRESO" | "GASTO";
  concepto: string;
  categoria: string;
  monto: number;
};

export default function ContabilidadPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [tab, setTab] = useState<"home" | "gastos" | "balance" | "libro">("home");

  // ---------------- GASTOS ----------------
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [newConcepto, setNewConcepto] = useState("");
  const [newMonto, setNewMonto] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchGastos = async () => {
    if (!baseUrl) return;
    const res = await fetch(`${baseUrl}/gastos?limit=200`, { cache: "no-store" });
    const data = await res.json();
    setGastos(Array.isArray(data) ? data : []);
  };

  const createGasto = async () => {
    if (!baseUrl) return;
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

  const deleteGasto = async (id: number) => {
    if (!baseUrl) return;
    await fetch(`${baseUrl}/gastos/${id}`, { method: "DELETE" });
    fetchGastos();
  };

  // ---------------- BALANCE ----------------
  const [balance, setBalance] = useState<BalanceRow[]>([]);

  const fetchBalance = async () => {
    if (!baseUrl) return;
    const res = await fetch(`${baseUrl}/contabilidad/balance_mensual`, { cache: "no-store" });
    const data = await res.json();
    setBalance(Array.isArray(data) ? data : []);
  };

  // ---------------- LIBRO ----------------
  const [pedidos, setPedidos] = useState<PedidoHistorial[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const fetchLibro = async () => {
    if (!baseUrl) return;

    const [gRes, pRes, mRes] = await Promise.all([
      fetch(`${baseUrl}/gastos?limit=200`),
      fetch(`${baseUrl}/pedidos_historial`),
      fetch(`${baseUrl}/contabilidad/movimientos?limit=200`),
    ]);

    const g = await gRes.json();
    const p = await pRes.json();
    const m = await mRes.json();

    setGastos(Array.isArray(g) ? g : []);
    setPedidos(Array.isArray(p) ? p : []);
    setMovimientos(Array.isArray(m) ? m : []);
  };

  const libroRows = useMemo(() => {
    const gastosRows = gastos.map((g) => ({
      fecha: g.fecha ?? "",
      tipo: "GASTO" as const,
      concepto: g.concepto,
      categoria: g.categoria,
      monto: g.monto,
    }));

    const ingresosRows = pedidos
      .filter((p) => p.estado === "entregado")
      .map((p) => ({
        fecha: p.created_at.slice(0, 10),
        tipo: "INGRESO" as const,
        concepto: `Venta #${p.id}`,
        categoria: "VENTAS",
        monto: p.total,
      }));

    const manualRows = movimientos.map((m) => ({
      fecha: m.fecha ?? "",
      tipo: m.tipo,
      concepto: m.concepto,
      categoria: m.categoria,
      monto: m.monto,
    }));

    const merged = [...ingresosRows, ...gastosRows, ...manualRows];

    merged.sort((a, b) => a.fecha.localeCompare(b.fecha));

    let saldo = 0;
    return merged.map((r) => {
      saldo += r.tipo === "INGRESO" ? r.monto : -r.monto;
      return { ...r, saldo };
    });
  }, [gastos, pedidos, movimientos]);

  // ---------------- EFFECT ----------------
  useEffect(() => {
    if (tab === "gastos") fetchGastos();
    if (tab === "balance") fetchBalance();
    if (tab === "libro") fetchLibro();
  }, [tab]);

  const s = {
    wrap: {
      minHeight: "100vh",
      padding: 40,
      background: "#0b1220",
      color: "white",
      fontFamily: "system-ui",
    } as React.CSSProperties,
    button: {
      padding: "10px 16px",
      marginRight: 10,
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,.2)",
      background: "rgba(255,255,255,.08)",
      color: "white",
      cursor: "pointer",
    } as React.CSSProperties,
    active: {
      padding: "10px 16px",
      marginRight: 10,
      borderRadius: 10,
      border: "1px solid #7c3aed",
      background: "#7c3aed",
      color: "white",
      cursor: "pointer",
    } as React.CSSProperties,
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 20,
    } as React.CSSProperties,
    th: {
      textAlign: "left",
      padding: 10,
      borderBottom: "1px solid rgba(255,255,255,.2)",
    } as React.CSSProperties,
    td: {
      padding: 10,
      borderBottom: "1px solid rgba(255,255,255,.1)",
    } as React.CSSProperties,
  };

  return (
    <main style={s.wrap}>
      <h1>💰 CONTABILIDAD AVANZADA</h1>

      <div style={{ marginTop: 20 }}>
        {["home", "gastos", "balance", "libro"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            style={tab === t ? s.active : s.button}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "home" && <div style={{ marginTop: 30 }}>HOME OK</div>}

      {tab === "gastos" && (
        <>
          <div style={{ marginTop: 20 }}>
            <input
              placeholder="Concepto"
              value={newConcepto}
              onChange={(e) => setNewConcepto(e.target.value)}
            />
            <input
              placeholder="Monto"
              value={newMonto}
              onChange={(e) => setNewMonto(e.target.value)}
            />
            <button onClick={createGasto}>Guardar</button>
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Concepto</th>
                <th style={s.th}>Monto</th>
                <th style={s.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id}>
                  <td style={s.td}>{g.id}</td>
                  <td style={s.td}>{g.concepto}</td>
                  <td style={s.td}>{g.monto}</td>
                  <td style={s.td}>
                    <button onClick={() => deleteGasto(g.id)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

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
                <td style={s.td}>{r.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "libro" && (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Fecha</th>
              <th style={s.th}>Tipo</th>
              <th style={s.th}>Concepto</th>
              <th style={s.th}>Monto</th>
              <th style={s.th}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {libroRows.map((r, i) => (
              <tr key={i}>
                <td style={s.td}>{r.fecha}</td>
                <td style={s.td}>{r.tipo}</td>
                <td style={s.td}>{r.concepto}</td>
                <td style={s.td}>{r.monto}</td>
                <td style={s.td}>{r.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}