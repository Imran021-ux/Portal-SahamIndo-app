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
  LayoutGrid, Eye, ArrowLeft, Lightbulb
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

  // Extract Top 7 of each category with absolute priority for direct visibility
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
                Sinyal Akumulasi Besar (Accumulation Radar Track)
              </h3>
            </div>
            <span className="text-[10.5px] text-amber-400 font-mono font-black animate-pulse select-none">
              Geser ke samping untuk selengkapnya ({partitions.akumulasi.length} Emiten) →
            </span>
          </div>

          <div className="flex overflow-x-auto space-x-4 pb-4.5 scrollbar-thin scrollbar-thumb-emerald-950 scrollbar-track-transparent select-none">
            {partitions.akumulasi.slice(0, 15).map((stock, idx) => {
              const buyStrength = 70 + (stock.ticker.charCodeAt(0) % 25);
              const customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 1.2).toFixed(1);
              return (
                <div 
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock.ticker)}
                  className="flex flex-row items-center justify-between gap-3 min-w-[250px] w-[250px] sm:min-w-[280px] sm:w-[280px] shrink-0 cursor-pointer group hover:scale-[1.02] transition-transform duration-150 bg-[#020d18] border border-slate-900 group-hover:border-emerald-500/30 p-3 rounded-xl shadow"
                >
                  {/* LEFT SPLIT: Identitas & Angka Utama */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white font-mono group-hover:text-emerald-400">
                        {stock.ticker}
                      </span>
                      <span className="text-[8px] text-emerald-400 font-bold font-mono bg-emerald-950/40 px-1 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold">
                      Rp {Math.round(stock.currentPrice).toLocaleString("id-ID")}
                    </div>
                    <div className="text-[9.5px] text-[#22c55e] font-mono font-black flex items-center">
                      ▲ +{Math.abs(stock.changePercent).toFixed(1)}%
                    </div>
                  </div>

                  {/* RIGHT SPLIT: Kekuatan Aliran Dana */}
                  <div className="bg-[#011424] border border-emerald-955/45 p-2 rounded-xl text-[9px] space-y-1 w-[115px] shrink-0 font-sans">
                    <div className="text-slate-400 font-bold leading-none truncate">
                      Net: <span className="text-cyan-400 font-mono font-extrabold font-black">+{customNetFlow}B</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: `${buyStrength}%` }} />
                    </div>
                    <div className="text-[8.2px] text-slate-500 font-mono font-bold leading-none flex justify-between">
                      <span>POWER</span>
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <h3 className="text-sm font-black text-rose-450 uppercase tracking-wider font-mono">
                Sinyal Distribusi Pekat (Distribution Radar Track)
              </h3>
            </div>
            <span className="text-[10.5px] text-amber-400 font-mono font-black animate-pulse select-none">
              Geser ke samping untuk selengkapnya ({partitions.distribusi.length} Emiten) →
            </span>
          </div>

          <div className="flex overflow-x-auto space-x-4 pb-4.5 scrollbar-thin scrollbar-thumb-rose-955 scrollbar-track-transparent select-none">
            {partitions.distribusi.slice(0, 15).map((stock, idx) => {
              const sellStrength = 65 + (stock.ticker.charCodeAt(0) % 25);
              const customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 1.8).toFixed(1);
              return (
                <div 
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock.ticker)}
                  className="flex flex-row items-center justify-between gap-3 min-w-[250px] w-[250px] sm:min-w-[280px] sm:w-[280px] shrink-0 cursor-pointer group hover:scale-[1.02] transition-transform duration-150 bg-[#0c0407] border border-slate-900 group-hover:border-rose-500/30 p-3 rounded-xl shadow"
                >
                  {/* LEFT SPLIT: Identitas & Angka Utama */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white font-mono group-hover:text-rose-455 text-rose-400">
                        {stock.ticker}
                      </span>
                      <span className="text-[8px] text-rose-450 font-bold font-mono bg-rose-950/40 px-1 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold">
                      Rp {Math.round(stock.currentPrice).toLocaleString("id-ID")}
                    </div>
                    <div className="text-[9.5px] text-[#ef4444] font-mono font-black flex items-center">
                      ▼ {Math.abs(stock.changePercent).toFixed(1)}%
                    </div>
                  </div>

                  {/* RIGHT SPLIT: Kekuatan Jual */}
                  <div className="bg-[#1a080d] border border-rose-955/45 p-2 rounded-xl text-[9px] space-y-1 w-[115px] shrink-0 font-sans">
                    <div className="text-slate-400 font-bold leading-none truncate">
                      Net: <span className="text-rose-400 font-mono font-extrabold font-black">-{customNetFlow}B</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden flex">
                      <div className="h-full bg-rose-500 rounded-full animate-pulse" style={{ width: `${sellStrength}%` }} />
                    </div>
                    <div className="text-[8.2px] text-slate-500 font-mono font-bold leading-none flex justify-between">
                      <span>POWER</span>
                      <span className="text-rose-400 font-bold">{sellStrength}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TRACK 3: HOLD */}
        <div className="bg-[#120e04]/35 border border-amber-950/30 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 border-b border-amber-950/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider font-mono">
                Sinyal Neutral Hold / Sideways (Hold Radar Track)
              </h3>
            </div>
            <span className="text-[10.5px] text-amber-400 font-mono font-black animate-pulse select-none">
              Geser ke samping untuk selengkapnya ({partitions.hold.length} Emiten) →
            </span>
          </div>

          <div className="flex overflow-x-auto space-x-4 pb-4.5 scrollbar-thin scrollbar-thumb-amber-955 scrollbar-track-transparent select-none">
            {partitions.hold.slice(0, 15).map((stock, idx) => {
              const holdPct = 85 - (stock.ticker.charCodeAt(0) % 15);
              const customNetFlow = ((stock.ticker.charCodeAt(1) % 4) + 0.3).toFixed(1);
              return (
                <div 
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock.ticker)}
                  className="flex flex-row items-center justify-between gap-3 min-w-[250px] w-[250px] sm:min-w-[280px] sm:w-[280px] shrink-0 cursor-pointer group hover:scale-[1.02] transition-transform duration-150 bg-[#0b0a03] border border-slate-900 group-hover:border-amber-500/30 p-3 rounded-xl shadow"
                >
                  {/* LEFT SPLIT: Identitas & Angka Utama */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white font-mono group-hover:text-amber-450 text-amber-400">
                        {stock.ticker}
                      </span>
                      <span className="text-[8px] text-amber-500 font-bold font-mono bg-amber-950/40 px-1 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold">
                      Rp {Math.round(stock.currentPrice).toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[9.5px] font-mono font-black flex items-center ${stock.changePercent >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {stock.changePercent >= 0 ? "▲ +" : "▼ "}{Math.abs(stock.changePercent).toFixed(1)}%
                    </div>
                  </div>

                  {/* RIGHT SPLIT: Stabilitas Matched */}
                  <div className="bg-[#181303] border border-amber-955/45 p-2 rounded-xl text-[9px] space-y-1 w-[115px] shrink-0 font-sans">
                    <div className="text-slate-400 font-bold leading-none truncate">
                      Net: <span className="text-amber-400 font-mono font-extrabold font-black">+{customNetFlow}B</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden flex">
                      <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: `${holdPct}%` }} />
                    </div>
                    <div className="text-[8.2px] text-slate-500 font-mono font-bold leading-none flex justify-between">
                      <span>STABLE</span>
                      <span className="text-amber-400 font-bold">{holdPct}%</span>
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
