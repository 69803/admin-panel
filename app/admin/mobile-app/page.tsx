"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function MobileAppPage() {
  const { bg } = useTheme();
  const isDark = bg === "#0F172A";
  const textColor = isDark ? "#E2E8F0" : "#111111";
  const subColor = isDark ? "#94A3B8" : "#777777";
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const [locked, setLocked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/system/access_status`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setLocked(data.access_locked ?? false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar estado");
    } finally {
      setLoading(false);
    }
  }

  async function setAccess(value: boolean) {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${API_BASE}/system/access_status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_locked: value }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setLocked(value);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al actualizar estado");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        color: textColor,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "40px 32px",
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 1000, margin: "0 0 6px", color: textColor }}>
            📱 Mobile App
          </h1>
          <p style={{ color: subColor, fontSize: 14, margin: 0 }}>
            Control global de acceso de la app móvil
          </p>
        </div>

        {/* Status card */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 16,
            padding: "28px 24px",
            boxShadow: isDark
              ? "0 4px 24px rgba(0,0,0,0.4)"
              : "0 1px 3px rgba(0,0,0,0.06)",
            transition: "background 0.3s ease",
          }}
        >
          {/* Estado actual */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 14px", color: subColor, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Estado actual de la app móvil
            </h2>

            {loading ? (
              <div style={{ fontSize: 14, color: subColor }}>Cargando...</div>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  borderRadius: 30,
                  background: locked
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(34,197,94,0.12)",
                  border: `1.5px solid ${locked ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
                }}
              >
                <span style={{ fontSize: 18 }}>{locked ? "🔒" : "✅"}</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: locked ? "#ef4444" : "#22c55e",
                  }}
                >
                  {locked ? "ACCESO RESTRINGIDO ACTIVADO" : "ACCESO NORMAL"}
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                fontSize: 13,
                color: "#ef4444",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              disabled={saving || loading || locked === true}
              onClick={() => setAccess(true)}
              style={{
                padding: "12px 22px",
                borderRadius: 10,
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: saving || loading || locked === true ? "not-allowed" : "pointer",
                opacity: saving || loading || locked === true ? 0.45 : 1,
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff",
                boxShadow: locked !== true ? "0 4px 14px rgba(239,68,68,0.35)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              🔒 Activar restricción
            </button>

            <button
              disabled={saving || loading || locked === false}
              onClick={() => setAccess(false)}
              style={{
                padding: "12px 22px",
                borderRadius: 10,
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: saving || loading || locked === false ? "not-allowed" : "pointer",
                opacity: saving || loading || locked === false ? 0.45 : 1,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff",
                boxShadow: locked !== false ? "0 4px 14px rgba(34,197,94,0.35)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              ✅ Desactivar restricción
            </button>
          </div>

          {saving && (
            <div style={{ fontSize: 13, color: subColor, marginTop: 14 }}>
              Guardando...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
