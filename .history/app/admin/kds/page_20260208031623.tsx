"use client";

/*
========================================
🍳 KDS — COCINA EN TIEMPO REAL
Archivo: app/admin/kds/page.tsx
========================================
*/

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type PedidoItem = { plato_id: number; cantidad: number };

type Pedido = {
  id: number;
  mesa_id: number;
  estado?: string;
  items?: PedidoItem[];
  comentario?: string | null;
  nota?: string | null;
  observaciones?: string | null;
  observacion?: string | null;
  comment?: string | null;
  fecha_hora?: string | null;
  created_at?: string | null;
};

// 🔒 API FIJA EN HTTPS
const API_BASE = "https://restaurante-backend-q43k.onrender.com";

// 🧪 DEBUG VISUAL
const DEBUG_FILE = "KDS → app/admin/kds/page.tsx";

const ESTADOS = ["pendiente", "preparando", "listo", "entregado", "cancelado"] as const;
type Estado = (typeof ESTADOS)[number];

function normalizeEstado(raw: any): Estado {
  const s = String(raw ?? "pendiente").trim().toLowerCase();
  return (ESTADOS as readonly string[]).includes(s) ? (s as Estado) : "pendiente";
}

async function fetchPedidos(): Promise<Pedido[]> {
  const res = await fetch(`${API_BASE}/pedidos`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error pedidos ${res.status}`);
  return (await res.json()) as Pedido[];
}

export default function KdsPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPedidos();
      setPedidos(data.sort((a, b) => b.id - a.id));
    } catch (e: any) {
      setError(e.message ?? "Error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ padding: 16, background: "#0b1220", minHeight: "100vh", color: "white" }}>
      <h2>🍳 KDS — Cocina</h2>
      <p style={{ opacity: 0.7 }}>API: {API_BASE}</p>
      <p style={{ opacity: 0.7 }}>DEBUG: {DEBUG_FILE}</p>

      <Link href="/admin/kds/mensual">📅 Historial mensual</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!error && pedidos.length === 0 && <p>Sin pedidos</p>}
    </div>
  );
}
