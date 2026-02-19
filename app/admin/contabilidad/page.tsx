"use client";

import React, { useEffect, useMemo, useState } from "react";

type Gasto = {
  id: number;
  fecha: string | null; // YYYY-MM-DD
  concepto: string;
  monto: number;
  categoria: string;
  created_at?: string | null;
};

type BalanceRow = {
  mes: string | null; // YYYY-MM-DD (primer día del mes)
  ingresos: number;
  gastos: number;
  balance: number;
};

/** ✅ Pedidos historial (INGRESOS reales) */
type PedidoHistorialItem = {
  plato_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
};

type PedidoHistorial = {
  id: number;
  mesa_id: number | null;
  estado: string;
  created_at: string; // ISO
  items: PedidoHistorialItem[];
  total: number;
  comentario?: string | null;
};

type LibroRow = {
  fecha: string; // YYYY-MM-DD
  tipo: "INGRESO" | "GASTO";
  concepto: string;
  categoria: string;
  monto: number; // siempre positivo
  ref: string; // "GASTO#id" | "PEDIDO#id" | "MOV#id"
  saldo: number; // acumulado
};

// ✅ Form para crear operación del Libro Diario (tipo Excel)
type DiarioOperacionForm = {
  fecha: string; // YYYY-MM-DD
  proveedor: string;
  factura_no: string;
  productos_servicios: string;
  monto_total: number;
  iva: number;
  modo_pago: string;
  observacion: string;
};

// ✅ Movimientos manuales (backend /contabilidad/movimientos)
type Movimiento = {
  id: number;
  fecha: string | null; // YYYY-MM-DD
  tipo: "GASTO" | "INGRESO";
  concepto: string;
  categoria: string;
  monto: number;
  iva: number;
  neto: number;
  proveedor?: string | null;
  factura_no?: string | null;
  productos_servicios?: string | null;
  modo_pago?: string | null;
  observacion?: string | null;
  created_at?: string;
};

