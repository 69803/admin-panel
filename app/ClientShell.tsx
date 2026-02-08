"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Rutas donde NO queremos sidebar
  const hideSidebar =
    pathname === "/login" || pathname?.startsWith("/login/");

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
