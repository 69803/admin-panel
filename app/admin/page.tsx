"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Pedido = {
  id: number;
  estado?: string;
  created_at?: string | null;
  fecha_hora?: string | null;
};

type MenuItem = {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string | null;
};

function normalizeApiUrl(raw?: string) {
  if (!raw) return null;
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url) && !url.startsWith("//")) url = `https://${url}`;
  if (url.startsWith("//")) url = `https:${url}`;
  url = url.replace(/^http:\/\//i, "https://");
  url = url.replace(/\/+$/, "");
  return url;
}

const API_BASE =
  normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL) ||
  "https://restaurante-backend-q43k.onrender.com";

console.log("ADMIN DASHBOARD API_BASE =", API_BASE);

async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/menu`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error menú ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchPedidosLive(): Promise<Pedido[]> {
  const res = await fetch(`${API_BASE}/pedidos`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error pedidos ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function normalizeEstado(raw: any) {
  const s = String(raw ?? "pendiente").trim().toLowerCase();
  const allowed = ["pendiente", "preparando", "listo", "entregado", "cancelado"];
  return allowed.includes(s) ? s : "pendiente";
}

function money(v: number) {
  return `€ ${v.toFixed(2)}`;
}

// Simple SVG sparkline chart
function SparkLine({ values, color = "#6C5CE7", height = 80 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 300;
  const h = height;
  const pad = 8;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;
  const areaD = `M ${pts[0]} L ${pts.join(" L ")} L ${pad + (w - pad * 2)},${h - pad} L ${pad},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Card with shadow
const card: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
  padding: "20px 22px",
  border: "1px solid rgba(0,0,0,0.04)",
};

