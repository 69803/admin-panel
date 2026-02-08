"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";

const AUTH_KEY = "admin_auth_v1";

function readAuthedFromLS(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.email;
  } catch {
    return false;
  }
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  const isLoginRoute = pathname === "/login" || pathname?.startsWith("/login/");
  const isProtected = pathname === "/admin" || pathname?.startsWith("/admin/");

  // ✅ Evita hydration mismatch: nada que dependa de localStorage antes de montar
  useEffect(() => {
    setMounted(true);
    setAuthed(readAuthedFromLS());
  }, []);

  // ✅ Si cambia la ruta, re-leemos auth (por si el login guardó el token)
  useEffect(() => {
    if (!mounted) return;
    setAuthed(readAuthedFromLS());
  }, [mounted, pathname]);

  // ✅ Redirección segura
  useEffect(() => {
    if (!mounted) return;
    if (isLoginRoute) return;

    if (isProtected && !authed) {
      router.replace("/login");
    }
  }, [mounted, isLoginRoute, isProtected, authed, router]);

  // Mientras monta: render estable (evita hydration mismatch)
  if (!mounted) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  // Login: sin sidebar
  if (isLoginRoute) return <>{children}</>;

  // Si está intentando entrar a /admin sin auth, no mostramos nada (evita que "cargue" la página)
  if (isProtected && !authed) return null;

  // Resto: con sidebar
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
