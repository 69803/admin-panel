"use client";

import { useRouter } from "next/navigation";

export default function ConfigPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "40px 32px",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 1000, margin: "0 0 6px" }}>⚙️ Configuración</h1>
          <p style={{ opacity: 0.5, fontSize: 14, margin: 0 }}>Gestiona tu panel y pagos</p>
        </div>

        <div
          onClick={() => router.push("/dev/pagos")}
          style={{
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 16,
            padding: "22px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            cursor: "pointer",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.09)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.05)")}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(124,58,237,.18)",
              border: "1px solid rgba(124,58,237,.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            💳
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>Panel de Pagos</div>
            <div style={{ opacity: 0.55, fontSize: 13 }}>Revisa y verifica los pagos recibidos de tus clientes.</div>
          </div>
          <div style={{ opacity: 0.3, fontSize: 20 }}>→</div>
        </div>
      </div>
    </main>
  );
}
