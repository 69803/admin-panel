export type TipoCuenta = "activo" | "pasivo" | "capital";

export type Cuenta = {
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
};

export const CUENTAS: Cuenta[] = [
  // ── ACTIVOS ──────────────────────────────────────────────
  { codigo: "101", nombre: "Caja / Efectivo",          tipo: "activo" },
  { codigo: "102", nombre: "Banco",                    tipo: "activo" },
  { codigo: "103", nombre: "Cuentas por Cobrar",       tipo: "activo" },
  { codigo: "104", nombre: "Inventario / Mercancías",  tipo: "activo" },
  { codigo: "105", nombre: "Equipos y Maquinaria",     tipo: "activo" },
  { codigo: "106", nombre: "Inmuebles / Local",        tipo: "activo" },
  { codigo: "107", nombre: "Vehículos",                tipo: "activo" },
  { codigo: "108", nombre: "Inversiones",              tipo: "activo" },
  { codigo: "109", nombre: "Depósitos y Garantías",    tipo: "activo" },
  { codigo: "110", nombre: "Pagos Anticipados",        tipo: "activo" },
  { codigo: "111", nombre: "Otros Activos",            tipo: "activo" },

  // ── PASIVOS ───────────────────────────────────────────────
  { codigo: "201", nombre: "Préstamo Bancario",        tipo: "pasivo" },
  { codigo: "202", nombre: "Cuentas por Pagar",        tipo: "pasivo" },
  { codigo: "203", nombre: "Deuda con Proveedores",    tipo: "pasivo" },
  { codigo: "204", nombre: "Impuestos por Pagar",      tipo: "pasivo" },
  { codigo: "205", nombre: "Nómina por Pagar",         tipo: "pasivo" },
  { codigo: "206", nombre: "Crédito Hipotecario",      tipo: "pasivo" },
  { codigo: "207", nombre: "Intereses por Pagar",      tipo: "pasivo" },
  { codigo: "208", nombre: "Anticipos de Clientes",    tipo: "pasivo" },
  { codigo: "209", nombre: "Otros Pasivos",            tipo: "pasivo" },

  // ── CAPITAL ───────────────────────────────────────────────
  { codigo: "301", nombre: "Capital Social",           tipo: "capital" },
  { codigo: "302", nombre: "Aporte de Socio",          tipo: "capital" },
  { codigo: "303", nombre: "Utilidad del Ejercicio",   tipo: "capital" },
  { codigo: "304", nombre: "Pérdida del Ejercicio",    tipo: "capital" },
  { codigo: "305", nombre: "Reservas",                 tipo: "capital" },
  { codigo: "306", nombre: "Retiros del Socio",        tipo: "capital" },
  { codigo: "307", nombre: "Dividendos",               tipo: "capital" },
];

export const CUENTAS_POR_TIPO = {
  activo:  CUENTAS.filter((c) => c.tipo === "activo"),
  pasivo:  CUENTAS.filter((c) => c.tipo === "pasivo"),
  capital: CUENTAS.filter((c) => c.tipo === "capital"),
};

export function findCuenta(codigo: string) {
  return CUENTAS.find((c) => c.codigo === codigo);
}