function normalizeApiUrl(raw?: string) {
  if (!raw) return null;
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;

  const isLocal =
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0");

  if (!isLocal) url = url.replace(/^http:\/\//i, "https://");
  url = url.replace(/\/+$/, "");
  return url;
}

function up(s?: string) {
  return (s ?? "").trim().toUpperCase();
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function moneyEUR(v: number) {
  return `€ ${safeNum(v).toFixed(2)}`;
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openPrintWindow(opts: {
  title: string;
  subtitle?: string;
  kpis?: Array<{ label: string; value: string }>;
  tableHeaders: string[];
  tableRows: (string | number)[][];
  footerNote?: string;
}) {
  const { title, subtitle, kpis, tableHeaders, tableRows, footerNote } = opts;

  const kpiHtml =
    kpis && kpis.length
      ? `
      <div class="kpis">
        ${kpis
          .map(
            (k) => `
          <div class="kpi">
            <div class="kpiLabel">${k.label}</div>
            <div class="kpiValue">${k.value}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `
      : "";

  const thead = `<tr>${tableHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const tbody = tableRows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td>${String(c ?? "")}</td>`).join("")}</tr>`
    )
    .join("");

  const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 28px; color:#0b1220; }
  h1 { margin: 0 0 6px 0; font-size: 22px; }
  .sub { margin: 0 0 16px 0; color:#4b5563; font-size: 12px; }
  .kpis { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; margin: 12px 0 16px 0; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; }
  .kpiLabel { font-size: 12px; color:#6b7280; margin-bottom: 6px; }
  .kpiValue { font-weight: 800; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 12px; overflow:hidden; }
  th, td { text-align:left; padding: 10px; border-top: 1px solid #e5e7eb; font-size: 12px; }
  thead th { background: #f3f4f6; border-top:none; font-size: 12px; color:#374151; }
  .note { margin-top: 12px; font-size: 11px; color:#6b7280; }
  @media print {
    body { margin: 0; padding: 0; }
    .wrap { margin: 18px; }
  }
</style>
</head>
<body>
<div class="wrap">
  <h1>${title}</h1>
  ${subtitle ? `<div class="sub">${subtitle}</div>` : ""}
  ${kpiHtml}
  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>
  ${footerNote ? `<div class="note">${footerNote}</div>` : ""}
</div>
<script>
  window.onload = () => { window.focus(); window.print(); };
</script>
</body>
</html>
  `.trim();

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w)
    return alert(
      "Tu navegador bloqueó la ventana de impresión. Permite pop-ups para imprimir."
    );
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/** ✅ OTROS es la única protegida (default). */
const BASE_CATS = ["OTROS"] as const;

const LS_KEY = "conta_categorias_v1";
function readCatsLS(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => up(String(x))).filter(Boolean);
  } catch {
    return [];
  }
}
function writeCatsLS(cats: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cats));
  } catch {}
}

function ymdFromAny(s?: string | null) {
  const v = (s ?? "").trim();
  if (!v) return "";
  if (v.includes("T")) return v.slice(0, 10);
  return v.slice(0, 10);
}

function inRange(ymd: string, desde: string, hasta: string) {
  if (!ymd) return false;
  if (desde && ymd < desde) return false;
  if (hasta && ymd > hasta) return false;
  return true;
}

export default function ContabilidadPage() {
  const baseUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  const [tab, setTab] = useState<"gastos" | "balance" | "libro">("gastos");

  // ✅ Modal NUEVA OPERACION (Libro diario)
  const [opOpen, setOpOpen] = useState(false);
  const [opTipo, setOpTipo] = useState<"GASTO" | "INGRESO">("GASTO");

  const [op, setOp] = useState<DiarioOperacionForm>({
    fecha: "",
    proveedor: "",
    factura_no: "",
    productos_servicios: "",
    monto_total: 0,
    iva: 0,
    modo_pago: "Transferencia",
    observacion: "",
  });

  const opNetoAuto = useMemo(() => {
    return Math.max(0, safeNum(op.monto_total) - safeNum(op.iva));
  }, [op.monto_total, op.iva]);

  const opCanSave = useMemo(() => {
    return (
      !!op.fecha &&
      op.proveedor.trim().length > 0 &&
      op.productos_servicios.trim().length > 0 &&
      safeNum(op.monto_total) > 0
    );
  }, [op]);

  function opSet<K extends keyof DiarioOperacionForm>(
    key: K,
    value: DiarioOperacionForm[K]
  ) {
    setOp((prev) => ({ ...prev, [key]: value }));
  }

  function opReset() {
    setOp({
      fecha: "",
      proveedor: "",
      factura_no: "",
      productos_servicios: "",
      monto_total: 0,
      iva: 0,
      modo_pago: "Transferencia",
      observacion: "",
    });
    setOpTipo("GASTO");
  }

  // ---------- GASTOS ----------
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState<string | null>(null);
  const [gBusy, setGBusy] = useState(false);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cat, setCat] = useState("");

  const [newFecha, setNewFecha] = useState("");
  const [newConcepto, setNewConcepto] = useState("");
  const [newMonto, setNewMonto] = useState("");
  const [newCategoria, setNewCategoria] = useState("OTROS");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFecha, setEditFecha] = useState("");
  const [editConcepto, setEditConcepto] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editCategoria, setEditCategoria] = useState("OTROS");

  // ✅ Eliminar categoría
  const [catDel, setCatDel] = useState<string>("");
  const [catReplace, setCatReplace] = useState<string>("OTROS");

  // ---------- LIBRO DIARIO ----------
  const [libroGastos, setLibroGastos] = useState<Gasto[]>([]);
  const [pedidosHist, setPedidosHist] = useState<PedidoHistorial[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [lLoading, setLLoading] = useState(false);
  const [lError, setLError] = useState<string | null>(null);

  const [lDesde, setLDesde] = useState("");
  const [lHasta, setLHasta] = useState("");
  const [lCat, setLCat] = useState("");
  const [lQ, setLQ] = useState("");

  const fetchGastos = async () => {
    if (!baseUrl) {
      setGError("Falta NEXT_PUBLIC_API_URL en Vercel / .env.local");
      return;
    }

    setGLoading(true);
    setGError(null);

    try {
      const qs = new URLSearchParams();
      if (desde.trim()) qs.set("desde", desde.trim());
      if (hasta.trim()) qs.set("hasta", hasta.trim());
      if (cat.trim()) qs.set("categoria", cat.trim());
      qs.set("limit", "200");

      const res = await fetch(`${baseUrl}/gastos?${qs.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`GET /gastos (HTTP ${res.status}) ${txt}`);
      }

      const data = (await res.json()) as Gasto[];
      setGastos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setGError(e?.message ?? "Error cargando gastos");
    } finally {
      setGLoading(false);
    }
  };

  const fetchLibroGastos = async () => {
    if (!baseUrl)
      throw new Error("Falta NEXT_PUBLIC_API_URL en Vercel / .env.local");

    const qs = new URLSearchParams();
    if (lDesde.trim()) qs.set("desde", lDesde.trim());
    if (lHasta.trim()) qs.set("hasta", lHasta.trim());
    if (lCat.trim()) qs.set("categoria", lCat.trim());
    qs.set("limit", "500");

    const res = await fetch(`${baseUrl}/gastos?${qs.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`GET /gastos (Libro) (HTTP ${res.status}) ${txt}`);
    }

    const data = (await res.json()) as Gasto[];
    setLibroGastos(Array.isArray(data) ? data : []);
  };

  const fetchPedidosHistorial = async () => {
    if (!baseUrl)
      throw new Error("Falta NEXT_PUBLIC_API_URL en Vercel / .env.local");

    const res = await fetch(`${baseUrl}/pedidos_historial`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`GET /pedidos_historial (HTTP ${res.status}) ${txt}`);
    }
    const data = (await res.json()) as PedidoHistorial[];
    setPedidosHist(Array.isArray(data) ? data : []);
  };

  const fetchMovimientos = async (limit = 200) => {
    if (!baseUrl) return;
    try {
      const r = await fetch(`${baseUrl}/contabilidad/movimientos?limit=${limit}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`GET /contabilidad/movimientos (HTTP ${r.status}) ${txt}`);
      }
      const data = (await r.json()) as Movimiento[];
      setMovimientos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("ERROR MOVIMIENTOS ❌", e);
      setMovimientos([]);
    }
  };

  // ✅ FIX: ahora sí existe y trae TODO (gastos + pedidos + movimientos)
  const fetchLibroAll = async () => {
    setLLoading(true);
    setLError(null);
    try {
      await Promise.all([fetchLibroGastos(), fetchPedidosHistorial(), fetchMovimientos(200)]);
    } catch (e: any) {
      setLError(e?.message ?? "Error cargando libro diario");
    } finally {
      setLLoading(false);
    }
  };

  // ✅ Guardar operación en BACKEND
  async function opSaveUIOnly(e: React.FormEvent) {
    e.preventDefault();
    if (!opCanSave) return;

    if (!baseUrl) {
      alert("Falta NEXT_PUBLIC_API_URL");
      return;
    }

    // ✅ Backend MovimientoIn espera: fecha,tipo,concepto,categoria,monto,iva,proveedor,...
    // Tú tienes monto_total + productos_servicios -> lo mapeamos bien.
    const payload = {
      fecha: op.fecha, // YYYY-MM-DD
      tipo: opTipo, // "GASTO" | "INGRESO"
      concepto: op.productos_servicios, // ✅ requerido
      categoria: opTipo === "INGRESO" ? "INGRESOS" : "GASTOS",
      monto: safeNum(op.monto_total), // ✅ backend usa "monto"
      iva: safeNum(op.iva),
      proveedor: op.proveedor,
      factura_no: op.factura_no,
      productos_servicios: op.productos_servicios,
      modo_pago: op.modo_pago,
      observacion: op.observacion,
    };

    try {
      const res = await fetch(`${baseUrl}/contabilidad/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`POST /contabilidad/movimientos (HTTP ${res.status}) ${txt}`);
      }

      await res.json().catch(() => null);

      // refresca listas para que se vea en UI
      await Promise.all([fetchMovimientos(200), fetchGastos(), fetchLibroAll()]);

      setOpOpen(false);
      opReset();
    } catch (err: any) {
      console.error("❌ ERROR GUARDANDO:", err);
      alert(err?.message ?? "Error guardando movimiento");
    }
  }

  const createGasto = async () => {
    if (!baseUrl) return;

    const concepto = newConcepto.trim();
    const montoNum = Number(newMonto);
    const categoria = up(newCategoria) || "OTROS";
    const fecha = newFecha.trim() || null;

    if (!concepto) return setGError("Concepto requerido");
    if (!Number.isFinite(montoNum) || montoNum < 0)
      return setGError("Monto inválido (>= 0)");

    setGBusy(true);
    setGError(null);

    try {
      const res = await fetch(`${baseUrl}/gastos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, concepto, monto: montoNum, categoria }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`POST /gastos (HTTP ${res.status}) ${txt}`);
      }

      setNewFecha("");
      setNewConcepto("");
      setNewMonto("");
      setNewCategoria("OTROS");

      await fetchGastos();
      if (tab === "libro") await fetchLibroAll();
    } catch (e: any) {
      setGError(e?.message ?? "Error creando gasto");
    } finally {
      setGBusy(false);
    }
  };

  const startEdit = (g: Gasto) => {
    setEditingId(g.id);
    setEditFecha(g.fecha ?? "");
    setEditConcepto(g.concepto ?? "");
    setEditMonto(String(g.monto ?? ""));
    setEditCategoria(up(g.categoria) || "OTROS");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFecha("");
    setEditConcepto("");
    setEditMonto("");
    setEditCategoria("OTROS");
  };

  const saveEdit = async (id: number) => {
    if (!baseUrl) return;

    const concepto = editConcepto.trim();
    const montoNum = Number(editMonto);
    const categoria = up(editCategoria) || "OTROS";
    const fecha = editFecha.trim() || null;

    if (!concepto) return setGError("Concepto requerido");
    if (!Number.isFinite(montoNum) || montoNum < 0)
      return setGError("Monto inválido (>= 0)");

    setGBusy(true);
    setGError(null);

    try {
      const res = await fetch(`${baseUrl}/gastos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, concepto, monto: montoNum, categoria }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`PUT /gastos/${id} (HTTP ${res.status}) ${txt}`);
      }

      cancelEdit();
      await fetchGastos();
      if (tab === "libro") await fetchLibroAll();
    } catch (e: any) {
      setGError(e?.message ?? "Error editando gasto");
    } finally {
      setGBusy(false);
    }
  };

  const deleteGasto = async (id: number) => {
    if (!baseUrl) return;
    const ok = confirm(`¿Borrar gasto ID ${id}?`);
    if (!ok) return;

    setGBusy(true);
    setGError(null);

    try {
      const res = await fetch(`${baseUrl}/gastos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`DELETE /gastos/${id} (HTTP ${res.status}) ${txt}`);
      }

      if (editingId === id) cancelEdit();
      await fetchGastos();
      if (tab === "libro") await fetchLibroAll();
    } catch (e: any) {
      setGError(e?.message ?? "Error borrando gasto");
    } finally {
      setGBusy(false);
    }
  };

  const deleteCategoria = async () => {
    if (!baseUrl) return;

    const toDelete = up(catDel);
    const toReplace = up(catReplace) || "OTROS";

    if (!toDelete) return setGError("Selecciona una categoría a eliminar.");
    if (toDelete === "OTROS")
      return setGError("No puedes eliminar OTROS (categoría default).");
    if (BASE_CATS.includes(toDelete as any))
      return setGError(`No puedes eliminar la categoría base: ${toDelete}`);
    if (toDelete === toReplace)
      return setGError("La categoría de reemplazo no puede ser la misma.");

    const afectados = gastos.filter((g) => up(g.categoria) === toDelete);

    const ok = confirm(
      `Vas a ELIMINAR la categoría "${toDelete}".\n\n` +
        `Gastos afectados (según el listado actual): ${afectados.length}\n` +
        `Se moverán a: "${toReplace}"\n\n` +
        `¿Continuar?`
    );
    if (!ok) return;

    setGBusy(true);
    setGError(null);

    try {
      for (const g of afectados) {
        const res = await fetch(`${baseUrl}/gastos/${g.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fecha: g.fecha ?? null,
            concepto: g.concepto,
            monto: safeNum(g.monto),
            categoria: toReplace,
          }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Error moviendo gasto ID ${g.id}: (HTTP ${res.status}) ${txt}`);
        }
      }

      const current = new Set(readCatsLS());
      current.delete(toDelete);
      current.add("OTROS");
      writeCatsLS(Array.from(current).sort((a, b) => a.localeCompare(b)));

      if (up(cat) === toDelete) setCat("");
      if (up(newCategoria) === toDelete) setNewCategoria("OTROS");
      if (up(editCategoria) === toDelete) setEditCategoria("OTROS");

      setCatDel("");
      setCatReplace("OTROS");

      await fetchGastos();
      if (tab === "libro") await fetchLibroAll();
    } catch (e: any) {
      setGError(e?.message ?? "Error eliminando categoría");
    } finally {
      setGBusy(false);
    }
  };

  const categoriasDetectadas = useMemo(() => {
    const set = new Set<string>();
    for (const g of gastos) set.add(up(g.categoria) || "OTROS");
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [gastos]);

  useEffect(() => {
    try {
      const prev = new Set(readCatsLS());
      for (const c of categoriasDetectadas) prev.add(up(c));
      prev.add("OTROS");
      writeCatsLS(
        Array.from(prev)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      );
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriasDetectadas.join("|")]);

  const categoriasOpciones = useMemo(() => {
    const set = new Set<string>();
    set.add("OTROS");
    for (const c of readCatsLS()) set.add(up(c));
    for (const c of categoriasDetectadas) set.add(up(c));
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categoriasDetectadas]);

  const gastosStats = useMemo(() => {
    const rows = Array.isArray(gastos) ? gastos : [];
    const total = rows.reduce((acc, g) => acc + safeNum(g.monto), 0);
    const count = rows.length;
    const avg = count ? total / count : 0;

    let max = 0;
    let maxRow: Gasto | null = null;
    for (const g of rows) {
      const m = safeNum(g.monto);
      if (m >= max) {
        max = m;
        maxRow = g;
      }
    }

    return { count, total, avg, max, maxRow };
  }, [gastos]);

  const resumenCategoria = useMemo(() => {
    const rows = Array.isArray(gastos) ? gastos : [];
    const map = new Map<string, { categoria: string; total: number; count: number }>();

    for (const g of rows) {
      const c = up(g.categoria) || "OTROS";
      const prev = map.get(c) ?? { categoria: c, total: 0, count: 0 };
      prev.total += safeNum(g.monto);
      prev.count += 1;
      map.set(c, prev);
    }

    const arr = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const total = arr.reduce((acc, x) => acc + x.total, 0);

    const withPct = arr.map((x) => ({
      ...x,
      pct: total > 0 ? (x.total / total) * 100 : 0,
    }));

    return { total, rows: withPct, top5: withPct.slice(0, 5) };
  }, [gastos]);

  const exportGastosCSV = () => {
    const rows = Array.isArray(gastos) ? gastos : [];
    const header = ["ID", "Fecha", "Concepto", "Monto", "Categoría"];
    const lines = [
      header.map(csvEscape).join(","),
      ...rows.map((g) =>
        [
          g.id,
          g.fecha ?? "",
          g.concepto ?? "",
          safeNum(g.monto).toFixed(2),
          up(g.categoria) || "OTROS",
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const meta = [
      `# Export Contabilidad - Gastos`,
      `# Desde: ${desde || "-"}`,
      `# Hasta: ${hasta || "-"}`,
      `# Categoría: ${cat || "-"}`,
      `# Total (filtrado): ${moneyEUR(gastosStats.total)}`,
      ``,
    ].join("\n");

    downloadTextFile(
      `gastos_${new Date().toISOString().slice(0, 10)}.csv`,
      meta + lines.join("\n"),
      "text/csv;charset=utf-8"
    );
  };

  const printGastos = () => {
    const rows = Array.isArray(gastos) ? gastos : [];
    openPrintWindow({
      title: "Contabilidad — Gastos",
      subtitle: `Filtros: Desde ${desde || "-"} | Hasta ${hasta || "-"} | Categoría ${cat || "-"}`,
      kpis: [
        { label: "Total", value: moneyEUR(gastosStats.total) },
        { label: "Promedio", value: moneyEUR(gastosStats.avg) },
        { label: "Mayor gasto", value: moneyEUR(gastosStats.max) },
        { label: "Registros", value: String(gastosStats.count) },
      ],
      tableHeaders: ["ID", "Fecha", "Concepto", "Monto", "Categoría"],
      tableRows: rows.map((g) => [
        g.id,
        g.fecha ?? "-",
        g.concepto ?? "",
        moneyEUR(safeNum(g.monto)),
        up(g.categoria) || "OTROS",
      ]),
      footerNote: "Tip: en el diálogo de impresión elige “Guardar como PDF”.",
    });
  };

  // ---------- BALANCE ----------
  const [balance, setBalance] = useState<BalanceRow[]>([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!baseUrl) {
      setBError("Falta NEXT_PUBLIC_API_URL en Vercel / .env.local");
      return;
    }
    setBLoading(true);
    setBError(null);

    try {
      // ✅ FIX: endpoint correcto del backend
      const res = await fetch(`${baseUrl}/contabilidad/balance_mensual`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`GET /contabilidad/balance_mensual (HTTP ${res.status}) ${txt}`);
      }

      const raw = await res.json();

const fixed = (Array.isArray(raw) ? raw : []).map((r: any) => ({
  ...r,
  mes: r?.mes ? `${r.mes}T00:00:00Z` : null,
}));

setBalance(fixed);

    } catch (e: any) {
      setBError(e?.message ?? "Error cargando balance");
    } finally {
      setBLoading(false);
    }
  };

  const balanceStats = useMemo(() => {
    const rows = Array.isArray(balance) ? balance : [];
    const totalIngresos = rows.reduce((acc, r) => acc + safeNum(r.ingresos), 0);
    const totalGastos = rows.reduce((acc, r) => acc + safeNum(r.gastos), 0);
    const totalBalance = rows.reduce((acc, r) => acc + safeNum(r.balance), 0);
    return { meses: rows.length, totalIngresos, totalGastos, totalBalance };
  }, [balance]);

  const exportBalanceCSV = () => {
    const rows = Array.isArray(balance) ? balance : [];
    const header = ["Mes", "Ingresos", "Gastos", "Balance"];
    const lines = [
      header.map(csvEscape).join(","),
      ...rows.map((r) =>
        [
          r.mes ?? "",
          safeNum(r.ingresos).toFixed(2),
          safeNum(r.gastos).toFixed(2),
          safeNum(r.balance).toFixed(2),
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const meta = [
      `# Export Contabilidad - Balance Mensual`,
      `# Total ingresos: ${moneyEUR(balanceStats.totalIngresos)}`,
      `# Total gastos: ${moneyEUR(balanceStats.totalGastos)}`,
      `# Balance total: ${moneyEUR(balanceStats.totalBalance)}`,
      ``,
    ].join("\n");

    downloadTextFile(
      `balance_mensual_${new Date().toISOString().slice(0, 10)}.csv`,
      meta + lines.join("\n"),
      "text/csv;charset=utf-8"
    );
  };

  const printBalance = () => {
    const rows = Array.isArray(balance) ? balance : [];
    openPrintWindow({
      title: "Contabilidad — Balance mensual",
      subtitle: `Resumen mensual (datos desde el backend)`,
      kpis: [
        { label: "Total ingresos", value: moneyEUR(balanceStats.totalIngresos) },
        { label: "Total gastos", value: moneyEUR(balanceStats.totalGastos) },
        { label: "Balance total", value: moneyEUR(balanceStats.totalBalance) },
        { label: "Meses", value: String(balanceStats.meses) },
      ],
      tableHeaders: ["Mes", "Ingresos", "Gastos", "Balance"],
      tableRows: rows.map((r) => [
        r.mes ?? "-",
        moneyEUR(safeNum(r.ingresos)),
        moneyEUR(safeNum(r.gastos)),
        moneyEUR(safeNum(r.balance)),
      ]),
      footerNote: "Tip: en el diálogo de impresión elige “Guardar como PDF”.",
    });
  };

  // ---------- LIBRO DIARIO (mezclado: ventas + gastos + movimientos) ----------
  const libroRows: LibroRow[] = useMemo(() => {
    const q = lQ.trim().toLowerCase();
    const catFilter = up(lCat);

    const gastosMovs = (Array.isArray(libroGastos) ? libroGastos : []).map((g) => {
      const fecha = ymdFromAny(g.fecha ?? g.created_at ?? "");
      return {
        fecha,
        tipo: "GASTO" as const,
        concepto: g.concepto ?? "",
        categoria: up(g.categoria) || "OTROS",
        monto: safeNum(g.monto),
        ref: `GASTO#${g.id}`,
      };
    });

    const ingresosMovs = (Array.isArray(pedidosHist) ? pedidosHist : [])
      .filter((p) => (p?.estado ?? "").toLowerCase() === "entregado")
      .map((p) => {
        const fecha = ymdFromAny(p.created_at);
        const items = Array.isArray(p.items) ? p.items : [];
        const concepto =
          items.length > 0
            ? `Venta #${p.id} — ${items
                .slice(0, 3)
                .map((x) => x?.nombre)
                .filter(Boolean)
                .join(", ")}${items.length > 3 ? "…" : ""}`
            : `Venta #${p.id}`;
        return {
          fecha,
          tipo: "INGRESO" as const,
          concepto,
          categoria: "VENTAS",
          monto: safeNum(p.total),
          ref: `PEDIDO#${p.id}`,
        };
      });

    // ✅ Movimientos manuales (ya vienen como INGRESO/GASTO)
    const manualMovs = (Array.isArray(movimientos) ? movimientos : []).map((m) => {
      const fecha = ymdFromAny(m.fecha ?? m.created_at ?? "");
      return {
        fecha,
        tipo: m.tipo === "INGRESO" ? ("INGRESO" as "INGRESO") : ("GASTO" as "GASTO"),
        concepto: (m.concepto ?? m.productos_servicios ?? "").trim() || `Movimiento #${m.id}`,
        categoria: up(m.categoria) || "OTROS",
        monto: safeNum(m.monto),
        ref: `MOV#${m.id}`,
      };
    });

    const merged = [...ingresosMovs, ...gastosMovs, ...manualMovs].filter((r) => {
      if (!r.fecha) return false;
      if (!inRange(r.fecha, lDesde, lHasta)) return false;

      if (catFilter) {
        if (!up(r.categoria).includes(catFilter)) return false;
      }

      if (q) {
        const hay =
          (r.concepto ?? "").toLowerCase().includes(q) ||
          (r.categoria ?? "").toLowerCase().includes(q) ||
          (r.ref ?? "").toLowerCase().includes(q) ||
          (r.fecha ?? "").toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });

    merged.sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      // ingreso primero el mismo día
      if (a.tipo !== b.tipo) return a.tipo === "INGRESO" ? -1 : 1;
      return a.ref.localeCompare(b.ref);
    });

    let saldo = 0;
    const withSaldo: LibroRow[] = merged.map((r) => {
      if (r.tipo === "INGRESO") saldo += safeNum(r.monto);
      else saldo -= safeNum(r.monto);
      return { ...r, saldo };
    });

    return withSaldo;
  }, [libroGastos, pedidosHist, movimientos, lDesde, lHasta, lCat, lQ]);

  const libroStats = useMemo(() => {
    const totalIngresos = libroRows.reduce(
      (acc, r) => acc + (r.tipo === "INGRESO" ? safeNum(r.monto) : 0),
      0
    );
    const totalGastos = libroRows.reduce(
      (acc, r) => acc + (r.tipo === "GASTO" ? safeNum(r.monto) : 0),
      0
    );
    const saldoFinal = libroRows.length
      ? safeNum(libroRows[libroRows.length - 1].saldo)
      : 0;
    return { count: libroRows.length, totalIngresos, totalGastos, saldoFinal };
  }, [libroRows]);

  const exportLibroCSV = () => {
    const header = ["Fecha", "Tipo", "Concepto", "Categoría", "Monto", "Saldo", "Ref"];
    const lines = [
      header.map(csvEscape).join(","),
      ...libroRows.map((r) =>
        [
          r.fecha,
          r.tipo,
          r.concepto,
          r.categoria,
          safeNum(r.monto).toFixed(2),
          safeNum(r.saldo).toFixed(2),
          r.ref,
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const meta = [
      `# Export Contabilidad - Libro Diario (Ingresos + Gastos)`,
      `# Desde: ${lDesde || "-"}`,
      `# Hasta: ${lHasta || "-"}`,
      `# Categoría: ${lCat || "-"}`,
      `# Buscar: ${lQ || "-"}`,
      `# Total ingresos: ${moneyEUR(libroStats.totalIngresos)}`,
      `# Total gastos: ${moneyEUR(libroStats.totalGastos)}`,
      `# Saldo final: ${moneyEUR(libroStats.saldoFinal)}`,
      ``,
    ].join("\n");

    downloadTextFile(
      `libro_diario_${new Date().toISOString().slice(0, 10)}.csv`,
      meta + lines.join("\n"),
      "text/csv;charset=utf-8"
    );
  };

  const printLibro = () => {
    openPrintWindow({
      title: "Contabilidad — Libro diario (Ingresos + Gastos)",
      subtitle: `Filtros: Desde ${lDesde || "-"} | Hasta ${lHasta || "-"} | Categoría ${lCat || "-"} | Buscar ${lQ || "-"}`,
      kpis: [
        { label: "Registros", value: String(libroStats.count) },
        { label: "Total ingresos", value: moneyEUR(libroStats.totalIngresos) },
        { label: "Total gastos", value: moneyEUR(libroStats.totalGastos) },
        { label: "Saldo final", value: moneyEUR(libroStats.saldoFinal) },
      ],
      tableHeaders: ["Fecha", "Tipo", "Concepto", "Categoría", "Monto", "Saldo"],
      tableRows: libroRows.map((r) => [
        r.fecha,
        r.tipo,
        r.concepto,
        r.categoria,
        moneyEUR(r.monto),
        moneyEUR(r.saldo),
      ]),
      footerNote: "Tip: en el diálogo de impresión elige “Guardar como PDF”.",
    });
  };

  useEffect(() => {
    fetchGastos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "balance") fetchBalance();
    if (tab === "libro") fetchLibroAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ---------- UI ----------
  const s = {
    wrap: {
      minHeight: "100vh",
      padding: 26,
      background: "#0b1220",
      color: "white",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
    } as React.CSSProperties,
    card: {
      maxWidth: 1200,
      margin: "0 auto",
      background: "rgba(255,255,255,.06)",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: 18,
      padding: 18,
      boxShadow: "0 18px 50px rgba(0,0,0,.25)",
    } as React.CSSProperties,
    row: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
    } as React.CSSProperties,
    input: {
      padding: 10,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.18)",
      background: "rgba(0,0,0,.25)",
      color: "white",
      outline: "none",
      fontSize: 14,
    } as React.CSSProperties,
    btn: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.18)",
      background: "rgba(255,255,255,.08)",
      color: "white",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 14,
      whiteSpace: "nowrap",
    } as React.CSSProperties,
    btnPrimary: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(124,58,237,.9)",
      background: "rgba(124,58,237,.95)",
      color: "white",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 14,
      whiteSpace: "nowrap",
    } as React.CSSProperties,
    btnDanger: {
      padding: "8px 12px",
      borderRadius: 12,
      border: "1px solid rgba(239,68,68,.5)",
      background: "rgba(239,68,68,.15)",
      color: "#fecaca",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 13,
      whiteSpace: "nowrap",
    } as React.CSSProperties,
    badge: {
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(255,255,255,.10)",
      border: "1px solid rgba(255,255,255,.16)",
      fontSize: 12,
      fontWeight: 900,
    } as React.CSSProperties,
    badgeIngreso: {
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(34,197,94,.16)",
      border: "1px solid rgba(34,197,94,.35)",
      fontSize: 12,
      fontWeight: 900,
      color: "#bbf7d0",
    } as React.CSSProperties,
    badgeGasto: {
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(239,68,68,.16)",
      border: "1px solid rgba(239,68,68,.35)",
      fontSize: 12,
      fontWeight: 900,
      color: "#fecaca",
    } as React.CSSProperties,
    table: {
      width: "100%",
      borderCollapse: "collapse",
      overflow: "hidden",
      borderRadius: 14,
    } as React.CSSProperties,
    th: {
      textAlign: "left",
      padding: 12,
      fontSize: 12,
      color: "rgba(255,255,255,.75)",
    } as React.CSSProperties,
    td: {
      padding: 12,
      borderTop: "1px solid rgba(255,255,255,.10)",
    } as React.CSSProperties,
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
      gap: 10,
      marginBottom: 12,
    } as React.CSSProperties,
    statCard: {
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(255,255,255,.05)",
      padding: 12,
    } as React.CSSProperties,
    statLabel: {
      opacity: 0.8,
      fontSize: 12,
      marginBottom: 6,
    } as React.CSSProperties,
    statValue: { fontSize: 18, fontWeight: 1000 } as React.CSSProperties,
    statSub: {
      opacity: 0.8,
      fontSize: 12,
      marginTop: 4,
    } as React.CSSProperties,
    section: {
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(255,255,255,.05)",
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
    } as React.CSSProperties,
  };

  return (
    <main style={s.wrap}>
      <div style={s.card}>
        <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 1000 }}>💰 Contabilidad</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
              API:{" "}
              <span style={{ fontWeight: 900 }}>{baseUrl ?? "(no definido)"}</span>
            </div>
          </div>

          <div style={s.row}>
            <button onClick={() => setTab("gastos")} style={tab === "gastos" ? s.btnPrimary : s.btn}>
              Gastos
            </button>
            <button onClick={() => setTab("balance")} style={tab === "balance" ? s.btnPrimary : s.btn}>
              Balance mensual
            </button>
            <button onClick={() => setTab("libro")} style={tab === "libro" ? s.btnPrimary : s.btn}>
              Libro diario
            </button>
          </div>
        </div>

        {/* =======================
            TAB: GASTOS
        ======================= */}
        {tab === "gastos" ? (
          <>
            {gError && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(239,68,68,.12)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: "#fecaca",
                  fontWeight: 900,
                }}
              >
                ❌ {gError}
              </div>
            )}

            <div style={s.statsGrid}>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total gastos (filtrado)</div>
                <div style={s.statValue}>{gLoading ? "…" : moneyEUR(gastosStats.total)}</div>
                <div style={s.statSub}>Suma de los registros mostrados</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Promedio por gasto</div>
                <div style={s.statValue}>{gLoading ? "…" : moneyEUR(gastosStats.avg)}</div>
                <div style={s.statSub}>Promedio del listado actual</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Gasto más alto</div>
                <div style={s.statValue}>{gLoading ? "…" : moneyEUR(gastosStats.max)}</div>
                <div style={s.statSub}>{gastosStats.maxRow ? `${gastosStats.maxRow.concepto}` : "—"}</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Registros</div>
                <div style={s.statValue}>{gLoading ? "…" : gastosStats.count}</div>
                <div style={s.statSub}>{gLoading ? "Cargando…" : "Listo"}</div>
              </div>
            </div>

            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
              <div style={s.row}>
                <span style={s.badge}>Registros: {gastos.length}</span>
                {gLoading ? <span style={s.badge}>Cargando…</span> : <span style={s.badge}>Listo</span>}
              </div>

              <div style={s.row}>
                <button onClick={fetchGastos} style={s.btn} disabled={gLoading || gBusy}>
                  🔄 Refrescar
                </button>
                <button onClick={exportGastosCSV} style={s.btn} disabled={gLoading || gBusy || gastos.length === 0}>
                  📥 Excel (CSV)
                </button>
                <button onClick={printGastos} style={s.btn} disabled={gLoading || gBusy || gastos.length === 0}>
                  🖨️ PDF / Imprimir
                </button>
              </div>
            </div>

            <div style={s.section}>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>📌 Resumen por categoría (filtrado)</div>
              {gLoading ? (
                <div style={{ opacity: 0.8 }}>Cargando…</div>
              ) : resumenCategoria.rows.length ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 10 }}>
                  <div
                    style={{
                      gridColumn: "span 6",
                      border: "1px solid rgba(255,255,255,.10)",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    <table style={s.table}>
                      <thead style={{ background: "rgba(255,255,255,.06)" }}>
                        <tr>
                          <th style={s.th}>Categoría</th>
                          <th style={s.th}>Registros</th>
                          <th style={s.th}>Total</th>
                          <th style={s.th}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumenCategoria.top5.map((r) => (
                          <tr key={r.categoria}>
                            <td style={{ ...s.td, fontWeight: 1000 }}>{r.categoria}</td>
                            <td style={s.td}>{r.count}</td>
                            <td style={{ ...s.td, fontWeight: 1000 }}>{moneyEUR(r.total)}</td>
                            <td style={s.td}>{r.pct.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ gridColumn: "span 6", ...s.statCard }}>
                    <div style={s.statLabel}>Total por categorías</div>
                    <div style={s.statValue}>{moneyEUR(resumenCategoria.total)}</div>
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {resumenCategoria.top5.map((r) => (
                        <span key={`pill-${r.categoria}`} style={s.badge}>
                          {r.categoria}: {moneyEUR(r.total)}
                        </span>
                      ))}
                    </div>
                    <div style={s.statSub}>Muestra Top 5 por total</div>
                  </div>
                </div>
              ) : (
                <div style={{ opacity: 0.8 }}>No hay datos para resumir.</div>
              )}
            </div>

            <div style={s.section}>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>🗑️ Eliminar categoría</div>
              <div style={{ opacity: 0.85, fontSize: 13, marginBottom: 10 }}>
                Esto reasigna los gastos de esa categoría a otra (ej: OTROS) y luego la elimina del listado.
              </div>

              <div style={s.row}>
                <select value={up(catDel)} onChange={(e) => setCatDel(e.target.value)} style={{ ...s.input, width: 240 }}>
                  <option value="" style={{ color: "#111" }}>
                    Selecciona categoría…
                  </option>
                  {categoriasOpciones
                    .filter((c) => c !== "OTROS")
                    .map((c) => (
                      <option key={`del-${c}`} value={c} style={{ color: "#111" }}>
                        {c}
                      </option>
                    ))}
                </select>

                <span style={{ opacity: 0.85, fontWeight: 800 }}>Reemplazar por:</span>

                <select value={up(catReplace)} onChange={(e) => setCatReplace(e.target.value)} style={{ ...s.input, width: 220 }}>
                  {categoriasOpciones.map((c) => (
                    <option key={`rep-${c}`} value={c} style={{ color: "#111" }}>
                      {c}
                    </option>
                  ))}
                </select>

                <button onClick={deleteCategoria} style={s.btnDanger} disabled={gBusy}>
                  ✖ Eliminar categoría
                </button>
              </div>
            </div>

            <div style={s.section}>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>➕ Nuevo gasto</div>
              <div style={s.row}>
                <input type="date" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} style={s.input} />
                <input
                  value={newConcepto}
                  onChange={(e) => setNewConcepto(e.target.value)}
                  placeholder="Concepto (ej: Harina PAN)"
                  style={{ ...s.input, minWidth: 260 }}
                />
                <input
                  value={newMonto}
                  onChange={(e) => setNewMonto(e.target.value)}
                  placeholder="Monto (ej: 12.50)"
                  inputMode="decimal"
                  style={{ ...s.input, width: 160 }}
                />

                <select value={up(newCategoria)} onChange={(e) => setNewCategoria(e.target.value)} style={{ ...s.input, width: 220 }}>
                  {categoriasOpciones.map((c) => (
                    <option key={c} value={c} style={{ color: "#111" }}>
                      {c}
                    </option>
                  ))}
                </select>

                <button onClick={createGasto} style={s.btnPrimary} disabled={gBusy}>
                  Guardar
                </button>
              </div>
            </div>

            <div style={{ ...s.row, marginBottom: 12 }}>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={s.input} />
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={s.input} />
              <input
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                placeholder="Filtrar categoría (opcional)"
                style={{ ...s.input, width: 240 }}
                list="cat-sugs"
              />

              <button onClick={fetchGastos} style={s.btn} disabled={gLoading || gBusy}>
                Aplicar filtros
              </button>
              <button
                onClick={() => {
                  setDesde("");
                  setHasta("");
                  setCat("");
                  setTimeout(fetchGastos, 0);
                }}
                style={s.btn}
                disabled={gLoading || gBusy}
              >
                Limpiar
              </button>
            </div>

            <datalist id="cat-sugs">
              {categoriasOpciones.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, overflow: "hidden" }}>
              <table style={s.table}>
                <thead style={{ background: "rgba(255,255,255,.06)" }}>
                  <tr>
                    <th style={s.th}>ID</th>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Concepto</th>
                    <th style={s.th}>Monto</th>
                    <th style={s.th}>Categoría</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {gastos.map((g) => {
                    const isEditing = editingId === g.id;
                    return (
                      <tr key={g.id}>
                        <td style={{ ...s.td, fontWeight: 1000 }}>{g.id}</td>

                        <td style={s.td}>
                          {isEditing ? (
                            <input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} style={s.input} />
                          ) : (
                            <span style={{ opacity: 0.9 }}>{g.fecha ?? "-"}</span>
                          )}
                        </td>

                        <td style={s.td}>
                          {isEditing ? (
                            <input value={editConcepto} onChange={(e) => setEditConcepto(e.target.value)} style={{ ...s.input, minWidth: 260 }} />
                          ) : (
                            <span style={{ fontWeight: 800 }}>{g.concepto}</span>
                          )}
                        </td>

                        <td style={s.td}>
                          {isEditing ? (
                            <input value={editMonto} onChange={(e) => setEditMonto(e.target.value)} inputMode="decimal" style={{ ...s.input, width: 140 }} />
                          ) : (
                            <span style={{ fontWeight: 1000 }}>€ {safeNum(g.monto).toFixed(2)}</span>
                          )}
                        </td>

                        <td style={s.td}>
                          {isEditing ? (
                            <select value={up(editCategoria)} onChange={(e) => setEditCategoria(e.target.value)} style={{ ...s.input, width: 200 }}>
                              {categoriasOpciones.map((c) => (
                                <option key={`edit-${c}`} value={c} style={{ color: "#111" }}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={s.badge}>{up(g.categoria) || "OTROS"}</span>
                          )}
                        </td>

                        <td style={s.td}>
                          {!isEditing ? (
                            <div style={s.row}>
                              <button onClick={() => startEdit(g)} style={s.btn} disabled={gBusy}>
                                ✏️ Editar
                              </button>
                              <button onClick={() => deleteGasto(g.id)} style={s.btnDanger} disabled={gBusy}>
                                ✖ Borrar
                              </button>
                            </div>
                          ) : (
                            <div style={s.row}>
                              <button onClick={() => saveEdit(g.id)} style={s.btnPrimary} disabled={gBusy}>
                                💾 Guardar
                              </button>
                              <button onClick={cancelEdit} style={s.btn} disabled={gBusy}>
                                Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {gastos.length === 0 && !gLoading && (
                    <tr>
                      <td colSpan={6} style={{ ...s.td, opacity: 0.8 }}>
                        No hay gastos todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : tab === "balance" ? (
          <>
            {bError && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(239,68,68,.12)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: "#fecaca",
                  fontWeight: 900,
                }}
              >
                ❌ {bError}
              </div>
            )}

            <div style={s.statsGrid}>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total ingresos</div>
                <div style={s.statValue}>{bLoading ? "…" : moneyEUR(balanceStats.totalIngresos)}</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total gastos</div>
                <div style={s.statValue}>{bLoading ? "…" : moneyEUR(balanceStats.totalGastos)}</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Balance total</div>
                <div style={s.statValue}>{bLoading ? "…" : moneyEUR(balanceStats.totalBalance)}</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Meses</div>
                <div style={s.statValue}>{bLoading ? "…" : balanceStats.meses}</div>
              </div>
            </div>

            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
              <div style={s.row}>
                <span style={s.badge}>Meses: {balance.length}</span>
                {bLoading ? <span style={s.badge}>Cargando…</span> : <span style={s.badge}>Listo</span>}
              </div>

              <div style={s.row}>
                <button onClick={fetchBalance} style={s.btn} disabled={bLoading}>
                  🔄 Refrescar
                </button>
                <button onClick={exportBalanceCSV} style={s.btn} disabled={bLoading || balance.length === 0}>
                  📥 Excel (CSV)
                </button>
                <button onClick={printBalance} style={s.btn} disabled={bLoading || balance.length === 0}>
                  🖨️ PDF / Imprimir
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, overflow: "hidden" }}>
              <table style={s.table}>
                <thead style={{ background: "rgba(255,255,255,.06)" }}>
                  <tr>
                    <th style={s.th}>Mes</th>
                    <th style={s.th}>Ingresos</th>
                    <th style={s.th}>Gastos</th>
                    <th style={s.th}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.map((r, idx) => (
                    <tr key={`${r.mes ?? "null"}-${idx}`}>
                      <td style={{ ...s.td, fontWeight: 1000 }}>{r.mes ?? "-"}</td>
                      <td style={s.td}>{moneyEUR(safeNum(r.ingresos))}</td>
                      <td style={s.td}>{moneyEUR(safeNum(r.gastos))}</td>
                      <td style={{ ...s.td, fontWeight: 1000 }}>{moneyEUR(safeNum(r.balance))}</td>
                    </tr>
                  ))}

                  {balance.length === 0 && !bLoading && (
                    <tr>
                      <td colSpan={4} style={{ ...s.td, opacity: 0.8 }}>
                        No hay datos de balance todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {lError && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(239,68,68,.12)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: "#fecaca",
                  fontWeight: 900,
                }}
              >
                ❌ {lError}
              </div>
            )}

            <div style={s.statsGrid}>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Registros</div>
                <div style={s.statValue}>{lLoading ? "…" : libroStats.count}</div>
                <div style={s.statSub}>Movimientos mostrados</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total ingresos</div>
                <div style={s.statValue}>{lLoading ? "…" : moneyEUR(libroStats.totalIngresos)}</div>
                <div style={s.statSub}>Ventas + ingresos manuales</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total gastos</div>
                <div style={s.statValue}>{lLoading ? "…" : moneyEUR(libroStats.totalGastos)}</div>
                <div style={s.statSub}>Gastos + gastos manuales</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Saldo final</div>
                <div style={s.statValue}>{lLoading ? "…" : moneyEUR(libroStats.saldoFinal)}</div>
                <div style={s.statSub}>Acumulado (inicia en 0)</div>
              </div>
            </div>

            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
              <div style={s.row}>{lLoading ? <span style={s.badge}>Cargando…</span> : <span style={s.badge}>Listo</span>}</div>

              <div style={s.row}>
                <button
                  onClick={() => setOpOpen(true)}
                  style={{
                    ...s.btnPrimary,
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    padding: 0,
                    fontSize: 24,
                    lineHeight: "44px",
                  }}
                  title="Nueva operación (Libro diario)"
                  type="button"
                >
                  +
                </button>

                <button onClick={fetchLibroAll} style={s.btn} disabled={lLoading}>
                  🔄 Refrescar
                </button>
                <button onClick={exportLibroCSV} style={s.btn} disabled={lLoading || libroRows.length === 0}>
                  📥 Excel (CSV)
                </button>
                <button onClick={printLibro} style={s.btn} disabled={lLoading || libroRows.length === 0}>
                  🖨️ PDF / Imprimir
                </button>
              </div>
            </div>

            {opOpen && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 999,
                  background: "rgba(0,0,0,.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: 900,
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,.14)",
                    background: "#0b1220",
                    boxShadow: "0 25px 80px rgba(0,0,0,.55)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ ...s.row, justifyContent: "space-between", padding: 14, borderBottom: "1px solid rgba(255,255,255,.10)" }}>
                    <div style={{ fontWeight: 1000 }}>➕ Nueva operación — Libro diario</div>
                    <button
                      onClick={() => {
                        setOpOpen(false);
                        opReset();
                      }}
                      style={s.btn}
                      type="button"
                    >
                      ✕ Cerrar
                    </button>
                  </div>

                  <form onSubmit={opSaveUIOnly} style={{ padding: 14 }}>
                    <div
                      style={{
                        marginBottom: 12,
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,.12)",
                        background: "rgba(255,255,255,.05)",
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontWeight: 1000 }}>Tipo de operación:</span>

                      <label style={{ display: "flex", alignItems: "center", gap: 8, ...s.badge }}>
                        <input type="radio" name="opTipo" checked={opTipo === "GASTO"} onChange={() => setOpTipo("GASTO")} />
                        GASTO
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: 8, ...s.badge }}>
                        <input type="radio" name="opTipo" checked={opTipo === "INGRESO"} onChange={() => setOpTipo("INGRESO")} />
                        INGRESO
                      </label>

                      <span style={{ opacity: 0.8, fontSize: 12 }}>
                        Seleccionado: <b>{opTipo}</b>
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 10 }}>
                      <div style={{ gridColumn: "span 3" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Fecha</div>
                        <input type="date" value={op.fecha} onChange={(e) => opSet("fecha", e.target.value)} style={{ ...s.input, width: "100%" }} />
                      </div>

                      <div style={{ gridColumn: "span 5" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Proveedor/Persona</div>
                        <input
                          value={op.proveedor}
                          onChange={(e) => opSet("proveedor", e.target.value)}
                          style={{ ...s.input, width: "100%" }}
                          placeholder="Ej: AHMED MAHDAD"
                        />
                      </div>

                      <div style={{ gridColumn: "span 4" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Factura No</div>
                        <input
                          value={op.factura_no}
                          onChange={(e) => opSet("factura_no", e.target.value)}
                          style={{ ...s.input, width: "100%" }}
                          placeholder="Ej: Recibo S/N"
                        />
                      </div>

                      <div style={{ gridColumn: "span 12" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Productos/Servicios</div>
                        <input
                          value={op.productos_servicios}
                          onChange={(e) => opSet("productos_servicios", e.target.value)}
                          style={{ ...s.input, width: "100%" }}
                          placeholder="Ej: Cafetera + Molinos"
                        />
                      </div>

                      <div style={{ gridColumn: "span 3" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Monto Total</div>
                        <input
                          type="number"
                          step="0.01"
                          value={String(op.monto_total)}
                          onChange={(e) => opSet("monto_total", safeNum(e.target.value))}
                          style={{ ...s.input, width: "100%" }}
                        />
                      </div>

                      <div style={{ gridColumn: "span 3" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>IVA</div>
                        <input type="number" step="0.01" value={String(op.iva)} onChange={(e) => opSet("iva", safeNum(e.target.value))} style={{ ...s.input, width: "100%" }} />
                      </div>

                      <div style={{ gridColumn: "span 3" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Neto (auto)</div>
                        <input value={opNetoAuto.toFixed(2)} readOnly style={{ ...s.input, width: "100%", opacity: 0.85 }} />
                      </div>

                      <div style={{ gridColumn: "span 3" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Modo de pago</div>
                        <select value={op.modo_pago} onChange={(e) => opSet("modo_pago", e.target.value)} style={{ ...s.input, width: "100%" }}>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div style={{ gridColumn: "span 12" }}>
                        <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Observación</div>
                        <textarea
                          value={op.observacion}
                          onChange={(e) => opSet("observacion", e.target.value)}
                          style={{ ...s.input, width: "100%", minHeight: 90 }}
                          placeholder='Ej: "Se pagó sin factura, N/A para la declaración"'
                        />
                      </div>
                    </div>

                    <div style={{ ...s.row, justifyContent: "flex-end", marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpOpen(false);
                          opReset();
                        }}
                        style={s.btn}
                      >
                        Cancelar
                      </button>

                      <button type="submit" style={s.btnPrimary} disabled={!opCanSave}>
                        Guardar operación
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={{ ...s.row, marginBottom: 12 }}>
              <input type="date" value={lDesde} onChange={(e) => setLDesde(e.target.value)} style={s.input} />
              <input type="date" value={lHasta} onChange={(e) => setLHasta(e.target.value)} style={s.input} />

              <input
                value={lCat}
                onChange={(e) => setLCat(e.target.value)}
                placeholder="Filtrar categoría (opcional) - incluye VENTAS"
                style={{ ...s.input, width: 280 }}
                list="cat-sugs-libro"
              />

              <input value={lQ} onChange={(e) => setLQ(e.target.value)} placeholder="Buscar (concepto/categoría/ref/fecha)" style={{ ...s.input, width: 280 }} />

              <button onClick={fetchLibroAll} style={s.btn} disabled={lLoading}>
                Aplicar filtros
              </button>

              <button
                onClick={() => {
                  setLDesde("");
                  setLHasta("");
                  setLCat("");
                  setLQ("");
                  setTimeout(fetchLibroAll, 0);
                }}
                style={s.btn}
                disabled={lLoading}
              >
                Limpiar
              </button>
            </div>

            <datalist id="cat-sugs-libro">
              {["VENTAS", "INGRESOS", "GASTOS", ...categoriasOpciones].map((c) => (
                <option key={`lib-${c}`} value={c} />
              ))}
            </datalist>

            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, overflow: "hidden" }}>
              <table style={s.table}>
                <thead style={{ background: "rgba(255,255,255,.06)" }}>
                  <tr>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Tipo</th>
                    <th style={s.th}>Concepto</th>
                    <th style={s.th}>Categoría</th>
                    <th style={s.th}>Monto</th>
                    <th style={s.th}>Saldo</th>
                  </tr>
                </thead>

                <tbody>
                  {libroRows.map((r) => (
                    <tr key={`row-${r.ref}`}>
                      <td style={s.td}>{r.fecha}</td>
                      <td style={s.td}>{r.tipo === "INGRESO" ? <span style={s.badgeIngreso}>INGRESO</span> : <span style={s.badgeGasto}>GASTO</span>}</td>
                      <td style={{ ...s.td, fontWeight: 800 }}>{r.concepto}</td>
                      <td style={s.td}>
                        <span style={s.badge}>{r.categoria}</span>
                      </td>
                      <td style={{ ...s.td, fontWeight: 1000 }}>{moneyEUR(r.monto)}</td>
                      <td style={{ ...s.td, fontWeight: 1000 }}>{moneyEUR(r.saldo)}</td>
                    </tr>
                  ))}

                  {libroRows.length === 0 && !lLoading && (
                    <tr>
                      <td colSpan={6} style={{ ...s.td, opacity: 0.8 }}>
                        No hay movimientos para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
              Nota: Ingresos desde <b>/pedidos_historial</b> (solo <b>entregado</b>) + movimientos manuales desde <b>/contabilidad/movimientos</b>.
            </div>
          </>
        )}
      </div>
    </main>
  );
}
