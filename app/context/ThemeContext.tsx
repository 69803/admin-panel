"use client";

import { createContext, useContext, useEffect, useState } from "react";

const THEME_KEY = "admin_bg_theme";

export const BG_COLORS = [
  { id: "original", hex: "#F4F6FA", label: "Original",   desc: "Azul gris claro" },
  { id: "soft",     hex: "#E2E6EF", label: "Suave",      desc: "Menos blanco"    },
  { id: "medium",   hex: "#CDD2DE", label: "Gris medio", desc: "Más oscuro"      },
  { id: "dark-pro", hex: "#0F172A", label: "Dark Pro",   desc: "Profesional"     },
];

const DEFAULT_BG = BG_COLORS[0].hex;

// ── CSS variable tokens per theme ────────────────────────────────────────────
const TOKENS: Record<string, Record<string, string>> = {
  // ── Original: fondo azul-gris claro, cards blancas ───────────────────────
  "#F4F6FA": {
    "--t-bg":      "#F4F6FA",
    "--t-card":    "#FFFFFF",
    "--t-card2":   "#F4F6FA",
    "--t-text":    "#111111",
    "--t-text2":   "#666666",
    "--t-text3":   "#999999",
    "--t-border":  "#E2E6EF",
    "--t-border2": "#EEF0F4",
    "--t-border3": "#CDD2DE",
    "--t-header":  "#FFFFFF",
    "--t-input":   "#F8F9FC",
    "--t-hover":   "#F0F2F7",
    "--t-sborder": "rgba(0,0,0,0.05)",
    "--t-shadow":  "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.05)",
  },
  // ── Suave: todo con un leve tinte gris ───────────────────────────────────
  "#E2E6EF": {
    "--t-bg":      "#E2E6EF",
    "--t-card":    "#ECEEF5",
    "--t-card2":   "#E4E7F0",
    "--t-text":    "#111111",
    "--t-text2":   "#555555",
    "--t-text3":   "#888888",
    "--t-border":  "#C8CEDB",
    "--t-border2": "#D6DAE6",
    "--t-border3": "#B8BFCC",
    "--t-header":  "#ECEEF5",
    "--t-input":   "#E4E7F0",
    "--t-hover":   "#D8DCE8",
    "--t-sborder": "rgba(0,0,0,0.07)",
    "--t-shadow":  "0 1px 3px rgba(0,0,0,0.08),0 4px 16px rgba(0,0,0,0.07)",
  },
  // ── Gris medio: todo con tinte gris visible ───────────────────────────────
  "#CDD2DE": {
    "--t-bg":      "#CDD2DE",
    "--t-card":    "#D9DDED",
    "--t-card2":   "#CDD2DE",
    "--t-text":    "#111111",
    "--t-text2":   "#444444",
    "--t-text3":   "#777777",
    "--t-border":  "#B5BBC9",
    "--t-border2": "#C4CAD8",
    "--t-border3": "#A8B0C0",
    "--t-header":  "#D9DDED",
    "--t-input":   "#CDD2DE",
    "--t-hover":   "#C0C6D5",
    "--t-sborder": "rgba(0,0,0,0.09)",
    "--t-shadow":  "0 1px 4px rgba(0,0,0,0.10),0 4px 16px rgba(0,0,0,0.09)",
  },
  // ── Dark Pro: todo oscuro ─────────────────────────────────────────────────
  "#0F172A": {
    "--t-bg":      "#0F172A",
    "--t-card":    "#1E293B",
    "--t-card2":   "#162032",
    "--t-text":    "#E2E8F0",
    "--t-text2":   "#94A3B8",
    "--t-text3":   "#64748B",
    "--t-border":  "rgba(255,255,255,0.10)",
    "--t-border2": "rgba(255,255,255,0.06)",
    "--t-border3": "rgba(255,255,255,0.16)",
    "--t-header":  "#1A2535",
    "--t-input":   "#162032",
    "--t-hover":   "rgba(255,255,255,0.05)",
    "--t-sborder": "rgba(0,0,0,0.35)",
    "--t-shadow":  "0 1px 4px rgba(0,0,0,0.35),0 4px 20px rgba(0,0,0,0.25)",
  },
};

function applyTokens(hex: string) {
  const tokens = TOKENS[hex] ?? TOKENS[DEFAULT_BG];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v);
}

// ── Context ──────────────────────────────────────────────────────────────────
interface ThemeCtx { bg: string; setBg: (c: string) => void }
const ThemeContext = createContext<ThemeCtx>({ bg: DEFAULT_BG, setBg: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [bg, setBgState] = useState(DEFAULT_BG);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) ?? DEFAULT_BG;
    setBgState(saved);
    applyTokens(saved);
  }, []);

  const setBg = (color: string) => {
    setBgState(color);
    localStorage.setItem(THEME_KEY, color);
    applyTokens(color);
  };

  return <ThemeContext.Provider value={{ bg, setBg }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
