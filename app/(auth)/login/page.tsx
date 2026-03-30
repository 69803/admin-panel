"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "admin_auth_v2";

// Contraseñas por correo — el resto de cuentas usan la contraseña por defecto
const DEFAULT_PASSWORD = "1234";
const PASSWORD_OVERRIDES: Record<string, string> = {
  "kristianbarrios8@gmail.com": "Sistema1_",
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return setError("Escribe tu correo.");
    const expectedPassword = PASSWORD_OVERRIDES[normalizedEmail] ?? DEFAULT_PASSWORD;
    if (password !== expectedPassword) return setError("Contraseña incorrecta.");

    setLoading(true);
    try {
      const res = await fetch(`/api/clients?email=${encodeURIComponent(normalizedEmail)}`);
      const data = await res.json();

      if (!data?.allowed) {
        setError("Este correo no tiene acceso.");
        setLoading(false);
        return;
      }

      localStorage.setItem(AUTH_KEY, JSON.stringify({ email: normalizedEmail, ts: Date.now() }));
      router.replace("/admin");
    } catch {
      setError("Error al verificar el acceso. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <p className="text-sm text-gray-600 mt-1">
          Panel de administración del restaurante
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="admin@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
