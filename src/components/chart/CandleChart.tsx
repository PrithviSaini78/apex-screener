"use client";
import { useRef, useEffect, useState, memo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { useScreenerStore } from "@/store/screenerStore";
import {
  generateCandleData,
  computeIndicators,
  calcRSI,
} from "@/lib/indicators";
import type { Stock, CandleData } from "@/types";
import { fmtPrice, fmtChange } from "@/lib/filterEngine";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ─── Candle renderer helper ───────────────────────────────────────────────────
function getCandleColor(candle: CandleData): string {
  return candle.close >= candle.open
    ? "rgba(0,201,122,0.85)"
    : "rgba(255,71,87,0.85)";
}

// ─── Chart component ──────────────────────────────────────────────────────────
export const CandleChart = memo(function CandleChart({
  stock,
}: {
  stock: Stock;
}) {
  const chartRef = useRef(null);
  const activeIndicators = useScreenerStore((s) => s.activeIndicators);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [rsi, setRSI] = useState<(number | null)[]>([]);

  // Generate candles on stock change
  useEffect(() => {
    const data = generateCandleData(stock.id, stock.price, 90);
    setCandles(data);
    setRSI(calcRSI(data, 14));
  }, [stock.id, stock.price]);

  if (candles.length === 0) return null;

  const indicators = computeIndicators(candles);
  const labels = candles.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - candles.length + i);
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  });

  // Build datasets
  const datasets: any[] = [
    {
      label: "OHLC",
      data: candles.map((c) => ({
        x: c.open,
        y: 0,
        o: c.open,
        h: c.high,
        l: c.low,
        c: c.close,
      })),
      type: "bar",
      backgroundColor: candles.map(getCandleColor),
      borderColor: candles.map((c) =>
        c.close >= c.open ? "#00c97a" : "#ff4757"
      ),
      borderWidth: 1,
      barPercentage: 0.65,
      categoryPercentage: 0.85,
    },
    ...(activeIndicators.has("MA20")
      ? [
          {
            label: "MA20",
            data: indicators.ma20,
            type: "line",
            borderColor: "#409eff",
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.4,
            spanGaps: true,
            fill: false,
          },
        ]
      : []),
    ...(activeIndicators.has("MA50")
      ? [
          {
            label: "MA50",
            data: indicators.ma50,
            type: "line",
            borderColor: "#ffa502",
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.4,
            spanGaps: true,
            fill: false,
          },
        ]
      : []),
    ...(activeIndicators.has("EMA9")
      ? [
          {
            label: "EMA9",
            data: indicators.ema9,
            type: "line",
            borderColor: "#a29bfe",
            borderWidth: 1.8,
            pointRadius: 0,
            tension: 0.2,
            fill: false,
          },
        ]
      : []),
    ...(activeIndicators.has("BB")
      ? [
          {
            label: "BB Upper",
            data: indicators.bbUpper,
            type: "line",
            borderColor: "rgba(255,165,2,0.5)",
            borderWidth: 1,
            borderDash: [5, 3],
            pointRadius: 0,
            tension: 0.3,
            spanGaps: true,
            fill: false,
          },
          {
            label: "BB Lower",
            data: indicators.bbLower,
            type: "line",
            borderColor: "rgba(255,165,2,0.5)",
            borderWidth: 1,
            borderDash: [5, 3],
            pointRadius: 0,
            tension: 0.3,
            spanGaps: true,
            fill: false,
          },
        ]
      : []),
    ...(activeIndicators.has("VWAP")
      ? [
          {
            label: "VWAP",
            data: indicators.vwap,
            type: "line",
            borderColor: "#fd79a8",
            borderWidth: 1.5,
            borderDash: [6, 3],
            pointRadius: 0,
            tension: 0.1,
            fill: false,
          },
        ]
      : []),
  ];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Chart
        ref={chartRef}
        type="bar"
        data={{ labels, datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 300 },
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            filler: { propagate: false },
            tooltip: {
              enabled: true,
              backgroundColor: "rgba(10,11,14,0.95)",
              titleColor: "#e8eaf0",
              bodyColor: "#9098b0",
              borderColor: "rgba(255,255,255,0.15)",
              borderWidth: 1,
              titleFont: { family: "var(--font-dm-mono)", size: 11 },
              bodyFont: { family: "var(--font-dm-mono)", size: 11 },
              padding: 10,
              displayColors: false,
              callbacks: {
                afterLabel(context: any) {
                  if (context.datasetIndex === 0) {
                    const c = candles[context.dataIndex];
                    if (!c) return [];
                    return [
                      `Open: ${fmtPrice(c.open)}`,
                      `High: ${fmtPrice(c.high)}`,
                      `Low: ${fmtPrice(c.low)}`,
                      `Close: ${fmtPrice(c.close)}`,
                      `Vol: ${(c.volume / 1e6).toFixed(1)}M`,
                    ];
                  }
                  return [];
                },
              },
            },
          },
          scales: {
            x: {
              stacked: false,
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: {
                color: "#5a6278",
                font: { family: "var(--font-dm-mono)", size: 10 },
                maxTicksLimit: 8,
              },
            },
            y: {
              position: "right",
              stacked: false,
              grid: { color: "rgba(255,255,255,0.05)" },
              ticks: {
                color: "#5a6278",
                font: { family: "var(--font-dm-mono)", size: 10 },
                callback: (v: any) => "$" + v.toFixed(0),
              },
            },
          },
        }}
      />
    </div>
  );
});