const badge = (bg: string, fg: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  background: bg,
  color: fg,
  letterSpacing: 0.3,
});

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  // Carga foto y nombre desde localStorage
  useEffect(() => {
    function readProfile() {
      try {
        const raw = localStorage.getItem("admin_profile_v1");
        const p = raw ? JSON.parse(raw) : {};
        setProfilePhoto(p.photo ?? null);
        setProfileName(p.nombre ?? "");
      } catch {}
    }
    readProfile();
    window.addEventListener("profile-updated", readProfile);
    return () => window.removeEventListener("profile-updated", readProfile);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      setError(null);
      const [m, p] = await Promise.all([fetchMenu(), fetchPedidosLive()]);
      setMenu(m);
      setPedidos(p);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando datos");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const totalPlatos = menu.length;
    const categorias = new Set<string>();
    for (const it of menu) {
      const c = (it.categoria ?? "").toString().trim();
      if (c) categorias.add(c.toUpperCase());
    }
    const countByEstado: Record<string, number> = {
      pendiente: 0, preparando: 0, listo: 0, entregado: 0, cancelado: 0,
    };
    for (const p of pedidos) countByEstado[normalizeEstado(p.estado)]++;
    const topCaros = menu.slice().sort((a, b) => (Number(b.precio) || 0) - (Number(a.precio) || 0)).slice(0, 3);
    const promedioPrecio = menu.length
      ? menu.reduce((acc, it) => acc + (Number(it.precio) || 0), 0) / menu.length : 0;
    const totalIngresos = pedidos.reduce(() => 0, 0); // placeholder
    return { totalPlatos, totalCategorias: categorias.size, countByEstado, topCaros, promedioPrecio, totalIngresos };
  }, [menu, pedidos]);

  // Fake sparkline data seeded from real counts for visual interest
  const sparkData = useMemo(() => {
    const base = stats.totalPlatos || 10;
    return [base * 0.6, base * 0.5, base * 0.7, base * 0.65, base * 0.9, base * 0.85, base];
  }, [stats.totalPlatos]);

  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 16px",
    borderRadius: 10,
    border: "1px solid #DDE3E8",
    background: "#FFFFFF",
    color: "#111111",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    whiteSpace: "nowrap" as const,
  };

  // Tile card component
  const TileCard = ({
    href, title, desc, icon, badgeEl, extra,
  }: {
    href: string; title: string; desc: string; icon: string;
    badgeEl?: React.ReactNode; extra?: React.ReactNode;
  }) => (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div
        style={{
          ...card,
          padding: "20px 22px",
          minHeight: 160,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          cursor: "pointer",
          transition: "box-shadow 150ms ease, transform 150ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 26 }}>{icon}</span>
          {badgeEl}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111111", marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#777777", lineHeight: 1.5, flex: 1 }}>{desc}</div>
        {extra ?? (
          <div style={{ fontSize: 13, fontWeight: 600, color: "#6C5CE7", marginTop: 4 }}>Abrir →</div>
        )}
      </div>
    </Link>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6FA", color: "#111111" }}>

      {/* ── TOP HEADER ── */}
      <div style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #EAECF0",
        padding: "0 36px",
        height: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#111111", letterSpacing: -0.4 }}>
            El Rincón de Domingo
          </div>
          <div style={{ fontSize: 12, color: "#AAAAAA", marginTop: 2, fontWeight: 500 }}>Panel de administración</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={load}
            disabled={busy}
            style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}
          >
            🔄 Refrescar
          </button>
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              title="Mi perfil"
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: profileOpen ? "#F4F6FA" : "none",
                border: "1px solid",
                borderColor: profileOpen ? "#DDE3E8" : "transparent",
                borderRadius: 14,
                cursor: "pointer",
                padding: "6px 12px 6px 6px",
                transition: "all 140ms ease",
              }}
            >
              {/* Avatar grande */}
              <div style={{
                width: 52, height: 52, borderRadius: 999,
                background: profilePhoto ? "transparent" : "linear-gradient(135deg, #6C5CE7, #a29bfe)",
                display: "grid", placeItems: "center",
                color: "#fff", fontWeight: 800, fontSize: 20,
                border: profileOpen ? "3px solid #6C5CE7" : "3px solid #EAECF0",
                overflow: "hidden",
                transition: "border 140ms ease",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}>
                {profilePhoto
                  ? <img src={profilePhoto} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (profileName ? profileName[0].toUpperCase() : "A")
                }
              </div>
              {/* Nombre + rol */}
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111111", lineHeight: 1.3 }}>
                  {profileName || "Admin"}
                </div>
                <div style={{ fontSize: 11, color: "#888888" }}>El Rincón de Domingo</div>
              </div>
              <div style={{ fontSize: 10, color: "#BBBBBB", marginLeft: 4 }}>▼</div>
            </button>

            {profileOpen && (
              <div style={{
                position: "absolute",
                right: 0,
                top: 72,
                width: 250,
                background: "#FFFFFF",
                borderRadius: 14,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid #EAECF0",
                overflow: "hidden",
                zIndex: 999,
              }}>
                {/* Header */}
                <div style={{
                  padding: "16px",
                  background: "linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 999,
                    background: profilePhoto ? "transparent" : "rgba(255,255,255,0.25)",
                    display: "grid", placeItems: "center",
                    fontWeight: 800, color: "#fff", fontSize: 18, flexShrink: 0,
                    overflow: "hidden", border: "2px solid rgba(255,255,255,0.4)",
                  }}>
                    {profilePhoto
                      ? <img src={profilePhoto} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (profileName ? profileName[0].toUpperCase() : "A")
                    }
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{profileName || "Admin"}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>El Rincón de Domingo</div>
                  </div>
                </div>

                {/* Opciones */}
                {[
                  { icon: "🖼️", label: "Cambiar foto de perfil", href: "/admin/profile" },
                  { icon: "👤", label: "Datos personales", href: "/admin/profile" },
                  { icon: "💳", label: "Plan de pago", href: "/pricing" },
                  { icon: "🔑", label: "Cambiar contraseña", href: "/admin/profile" },
                  { icon: "⚙️", label: "Configuración", href: "/admin/config" },
                ].map((item) => {
                  const rowStyle: React.CSSProperties = {
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 16px", cursor: "pointer",
                    fontSize: 13, color: "#222222", fontWeight: 500,
                    transition: "background 100ms ease",
                    textDecoration: "none",
                  };
                  const hoverOn = (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = "#F4F6FA");
                  const hoverOff = (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = "transparent");

                  return item.href ? (
                    <Link key={item.label} href={item.href} style={rowStyle}
                      onClick={() => setProfileOpen(false)}
                      onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                    </Link>
                  ) : (
                    <div key={item.label} style={rowStyle}
                      onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                      onClick={() => { setProfileOpen(false); alert(`"${item.label}" próximamente disponible.`); }}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                    </div>
                  );
                })}

                {/* Cerrar sesión */}
                <div style={{ height: 1, background: "#EAECF0", margin: "4px 0" }} />
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 16px", cursor: "pointer",
                    fontSize: 13, color: "#DC2626", fontWeight: 600,
                    transition: "background 100ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => {
                    setProfileOpen(false);
                    localStorage.removeItem("admin_auth_v1");
                    window.location.href = "/login";
                  }}
                >
                  <span style={{ fontSize: 16 }}>🚪</span> Cerrar sesión
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 36px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* ── ERROR ── */}
        {error && (
          <div style={{ ...card, background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.25)", color: "#991B1B" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── STATS ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>

          {/* Pedidos hoy */}
          <div style={card}>
            <div style={{ fontSize: 12, color: "#888888", fontWeight: 600, marginBottom: 6 }}>Pedidos hoy</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
                {loading ? "…" : pedidos.length}
              </div>
              <div style={{ display: "flex", gap: 4, fontSize: 18 }}>🛒</div>
            </div>
            <div style={{ fontSize: 12, color: "#888888", marginTop: 6 }}>Platos totales: {loading ? "…" : stats.totalPlatos}</div>
          </div>

          {/* Platos activos */}
          <div style={card}>
            <div style={{ fontSize: 12, color: "#888888", fontWeight: 600, marginBottom: 6 }}>Platos activos</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
                {loading ? "…" : stats.totalPlatos}
              </div>
              <span style={badge("#E9E4FF", "#6C5CE7")}>📋 Menú</span>
            </div>
            <div style={{ fontSize: 12, color: "#888888", marginTop: 6 }}>Precio promedio: {money(stats.promedioPrecio)}</div>
          </div>

          {/* Categorías */}
          <div style={card}>
            <div style={{ fontSize: 12, color: "#888888", fontWeight: 600, marginBottom: 6 }}>Categorías</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
                {loading ? "…" : stats.totalCategorias}
              </div>
              <span style={badge("#D1FAE5", "#065F46")}>✓ Activas</span>
            </div>
            <div style={{ fontSize: 12, color: "#888888", marginTop: 6 }}>Detectadas desde la DB</div>
          </div>

          {/* Refrescar / acciones */}
          <div style={{ ...card, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 }}>
            <button
              onClick={load}
              disabled={busy}
              style={{
                ...btnStyle,
                width: "100%",
                justifyContent: "center",
                background: "#6C5CE7",
                color: "#fff",
                border: "none",
                opacity: busy ? 0.6 : 1,
                fontSize: 14,
                padding: "11px 16px",
              }}
            >
              🔄 Refrescar datos
            </button>
            <Link href="/admin/kds" style={{ ...btnStyle, width: "100%", justifyContent: "center", textAlign: "center" }}>
              👨‍🍳 Ir a Cocina
            </Link>
          </div>
        </div>

        {/* ── CHART + PEDIDOS ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "start" }}>

          {/* Ventas / sparkline */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Platos en menú</div>
                <div style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>Distribución por categoría</div>
              </div>
              <span style={badge("#E9E4FF", "#6C5CE7")}>📊 Hoy</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <SparkLine values={sparkData} color="#6C5CE7" height={100} />
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
              {Object.entries(stats.countByEstado).map(([estado, n]) => (
                <div key={estado} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{n}</div>
                  <div style={{ fontSize: 11, color: "#888888", textTransform: "capitalize" }}>{estado}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pedidos hoy — estados */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Pedidos hoy</div>
              <Link href="/admin/kds" style={{ fontSize: 11, color: "#6C5CE7", textDecoration: "none", fontWeight: 600 }}>
                Ver KDS →
              </Link>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              <span style={badge("#FEF3C7", "#B45309")}>🔸 PENDIENTE · {stats.countByEstado.pendiente}</span>
              <span style={badge("#DBEAFE", "#1D4ED8")}>🔹 PREPARANDO · {stats.countByEstado.preparando}</span>
              <span style={badge("#D1FAE5", "#065F46")}>✅ LISTO · {stats.countByEstado.listo}</span>
              <span style={badge("#FEE2E2", "#991B1B")}>❌ CANCELADO · {stats.countByEstado.cancelado}</span>
            </div>

            <div style={{ borderTop: "1px solid #F0F0F0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#888888" }}>Total pedidos activos</span>
                <span style={{ fontWeight: 700 }}>{stats.countByEstado.pendiente + stats.countByEstado.preparando}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#888888" }}>Entregados</span>
                <span style={{ fontWeight: 700, color: "#065F46" }}>{stats.countByEstado.entregado}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#888888" }}>Precio promedio menú</span>
                <span style={{ fontWeight: 700 }}>{money(stats.promedioPrecio)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MÓDULOS TILES ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <TileCard
            href="/"
            title="Menú (CRUD)"
            desc="Gestiona platos, categorías dinámicas, filtros, búsqueda y paginación."
            icon="🍽️"
            badgeEl={<span style={badge("#D1FAE5", "#065F46")}>ACTIVO</span>}
          />
          <TileCard
            href="/admin/kds"
            title="KDS — Cocina"
            desc="Pantalla tipo cocina: pendientes → preparando → listo → entregado."
            icon="👨‍🍳"
            badgeEl={<span style={badge("#DBEAFE", "#1D4ED8")}>LIVE</span>}
          />
          <TileCard
            href="/admin/analytics"
            title="Analytics Pro"
            desc="Gráficos estilo acciones: diario / semanal / mensual / anual + filtro por plato."
            icon="📈"
            badgeEl={<span style={badge("#E9E4FF", "#6C5CE7")}>PRO</span>}
          />
          <TileCard
            href="/admin/reportes"
            title="Reportes"
            desc="Resumen por periodo + Top platos + acciones administrativas."
            icon="📊"
            badgeEl={<span style={badge("#FEF3C7", "#B45309")}>RESUMEN</span>}
          />
        </div>

        {/* ── BOTTOM ROW: Insight + Reportes + Contabilidad ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

          {/* Insight rápido */}
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Insight rápido</div>
            <div style={{ fontSize: 12, color: "#888888", marginBottom: 14 }}>Top 3 platos más caros</div>
            {loading ? (
              <div style={{ color: "#888888", fontSize: 13 }}>Cargando…</div>
            ) : stats.topCaros.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.topCaros.map((x) => (
                  <div
                    key={x.id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#F8F9FB",
                      border: "1px solid #EAECF0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {x.nombre} <span style={{ color: "#AAAAAA", fontWeight: 500 }}>#{x.id}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{money(Number(x.precio) || 0)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#888888", fontSize: 13 }}>No hay platos aún</div>
            )}
          </div>

          {/* Reportes */}
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24 }}>📊</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Reportes</div>
                <div style={{ fontSize: 13, color: "#777777", marginTop: 4, lineHeight: 1.5 }}>
                  Resumen por periodo + Top platos + acciones administrativas.
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <Link
              href="/admin/reportes"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 10,
                background: "#F8F9FB",
                border: "1px solid #EAECF0",
                textDecoration: "none",
                color: "#111111",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Ver reporte completo <span style={{ color: "#6C5CE7" }}>›</span>
            </Link>
            <Link
              href="/admin/kds/mensual"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 10,
                background: "#F8F9FB",
                border: "1px solid #EAECF0",
                textDecoration: "none",
                color: "#111111",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              KDS Mensual <span style={{ color: "#6C5CE7" }}>›</span>
            </Link>
          </div>

          {/* Contabilidad */}
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24 }}>📒</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Contabilidad</div>
                <div style={{ fontSize: 13, color: "#777777", marginTop: 4, lineHeight: 1.5 }}>
                  Gastos, balance y control financiero del restaurante.
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <span style={badge("#D1FAE5", "#065F46")}>FINANZAS</span>
            <Link
              href="/admin/contabilidad"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 10,
                background: "#F8F9FB",
                border: "1px solid #EAECF0",
                textDecoration: "none",
                color: "#111111",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Abrir contabilidad <span style={{ color: "#6C5CE7" }}>›</span>
            </Link>
          </div>
        </div>

        <div style={{ fontSize: 11, color: "#AAAAAA", paddingBottom: 8 }}>
          ⓘ Nota: Este dashboard trae datos en vivo desde la API de tu menú/platos.
        </div>
      </div>
    </div>
  );
}
