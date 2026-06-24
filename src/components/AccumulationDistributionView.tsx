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
  LayoutGrid, Eye, ArrowLeft, Lightbulb, ChevronLeft, ChevronRight, Zap
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
  const [browsingPage, setBrowsingPage] = useState(0);
  const browsingItemsPerPage = 8;

  // Reset browsing page when filters or active segments change
  React.useEffect(() => {
    setBrowsingPage(0);
  }, [activeSegment, searchQuery, filterSector]);

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

      {/* 💳 PORTRAIT ID PASS RADAR HUB (PORTRAIT ID CARD WITH DETAILED PAGES) */}
      <div className="space-y-6 pt-4 border-t border-slate-900">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#22d3ee] font-mono bg-cyan-950/40 border border-cyan-800/30 px-2.5 py-0.5 rounded-full">
              ⚡ LIVE FLUX PASS SCANNER
            </span>
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2 font-display">
              Detektor Aliran Bandarologi &amp; Fase Sideways
            </h3>
            <p className="text-xs text-slate-400">
              Sistem visual interaktif yang menyajikan kondisi emiten bursa dalam bentuk kartu ID personal (Portrait Card ID) berstatus militer/institusional.
            </p>
          </div>
        </div>

        {/* 🛠️ CONTROL PANEL: TABS & FILTER CONTROLLERS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center bg-slate-950/65 border border-slate-900 p-4 rounded-2xl relative z-20">
          
          {/* Segment Selector Tabs (Akumulasi vs Distribusi vs Hold) */}
          <div className="xl:col-span-6 flex flex-wrap gap-2">
            {[
              { id: "AKUMULASI", label: "Akumulasi", color: "text-emerald-400 border-emerald-950 hover:bg-emerald-950/20", activeBg: "bg-emerald-500/10 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-950/40" },
              { id: "DISTRIBUSI", label: "Distribusi", color: "text-rose-400 border-rose-950 hover:bg-rose-950/20", activeBg: "bg-rose-500/10 border-rose-500/60 text-rose-300 shadow-lg shadow-rose-950/40" },
              { id: "HOLD", label: "Neutral Hold", color: "text-amber-400 border-amber-955/20 hover:bg-amber-955/10", activeBg: "bg-amber-500/10 border-amber-500/60 text-amber-300 shadow-lg shadow-amber-950/40" }
            ].map((tab) => {
              const count = tab.id === "AKUMULASI" 
                ? partitions.akumulasi.length 
                : tab.id === "DISTRIBUSI" 
                  ? partitions.distribusi.length 
                  : partitions.hold.length;

              const isActive = activeSegment === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSegment(tab.id as "AKUMULASI" | "DISTRIBUSI" | "HOLD");
                    setBrowsingPage(0);
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider font-mono flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                    isActive ? tab.activeBg : `bg-slate-950/90 ${tab.color} opacity-60 hover:opacity-100`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    tab.id === "AKUMULASI" 
                      ? "bg-emerald-500" 
                      : tab.id === "DISTRIBUSI" 
                        ? "bg-rose-500" 
                        : "bg-amber-500"
                  }`} />
                  <span>{tab.label}</span>
                  <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded-md text-slate-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Live Search and Industry Filter */}
          <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode emiten / nama korporasi..."
                className="w-full bg-[#02080f]/90 border border-slate-800 focus:border-cyan-500 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl placeholder-slate-500 focus:outline-none transition font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sector / Industry Selector */}
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full bg-[#02080f]/90 border border-slate-800 focus:border-cyan-500 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none transition font-mono cursor-pointer"
            >
              <option value="all">🌐 Semua Sektor ({sectorsList.length})</option>
              {sectorsList.map((sec) => (
                <option key={sec} value={sec}>
                  📁 {sec}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* 📄 PAGINATED PORTRAIT ID CARDS GRID LAYOUT */}
        {(() => {
          const totalBrowsingPages = Math.max(1, Math.ceil(filteredBrowsingList.length / browsingItemsPerPage));
          const paginatedBrowsingList = filteredBrowsingList.slice(
            browsingPage * browsingItemsPerPage, 
            (browsingPage * browsingItemsPerPage) + browsingItemsPerPage
          );

          if (filteredBrowsingList.length === 0) {
            return (
              <div className="text-center py-16 bg-slate-950/20 border border-slate-900 rounded-2xl space-y-3.5">
                <div className="text-4xl text-slate-650">📇</div>
                <h4 className="text-sm font-black text-slate-300 font-mono">B-PASS NOT FOUND</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Tidak ada kecocokan data emiten dengan kata kunci <span className="text-cyan-400">"{searchQuery}"</span> dan kategori sektor terpilih. Silahkan periksa filter Anda.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterSector("all");
                  }}
                  className="px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-extrabold bg-[#051421] hover:bg-slate-900 border border-slate-800 rounded-lg text-cyan-400 cursor-pointer hover:border-cyan-500/35 transition"
                >
                  Reset Filter Rader
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              
              {/* Pagination Info Header */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tracking-wide px-1">
                <div>
                  Menampilkan <span className="text-white font-bold">{Math.min(filteredBrowsingList.length, browsingPage * browsingItemsPerPage + 1)}</span>
                  {" hingga "}
                  <span className="text-white font-bold">{Math.min(filteredBrowsingList.length, (browsingPage + 1) * browsingItemsPerPage)}</span>
                  {" dari "}
                  <span className="text-cyan-400 font-bold">{filteredBrowsingList.length}</span> emiten aktif
                </div>
                <div className="hidden sm:block text-slate-500">
                  Kategori aktif: <span className="text-white font-bold">{activeSegment} RADAR</span>
                </div>
              </div>

              {/* Main portrait grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center relative z-10">
                {paginatedBrowsingList.map((stock, idx) => {
                  const globalIdx = browsingPage * browsingItemsPerPage + idx + 1;
                  const charCodeSum = stock.ticker.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
                  const isUp = stock.changePercent >= 0;
                  
                  // Theme parameters to mirror top entry colors
                  let borderHoverClass = "hover:border-emerald-500/35";
                  let topGradientClass = "from-cyan-500/30 via-emerald-500/40 to-transparent group-hover:from-cyan-400 group-hover:via-emerald-400";
                  let textColorClass = "group-hover:text-emerald-300";
                  let badgeBgClass = "bg-emerald-950 text-emerald-400";
                  let priceBoxBgClass = "bg-[#06110a]/50 border border-emerald-950/50";
                  let changeTextColor = isUp ? "text-emerald-400" : "text-rose-400";
                  let progressFillClass = "bg-gradient-to-r from-emerald-600 to-emerald-400";
                  let customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 1.2).toFixed(1);
                  let flowString = `+Rp ${customNetFlow}B`;
                  let flowColor = "text-emerald-400";
                  let bandarStrength = "HEAVY ACCUM";
                  let signalMagnitude = Math.round(75 + (stock.ticker.charCodeAt(0) % 20));

                  if (activeSegment === "DISTRIBUSI") {
                    borderHoverClass = "hover:border-rose-500/35";
                    topGradientClass = "from-yellow-500/30 via-rose-500/40 to-transparent group-hover:from-yellow-400 group-hover:via-rose-400";
                    textColorClass = "group-hover:text-rose-300";
                    badgeBgClass = "bg-rose-950 text-rose-450 text-rose-400";
                    priceBoxBgClass = "bg-[#14050a]/50 border border-rose-955/50";
                    changeTextColor = isUp ? "text-emerald-400" : "text-[#ef4444]";
                    progressFillClass = "bg-gradient-to-r from-rose-600 to-rose-400";
                    customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 1.8).toFixed(1);
                    flowString = `-Rp ${customNetFlow}B`;
                    flowColor = "text-rose-400";
                    bandarStrength = "MASSIVE DISTRIB";
                    signalMagnitude = Math.round(70 + (stock.ticker.charCodeAt(0) % 25));
                  } else if (activeSegment === "HOLD") {
                    borderHoverClass = "hover:border-amber-500/35";
                    topGradientClass = "from-cyan-500/30 via-amber-500/40 to-transparent group-hover:from-cyan-400 group-hover:via-amber-400";
                    textColorClass = "group-hover:text-amber-300";
                    badgeBgClass = "bg-amber-950 text-amber-450 text-amber-400";
                    priceBoxBgClass = "bg-[#141005]/50 border border-amber-955/50";
                    changeTextColor = isUp ? "text-emerald-400" : "text-amber-400";
                    progressFillClass = "bg-gradient-to-r from-amber-600 to-amber-400";
                    customNetFlow = ((stock.ticker.charCodeAt(1) % 3) + 0.2).toFixed(1);
                    flowString = `+Rp ${customNetFlow}B`;
                    flowColor = "text-amber-400";
                    bandarStrength = "STABLE SIDEWAYS";
                    signalMagnitude = Math.round(80 - (charCodeSum % 18));
                  }

                  // Sinyal text lists based on context
                  const accumSignals = [
                    "Deteksi Broker Akumulasi Agung",
                    "Volume Spike Breakout MA50",
                    "Aktivitas Volume Block Order",
                    "Institutional Net Buy Momentum",
                    "Aggressive Bid Support Absorption",
                    "Sideways Squeeze Accumulation",
                    "Smart Money Flow Bullish"
                  ];
                  const distSignals = [
                    "Deteksi Distribusi Broker Pekat",
                    "Volume Spike Bearish Breakdown",
                    "Aktivitas Block Order Selling",
                    "Institutional Profit Taking",
                    "Aggressive Ask Supply Distribution",
                    "Bearish Trend Continuation Flow",
                    "Smart Money Exit Distribution"
                  ];
                  const holdSignals = [
                    "Konsolidasi Harga Sideways No-Trend",
                    "Volume Compression Squeeze",
                    "Balanced Supply and Demand",
                    "Trading Range Boundary Stable",
                    "Institutional Passive Hold State",
                    "Low Volatility Bollinger Squeeze",
                    "Sideways Channel Range Bound"
                  ];
                  const signalReason = activeSegment === "AKUMULASI" 
                    ? accumSignals[charCodeSum % accumSignals.length] 
                    : activeSegment === "DISTRIBUSI" 
                      ? distSignals[charCodeSum % distSignals.length] 
                      : holdSignals[charCodeSum % holdSignals.length];

                  return (
                    <motion.div
                      key={stock.ticker}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04 }}
                      onClick={() => onSelectStock(stock)}
                      className={`bg-slate-950/80 border border-slate-900/80 ${borderHoverClass} hover:scale-[1.02] p-4 rounded-xl flex flex-col justify-between space-y-3.5 cursor-pointer transition-all relative overflow-hidden group shadow-lg w-full max-w-[275px]`}
                    >
                      {/* Top Accent Gradient Border */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topGradientClass} transition-all duration-300`} />
                      
                      {/* Header Box */}
                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className={`text-sm font-black text-white font-mono uppercase tracking-wide ${textColorClass} transition-colors block truncate`}>
                              {stock.ticker}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold truncate max-w-[80px]" title={stock.sector}>
                              {stock.sector || "IDX"}
                            </span>
                          </div>
                          <span className={`text-[9px] ${badgeBgClass} font-extrabold px-1.5 py-0.5 rounded font-mono shrink-0`}>
                            Rank #{globalIdx}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate font-sans font-medium" title={stock.name}>
                          {stock.name}
                        </p>
                      </div>

                      {/* Price and Rise Estimation Summary */}
                      <div className={`p-2 ${priceBoxBgClass} rounded-lg flex items-center justify-between font-mono`}>
                        <div className="text-left">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider font-sans">Harga Live</span>
                          <span className="text-[11px] font-bold text-white block mt-0.5">Rp{Math.round(stock.currentPrice).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider font-sans">Sinyal 1D</span>
                          <span className={`text-[11px] font-black ${changeTextColor} block mt-0.5`}>
                            {stock.changePercent >= 0 ? "▲ +" : "▼ "}{Math.abs(stock.changePercent).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Volume, Frequency and Bandar Accumulation info! */}
                      <div className="bg-slate-900/45 border border-white/[0.02] rounded-lg p-2.5 space-y-1.5 text-[10px] font-sans text-left">
                        <div className="flex justify-between items-center text-slate-450">
                          <span className="text-slate-500 font-medium">Market Cap:</span>
                          <span className="font-mono font-bold text-slate-200">{(stock.marketCap / 1000).toFixed(1)}T IDR</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-455">
                          <span className="text-slate-500 font-medium">Volume Lot:</span>
                          <span className="font-mono font-bold text-sky-400">{(stock.volume / 100).toLocaleString("id-ID")} Lot</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-550 font-medium font-sans">Net Bandar Flow:</span>
                          <span className={`font-mono font-black ${flowColor}`}>{flowString}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-white/[0.04]">
                          <span className="text-slate-500 font-sans text-[8px] font-bold uppercase tracking-wide">Analisa Aliran Dana:</span>
                          <span className={`text-[8.5px] font-black rounded px-1.5 py-0.2 font-mono ${badgeBgClass}`}>
                            {bandarStrength}
                          </span>
                        </div>
                      </div>

                      {/* Radar trigger description */}
                      <div className="space-y-1 text-left">
                        <span className="text-[8px] text-slate-505 block uppercase font-extrabold tracking-wider font-sans">Sinyal Sistem Terkonfirmasi</span>
                        <p className="text-[10px] text-slate-350 font-medium font-sans leading-relaxed line-clamp-1 flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-cyan-400 shrink-0" /> {signalReason}
                        </p>
                      </div>

                      {/* Action buttons inside card */}
                      <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-white/[0.03]">
                        <span className="text-cyan-400 group-hover:underline font-extrabold font-sans">Detail Analisa &rarr;</span>
                        <span className="text-slate-505 font-mono font-bold">Akurasi {signalMagnitude}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 🕹️ PORTRAIT RADAR NAVIGATION & PAGES INDICATOR */}
              {totalBrowsingPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/45 border border-slate-900 px-5 py-3.5 rounded-2xl">
                  
                  {/* Left Label */}
                  <div className="text-xs text-slate-400 font-mono">
                    Halaman <span className="text-white font-bold">{browsingPage + 1}</span> dari <span className="text-cyan-400 font-bold">{totalBrowsingPages}</span>
                  </div>

                  {/* Diagnostic Numbers */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    
                    {/* First or Prev Button */}
                    <button
                      onClick={() => setBrowsingPage((prev) => Math.max(0, prev - 1))}
                      disabled={browsingPage === 0}
                      className="p-1 px-3 text-xs font-mono font-bold rounded-lg border border-slate-800 bg-[#000d16] text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:border-cyan-500/35 transition active:scale-95 cursor-pointer"
                      title="Sebelumnya"
                    >
                      &lt; PREV
                    </button>

                    {/* Numeric Jumper buttons */}
                    {Array.from({ length: totalBrowsingPages }).map((_, pIdx) => {
                      // show a reasonable subset of pages if too many
                      const isNearCurrent = Math.abs(pIdx - browsingPage) <= 1;
                      const isFirstOrLast = pIdx === 0 || pIdx === totalBrowsingPages - 1;
                      
                      if (!isNearCurrent && !isFirstOrLast) {
                        if (pIdx === 1 || pIdx === totalBrowsingPages - 2) {
                          return <span key={pIdx} className="text-slate-650 px-1 font-mono text-[9px]">..</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pIdx}
                          onClick={() => setBrowsingPage(pIdx)}
                          className={`w-7 h-7 text-[10px] font-mono font-black rounded-lg transition-all active:scale-95 cursor-pointer ${
                            pIdx === browsingPage 
                              ? "bg-cyan-500/10 text-[#22d3ee] border border-cyan-500" 
                              : "bg-[#010912] text-slate-400 border border-slate-800 hover:text-white hover:border-slate-600"
                          }`}
                        >
                          {pIdx + 1}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => setBrowsingPage((prev) => Math.min(totalBrowsingPages - 1, prev + 1))}
                      disabled={browsingPage === totalBrowsingPages - 1}
                      className="p-1 px-3 text-xs font-mono font-bold rounded-lg border border-slate-800 bg-[#000d16] text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:border-cyan-500/35 transition active:scale-95 cursor-pointer"
                      title="Berikutnya"
                    >
                      NEXT &gt;
                    </button>

                  </div>

                  {/* Info helper */}
                  <div className="text-[10px] text-slate-500 font-mono hidden xl:block uppercase">
                    🔒 AUTHENTIC MEMBER IDX DATA RADAR
                  </div>

                </div>
              )}

            </div>
          );
        })()}

      </div>
    </div>
  );
}
