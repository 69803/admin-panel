"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const planes = [
  {
    nombre: "Básico",
    precio: { mensual: 29, anual: 23 },
    descripcion: "Perfecto para empezar y crecer sin complicaciones.",
    color: "rgba(255,255,255,.07)",
    border: "rgba(255,255,255,.12)",
    badge: null,
    btnBg: "rgba(255,255,255,.10)",
    btnBorder: "rgba(255,255,255,.18)",
    btnColor: "#fff",
    features: [
      "Panel administrativo completo",
      "Gestión de menú ilimitada",
      "Pedidos en tiempo real",
      "1 dispositivo KDS",
      "Soporte por email",
    ],
    noFeatures: ["Reportes avanzados", "Contabilidad", "Multi restaurante", "Soporte prioritario"],
  },
  {
    nombre: "Pro",
    precio: { mensual: 59, anual: 47 },
    descripcion: "La elección de los restaurantes que quieren escalar.",
    color: "linear-gradient(135deg, rgba(124,58,237,.18) 0%, rgba(59,130,246,.18) 100%)",
    border: "rgba(124,58,237,.6)",
    badge: "Más popular",
    btnBg: "linear-gradient(135deg, #7c3aed, #3b82f6)",
    btnBorder: "transparent",
    btnColor: "#fff",
    features: [
      "Todo lo del plan Básico",
      "KDS avanzado con prioridades",
      "Reportes y estadísticas",
      "Contabilidad y libro diario",
      "Hasta 3 dispositivos KDS",
      "Soporte por chat",
    ],
    noFeatures: ["Multi restaurante", "Soporte prioritario"],
  },
  {
    nombre: "Premium",
    precio: { mensual: 99, anual: 79 },
    descripcion: "Solución enterprise para cadenas y grupos de restauración.",
    color: "rgba(255,255,255,.07)",
    border: "rgba(255,255,255,.12)",
    badge: null,
    btnBg: "rgba(255,255,255,.10)",
    btnBorder: "rgba(255,255,255,.18)",
    btnColor: "#fff",
    features: [
      "Todo lo del plan Pro",
      "Multi restaurante (ilimitado)",
      "Analytics avanzados con IA",
      "KDS ilimitados",
      "API personalizada",
      "Manager dedicado",
      "Soporte prioritario 24/7",
    ],
    noFeatures: [],
  },
];

const faqs = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Puedes subir o bajar de plan cuando quieras. El cambio se aplica en el siguiente ciclo de facturación.",
  },
  {
    q: "¿Hay contrato de permanencia?",
    a: "No. Todos los planes son sin permanencia. Puedes cancelar cuando quieras sin penalización.",
  },
  {
    q: "¿Qué pasa si supero los límites de mi plan?",
    a: "Te avisaremos antes de que llegues al límite. Nunca cortamos el servicio de golpe.",
  },
  {
    q: "¿Ofrecen periodo de prueba?",
    a: "Sí, 14 días gratuitos en cualquier plan. Sin tarjeta de crédito.",
  },
];

