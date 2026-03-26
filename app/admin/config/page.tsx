"use client";

export default function ConfigPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4F6FA",
        color: "#111111",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "40px 32px",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 1000, margin: "0 0 6px" }}>⚙️ Configuración</h1>
          <p style={{ color: "#777777", fontSize: 14, margin: 0 }}>Ajustes del panel</p>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 16,
            padding: "32px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            textAlign: "center",
            color: "#AAAAAA",
            fontSize: 14,
          }}
        >
          Próximamente más opciones de configuración.
        </div>
      </div>
    </main>
  );
}
