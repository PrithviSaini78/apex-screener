"use client";
import { memo, useRef, useCallback, useEffect } from "react";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";
import { useScreenerStore } from "@/store/screenerStore";
import { Sparkline } from "@/components/ui/Sparkline";
import { fmtPrice, fmtChange, fmtCompact, fmtPE } from "@/lib/filterEngine";
import { SIGNAL_COLORS, SECTOR_COLORS, rsiColor } from "@/lib/utils";
import type { Stock, SortState } from "@/types";

const ROW_HEIGHT = 36;
const OVERSCAN = 10;

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: "symbol" as keyof Stock,        label: "Symbol",    width: 72,  align: "left"  },
  { key: "name" as keyof Stock,          label: "Name",      width: 160, align: "left"  },
  { key: "price" as keyof Stock,         label: "Price",     width: 80,  align: "right" },
  { key: "changePercent" as keyof Stock, label: "Chg %",     width: 76,  align: "right" },
  { key: "volume" as keyof Stock,        label: "Volume",    width: 80,  align: "right" },
  { key: "marketCap" as keyof Stock,     label: "Mkt Cap",   width: 80,  align: "right" },
  { key: "pe" as keyof Stock,            label: "P/E",       width: 52,  align: "right" },
  { key: "rsi" as keyof Stock,           label: "RSI",       width: 48,  align: "right" },
  { key: "eps" as keyof Stock,           label: "EPS",       width: 56,  align: "right" },
  { key: "beta" as keyof Stock,          label: "Beta",      width: 48,  align: "right" },
  { key: "sector" as keyof Stock,        label: "Sector",    width: 100, align: "left"  },
  { key: "signal" as keyof Stock,        label: "Signal",    width: 76,  align: "left"  },
  { key: "spark" as keyof Stock,         label: "7D",        width: 80,  align: "center" },
] as const;

// ─── Memoised row component ───────────────────────────────────────────────────
const StockRow = memo(function StockRow({
  stock,
  selected,
  onClick,
  top,
}: {
  stock: Stock;
  selected: boolean;
  onClick: () => void;
  top: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const prevPrice = useRef(stock.price);

  useEffect(() => {
    if (stock.price !== prevPrice.current && rowRef.current) {
      const dir = stock.price > prevPrice.current ? "flash-up" : "flash-down";
      rowRef.current.classList.remove("flash-up", "flash-down");
      void rowRef.current.offsetWidth;
      rowRef.current.classList.add(dir);
    }
    prevPrice.current = stock.price;
  }, [stock.price]);

  const pos = stock.changePercent >= 0;

  return (
    <div
      ref={rowRef}
      onClick={onClick}
      role="row"
      aria-selected={selected}
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        height: ROW_HEIGHT,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        borderLeft: selected ? "2px solid #00d4aa" : "2px solid transparent",
        background: selected ? "rgba(0,212,170,0.05)" : "transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Symbol */}
      <Cell width={72}>
        <span style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 500, fontSize: 12, color: "#fff" }}>
          {stock.symbol}
        </span>
      </Cell>

      {/* Name */}
      <Cell width={160}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 148, display: "block" }}>
          {stock.name}
        </span>
      </Cell>

      {/* Price */}
      <Cell width={80} align="right">
        <span style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 500, color: "#fff", fontSize: 12 }}>
          {fmtPrice(stock.price)}
        </span>
      </Cell>

      {/* Change % */}
      <Cell width={76} align="right">
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 12, fontWeight: 500, color: pos ? "#00c97a" : "#ff4757" }}>
          {fmtChange(stock.changePercent)}
        </span>
      </Cell>

      {/* Volume */}
      <Cell width={80} align="right">
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          {fmtCompact(stock.volume)}
        </span>
      </Cell>

      {/* Market Cap */}
      <Cell width={80} align="right">
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          {fmtCompact(stock.marketCap)}
        </span>
      </Cell>

      {/* P/E */}
      <Cell width={52} align="right">
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
          {fmtPE(stock.pe)}
        </span>
      </Cell>

      {/* RSI */}
      <Cell width={48} align="right">
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 12, color: rsiColor(stock.rsi) }}>
          {stock.rsi.toFixed(1)}
        </span>
      </Cell>

      {/* EPS */}
      <Cell width={56} align="right">
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 12, color: stock.eps >= 0 ? "#00c97a" : "#ff4757" }}>
          {stock.eps >= 0 ? "+" : ""}{stock.eps.toFixed(2)}
        </span>
      </Cell>

      {/* Beta */}
      <Cell width={48} align="right">
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {stock.beta.toFixed(2)}
        </span>
      </Cell>

      {/* Sector */}
      <Cell width={100}>
        <span style={{ fontSize: 11, color: SECTOR_COLORS[stock.sector] ?? "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 92, display: "block" }}>
          {stock.sector}
        </span>
      </Cell>

      {/* Signal */}
      <Cell width={76}>
        <span style={{ fontSize: 11, color: SIGNAL_COLORS[stock.signal], textTransform: "capitalize" }}>
          {stock.signal}
        </span>
      </Cell>

      {/* Sparkline */}
      <Cell width={80} align="center">
        <Sparkline data={stock.spark} positive={pos} width={68} height={24} />
      </Cell>
    </div>
  );
},
// Custom equality — only re-render on actual data changes
(prev, next) =>
  prev.stock.price === next.stock.price &&
  prev.stock.changePercent === next.stock.changePercent &&
  prev.stock.volume === next.stock.volume &&
  prev.stock.rsi === next.stock.rsi &&
  prev.selected === next.selected &&
  prev.top === next.top
);

