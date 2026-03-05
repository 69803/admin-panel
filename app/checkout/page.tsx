"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const IBAN = "GR8501716040006604139322538";
const BIC = "PIRBGRAA";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      style={{
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid rgba(124,58,237,.5)",
        background: copied ? "rgba(34,197,94,.2)" : "rgba(124,58,237,.15)",
        color: copied ? "#86efac" : "#c4b5fd",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        transition: "all .2s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "✓ Copiado" : `Copiar ${label}`}
    </button>
  );
}

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();

  const plan = params.get("plan") ?? "Pro";
  const precio = params.get("precio") ?? "59";

  const [email, setEmail] = useState("");
  const [referencia, setReferencia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Por favor introduce un email válido.");
      return;
    }
    if (!referencia.trim()) {
      setError("Por favor introduce el número de transferencia.");
      return;
    }
    setError("");
    setEnviando(true);

    try {
      await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          precio: `${precio}€/mes`,
          email: email.trim().toLowerCase(),
          referencia: referencia.trim(),
          fecha: new Date().toISOString(),
        }),
      });
      setEnviado(true);
    } catch {
      setError("Error al enviar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b1220",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 32, fontWeight: 1000, marginBottom: 12 }}>
            Pago registrado
          </h1>
          <p style={{ opacity: 0.65, fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            Hemos recibido tu información. Verificaremos el pago y activaremos tu
            plan <b>{plan}</b> en menos de 24 horas.
          </p>
          <button
            onClick={() => router.push("/pricing")}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.15)",
              background: "rgba(255,255,255,.08)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Volver a planes
          </button>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Header */}
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,.5)",
            cursor: "pointer",
            fontSize: 14,
            marginBottom: 32,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Volver
        </button>

        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-block",
              padding: "5px 14px",
              borderRadius: 999,
              background: "rgba(124,58,237,.18)",
              border: "1px solid rgba(124,58,237,.4)",
              fontSize: 13,
              fontWeight: 700,
              color: "#c4b5fd",
              marginBottom: 14,
            }}
          >
            Plan {plan} — {precio}€/mes
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 1000, margin: 0 }}>
            Completa tu pago
          </h1>
        </div>

        <form onSubmit={handleSubmit}>

          {/* PASO 1 */}
          <div
            style={{
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div style={{ fontWeight: 900, fontSize: 17 }}>
                Realiza el depósito bancario
              </div>
            </div>

            <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Transfiere el importe del plan seleccionado a la siguiente cuenta bancaria:
            </p>

            {[
              { label: "IBAN", value: IBAN },
              { label: "BIC", value: BIC },
              { label: "Banco", value: "PIRAEUS BANK S.A.", copy: false },
              { label: "Número de sucursal", value: "1604", copy: false },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,.07)",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "monospace" }}>
                    {item.value}
                  </div>
                </div>
                {item.copy !== false && (
                  <CopyButton text={item.value} label={item.label} />
                )}
              </div>
            ))}

            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(234,179,8,.08)",
                border: "1px solid rgba(234,179,8,.25)",
                fontSize: 13,
                color: "#fde68a",
                lineHeight: 1.6,
              }}
            >
              ⚠️ Usa <b>{precio}€</b> como importe exacto y en el concepto escribe <b>Plan {plan}</b>.
            </div>
          </div>

          {/* PASO 2 */}
          <div
            style={{
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div style={{ fontWeight: 900, fontSize: 17 }}>
                Registra tu número de transferencia
              </div>
            </div>

            <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 14, lineHeight: 1.6 }}>
              Introduce tu email y el número de referencia que te dio tu banco:
            </p>

            <div style={{ marginBottom: 10 }}>
              <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 6, fontWeight: 700 }}>Tu email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(0,0,0,.3)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 6, fontWeight: 700 }}>Número de transferencia</div>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: TRF-20260305-001234"
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                border: error ? "1px solid rgba(239,68,68,.6)" : "1px solid rgba(255,255,255,.18)",
                background: "rgba(0,0,0,.3)",
                color: "#fff",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "monospace",
              }}
            />
            {error && (
              <div style={{ color: "#fca5a5", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>

          {/* PASO 3 */}
          <div
            style={{
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div style={{ fontWeight: 900, fontSize: 17 }}>
                Envía la información
              </div>
            </div>

            <p style={{ opacity: 0.6, fontSize: 14, lineHeight: 1.6 }}>
              Revisaremos tu pago y activaremos el acceso en menos de 24 horas.
            </p>
          </div>

          <button
            type="submit"
            disabled={enviando}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 14,
              border: "none",
              background: enviando ? "rgba(124,58,237,.4)" : "linear-gradient(135deg, #7c3aed, #3b82f6)",
              color: "#fff",
              fontWeight: 900,
              fontSize: 17,
              cursor: enviando ? "not-allowed" : "pointer",
              boxShadow: "0 8px 30px rgba(124,58,237,.35)",
              letterSpacing: ".02em",
            }}
          >
            {enviando ? "Enviando..." : "Enviar información"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
