"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { TrackingProvider } from "./components/TrackingProvider";

function Shell({ children }: { children: React.ReactNode }) {
  const { bg } = useTheme();
  return (
    <div id="admin-shell" style={{ display: "flex", minHeight: "100vh", background: bg }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // App totalmente pública: sin login ni suscripción
  const isLoginRoute = pathname === "/login" || pathname?.startsWith("/login/");
  const isBareRoute = pathname === "/hello" || pathname?.startsWith("/hello/") || pathname === "/pricing";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isLoginRoute) router.replace("/admin");
  }, [mounted, isLoginRoute, router]);

  if (!mounted || isLoginRoute) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh" }} />;
  }

  if (isBareRoute) return <>{children}</>;

  return (
    <ThemeProvider>
      <TrackingProvider>
        <Shell>{children}</Shell>
      </TrackingProvider>
    </ThemeProvider>
  );
}
