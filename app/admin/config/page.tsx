"use client";

import { BG_COLORS, useTheme } from "../../context/ThemeContext";

export default function ConfigPage() {
  const { bg, setBg } = useTheme();

  const isDark = bg === "#0F172A";
  const textColor = isDark ? "#E2E8F0" : "#111111";
  const subColor = isDark ? "#94A3B8" : "#777777";
  const cardBg   = isDark ? "#1E293B" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

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
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 1000, margin: "0 0 6px", color: textColor }}>
            ⚙️ Configuración
          </h1>
          <p style={{ color: subColor, fontSize: 14, margin: 0 }}>Ajustes del panel</p>
        </div>

        {/* Color picker card */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 16,
            padding: "28px 24px",
            boxShadow: isDark
              ? "0 4px 24px rgba(0,0,0,0.4)"
              : "0 1px 3px rgba(0,0,0,0.06)",
            transition: "background 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: textColor }}>
              Color de fondo
            </h2>
            <p style={{ fontSize: 13, color: subColor, margin: 0 }}>
              Elige el color que más te guste para el panel
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {BG_COLORS.map((option) => {
              const selected = bg === option.hex;
              return (
                <button
                  key={option.id}
                  onClick={() => setBg(option.hex)}
                  title={option.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: selected
                      ? "2px solid #6C5CE7"
                      : `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                    background: selected
                      ? isDark ? "rgba(108,92,231,0.15)" : "rgba(108,92,231,0.06)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: 90,
                    boxShadow: selected ? "0 0 0 4px rgba(108,92,231,0.15)" : "none",
                  }}
                >
                  {/* Color circle */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: option.hex,
                      border: option.hex === "#F4F6FA" || option.hex === "#E2E6EF" || option.hex === "#CDD2DE"
                        ? "1px solid rgba(0,0,0,0.12)"
                        : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: selected
                        ? "0 0 0 3px #6C5CE7"
                        : "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "box-shadow 0.2s ease",
                    }}
                  />

                  {/* Label */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: selected ? "#6C5CE7" : textColor,
                        transition: "color 0.2s",
                      }}
                    >
                      {option.label}
                    </div>
                    <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
                      {option.desc}
                    </div>
                  </div>

                  {/* Selected badge */}
                  {selected && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#FFFFFF",
                        background: "#6C5CE7",
                        borderRadius: 20,
                        padding: "2px 10px",
                      }}
                    >
                      Activo
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
