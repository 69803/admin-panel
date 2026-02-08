"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";

const AUTH_KEY = "admin_auth_v1";

function isAuthed(): boolean {
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

  const isLoginRoute = pathname === "/login" || pathname?.startsWith("/login/");
  const isProtected = pathname === "/admin" || pathname?.startsWith("/admin/");

  useEffect(() => {
    if (isLoginRoute) return;
    if (isProtected && !isAuthed()) {
      router.replace("/login");
    }
  }, [isLoginRoute, isProtected, router]);

  // Login: sin sidebar
  if (isLoginRoute) return <>{children}</>;

  // Si está intentando entrar a /admin sin auth, no mostramos nada (evita que "cargue" la página)
  if (isProtected && !isAuthed()) return null;

  // Resto: con sidebar
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
