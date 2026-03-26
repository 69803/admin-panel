// =============================================
// 👇 CONTROL DE LICENCIA 👇
// =============================================
//
// ACTIVO: bloqueo manual
//   true  → panel activo (ignora la fecha)
//   false → panel bloqueado siempre
//
// EXPIRY: bloqueo automático por fecha
//   Si hoy >= EXPIRY y ACTIVO es true → muestra pricing
//   Cuando el cliente pague → actualiza EXPIRY al siguiente mes
//
// =============================================

export const ACTIVO = true; // ← bloqueo manual

export const EXPIRY = new Date("2026-04-01T00:00:00"); // ← fecha límite de pago
