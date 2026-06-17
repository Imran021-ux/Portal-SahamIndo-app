import React from "react";
import TradingViewWidget from "./TradingViewWidget";

export default function DashboardView() {
  return (
    <div className="p-4 space-y-6 bg-[#0a1420] min-h-screen">
      
      {/* 1. Header */}
      <div className="text-white">
        <h1 className="text-2xl font-bold">SahamIndo Dashboard</h1>
        <p className="text-slate-400">Data Real-Time Pasar Modal Indonesia</p>
      </div>

      {/* 2. Chart IHSG (Otomatis Live & Gratis) */}
      <div className="h-[400px] w-full border border-slate-700 rounded-lg overflow-hidden shadow-xl">
        {/* Widget ini otomatis mengambil data terbaru dari IDX tanpa script tambahan */}
        <TradingViewWidget symbol="IDX:COMPOSITE" />
      </div>

      {/* 3. Contoh Widget Saham Populer (BBCA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-[300px] border border-slate-700 rounded-lg overflow-hidden">
          <TradingViewWidget symbol="IDX:BBCA" />
        </div>
        <div className="h-[300px] border border-slate-700 rounded-lg overflow-hidden">
          <TradingViewWidget symbol="IDX:BBRI" />
        </div>
      </div>

      <div className="text-center text-slate-500 text-sm py-4">
        Data disediakan oleh TradingView - Selalu Real-time
      </div>
    </div>
  );
}
