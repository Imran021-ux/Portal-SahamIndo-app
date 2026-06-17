import React, { useState } from "react";
import { Stock, PriceAlert } from "../types";
import { Bell, Plus, Trash2, X, AlertOctagon, CheckCircle, Smartphone, Volume2, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PriceAlertsManagerProps {
  stocks: Stock[];
  alerts: PriceAlert[];
  onAddAlert: (ticker: string, targetPrice: number, condition: "ABOVE" | "BELOW") => void;
  onDeleteAlert: (id: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export default function PriceAlertsManager({
  stocks,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onClearHistory,
  onClose
}: PriceAlertsManagerProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>(stocks[0]?.ticker || "BBCA");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Get current price of selected stock for placeholder help
  const activeStock = stocks.find(s => s.ticker === selectedTicker);
  const currentPriceDisplay = activeStock ? activeStock.currentPrice : 0;

  // Handle auto-filling with current price when stock selection changes
  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
    const stock = stocks.find(s => s.ticker === ticker);
    if (stock) {
      setTargetPrice(stock.currentPrice.toString());
    }
  };

  // Initialize form with first stock price if targetPrice is unset
  React.useEffect(() => {
    if (!targetPrice && currentPriceDisplay > 0) {
      setTargetPrice(currentPriceDisplay.toString());
    }
  }, [selectedTicker, currentPriceDisplay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setErrorMessage("Silakan masukkan nilai harga target yang valid (> 0).");
      return;
    }

    if (condition === "ABOVE" && price <= currentPriceDisplay) {
      setErrorMessage(`Harga target (≥ Rp ${price.toLocaleString()}) harus lebih besar dari harga saat ini (Rp ${currentPriceDisplay.toLocaleString()})`);
      return;
    }

    if (condition === "BELOW" && price >= currentPriceDisplay) {
      setErrorMessage(`Harga target (≤ Rp ${price.toLocaleString()}) harus lebih kecil dari harga saat ini (Rp ${currentPriceDisplay.toLocaleString()})`);
      return;
    }

    onAddAlert(selectedTicker, price, condition);
    setErrorMessage("");
    // Optional feedback or reset
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 25 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute top-16 right-4 w-[380px] md:w-[420px] bg-[#020b12] border border-cyan-500/20 rounded-2xl shadow-2xl shadow-black/95 text-slate-100 p-5 z-40 overflow-hidden flex flex-col max-h-[85vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-cyan-400 animate-wiggle" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide text-white font-sans uppercase">Price Alert Manager</h3>
            <p className="text-[10px] text-slate-400">Pantau pergerakan harga pasar secara presisi</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded bg-[#0d222f] hover:bg-[#143042] border border-cyan-900/30 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 space-y-5 pr-1 scrollbar-thin scrollbar-thumb-cyan-950/50">
        
        {/* Form Pembuatan Alarm */}
        <div className="bg-[#03131e] border border-cyan-950/50 p-4 rounded-xl">
          <h4 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <Plus className="w-3.5 h-3.5" /> Buat Alarm Harga Baru
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider mb-1">Pilih Emiten Saham:</label>
              <select 
                value={selectedTicker}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="w-full bg-[#02090e] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 font-mono transition-all"
              >
                {stocks.map((stock) => (
                  <option key={stock.ticker} value={stock.ticker}>
                    {stock.ticker} — {stock.name.slice(0, 22)}{stock.name.length > 22 ? "..." : ""} (Rp {stock.currentPrice.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider mb-1">Kondisi:</label>
                <select 
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as "ABOVE" | "BELOW")}
                  className="w-full bg-[#02090e] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 font-sans transition-all"
                >
                  <option value="ABOVE">Naik Melewati (≥)</option>
                  <option value="BELOW">Turun Melewati (≤)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider mb-1">Harga Target (Rp):</label>
                <input 
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full bg-[#02090e] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  placeholder={currentPriceDisplay.toString()}
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-[10px] text-rose-450 bg-rose-950/20 border border-rose-500/20 p-2 rounded font-sans leading-relaxed">
                ⚠️ {errorMessage}
              </p>
            )}

            <button 
              type="submit"
              className="w-full py-2 rounded-lg bg-cyan-650 hover:bg-cyan-550 border border-cyan-450/40 text-xs text-white font-bold transition-all hover:shadow-md hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Pasang Alarm Harga {selectedTicker}</span>
            </button>
          </form>
        </div>

        {/* List Alarm Aktif */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-sans flex items-center gap-1.5">
              🔔 Aktif ({activeAlerts.length})
            </h4>
          </div>

          {activeAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4 bg-[#01060a]/40 rounded-xl border border-dashed border-cyan-900/10">
              Tidak ada alarm aktif saat ini.
            </p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {activeAlerts.map((alert) => {
                const stock = stocks.find(s => s.ticker === alert.ticker);
                const currentPrice = stock ? stock.currentPrice : alert.targetPrice;
                return (
                  <div key={alert.id} className="flex items-center justify-between bg-[#020b11] border border-cyan-900/20 px-3 py-2.5 rounded-xl hover:border-cyan-500/25 transition-all group">
                    <div className="flex items-center space-x-2.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white font-mono">{alert.ticker}</span>
                        <span className="text-[9.5px] text-slate-500 uppercase font-bold tracking-tight">Kondisi Target</span>
                      </div>
                      <div className="h-6 w-[1px] bg-cyan-900/20"></div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-cyan-400 font-mono">
                          {alert.condition === "ABOVE" ? "≥" : "≤"} Rp {alert.targetPrice.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[9.5px] text-slate-400">
                          Live: <span className="font-mono text-white font-bold">Rp {currentPrice.toLocaleString("id-ID")}</span>
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1.5 rounded-md hover:bg-rose-950/20 text-slate-500 hover:text-rose-450 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Hapus Alarm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Riwayat Alarm Terpicu */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-sans flex items-center gap-1.5">
              🎯 Alaram Terpicu ({triggeredAlerts.length})
            </h4>
            {triggeredAlerts.length > 0 && (
              <button 
                onClick={onClearHistory}
                className="text-[9px] text-slate-450 hover:text-white underline cursor-pointer"
              >
                Clear Histori
              </button>
            )}
          </div>

          {triggeredAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4 bg-[#01060a]/40 rounded-xl border border-dashed border-cyan-900/10">
              Belum ada riwayat alarm terpicu.
            </p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {triggeredAlerts.map((alert) => (
                <div key={alert.id} className="bg-emerald-950/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-start gap-2.5 relative">
                  <div className="w-6 h-6 rounded-md bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400 font-mono">{alert.ticker}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{alert.triggeredAt || "Baru saja"}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal mt-0.5">
                      Telah menembus target harga <span className="font-bold text-white font-mono">Rp {alert.targetPrice.toLocaleString("id-ID")}</span> {alert.condition === "ABOVE" ? "ke atas (bullish)" : "ke bawah (bearish)"}.
                    </p>
                  </div>
                  <button 
                    onClick={() => onDeleteAlert(alert.id)}
                    className="p-1 rounded-md text-slate-500 hover:text-white transition-all cursor-pointer self-start shrink-0"
                    title="Hapus riwayat ini"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Footer info lock */}
      <div className="border-t border-cyan-900/20 pt-3 mt-4 text-[9.5px] text-slate-500 font-mono text-center flex items-center justify-center gap-1">
        <Smartphone className="w-3.5 h-3.5 text-cyan-500/50" />
        <span>Sistem Notifikasi Dashboard Realtime SahamIndo</span>
      </div>
    </motion.div>
  );
}
