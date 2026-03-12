"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import XLSXStyle from "xlsx-js-style";

type Gasto = {
  id: number;
  fecha: string | null; // YYYY-MM-DD
  concepto: string;
  monto: number;
  categoria: string;
  created_at?: string | null;
};

type GastoRow = Gasto & { _fromMov: boolean };


type LibroRow = {
  fecha: string; // YYYY-MM-DD
  tipo: "INGRESO" | "GASTO";
  concepto: string;
  categoria: string;
  monto: number; // siempre positivo
  ref: string; // "GASTO#id" | "MOV#id"
  saldo: number; // acumulado
  refType: "GASTO" | "MOV";
  meta?: any;
};

// ✅ Form para crear operación del Libro Diario (GASTO / MOV)
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

// ✅ Cierre de caja (INGRESO manual)
type CierreCajaForm = {
  fecha: string; // YYYY-MM-DD
  concepto: string;
  nro_cierre: string;
  tpv_santander: number;
  tpv_caixabank: number;
  efectivo_recibido: number;
  gastos_menores: number;
  observacion: string;
};

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
    url.includes("localhost") || url.includes("127.0.0.1") || url.includes("0.0.0.0");

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


function parseCierreObs(raw: any) {
  const text = String(raw ?? "").replace(/\r/g, "");
  if (!text.trim()) return { note: "", fields: {} as Record<string, string> };

  const keyMap: Record<string, string> = {
    "nro cierre": "Nro Cierre",
    "tpv santander": "TPV Santander",
    "tpv caixabank": "TPV Caixabank",
    "total tpv": "Total TPV",
    "efectivo recibido": "Efectivo recibido",
    "total venta diaria": "Total venta diaria",
    "gastos menores": "Gastos menores",
  };

  const fields: Record<string, string> = {};
  const noteLines: string[] = [];
  let inFields = false;

  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) continue;

    const m = t.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      const k = m[1].trim().toLowerCase();
      const v = (m[2] ?? "").trim();
      const pretty = keyMap[k];
      if (pretty) {
        fields[pretty] = v;
        inFields = true;
        continue;
      }
    }

    if (!inFields) noteLines.push(t);
  }

  return { note: noteLines.join("\n").trim(), fields };
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
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
    .map((r) => `<tr>${r.map((c) => `<td>${String(c ?? "")}</td>`).join("")}</tr>`)
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
  window.onload = function() { window.focus(); window.print(); };
