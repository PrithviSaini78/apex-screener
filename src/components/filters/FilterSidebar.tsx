"use client";
import { useScreenerStore } from "@/store/screenerStore";
import { SECTORS, SIGNALS } from "@/lib/dataGenerator";
import { SIGNAL_COLORS, SECTOR_COLORS } from "@/lib/utils";
import type { Sector, Signal, MarketCapTier } from "@/types";

// ─── Compound component primitives ───────────────────────────────────────────
function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div
        className="text-xs font-semibold mb-2 tracking-widest uppercase"
        style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function RangeInputs({
  minVal,
  maxVal,
  onMinChange,
  onMaxChange,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  type = "number",
}: {
  minVal: string;
  maxVal: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  type?: string;
}) {
  const inputStyle = {
    background: "#181c24",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    padding: "5px 8px",
    color: "#e8eaf0",
    fontSize: 12,
    fontFamily: "var(--font-dm-mono)",
    outline: "none",
    width: "100%",
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type={type}
        placeholder={minPlaceholder}
        value={minVal}
        onChange={(e) => onMinChange(e.target.value)}
        style={inputStyle}
        className="focus-ring"
      />
      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>—</span>
      <input
        type={type}
        placeholder={maxPlaceholder}
        value={maxVal}
        onChange={(e) => onMaxChange(e.target.value)}
        style={inputStyle}
        className="focus-ring"
      />
    </div>
  );
}

function SingleInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "#181c24",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 4,
        padding: "5px 8px",
        color: "#e8eaf0",
        fontSize: 12,
        fontFamily: "var(--font-dm-mono)",
        outline: "none",
        width: "100%",
      }}
      className="focus-ring"
    />
  );
}

function PillGroup<T extends string>({
  items,
  active,
  onToggle,
  colorMap,
}: {
  items: readonly T[];
  active: Set<T>;
  onToggle: (item: T) => void;
  colorMap?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => {
        const isActive = active.has(item);
        const color = colorMap?.[item];
        return (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className="no-select focus-ring"
            style={{
              padding: "3px 8px",
              borderRadius: 3,
              border: `1px solid ${isActive ? (color || "#00d4aa") : "rgba(255,255,255,0.1)"}`,
              background: isActive
                ? `${color || "#00d4aa"}18`
                : "transparent",
              color: isActive ? (color || "#00d4aa") : "rgba(255,255,255,0.4)",
              fontSize: 11,
              cursor: "pointer",
              transition: "all 0.12s ease",
              whiteSpace: "nowrap",
            }}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export function FilterSidebar() {
  const filters = useScreenerStore((s) => s.filters);
  const setPriceFilter = useScreenerStore((s) => s.setPriceFilter);
  const setChangeFilter = useScreenerStore((s) => s.setChangeFilter);
  const setVolumeFilter = useScreenerStore((s) => s.setVolumeFilter);
  const setMarketCapTier = useScreenerStore((s) => s.setMarketCapTier);
  const setPEFilter = useScreenerStore((s) => s.setPEFilter);
  const setRSIFilter = useScreenerStore((s) => s.setRSIFilter);
  const toggleSector = useScreenerStore((s) => s.toggleSector);
  const toggleSignal = useScreenerStore((s) => s.toggleSignal);
  const clearFilters = useScreenerStore((s) => s.clearFilters);
  const setSearch = useScreenerStore((s) => s.setSearch);

  const selectStyle = {
    background: "#181c24",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    padding: "5px 8px",
    color: "#e8eaf0",
    fontSize: 12,
    outline: "none",
    width: "100%",
    cursor: "pointer",
  };

  return (
    <aside
      className="flex flex-col shrink-0 border-r overflow-hidden"
      style={{
        width: 256,
        background: "#111318",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Search */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <input
          type="text"
          placeholder="Search symbol or company…"
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus-ring"
          style={{
            width: "100%",
            background: "#181c24",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 5,
            padding: "7px 10px",
            color: "#e8eaf0",
            fontSize: 12,
            fontFamily: "var(--font-inter)",
            outline: "none",
          }}
        />
      </div>

      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <span
          className="font-display font-bold text-xs tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}
        >
          Filters
        </span>
        <button
          onClick={clearFilters}
          className="text-xs focus-ring"
          style={{
            color: "rgba(255,255,255,0.3)",
            padding: "2px 6px",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
            background: "transparent",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.color = "#00d4aa";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
          }}
        >
          Clear all
        </button>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <FilterGroup label="Price ($)">
          <RangeInputs
            minVal={filters.price.min}
            maxVal={filters.price.max}
            onMinChange={(v) => setPriceFilter(v, filters.price.max)}
            onMaxChange={(v) => setPriceFilter(filters.price.min, v)}
          />
        </FilterGroup>

        <FilterGroup label="Change %">
          <RangeInputs
            minVal={filters.changePercent.min}
            maxVal={filters.changePercent.max}
            onMinChange={(v) => setChangeFilter(v, filters.changePercent.max)}
            onMaxChange={(v) => setChangeFilter(filters.changePercent.min, v)}
            minPlaceholder="-10"
            maxPlaceholder="+10"
          />
        </FilterGroup>

        <FilterGroup label="Volume (Min)">
          <SingleInput
            value={filters.volume.min}
            onChange={setVolumeFilter}
            placeholder="e.g. 1000000"
          />
        </FilterGroup>

        <FilterGroup label="Market Cap">
          <select
            value={filters.marketCapTier}
            onChange={(e) => setMarketCapTier(e.target.value as MarketCapTier)}
            style={selectStyle}
          >
            <option value="">All Tiers</option>
            <option value="mega">Mega (&gt;$200B)</option>
            <option value="large">Large ($10B–$200B)</option>
            <option value="mid">Mid ($2B–$10B)</option>
            <option value="small">Small ($300M–$2B)</option>
            <option value="micro">Micro (&lt;$300M)</option>
          </select>
        </FilterGroup>

        <FilterGroup label="P/E Ratio">
          <RangeInputs
            minVal={filters.pe.min}
            maxVal={filters.pe.max}
            onMinChange={(v) => setPEFilter(v, filters.pe.max)}
            onMaxChange={(v) => setPEFilter(filters.pe.min, v)}
          />
        </FilterGroup>

        <FilterGroup label="RSI">
          <RangeInputs
            minVal={filters.rsi.min}
            maxVal={filters.rsi.max}
            onMinChange={(v) => setRSIFilter(v, filters.rsi.max)}
            onMaxChange={(v) => setRSIFilter(filters.rsi.min, v)}
            minPlaceholder="0"
            maxPlaceholder="100"
          />
        </FilterGroup>

        <FilterGroup label="Signal">
          <PillGroup<Signal>
            items={SIGNALS}
            active={filters.signals}
            onToggle={toggleSignal}
            colorMap={SIGNAL_COLORS}
          />
        </FilterGroup>

        <FilterGroup label="Sector">
          <PillGroup<Sector>
            items={SECTORS}
            active={filters.sectors}
            onToggle={toggleSector}
            colorMap={SECTOR_COLORS}
          />
        </FilterGroup>
      </div>
    </aside>
  );
}
