import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APEX Screener — Real-Time Stock Screener",
  description:
    "Production-grade real-time stock screener with 5,000+ stocks, WebSocket price streaming, candlestick charts, and advanced filtering.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden bg-bg-primary text-text-primary">
        {children}
      </body>
    </html>
  );
}
