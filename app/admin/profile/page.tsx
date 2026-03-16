"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PROFILE_KEY = "admin_profile_v1";
const AUTH_KEY = "admin_auth_v1";

type Profile = {
  nombre: string;
  apellido: string;
  email: string;
  photo: string | null;
  password: string;
};

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY) ?? "{}");
    const saved = raw ? JSON.parse(raw) : {};
    return {
      nombre: saved.nombre ?? "",
      apellido: saved.apellido ?? "",
      email: saved.email ?? auth.email ?? "",
      photo: saved.photo ?? null,
      password: saved.password ?? "",
    };
  } catch {
    return { nombre: "", apellido: "", email: "", photo: null, password: "" };
  }
}

function saveProfile(p: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("profile-updated"));
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
  border: "1px solid rgba(0,0,0,0.04)",
  padding: "24px 28px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #DDE3E8",
  background: "#FFFFFF",
  fontSize: 14,
  color: "#111111",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#555555",
  marginBottom: 6,
  display: "block",
};

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile>({ nombre: "", apellido: "", email: "", photo: null, password: "" });
  const [saved, setSaved] = useState(false);

  // Password change fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const updated = { ...profile, photo: base64 };
      setProfile(updated);
      saveProfile(updated);
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    const updated = { ...profile, photo: null };
    setProfile(updated);
    saveProfile(updated);
  }

  function handleSavePersonal() {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleChangePassword() {
    setPwMsg(null);
    const stored = loadProfile();
    if (stored.password && currentPw !== stored.password) {
      setPwMsg({ ok: false, text: "La contraseña actual no es correcta." });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: "La nueva contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    saveProfile({ ...profile, password: newPw });
    setProfile((p) => ({ ...p, password: newPw }));
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwMsg({ ok: true, text: "Contraseña actualizada correctamente." });
  }

  const initials = profile.nombre
    ? `${profile.nombre[0]}${profile.apellido?.[0] ?? ""}`.toUpperCase()
    : "A";

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6FA", color: "#111111" }}>

      {/* Header */}
      <div style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #EAECF0",
        padding: "0 28px",
        height: 62,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 18, color: "#555555", display: "flex", alignItems: "center", gap: 6,
              fontWeight: 600, fontSize: 13,
            } as React.CSSProperties}
          >
            ← Volver
          </button>
          <div style={{ width: 1, height: 20, background: "#EAECF0" }} />
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Mi Perfil</div>
        </div>
      </div>

      <div style={{ padding: "28px", maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── FOTO DE PERFIL ── */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Foto de perfil</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* Avatar */}
            <div
              onClick={() => fileRef.current?.click()}
              title="Cambiar foto"
              style={{
                width: 90,
                height: 90,
                borderRadius: 999,
                background: profile.photo ? "transparent" : "linear-gradient(135deg, #6C5CE7, #a29bfe)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                flexShrink: 0,
                overflow: "hidden",
                border: "3px solid #EAECF0",
                position: "relative",
              }}
            >
              {profile.photo ? (
                <img src={profile.photo} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{initials}</span>
              )}
              {/* Overlay hover */}
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0, transition: "opacity 150ms",
                borderRadius: 999, fontSize: 20,
              }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                📷
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: "9px 18px", borderRadius: 10, border: "1px solid #DDE3E8",
                  background: "#FFFFFF", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#111111",
                }}
              >
                📁 Subir foto desde PC
              </button>
              {profile.photo && (
                <button
                  onClick={handleRemovePhoto}
                  style={{
                    padding: "9px 18px", borderRadius: 10, border: "1px solid #FECACA",
                    background: "#FEF2F2", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    color: "#DC2626",
                  }}
                >
                  🗑️ Quitar foto
                </button>
              )}
              <div style={{ fontSize: 12, color: "#888888" }}>JPG, PNG o GIF · Máx. 5 MB</div>
            </div>
          </div>
        </div>

        {/* ── DATOS PERSONALES ── */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Datos personales</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                style={inputStyle}
                value={profile.nombre}
                placeholder="Tu nombre"
                onChange={(e) => setProfile((p) => ({ ...p, nombre: e.target.value }))}
              />
            </div>

            <div>
              <label style={labelStyle}>Apellido</label>
              <input
                style={inputStyle}
                value={profile.apellido}
                placeholder="Tu apellido"
                onChange={(e) => setProfile((p) => ({ ...p, apellido: e.target.value }))}
              />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                style={{ ...inputStyle, background: "#F8F9FB", color: "#777777", cursor: "not-allowed" }}
                value={profile.email}
                readOnly
                placeholder="correo@ejemplo.com"
              />
              <div style={{ fontSize: 11, color: "#AAAAAA", marginTop: 4 }}>
                El correo está asociado a tu cuenta y no puede cambiarse desde aquí.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSavePersonal}
              style={{
                padding: "10px 22px", borderRadius: 10, border: "none",
                background: "#6C5CE7", color: "#fff", fontWeight: 700,
                fontSize: 14, cursor: "pointer",
              }}
            >
              Guardar cambios
            </button>
            {saved && (
              <span style={{ fontSize: 13, color: "#065F46", fontWeight: 600 }}>✓ Guardado</span>
            )}
          </div>
        </div>

        {/* ── CAMBIAR CONTRASEÑA ── */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Cambiar contraseña</div>
          <div style={{ fontSize: 13, color: "#777777", marginBottom: 20 }}>
            Si es la primera vez, deja "Contraseña actual" vacío.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Contraseña actual</label>
              <input
                style={inputStyle}
                type="password"
                value={currentPw}
                placeholder="••••••••"
                onChange={(e) => setCurrentPw(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Nueva contraseña</label>
              <input
                style={inputStyle}
                type="password"
                value={newPw}
                placeholder="Mínimo 6 caracteres"
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirmar nueva contraseña</label>
              <input
                style={inputStyle}
                type="password"
                value={confirmPw}
                placeholder="Repite la nueva contraseña"
                onChange={(e) => setConfirmPw(e.target.value)}
              />
            </div>
          </div>

          {pwMsg && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: pwMsg.ok ? "#D1FAE5" : "#FEF2F2",
              color: pwMsg.ok ? "#065F46" : "#DC2626",
              border: `1px solid ${pwMsg.ok ? "#A7F3D0" : "#FECACA"}`,
            }}>
              {pwMsg.ok ? "✓" : "⚠️"} {pwMsg.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            style={{
              marginTop: 20, padding: "10px 22px", borderRadius: 10, border: "none",
              background: "#1A1D2E", color: "#fff", fontWeight: 700,
              fontSize: 14, cursor: "pointer",
            }}
          >
            🔑 Cambiar contraseña
          </button>
        </div>

        {/* ── PLAN ── */}
        <div
          onClick={() => router.push("/pricing")}
          style={{
            ...card,
            display: "flex", alignItems: "center", gap: 16,
            cursor: "pointer", transition: "box-shadow 150ms ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)")}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "#F0EEFF", border: "1px solid #C4B5FD",
            display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0,
          }}>
            💳
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Plan de pago</div>
            <div style={{ fontSize: 13, color: "#777777", marginTop: 2 }}>Ver y gestionar tu plan de suscripción.</div>
          </div>
          <div style={{ color: "#AAAAAA", fontSize: 18 }}>›</div>
        </div>

      </div>
    </div>
  );
}