// ─── Cell primitive ───────────────────────────────────────────────────────────
function Cell({
  children,
  width,
  align = "left",
}: {
  children: React.ReactNode;
  width: number;
  align?: "left" | "right" | "center";
}) {
  return (
    <div
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        padding: "0 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
        height: "100%",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ─── Sort indicator ───────────────────────────────────────────────────────────
function SortIcon({ col, sort }: { col: keyof Stock; sort: SortState }) {
  if (sort.column !== col) return <span style={{ opacity: 0.2, marginLeft: 3 }}>↕</span>;
  return (
    <span style={{ color: "#409eff", marginLeft: 3 }}>
      {sort.direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ─── Header row ───────────────────────────────────────────────────────────────
function TableHeader({ onSort, sort }: { onSort: (col: keyof Stock) => void; sort: SortState }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "var(--header-height)",
        background: "#181c24",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        userSelect: "none",
      }}
    >
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          onClick={() => col.key !== "spark" && onSort(col.key)}
          style={{
            width: col.width,
            minWidth: col.width,
            maxWidth: col.width,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start",
            padding: "0 8px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: sort.column === col.key ? "#409eff" : "rgba(255,255,255,0.35)",
            cursor: col.key !== "spark" ? "pointer" : "default",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            transition: "color 0.12s",
          }}
          onMouseEnter={(e) => { if (col.key !== "spark") (e.currentTarget as HTMLDivElement).style.color = "#e8eaf0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.color = sort.column === col.key ? "#409eff" : "rgba(255,255,255,0.35)"; }}
        >
          {col.label}
          {col.key !== "spark" && <SortIcon col={col.key} sort={sort} />}
        </div>
      ))}
    </div>
  );
}

// ─── Main DataGrid ────────────────────────────────────────────────────────────
export function DataGrid() {
  const filteredStocks = useScreenerStore((s) => s.filteredStocks);
  const selectedStockId = useScreenerStore((s) => s.selectedStockId);
  const sort = useScreenerStore((s) => s.sort);
  const setSort = useScreenerStore((s) => s.setSort);
  const selectStock = useScreenerStore((s) => s.selectStock);
  const setMetrics = useScreenerStore((s) => s.setMetrics);

  const { scrollRef, virtualItems, totalHeight } = useVirtualScroll({
    itemCount: filteredStocks.length,
    itemHeight: ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Report visible row count
  useEffect(() => {
    setMetrics({ visibleRows: virtualItems.length });
  }, [virtualItems.length, setMetrics]);

  const handleSort = useCallback((col: keyof Stock) => setSort(col), [setSort]);

  const handleRowClick = useCallback(
    (id: number) => {
      selectStock(selectedStockId === id ? null : id);
    },
    [selectedStockId, selectStock]
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center px-3 py-1.5 shrink-0 border-b"
        style={{ background: "#0a0b0e", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-dm-mono)" }}>
          <span style={{ color: "#e8eaf0", fontWeight: 500 }}>{filteredStocks.length.toLocaleString()}</span>
          {" "}stocks · scroll to explore · click to chart
        </span>
        <span
          className="ml-auto text-xs font-mono"
          style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}
        >
          Virtual scroll · {virtualItems.length} DOM rows
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <TableHeader onSort={handleSort} sort={sort} />

        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: "auto", overflowX: "auto", position: "relative" }}
          role="grid"
          aria-label="Stock screener results"
        >
          {/* Min-width wrapper for horizontal scroll */}
          <div style={{ minWidth: COLUMNS.reduce((s, c) => s + c.width, 0) + 2 }}>
            {/* Virtual spacer */}
            <div style={{ position: "relative", height: totalHeight }}>
              {virtualItems.map((item) => {
                const stock = filteredStocks[item.index];
                if (!stock) return null;
                return (
                  <StockRow
                    key={stock.id}
                    stock={stock}
                    selected={stock.id === selectedStockId}
                    onClick={() => handleRowClick(stock.id)}
                    top={item.start}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing import