export default function PricingPage() {
  const [anual, setAnual] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "0 0 80px",
      }}
    >
      {/* ── HERO ── */}
      <div
        style={{
          textAlign: "center",
          padding: "72px 24px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* glow de fondo */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 400,
            background:
              "radial-gradient(ellipse at center, rgba(124,58,237,.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 999,
            background: "rgba(124,58,237,.18)",
            border: "1px solid rgba(124,58,237,.4)",
            fontSize: 13,
            fontWeight: 700,
            color: "#c4b5fd",
            marginBottom: 20,
            letterSpacing: ".04em",
          }}
        >
          💜 Sin permanencia · 14 días gratis
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 1000,
            margin: "0 0 16px",
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #fff 30%, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          El panel que tu restaurante
          <br />
          necesitaba
        </h1>

        <p
          style={{
            fontSize: 18,
            opacity: 0.65,
            maxWidth: 520,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Gestiona pedidos, cocina, contabilidad y reportes desde un solo lugar.
          Simple, rápido y sin complicaciones.
        </p>

        {/* Toggle mensual / anual */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 999,
            padding: "6px 8px",
          }}
        >
          <button
            onClick={() => setAnual(false)}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "none",
              background: !anual ? "rgba(124,58,237,.9)" : "transparent",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "background .2s",
            }}
          >
            Mensual
          </button>
          <button
            onClick={() => setAnual(true)}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "none",
              background: anual ? "rgba(124,58,237,.9)" : "transparent",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "background .2s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Anual
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(34,197,94,.25)",
                border: "1px solid rgba(34,197,94,.4)",
                color: "#86efac",
              }}
            >
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* ── CARDS ── */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        {planes.map((plan) => {
          const precio = anual ? plan.precio.anual : plan.precio.mensual;
          const isPro = !!plan.badge;

          return (
            <div
              key={plan.nombre}
              style={{
                borderRadius: 20,
                border: `1px solid ${plan.border}`,
                background: plan.color,
                padding: isPro ? "32px 28px" : "28px",
                position: "relative",
                backdropFilter: "blur(12px)",
                transform: isPro ? "scale(1.03)" : "scale(1)",
                boxShadow: isPro
                  ? "0 0 0 1px rgba(124,58,237,.3), 0 24px 60px rgba(124,58,237,.2)"
                  : "0 8px 32px rgba(0,0,0,.2)",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 900,
                    padding: "4px 14px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    letterSpacing: ".04em",
                  }}
                >
                  ⭐ {plan.badge}
                </div>
              )}

              {/* Nombre */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: ".1em",
                  opacity: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {plan.nombre}
              </div>

              {/* Precio */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 52, fontWeight: 1000, lineHeight: 1 }}>
                  {precio}€
                </span>
                <span style={{ opacity: 0.5, fontSize: 14, marginBottom: 8 }}>
                  /mes
                </span>
              </div>

              {anual && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#86efac",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Facturado anualmente · ahorras {(plan.precio.mensual - plan.precio.anual) * 12}€/año
                </div>
              )}

              <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                {plan.descripcion}
              </p>

              {/* Botón */}
              <button
                onClick={() => router.push(`/checkout?plan=${encodeURIComponent(plan.nombre)}&precio=${precio}`)}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 12,
                  border: `1px solid ${plan.btnBorder}`,
                  background: plan.btnBg,
                  color: plan.btnColor,
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: "pointer",
                  marginBottom: 24,
                  letterSpacing: ".02em",
                }}
              >
                Comprar
              </button>

              {/* Separador */}
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,.08)",
                  marginBottom: 20,
                }}
              />

              {/* Features incluidas */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 11,
                      fontSize: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        background: "rgba(34,197,94,.18)",
                        border: "1px solid rgba(34,197,94,.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        flexShrink: 0,
                        color: "#86efac",
                        fontWeight: 900,
                      }}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}

                {/* Features NO incluidas */}
                {plan.noFeatures.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 11,
                      fontSize: 14,
                      opacity: 0.3,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        background: "rgba(255,255,255,.05)",
                        border: "1px solid rgba(255,255,255,.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        flexShrink: 0,
                        fontWeight: 900,
                      }}
                    >
                      ✕
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ── GARANTÍA ── */}
      <div
        style={{
          maxWidth: 700,
          margin: "60px auto 0",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 16,
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 40, flexShrink: 0 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
              Garantía de devolución 30 días
            </div>
            <div style={{ opacity: 0.6, fontSize: 14, lineHeight: 1.6 }}>
              Si no estás satisfecho en los primeros 30 días, te devolvemos el dinero sin preguntas.
              Sin letra pequeña.
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div
        style={{
          maxWidth: 900,
          margin: "60px auto 0",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        {[
          { valor: "+200", label: "Restaurantes activos" },
          { valor: "99.9%", label: "Uptime garantizado" },
          { valor: "< 2min", label: "Tiempo de respuesta soporte" },
          { valor: "4.9★", label: "Valoración media" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              textAlign: "center",
              padding: "24px 16px",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 14,
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 1000, marginBottom: 6 }}>{s.valor}</div>
            <div style={{ fontSize: 13, opacity: 0.55 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FAQ ── */}
      <div
        style={{
          maxWidth: 700,
          margin: "60px auto 0",
          padding: "0 24px",
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 1000,
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          Preguntas frecuentes
        </h2>

        {faqs.map((faq, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.10)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              style={{
                width: "100%",
                padding: "18px 20px",
                background: "transparent",
                border: "none",
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              {faq.q}
              <span
                style={{
                  fontSize: 20,
                  opacity: 0.5,
                  flexShrink: 0,
                  transform: faqOpen === i ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform .2s",
                }}
              >
                +
              </span>
            </button>

            {faqOpen === i && (
              <div
                style={{
                  padding: "0 20px 18px",
                  fontSize: 14,
                  opacity: 0.65,
                  lineHeight: 1.7,
                  borderTop: "1px solid rgba(255,255,255,.07)",
                  paddingTop: 14,
                }}
              >
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── CTA FINAL ── */}
      <div
        style={{
          maxWidth: 600,
          margin: "60px auto 0",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 32, fontWeight: 1000, marginBottom: 12 }}>
          ¿Listo para empezar?
        </h2>
        <p style={{ opacity: 0.6, fontSize: 16, marginBottom: 28 }}>
          14 días gratis, sin tarjeta de crédito. Configura tu restaurante en menos de 5 minutos.
        </p>
        <button
          style={{
            padding: "16px 40px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 17,
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(124,58,237,.4)",
            letterSpacing: ".02em",
          }}
        >
          Ver planes →
        </button>
        <div style={{ marginTop: 14, fontSize: 13, opacity: 0.4 }}>
          Sin permanencia · Cancela cuando quieras
        </div>
      </div>
    </main>
  );
}
