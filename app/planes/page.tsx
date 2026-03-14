"use client";

export default function PlanesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a0533 0%, #0d0221 40%, #1a0533 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff",
      }}
    >
      {/* Header */}
      <h1
        style={{
          fontSize: "clamp(26px, 5vw, 42px)",
          fontWeight: 900,
          textAlign: "center",
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        Planes del Panel para Restaurantes
      </h1>
      <p
        style={{
          fontSize: 16,
          opacity: 0.7,
          textAlign: "center",
          margin: "0 0 48px",
        }}
      >
        Elige el plan que mejor se adapta a tu restaurante.
      </p>

      {/* Cards */}
      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: 860,
        }}
      >
        {/* ── PLAN BÁSICO ── */}
        <div
          style={{
            flex: "1 1 340px",
            maxWidth: 400,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 20,
            padding: "32px 28px",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Plan Básico</div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 42, fontWeight: 900 }}>50€</span>
            <span style={{ fontSize: 16, opacity: 0.6 }}>/mes</span>
          </div>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 24, lineHeight: 1.5 }}>
            Ideal para restaurantes que quieren empezar con el sistema.
          </p>

          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>
            Incluye:
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Mantenimiento de la cuenta en Play Store & App Store",
              "Acceso al panel administrativo",
              "Gestión de mesas y pedidos",
              "Gestión de menús",
              "Notificaciones de pedidos",
              "Actualizaciones del sistema",
            ].map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14 }}>
                <span style={{ color: "#4ade80", fontWeight: 900, marginTop: 1 }}>✓</span>
                <span style={{ opacity: 0.85 }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* Store badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, opacity: 0.6, fontSize: 12 }}>
            <span>🍎</span><span>App Store</span>
            <span style={{ opacity: 0.4 }}>+</span>
            <span>▶</span><span>Play Store</span>
          </div>

          <button
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.22)",
              background: "rgba(255,255,255,.10)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: ".02em",
            }}
          >
            Continuar
          </button>
        </div>

        {/* ── PLAN PRO ── */}
        <div
          style={{
            flex: "1 1 340px",
            maxWidth: 400,
            background: "rgba(139,92,246,0.18)",
            border: "1px solid rgba(139,92,246,0.5)",
            borderRadius: 20,
            padding: "32px 28px",
            position: "relative",
          }}
        >
          {/* Badge */}
          <div
            style={{
              position: "absolute",
              top: -14,
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              borderRadius: 20,
              padding: "5px 16px",
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(139,92,246,.5)",
            }}
          >
            ⭐ Más popular
          </div>

          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Plan Pro</div>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 42, fontWeight: 900 }}>50€</span>
            <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.7 }}>+ 20€</span>
            <span style={{ fontSize: 16, opacity: 0.6 }}>/mes</span>
          </div>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 24, lineHeight: 1.5 }}>
            Perfecto para restaurantes que necesitan más soporte.
          </p>

          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>
            Incluye:
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Todo lo del Plan Básico",
              "Mantenimiento de la cuenta en Play Store & App Store",
              "Actualizaciones automáticas",
              "Gestión completa de pedidos",
              "Notificaciones en tiempo real",
            ].map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14 }}>
                <span style={{ color: "#4ade80", fontWeight: 900, marginTop: 1 }}>✓</span>
                <span style={{ opacity: 0.85 }}>{f}</span>
              </li>
            ))}
          </ul>

          <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 6 }}>
            *Plus adicional: <strong style={{ opacity: 1 }}>+20€/mes</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 28, color: "#c4b5fd", fontWeight: 600 }}>
            <span>🛡</span> Soporte técnico prioritario
          </div>

          {/* Store badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, opacity: 0.6, fontSize: 12 }}>
            <span>🍎</span><span>App Store</span>
            <span style={{ opacity: 0.4 }}>+</span>
            <span>▶</span><span>Play Store</span>
          </div>

          <button
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: ".02em",
              boxShadow: "0 6px 20px rgba(139,92,246,.4)",
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </main>
  );
}
