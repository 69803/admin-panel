"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ================= TYPES ================= */

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

/* ================= COMPONENT ================= */

export default function ContabilidadPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [tab, setTab] = useState<
    "home" | "gastos" | "balance" | "libro"
  >("home");

  /* ================= GASTOS ================= */

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [newConcepto, setNewConcepto] = useState("");
  const [newMonto, setNewMonto] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editConcepto, setEditConcepto] = useState("");
  const [editMonto, setEditMonto] = useState("");

  const fetchGastos = async () => {
    if (!baseUrl) return;
    const res = await fetch(`${baseUrl}/gastos?limit=300`, {
      cache: "no-store",
    });
    const data = await res.json();
    setGastos(Array.isArray(data) ? data : []);
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

  const deleteGasto = async (id: number) => {
    if (!baseUrl) return;
    await fetch(`${baseUrl}/gastos/${id}`, { method: "DELETE" });
    fetchGastos();
  };

  const startEdit = (g: Gasto) => {
    setEditingId(g.id);
    setEditConcepto(g.concepto);
    setEditMonto(String(g.monto));
  };

  const saveEdit = async (id: number) => {
    if (!baseUrl) return;

    await fetch(`${baseUrl}/gastos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: null,
        concepto: editConcepto,
        monto: Number(editMonto),
        categoria: "OTROS",
      }),
    });

    setEditingId(null);
    fetchGastos();
  };

  /* ================= BALANCE ================= */

  const [balance, setBalance] = useState<BalanceRow[]>([]);

  const fetchBalance = async () => {
    if (!baseUrl) return;
    const res = await fetch(
      `${baseUrl}/contabilidad/balance_mensual`,
      { cache: "no-store" }
    );
    const data = await res.json();
    setBalance(Array.isArray(data) ? data : []);
  };

  /* ================= LIBRO DIARIO ================= */

  const [pedidos, setPedidos] = useState<PedidoHistorial[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [movConcepto, setMovConcepto] = useState("");
  const [movMonto, setMovMonto] = useState("");
  const [movTipo, setMovTipo] = useState<"INGRESO" | "GASTO">(
    "GASTO"
  );

  const fetchLibro = async () => {
    if (!baseUrl) return;

    const [gRes, pRes, mRes] = await Promise.all([
      fetch(`${baseUrl}/gastos?limit=300`),
      fetch(`${baseUrl}/pedidos_historial`),
      fetch(`${baseUrl}/contabilidad/movimientos?limit=300`),
    ]);

    const g = await gRes.json();
    const p = await pRes.json();
    const m = await mRes.json();

    setGastos(Array.isArray(g) ? g : []);
    setPedidos(Array.isArray(p) ? p : []);
    setMovimientos(Array.isArray(m) ? m : []);
  };

  const createMovimiento = async () => {
    if (!baseUrl) return;

    await fetch(`${baseUrl}/contabilidad/movimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: null,
        tipo: movTipo,
        concepto: movConcepto,
        categoria: movTipo === "INGRESO" ? "INGRESOS" : "GASTOS",
        monto: Number(movMonto),
      }),
    });

    setMovConcepto("");
    setMovMonto("");
    setModalOpen(false);
    fetchLibro();
  };

  const libroRows = useMemo(() => {
    const gastosRows = gastos.map((g) => ({
      fecha: g.fecha ?? "",
      tipo: "GASTO" as const,
      concepto: g.concepto,
      monto: g.monto,
    }));

    const ingresosRows = pedidos
      .filter((p) => p.estado === "entregado")
      .map((p) => ({
        fecha: p.created_at.slice(0, 10),
        tipo: "INGRESO" as const,
        concepto: `Venta #${p.id}`,
        monto: p.total,
      }));

    const manualRows = movimientos.map((m) => ({
      fecha: m.fecha ?? "",
      tipo: m.tipo,
      concepto: m.concepto,
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

  /* ================= EFFECT ================= */

  useEffect(() => {
    if (tab === "gastos") fetchGastos();
    if (tab === "balance") fetchBalance();
    if (tab === "libro") fetchLibro();
  }, [tab]);

  /* ================= STYLES ================= */

  const s = {
    wrap: {
      minHeight: "100vh",
      padding: 40,
      background: "#0b1220",
      color: "white",
      fontFamily: "system-ui",
    } as React.CSSProperties,
    button: {
      padding: "8px 14px",
      marginRight: 8,
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,.2)",
      background: "rgba(255,255,255,.1)",
      color: "white",
      cursor: "pointer",
    } as React.CSSProperties,
    active: {
      padding: "8px 14px",
      marginRight: 8,
      borderRadius: 8,
      border: "1px solid #7c3aed",
      background: "#7c3aed",
      color: "white",
      cursor: "pointer",
    } as React.CSSProperties,
  };

  /* ================= RENDER ================= */

  return (
    <main style={s.wrap}>
      <h1>💰 CONTABILIDAD COMPLETA</h1>

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

          <table style={{ marginTop: 20, width: "100%" }}>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td>
                    {editingId === g.id ? (
                      <input
                        value={editConcepto}
                        onChange={(e) =>
                          setEditConcepto(e.target.value)
                        }
                      />
                    ) : (
                      g.concepto
                    )}
                  </td>
                  <td>
                    {editingId === g.id ? (
                      <input
                        value={editMonto}
                        onChange={(e) =>
                          setEditMonto(e.target.value)
                        }
                      />
                    ) : (
                      g.monto
                    )}
                  </td>
                  <td>
                    {editingId === g.id ? (
                      <button onClick={() => saveEdit(g.id)}>
                        Guardar
                      </button>
                    ) : (
                      <>
                        <button onClick={() => startEdit(g)}>
                          Editar
                        </button>
                        <button
                          onClick={() => deleteGasto(g.id)}
                        >
                          Borrar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === "balance" && (
        <table style={{ marginTop: 20, width: "100%" }}>
          <tbody>
            {balance.map((r, i) => (
              <tr key={i}>
                <td>{r.mes}</td>
                <td>{r.ingresos}</td>
                <td>{r.gastos}</td>
                <td>{r.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "libro" && (
        <>
          <button onClick={() => setModalOpen(true)}>
            + Nuevo Movimiento
          </button>

          {modalOpen && (
            <div>
              <input
                placeholder="Concepto"
                value={movConcepto}
                onChange={(e) =>
                  setMovConcepto(e.target.value)
                }
              />
              <input
                placeholder="Monto"
                value={movMonto}
                onChange={(e) =>
                  setMovMonto(e.target.value)
                }
              />
              <select
                value={movTipo}
                onChange={(e) =>
                  setMovTipo(e.target.value as any)
                }
              >
                <option value="GASTO">GASTO</option>
                <option value="INGRESO">INGRESO</option>
              </select>
              <button onClick={createMovimiento}>
                Guardar
              </button>
            </div>
          )}

          <table style={{ marginTop: 20, width: "100%" }}>
            <tbody>
              {libroRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.fecha}</td>
                  <td>{r.tipo}</td>
                  <td>{r.concepto}</td>
                  <td>{r.monto}</td>
                  <td>{r.saldo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}