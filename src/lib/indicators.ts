import type { CandleData, IndicatorSeries } from "@/types";

// ─── Seeded PRNG for deterministic candle generation ─────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Candle generation for chart ─────────────────────────────────────────────
export function generateCandleData(stockId: number, currentPrice: number, n = 90): CandleData[] {
  const rng = mulberry32(stockId * 31337 + 42);
  const data: CandleData[] = [];
  let price = currentPrice * (0.65 + rng() * 0.35);
  const now = Date.now();

  for (let i = 0; i < n; i++) {
    const open = price;
    const direction = rng() > 0.48 ? 1 : -1;
    const magnitude = rng() * 0.03 * price;
    const close = Math.max(0.01, open + direction * magnitude);
    const range = Math.abs(close - open);
    const high = Math.max(open, close) + rng() * range * 0.8;
    const low = Math.min(open, close) - rng() * range * 0.8;
    const volume = Math.floor(rng() * 5_000_000 + 200_000);

    data.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(Math.max(0.01, low).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      timestamp: now - (n - i) * 86_400_000,
    });

    price = close;
  }

  // Nudge last close toward current price for continuity
  data[data.length - 1].close = currentPrice;
  return data;
}

// ─── Simple Moving Average ────────────────────────────────────────────────────
export function calcSMA(data: CandleData[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const sum = data.slice(i - period + 1, i + 1).reduce((a, d) => a + d.close, 0);
    return parseFloat((sum / period).toFixed(4));
  });
}

// ─── Exponential Moving Average ──────────────────────────────────────────────
export function calcEMA(data: CandleData[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  data.forEach((d, i) => {
    if (i === 0) {
      ema.push(d.close);
    } else {
      ema.push(parseFloat((d.close * k + ema[i - 1] * (1 - k)).toFixed(4)));
    }
  });
  return ema;
}

// ─── Bollinger Bands ──────────────────────────────────────────────────────────
export function calcBollingerBands(
  data: CandleData[],
  period = 20,
  stdDev = 2
): { upper: (number | null)[]; lower: (number | null)[] } {
  const ma = calcSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  data.forEach((_, i) => {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const slice = data.slice(i - period + 1, i + 1).map((d) => d.close);
    const mean = ma[i] as number;
    const variance = slice.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    upper.push(parseFloat((mean + stdDev * sd).toFixed(4)));
    lower.push(parseFloat((mean - stdDev * sd).toFixed(4)));
  });

  return { upper, lower };
}

// ─── VWAP (Volume-Weighted Average Price) ─────────────────────────────────────
export function calcVWAP(data: CandleData[]): number[] {
  let cumTP = 0;
  let cumVol = 0;
  return data.map((d) => {
    const tp = (d.high + d.low + d.close) / 3;
    cumTP += tp * d.volume;
    cumVol += d.volume;
    return parseFloat((cumTP / cumVol).toFixed(4));
  });
}

// ─── RSI ──────────────────────────────────────────────────────────────────────
export function calcRSI(data: CandleData[], period = 14): (number | null)[] {
  if (data.length < period + 1) return data.map(() => null);

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const delta = data[i].close - data[i - 1].close;
    gains.push(delta > 0 ? delta : 0);
    losses.push(delta < 0 ? -delta : 0);
  }

  const rsi: (number | null)[] = [null]; // first candle has no RSI
  let avgGain = gains.slice(0, period).reduce((a, v) => a + v, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, v) => a + v, 0) / period;

  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(null);
      continue;
    }
    if (i === period - 1) {
      const rs = avgGain / (avgLoss || 0.001);
      rsi.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
      continue;
    }
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgGain / (avgLoss || 0.001);
    rsi.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
  }

  return rsi;
}

// ─── Compute all indicators in one pass ──────────────────────────────────────
export function computeIndicators(data: CandleData[]): IndicatorSeries {
  const ma20 = calcSMA(data, 20);
  const ma50 = calcSMA(data, 50);
  const ema9 = calcEMA(data, 9);
  const bb = calcBollingerBands(data, 20, 2);
  const vwap = calcVWAP(data);

  return {
    ma20,
    ma50,
    ema9,
    bbUpper: bb.upper,
    bbLower: bb.lower,
    vwap,
  };
}
