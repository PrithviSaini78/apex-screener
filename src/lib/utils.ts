import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Signal, Sector, MarketCapTier } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtPrice(n: number): string {
  return "$" + n.toFixed(2);
}

export function fmtChange(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export function fmtCompact(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return n.toFixed(0);
}

export function fmtPE(pe: number | null): string {
  return pe !== null ? pe.toFixed(1) : "—";
}

export function fmtPercent(n: number): string {
  return n.toFixed(2) + "%";
}

export const SIGNAL_COLORS: Record<Signal, string> = {
  bullish: "#00c97a",
  bearish: "#ff4757",
  neutral: "#9098b0",
  overbought: "#ffa502",
  oversold: "#409eff",
};

export const SECTOR_COLORS: Record<Sector, string> = {
  Technology: "#409eff",
  Healthcare: "#00c97a",
  Finance: "#ffa502",
  Energy: "#ff6b6b",
  Consumer: "#a29bfe",
  Industrials: "#74b9ff",
  Materials: "#fd79a8",
  Utilities: "#55efc4",
  "Real Estate": "#fdcb6e",
  Communication: "#6c5ce7",
};

export const MARKET_CAP_LABELS: Record<MarketCapTier, string> = {
  "": "All",
  mega: "Mega (>$200B)",
  large: "Large ($10B–$200B)",
  mid: "Mid ($2B–$10B)",
  small: "Small ($300M–$2B)",
  micro: "Micro (<$300M)",
};

export function rsiColor(rsi: number): string {
  if (rsi > 70) return "#ff4757";
  if (rsi < 30) return "#409eff";
  return "#9098b0";
}
