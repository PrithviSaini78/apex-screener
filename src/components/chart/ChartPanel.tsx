"use client";
import { memo } from "react";
import { useScreenerStore } from "@/store/screenerStore";
import { CandleChart } from "@/components/chart/CandleChart";
import { fmtPrice, fmtChange, fmtCompact } from "@/lib/filterEngine";
import type { Indicator, Stock } from "@/types";
import { X } from "lucide-react";

const INDICATORS: Indicator[] = ["MA20", "MA50", "EMA9", "BB", "VWAP"];

export const ChartPanel = memo(function ChartPanel({
  stock,
}: {
  stock: Stock;
}) {
  const activeIndicators = useScreenerStore((s) => s.activeIndicators);
  const toggleIndicator = useScreenerStore((s) => s.toggleIndicator);
  const selectStock = useScreenerStore((s) => s.selectStock);

  const pos = stock.changePercent >= 0;

  return (
    <div
      className="flex flex-col shrink-0 border-l animate-slide-in-right overflow-hidden"
      style={{
        width: 360,
        background: "#111318",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-start justify-between"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div>
          <div
            className="font-display font-black text-2xl"
            style={{ color: "#fff", letterSpacing: "-0.5px" }}
          >
            {stock.symbol}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              marginTop: 2,
            }}
          >
            {stock.name}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: 20,
              fontWeight: 500,
              color: "#fff",
            }}
          >
            {fmtPrice(stock.price)}
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: 12,
              color: pos ? "#00c97a" : "#ff4757",
              marginTop: 1,
            }}
          >
            {fmtChange(stock.changePercent)}
          </div>
        </div>
        <button
          onClick={() => selectStock(null)}
          className="focus-ring"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#e8eaf0";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Indicator toggles */}
      <div
        className="flex gap-2 px-4 py-2 border-b flex-wrap"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        {INDICATORS.map((ind) => {
          const isActive = activeIndicators.has(ind);
          const colors: Record<Indicator, string> = {
            MA20: "#409eff",
            MA50: "#ffa502",
            EMA9: "#a29bfe",
            BB: "#ffa502",
            VWAP: "#fd79a8",
          };
          const color = colors[ind];

          return (
            <button
              key={ind}
              onClick={() => toggleIndicator(ind)}
              className="no-select focus-ring"
              style={{
                padding: "3px 10px",
                borderRadius: 3,
                border: `1px solid ${isActive ? color : "rgba(255,255,255,0.1)"}`,
                background: isActive ? `${color}18` : "transparent",
                color: isActive ? color : "rgba(255,255,255,0.35)",
                fontSize: 10,
                fontFamily: "var(--font-dm-mono)",
                cursor: "pointer",
                transition: "all 0.12s ease",
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {ind}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-hidden px-2 py-2">
        <CandleChart stock={stock} />
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-3 gap-px shrink-0"
        style={{
          background: "rgba(255,255,255,0.06)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <StatBox
          label="52W High"
          value={fmtPrice(stock.weekHigh52)}
        />
        <StatBox
          label="52W Low"
          value={fmtPrice(stock.weekLow52)}
        />
        <StatBox
          label="Avg Volume"
          value={fmtCompact(stock.avgVolume)}
        />
        <StatBox
          label="Beta"
          value={stock.beta.toFixed(2)}
        />
        <StatBox
          label="Div Yield"
          value={stock.divYield.toFixed(2) + "%"}
        />
        <StatBox
          label="EPS"
          value={(stock.eps >= 0 ? "+" : "") + stock.eps.toFixed(2)}
        />
      </div>
    </div>
  );
});

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="px-2 py-2"
      style={{ background: "#111318", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-dm-mono)",
          fontSize: 13,
          fontWeight: 500,
          color: "#e8eaf0",
        }}
      >
        {value}
      </div>
    </div>
  );
}
