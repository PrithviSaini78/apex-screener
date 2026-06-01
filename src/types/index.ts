// ─── Domain Types ─────────────────────────────────────────────────────────────

export type Sector =
  | "Technology"
  | "Healthcare"
  | "Finance"
  | "Energy"
  | "Consumer"
  | "Industrials"
  | "Materials"
  | "Utilities"
  | "Real Estate"
  | "Communication";

export type Signal =
  | "bullish"
  | "bearish"
  | "neutral"
  | "overbought"
  | "oversold";

export type MarketCapTier =
  | "mega"
  | "large"
  | "mid"
  | "small"
  | "micro"
  | "";

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number | null;
  eps: number;
  beta: number;
  rsi: number;
  divYield: number;
  weekHigh52: number;
  weekLow52: number;
  sector: Sector;
  signal: Signal;
  spark: number[]; // 15-point price history
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface RangeFilter {
  min: string;
  max: string;
}

export interface FilterState {
  search: string;
  price: RangeFilter;
  changePercent: RangeFilter;
  volume: { min: string };
  marketCapTier: MarketCapTier;
  pe: RangeFilter;
  rsi: RangeFilter;
  sectors: Set<Sector>;
  signals: Set<Signal>;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: keyof Stock;
  direction: SortDirection;
}

// ─── Chart Types ──────────────────────────────────────────────────────────────

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export type Indicator = "MA20" | "MA50" | "EMA9" | "BB" | "VWAP";

export interface IndicatorSeries {
  ma20: (number | null)[];
  ma50: (number | null)[];
  ema9: number[];
  bbUpper: (number | null)[];
  bbLower: (number | null)[];
  vwap: number[];
}

// ─── WebSocket Types ──────────────────────────────────────────────────────────

export interface PriceUpdate {
  id: number;
  price: number;
  changePercent: number;
  volume: number;
  rsi: number;
}

export interface WSMetrics {
  updatesPerSecond: number;
  totalUpdates: number;
  latency: number;
}

// ─── Benchmark Types ──────────────────────────────────────────────────────────

export interface BenchmarkMetrics {
  filterTimeMs: number;
  renderTimeMs: number;
  visibleRows: number;
  totalRows: number;
  filteredRows: number;
  wsUpdatesPerSec: number;
}
