/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Stock } from "../types";
import { Star, Trash2, ArrowUpRight, ArrowDownRight, Compass, Search, RefreshCw, Calendar, TrendingUp } from "lucide-react";
import { getFormattedDateIndo } from "../utils/date";

interface WatchlistViewProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatchlist: (ticker: string) => void;
  onSelectStock: (ticker: string) => void;
}

export default function WatchlistView({ 
  stocks, 
  watchlist, 
  onToggleWatchlist, 
  onSelectStock 
}: WatchlistViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const watchlistStocks = useMemo(() => {
    return stocks.filter(s => watchlist.includes(s.ticker) && 
      (s.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stocks, watchlist, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-gradient-to-r from-amber-950/10 via-amber-955/5 to-transparent relative overflow-hidden select-none">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <Star className="w-16 h-16 text-amber-400" />
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest font-mono border bg-amber-500/10 text-amber-300 border-amber-500/20 uppercase">
            Sistem Pemantauan Aktif
          </span>
          <span className="text-[10px] bg-slate-950 px-2.5 py-0.5 rounded border border-amber-950 font-mono text-amber-400 font-bold">
            🟢 LIVE TRACKING WATCHLIST
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white mt-2 font-display flex items-center gap-2">
          <Star className="w-5.5 h-5.5 text-amber-400 fill-amber-400" />
          Watchlist Pantauan Pribadi
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Koleksi saham pilihan terkurasi Anda. Perubahan harga, dividen yield, dan analisis teknikal otomatis termutakhir dihimpun instan.
        </p>
      </div>

      {/* Date and Time Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#010c14] border border-cyan-950/30 p-4 rounded-xl text-[10.5px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 font-bold">
          <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Waktu Update: <strong className="text-cyan-300">Rabu, 3 Juni 2026</strong> • Bursa closed jam 16:00 WIB</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 text-[10px]">SUMBER DATA: YAHOO FINANCE &amp; IDX.CO.ID</span>
        </div>
      </div>

      {/* Interactive Controls & Listings */}
      <div className="bg-[#01070d]/90 border border-slate-900 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari emiten di watchlist..."
              className="w-full md:w-64 pl-8 pr-3 py-1.5 text-[10.5px] bg-slate-950 text-slate-300 border border-slate-850 rounded-xl placeholder:text-slate-650 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
          </div>

          <div className="text-right font-mono text-[10.5px] text-slate-400 leading-none">
            Total Saham: <strong className="text-white text-xs">{watchlistStocks.length}</strong> dari {watchlist.length} pilihan
          </div>
        </div>

        {watchlistStocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-mono border-b border-cyan-950/20">
                  <th className="pb-3 font-black">Kode</th>
                  <th className="pb-3 font-black hidden sm:table-cell">Nama Perusahaan</th>
                  <th className="pb-3 text-right font-black">Harga Terkini</th>
                  <th className="pb-3 text-right font-black">Perubahan (%)</th>
                  <th className="pb-3 text-right font-black">Spread %</th>
                  <th className="pb-3 text-right font-black">Kapitalisasi (Cap)</th>
                  <th className="pb-3 text-center font-black">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {watchlistStocks.map((s) => {
                  const isUp = s.changePercent >= 0;
                  return (
                    <tr 
                      key={s.ticker} 
                      className="border-b border-cyan-950/10 hover:bg-[#031d2e]/10 group transition"
                    >
                      {/* Ticker */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectStock(s.ticker)}
                            className="font-mono font-black text-xs text-cyan-400 hover:text-cyan-300 transition-colors uppercase block select-all cursor-pointer text-left"
                          >
                            {s.ticker}
                          </button>
                          <span className="text-[8px] bg-slate-900 border border-slate-850 px-1 py-0.5 rounded text-slate-400 leading-none sm:hidden font-mono uppercase">{s.sector}</span>
                        </div>
                        {/* Elegant Mobile company name directly below code ticker */}
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px] mt-1 sm:hidden font-sans font-medium">{s.name}</span>
                      </td>
                      
                      {/* Name - Hidden on small screen widths */}
                      <td className="py-3.5 pr-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 truncate max-w-[200px] sm:max-w-xs">
                          <span className="text-white font-semibold block truncate">{s.name}</span>
                          <span className="text-[8.5px] bg-[#0c1a26]/80 text-[#38bdf8] border border-[#0c4a6e]/40 px-2 py-0.5 rounded leading-none shrink-0 font-mono font-bold uppercase">{s.sector}</span>
                        </div>
                      </td>

                      {/* Current Price */}
                      <td className="py-3.5 text-right font-mono font-black text-slate-100">
                        Rp {Math.round(s.currentPrice).toLocaleString("id-ID")}
                      </td>

                      {/* Change % */}
                      <td className="py-3.5 text-right font-mono font-black">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] ${
                          isUp 
                            ? "text-[#22c55e] bg-emerald-950/30 border border-emerald-900/20" 
                            : "text-[#ef4444] bg-rose-950/30 border border-rose-900/20"
                        }`}>
                          {isUp ? <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" /> : <ArrowDownRight className="w-3 h-3 text-rose-450 shrink-0" />}
                          {isUp ? "+" : ""}{s.changePercent.toFixed(2)}%
                        </span>
                      </td>

                      {/* Spread avg */}
                      <td className="py-3.5 text-right font-mono text-slate-350">
                        {((s.ask - s.bid) / s.currentPrice * 100).toFixed(2)}%
                      </td>

                      {/* Market Cap */}
                      <td className="py-3.5 text-right font-mono text-slate-400">
                        Rp {(s.marketCap / 1000).toFixed(1)} T
                      </td>

                      {/* Remove action */}
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onSelectStock(s.ticker)}
                            className="p-1 hover:bg-slate-900 text-slate-400 hover:text-cyan-400 rounded-lg border border-transparent hover:border-cyan-500/10 cursor-pointer"
                            title="Tampilkan Dashboard Emiten"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => onToggleWatchlist(s.ticker)}
                            className="p-1 hover:bg-rose-950/30 text-slate-500 hover:text-[#ef4444] rounded-lg border border-transparent hover:border-rose-900/20 cursor-pointer"
                            title="Hapus dari Watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-950/20 rounded-xl border border-dashed border-slate-900 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Watchlist pantauan Kosong</p>
              <p className="text-[10px] text-slate-600 mt-1">Cari emiten di Dashboard atau Stock Screener dan ketuk ikon bintang (⭐) untuk menambahkannya.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
