"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// El checkout ahora se gestiona mediante el modal de Paddle en /pricing.
// Esta ruta redirige automáticamente para evitar páginas huérfanas.
export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pricing");
  }, [router]);

  return null;
}
