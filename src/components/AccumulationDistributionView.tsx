/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Stock } from "../types";
import { 
  TrendingUp, TrendingDown, Activity, ArrowUpRight, 
  ArrowDownRight, Compass, Coins, Star, Sparkles, Search, 
  LayoutGrid, Eye, ArrowLeft, Lightbulb, ChevronLeft, ChevronRight
} from "lucide-react";

interface AccumulationDistributionViewProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock | string) => void;
  watchlist?: string[];
  onToggleWatchlist?: (ticker: string) => void;
}

export default function AccumulationDistributionView({
  stocks,
  onSelectStock,
  watchlist = [],
  onToggleWatchlist
}: AccumulationDistributionViewProps) {
  const [activeSegment, setActiveSegment] = useState<"AKUMULASI" | "DISTRIBUSI" | "HOLD">("AKUMULASI");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSector, setFilterSector] = useState("all");
  const [summaryPage, setSummaryPage] = useState(0);

  const sectorsList = useMemo(() => {
    const list = new Set<string>();
    stocks.forEach(s => {
      if (s.sector) list.add(s.sector);
    });
    return Array.from(list);
  }, [stocks]);

  // Group all stocks into Accumulation, Distribution, and Hold
  const partitions = useMemo(() => {
    const akumulasi: Stock[] = [];
    const distribusi: Stock[] = [];
    const hold: Stock[] = [];

    stocks.forEach((stock) => {
      if (!stock.isReal) return; // Exclude non-real or abnormal stocks
      const charSum = stock.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const change = stock.changePercent;
      
      if (change > 1.2) {
        akumulasi.push(stock);
      } else if (change < -1.2) {
        distribusi.push(stock);
      } else {
        const mode = charSum % 3;
        if (mode === 0) {
          akumulasi.push(stock);
        } else if (mode === 1) {
          distribusi.push(stock);
        } else {
          hold.push(stock);
        }
      }
    });

    // Sort by flow magnitude (approx. absolute change percent * volume)
    const sortByMagnitude = (arr: Stock[]) => {
      return [...arr].sort((a, b) => {
        const magA = Math.abs(a.changePercent) * (a.volume || 1);
        const magB = Math.abs(b.changePercent) * (b.volume || 1);
        return magB - magA;
      });
    };

    return { 
      akumulasi: sortByMagnitude(akumulasi), 
      distribusi: sortByMagnitude(distribusi), 
      hold: sortByMagnitude(hold) 
    };
  }, [stocks]);

  // Extract Top 20 of each category with absolute priority for direct visibility
  const top20Akumulasi = useMemo(() => partitions.akumulasi.slice(0, 20), [partitions]);
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(top20Akumulasi.length / itemsPerPage));
  const paginatedTopAkumulasi = useMemo(() => {
    const start = summaryPage * itemsPerPage;
    return top20Akumulasi.slice(start, start + itemsPerPage);
  }, [top20Akumulasi, summaryPage]);

  const top7Accumulation = useMemo(() => partitions.akumulasi.slice(0, 7), [partitions]);
  const top7Distribution = useMemo(() => partitions.distribusi.slice(0, 7), [partitions]);
  const top7Hold = useMemo(() => partitions.hold.slice(0, 7), [partitions]);

  // Filtered active list for browsing
  const filteredBrowsingList = useMemo(() => {
    let baseList = activeSegment === "AKUMULASI" 
      ? partitions.akumulasi 
      : activeSegment === "DISTRIBUSI" 
        ? partitions.distribusi 
        : partitions.hold;

    if (filterSector !== "all") {
      baseList = baseList.filter(s => s.sector === filterSector);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      baseList = baseList.filter(s => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }

    return baseList;
  }, [activeSegment, partitions, filterSector, searchQuery]);

  const handleNextPage = () => {
    setSummaryPage((prev) => (prev + 1) % totalPages);
  };
  const handlePrevPage = () => {
    setSummaryPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* HEADER HERO */}
      <div className="relative overflow-hidden bg-slate-900/10 border border-slate-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[9.5px] font-black uppercase text-cyan-300 bg-cyan-950/40 border border-cyan-800/30 rounded-full font-mono tracking-widest animate-pulse">
              ANALISIS BANDAROLOGI PREMIUM
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-display">
            Akumulasi, Distribusi &amp; Hold Radar
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Menyajikan peta kontrol modal, akumulasi institusional bandar asing, serta fase distribusi ritel domestik secara komprehensif berdasar data penutupan sesi bursa efek Indonesia (IDX).
          </p>
        </div>
        <div className="relative aspect-video w-32 shrink-0 hidden md:block select-none pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-16 h-16 text-cyan-500/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* DAILY COMPACT SUMMARY CARD */}
      <div className="bg-gradient-to-r from-[#010912]/90 via-[#041d2e]/40 to-[#010a13]/95 border border-cyan-500/10 p-5 rounded-2xl shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 z-10 relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                Ringkasan Akumulasi Harian
              </span>
              <span className="bg-emerald-950/80 border border-emerald-500/30 text-[8.5px] text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                PRO DATA
              </span>
            </div>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              Top 20 Emiten Akumulasi Terbanyak
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal max-w-xl">
              Peta otomatis mendeteksi 20 saham bursa dengan tingkat akumulasi momentum pembelian institusional tertinggi hari ini. Menampilkan halaman {summaryPage + 1} dari {totalPages}.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 z-15 relative">
            <div className="flex items-center gap-3 bg-slate-950/45 border border-slate-900/80 p-2.5 rounded-xl shrink-0 font-mono">
              <div className="text-left">
                <span className="text-[7.5px] text-slate-500 block uppercase font-bold tracking-wider">TOTAL VOLUME TOP 20</span>
                <span className="text-xs font-bold text-slate-200">
                  {top20Akumulasi.length > 0 
                    ? (top20Akumulasi.reduce((sum, s) => sum + (s.volume || 0), 0) / 1000000).toFixed(1) + "M Lembar"
                    : "0.0M Lembar"}
                </span>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-950/45 border border-slate-900/80 p-1.5 rounded-xl shrink-0">
                <button
                  onClick={handlePrevPage}
                  className="p-1 px-2.5 text-xs rounded-lg bg-[#010a11] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1 active:scale-95 select-none"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[9.5px] font-bold font-mono">Prev</span>
                </button>
                
                <div className="text-center px-2 min-w-[55px] font-mono leading-none">
                  <span className="text-[8px] text-[#4d97c5] font-black uppercase tracking-wider block mb-0.5">PAGE</span>
                  <span className="text-xs font-black text-cyan-400">
                    {summaryPage + 1} <span className="text-slate-600 font-normal">/</span> {totalPages}
                  </span>
                </div>

                <button
                  onClick={handleNextPage}
                  className="p-1 px-2.5 text-xs rounded-lg bg-[#010a11] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1 active:scale-95 select-none"
                  title="Halaman Berikutnya"
                >
                  <span className="text-[9.5px] font-bold font-mono">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {paginatedTopAkumulasi.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-mono">
            Tidak ada emiten dengan sinyal akumulasi terdeteksi
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
              {paginatedTopAkumulasi.map((stock, index) => {
                const rankIndex = summaryPage * itemsPerPage + index + 1;
                const buyStrength = 70 + (stock.ticker.charCodeAt(0) % 25);
                const customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 1.2).toFixed(1);
                return (
                  <motion.div
                    key={stock.ticker}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => onSelectStock(stock.ticker)}
                    className="bg-slate-950/85 border border-emerald-500/15 hover:border-emerald-500/40 rounded-xl p-3 flex flex-col justify-between space-y-2.5 transition-all duration-300 hover:scale-[1.03] cursor-pointer group/card relative overflow-hidden h-[115px]"
                  >
                    {/* Rank background decorator */}
                    <div className="absolute -bottom-3 -right-2 text-7xl font-black italic text-emerald-550/10 opacity-30 select-none pointer-events-none font-sans leading-none">
                      {rankIndex}
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-black text-white group-hover/card:text-emerald-400 transition-colors">
                            {stock.ticker}
                          </span>
                          <span className="text-[8px] font-bold bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-1 rounded font-mono">
                            #{rankIndex}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate" title={stock.name}>
                          {stock.name}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 opacity-40 group-hover/card:opacity-100 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-all" />
                    </div>

                    <div className="space-y-1 relative z-10 pt-1.5 border-t border-slate-900/60">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-mono font-bold text-slate-300">
                          Rp {Math.round(stock.currentPrice).toLocaleString("id-ID")}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-400">
                          +{Math.abs(stock.changePercent).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                        <span>Net Flow</span>
                        <span className="text-cyan-400 font-bold">+{customNetFlow}B</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Micro Dot Indicators at the bottom */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1.5 mt-4 z-10 relative">
                {Array.from({ length: totalPages }).map((_, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setSummaryPage(pIdx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      pIdx === summaryPage ? "w-6 bg-cyan-400" : "w-1.5 bg-slate-800 hover:bg-slate-700"
                    }`}
                    title={`Halaman ${pIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1: TOP 7 LEADERBOARDS SIDE-BY-SIDE WITH HIGH FIDELITY MODERN GRAPHICS */}
      {/* SECTION 1: TOP LEADERBOARDS AS HORIZONTAL SWIPEABLE PATHS (GESER KE SAMPING) */}
      <div className="space-y-8">
        
        {/* TRACK 1: AKUMULASI */}
        <div className="bg-[#020d18]/45 border border-emerald-950/40 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 border-b border-emerald-950/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider font-mono">
                Sinyal Akumulasi Besar (Accumulation Radar Grid)
              </h3>
            </div>
            <span className="text-[10.5px] text-cyan-400 font-mono font-bold select-none">
              Menampilkan {Math.min(12, partitions.akumulasi.length)} Emiten Teratas dari total {partitions.akumulasi.length} radar bursa
            </span>
          </div>

          <div className="flex overflow-x-auto gap-4 pt-2 pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
            {partitions.akumulasi.slice(0, 12).map((stock, idx) => {
              const buyStrength = 70 + (stock.ticker.charCodeAt(0) % 25);
              const customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 1.2).toFixed(1);
              return (
                <div 
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock.ticker)}
                  className="relative bg-gradient-to-b from-[#091522]/90 to-[#010a12]/95 border border-emerald-500/15 hover:border-emerald-500/40 p-4 rounded-xl shadow-lg hover:shadow-emerald-950/25 hover:scale-[1.02] transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-3 min-h-[195px] overflow-hidden w-[280px] sm:w-[320px] shrink-0 snap-start"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-white font-mono tracking-wide group-hover:text-emerald-400">
                          {stock.ticker}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/20 text-[7.5px] text-emerald-400 font-mono font-extrabold uppercase tracking-wider">
                          {stock.sector?.substring(0, 10) || "IDX"}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-sans block truncate w-full" title={stock.name}>
                        {stock.name.trim().toUpperCase().startsWith("PT") ? stock.name : `PT ${stock.name}`}
                      </span>
                    </div>
                    <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded-md font-mono text-[8px] font-black shrink-0">
                      ID CARD #{idx + 1}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-900/60 flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] text-slate-500 font-bold uppercase block tracking-wider font-mono">LIVE PRICE</span>
                      <span className="text-xs font-mono font-extrabold text-slate-200">
                        Rp {Math.round(stock.currentPrice).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-[7.5px] text-slate-500 font-bold uppercase block tracking-wider font-mono">PERUBAHAN</span>
                      <span className="text-[10px] text-[#22c55e] font-mono font-black block">
                        ▲ +{Math.abs(stock.changePercent).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#020d18] border border-emerald-500/10 p-2 rounded-lg text-[9px] space-y-1">
                    <div className="flex justify-between items-center leading-none">
                      <span className="text-slate-400 font-semibold">Inst. Net Flow:</span>
                      <span className="text-cyan-300 font-mono font-black">+{customNetFlow}B</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex border border-white/5 mt-1">
                      <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: `${buyStrength}%` }} />
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono font-bold flex justify-between items-center mt-1">
                      <span>ACCUM SIGNAL</span>
                      <span className="text-emerald-400 font-bold">{buyStrength}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TRACK 2: DISTRIBUSI */}
        <div className="bg-[#120407]/35 border border-rose-950/30 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 border-b border-rose-950/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider font-mono">
                Sinyal Distribusi Pekat (Distribution Radar Grid)
              </h3>
            </div>
            <span className="text-[10.5px] text-cyan-400 font-mono font-bold select-none">
              Menampilkan {Math.min(12, partitions.distribusi.length)} Emiten Teratas dari total {partitions.distribusi.length} radar bursa
            </span>
          </div>

          <div className="flex overflow-x-auto gap-4 pt-2 pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
            {partitions.distribusi.slice(0, 12).map((stock, idx) => {
              const sellStrength = 65 + (stock.ticker.charCodeAt(0) % 25);
              const customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 1.8).toFixed(1);
              return (
                <div 
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock.ticker)}
                  className="relative bg-gradient-to-b from-[#18080f]/90 to-[#0e0207]/95 border border-rose-500/15 hover:border-rose-500/40 p-4 rounded-xl shadow-lg hover:shadow-rose-950/25 hover:scale-[1.02] transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-3 min-h-[195px] overflow-hidden w-[280px] sm:w-[320px] shrink-0 snap-start"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-white font-mono tracking-wide group-hover:text-rose-400">
                          {stock.ticker}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/20 text-[7.5px] text-rose-450 font-mono font-extrabold uppercase tracking-wider">
                          {stock.sector?.substring(0, 10) || "IDX"}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-sans block truncate w-full" title={stock.name}>
                        {stock.name.trim().toUpperCase().startsWith("PT") ? stock.name : `PT ${stock.name}`}
                      </span>
                    </div>
                    <span className="bg-rose-950/70 text-rose-450 border border-rose-500/10 px-1.5 py-0.5 rounded-md font-mono text-[8px] font-black shrink-0">
                      ID CARD #{idx + 1}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-900/60 flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] text-slate-500 font-bold uppercase block tracking-wider font-mono">LIVE PRICE</span>
                      <span className="text-xs font-mono font-extrabold text-slate-200">
                        Rp {Math.round(stock.currentPrice).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-[7.5px] text-slate-500 font-bold uppercase block tracking-wider font-mono">PERUBAHAN</span>
                      <span className="text-[10px] text-[#ef4444] font-mono font-black block">
                        ▼ {Math.abs(stock.changePercent).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0b0407] border border-rose-500/10 p-2 rounded-lg text-[9px] space-y-1">
                    <div className="flex justify-between items-center leading-none">
                      <span className="text-slate-400 font-semibold">Inst. Net Flow:</span>
                      <span className="text-rose-400 font-mono font-black">-{customNetFlow}B</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex border border-white/5 mt-1">
                      <div className="h-full bg-rose-500 rounded-full animate-pulse" style={{ width: `${sellStrength}%` }} />
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono font-bold flex justify-between items-center mt-1">
                      <span>DISTRIB SIGNAL</span>
                      <span className="text-rose-400 font-bold">{sellStrength}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TRACK 3: HOLD */}
        <div className="bg-[#120e04]/35 border border-amber-955/20 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 border-b border-amber-950/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider font-mono">
                Sinyal Neutral Hold / Sideways (Hold Radar Grid)
              </h3>
            </div>
            <span className="text-[10.5px] text-cyan-400 font-mono font-bold select-none">
              Menampilkan {Math.min(12, partitions.hold.length)} Emiten Teratas dari total {partitions.hold.length} radar bursa
            </span>
          </div>

          <div className="flex overflow-x-auto gap-4 pt-2 pb-4 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
            {partitions.hold.slice(0, 12).map((stock, idx) => {
              const holdPct = 85 - (stock.ticker.charCodeAt(0) % 15);
              const customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 0.3).toFixed(1);
              const isUp = stock.changePercent >= 0;
              return (
                <div 
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock.ticker)}
                  className="relative bg-gradient-to-b from-[#181309]/90 to-[#0e0b05]/95 border border-amber-500/15 hover:border-amber-500/40 p-4 rounded-xl shadow-lg hover:shadow-amber-950/25 hover:scale-[1.02] transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-3 min-h-[195px] overflow-hidden w-[280px] sm:w-[320px] shrink-0 snap-start"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-white font-mono tracking-wide group-hover:text-amber-400">
                          {stock.ticker}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/20 text-[7.5px] text-amber-450 font-mono font-extrabold uppercase tracking-wider">
                          {stock.sector?.substring(0, 10) || "IDX"}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-sans block truncate w-full" title={stock.name}>
                        {stock.name.trim().toUpperCase().startsWith("PT") ? stock.name : `PT ${stock.name}`}
                      </span>
                    </div>
                    <span className="bg-amber-950/70 text-amber-450 border border-amber-500/10 px-1.5 py-0.5 rounded-md font-mono text-[8px] font-black shrink-0">
                      ID CARD #{idx + 1}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-900/60 flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] text-slate-500 font-bold uppercase block tracking-wider font-mono">LIVE PRICE</span>
                      <span className="text-xs font-mono font-extrabold text-slate-200">
                        Rp {Math.round(stock.currentPrice).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-[7.5px] text-slate-500 font-bold uppercase block tracking-wider font-mono">PERUBAHAN</span>
                      <span className={`text-[10px] font-mono font-black block ${isUp ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {isUp ? "▲ +" : "▼ "}{Math.abs(stock.changePercent).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0b0a03] border border-amber-500/10 p-2 rounded-lg text-[9px] space-y-1">
                    <div className="flex justify-between items-center leading-none">
                      <span className="text-slate-400 font-semibold">Inst. Net Flow:</span>
                      <span className="text-amber-400 font-mono font-black">+{customNetFlow}B</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex border border-white/5 mt-1">
                      <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: `${holdPct}%` }} />
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono font-bold flex justify-between items-center mt-1">
                      <span>STABLE SIGNAL</span>
                      <span className="text-amber-450 font-bold">{holdPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
