import { TipoCuenta } from "./cuentas";

export type Asiento = {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  debeCodigo: string;
  debeNombre: string;
  debeTipo: TipoCuenta;
  haberCodigo: string;
  haberNombre: string;
  haberTipo: TipoCuenta;
  notas: string;
  creadoEn: string;
};

const KEY = "contabilidad_asientos_v1";

export function loadAsientos(): Asiento[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveAsientos(list: Asiento[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addAsiento(a: Omit<Asiento, "id" | "creadoEn">): Asiento {
  const nuevo: Asiento = { ...a, id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, creadoEn: new Date().toISOString() };
  const list = [nuevo, ...loadAsientos()];
  saveAsientos(list);
  return nuevo;
}

export function deleteAsiento(id: string) {
  saveAsientos(loadAsientos().filter((a) => a.id !== id));
}

// ── Accounting equation calculations ─────────────────────────────────────────
// Normal balance: Assets → Debit. Liabilities & Capital → Credit.
// Asset balance   = Σ debe(activo) − Σ haber(activo)
// Pasivo balance  = Σ haber(pasivo) − Σ debe(pasivo)
// Capital balance = Σ haber(capital) − Σ debe(capital)

export function calcTotales(asientos: Asiento[]) {
  let activos = 0, pasivos = 0, capital = 0;
  for (const a of asientos) {
    if (a.debeTipo  === "activo")  activos  += a.monto;
    if (a.haberTipo === "activo")  activos  -= a.monto;
    if (a.haberTipo === "pasivo")  pasivos  += a.monto;
    if (a.debeTipo  === "pasivo")  pasivos  -= a.monto;
    if (a.haberTipo === "capital") capital  += a.monto;
    if (a.debeTipo  === "capital") capital  -= a.monto;
  }
  return { activos, pasivos, capital };
}

export function filtrarPorTipo(asientos: Asiento[], tipo: TipoCuenta) {
  return asientos.filter((a) => a.debeTipo === tipo || a.haberTipo === tipo);
}
