"use client";
import { useEffect } from "react";
import { useScreenerStore } from "@/store/screenerStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { TopBar } from "@/components/screener/TopBar";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { DataGrid } from "@/components/screener/DataGrid";

export function ScreenerApp() {
  const allStocks = useScreenerStore((s) => s.allStocks);
  const selectedStockId = useScreenerStore((s) => s.selectedStockId);
  const initStocks = useScreenerStore((s) => s.initStocks);

  useEffect(() => {
    initStocks();
  }, [initStocks]);

  useWebSocket(allStocks.length || 5000);

  const selectedStock = allStocks.find((s) => s.id === selectedStockId);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-bg-primary text-text-primary">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <FilterSidebar />
        <DataGrid />
      </div>
    </div>
  );
}