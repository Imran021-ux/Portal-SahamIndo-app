import React, { useState, useEffect } from "react";
import TradingViewWidget from "./TradingViewWidget";
// Hapus semua impor data statis yang lama

export default function DashboardView({ stocks, propIhsgPrice }) {
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Sistem Update Otomatis (Single Source of Truth)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/latest_prices.json?t=' + Date.now());
        const data = await response.json();
        setLivePrices(data);
      } catch (err) {
        console.error("Gagal update harga:", err);
      }
    };

    fetchData(); // Panggil sekali saat load
    const interval = setInterval(fetchData, 60000); // Auto-refresh setiap 60 detik
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Chart IHSG yang benar-benar Live */}
      <div className="h-[300px] w-full border border-slate-700 rounded-lg overflow-hidden">
        <TradingViewWidget symbol="IDX:COMPOSITE" />
      </div>

      {/* Contoh menampilkan harga emiten dari file JSON */}
      <div className="grid grid-cols-2 gap-4">
        {stocks.map((stock) => (
          <div key={stock.ticker} className="p-4 bg-slate-800 rounded-lg">
            <h3 className="text-white">{stock.ticker}</h3>
            <p className="text-emerald-400 font-bold">
              {livePrices[stock.ticker] 
                ? `Rp ${livePrices[stock.ticker].toLocaleString()}` 
                : "Memuat..."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
