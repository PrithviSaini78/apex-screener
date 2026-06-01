"use client";
import { useScreenerStore } from "@/store/screenerStore";

export function TopBar() {
  const metrics = useScreenerStore((s) => s.metrics);

  return (
    <header
      className="flex items-center gap-3 px-4 shrink-0 border-b"
      style={{
        height: "var(--header-height)",
        background: "#111318",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Logo */}
      <div
        className="font-display font-black text-xl tracking-tight select-none"
        style={{ color: "#fff", letterSpacing: "-0.5px" }}
      >
        APE<span style={{ color: "#00d4aa" }}>X</span>
      </div>

      <div className="h-4 w-px" style={{ background: "rgba(255,255,255,0.12)" }} />

      {/* WS Status */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
        style={{
          background: "rgba(0,201,122,0.1)",
          border: "1px solid rgba(0,201,122,0.2)",
          color: "#00c97a",
        }}
      >
        <span
          className="ws-pulse inline-block rounded-full"
          style={{ width: 6, height: 6, background: "#00c97a" }}
        />
        LIVE
      </div>

      {/* Benchmark stats */}
      <BenchStat label="Universe" value={metrics.totalRows.toLocaleString()} />
      <BenchStat label="Filtered" value={metrics.filteredRows.toLocaleString()} />
      <BenchStat
        label="Filter"
        value={`${metrics.filterTimeMs.toFixed(1)}ms`}
        highlight={metrics.filterTimeMs < 200}
      />
      <BenchStat
        label="WS updates/s"
        value={metrics.wsUpdatesPerSec.toLocaleString()}
      />
      <BenchStat label="Visible rows" value={metrics.visibleRows.toLocaleString()} />

      <div className="ml-auto flex items-center gap-2">
        <span
          className="text-xs font-mono px-2 py-1 rounded"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          React 18 · Next.js 14 · Zustand · TanStack Virtual
        </span>
      </div>
    </header>
  );
}

function BenchStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.35)",
      }}
    >
      <span>{label}:</span>
      <span
        className="font-medium"
        style={{ color: highlight === false ? "#ff4757" : "#00d4aa" }}
      >
        {value}
      </span>
    </div>
  );
}
