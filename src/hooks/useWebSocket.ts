"use client";
import { useEffect, useRef } from "react";
import { getWebSocketSimulator } from "@/lib/websocket";
import { useScreenerStore } from "@/store/screenerStore";
import type { WSMetrics } from "@/types";

export function useWebSocket(stockCount: number) {
  const wsRef = useRef<ReturnType<typeof getWebSocketSimulator> | null>(null);
  const applyPriceUpdates = useScreenerStore((s) => s.applyPriceUpdates);
  const setMetrics = useScreenerStore((s) => s.setMetrics);

  useEffect(() => {
    const ws = getWebSocketSimulator(stockCount);
    wsRef.current = ws;

    const unsubUpdates = ws.onUpdate((updates) => {
      applyPriceUpdates(updates);
    });

    const unsubMetrics = ws.onMetrics((metrics: WSMetrics) => {
      setMetrics({ wsUpdatesPerSec: metrics.updatesPerSecond });
    });

    ws.connect();

    return () => {
      unsubUpdates();
      unsubMetrics();
      ws.disconnect();
    };
  }, [stockCount, applyPriceUpdates, setMetrics]);

  return wsRef;
}
