"use client";

import { useRouter } from "next/navigation";

export default function ConfigPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#E4E8EC",
        color: "#111111",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "40px 32px",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 1000, margin: "0 0 6px" }}>⚙️ Configuración</h1>
          <p style={{ color: "#555555", fontSize: 14, margin: 0 }}>Gestiona tu panel y pagos</p>
        </div>

        <div
          onClick={() => router.push("/dev/pagos")}
          style={{
            background: "#EDF0F3",
            border: "1px solid #C8CDD4",
            borderRadius: 16,
            padding: "22px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            cursor: "pointer",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#D8DCE1")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#EDF0F3")}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#EDE9FE",
              border: "1px solid #C4B5FD",
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
            <div style={{ color: "#555555", fontSize: 13 }}>Revisa y verifica los pagos recibidos de tus clientes.</div>
          </div>
          <div style={{ color: "#555555", fontSize: 20 }}>→</div>
        </div>
      </div>
    </main>
  );
}
