import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Stock,
  FilterState,
  SortState,
  BenchmarkMetrics,
  Sector,
  Signal,
  Indicator,
  MarketCapTier,
} from "@/types";
import { filterAndSort } from "@/lib/filterEngine";
import { generateStockUniverse } from "@/lib/dataGenerator";

// ─── Default state ────────────────────────────────────────────────────────────
const DEFAULT_FILTERS: FilterState = {
  search: "",
  price: { min: "", max: "" },
  changePercent: { min: "", max: "" },
  volume: { min: "" },
  marketCapTier: "",
  pe: { min: "", max: "" },
  rsi: { min: "", max: "" },
  sectors: new Set<Sector>(),
  signals: new Set<Signal>(),
};

const DEFAULT_SORT: SortState = {
  column: "symbol",
  direction: "asc",
};

// ─── Store shape ──────────────────────────────────────────────────────────────
interface ScreenerStore {
  // Data
  allStocks: Stock[];
  filteredStocks: Stock[];
  selectedStockId: number | null;

  // Filter state
  filters: FilterState;
  sort: SortState;

  // Chart
  activeIndicators: Set<Indicator>;

  // Benchmark
  metrics: BenchmarkMetrics;

  // Actions
  initStocks: () => void;
  applyFiltersAndSort: () => void;
  setSearch: (q: string) => void;
  setPriceFilter: (min: string, max: string) => void;
  setChangeFilter: (min: string, max: string) => void;
  setVolumeFilter: (min: string) => void;
  setMarketCapTier: (tier: MarketCapTier) => void;
  setPEFilter: (min: string, max: string) => void;
  setRSIFilter: (min: string, max: string) => void;
  toggleSector: (sector: Sector) => void;
  toggleSignal: (signal: Signal) => void;
  setSort: (column: keyof Stock) => void;
  clearFilters: () => void;
  selectStock: (id: number | null) => void;
  toggleIndicator: (ind: Indicator) => void;
  applyPriceUpdates: (
    updates: Array<{ id: number; price: number; changePercent: number; volume: number; rsi: number }>
  ) => void;
  setMetrics: (partial: Partial<BenchmarkMetrics>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useScreenerStore = create<ScreenerStore>()(
  immer((set, get) => ({
    allStocks: [],
    filteredStocks: [],
    selectedStockId: null,
    filters: DEFAULT_FILTERS,
    sort: DEFAULT_SORT,
    activeIndicators: new Set<Indicator>(["MA20", "MA50", "EMA9", "BB", "VWAP"]),
    metrics: {
      filterTimeMs: 0,
      renderTimeMs: 0,
      visibleRows: 0,
      totalRows: 0,
      filteredRows: 0,
      wsUpdatesPerSec: 0,
    },

    initStocks: () => {
      const allStocks = generateStockUniverse(5000);
      const { results, timeMs } = filterAndSort(allStocks, DEFAULT_FILTERS, DEFAULT_SORT);
      set((state) => {
        state.allStocks = allStocks;
        state.filteredStocks = results;
        state.metrics.totalRows = allStocks.length;
        state.metrics.filteredRows = results.length;
        state.metrics.filterTimeMs = timeMs;
      });
    },

    applyFiltersAndSort: () => {
      const { allStocks, filters, sort } = get();
      const { results, timeMs } = filterAndSort(allStocks, filters, sort);
      set((state) => {
        state.filteredStocks = results;
        state.metrics.filteredRows = results.length;
        state.metrics.filterTimeMs = timeMs;
      });
    },

    setSearch: (q) => {
      set((state) => { state.filters.search = q; });
      get().applyFiltersAndSort();
    },

    setPriceFilter: (min, max) => {
      set((state) => { state.filters.price = { min, max }; });
      get().applyFiltersAndSort();
    },

    setChangeFilter: (min, max) => {
      set((state) => { state.filters.changePercent = { min, max }; });
      get().applyFiltersAndSort();
    },

    setVolumeFilter: (min) => {
      set((state) => { state.filters.volume = { min }; });
      get().applyFiltersAndSort();
    },

    setMarketCapTier: (tier) => {
      set((state) => { state.filters.marketCapTier = tier; });
      get().applyFiltersAndSort();
    },

    setPEFilter: (min, max) => {
      set((state) => { state.filters.pe = { min, max }; });
      get().applyFiltersAndSort();
    },

    setRSIFilter: (min, max) => {
      set((state) => { state.filters.rsi = { min, max }; });
      get().applyFiltersAndSort();
    },

    toggleSector: (sector) => {
      set((state) => {
        if (state.filters.sectors.has(sector)) {
          state.filters.sectors.delete(sector);
        } else {
          state.filters.sectors.add(sector);
        }
      });
      get().applyFiltersAndSort();
    },

    toggleSignal: (signal) => {
      set((state) => {
        if (state.filters.signals.has(signal)) {
          state.filters.signals.delete(signal);
        } else {
          state.filters.signals.add(signal);
        }
      });
      get().applyFiltersAndSort();
    },

    setSort: (column) => {
      const { sort } = get();
      set((state) => {
        if (state.sort.column === column) {
          state.sort.direction = sort.direction === "asc" ? "desc" : "asc";
        } else {
          state.sort.column = column;
          state.sort.direction = "desc";
        }
      });
      get().applyFiltersAndSort();
    },

    clearFilters: () => {
      set((state) => {
        state.filters = {
          ...DEFAULT_FILTERS,
          sectors: new Set<Sector>(),
          signals: new Set<Signal>(),
        };
        state.sort = DEFAULT_SORT;
      });
      get().applyFiltersAndSort();
    },

    selectStock: (id) => {
      set((state) => { state.selectedStockId = id; });
    },

    toggleIndicator: (ind) => {
      set((state) => {
        if (state.activeIndicators.has(ind)) {
          state.activeIndicators.delete(ind);
        } else {
          state.activeIndicators.add(ind);
        }
      });
    },

    // High-frequency update path — mutates in place for performance
    applyPriceUpdates: (updates) => {
      set((state) => {
        for (const upd of updates) {
          const stock = state.allStocks[upd.id];
          if (!stock) continue;
          const newPrice = Math.max(0.01, stock.price * (1 + upd.price));
          stock.prevClose = stock.price;
          stock.price = parseFloat(newPrice.toFixed(2));
          stock.changePercent = parseFloat(
            Math.max(-99, Math.min(999, stock.changePercent + upd.changePercent)).toFixed(2)
          );
          stock.volume = Math.floor(stock.volume * upd.volume);
          stock.rsi = parseFloat(
            Math.max(0, Math.min(100, stock.rsi + upd.rsi)).toFixed(1)
          );
          // Slide sparkline
          stock.spark.push(newPrice);
          stock.spark.shift();
        }
        state.metrics.wsUpdatesPerSec = updates.length * 12; // ~12 ticks/sec
      });
    },

    setMetrics: (partial) => {
      set((state) => {
        Object.assign(state.metrics, partial);
      });
    },
  }))
);
