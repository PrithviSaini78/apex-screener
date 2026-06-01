import type { Stock, Sector, Signal } from "@/types";

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SECTORS: Sector[] = [
  "Technology",
  "Healthcare",
  "Finance",
  "Energy",
  "Consumer",
  "Industrials",
  "Materials",
  "Utilities",
  "Real Estate",
  "Communication",
];

const SIGNALS: Signal[] = [
  "bullish",
  "bearish",
  "neutral",
  "overbought",
  "oversold",
];

const ADJECTIVES = [
  "Advanced",
  "Alpha",
  "American",
  "Apex",
  "Bright",
  "Core",
  "Delta",
  "Eagle",
  "Frontier",
  "Global",
  "Harbor",
  "Innovative",
  "Kinetic",
  "Luminary",
  "Matrix",
  "Nova",
  "Omega",
  "Prime",
  "Quantum",
  "Rapid",
  "Solar",
  "Terra",
  "Ultra",
  "Vector",
  "Western",
  "Zenith",
  "Axiom",
  "Beacon",
  "Cascade",
  "Delphi",
];

const NOUNS = [
  "Systems",
  "Corp",
  "Inc",
  "Group",
  "Technologies",
  "Bio",
  "Capital",
  "Energy",
  "Holdings",
  "Networks",
  "Solutions",
  "Labs",
  "Medical",
  "Financial",
  "Industries",
  "Digital",
  "Global",
  "Health",
  "Dynamics",
  "Analytics",
  "Ventures",
  "Resources",
  "Partners",
  "Therapeutics",
  "Innovations",
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function genSymbol(rng: () => number, usedSymbols: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const len = rng() > 0.6 ? 4 : rng() > 0.4 ? 3 : rng() > 0.2 ? 5 : 2;
    let sym = "";
    for (let i = 0; i < len; i++) {
      sym += LETTERS[Math.floor(rng() * 26)];
    }
    if (!usedSymbols.has(sym)) {
      usedSymbols.add(sym);
      return sym;
    }
  }
  return `S${Math.floor(rng() * 9999).toString().padStart(4, "0")}`;
}

function genMarketCap(rng: () => number): number {
  const tier = rng();
  if (tier > 0.97) return rng() * 1_800_000_000_000 + 200_000_000_000; // mega
  if (tier > 0.85) return rng() * 190_000_000_000 + 10_000_000_000;   // large
  if (tier > 0.65) return rng() * 8_000_000_000 + 2_000_000_000;      // mid
  if (tier > 0.35) return rng() * 1_700_000_000 + 300_000_000;        // small
  return rng() * 299_000_000 + 1_000_000;                              // micro
}

function genSparkline(startPrice: number, rng: () => number, n = 15): number[] {
  const points: number[] = [startPrice];
  for (let i = 1; i < n; i++) {
    const prev = points[i - 1];
    points.push(Math.max(0.01, prev * (1 + (rng() - 0.5) * 0.04)));
  }
  return points;
}

export function generateStockUniverse(count = 5000): Stock[] {
  const rng = mulberry32(0xdeadbeef);
  const usedSymbols = new Set<string>();
  const stocks: Stock[] = [];

  for (let i = 0; i < count; i++) {
    const price = parseFloat((rng() * 990 + 5).toFixed(2));
    const changePercent = parseFloat(((rng() - 0.5) * 22).toFixed(2));
    const prevClose = parseFloat((price / (1 + changePercent / 100)).toFixed(2));
    const volume = Math.floor(rng() * 50_000_000 + 100_000);
    const avgVolume = Math.floor(volume * (0.7 + rng() * 0.6));
    const marketCap = genMarketCap(rng);
    const pe = rng() > 0.12 ? parseFloat((rng() * 80 + 4).toFixed(1)) : null;
    const rsi = parseFloat((rng() * 80 + 10).toFixed(1));
    const eps = parseFloat(((rng() - 0.25) * 25).toFixed(2));
    const beta = parseFloat((rng() * 2.8 + 0.05).toFixed(2));
    const sector = SECTORS[Math.floor(rng() * SECTORS.length)];
    const signal = SIGNALS[Math.floor(rng() * SIGNALS.length)];
    const divYield = rng() > 0.45 ? parseFloat((rng() * 6).toFixed(2)) : 0;
    const weekHigh52 = price * (1 + rng() * 0.6 + 0.05);
    const weekLow52 = price * (1 - rng() * 0.5 - 0.01);
    const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(rng() * NOUNS.length)];

    stocks.push({
      id: i,
      symbol: genSymbol(rng, usedSymbols),
      name: `${adj} ${noun}`,
      price,
      prevClose,
      changePercent,
      volume,
      avgVolume,
      marketCap,
      pe,
      eps,
      beta,
      rsi,
      divYield,
      weekHigh52,
      weekLow52,
      sector,
      signal,
      spark: genSparkline(price * 0.85, rng),
    });
  }

  return stocks;
}

// ─── Market Cap Tier Helper ───────────────────────────────────────────────────
export function getMarketCapTier(cap: number): string {
  if (cap >= 200_000_000_000) return "mega";
  if (cap >= 10_000_000_000) return "large";
  if (cap >= 2_000_000_000) return "mid";
  if (cap >= 300_000_000) return "small";
  return "micro";
}

export { SECTORS, SIGNALS };
