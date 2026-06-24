/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Stock } from "../types";
import { 
  TrendingUp, TrendingDown, Layers, Info, 
  Sparkles, Check, ChevronDown,Maximize2 
} from "lucide-react";

interface MarketHeatmapProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock | string) => void;
}

interface SectorGroup {
  stocks: Stock[];
  totalCap: number;
  avgChange: number;
  greenCount: number;
  redCount: number;
}

export default function MarketHeatmap({ stocks, onSelectStock }: MarketHeatmapProps) {
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [minMarketCap, setMinMarketCap] = useState<number>(0); // filter by size
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredStock, setHoveredStock] = useState<Stock | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "treemap">("treemap");

  // Get list of unique sectors in Indonesian local names
  const sectors = useMemo(() => {
    const list = new Set<string>();
    stocks.forEach((s) => {
      if (s.sector) list.add(s.sector);
    });
    return Array.from(list).sort();
  }, [stocks]);

  // Group and process stocks by sector
  const processedData = useMemo(() => {
    // 1. Filter stocks first
    let filtered = stocks.filter((s) => {
      const matchSector = selectedSector === "ALL" || s.sector === selectedSector;
      const matchCap = s.marketCap >= minMarketCap;
      const matchSearch = s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSector && matchCap && matchSearch;
    });

    // 2. Group by sector
    const groups: Record<string, SectorGroup> = {};
    
    filtered.forEach((stock) => {
      const sector = stock.sector || "Lainnya";
      if (!groups[sector]) {
        groups[sector] = { stocks: [], totalCap: 0, avgChange: 0, greenCount: 0, redCount: 0 };
      }
      groups[sector].stocks.push(stock);
      groups[sector].totalCap += stock.marketCap || 0;
      if (stock.changePercent > 0) groups[sector].greenCount++;
      if (stock.changePercent < 0) groups[sector].redCount++;
    });

    // 3. Sort stocks inside each group by market cap
    // 4. Calculate weighted average change for each sector
    Object.keys(groups).forEach((sec) => {
      const group = groups[sec];
      group.stocks.sort((a, b) => b.marketCap - a.marketCap);
      
      let totalWeightedChange = 0;
      let capSum = 0;
      group.stocks.forEach((s) => {
        const cap = s.marketCap || 1;
        totalWeightedChange += s.changePercent * cap;
        capSum += cap;
      });
      group.avgChange = capSum > 0 ? totalWeightedChange / capSum : 0;
    });

    return groups;
  }, [stocks, selectedSector, minMarketCap, searchQuery]);

  // General market breadth stats
  const breadthStats = useMemo(() => {
    let green = 0;
    let red = 0;
    let flat = 0;
    let totalCap = 0;

    stocks.forEach((s) => {
      totalCap += s.marketCap || 0;
      if (s.changePercent > 0) green++;
      else if (s.changePercent < 0) red++;
      else flat++;
    });

    return { green, red, flat, totalCap, totalCount: stocks.length };
  }, [stocks]);

  // Color mapper based on price performance
  const getPerformanceBg = (change: number) => {
    if (change > 0) {
      if (change >= 5) return "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950";
      if (change >= 2) return "bg-emerald-900/90 border border-emerald-500/35 text-emerald-100 hover:bg-emerald-800";
      return "bg-emerald-950/70 border border-emerald-600/20 text-emerald-300 hover:bg-emerald-900/60";
    } else if (change < 0) {
      const abs = Math.abs(change);
      if (abs >= 5) return "bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950";
      if (abs >= 2) return "bg-rose-950/90 border border-rose-500/30 text-rose-100 hover:bg-rose-900";
      return "bg-rose-950/40 border border-rose-500/15 text-rose-400 hover:bg-rose-950/70";
    }
    // Sideways 0%
    return "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800";
  };

  const getHeatmapTitleColor = (change: number) => {
    if (change > 0) return "text-emerald-450 text-emerald-400";
    if (change < 0) return "text-rose-450 text-rose-400";
    return "text-slate-400";
  };

  // Humanize market cap numbers
  const formatCapValue = (bIdr: number) => {
    if (bIdr >= 1000) {
      return `Rp ${(bIdr / 1000).toFixed(2)} T`;
    }
    return `Rp ${bIdr.toFixed(1)} B`;
  };

  return (
    <div id="market-heatmap-view" className="bg-[#050c14] border border-cyan-500/15 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-80 h-40 bg-rose-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono">
              Bursa Market Analytics
            </span>
            <span className="bg-cyan-950/80 border border-cyan-500/30 text-[8.5px] text-cyan-400 px-2 py-0.5 rounded-full font-mono font-bold">
              PROPORSIONAL KAPITALISASI
            </span>
          </div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            Market Heatmap Sektor IDX
          </h2>
          <p className="text-xs text-slate-400 leading-normal max-w-xl">
            Visualisasi performa real-time seluruh emiten bursa. Ukuran kotak sebanding dengan <strong>Kapitalisasi Pasar</strong> (Market Cap), warna merepresentasikan <strong>Perubahan Harga (%)</strong>.
          </p>
        </div>

        {/* Live Breadth Banner */}
        <div className="flex items-center gap-3 bg-[#03080e] border border-slate-900/60 p-3 rounded-xl self-start lg:self-auto shrink-0 font-mono text-[10.5px]">
          <div>
            <span className="text-slate-500 block text-[8px] uppercase font-bold tracking-wider mb-1">MARKET BREADTH</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-emerald-450 text-emerald-400 flex items-center gap-1">
                ▲ {breadthStats.green} <span className="text-slate-600 font-normal">Naik</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 flex items-center gap-1">
                ■ {breadthStats.flat} <span className="text-slate-600 font-normal font-sans">Sama</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-rose-450 text-rose-400 flex items-center gap-1">
                ▼ {breadthStats.red} <span className="text-slate-600 font-normal">Turun</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-wrap items-center gap-3 bg-[#03080e]/60 border border-slate-900/80 p-3.5 rounded-xl">
        {/* Search */}
        <div className="flex-1 min-w-[180px]">
          <span className="text-[8.5px] text-slate-500 block uppercase font-bold tracking-wider mb-1">CARI EMITEN</span>
          <input
            type="text"
            placeholder="Cari (e.g. BBRI, GOTO)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 px-2.5 bg-[#01050a] border border-slate-800 hover:border-cyan-500/20 focus:border-cyan-500/40 text-xs text-white rounded-lg font-mono placeholder:text-slate-600 outline-none transition-all"
          />
        </div>

        {/* Sector selection */}
        <div className="min-w-[140px]">
          <span className="text-[8.5px] text-slate-500 block uppercase font-bold tracking-wider mb-1">SEKTOR</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full h-8 px-1.5 bg-[#01050a] border border-slate-800 text-xs text-slate-300 rounded-lg outline-none cursor-pointer hover:border-slate-700/80 transition font-sans"
          >
            <option value="ALL">Semua Sektor ({sectors.length})</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Market Cap Threshold Filter */}
        <div className="min-w-[150px]">
          <span className="text-[8.5px] text-slate-500 block uppercase font-bold tracking-wider mb-1">MIN KAPITALISASI</span>
          <select
            value={minMarketCap}
            onChange={(e) => setMinMarketCap(Number(e.target.value))}
            className="w-full h-8 px-1.5 bg-[#01050a] border border-slate-800 text-xs text-slate-300 rounded-lg outline-none cursor-pointer hover:border-slate-700/80 transition font-sans"
          >
            <option value={0}>Semua Market Cap</option>
            <option value={1000}>&gt; Rp 1 Triliun</option>
            <option value={10000}>&gt; Rp 10 Triliun</option>
            <option value={50000}>&gt; Rp 50 Triliun</option>
            <option value={100000}>&gt; Rp 100 Triliun</option>
          </select>
        </div>

        {/* View mode */}
        <div>
          <span className="text-[8.5px] text-slate-500 block uppercase font-bold tracking-wider mb-1">MODE HEATMAP</span>
          <div className="flex gap-1 bg-[#01050a] p-1 border border-slate-800 rounded-lg h-8 items-center">
            <button
              onClick={() => setViewMode("treemap")}
              className={`px-2 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                viewMode === "treemap" 
                  ? "bg-cyan-950/80 border border-cyan-500/25 text-cyan-300" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Proportional
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                viewMode === "grid" 
                  ? "bg-cyan-950/80 border border-cyan-500/25 text-cyan-300" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Classic Grid
            </button>
          </div>
        </div>
      </div>

      {/* QUICK INSTRUCTION ALERT */}
      <div className="flex items-center gap-2 text-[10px] text-cyan-400 bg-cyan-950/20 border border-cyan-900/60 px-3.5 py-2.5 rounded-xl font-sans">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>
          <strong>Tips Navigasi:</strong> Gunakan kursor hover untuk memunculkan detail instan emiten, atau <strong>klik kotak emiten</strong> untuk langsung memuat grafik candlestick interaktif & data indikator lengkap di dashboard utama.
        </span>
      </div>

      {/* 🎨 COLOR SCALE LEGEND */}
      <div className="bg-[#03080e]/40 border border-slate-900/60 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3.5 min-h-[46px]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-450 bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
            LEGENDA SKALA PERUBAHAN (%)
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[9.5px]">
          {/* Strongly Bearish */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-rose-500 to-pink-650 shrink-0" />
            <span className="text-rose-400 font-extrabold">&le; -5%</span>
          </div>

          {/* Bearish */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="w-2.5 h-2.5 rounded bg-rose-950/90 border border-rose-500/35 shrink-0" />
            <span className="text-rose-450 text-rose-400 font-medium">-2% s/d -5%</span>
          </div>

          {/* Mildly Bearish */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="w-2.5 h-2.5 rounded bg-rose-950/40 border border-rose-500/15 shrink-0" />
            <span className="text-rose-400/70 block">&lt; 0%</span>
          </div>

          {/* Unchanged / Sideways */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800 shrink-0" />
            <span className="text-slate-400 font-bold">0%</span>
          </div>

          {/* Mildly Bullish */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="w-2.5 h-2.5 rounded bg-emerald-950/70 border border-emerald-600/20 shrink-0" />
            <span className="text-emerald-400/80 block">&gt; 0%</span>
          </div>

          {/* Bullish */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="w-2.5 h-2.5 rounded bg-emerald-950/90 border border-emerald-500/35 shrink-0" />
            <span className="text-emerald-450 text-emerald-400 font-medium">2% s/d 5%</span>
          </div>

          {/* Strongly Bullish */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-emerald-500 to-teal-650 shrink-0" />
            <span className="text-emerald-400 font-extrabold">&ge; 5%</span>
          </div>
        </div>
      </div>

      {/* HEATMAP CANVAS VIEWPORT */}
      <div className="space-y-6 relative min-h-[300px]">
        {Object.keys(processedData).length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-mono text-xs border border-dashed border-slate-900 rounded-xl">
            Tidak ada saham yang sesuai dengan filter pencarian atau limit kapitalisasi pasar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(Object.entries(processedData) as [string, SectorGroup][]).map(([sectorName, secData]) => {
              // total market cap of filtered sector
              const sectorCapFormatted = formatCapValue(secData.totalCap);
              const sign = secData.avgChange > 0 ? "+" : "";
              const activeCount = secData.stocks.length;

              return (
                <div 
                  key={sectorName}
                  className="bg-[#03080f]/90 border border-slate-900 rounded-2xl p-4 flex flex-col space-y-3 shadow-lg"
                >
                  {/* Sector Title Line */}
                  <div className="flex items-start justify-between border-b border-slate-900/80 pb-2">
                    <div>
                      <h3 className="text-xs font-black text-white font-sans uppercase tracking-tight truncate max-w-[180px]" title={sectorName}>
                        {sectorName}
                      </h3>
                      <span className="text-[9px] text-slate-500 font-mono font-bold block">
                        {activeCount} Emiten • {sectorCapFormatted}
                      </span>
                    </div>
                    {/* Sector performance weighted average */}
                    <span className={`text-[10px] font-mono font-black border border-white/[0.04] px-2 py-0.5 rounded-full ${
                      secData.avgChange > 0 
                        ? "bg-emerald-950/60 text-emerald-450 border-emerald-500/20 text-emerald-400" 
                        : secData.avgChange < 0 
                        ? "bg-rose-950/60 text-rose-450 border-rose-500/20 text-rose-400" 
                        : "bg-slate-900 text-slate-400"
                    }`}>
                      {sign}{secData.avgChange.toFixed(2)}%
                    </span>
                  </div>

                  {/* Treemap / Grid of Stock Cards inside Sector */}
                  {viewMode === "treemap" ? (
                    // TREEMAP VIEW: Flexwrap where basis or flexGrow is proportional to marketCap
                    <div className="flex flex-wrap gap-[3px] min-h-[160px] content-start">
                      {secData.stocks.map((stock) => {
                        // Calculate weight factor. Cap it to reasonable limits
                        // Min value so it remains click-targetable, Max to avoid layout blowouts
                        const baseCap = stock.marketCap || 50;
                        const weight = Math.max(12, Math.min(100, Math.round(Math.sqrt(baseCap) * 3)));
                        const changeLabel = stock.changePercent > 0 ? `+${stock.changePercent.toFixed(1)}%` : `${stock.changePercent.toFixed(1)}%`;

                        return (
                          <div
                            key={stock.ticker}
                            onClick={() => onSelectStock(stock)}
                            onMouseEnter={() => setHoveredStock(stock)}
                            onMouseLeave={() => setHoveredStock(null)}
                            style={{ flexGrow: weight, width: `${weight * 1.5}px` }}
                            className={`min-h-[48px] rounded p-1.5 flex flex-col justify-between cursor-pointer select-none relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-md ${getPerformanceBg(stock.changePercent)}`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-mono text-[10.5px] font-black tracking-tight leading-none">
                                {stock.ticker}
                              </span>
                              {stock.isSuspended ? (
                                <span className="bg-rose-500 text-white text-[6.5px] leading-none px-0.5 py-0.5 rounded font-mono font-black animate-pulse shrink-0 scale-90">S</span>
                              ) : stock.isFca ? (
                                <span className="bg-amber-400 text-slate-950 text-[6.5px] leading-none px-0.5 py-0.5 rounded font-mono font-black shrink-0 scale-90">F</span>
                              ) : null}
                            </div>
                            <div className="flex justify-between items-baseline leading-none mt-1">
                              <span className="text-[8px] font-mono opacity-70">
                                {changeLabel}
                              </span>
                              <span className="text-[7.5px] opacity-50 shrink-0 font-sans font-medium">
                                {stock.marketCap >= 1000 ? `${(stock.marketCap / 1000).toFixed(0)}T` : `${stock.marketCap.toFixed(0)}B`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // CLASSIC GRID VIEW: Standard grid layout for high readability
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 min-h-[160px]">
                      {secData.stocks.map((stock) => {
                        const changeLabel = stock.changePercent > 0 ? `+${stock.changePercent.toFixed(1)}%` : `${stock.changePercent.toFixed(1)}%`;
                        return (
                          <div
                            key={stock.ticker}
                            onClick={() => onSelectStock(stock)}
                            onMouseEnter={() => setHoveredStock(stock)}
                            onMouseLeave={() => setHoveredStock(null)}
                            className={`p-1.5 rounded flex flex-col justify-between h-[45px] text-center cursor-pointer select-none transition-all duration-150 hover:brightness-110 active:scale-95 shadow relative overflow-hidden ${getPerformanceBg(stock.changePercent)}`}
                          >
                            <span className="font-mono text-[10px] font-black leading-none block">
                              {stock.ticker}
                              {stock.isSuspended && <span className="ml-1 text-[6px] bg-rose-500 text-white px-0.5 rounded font-mono font-black inline-block align-middle animate-pulse">S</span>}
                              {stock.isFca && !stock.isSuspended && <span className="ml-1 text-[6px] bg-amber-400 text-slate-950 px-0.5 rounded font-mono font-black inline-block align-middle">F</span>}
                            </span>
                            <span className="text-[8.5px] font-mono leading-none font-bold block opacity-95">
                              {changeLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PORTAL INTERACTIVE HOVER TOOLTIP */}
      <AnimatePresence>
        {hoveredStock && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 bg-[#02070e] border border-cyan-500/20 rounded-xl p-4 shadow-2xl z-50 w-72 backdrop-blur-md pointer-events-none font-sans"
          >
            <div className="flex justify-between items-start border-b border-slate-900 pb-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-xs font-black text-white">{hoveredStock.ticker}</span>
                  <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 rounded font-mono font-medium">
                    {hoveredStock.sector}
                  </span>
                  {hoveredStock.isSuspended ? (
                    <span className="text-[8px] bg-rose-955 text-rose-450 border border-rose-500/30 text-rose-400 px-1 rounded font-mono font-black animate-pulse">
                      SUSPEND
                    </span>
                  ) : hoveredStock.isFca ? (
                    <span className="text-[8px] bg-amber-955 text-amber-400 border border-amber-500/35 px-1 rounded font-mono font-black">
                      FCA
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] text-slate-400 block truncate mt-0.5 max-w-[160px]">
                  {hoveredStock.name}
                </span>
              </div>
              <span className={`text-xs font-mono font-black ${
                hoveredStock.changePercent > 0 
                  ? "text-emerald-400" 
                  : hoveredStock.changePercent < 0 
                  ? "text-rose-400" 
                  : "text-slate-400"
              }`}>
                {hoveredStock.changePercent > 0 ? "+" : ""}{hoveredStock.changePercent.toFixed(2)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] font-mono">
              <div>
                <span className="text-slate-500 block text-[7.5px] uppercase font-bold tracking-wider">HARGA SEKARANG</span>
                <span className="text-slate-200 font-bold">Rp {Math.round(hoveredStock.currentPrice).toLocaleString("id-ID")}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[7.5px] uppercase font-bold tracking-wider">PREV CLOSE</span>
                <span className="text-slate-400">Rp {Math.round(hoveredStock.previousPrice).toLocaleString("id-ID")}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[7.5px] uppercase font-bold tracking-wider">MARKET CAP</span>
                <span className="text-slate-200 font-bold">{formatCapValue(hoveredStock.marketCap)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[7.5px] uppercase font-bold tracking-wider">VOL TRANSAKSI</span>
                <span className="text-slate-400">{hoveredStock.volume ? (hoveredStock.volume / 1000000).toFixed(2) + "M lot" : "-"}</span>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-slate-900 flex justify-between items-center text-[7.5px] uppercase font-bold tracking-wider text-cyan-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> KLIK UTK GRAFIK INTERAKTIF
              </span>
              <span className="text-slate-600 font-mono font-medium lowercase">idx live cache</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
