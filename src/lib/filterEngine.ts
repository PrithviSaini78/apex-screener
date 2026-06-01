import type { Stock, FilterState, SortState } from "@/types";

// ─── Fast numeric parser (avoids parseFloat overhead in hot path) ─────────────
function toNum(s: string): number {
  return s === "" ? NaN : +s;
}

// ─── Core filter predicate (compiled to tight branch chain) ───────────────────
export function buildFilterPredicate(filters: FilterState) {
  const priceMin = toNum(filters.price.min);
  const priceMax = toNum(filters.price.max);
  const chgMin = toNum(filters.changePercent.min);
  const chgMax = toNum(filters.changePercent.max);
  const volMin = toNum(filters.volume.min);
  const peMin = toNum(filters.pe.min);
  const peMax = toNum(filters.pe.max);
  const rsiMin = toNum(filters.rsi.min);
  const rsiMax = toNum(filters.rsi.max);
  const hasSectors = filters.sectors.size > 0;
  const hasSignals = filters.signals.size > 0;
  const capTier = filters.marketCapTier;
  const query = filters.search.toLowerCase();
  const hasQuery = query.length > 0;

  return (s: Stock): boolean => {
    // Search (short-circuit first — cheapest rejection for typed queries)
    if (hasQuery) {
      if (
        !s.symbol.toLowerCase().includes(query) &&
        !s.name.toLowerCase().includes(query)
      )
        return false;
    }

    // Numeric ranges (avoid NaN comparisons via isNaN pre-check)
    if (!isNaN(priceMin) && s.price < priceMin) return false;
    if (!isNaN(priceMax) && s.price > priceMax) return false;
    if (!isNaN(chgMin) && s.changePercent < chgMin) return false;
    if (!isNaN(chgMax) && s.changePercent > chgMax) return false;
    if (!isNaN(volMin) && s.volume < volMin) return false;
    if (!isNaN(rsiMin) && s.rsi < rsiMin) return false;
    if (!isNaN(rsiMax) && s.rsi > rsiMax) return false;

    // P/E (nullable field)
    if (!isNaN(peMin) || !isNaN(peMax)) {
      if (s.pe === null) return false;
      if (!isNaN(peMin) && s.pe < peMin) return false;
      if (!isNaN(peMax) && s.pe > peMax) return false;
    }

    // Market cap tier
    if (capTier !== "") {
      const m = s.marketCap;
      switch (capTier) {
        case "mega":  if (m < 200e9) return false; break;
        case "large": if (m < 10e9 || m >= 200e9) return false; break;
        case "mid":   if (m < 2e9 || m >= 10e9) return false; break;
        case "small": if (m < 300e6 || m >= 2e9) return false; break;
        case "micro": if (m >= 300e6) return false; break;
      }
    }

    // Set membership (O(1) via Set)
    if (hasSectors && !filters.sectors.has(s.sector)) return false;
    if (hasSignals && !filters.signals.has(s.signal)) return false;

    return true;
  };
}

// ─── Sort comparator factory ──────────────────────────────────────────────────
export function buildComparator(sort: SortState) {
  const { column, direction } = sort;
  const dir = direction === "asc" ? 1 : -1;

  return (a: Stock, b: Stock): number => {
    const av = a[column] as number | string | null;
    const bv = b[column] as number | string | null;

    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    if (typeof av === "string") {
      return dir * (av as string).localeCompare(bv as string);
    }
    return dir * ((av as number) - (bv as number));
  };
}

// ─── Main filter + sort pipeline ─────────────────────────────────────────────
export function filterAndSort(
  stocks: Stock[],
  filters: FilterState,
  sort: SortState
): { results: Stock[]; timeMs: number } {
  const t0 = performance.now();
  const predicate = buildFilterPredicate(filters);

  // Single-pass filter into pre-allocated array
  const results: Stock[] = [];
  for (let i = 0; i < stocks.length; i++) {
    if (predicate(stocks[i])) results.push(stocks[i]);
  }

  results.sort(buildComparator(sort));
  const timeMs = performance.now() - t0;

  return { results, timeMs };
}

// ─── Number formatters ────────────────────────────────────────────────────────
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
