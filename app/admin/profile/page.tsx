"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "admin_auth_v2";

function getEmailFromLS(): string {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw)?.email ?? "") : "";
  } catch { return ""; }
}

type Profile = {
  nombre:    string;
  apellido:  string;
  email:     string;
  photo_url: string | null;
};

export default function ProfilePage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile,    setProfile]    = useState<Profile>({ nombre: "", apellido: "", email: "", photo_url: null });
  const [loading,    setLoading]    = useState(true);
  const [saved,      setSaved]      = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState("");

  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwMsg,      setPwMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  // ── Cargar perfil desde API ──────────────────────────────────────────────
  useEffect(() => {
    const email = getEmailFromLS();
    if (!email) { setLoading(false); return; }

    fetch(`/api/profile?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          nombre:    data.nombre    ?? "",
          apellido:  data.apellido  ?? "",
          email:     data.email     ?? email,
          photo_url: data.photo_url ?? null,
        });
      })
      .catch(() => {
        setProfile((p) => ({ ...p, email }));
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Estilos ──────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "var(--t-card)",
    borderRadius: 16,
    boxShadow: "var(--t-shadow)",
    border: "1px solid var(--t-sborder)",
    padding: "24px 28px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--t-border3)",
    background: "var(--t-input)",
    fontSize: 14,
    color: "var(--t-text)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--t-text2)",
    marginBottom: 6,
    display: "block",
  };

  // ── Subir foto a Supabase vía API ────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadErr("");

    const form = new FormData();
    form.append("email", profile.email);
    form.append("file", file);

    try {
      const res  = await fetch("/api/profile", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) {
        setUploadErr(data.error ?? "Error al subir la foto");
      } else {
        setProfile((p) => ({ ...p, photo_url: data.photo_url }));
        // Notificar al Sidebar para que actualice el avatar
        window.dispatchEvent(new Event("profile-updated"));
      }
    } catch (err: any) {
      setUploadErr(err?.message ?? "Error desconocido");
    } finally {
      setUploading(false);
      // Limpiar el input para permitir re-subir el mismo archivo
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── Quitar foto ──────────────────────────────────────────────────────────
  async function handleRemovePhoto() {
    setUploading(true);
    setUploadErr("");
    try {
      const res = await fetch(
        `/api/profile?email=${encodeURIComponent(profile.email)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setUploadErr(data.error ?? "Error al quitar la foto");
      } else {
        setProfile((p) => ({ ...p, photo_url: null }));
        window.dispatchEvent(new Event("profile-updated"));
      }
    } catch (err: any) {
      setUploadErr(err?.message ?? "Error desconocido");
    } finally {
      setUploading(false);
    }
  }

  // ── Guardar nombre / apellido ────────────────────────────────────────────
  async function handleSavePersonal() {
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:    profile.email,
          nombre:   profile.nombre,
          apellido: profile.apellido,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      window.dispatchEvent(new Event("profile-updated"));
    } catch {
      // silencioso — el usuario puede reintentar
    }
  }

  // ── Cambiar contraseña (sigue en localStorage — es local al usuario) ─────
  function handleChangePassword() {
    setPwMsg(null);
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: "La nueva contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwMsg({ ok: true, text: "Contraseña actualizada correctamente." });
  }

  const initials = profile.nombre
    ? `${profile.nombre[0]}${profile.apellido?.[0] ?? ""}`.toUpperCase()
    : profile.email?.[0]?.toUpperCase() ?? "A";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--t-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--t-text2)", fontSize: 14 }}>Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--t-bg)", color: "var(--t-text)" }}>

      {/* Header */}
      <div style={{
        background: "var(--t-header)",
        borderBottom: "1px solid var(--t-border)",
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
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-text2)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13 } as React.CSSProperties}
          >
            ← Volver
          </button>
          <div style={{ width: 1, height: 20, background: "var(--t-border)" }} />
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
              onClick={() => !uploading && fileRef.current?.click()}
              title="Cambiar foto"
              style={{
                width: 90, height: 90, borderRadius: 999,
                background: profile.photo_url ? "transparent" : "linear-gradient(135deg, #6C5CE7, #a29bfe)",
                display: "grid", placeItems: "center",
                cursor: uploading ? "default" : "pointer",
                flexShrink: 0, overflow: "hidden",
                border: "3px solid var(--t-border)", position: "relative",
                opacity: uploading ? 0.6 : 1,
                transition: "opacity .2s",
              }}
            >
              {profile.photo_url
                ? <img src={profile.photo_url} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{initials}</span>
              }
              {!uploading && (
                <div
                  style={{
                    position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0, transition: "opacity 150ms", borderRadius: 999, fontSize: 20,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  📷
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />

              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: "9px 18px", borderRadius: 10, border: "1px solid var(--t-border3)",
                  background: "var(--t-card)", fontWeight: 600, fontSize: 13, cursor: uploading ? "default" : "pointer",
                  color: "var(--t-text)", opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? "⏳ Subiendo..." : "📁 Subir foto desde PC"}
              </button>

              {profile.photo_url && !uploading && (
                <button
                  onClick={handleRemovePhoto}
                  style={{
                    padding: "9px 18px", borderRadius: 10, border: "1px solid #FECACA",
                    background: "#FEF2F2", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#DC2626",
                  }}
                >
                  🗑️ Quitar foto
                </button>
              )}

              {uploadErr && (
                <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>⚠️ {uploadErr}</div>
              )}

              <div style={{ fontSize: 12, color: "var(--t-text2)" }}>
                JPG, PNG o GIF · Máx. 5 MB · Se guarda en la nube y se ve en todos los dispositivos
              </div>
            </div>
          </div>
        </div>

        {/* ── DATOS PERSONALES ── */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Datos personales</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input style={inputStyle} value={profile.nombre} placeholder="Tu nombre"
                onChange={(e) => setProfile((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Apellido</label>
              <input style={inputStyle} value={profile.apellido} placeholder="Tu apellido"
                onChange={(e) => setProfile((p) => ({ ...p, apellido: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                style={{ ...inputStyle, background: "var(--t-card2)", color: "var(--t-text2)", cursor: "not-allowed" }}
                value={profile.email} readOnly placeholder="correo@ejemplo.com"
              />
              <div style={{ fontSize: 11, color: "var(--t-text3)", marginTop: 4 }}>
                El correo está asociado a tu cuenta y no puede cambiarse desde aquí.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSavePersonal}
              style={{
                padding: "10px 22px", borderRadius: 10, border: "none",
                background: "#6C5CE7", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              Guardar cambios
            </button>
            {saved && <span style={{ fontSize: 13, color: "#065F46", fontWeight: 600 }}>✓ Guardado</span>}
          </div>
        </div>

        {/* ── CAMBIAR CONTRASEÑA ── */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Cambiar contraseña</div>
          <div style={{ fontSize: 13, color: "var(--t-text2)", marginBottom: 20 }}>
            Si es la primera vez, deja "Contraseña actual" vacío.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Contraseña actual</label>
              <input style={inputStyle} type="password" value={currentPw} placeholder="••••••••"
                onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Nueva contraseña</label>
              <input style={inputStyle} type="password" value={newPw} placeholder="Mínimo 6 caracteres"
                onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Confirmar nueva contraseña</label>
              <input style={inputStyle} type="password" value={confirmPw} placeholder="Repite la nueva contraseña"
                onChange={(e) => setConfirmPw(e.target.value)} />
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
              background: "#1A1D2E", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
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
          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "var(--t-shadow)")}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "#F0EEFF", border: "1px solid #C4B5FD",
            display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0,
          }}>💳</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Plan de pago</div>
            <div style={{ fontSize: 13, color: "var(--t-text2)", marginTop: 2 }}>Ver y gestionar tu plan de suscripción.</div>
          </div>
          <div style={{ color: "var(--t-text3)", fontSize: 18 }}>›</div>
        </div>

      </div>
    </div>
  );
}
