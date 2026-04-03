"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

declare global {
  interface Window {
    Paddle: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: {
        open: (opts: {
          items: { priceId: string; quantity: number }[];
          customData?: Record<string, string>;
        }) => void;
      };
    };
  }
}

const planes = [
  {
    nombre: "Básico",
    priceIds: {
      mensual: "pri_01kk7g7whpssf3kxm8wvcth4th",
      anual: "pri_01kmxk9v7rzfrzfx8xe13y110y",
    },
    precio: { mensual: 39 },
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
    ],
    noFeatures: ["Reportes avanzados", "Contabilidad", "Multi restaurante", "Soporte prioritario"],
  },
  {
    nombre: "Pro",
    priceIds: {
      mensual: "pri_01kk7ggah21arxbmy0j9bct4hx",
      anual: "pri_01kmxjy5jtjeqmapkgfw3n7q04",
    },
    precio: { mensual: 69 },
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
    ],
    noFeatures: ["Multi restaurante", "Soporte prioritario"],
  },
  {
    nombre: "Premium",
    priceIds: {
      mensual: "pri_01kk7gj7v1k6x1egznqr98yhc1",
      anual: "pri_01kmxkbfk37gpxrxyv3k0ppatt",
    },
    precio: { mensual: 94 },
    descripcion: "Solución enterprise para cadenas y grupos de restauración.",
    color: "rgba(255,255,255,.07)",
    border: "rgba(255,255,255,.12)",
    badge: null,
    btnBg: "rgba(255,255,255,.10)",
    btnBorder: "rgba(255,255,255,.18)",
    btnColor: "#fff",
    features: [
      "Multi restaurante (ilimitado)",
      "KDS ilimitados",
      "API personalizada",
      "Manager dedicado",
      "Base de datos de gran capacidad",
      "Mobile app (App Store + Google Play) - 20% Discount",
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
  const [alertAnim, setAlertAnim] = useState<object | null>(null);

  useEffect(() => {
    fetch("/alert-animation.json").then((r) => r.json()).then(setAlertAnim).catch(() => {});
  }, []);

  function openPaddleCheckout(planNombre: string, priceId: string) {
    if (typeof window !== "undefined" && window.Paddle) {
      // Read logged-in email from localStorage so Paddle includes it in all webhook events
      // as event.data.custom_data.email — this is how we link the subscription to the user
      let userEmail = "";
      try {
        const raw = localStorage.getItem("admin_auth_v1");
        userEmail = (raw ? JSON.parse(raw)?.email : "") ?? "";
      } catch { /* ignore */ }

      console.log(`[Pricing] Opening checkout — plan=${planNombre} priceId=${priceId} email=${userEmail || "(not found)"}`);

      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        ...(userEmail ? { customData: { email: userEmail } } : {}),
      });
    } else {
      console.error("Paddle not initialized. Plan:", planNombre, "PriceId:", priceId);
    }
  }

  useEffect(() => {
    if (window.Paddle) {
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      window.Paddle.Environment.set("production");
      window.Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
      });
    };
    document.body.appendChild(script);
  }, []);

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

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          {alertAnim && (
            <Lottie animationData={alertAnim} loop style={{ width: 200, height: 200, flexShrink: 0 }} />
          )}
          <div
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: 999,
              background: "rgba(220,38,38,.30)",
              border: "1px solid rgba(239,68,68,.8)",
              fontSize: 17,
              fontWeight: 800,
              color: "#ff6b6b",
              letterSpacing: ".02em",
              boxShadow: "0 0 22px rgba(239,68,68,.45)",
            }}
          >
            ⚠️ Ups! Creo que necesitas actualizar tu plan. Escoge el mejor plan para ti 🙂
          </div>
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
          necesita
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
            const yearlyPrice = +(plan.precio.mensual * 12 * 0.8).toFixed(2);
          const yearlySaving = +(plan.precio.mensual * 12 * 0.2).toFixed(2);
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
                  {anual ? yearlyPrice : plan.precio.mensual}€
                </span>
                <span style={{ opacity: 0.5, fontSize: 14, marginBottom: 8 }}>
                  {anual ? "/año" : "/mes"}
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
                  Facturado anualmente · ahorras {yearlySaving}€/año
                </div>
              )}

              <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                {plan.descripcion}
              </p>

              {/* Botón */}
              <button
                onClick={() => openPaddleCheckout(plan.nombre, anual ? plan.priceIds.anual : plan.priceIds.mensual)}
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
          { valor: "100%", label: "Active" },
          { valor: "99.9%", label: "Uptime garantizado" },
          { valor: "24/7", label: "Soporte" },
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

      {/* ── QUÉ INCLUYE ── */}
      <div style={{ maxWidth: 900, margin: "60px auto 0", padding: "0 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 1000, textAlign: "center", marginBottom: 8 }}>
          ¿Qué incluye el producto?
        </h2>
        <p style={{ textAlign: "center", opacity: 0.55, fontSize: 14, marginBottom: 32 }}>
          Un panel web completo para la gestión diaria de tu restaurante, accesible desde cualquier dispositivo con navegador.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {[
            { icon: "🍽️", titulo: "Gestión de menú", desc: "Crea, edita y organiza tu carta con categorías, precios e imágenes. Sin límite de platos." },
            { icon: "📋", titulo: "Pedidos en tiempo real", desc: "Los pedidos llegan al instante al panel y a la cocina. Sin papel, sin errores." },
            { icon: "👨‍🍳", titulo: "KDS Cocina (Kitchen Display)", desc: "Pantalla de cocina digital con prioridades, tiempos y estados por pedido." },
            { icon: "📊", titulo: "Reportes y estadísticas", desc: "Ventas diarias, semanales y mensuales. Exporta a Excel o PDF con un clic." },
            { icon: "📒", titulo: "Contabilidad y libro diario", desc: "Registra ingresos, gastos y cierres de caja. Balance mensual automático." },
            { icon: "🔒", titulo: "Acceso seguro HTTPS", desc: "Panel protegido con autenticación y conexión cifrada SSL/TLS en todo momento." },
          ].map((item) => (
            <div key={item.titulo} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, padding: "22px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 6 }}>{item.titulo}</div>
              <div style={{ opacity: 0.55, fontSize: 13, lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div style={{ maxWidth: 600, margin: "60px auto 0", padding: "0 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 1000, marginBottom: 12 }}>¿Listo para empezar?</h2>
        <p style={{ opacity: 0.6, fontSize: 16, marginBottom: 12 }}>
          14 días gratis, sin tarjeta de crédito. Configura tu restaurante en menos de 5 minutos.
        </p>
        <div style={{ fontSize: 13, opacity: 0.4 }}>Sin permanencia · Cancela cuando quieras</div>
      </div>

      {/* ── INFO DESARROLLADOR ── */}
      <div style={{ maxWidth: 700, margin: "60px auto 0", padding: "0 24px" }}>
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "28px 32px" }}>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 16, opacity: 0.8 }}>Información del desarrollador</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {[
              { label: "Producto", value: "Panel de Gestión para Restaurantes" },
              { label: "Desarrolladores", value: "Novaera" },
              { label: "Contacto", value: "compipana2@gmail.com" },
              { label: "Tecnología", value: "Next.js · Vercel · Node.js" },
              { label: "Seguridad", value: "🔒 HTTPS · SSL/TLS cifrado" },
              { label: "Disponibilidad", value: "24/7 · 99.9% uptime" },
            ].map((d) => (
              <div key={d.label}>
                <div style={{ fontSize: 11, opacity: 0.4, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>{d.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TEST CHECKOUT BUTTON (invisible) ── */}
      <button
        onClick={() => {
          console.log("TEST CHECKOUT TRIGGERED — 1€");
          openPaddleCheckout("Test 1€", "pri_01kmzey1x9qs1bpct6dcn4cxe3");
        }}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          width: 80,
          height: 80,
          opacity: 0,
          zIndex: 9999,
          cursor: "pointer",
          background: "transparent",
          border: "none",
        }}
        aria-hidden="true"
      />

      {/* ── FOOTER LEGAL ── */}
      <div style={{ maxWidth: 700, margin: "48px auto 0", padding: "0 24px 40px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px 24px", marginBottom: 14 }}>
          {[
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Refund Policy", href: "/refunds" },
          ].map((link) => (
            <a key={link.href} href={link.href} style={{ color: "#a78bfa", fontSize: 13, textDecoration: "none", opacity: 0.8 }}>
              {link.label}
            </a>
          ))}
        </div>
        <div style={{ fontSize: 12, opacity: 0.35 }}>
          © {new Date().getFullYear()} Panel Restaurante · Desarrollado por Kristian Barrios · Todos los derechos reservados
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("admin_auth_v3");
            window.location.href = "/login";
          }}
          style={{
            marginTop: 24,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,.18)",
            fontSize: 11,
            cursor: "pointer",
            padding: "4px 8px",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
