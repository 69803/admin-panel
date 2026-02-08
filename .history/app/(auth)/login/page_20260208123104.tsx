"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ALLOWED_EMAILS = [
  "gusmeliab@gmail.com",
  "kristianbarrios8@gmail.com",
].map((e) => e.trim().toLowerCase());

const ADMIN_PASSWORD = "1234"; // 👈 cámbiala

const AUTH_KEY = "admin_auth_v1";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  function handleLogin() {
    setError(null);

    if (!normalizedEmail) return setError("Escribe tu correo.");
    if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
      return setError("Este correo no tiene acceso.");
    }
    if (password !== ADMIN_PASSWORD) {
      return setError("Contraseña incorrecta.");
    }

    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ email: normalizedEmail, ts: Date.now() })
    );

    router.replace("/admin");
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
            className="w-full rounded-xl bg-black text-white py-2 font-medium"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