</script>
</body>
</html>
  `.trim();

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) return alert("Tu navegador bloqueó la ventana de impresión. Permite pop-ups para imprimir.");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
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

// ✅ Fuerza YYYY-MM-DD aunque el navegador muestre MM/DD/YYYY
function toYMD(dateValue: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
  const d = new Date(dateValue);
  if (!Number.isFinite(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ContabilidadPage() {
  const baseUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  const [tab, setTab] = useState<"gastos" | "ingresos" | "balance" | "libro">("gastos");

  // ✅ Modal NUEVA OPERACION (Libro diario)
  const [opOpen, setOpOpen] = useState(false);
  const [opTipo, setOpTipo] = useState<"GASTO" | "INGRESO">("GASTO");
  const [opSaving, setOpSaving] = useState(false);

  // ✅ Modo edición (cuando abrimos desde Detalle)
  const [opEdit, setOpEdit] = useState<null | { refType: "GASTO" | "MOV"; id: number }>(
    null
  );

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

  const [cierre, setCierre] = useState<CierreCajaForm>({
    fecha: "",
    concepto: "",
    nro_cierre: "",
    tpv_santander: 0,
    tpv_caixabank: 0,
    efectivo_recibido: 0,
    gastos_menores: 0,
    observacion: "",
  });

  function opSet<K extends keyof DiarioOperacionForm>(key: K, value: DiarioOperacionForm[K]) {
    setOp((prev) => ({ ...prev, [key]: value }));
  }
  function cierreSet<K extends keyof CierreCajaForm>(key: K, value: CierreCajaForm[K]) {
    setCierre((prev) => ({ ...prev, [key]: value }));
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
    setCierre({
      fecha: "",
      concepto: "",
      nro_cierre: "",
      tpv_santander: 0,
      tpv_caixabank: 0,
      efectivo_recibido: 0,
      gastos_menores: 0,
      observacion: "",
    });
    setOpTipo("GASTO");
    setOpSaving(false);
    setOpEdit(null);
  }

  const opNetoAuto = useMemo(() => Math.max(0, safeNum(op.monto_total) - safeNum(op.iva)), [
    op.monto_total,
    op.iva,
  ]);

  const cierreTotalTPV = useMemo(
    () => safeNum(cierre.tpv_santander) + safeNum(cierre.tpv_caixabank),
    [cierre.tpv_santander, cierre.tpv_caixabank]
  );

  const cierreTotalVenta = useMemo(
    () => cierreTotalTPV + safeNum(cierre.efectivo_recibido) - safeNum(cierre.gastos_menores),
    [cierreTotalTPV, cierre.efectivo_recibido, cierre.gastos_menores]
  );

  const opCanSave = useMemo(() => {
    if (opTipo === "GASTO") {
      return (
        !!op.fecha &&
        op.proveedor.trim().length > 0 &&
        op.productos_servicios.trim().length > 0 &&
        safeNum(op.monto_total) > 0
      );
    }
    // INGRESO: cierre de caja manual
    return !!cierre.fecha && safeNum(cierreTotalVenta) > 0;
  }, [opTipo, op, cierre.fecha, cierreTotalVenta]);

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

  // ---------- INGRESOS ----------
  const [iDesde, setIDesde] = useState("");
  const [iHasta, setIHasta] = useState("");
  const [iCat, setICat] = useState("");

  // ---------- LIBRO DIARIO ----------
  const [libroGastos, setLibroGastos] = useState<Gasto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [lLoading, setLLoading] = useState(false);
  const [lError, setLError] = useState<string | null>(null);

  const [lDesde, setLDesde] = useState("");
  const [lHasta, setLHasta] = useState("");
  const [lCat, setLCat] = useState("");
  const [lQ, setLQ] = useState("");

  // ---------- BALANCE MENSUAL filtros ----------
  const [bDesde, setBDesde] = useState("");
  const [bHasta, setBHasta] = useState("");
  const [libroPage, setLibroPage] = useState(1);
  const libroPageSize = 10;
  const [lSortCol, setLSortCol] = useState<"fecha"|"tipo"|"concepto"|"categoria"|"monto"|"saldo">("fecha");
  const [lSortDir, setLSortDir] = useState<"desc"|"asc">("desc");

  const toggleLibroSort = (col: typeof lSortCol) => {
    if (lSortCol === col) {
      setLSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setLSortCol(col);
      setLSortDir("desc");
    }
    setLibroPage(1);
  };

  // ===== DETALLE LIBRO =====
  const [detailOpen, setDetailOpen] = useState(false);
  const [balanceMesSel, setBalanceMesSel] = useState<string>("");
  const [detailRow, setDetailRow] = useState<LibroRow | null>(null);

  function openDetail(r: LibroRow) {
    setDetailRow(r);
    setDetailOpen(true);
  }
  function closeDetail() {
    setDetailOpen(false);
    setDetailRow(null);
  }

  // =====================
  // PROVEEDOR: autocomplete pro (solo GASTO/MOV)
  // =====================
  const [proveedorQuery, setProveedorQuery] = useState("");
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const [proveedorActiveIndex, setProveedorActiveIndex] = useState(-1);
  const proveedorWrapRef = useRef<HTMLDivElement | null>(null);

  const proveedoresBase = useMemo(() => {
    const set = new Set<string>();
    movimientos.forEach((m) => {
      const p = String(m?.proveedor ?? "").trim();
      if (p) set.add(p);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [movimientos]);

  const proveedoresFiltrados = useMemo(() => {
    const q = proveedorQuery.trim().toLowerCase();
    if (!q) return proveedoresBase;
    return proveedoresBase.filter((p) => p.toLowerCase().includes(q));
  }, [proveedorQuery, proveedoresBase]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = proveedorWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setShowProveedorDropdown(false);
        setProveedorActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!opOpen) return;
    setProveedorQuery(String(op?.proveedor ?? ""));
  }, [opOpen, op?.proveedor]);

  function selectProveedor(p: string) {
    opSet("proveedor", p);
    setProveedorQuery(p);
    setShowProveedorDropdown(false);
    setProveedorActiveIndex(-1);
  }

  function renderProveedorLabel(p: string, q: string) {
    const query = q.trim();
    if (!query) return p;
    const idx = p.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return p;
    const a = p.slice(0, idx);
    const b = p.slice(idx, idx + query.length);
    const c = p.slice(idx + query.length);
    return (
      <span>
        {a}
        <b>{b}</b>
        {c}
      </span>
    );
  }

  function openEditFromDetail(row: any) {
    if (!row?.refType || !row?.meta) return;

    const id = Number(String(row.ref).split("#")[1]);

    if (row.refType === "GASTO") {
      setOpTipo("GASTO");
      setOp({
        fecha: row.fecha ?? "",
        proveedor: row.meta?.proveedor ?? "",
        factura_no: row.meta?.factura_no ?? "",
        productos_servicios: row.meta?.productos_servicios ?? row.concepto ?? "",
        monto_total: safeNum(row.monto),
        iva: safeNum(row.meta?.iva ?? 0),
        modo_pago: row.meta?.modo_pago ?? "Transferencia",
        observacion: row.meta?.observacion ?? "",
      });
      setOpEdit({ refType: "GASTO", id });
      setOpOpen(true);
      return;
    }

    if (row.refType === "MOV") {
      setOpTipo(row.tipo === "INGRESO" ? "INGRESO" : "GASTO");

      // ✅ si es INGRESO, lo tratamos como cierre manual (solo lectura/edit simple)
      if (row.tipo === "INGRESO") {
        // intentamos reconstruir campos desde observación (si existen)
        setCierre({
          fecha: row.fecha ?? "",
          concepto: (row.concepto ?? row.meta?.concepto ?? "").trim(),
          nro_cierre: row.meta?.factura_no ?? "",
          tpv_santander: safeNum(row.meta?.tpv_santander ?? 0),
          tpv_caixabank: safeNum(row.meta?.tpv_caixabank ?? 0),
          efectivo_recibido: safeNum(row.meta?.efectivo_recibido ?? 0),
          gastos_menores: safeNum(row.meta?.gastos_menores ?? 0),
          observacion: row.meta?.observacion ?? "",
        });
      } else {
        setOp({
          fecha: row.fecha ?? "",
          proveedor: row.meta?.proveedor ?? "",
          factura_no: row.meta?.factura_no ?? "",
          productos_servicios: row.meta?.productos_servicios ?? row.concepto ?? "",
          monto_total: safeNum(row.monto),
          iva: safeNum(row.meta?.iva ?? 0),
          modo_pago: row.meta?.modo_pago ?? "Transferencia",
          observacion: row.meta?.observacion ?? "",
        });
      }

      setOpEdit({ refType: "MOV", id });
      setOpOpen(true);
    }
  }

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
      // concepto search is filtered client-side
      qs.set("limit", "1000");

      const res = await fetch(`${baseUrl}/gastos?${qs.toString()}`, { cache: "no-store" });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`GET /gastos (HTTP ${res.status}) ${txt}`);
      }

      const data = (await res.json()) as Gasto[];
      setGastos(Array.isArray(data) ? data : []);
      void fetchMovimientos(1000);
    } catch (e: any) {
      setGError(e?.message ?? "Error cargando gastos");
    } finally {
      setGLoading(false);
    }
  };

  const fetchLibroGastos = async () => {
    if (!baseUrl) throw new Error("Falta NEXT_PUBLIC_API_URL en Vercel / .env.local");

    // Sin filtros de fecha/categoría: trae TODOS los gastos para libro y balance
    const qs = new URLSearchParams();
    qs.set("limit", "1000");

    const res = await fetch(`${baseUrl}/gastos?${qs.toString()}`, { cache: "no-store" });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`GET /gastos (Libro) (HTTP ${res.status}) ${txt}`);
    }

    const data = (await res.json()) as Gasto[];
    setLibroGastos(Array.isArray(data) ? data : []);
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

  const fetchLibroAll = async () => {
    setLLoading(true);
    setLError(null);

    try {
      await Promise.all([fetchLibroGastos(), fetchMovimientos(1000)]);
      setLLoading(false);
    } catch (e: any) {
      setLError(e?.message ?? "Error cargando libro diario");
      setLLoading(false);
    }
  };

  // ✅ Guardar operación (GASTO/MOV) o CIERRE (INGRESO)
  async function opSaveUIOnly(e: React.FormEvent) {
    e.preventDefault();

    if (!baseUrl) {
      alert("Falta NEXT_PUBLIC_API_URL");
      return;
    }

    if (!opCanSave) {
      if (opTipo === "GASTO") {
        alert("Completa: Fecha + Proveedor + Productos/Servicios + Monto Total (>0).");
      } else {
        alert("Completa: Fecha + (TPV o Efectivo) para que Total venta diaria sea > 0.");
      }
      return;
    }

    try {
      setOpSaving(true);

      const isEditing = !!opEdit;
      let url = `${baseUrl}/contabilidad/movimientos`;
      let method: "POST" | "PUT" = "POST";
      let body: any = null;

      if (opTipo === "GASTO") {
        const fechaYMD = toYMD(op.fecha);
        if (!fechaYMD) {
          alert("Fecha inválida. Elige la fecha desde el calendario.");
          return;
        }

        const payload = {
          fecha: fechaYMD,
          tipo: "GASTO",
          concepto: op.productos_servicios,
          categoria: "GASTOS",
          monto: safeNum(op.monto_total),
          iva: safeNum(op.iva),
          proveedor: op.proveedor,
          factura_no: op.factura_no,
          productos_servicios: op.productos_servicios,
          modo_pago: op.modo_pago,
          observacion: op.observacion,
        };

        // ✅ si edita GASTO: va a /gastos/:id (BODY SEGURO: solo 4 campos)
        if (opEdit?.refType === "GASTO") {
          url = `${baseUrl}/gastos/${opEdit.id}`;
          method = "PUT";
          body = {
            fecha: payload.fecha,
            concepto: payload.concepto,
            monto: payload.monto,
            categoria: payload.categoria,
          };
        } else {
          // ✅ MOV (nuevo o editar)
          if (opEdit?.refType === "MOV") {
            url = `${baseUrl}/contabilidad/movimientos/${opEdit.id}`;
            method = "PUT";
          }
          body = payload;
        }
      } else {
        // ✅ INGRESO = CIERRE DE CAJA manual
        const fechaYMD = toYMD(cierre.fecha);
        if (!fechaYMD) {
          alert("Fecha inválida. Elige la fecha desde el calendario.");
          return;
        }

        const nro = (cierre.nro_cierre ?? "").trim();
        const conceptoUser = (cierre.concepto ?? "").trim();
        const concepto = conceptoUser || (nro ? `CIERRE DE CAJA #${nro}` : "CIERRE DE CAJA");
        const totalTPV = safeNum(cierreTotalTPV);
        const efectivo = safeNum(cierre.efectivo_recibido);
        const totalVenta = safeNum(cierreTotalVenta);
        const gastosMenores = safeNum(cierre.gastos_menores);

        const obs =
          (cierre.observacion ?? "").trim() +
          (cierre.observacion?.trim() ? "\n\n" : "") +
          [
            `Nro Cierre: ${nro || "-"}`,
            `TPV Santander: ${moneyEUR(safeNum(cierre.tpv_santander))}`,
            `TPV Caixabank: ${moneyEUR(safeNum(cierre.tpv_caixabank))}`,
            `Total TPV: ${moneyEUR(totalTPV)}`,
            `Efectivo recibido: ${moneyEUR(efectivo)}`,
            `Total venta diaria: ${moneyEUR(totalVenta)}`,
            `Gastos menores: ${moneyEUR(gastosMenores)}`,
          ].join("\n");

        const payload = {
          fecha: fechaYMD,
          tipo: "INGRESO",
          concepto,
          categoria: "INGRESOS",
          monto: totalVenta,
          iva: 0,
          proveedor: "",
          factura_no: nro || "",
          productos_servicios: "CIERRE DE CAJA",
          modo_pago: "Mixto",
          observacion: obs,
          // meta útil (si tu backend lo ignora, no pasa nada)
          tpv_santander: safeNum(cierre.tpv_santander),
          tpv_caixabank: safeNum(cierre.tpv_caixabank),
          efectivo_recibido: efectivo,
          gastos_menores: gastosMenores,
          total_tpv: totalTPV,
          total_venta_diaria: totalVenta,
        };

        if (opEdit?.refType === "MOV") {
          url = `${baseUrl}/contabilidad/movimientos/${opEdit.id}`;
          method = "PUT";
        }
        body = payload;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const txt = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`${method} ${url} (HTTP ${res.status}) ${txt}`);

      setOpOpen(false);
      opReset();

      void fetchMovimientos(1000);
      if (tab === "libro") void fetchLibroGastos();

      alert(isEditing ? "✅ Operación actualizada" : "✅ Operación guardada");
    } catch (err: any) {
      console.error("❌ ERROR GUARDANDO:", err);
      alert(err?.message ?? "Error guardando operación");
    } finally {
      setOpSaving(false);
    }
  }

  const createGasto = async () => {
    if (!baseUrl) return;

    const concepto = newConcepto.trim();
    const montoNum = Number(newMonto);
    const categoria = up(newCategoria) || "OTROS";
    const fecha = newFecha.trim() || null;

    if (!concepto) return setGError("Concepto requerido");
    if (!Number.isFinite(montoNum) || montoNum < 0) return setGError("Monto inválido (>= 0)");

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
    if (!Number.isFinite(montoNum) || montoNum < 0) return setGError("Monto inválido (>= 0)");

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

  const deleteMovimiento = async (id: number) => {
    if (!baseUrl) return alert("Falta NEXT_PUBLIC_API_URL");

    const ok = confirm(`¿Borrar movimiento ID ${id}?`);
    if (!ok) return;

    setGBusy(true);
    try {
      const res = await fetch(`${baseUrl}/contabilidad/movimientos/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const txt = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`DELETE movimientos (HTTP ${res.status}) ${txt}`);

      setMovimientos((prev) => prev.filter((m) => m.id !== id));

      void fetchMovimientos(1000);
      if (tab === "gastos") void fetchGastos();
      if (tab === "libro") void fetchLibroAll();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Error borrando movimiento");
    } finally {
      setGBusy(false);
    }
  };

  const deleteGastoFromLibro = async (id: number) => {
    if (!baseUrl) return alert("Falta NEXT_PUBLIC_API_URL");

    const ok = confirm(`¿Borrar gasto ID ${id}?`);
    if (!ok) return;

    setGBusy(true);
    try {
      const res = await fetch(`${baseUrl}/gastos/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const txt = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`DELETE gastos (HTTP ${res.status}) ${txt}`);

      setLibroGastos((prev) => prev.filter((g) => g.id !== id));
      setGastos((prev) => prev.filter((g) => g.id !== id));

      await Promise.all([fetchGastos(), fetchLibroAll()]);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Error borrando gasto");
    } finally {
      setGBusy(false);
    }
  };

  const categoriasDetectadas = useMemo(() => {
    const set = new Set<string>();
    for (const g of gastos) set.add(up(g.categoria) || "OTROS");
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [gastos]);

  useEffect(() => {
    try {
      const prev = new Set(readCatsLS());
      for (const c of categoriasDetectadas) prev.add(up(c));
      prev.add("OTROS");
      writeCatsLS(Array.from(prev).filter(Boolean).sort((a, b) => a.localeCompare(b)));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriasDetectadas.join("|")]);

  useEffect(() => {
    if (tab === "libro") setLibroPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, lDesde, lHasta, lQ]);

  const categoriasOpciones = useMemo(() => {
    const set = new Set<string>();
    set.add("OTROS");
    for (const c of readCatsLS()) set.add(up(c));
    for (const c of categoriasDetectadas) set.add(up(c));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [categoriasDetectadas]);

  const gastosAll = useMemo<GastoRow[]>(() => {
    const fromGastos: GastoRow[] = gastos
      .filter((g) => {
        if (cat.trim() && !up(g.concepto ?? "").includes(up(cat))) return false;
        return true;
      })
      .map((g) => ({ ...g, _fromMov: false }));
    const fromMovs: GastoRow[] = movimientos
      .filter((m) => {
        if (m.tipo !== "GASTO") return false;
        const mFecha = m.fecha ?? "";
        if (desde.trim() && mFecha && mFecha < desde.trim()) return false;
        if (hasta.trim() && mFecha && mFecha > hasta.trim()) return false;
        if (cat.trim() && !up(m.concepto ?? "").includes(up(cat))) return false;
        return true;
      })
      .map((m) => ({
        id: m.id,
        fecha: m.fecha ?? null,
        concepto: m.concepto ?? "",
        monto: safeNum(m.monto),
        categoria: m.categoria ?? "GASTOS",
        created_at: m.created_at,
        _fromMov: true,
      }));

    const all = [...fromGastos, ...fromMovs];
    return all.sort((a, b) => {
      const da = a.fecha ?? a.created_at ?? "";
      const db = b.fecha ?? b.created_at ?? "";
      return db.localeCompare(da);
    });
  }, [gastos, movimientos, desde, hasta, cat]);

  const gastosStats = useMemo(() => {
    const rows = gastosAll;
    const total = rows.reduce((acc, g) => acc + safeNum(g.monto), 0);
    const count = rows.length;
    const avg = count ? total / count : 0;

    let max = 0;
    let maxRow: GastoRow | null = null;
    for (const g of rows) {
      const m = safeNum(g.monto);
      if (m >= max) {
        max = m;
        maxRow = g;
      }
    }
    return { count, total, avg, max, maxRow };
  }, [gastosAll]);

  const ingresosAll = useMemo<Movimiento[]>(() => {
    return movimientos
      .filter((m) => {
        if (m.tipo !== "INGRESO") return false;
        const mFecha = m.fecha ?? "";
        if (iDesde.trim() && mFecha && mFecha < iDesde.trim()) return false;
        if (iHasta.trim() && mFecha && mFecha > iHasta.trim()) return false;
        if (iCat.trim() && !up(m.concepto ?? "").includes(up(iCat))) return false;
        return true;
      })
      .sort((a, b) => {
        const da = a.fecha ?? a.created_at ?? "";
        const db = b.fecha ?? b.created_at ?? "";
        return db.localeCompare(da);
      });
  }, [movimientos, iDesde, iHasta, iCat]);

  const ingresosStats = useMemo(() => {
    const total = ingresosAll.reduce((acc, m) => acc + safeNum(m.monto), 0);
    const count = ingresosAll.length;
    const avg = count ? total / count : 0;
    let max = 0;
    let maxRow: Movimiento | null = null;
    for (const m of ingresosAll) {
      const v = safeNum(m.monto);
      if (v >= max) { max = v; maxRow = m; }
    }
    return { count, total, avg, max, maxRow };
  }, [ingresosAll]);

  const exportIngresosCSV = () => {
    const header = ["ID", "Fecha", "Concepto", "Categoría", "Monto", "Modo Pago"];
    const lines = [
      header.join(","),
      ...ingresosAll.map((m) =>
        [m.id, m.fecha ?? "", `"${(m.concepto ?? "").replace(/"/g, '""')}"`, up(m.categoria), safeNum(m.monto).toFixed(2), m.modo_pago ?? ""].join(",")
      ),
      `# Total: ${moneyEUR(ingresosStats.total)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ingresos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printIngresos = () => {
    const rows = ingresosAll;
    const html = `<html><head><title>Ingresos</title><style>
      body{font-family:sans-serif;font-size:12px;color:#111}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}
      th{background:#f3f4f6;font-weight:700}
      h2{margin-bottom:4px}p{margin:2px 0 12px}
    </style></head><body>
      <h2>Ingresos</h2>
      <p>Total: <b>${moneyEUR(ingresosStats.total)}</b> · Registros: <b>${ingresosStats.count}</b></p>
      <table><thead><tr><th>ID</th><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Monto</th><th>Modo Pago</th></tr></thead><tbody>
      ${rows.map((m) => `<tr><td>${m.id}</td><td>${m.fecha ?? "-"}</td><td>${m.concepto ?? ""}</td><td>${up(m.categoria)}</td><td>€ ${safeNum(m.monto).toFixed(2)}</td><td>${m.modo_pago ?? ""}</td></tr>`).join("")}
      </tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const exportGastosCSV = () => {
    const rows = gastosAll;
    const header = ["ID", "Fecha", "Concepto", "Monto", "Categoría"];
    const lines = [
      header.map(csvEscape).join(","),
      ...rows.map((g) =>
        [g.id, g.fecha ?? "", g.concepto ?? "", safeNum(g.monto).toFixed(2), up(g.categoria) || "OTROS"]
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

  const exportGastosXLSX = () => {
    const meses = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    let mesLabel = desde || hasta || (gastosAll[gastosAll.length - 1]?.fecha ?? "");
    const mesStr = mesLabel.length >= 7
      ? `${meses[parseInt(mesLabel.slice(5, 7)) - 1] ?? ""}  ${mesLabel.slice(0, 4)}`
      : "";

    const COLS = 10;
    const border = (style = "thin") => ({ style, color: { rgb: "BBBBBB" } });

    const sectionStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFA500" } },
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    };
    const colHdrStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFFF00" } },
      font: { bold: true, italic: true, sz: 11 },
      alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    };
    const dataStyle = (yellow: boolean) => ({
      fill: yellow ? { patternType: "solid" as const, fgColor: { rgb: "FFFF99" } } : undefined,
      alignment: { vertical: "center" as const, wrapText: true },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    });
    const totalsStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFA500" } },
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: { top: border("medium"), bottom: border("medium"), left: border(), right: border() },
    };
    const titleStyle = (sz = 14) => ({ font: { bold: true, sz }, alignment: { horizontal: "left" as const, vertical: "center" as const } });

    const numFmt = "#,##0.00";

    const aoa: any[][] = [
      Array(COLS).fill(""),
      ["", "", "", "EL RINCON DE DOMINGO", ...Array(COLS - 4).fill("")],
      ["", "", "", "Libro de Compras, Servicios y Gastos", ...Array(COLS - 4).fill("")],
      ["", "", "", mesStr, ...Array(COLS - 4).fill("")],
      Array(COLS).fill(""),
      Array(COLS).fill(""),
      Array(COLS).fill(""),
      ["Libro de Compras y Servicios", ...Array(COLS - 1).fill("")],
      ["Fecha","Proveedor/Persona","Factura No","Productos/servicios","Monto Total","IVA","Neto","Modo de Pago","Ref/Nro.","Observacion"],
    ];

    let totMonto = 0, totIVA = 0, totNeto = 0;

    for (let i = 0; i < gastosAll.length; i++) {
      const g = gastosAll[i];
      let proveedor = "", factura = "", productos = g.concepto ?? "", modoPago = "", ref = "", obs = "";
      let iva = 0, neto = 0;

      if (g._fromMov) {
        const mov = movimientos.find((m) => m.id === g.id);
        if (mov) {
          proveedor = mov.proveedor ?? "";
          factura   = mov.factura_no ?? "";
          productos = mov.productos_servicios ?? mov.concepto ?? g.concepto ?? "";
          modoPago  = mov.modo_pago ?? "";
          obs       = mov.observacion ?? "";
          iva       = safeNum(mov.iva);
          neto      = safeNum(mov.neto);
          ref       = mov.factura_no ?? "";
        }
      }

      totMonto += safeNum(g.monto);
      totIVA   += iva;
      totNeto  += neto;

      aoa.push([g.fecha ?? "", proveedor, factura, productos, safeNum(g.monto), iva || "", neto || "", modoPago, ref, obs]);
    }

    aoa.push(["TOTAL", "", "", "", totMonto, totIVA || "", totNeto || "", "", "", ""]);

    const ws: any = XLSXStyle.utils.aoa_to_sheet(aoa);

    ws["!merges"] = [
      { s: { r: 1, c: 3 }, e: { r: 1, c: 9 } },
      { s: { r: 2, c: 3 }, e: { r: 2, c: 9 } },
      { s: { r: 3, c: 3 }, e: { r: 3, c: 9 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 9 } },
    ];

    ws["!cols"] = [
      { wch: 13 }, { wch: 28 }, { wch: 18 }, { wch: 36 },
      { wch: 13 }, { wch: 9 }, { wch: 9 }, { wch: 14 }, { wch: 18 }, { wch: 38 },
    ];

    ws["!rows"] = Array(aoa.length).fill({ hpt: 18 });
    ws["!rows"][8] = { hpt: 28 };

    const applyStyle = (r: number, c: number, s: any) => {
      const ref = XLSXStyle.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = s;
    };

    // Títulos
    [1, 2, 3].forEach((row) => {
      const sz = row === 1 ? 15 : row === 2 ? 13 : 12;
      applyStyle(row, 3, titleStyle(sz));
    });

    // Sección header (R7) y col headers (R8)
    for (let c = 0; c < COLS; c++) {
      applyStyle(7, c, sectionStyle);
      applyStyle(8, c, colHdrStyle);
    }

    // Filas de datos
    const DATA_START = 9;
    for (let i = 0; i < gastosAll.length; i++) {
      const yellow = i % 4 === 3; // cada 4ta fila amarilla, como en la foto
      const st = dataStyle(yellow);
      for (let c = 0; c < COLS; c++) {
        const ref = XLSXStyle.utils.encode_cell({ r: DATA_START + i, c });
        if (!ws[ref]) ws[ref] = { v: "", t: "s" };
        ws[ref].s = st;
        if ((c === 4 || c === 5 || c === 6) && typeof ws[ref].v === "number") ws[ref].z = numFmt;
      }
    }

    // Fila TOTAL
    const totRow = DATA_START + gastosAll.length;
    for (let c = 0; c < COLS; c++) {
      const ref = XLSXStyle.utils.encode_cell({ r: totRow, c });
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = totalsStyle;
      if ((c === 4 || c === 5 || c === 6) && typeof ws[ref].v === "number") ws[ref].z = numFmt;
    }

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Gastos");
    XLSXStyle.writeFile(wb, `gastos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const printGastos = () => {
    const rows = gastosAll;
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
      tableRows: rows.map((g) => [g.id, g.fecha ?? "-", g.concepto ?? "", moneyEUR(safeNum(g.monto)), up(g.categoria) || "OTROS"]),
      footerNote: "Tip: en el diálogo de impresión elige 'Guardar como PDF'.",
    });
  };

  // ---------- LIBRO DIARIO (Gastos + Movimientos manuales) ----------
  const libroRows: LibroRow[] = useMemo(() => {
    const q = lQ.trim().toLowerCase();

    const gastosRows: Omit<LibroRow, "saldo">[] = (Array.isArray(libroGastos) ? libroGastos : []).map((g) => {
      const fecha = ymdFromAny(g.fecha ?? g.created_at ?? "");
      return {
        fecha,
        tipo: "GASTO",
        concepto: g.concepto ?? "",
        categoria: up(g.categoria) || "OTROS",
        monto: safeNum(g.monto),
        ref: `GASTO#${g.id}`,
        refType: "GASTO",
        meta: {
          id: g.id,
          fecha: g.fecha ?? null,
          concepto: g.concepto ?? "",
          categoria: up(g.categoria) || "OTROS",
          monto: safeNum(g.monto),
          created_at: g.created_at ?? null,
        },
      };
    });

    const movRows: Omit<LibroRow, "saldo">[] = (Array.isArray(movimientos) ? movimientos : []).map((m) => {
      const fecha = ymdFromAny(m.fecha ?? m.created_at ?? "");
      const concepto = (m.concepto ?? m.productos_servicios ?? "").trim() || `Movimiento #${m.id}`;
      return {
        fecha,
        tipo: m.tipo === "INGRESO" ? "INGRESO" : "GASTO",
        concepto,
        categoria: up(m.categoria) || "OTROS",
        monto: safeNum(m.monto),
        ref: `MOV#${m.id}`,
        refType: "MOV",
        meta: {
          id: m.id,
          fecha: m.fecha ?? null,
          tipo: m.tipo,
          concepto: m.concepto ?? "",
          categoria: m.categoria ?? "",
          monto: safeNum(m.monto),
          iva: safeNum(m.iva),
          neto: safeNum(m.neto),
          proveedor: m.proveedor ?? null,
          factura_no: m.factura_no ?? null,
          productos_servicios: m.productos_servicios ?? null,
          modo_pago: m.modo_pago ?? null,
          observacion: m.observacion ?? null,
          created_at: m.created_at ?? null,
        },
      };
    });

    const merged = [...gastosRows, ...movRows].filter((r) => {
      if (!r.fecha) return false;
      if (!inRange(r.fecha, lDesde, lHasta)) return false;


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
      if (a.tipo !== b.tipo) return a.tipo === "INGRESO" ? -1 : 1;
      return a.ref.localeCompare(b.ref);
    });

    let saldo = 0;
    return merged.map((r) => {
      if (r.tipo === "INGRESO") saldo += safeNum(r.monto);
      else saldo -= safeNum(r.monto);
      return { ...r, saldo };
    });
  }, [libroGastos, movimientos, lDesde, lHasta, lQ]);

  const libroSorted = useMemo(() => {
    return [...libroRows].sort((a, b) => {
      let cmp = 0;
      if (lSortCol === "monto" || lSortCol === "saldo") {
        cmp = safeNum(a[lSortCol]) - safeNum(b[lSortCol]);
      } else {
        cmp = (a[lSortCol] ?? "").localeCompare(b[lSortCol] ?? "");
      }
      return lSortDir === "asc" ? cmp : -cmp;
    });
  }, [libroRows, lSortCol, lSortDir]);

  const libroStats = useMemo(() => {
    const totalIngresos = libroRows.reduce((acc, r) => acc + (r.tipo === "INGRESO" ? safeNum(r.monto) : 0), 0);
    const totalGastos = libroRows.reduce((acc, r) => acc + (r.tipo === "GASTO" ? safeNum(r.monto) : 0), 0);
    const saldoFinal = libroRows.length ? safeNum(libroRows[libroRows.length - 1].saldo) : 0;
    return { count: libroRows.length, totalIngresos, totalGastos, saldoFinal };
  }, [libroRows]);

  // ---------- BALANCE MENSUAL (derivado 100% de libroRows) ----------
  const balanceFromLibro = useMemo(() => {
    const map = new Map<string, { ingresos: number; gastos: number }>();
    for (const r of libroRows) {
      if (!r.fecha) continue;
      if (bDesde && r.fecha < bDesde) continue;
      if (bHasta && r.fecha > bHasta) continue;
      const mesKey = r.fecha.slice(0, 7) + "-01";
      if (!map.has(mesKey)) map.set(mesKey, { ingresos: 0, gastos: 0 });
      if (r.tipo === "INGRESO") {
        map.get(mesKey)!.ingresos += safeNum(r.monto);
      } else {
        map.get(mesKey)!.gastos += safeNum(r.monto);
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, { ingresos, gastos }]) => ({ mes, ingresos, gastos, balance: ingresos - gastos }));
  }, [libroRows, bDesde, bHasta]);

  const balanceStats = useMemo(() => {
    const totalIngresos = balanceFromLibro.reduce((acc, r) => acc + r.ingresos, 0);
    const totalGastos = balanceFromLibro.reduce((acc, r) => acc + r.gastos, 0);
    const totalBalance = balanceFromLibro.reduce((acc, r) => acc + r.balance, 0);
    return { meses: balanceFromLibro.length, totalIngresos, totalGastos, totalBalance };
  }, [balanceFromLibro]);

  // Detalle del mes seleccionado: todas las transacciones del mes con acumulado diario
  const balanceMesDetalle = useMemo(() => {
    if (!balanceMesSel) return [];
    const rows = libroRows.filter((r) => r.fecha && r.fecha.slice(0, 7) === balanceMesSel.slice(0, 7));
    let acum = 0;
    return rows.map((r) => {
      if (r.tipo === "INGRESO") acum += safeNum(r.monto);
      else acum -= safeNum(r.monto);
      return { ...r, acum };
    });
  }, [libroRows, balanceMesSel]);

  const exportBalanceCSV = () => {
    const lines = [
      ["Mes", "Ingresos", "Gastos", "Balance"].join(","),
      ...balanceFromLibro.map((r) => [r.mes, r.ingresos.toFixed(2), r.gastos.toFixed(2), r.balance.toFixed(2)].join(",")),
    ];
    downloadTextFile(
      `balance_mensual_${new Date().toISOString().slice(0, 10)}.csv`,
      lines.join("\n"),
      "text/csv;charset=utf-8"
    );
  };

  const printBalance = () => {
    openPrintWindow({
      title: "Contabilidad — Balance mensual",
      subtitle: "Resumen mensual desde Libro Diario",
      kpis: [
        { label: "Total ingresos", value: moneyEUR(balanceStats.totalIngresos) },
        { label: "Total gastos", value: moneyEUR(balanceStats.totalGastos) },
        { label: "Balance total", value: moneyEUR(balanceStats.totalBalance) },
        { label: "Meses", value: String(balanceStats.meses) },
      ],
      tableHeaders: ["Mes", "Ingresos", "Gastos", "Balance"],
      tableRows: balanceFromLibro.map((r) => [r.mes, moneyEUR(r.ingresos), moneyEUR(r.gastos), moneyEUR(r.balance)]),
      footerNote: "Tip: en el diálogo de impresión elige 'Guardar como PDF'.",
    });
  };

  const exportLibroCSV = () => {
    const header = ["Fecha", "Tipo", "Concepto", "Categoría", "Monto", "Saldo", "Ref"];
    const lines = [
      header.map(csvEscape).join(","),
      ...libroRows.map((r) =>
        [r.fecha, r.tipo, r.concepto, r.categoria, safeNum(r.monto).toFixed(2), safeNum(r.saldo).toFixed(2), r.ref]
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

  const exportLibroDiarioXLSX = () => {
    const meses = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    const mesLabel = lDesde || lHasta || (libroRows[libroRows.length - 1]?.fecha ?? "");
    const mesStr = mesLabel.length >= 7
      ? `${meses[parseInt(mesLabel.slice(5, 7)) - 1] ?? ""} ${mesLabel.slice(0, 4)}`
      : "";

    const COLS = 6;
    const border = (style = "thin") => ({ style, color: { rgb: "BBBBBB" } });

    const titleStyle = (sz = 14) => ({ font: { bold: true, sz }, alignment: { horizontal: "center" as const, vertical: "center" as const } });
    const sectionStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFA500" } },
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    };
    const colHdrStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFFF00" } },
      font: { bold: true, sz: 11 },
      alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    };
    const dataStyle = (alt: boolean) => ({
      fill: alt ? { patternType: "solid" as const, fgColor: { rgb: "F9F9F9" } } : undefined,
      alignment: { vertical: "center" as const },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    });
    const ingresoStyle = (alt: boolean) => ({
      ...dataStyle(alt),
      font: { color: { rgb: "166534" }, bold: true },
    });
    const gastoStyle = (alt: boolean) => ({
      ...dataStyle(alt),
      font: { color: { rgb: "991B1B" }, bold: true },
    });
    const totalsStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFA500" } },
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: { top: border("medium"), bottom: border("medium"), left: border(), right: border() },
    };
    const numFmt = "#,##0.00";

    const aoa: any[][] = [
      Array(COLS).fill(""),
      ["", "", "EL RINCON DE DOMINGO", "", "", ""],
      ["", "", "Libro Diario (Ingresos + Gastos)", "", "", ""],
      ["", "", mesStr, "", "", ""],
      Array(COLS).fill(""),
      Array(COLS).fill(""),
      Array(COLS).fill(""),
      ["Registro Contable Diario", ...Array(COLS - 1).fill("")],
      ["Fecha", "Tipo", "Concepto", "Categoría", "Monto", "Saldo"],
    ];

    let totIngresos = 0, totGastos = 0;

    for (let i = 0; i < libroRows.length; i++) {
      const r = libroRows[i];
      const monto = safeNum(r.monto);
      const saldo = safeNum(r.saldo);
      if (r.tipo === "INGRESO") totIngresos += monto;
      else totGastos += monto;
      aoa.push([r.fecha ?? "", r.tipo ?? "", r.concepto ?? "", r.categoria ?? "", monto, saldo]);
    }

    aoa.push(["TOTAL", "", `Ingresos: ${moneyEUR(totIngresos)}`, `Gastos: ${moneyEUR(totGastos)}`, totIngresos - totGastos, ""]);

    const ws: any = XLSXStyle.utils.aoa_to_sheet(aoa);

    ws["!merges"] = [
      { s: { r: 1, c: 2 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 2 }, e: { r: 2, c: 5 } },
      { s: { r: 3, c: 2 }, e: { r: 3, c: 5 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 5 } },
    ];

    ws["!cols"] = [
      { wch: 13 }, { wch: 11 }, { wch: 38 }, { wch: 18 }, { wch: 13 }, { wch: 13 },
    ];

    ws["!rows"] = Array(aoa.length).fill({ hpt: 18 });
    ws["!rows"][8] = { hpt: 28 };

    const applyStyle = (r: number, c: number, st: any) => {
      const cellRef = XLSXStyle.utils.encode_cell({ r, c });
      if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
      ws[cellRef].s = st;
    };

    [1, 2, 3].forEach((row) => {
      const sz = row === 1 ? 15 : row === 2 ? 13 : 11;
      applyStyle(row, 2, titleStyle(sz));
    });

    for (let c = 0; c < COLS; c++) {
      applyStyle(7, c, sectionStyle);
      applyStyle(8, c, colHdrStyle);
    }

    const DATA_START = 9;
    for (let i = 0; i < libroRows.length; i++) {
      const r = libroRows[i];
      const alt = i % 2 === 1;
      const isIngreso = r.tipo === "INGRESO";
      for (let c = 0; c < COLS; c++) {
        const cellRef = XLSXStyle.utils.encode_cell({ r: DATA_START + i, c });
        if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
        ws[cellRef].s = c === 1 ? (isIngreso ? ingresoStyle(alt) : gastoStyle(alt)) : dataStyle(alt);
        if ((c === 4 || c === 5) && typeof ws[cellRef].v === "number") ws[cellRef].z = numFmt;
      }
    }

    const totRow = DATA_START + libroRows.length;
    for (let c = 0; c < COLS; c++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: totRow, c });
      if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
      ws[cellRef].s = totalsStyle;
      if (c === 4 && typeof ws[cellRef].v === "number") ws[cellRef].z = numFmt;
    }

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Libro Diario");
    XLSXStyle.writeFile(wb, `libro_diario_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportIngresosXLSX = () => {
    const parseEUR = (s: string) => parseFloat((s ?? "").replace(/[^0-9.,-]/g, "").replace(",", ".")) || 0;

    const ingresos = libroRows.filter((r) => r.tipo === "INGRESO");

    // Calcular mes para el encabezado
    const meses = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    let mesLabel = lDesde || lHasta || (ingresos[ingresos.length - 1]?.fecha ?? "");
    const mesStr = mesLabel.length >= 7
      ? `${meses[parseInt(mesLabel.slice(5, 7)) - 1] ?? ""} ${mesLabel.slice(0, 4)}`
      : "";

    const COLS = 9;
    const border = (style = "thin") => ({ style, color: { rgb: "CCCCCC" } });
    const boldBorder = { top: border("medium"), bottom: border("medium"), left: border(), right: border() };

    // Estilos
    const titleStyle = (sz = 14) => ({ font: { bold: true, sz }, alignment: { horizontal: "center" as const, vertical: "center" as const } });
    const sectionStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFFF00" } },
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    };
    const colHdrStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFA500" } },
      font: { bold: true, sz: 11 },
      alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    };
    const dataStyle = {
      alignment: { vertical: "center" as const },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    };
    const cerradoStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "87CEEB" } },
      font: { bold: true },
      alignment: { vertical: "center" as const },
      border: { top: border(), bottom: border(), left: border(), right: border() },
    };
    const totalsStyle = {
      fill: { patternType: "solid" as const, fgColor: { rgb: "FFA500" } },
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: boldBorder,
    };
    const numFmt = "#,##0.00";

    // Construir filas
    const aoa: any[][] = [
      Array(COLS).fill(""),                                                    // R0
      ["", "", "", "", "EL RINCON DE DOMINGO", "", "", "", ""],                // R1
      ["", "", "", "", "Ingresos Diarios", "", "", "", ""],                    // R2
      ["", "", "", "", mesStr, "", "", "", ""],                                // R3
      Array(COLS).fill(""),                                                    // R4
      Array(COLS).fill(""),                                                    // R5
      Array(COLS).fill(""),                                                    // R6
      ["Ingresos Punto Venta y Efectivo", ...Array(COLS - 1).fill("")],        // R7
      ["Fecha","Nro. Cierre Pto/Liquidacion","TPV Santander","TPV Caixabank","Total  TPV","Efectivo Recibido","Total Venta Diaria","Gastos Menores","Observacion/Note"], // R8
    ];

    const totals = { tpvS: 0, tpvC: 0, tpv: 0, ef: 0, venta: 0, gastos: 0 };

    for (const r of ingresos) {
      const f = parseCierreObs(r.meta?.observacion).fields;
      const tpvS   = parseEUR(f["TPV Santander"] ?? "0");
      const tpvC   = parseEUR(f["TPV Caixabank"] ?? "0");
      const tpv    = parseEUR(f["Total TPV"] ?? "0");
      const ef     = parseEUR(f["Efectivo recibido"] ?? "0");
      const venta  = parseEUR(f["Total venta diaria"] ?? String(r.monto));
      const gastos = parseEUR(f["Gastos menores"] ?? "0");
      const obs    = parseCierreObs(r.meta?.observacion).note || r.concepto || "";
      const nro    = r.meta?.factura_no ?? "";

      totals.tpvS   += tpvS;
      totals.tpvC   += tpvC;
      totals.tpv    += tpv;
      totals.ef     += ef;
      totals.venta  += venta;
      totals.gastos += gastos;

      aoa.push([r.fecha, nro, tpvS || 0, tpvC || 0, tpv || 0, ef || 0, venta, gastos || 0, obs]);
    }

    aoa.push(["TOTAL", "", totals.tpvS, totals.tpvC, totals.tpv, totals.ef, totals.venta, totals.gastos, ""]);

    const ws: any = XLSXStyle.utils.aoa_to_sheet(aoa);

    // Merges
    ws["!merges"] = [
      { s: { r: 1, c: 4 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 4 }, e: { r: 2, c: 8 } },
      { s: { r: 3, c: 4 }, e: { r: 3, c: 8 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 8 } },
    ];

    // Anchos de columna
    ws["!cols"] = [
      { wch: 13 }, { wch: 27 }, { wch: 15 }, { wch: 15 },
      { wch: 13 }, { wch: 17 }, { wch: 19 }, { wch: 15 }, { wch: 42 },
    ];

    // Altura de filas
    ws["!rows"] = Array(aoa.length).fill({ hpt: 18 });
    ws["!rows"][8] = { hpt: 30 }; // header row taller

    // Función para asegurar que la celda existe y aplicar estilo
    const applyStyle = (r: number, c: number, s: any) => {
      const ref = XLSXStyle.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = s;
    };

    // Títulos empresa
    [1, 2, 3].forEach((row) => {
      const sz = row === 1 ? 16 : row === 3 ? 13 : 12;
      applyStyle(row, 4, titleStyle(sz));
    });

    // Sección header (R7) y col headers (R8)
    for (let c = 0; c < COLS; c++) {
      applyStyle(7, c, sectionStyle);
      applyStyle(8, c, colHdrStyle);
    }

    // Filas de datos
    const DATA_START = 9;
    for (let i = 0; i < ingresos.length; i++) {
      const r = ingresos[i];
      const isCerrado = (r.concepto ?? "").toUpperCase().includes("CERRADO");
      for (let c = 0; c < COLS; c++) {
        const ref = XLSXStyle.utils.encode_cell({ r: DATA_START + i, c });
        if (!ws[ref]) ws[ref] = { v: "", t: "s" };
        ws[ref].s = isCerrado ? cerradoStyle : dataStyle;
        if (c >= 2 && c <= 7 && typeof ws[ref].v === "number") ws[ref].z = numFmt;
      }
    }

    // Fila TOTAL
    const totRow = DATA_START + ingresos.length;
    for (let c = 0; c < COLS; c++) {
      const ref = XLSXStyle.utils.encode_cell({ r: totRow, c });
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = totalsStyle;
      if (c >= 2 && c <= 7 && typeof ws[ref].v === "number") ws[ref].z = numFmt;
    }

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Ingresos");
    XLSXStyle.writeFile(wb, `ingresos_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
      tableRows: libroRows.map((r) => [r.fecha, r.tipo, r.concepto, r.categoria, moneyEUR(r.monto), moneyEUR(r.saldo)]),
      footerNote: "Tip: en el diálogo de impresión elige 'Guardar como PDF'.",
    });
  };

  useEffect(() => {
    fetchGastos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "balance" || tab === "libro") fetchLibroAll();
    if (tab === "ingresos") void fetchMovimientos(1000);
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
      padding: "5px 12px",
      borderRadius: 999,
      background: "transparent",
      border: "2px solid rgba(34,197,94,.8)",
      fontSize: 12,
      fontWeight: 900,
      color: "#fff",
    } as React.CSSProperties,
    badgeGasto: {
      padding: "5px 12px",
      borderRadius: 999,
      background: "transparent",
      border: "2px solid rgba(239,68,68,.8)",
      fontSize: 12,
      fontWeight: 900,
      color: "#fff",
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

  // ✅ refs para abrir calendario al click
  const opFechaRef = useRef<HTMLInputElement | null>(null);
  const lDesdeRef = useRef<HTMLInputElement | null>(null);
  const lHastaRef = useRef<HTMLInputElement | null>(null);

  return (
    <main style={s.wrap}>
      <div style={s.card}>
        <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 1000 }}>💰 Contabilidad</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
              API: <span style={{ fontWeight: 900 }}>{baseUrl ?? "(no definido)"}</span>
            </div>
          </div>

          <div style={s.row}>
            <button onClick={() => setTab("gastos")} style={tab === "gastos" ? s.btnPrimary : s.btn}>
              Gastos
            </button>
            <button onClick={() => setTab("ingresos")} style={tab === "ingresos" ? s.btnPrimary : s.btn}>
              Ingresos
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
                <span style={s.badge}>Registros: {gastosAll.length}</span>
                {gLoading ? <span style={s.badge}>Cargando…</span> : <span style={s.badge}>Listo</span>}
              </div>

              <div style={s.row}>
                <button onClick={fetchGastos} style={s.btn} disabled={gLoading || gBusy}>
                  🔄 Refrescar
                </button>
                <button
                  onClick={exportGastosXLSX}
                  style={{ ...s.btn, background: "rgba(234,179,8,.18)", border: "1px solid rgba(234,179,8,.35)", color: "#fde68a" }}
                  disabled={gLoading || gBusy || gastosAll.length === 0}
                >
                  📊 Excel Gastos
                </button>
                <button onClick={printGastos} style={s.btn} disabled={gLoading || gBusy || gastosAll.length === 0}>
                  🖨️ PDF / Imprimir
                </button>
              </div>
            </div>


            <div style={{ ...s.row, marginBottom: 12 }}>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={s.input} />
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={s.input} />
              <input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="Buscar por concepto..." style={{ ...s.input, width: 240 }} />
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
                  </tr>
                </thead>

                <tbody>
                  {gastosAll.map((g) => {
                    const isEditing = !g._fromMov && editingId === g.id;
                    return (
                      <tr key={`${g._fromMov ? "mov" : "gasto"}-${g.id}`}>
                        <td style={{ ...s.td, fontWeight: 1000 }}>
                          {g.id}
                          {g._fromMov && (
                            <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.55, fontWeight: 700 }}>LB</span>
                          )}
                        </td>

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
                            <span style={s.badgeGasto}>{up(g.categoria) || "OTROS"}</span>
                          )}
                        </td>

                      </tr>
                    );
                  })}

                  {gastosAll.length === 0 && !gLoading && (
                    <tr>
                      <td colSpan={5} style={{ ...s.td, opacity: 0.8 }}>
                        No hay gastos todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : tab === "ingresos" ? (
          <>
            <div style={s.statsGrid}>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total ingresos (filtrado)</div>
                <div style={s.statValue}>{lLoading ? "…" : moneyEUR(ingresosStats.total)}</div>
                <div style={s.statSub}>Suma de los registros mostrados</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Promedio por ingreso</div>
                <div style={s.statValue}>{lLoading ? "…" : moneyEUR(ingresosStats.avg)}</div>
                <div style={s.statSub}>Promedio del listado actual</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Ingreso más alto</div>
                <div style={s.statValue}>{lLoading ? "…" : moneyEUR(ingresosStats.max)}</div>
                <div style={s.statSub}>{ingresosStats.maxRow ? `${ingresosStats.maxRow.concepto}` : "—"}</div>
              </div>

              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Registros</div>
                <div style={s.statValue}>{lLoading ? "…" : ingresosStats.count}</div>
                <div style={s.statSub}>{lLoading ? "Cargando…" : "Listo"}</div>
              </div>
            </div>

            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
              <div style={s.row}>
                <span style={s.badge}>Registros: {ingresosAll.length}</span>
                {lLoading ? <span style={s.badge}>Cargando…</span> : <span style={s.badge}>Listo</span>}
              </div>
              <div style={s.row}>
                <button onClick={() => fetchMovimientos(500)} style={s.btn} disabled={lLoading}>
                  🔄 Refrescar
                </button>
                <button
                  onClick={exportIngresosXLSX}
                  style={{ ...s.btn, background: "rgba(34,197,94,.18)", border: "1px solid rgba(34,197,94,.35)", color: "#86efac" }}
                  disabled={lLoading || ingresosAll.length === 0}
                >
                  📊 Excel Ingresos
                </button>
                <button onClick={printIngresos} style={s.btn} disabled={lLoading || ingresosAll.length === 0}>
                  🖨️ PDF / Imprimir
                </button>
              </div>
            </div>

            <div style={{ ...s.row, marginBottom: 12 }}>
              <input type="date" value={iDesde} onChange={(e) => setIDesde(e.target.value)} style={s.input} />
              <input type="date" value={iHasta} onChange={(e) => setIHasta(e.target.value)} style={s.input} />
              <input
                value={iCat}
                onChange={(e) => setICat(e.target.value)}
                placeholder="Buscar por concepto..."
                style={{ ...s.input, width: 240 }}
              />
              <button
                onClick={() => { setIDesde(""); setIHasta(""); setICat(""); }}
                style={s.btn}
                disabled={lLoading}
              >
                Limpiar
              </button>
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, overflow: "hidden" }}>
              <table style={s.table}>
                <thead style={{ background: "rgba(255,255,255,.06)" }}>
                  <tr>
                    <th style={s.th}>ID</th>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Concepto</th>
                    <th style={s.th}>Categoría</th>
                    <th style={s.th}>Monto</th>
                    <th style={s.th}>Modo Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {lLoading && (
                    <tr>
                      <td colSpan={6} style={{ ...s.td, textAlign: "center", opacity: 0.7, padding: 24 }}>
                        Cargando...
                      </td>
                    </tr>
                  )}
                  {!lLoading && ingresosAll.map((m) => (
                    <tr key={`ing-${m.id}`}>
                      <td style={{ ...s.td, fontWeight: 1000 }}>{m.id}</td>
                      <td style={s.td}><span style={{ opacity: 0.9 }}>{m.fecha ?? "-"}</span></td>
                      <td style={s.td}><span style={{ fontWeight: 800 }}>{m.concepto ?? ""}</span></td>
                      <td style={s.td}><span style={s.badgeIngreso}>{up(m.categoria) || "INGRESOS"}</span></td>
                      <td style={s.td}><span style={{ fontWeight: 1000 }}>€ {safeNum(m.monto).toFixed(2)}</span></td>
                      <td style={s.td}><span style={{ opacity: 0.8 }}>{m.modo_pago ?? "—"}</span></td>
                    </tr>
                  ))}
                  {!lLoading && ingresosAll.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...s.td, opacity: 0.8 }}>
                        No hay ingresos todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : tab === "balance" ? (
          <>
            {/* Stats */}
            <div style={s.statsGrid}>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total ingresos</div>
                <div style={{ ...s.statValue, color: "#86efac" }}>{lLoading ? "…" : moneyEUR(balanceStats.totalIngresos)}</div>
              </div>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Total gastos</div>
                <div style={{ ...s.statValue, color: "#fca5a5" }}>{lLoading ? "…" : moneyEUR(balanceStats.totalGastos)}</div>
              </div>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Balance total</div>
                <div style={{ ...s.statValue, color: balanceStats.totalBalance >= 0 ? "#86efac" : "#fca5a5" }}>
                  {lLoading ? "…" : moneyEUR(balanceStats.totalBalance)}
                </div>
              </div>
              <div style={{ ...s.statCard, gridColumn: "span 3" }}>
                <div style={s.statLabel}>Meses</div>
                <div style={s.statValue}>{lLoading ? "…" : balanceStats.meses}</div>
              </div>
            </div>

            {/* Filtro fecha + acciones */}
            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 12 }}>
              <div style={s.row}>
                <input type="date" value={bDesde} onChange={(e) => setBDesde(e.target.value)} style={s.input} title="Desde" />
                <input type="date" value={bHasta} onChange={(e) => setBHasta(e.target.value)} style={s.input} title="Hasta" />
                <button onClick={() => { setBDesde(""); setBHasta(""); }} style={s.btn} disabled={!bDesde && !bHasta}>
                  Limpiar
                </button>
                {lLoading ? <span style={s.badge}>Cargando…</span> : <span style={s.badge}>Meses: {balanceFromLibro.length}</span>}
              </div>
              <div style={s.row}>
                <button onClick={fetchLibroAll} style={s.btn} disabled={lLoading}>🔄 Refrescar</button>
                <button onClick={printBalance} style={s.btn} disabled={lLoading || balanceFromLibro.length === 0}>🖨️ PDF / Imprimir</button>
              </div>
            </div>

            {/* Tabla */}
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
                  {lLoading && (
                    <tr>
                      <td colSpan={4} style={{ ...s.td, textAlign: "center", opacity: 0.7, padding: 24 }}>Cargando...</td>
                    </tr>
                  )}
                  {!lLoading && balanceFromLibro.map((r) => (
                    <tr
                      key={r.mes}
                      onClick={() => setBalanceMesSel(r.mes)}
                      style={{ cursor: "pointer" }}
                      title="Click para ver detalle del mes"
                    >
                      <td style={{ ...s.td, fontWeight: 900 }}>
                        {r.mes}
                        <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.45 }}>▼ ver detalle</span>
                      </td>
                      <td style={{ ...s.td, fontWeight: 900, color: "#86efac" }}>{moneyEUR(r.ingresos)}</td>
                      <td style={{ ...s.td, fontWeight: 900, color: "#fca5a5" }}>{moneyEUR(r.gastos)}</td>
                      <td style={{ ...s.td, fontWeight: 900, color: r.balance >= 0 ? "#86efac" : "#fca5a5" }}>
                        {moneyEUR(r.balance)}
                      </td>
                    </tr>
                  ))}
                  {!lLoading && balanceFromLibro.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ ...s.td, opacity: 0.6, textAlign: "center", padding: 24 }}>
                        No hay datos. Asegúrate de tener registros en el Libro Diario.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MODAL DETALLE MES */}
            {balanceMesSel && (
              <div
                onClick={() => setBalanceMesSel("")}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.15)", borderRadius: 20, width: "100%", maxWidth: 820, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}
                >
                  {/* Header */}
                  <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>📅 Detalle de {balanceMesSel.slice(0, 7)}</div>
                      <div style={{ opacity: 0.55, fontSize: 13, marginTop: 3 }}>{balanceMesDetalle.length} movimientos</div>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <span style={{ color: "#86efac", fontWeight: 900 }}>
                        ↑ {moneyEUR(balanceMesDetalle.filter(r => r.tipo === "INGRESO").reduce((a, r) => a + r.monto, 0))}
                      </span>
                      <span style={{ color: "#fca5a5", fontWeight: 900 }}>
                        ↓ {moneyEUR(balanceMesDetalle.filter(r => r.tipo === "GASTO").reduce((a, r) => a + r.monto, 0))}
                      </span>
                      <span style={{ fontWeight: 900, color: (balanceMesDetalle[balanceMesDetalle.length - 1]?.acum ?? 0) >= 0 ? "#86efac" : "#fca5a5" }}>
                        = {moneyEUR(balanceMesDetalle[balanceMesDetalle.length - 1]?.acum ?? 0)}
                      </span>
                      <button onClick={() => setBalanceMesSel("")} style={{ ...s.btn, padding: "6px 14px" }}>✕ Cerrar</button>
                    </div>
                  </div>

                  {/* Tabla */}
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    <table style={{ ...s.table, borderRadius: 0 }}>
                      <thead style={{ background: "rgba(255,255,255,.06)", position: "sticky", top: 0 }}>
                        <tr>
                          <th style={s.th}>Fecha</th>
                          <th style={s.th}>Tipo</th>
                          <th style={s.th}>Concepto</th>
                          <th style={s.th}>Monto</th>
                          <th style={s.th}>Acumulado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanceMesDetalle.map((r, i) => {
                          const isIngreso = r.tipo === "INGRESO";
                          return (
                            <tr key={`det-${i}`} style={{ borderLeft: `3px solid ${isIngreso ? "rgba(34,197,94,.5)" : "rgba(239,68,68,.5)"}` }}>
                              <td style={{ ...s.td, fontWeight: 700, fontSize: 13, opacity: 0.85 }}>{r.fecha}</td>
                              <td style={s.td}>
                                <span style={isIngreso ? s.badgeIngreso : s.badgeGasto}>{r.tipo}</span>
                              </td>
                              <td style={{ ...s.td, fontWeight: 700, maxWidth: 300 }}>{r.concepto}</td>
                              <td style={{ ...s.td, fontWeight: 900, color: isIngreso ? "#86efac" : "#fca5a5" }}>
                                {isIngreso ? "+" : "-"}{moneyEUR(r.monto)}
                              </td>
                              <td style={{ ...s.td, fontWeight: 900, color: r.acum >= 0 ? "#86efac" : "#fca5a5" }}>
                                {moneyEUR(r.acum)}
                              </td>
                            </tr>
                          );
                        })}
                        {balanceMesDetalle.length === 0 && (
                          <tr><td colSpan={5} style={{ ...s.td, opacity: 0.5, textAlign: "center", padding: 24 }}>Sin movimientos este mes.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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
                <div style={s.statSub}>Cierres + ingresos manuales</div>
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
                  style={{ ...s.btnPrimary, width: 44, height: 44, borderRadius: 999, padding: 0, fontSize: 24, lineHeight: "44px" }}
                  title="Nueva operación (Libro diario)"
                  type="button"
                >
                  +
                </button>

                <button onClick={fetchLibroAll} style={s.btn} disabled={lLoading}>
                  🔄 Refrescar
                </button>
                <button
                  onClick={exportLibroDiarioXLSX}
                  style={{ ...s.btn, background: "rgba(124,58,237,.18)", border: "1px solid rgba(124,58,237,.35)", color: "#c4b5fd" }}
                  disabled={lLoading || libroRows.length === 0}
                >
                  📊 Excel Libro Diario
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
                    <div style={{ fontWeight: 1000 }}>{opEdit ? "✏️ Editar operación" : "➕ Nueva operación — Libro diario"}</div>

                    <button
                      onClick={() => {
                        setOpOpen(false);
                        opReset();
                        setProveedorQuery("");
                        setShowProveedorDropdown(false);
                        setProveedorActiveIndex(-1);
                      }}
                      style={s.btn}
                      type="button"
                    >
                      ✕ Cerrar
                    </button>
                  </div>

                  {/* ✅ UN SOLO FORM */}
                  <form onSubmit={opSaveUIOnly} style={{ padding: 14 }}>
                    {/* ================= TIPO ================= */}
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
                        <input
                          type="radio"
                          name="opTipo"
                          checked={opTipo === "GASTO"}
                          onChange={() => setOpTipo("GASTO")}
                        />
                        GASTO
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: 8, ...s.badge }}>
                        <input
                          type="radio"
                          name="opTipo"
                          checked={opTipo === "INGRESO"}
                          onChange={() => setOpTipo("INGRESO")}
                        />
                        INGRESO (Cierre de caja)
                      </label>

                      <span style={{ opacity: 0.8, fontSize: 12 }}>
                        Seleccionado: <b>{opTipo}</b>
                      </span>
                    </div>

                    {/* ================= CAMPOS (SEGÚN TIPO) ================= */}
                    {opTipo === "GASTO" ? (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 10 }}>
                          <div style={{ gridColumn: "span 3" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Fecha</div>
                            <input
                              ref={opFechaRef}
                              type="date"
                              value={op.fecha}
                              onChange={(e) => opSet("fecha", e.target.value)}
                              onClick={() => {
                                // @ts-ignore
                                opFechaRef.current?.showPicker?.();
                              }}
                              style={{ ...s.input, width: "100%" }}
                            />
                          </div>

                          <div style={{ gridColumn: "span 5" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Proveedor/Persona</div>

                            <div ref={proveedorWrapRef} style={{ position: "relative", width: "100%" }}>
                              <input
                                value={proveedorQuery}
                                placeholder="Ej: AHMED MAHDAD"
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setProveedorQuery(v);
                                  opSet("proveedor", v);
                                  setShowProveedorDropdown(true);
                                  setProveedorActiveIndex(0);
                                }}
                                onFocus={() => {
                                  setShowProveedorDropdown(true);
                                  if (proveedoresFiltrados.length) setProveedorActiveIndex(0);
                                }}
                                onKeyDown={(e) => {
                                  if (!showProveedorDropdown) return;

                                  if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    setProveedorActiveIndex((i) => {
                                      const next = i + 1;
                                      return next >= proveedoresFiltrados.length ? 0 : next;
                                    });
                                  }

                                  if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    setProveedorActiveIndex((i) => {
                                      const prev = i - 1;
                                      return prev < 0 ? Math.max(0, proveedoresFiltrados.length - 1) : prev;
                                    });
                                  }

                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const pick = proveedoresFiltrados[proveedorActiveIndex];
                                    if (pick) selectProveedor(pick);
                                  }

                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    setShowProveedorDropdown(false);
                                    setProveedorActiveIndex(-1);
                                  }
                                }}
                                style={{ ...s.input, width: "100%" }}
                                autoComplete="off"
                              />

                              {showProveedorDropdown && proveedoresFiltrados.length > 0 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "calc(100% + 6px)",
                                    left: 0,
                                    right: 0,
                                    zIndex: 2000,
                                    background: "#0b1220",
                                    border: "1px solid rgba(255,255,255,.16)",
                                    borderRadius: 12,
                                    boxShadow: "0 14px 40px rgba(0,0,0,.45)",
                                    maxHeight: 220,
                                    overflowY: "auto",
                                  }}
                                >
                                  {proveedoresFiltrados.slice(0, 50).map((p, idx) => {
                                    const active = idx === proveedorActiveIndex;
                                    return (
                                      <div
                                        key={p}
                                        onMouseEnter={() => setProveedorActiveIndex(idx)}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          selectProveedor(p);
                                        }}
                                        style={{
                                          padding: "10px 12px",
                                          cursor: "pointer",
                                          background: active ? "rgba(255,255,255,.08)" : "transparent",
                                          borderBottom: "1px solid rgba(255,255,255,.08)",
                                          userSelect: "none",
                                        }}
                                      >
                                        {renderProveedorLabel(p, proveedorQuery)}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
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
                            <input
                              type="number"
                              step="0.01"
                              value={String(op.iva)}
                              onChange={(e) => opSet("iva", safeNum(e.target.value))}
                              style={{ ...s.input, width: "100%" }}
                            />
                          </div>

                          <div style={{ gridColumn: "span 3" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Neto (auto)</div>
                            <input value={opNetoAuto.toFixed(2)} readOnly style={{ ...s.input, width: "100%", opacity: 0.85 }} />
                          </div>

                          <div style={{ gridColumn: "span 3" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Modo de pago</div>
                            <select value={op.modo_pago} onChange={(e) => opSet("modo_pago", e.target.value)} style={{ ...s.input, width: "100%" }}>
                              <option value="Transferencia">Transferencia</option>
                              <option value="Transferencia/Santander">Transferencia/Santander</option>
                              <option value="Transferencia/Caixa">Transferencia/Caixa</option>
                              <option value="Efectivo">Efectivo</option>
                              <option value="Tarjeta">Tarjeta</option>
                              <option value="Tarjeta/Santander">Tarjeta/Santander</option>
                              <option value="Tarjeta/Caixa">Tarjeta/Caixa</option>
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
                      </>
                    ) : (
                      <>
                        {/* ✅ INGRESO: CIERRE DE CAJA manual */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 10 }}>
                          <div style={{ gridColumn: "span 3" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Fecha</div>
                            <input
                              type="date"
                              value={cierre.fecha}
                              onChange={(e) => cierreSet("fecha", e.target.value)}
                              style={{ ...s.input, width: "100%" }}
                            />
                          </div>

                          <div style={{ gridColumn: "span 3" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Nro. Cierre / Liquidación</div>
                            <input
                              value={cierre.nro_cierre}
                              onChange={(e) => cierreSet("nro_cierre", e.target.value)}
                              style={{ ...s.input, width: "100%" }}
                              placeholder="Ej: 000123"
                            />
                          </div>

                          <div style={{ gridColumn: "span 12" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Concepto</div>
                            <input
                              value={cierre.concepto}
                              onChange={(e) => cierreSet("concepto", e.target.value)}
                              style={{ ...s.input, width: "100%" }}
                              placeholder="Ej: Venta del día, Evento, etc."
                            />
                          </div>

                          <div style={{ gridColumn: "span 2" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>TPV Santander</div>
                            <input
                              type="number"
                              step="0.01"
                              value={String(cierre.tpv_santander)}
                              onChange={(e) => cierreSet("tpv_santander", safeNum(e.target.value))}
                              style={{ ...s.input, width: "100%" }}
                            />
                          </div>

                          <div style={{ gridColumn: "span 2" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>TPV Caixabank</div>
                            <input
                              type="number"
                              step="0.01"
                              value={String(cierre.tpv_caixabank)}
                              onChange={(e) => cierreSet("tpv_caixabank", safeNum(e.target.value))}
                              style={{ ...s.input, width: "100%" }}
                            />
                          </div>

                          <div style={{ gridColumn: "span 2" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Total TPV</div>
                            <input value={cierreTotalTPV.toFixed(2)} readOnly style={{ ...s.input, width: "100%", opacity: 0.85 }} />
                          </div>

                          <div style={{ gridColumn: "span 2" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Efectivo recibido</div>
                            <input
                              type="number"
                              step="0.01"
                              value={String(cierre.efectivo_recibido)}
                              onChange={(e) => cierreSet("efectivo_recibido", safeNum(e.target.value))}
                              style={{ ...s.input, width: "100%" }}
                            />
                          </div>

                          <div style={{ gridColumn: "span 2" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Total venta diaria</div>
                            <input value={cierreTotalVenta.toFixed(2)} readOnly style={{ ...s.input, width: "100%", opacity: 0.85 }} />
                          </div>

                          <div style={{ gridColumn: "span 2" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Gastos menores</div>
                            <input
                              type="number"
                              step="0.01"
                              value={String(cierre.gastos_menores)}
                              onChange={(e) => cierreSet("gastos_menores", safeNum(e.target.value))}
                              style={{ ...s.input, width: "100%" }}
                            />
                          </div>

                          <div style={{ gridColumn: "span 12" }}>
                            <div style={{ opacity: 0.85, fontSize: 12, marginBottom: 6 }}>Observación</div>
                            <textarea
                              value={cierre.observacion}
                              onChange={(e) => cierreSet("observacion", e.target.value)}
                              style={{ ...s.input, width: "100%", minHeight: 80 }}
                              placeholder='Ej: "Cuadre OK, se retiró efectivo para caja chica"'
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* ================= BOTONES ================= */}
                    <div style={{ ...s.row, justifyContent: "flex-end", marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpOpen(false);
                          opReset();
                          setProveedorQuery("");
                          setShowProveedorDropdown(false);
                          setProveedorActiveIndex(-1);
                        }}
                        style={s.btn}
                        disabled={opSaving}
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        style={{
                          ...s.btnPrimary,
                          opacity: !opCanSave || opSaving ? 0.7 : 1,
                          cursor: !opCanSave || opSaving ? "not-allowed" : "pointer",
                        }}
                        disabled={!opCanSave || opSaving}
                      >
                        {opSaving ? "Guardando..." : "Guardar operación"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ✅ FILTROS LIBRO (FUERA DEL MODAL) */}
            <div style={{ ...s.row, marginBottom: 12 }}>
              <input
                ref={lDesdeRef}
                type="date"
                value={lDesde}
                onChange={(e) => setLDesde(e.target.value)}
                onClick={() => {
                  // @ts-ignore
                  lDesdeRef.current?.showPicker?.();
                }}
                style={s.input}
              />
              <input
                ref={lHastaRef}
                type="date"
                value={lHasta}
                onChange={(e) => setLHasta(e.target.value)}
                onClick={() => {
                  // @ts-ignore
                  lHastaRef.current?.showPicker?.();
                }}
                style={s.input}
              />

              <input value={lQ} onChange={(e) => setLQ(e.target.value)} placeholder="Buscar (concepto/categoría/ref/fecha)" style={{ ...s.input, width: 280 }} />

              <button onClick={fetchLibroAll} style={s.btn} disabled={lLoading}>
                Aplicar filtros
              </button>

              <button
                onClick={() => {
                  setLDesde("");
                  setLHasta("");

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
              {["INGRESOS", "GASTOS", ...categoriasOpciones].map((c) => (
                <option key={`lib-${c}`} value={c} />
              ))}
            </datalist>

            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, overflow: "hidden" }}>
              <table style={s.table}>
                <thead style={{ background: "rgba(255,255,255,.06)" }}>
                  <tr>
                    {(["fecha","tipo","concepto","categoria","monto","saldo"] as const).map((col) => (
                      <th
                        key={col}
                        style={{ ...s.th, cursor: "pointer", userSelect: "none" }}
                        onClick={() => toggleLibroSort(col)}
                      >
                        {col.charAt(0).toUpperCase() + col.slice(1)}
                        {lSortCol === col ? (lSortDir === "desc" ? " ↓" : " ↑") : " ↕"}
                      </th>
                    ))}
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {lLoading && (
                    <tr>
                      <td colSpan={7} style={{ ...s.td, textAlign: "center", opacity: 0.7, padding: 24 }}>
                        Cargando...
                      </td>
                    </tr>
                  )}
                  {!lLoading && libroRows.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ ...s.td, opacity: 0.8 }}>
                        No hay registros todavía.
                      </td>
                    </tr>
                  )}
                  {!lLoading && libroSorted.slice((libroPage - 1) * libroPageSize, libroPage * libroPageSize).map((r) => (
                    <tr key={`row-${r.ref}`} onClick={() => openDetail(r)} style={{ cursor: "pointer" }} title="Ver detalle">
                      <td style={s.td}>{r.fecha}</td>

                      <td style={s.td}>{r.tipo === "INGRESO" ? <span style={s.badgeIngreso}>INGRESO</span> : <span style={s.badgeGasto}>GASTO</span>}</td>

                      <td style={{ ...s.td, fontWeight: 800 }}>{r.concepto}</td>

                      <td style={s.td}>
                        <span style={s.badge}>{r.categoria}</span>
                      </td>

                      <td style={{ ...s.td, fontWeight: 1000 }}>{moneyEUR(r.monto)}</td>

                      <td style={{ ...s.td, fontWeight: 1000 }}>{moneyEUR(r.saldo)}</td>

                      <td style={s.td}>
                        {((r.ref.startsWith("GASTO#") && r.tipo === "GASTO") || r.ref.startsWith("MOV#")) && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const id = Number(r.ref.split("#")[1]);

                              if (r.ref.startsWith("GASTO#")) {
                                await deleteGastoFromLibro(id);
                              } else {
                                await deleteMovimiento(id);
                              }
                            }}
                            style={s.btnDanger}
                            title="Eliminar"
                          >
                            🗑
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {detailOpen && detailRow && (
              <div
                onClick={closeDetail}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "#111",
                    padding: 24,
                    borderRadius: 12,
                    width: "90%",
                    maxWidth: 700,
                    maxHeight: "85vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 60px rgba(0,0,0,.6)",
                  }}
                >
                  <h2 style={{ marginBottom: 16 }}>Detalle — {detailRow.tipo}</h2>

                  <div style={{ lineHeight: 1.6 }}>
                    <p>
                      <b>Fecha:</b> {detailRow.fecha}
                    </p>
                    <p>
                      <b>Concepto:</b> {detailRow.concepto}
                    </p>
                    <p>
                      <b>Categoría:</b> {detailRow.categoria}
                    </p>
                    <p>
                      <b>Monto:</b> {moneyEUR(detailRow.monto)}
                    </p>

                    {detailRow.meta &&
  (() => {
    const parsed = parseCierreObs(detailRow.meta?.observacion);
    const f = parsed.fields || {};
    const hasFields = Object.keys(f).length > 0;

    return (
      <>
        <hr style={{ margin: "16px 0", opacity: 0.3 }} />

        <p>
          <b>Proveedor/Persona:</b> {detailRow.meta.proveedor ?? "-"}
        </p>
        <p>
          <b>Factura / Ref:</b> {detailRow.meta.factura_no ?? "-"}
        </p>
        <p>
          <b>Modo pago:</b> {detailRow.meta.modo_pago ?? "-"}
        </p>

        <p style={{ whiteSpace: "pre-line" }}>
          <b>Observación:</b> {parsed.note || "-"}
        </p>

        {hasFields && (
          <div style={{ marginTop: 10 }}>
            {[
              "Nro Cierre",
              "TPV Santander",
              "TPV Caixabank",
              "Total TPV",
              "Efectivo recibido",
              "Total venta diaria",
              "Gastos menores",
            ].map((k) =>
              f[k] ? (
                <p key={k} style={{ margin: "6px 0" }}>
                  <b>{k}:</b> {f[k]}
                </p>
              ) : null
            )}
          </div>
        )}
      </>
    );
  })()}
                  </div>

                  <div style={{ marginTop: 24, textAlign: "right" }}>
                    <button
                      onClick={() => {
                        closeDetail();
                        openEditFromDetail(detailRow);
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "1px solid rgba(255,255,255,.18)",
                        background: "rgba(255,255,255,.08)",
                        color: "#fff",
                        cursor: "pointer",
                        marginRight: 10,
                        fontWeight: 900,
                      }}
                    >
                      ✏️ Editar
                    </button>

                    <button
                      onClick={closeDetail}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: "#444",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Paginador */}
            {libroRows.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 14 }}>
                <button
                  onClick={() => setLibroPage((p) => Math.max(1, p - 1))}
                  disabled={libroPage <= 1}
                  style={{ ...s.btn, minWidth: 46, opacity: libroPage <= 1 ? 0.45 : 1, cursor: libroPage <= 1 ? "not-allowed" : "pointer" }}
                  title="Anterior"
                  type="button"
                >
                  ←
                </button>

                <div style={{ ...s.badge, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
                  <span style={{ opacity: 0.85 }}>Página</span>
                  <b>{libroPage}</b>
                  <span style={{ opacity: 0.65 }}>/</span>
                  <b>{Math.max(1, Math.ceil(libroSorted.length / libroPageSize))}</b>
                </div>

                <button
                  onClick={() => setLibroPage((p) => Math.min(Math.ceil(libroSorted.length / libroPageSize), p + 1))}
                  disabled={libroPage >= Math.ceil(libroSorted.length / libroPageSize)}
                  style={{
                    ...s.btn,
                    minWidth: 46,
                    opacity: libroPage >= Math.ceil(libroSorted.length / libroPageSize) ? 0.45 : 1,
                    cursor: libroPage >= Math.ceil(libroSorted.length / libroPageSize) ? "not-allowed" : "pointer",
                  }}
                  title="Siguiente"
                  type="button"
                >
                  →
                </button>
              </div>
            )}

            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
              Nota: Ingresos se registran manualmente como <b>cierres de caja</b> en <b>/contabilidad/movimientos</b>.
            </div>
          </>
        )}
      </div>
    </main>
  );
}
