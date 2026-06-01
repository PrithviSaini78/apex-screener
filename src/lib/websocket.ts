import type { PriceUpdate, WSMetrics } from "@/types";

type UpdateHandler = (updates: PriceUpdate[]) => void;
type MetricsHandler = (metrics: WSMetrics) => void;

// ─── Seeded PRNG for reproducible but varied updates ─────────────────────────
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ─── WebSocket Simulator ──────────────────────────────────────────────────────
export class WebSocketSimulator {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private metricsIntervalId: ReturnType<typeof setInterval> | null = null;
  private updateHandlers: Set<UpdateHandler> = new Set();
  private metricsHandlers: Set<MetricsHandler> = new Set();
  private rng = lcg(Date.now() & 0xffffffff);
  private totalUpdates = 0;
  private updatesThisSec = 0;
  private lastMetricsTime = Date.now();
  private stockCount = 0;
  private readonly TICK_INTERVAL = 80; // ms
  private readonly UPDATES_PER_TICK_MIN = 15;
  private readonly UPDATES_PER_TICK_MAX = 45;

  constructor(stockCount: number) {
    this.stockCount = stockCount;
  }

  connect(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.TICK_INTERVAL);

    this.metricsIntervalId = setInterval(() => {
      this.emitMetrics();
    }, 1000);

    console.log("[WS] Connected — streaming price updates");
  }

  disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.metricsIntervalId) {
      clearInterval(this.metricsIntervalId);
      this.metricsIntervalId = null;
    }
    console.log("[WS] Disconnected");
  }

  onUpdate(handler: UpdateHandler): () => void {
    this.updateHandlers.add(handler);
    return () => this.updateHandlers.delete(handler);
  }

  onMetrics(handler: MetricsHandler): () => void {
    this.metricsHandlers.add(handler);
    return () => this.metricsHandlers.delete(handler);
  }

  private tick(): void {
    const count =
      this.UPDATES_PER_TICK_MIN +
      Math.floor(
        this.rng() * (this.UPDATES_PER_TICK_MAX - this.UPDATES_PER_TICK_MIN)
      );

    const updates: PriceUpdate[] = [];
    const seen = new Set<number>();

    for (let i = 0; i < count; i++) {
      const id = Math.floor(this.rng() * this.stockCount);
      if (seen.has(id)) continue;
      seen.add(id);

      const priceChange = (this.rng() - 0.499) * 0.006;
      const changePercentDelta = (this.rng() - 0.5) * 0.15;
      const volSpike = this.rng() > 0.95 ? 1 + this.rng() * 3 : 1;
      const rsiDelta = (this.rng() - 0.5) * 0.8;

      updates.push({
        id,
        price: priceChange, // delta — store applies it
        changePercent: changePercentDelta,
        volume: volSpike,
        rsi: rsiDelta,
      });
    }

    this.totalUpdates += updates.length;
    this.updatesThisSec += updates.length;

    for (const handler of this.updateHandlers) {
      handler(updates);
    }
  }

  private emitMetrics(): void {
    const now = Date.now();
    const elapsed = (now - this.lastMetricsTime) / 1000;
    const updatesPerSecond = Math.round(this.updatesThisSec / elapsed);

    this.lastMetricsTime = now;
    this.updatesThisSec = 0;

    const metrics: WSMetrics = {
      updatesPerSecond,
      totalUpdates: this.totalUpdates,
      latency: Math.floor(this.rng() * 8 + 1),
    };

    for (const handler of this.metricsHandlers) {
      handler(metrics);
    }
  }
}

// ─── Singleton instance ───────────────────────────────────────────────────────
let wsInstance: WebSocketSimulator | null = null;

export function getWebSocketSimulator(stockCount: number): WebSocketSimulator {
  if (!wsInstance) {
    wsInstance = new WebSocketSimulator(stockCount);
  }
  return wsInstance;
}
