"use client";
import { useRef, useCallback } from "react";

type FlashDirection = "up" | "down";

// Flash registry — maps stock id to DOM row element
const flashRegistry = new Map<number, HTMLTableRowElement>();

export function registerRow(id: number, el: HTMLTableRowElement | null) {
  if (el) {
    flashRegistry.set(id, el);
  } else {
    flashRegistry.delete(id);
  }
}

export function flashRow(id: number, direction: FlashDirection) {
  const el = flashRegistry.get(id);
  if (!el) return;

  el.classList.remove("flash-up", "flash-down");
  // Force reflow to restart animation
  void el.offsetWidth;
  el.classList.add(direction === "up" ? "flash-up" : "flash-down");
}

export function usePriceFlash() {
  const flash = useCallback((id: number, direction: FlashDirection) => {
    flashRow(id, direction);
  }, []);

  return { flash, registerRow };
}
