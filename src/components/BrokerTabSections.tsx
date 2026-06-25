import React from "react";
import { createPortal } from "react-dom";
import { Activity, Calendar, Zap, Maximize2, X, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Stock } from "../types";
import BrokerFlowChart from "./BrokerFlowChart";

interface BrokerSummaryItem {
  code: string;
  name: string;
  lot: number;
  avgPrice: number;
  value: number;
}

interface BrokerSummaryData {
  buyers: BrokerSummaryItem[];
  sellers: BrokerSummaryItem[];
  totalBuyValue: number;
  totalSellValue: number;
  netBuyValue: number;
  signal: string;
}

interface CapitalFlowForce {
  label: string;
  value: number;
  history: number[];
}

interface CapitalFlowForces {
  foreign: CapitalFlowForce;
  retail: CapitalFlowForce;
  bigMoney: CapitalFlowForce;
  corporate: CapitalFlowForce;
}

export function BrokerFlowAndCumulativeNet({
  activeStock,
  hoveredBrokerDayIdx,
  setHoveredBrokerDayIdx
}: {
  activeStock: Stock;
  hoveredBrokerDayIdx: number | null;
  setHoveredBrokerDayIdx: (idx: number | null) => void;
}) {
  const [isFullscreenCalendar, setIsFullscreenCalendar] = React.useState(false);
  const [calendarSearchTerm, setCalendarSearchTerm] = React.useState("");
  const [calendarModalFilter, setCalendarModalFilter] = React.useState<"all" | "acc" | "dist">("all");

  const charSum = activeStock.ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const topBrokers = [
    { code: "BK", color: "#38bdf8", name: "J.P. Morgan" },
    { code: "AK", color: "#c084fc", name: "UBS Sekuritas" },
    { code: "YP", color: "#facc15", name: "Mirae Asset" },
    { code: "OD", color: "#22c55e", name: "BRI Danareksa" }
  ];

  // Cumulative net path lines for 10 sessions
  const brokerLines = topBrokers.map((brk, bIdx) => {
    const points = [];
    let cumulative = 0;
    for (let dIdx = 0; dIdx < 10; dIdx++) {
      const pSin = Math.sin(charSum + bIdx * 23 + dIdx * 41);
      const drift = brk.code === "BK" ? 3.5 : brk.code === "AK" ? 1.9 : brk.code === "YP" ? -0.8 : -1.6;
      const dailyValue = pSin * 1.5 + drift; // Billions
      cumulative += dailyValue;
      points.push({ day: dIdx + 1, value: cumulative });
    }
    return { ...brk, points };
  });

  const allCumulativeVals = brokerLines.flatMap(line => line.points.map(p => p.value));
  const minCum = Math.min(...allCumulativeVals, -5.0) * 1.05;
  const maxCum = Math.max(...allCumulativeVals, 5.0) * 1.05;
  const cumRange = maxCum - minCum || 1;

  // Horizontal aggregate details
  const totalNetBuy = 55 + (charSum % 30);
  const totalNetSell = 35 + (charSum % 22);
  const totalAggVal = totalNetBuy + totalNetSell;
  const buyAggPct = Math.round((totalNetBuy / totalAggVal) * 100);
  const sellAggPct = 100 - buyAggPct;
  const isDominantAccum = totalNetBuy > totalNetSell;
  const dominantLabel = isDominantAccum ? "DOMINAN AKUMULASI" : "DOMINAN DISTRIBUSI";

  // Calendar Flow (20 trading days)
  const calendarGridDays = [];
  for (let i = 1; i <= 20; i++) {
    const daySeed = Math.cos(charSum * 5 + i * 14) * 4.2;
    const flowVal = Math.round((daySeed + (activeStock.changePercent > 0 ? 0.7 : -0.7)) * 10) / 10;
    let type: "STRONG_ACC" | "ACC" | "STRONG_DIST" | "DIST" | "NEUTRAL" = "NEUTRAL";
    if (flowVal > 1.8) type = "STRONG_ACC";
    else if (flowVal > 0.3) type = "ACC";
    else if (flowVal < -1.8) type = "STRONG_DIST";
    else if (flowVal < -0.3) type = "DIST";
    calendarGridDays.push({ dayNum: i, netFlow: flowVal, type });
  }

  // Comprehensive calendar grid filtered for the fullscreen modal table
  const filteredCalendarDays = React.useMemo(() => {
    return calendarGridDays.filter(day => {
      const matchesSearch = calendarSearchTerm === "" || 
        `tgl ${day.dayNum}`.includes(calendarSearchTerm.toLowerCase()) ||
        `${day.dayNum}`.includes(calendarSearchTerm.toLowerCase()) ||
        day.netFlow.toFixed(1).includes(calendarSearchTerm.toLowerCase());
      
      const matchesFilter = calendarModalFilter === "all" ||
        (calendarModalFilter === "acc" && day.netFlow >= 0) ||
        (calendarModalFilter === "dist" && day.netFlow < 0);
        
      return matchesSearch && matchesFilter;
    });
  }, [calendarGridDays, calendarSearchTerm, calendarModalFilter]);

  const activeHoverDayIdx = hoveredBrokerDayIdx !== null ? hoveredBrokerDayIdx : 9;

  return (
    <div className="bg-[#020b12]/90 border-y sm:border border-slate-900 border-x-0 sm:border-x p-3 max-sm:px-2.5 sm:p-5 rounded-none sm:rounded-2xl space-y-5 shadow-2xl mt-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyan-950/40 pb-3 gap-3">
        <div>
          <h4 className="text-sm font-black text-white hover:text-cyan-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
            Broker Flow &amp; Cumulative Net
          </h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal">
            Visualisasi analisis garis kumulatif, heatmap transaksi, dan rincian bandarmology emiten <strong className="text-cyan-300 font-mono font-bold">{activeStock.ticker}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-[9px] text-cyan-400 font-black font-mono tracking-widest uppercase">System Trading Feed</span>
        </div>
      </div>

      {/* Bento Grid: Left (Cumulative line chart + summary) & Right (Net Bar indicators + Calendar Heatmap Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CUMULATIVE LINE CHART (lg:col-span-7) */}
        <div className="lg:col-span-7">
          <BrokerFlowChart activeStock={activeStock} />
        </div>

        {/* RIGHT COLUMN (lg:col-span-12 or md) containing comparator Net Bar & Heatmap Grid */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Comparative horizontal Net Bar indicators & auto conclusion badges */}
          <div className="bg-[#01060a]/95 border border-slate-900 rounded-xl p-4 space-y-4 select-none relative overflow-hidden">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400">
              <span>Agregat Bandar Terkini</span>
              <span className={`px-2 py-0.5 rounded text-[9.5px] font-black border uppercase tracking-widest ${
                isDominantAccum 
                  ? "bg-emerald-950/40 text-[#22c55e] border-emerald-500/20 animate-pulse" 
                  : "bg-rose-950/40 text-rose-450 border-rose-500/25 animate-pulse"
              }`}>
                {dominantLabel}
              </span>
            </div>

            {/* Horizontal Net comparatives */}
            <div className="space-y-2 font-mono text-[10px]">
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-[#0d222f]">
                <div className="h-full bg-emerald-400 text-[#020617] font-black text-[9px] flex items-center justify-center transition-all duration-700" style={{ width: `${buyAggPct}%` }}>
                  {buyAggPct}% ACC
                </div>
                <div className="h-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center transition-all duration-700" style={{ width: `${sellAggPct}%` }}>
                  {sellAggPct}% DIST
                </div>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px] font-extrabold mt-1">
                <span className="text-emerald-400">Net Buy: Rp {totalNetBuy.toFixed(1)} B</span>
                <span className="text-rose-400">Net Sell: Rp {totalNetSell.toFixed(1)} B</span>
              </div>
            </div>
          </div>

          {/* COMPACT CALENDAR TABLE FOR QUICK SUMMARY AND FULLSCREEN TOGGLE */}
          <div className="bg-[#01060a]/95 border border-slate-900 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 pb-1">
              <span className="flex items-center gap-1.5 text-slate-350">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Kalender Aliran Dana (20 Hari Kerja)
              </span>
              <button 
                onClick={() => setIsFullscreenCalendar(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-900/50 hover:border-cyan-500 rounded-lg text-[10px] text-cyan-400 hover:text-white transition-all cursor-pointer font-black uppercase tracking-wider"
              >
                <Maximize2 className="w-3 h-3" /> Full Screen
              </button>
            </div>

            {/* Compact Table */}
            <div className="overflow-hidden border border-slate-900/80 rounded-xl bg-slate-950/20">
              <div className="max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead className="sticky top-0 bg-[#070c14] border-b border-slate-900 text-slate-500 font-bold z-10">
                    <tr>
                      <th className="py-2 px-3 text-center w-12">Hari</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 text-center w-16">Sparks</th>
                      <th className="py-2 px-3 text-right">Net Flow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/55">
                    {calendarGridDays.map((calDay) => {
                      const isAcc = calDay.netFlow >= 0;
                      const typeLabel = calDay.type.replace("_", " ");
                      
                      // Generate matching sparkline curve
                      const seedY1 = Math.round(15 - (calDay.netFlow * 1.5 + 4));
                      const seedY2 = Math.round(12 - (calDay.netFlow * (-0.8) + 2));
                      const seedY3 = Math.round(16 - (calDay.netFlow * 2.2 + 3));
                      const sparklinePath = `M 2,${seedY1 > 18 ? 16 : (seedY1 < 2 ? 3 : seedY1)} C 15,${seedY2 > 18 ? 15 : (seedY2 < 2 ? 4 : seedY2)} 30,${seedY2 > 18 ? 16 : (seedY2 < 2 ? 3 : seedY2)} 48,${seedY3 > 18 ? 17 : (seedY3 < 2 ? 2 : seedY3)}`;
                      
                      return (
                        <tr 
                          key={calDay.dayNum}
                          onClick={() => setIsFullscreenCalendar(true)}
                          className="hover:bg-slate-900/35 transition duration-150 cursor-pointer group"
                        >
                          {/* Day Column */}
                          <td className="py-2 px-3 font-sans font-bold text-slate-400 text-center">
                            Tgl {calDay.dayNum}
                          </td>
                          
                          {/* Type / Acc Status */}
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                              isAcc ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isAcc ? "bg-emerald-400" : "bg-rose-500"}`} />
                              {typeLabel}
                            </span>
                          </td>
                          
                          {/* Sparkline Column */}
                          <td className="py-2 px-2 text-center">
                            <div className="inline-block w-12 h-4">
                              <svg className="w-full h-full opacity-65 group-hover:opacity-100 transition-opacity" viewBox="0 0 50 20" preserveAspectRatio="none">
                                <path
                                  d={sparklinePath}
                                  fill="none"
                                  stroke={isAcc ? "#10b981" : "#ef4444"}
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          </td>
                          
                          {/* Net Flow Value */}
                          <td className={`py-2 px-3 text-right font-black ${
                            isAcc ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {isAcc ? "+" : ""}{calDay.netFlow.toFixed(1)}B
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] font-mono text-slate-600 border-t border-[#0d222f] pt-1.5 select-none shrink-0">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Distribusi (Sparks Down)</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />Akumulasi (Sparks Up)</span>
            </div>
          </div>

          {/* FULLSCREEN CALENDAR PORTAL MODAL */}
          {isFullscreenCalendar && typeof document !== "undefined" && createPortal(
            <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center p-0 sm:p-4 md:p-6 backdrop-blur-sm animate-fadeIn">
              {/* Background overlay click to close on desktop */}
              <div className="absolute inset-0 hidden sm:block cursor-pointer" onClick={() => setIsFullscreenCalendar(false)} />
              
              <div 
                className="relative w-full h-full sm:h-[85vh] sm:max-w-4xl bg-[#090d14] border-0 sm:border border-slate-800/80 rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 select-none z-10 overflow-hidden animate-scaleIn"
              >
                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 shrink-0">
                  <div className="flex flex-col">
                    <h3 className="text-sm sm:text-base font-black text-white font-display tracking-wide uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Detail Aliran Dana Historis - {activeStock.ticker}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-sans">
                      Histori lengkap Capital Flow dan pergerakan tren harga (Price Sparks) selama 20 hari kerja terakhir.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsFullscreenCalendar(false)}
                    className="text-slate-400 hover:text-white text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 cursor-pointer transition-colors"
                    title="Tutup Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats Grid Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
                  <div className="bg-[#11161d] border border-slate-850 rounded-xl p-2.5 text-center">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Net Flow</div>
                    <div className={`text-xs sm:text-base font-mono font-black mt-0.5 ${
                      calendarGridDays.reduce((sum, d) => sum + d.netFlow, 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {calendarGridDays.reduce((sum, d) => sum + d.netFlow, 0) >= 0 ? "+" : ""}{calendarGridDays.reduce((sum, d) => sum + d.netFlow, 0).toFixed(1)}B
                    </div>
                  </div>
                  <div className="bg-[#11161d] border border-emerald-950/45 rounded-xl p-2.5 text-center">
                    <div className="text-[9px] font-black text-emerald-500/85 uppercase tracking-widest">Akumulasi (ACC)</div>
                    <div className="text-xs sm:text-base font-mono font-black text-emerald-400 mt-0.5">
                      {calendarGridDays.filter(d => d.netFlow >= 0).length} <span className="text-[10px] text-slate-500 font-sans font-normal">Hari</span>
                    </div>
                  </div>
                  <div className="bg-[#11161d] border border-rose-950/45 rounded-xl p-2.5 text-center">
                    <div className="text-[9px] font-black text-rose-500/85 uppercase tracking-widest">Distribusi (DIST)</div>
                    <div className="text-xs sm:text-base font-mono font-black text-rose-450 mt-0.5">
                      {calendarGridDays.filter(d => d.netFlow < 0).length} <span className="text-[10px] text-slate-500 font-sans font-normal">Hari</span>
                    </div>
                  </div>
                  <div className="bg-[#11161d] border border-slate-850 rounded-xl p-2.5 text-center">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rasio Akumulasi</div>
                    <div className="text-xs sm:text-base font-mono font-black text-cyan-400 mt-0.5">
                      {Math.round((calendarGridDays.filter(d => d.netFlow >= 0).length / 20) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={calendarSearchTerm}
                      onChange={(e) => setCalendarSearchTerm(e.target.value)}
                      placeholder="Cari hari atau nilai (cth: '10', '1.5')..."
                      className="w-full bg-[#11161d] border border-slate-850 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all"
                    />
                    {calendarSearchTerm && (
                      <button
                        onClick={() => setCalendarSearchTerm("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-white cursor-pointer bg-slate-800 hover:bg-slate-700 w-4 h-4 rounded-full flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Tabs Selector */}
                  <div className="flex bg-[#11161d] p-1 border border-slate-850 rounded-xl shrink-0">
                    <button
                      onClick={() => setCalendarModalFilter("all")}
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        calendarModalFilter === "all" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Semua ({calendarGridDays.length})
                    </button>
                    <button
                      onClick={() => setCalendarModalFilter("acc")}
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        calendarModalFilter === "acc" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Akumulasi ({calendarGridDays.filter(d => d.netFlow >= 0).length})
                    </button>
                    <button
                      onClick={() => setCalendarModalFilter("dist")}
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        calendarModalFilter === "dist" ? "bg-rose-950/50 text-rose-450 border border-rose-900/40 shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Distribusi ({calendarGridDays.filter(d => d.netFlow < 0).length})
                    </button>
                  </div>
                </div>

                {/* Table Content Section */}
                <div className="flex-1 overflow-auto border border-slate-850 rounded-xl bg-[#0b0f16]/60">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="sticky top-0 bg-[#0e141f] border-b border-slate-850 z-10 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <tr>
                        <th className="py-3 px-4 w-16 text-center">Hari</th>
                        <th className="py-3 px-3 w-40">Status Aliran Dana</th>
                        <th className="py-3 px-4 text-center">Tren Pergerakan (Price Sparks)</th>
                        <th className="py-3 px-3 w-44 text-right">Aliran Dana (Capital Flow)</th>
                        <th className="py-3 px-4 w-40 text-center">Kekuatan Signal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs text-slate-350 font-mono">
                      {filteredCalendarDays.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500 font-medium font-sans">
                            Tidak ada data historis yang cocok dengan pencarian/filter.
                          </td>
                        </tr>
                      ) : (
                        filteredCalendarDays.map((day) => {
                          const isAcc = day.netFlow >= 0;
                          const label = day.type.replace("_", " ");
                          
                          // Generate matching sparkline curve
                          const seedY1 = Math.round(15 - (day.netFlow * 1.5 + 4));
                          const seedY2 = Math.round(12 - (day.netFlow * (-0.8) + 2));
                          const seedY3 = Math.round(16 - (day.netFlow * 2.2 + 3));
                          const sparklinePath = `M 2,${seedY1 > 18 ? 16 : (seedY1 < 2 ? 3 : seedY1)} C 15,${seedY2 > 18 ? 15 : (seedY2 < 2 ? 4 : seedY2)} 30,${seedY2 > 18 ? 16 : (seedY2 < 2 ? 3 : seedY2)} 48,${seedY3 > 18 ? 17 : (seedY3 < 2 ? 2 : seedY3)}`;
                          
                          let powerBarBg = "bg-slate-800";
                          let powerBarColor = "bg-slate-600";
                          let powerPercent = 20;
                          if (day.type === "STRONG_ACC") {
                            powerBarBg = "bg-emerald-950/30";
                            powerBarColor = "bg-emerald-400 shadow-[0_0_8px_#34d399]";
                            powerPercent = 85;
                          } else if (day.type === "ACC") {
                            powerBarBg = "bg-emerald-950/20";
                            powerBarColor = "bg-emerald-500/60";
                            powerPercent = 50;
                          } else if (day.type === "STRONG_DIST") {
                            powerBarBg = "bg-rose-950/30";
                            powerBarColor = "bg-rose-500 shadow-[0_0_8px_#f43f5e]";
                            powerPercent = 85;
                          } else if (day.type === "DIST") {
                            powerBarBg = "bg-rose-950/20";
                            powerBarColor = "bg-rose-400/60";
                            powerPercent = 50;
                          }

                          return (
                            <tr 
                              key={day.dayNum}
                              className="hover:bg-[#121924]/40 transition duration-150 group"
                            >
                              {/* Day column */}
                              <td className="py-3.5 px-4 font-sans font-black text-center text-slate-400">
                                Tgl {day.dayNum}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  isAcc 
                                    ? "bg-emerald-950/40 border border-emerald-900/30 text-emerald-400" 
                                    : "bg-rose-950/40 border border-rose-900/30 text-rose-450"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isAcc ? "bg-emerald-400 animate-pulse" : "bg-rose-500 animate-pulse"}`} />
                                  {label}
                                </span>
                              </td>

                              {/* Sparkline Column */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="inline-block w-36 h-6">
                                  <svg className="w-full h-full opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path
                                      d={sparklinePath}
                                      fill="none"
                                      stroke={isAcc ? "#10b981" : "#ef4444"}
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </div>
                              </td>

                              {/* Net Flow Value */}
                              <td className={`py-3.5 px-3 text-right text-sm font-black font-mono tracking-tight ${
                                isAcc ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                {isAcc ? "+" : ""}{day.netFlow.toFixed(2)} Miliar
                              </td>

                              {/* Signal Strength Bar */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className={`w-16 h-1.5 rounded-full ${powerBarBg} overflow-hidden border border-[#1e293b]/10`}>
                                    <div className={`h-full ${powerBarColor} rounded-full`} style={{ width: `${powerPercent}%` }} />
                                  </div>
                                  <span className="text-[10px] font-sans font-bold text-slate-400 w-8 text-left">
                                    {powerPercent}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer status bar */}
                <div className="border-t border-slate-900 pt-3 flex flex-col sm:flex-row gap-2.5 items-center justify-between text-[10.5px] text-slate-500 shrink-0 font-medium font-sans">
                  <span>
                    Menampilkan <span className="font-mono font-black text-slate-350">{filteredCalendarDays.length}</span> dari <span className="font-mono font-black text-slate-350">{calendarGridDays.length}</span> hari bursa
                  </span>
                  <button
                    onClick={() => setIsFullscreenCalendar(false)}
                    className="w-full sm:w-auto px-5 py-2 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-white rounded-xl border border-emerald-900/50 hover:border-emerald-600 transition-all cursor-pointer font-black uppercase tracking-wider text-xs shadow-md"
                  >
                    Tutup Panel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        </div>

      </div>

      {/* DETAILED RINCIAN LIST COLUMN: Aligned perfectly (rata-kanan kiri yang rapi) */}
      <div className="bg-[#01060a]/95 border border-slate-900 rounded-xl p-4 space-y-2 select-none">
        <div className="flex justify-between items-center border-b border-[#0d222f] pb-2 text-xs font-mono font-bold text-slate-300">
          <span>Rincian Kolom Transaksi Broker Utama (Rata Kanan-Kiri Rapi)</span>
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">JATS Broker Logs</span>
        </div>

        <div className="space-y-1.5 font-mono text-[10.5px]">
          {[
            { tag: "RX", type: "ASING (F)", buyLot: 14500 + (charSum % 380), buyPrice: Math.round(activeStock.currentPrice * 1.002), sellLot: 5120 + (charSum % 210), sellPrice: Math.round(activeStock.currentPrice * 0.998), note: "MARKET LEAD", positive: true },
            { tag: "CC", type: "LOKAL (L)", buyLot: 11200 + (charSum % 550), buyPrice: Math.round(activeStock.currentPrice * 0.999), sellLot: 19100 + (charSum % 410), sellPrice: Math.round(activeStock.currentPrice * 1.001), note: "LIQUIDITY BUYER", positive: false },
            { tag: "BK", type: "ASING (F)", buyLot: 31200 + (charSum % 650), buyPrice: Math.round(activeStock.currentPrice * 0.998), sellLot: 4050 + (charSum % 120), sellPrice: Math.round(activeStock.currentPrice * 1.002), note: "TOP ACCUMULATOR", positive: true },
            { tag: "YP", type: "LOKAL (L)", buyLot: 15400 + (charSum % 420), buyPrice: Math.round(activeStock.currentPrice * 1.001), sellLot: 16100 + (charSum % 480), sellPrice: Math.round(activeStock.currentPrice * 1.001), note: "RETAIL PARTICIPANT", positive: false }
          ].map((item, idx) => {
            const netLot = item.buyLot - item.sellLot;
            const netVal = netLot * 100 * activeStock.currentPrice;
            const isUp = netVal >= 0;
            const maxLogVal = 10000000000; // 10 Billion max representational threshold
            const logBarPercent = Math.min(100, (Math.abs(netVal) / maxLogVal) * 100);

            return (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#0d222f]/30 py-2.5 hover:bg-slate-950/45 px-2 rounded-lg transition-all gap-4">
                <div className="flex items-center space-x-2 shrink-0 w-28">
                  <span className="font-extrabold text-white text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-cyan-950">{item.tag}</span>
                  <div className="flex flex-col text-left">
                    <span className={`text-[8px] font-bold tracking-wider px-1 py-0.5 rounded leading-none ${item.type.includes("ASING") ? "bg-purple-950/30 text-purple-400 border border-purple-500/10" : "bg-blue-950/20 text-blue-400 border border-blue-500/10"}`}>{item.type}</span>
                    <span className="text-[9px] text-[#475569] font-sans font-bold uppercase mt-0.5 leading-none">{item.note}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-right items-center flex-1">
                  <div className="text-slate-400 text-[10px] text-left sm:text-right">
                    <span className="block text-slate-500 text-[8.5px] uppercase font-bold">Volume Beli</span>
                    <strong>{item.buyLot.toLocaleString("id-ID")} Lot</strong>
                    <div className="text-[9px] text-slate-500 font-medium">Avg Rp{item.buyPrice.toLocaleString("id-ID")}</div>
                  </div>
                  
                  <div className="text-slate-400 text-[10px] text-left sm:text-right">
                    <span className="block text-slate-500 text-[8.5px] uppercase font-bold">Volume Jual</span>
                    <strong>{item.sellLot.toLocaleString("id-ID")} Lot</strong>
                    <div className="text-[9px] text-slate-500 font-medium">Avg Rp{item.sellPrice.toLocaleString("id-ID")}</div>
                  </div>

                  {/* Bilateral centerline two-way matching indicator bar */}
                  <div className="hidden md:flex items-center justify-center px-4">
                    <div className="w-24 h-1.5 bg-slate-900 rounded-full flex items-center relative overflow-hidden border border-cyan-950/10 p-0">
                      <div className="w-1/2 h-full flex justify-end border-r border-slate-800">
                        {!isUp && (
                          <div className="h-full bg-rose-500 rounded-l animate-fadeIn" style={{ width: `${logBarPercent}%` }} />
                        )}
                      </div>
                      <div className="w-1/2 h-full flex justify-start">
                        {isUp && (
                          <div className="h-full bg-emerald-500 rounded-r animate-fadeIn" style={{ width: `${logBarPercent}%` }} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-slate-500 text-[8.5px] uppercase font-bold">Net Value</span>
                    <div className={`text-[11px] font-black ${isUp ? "text-[#22c55e]" : "text-rose-450"}`}>
                      {isUp ? "+" : ""}Rp {Math.round(netVal).toLocaleString("id-ID")}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase font-black tracking-tight">{isUp ? "AKUMULASI" : "DISTRIBUSI"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DetectorKuatAliranDanaBandar({
  activeStock,
  capitalFlowForces,
  setIs4PilarModalOpen
}: {
  activeStock: Stock;
  capitalFlowForces: CapitalFlowForces;
  setIs4PilarModalOpen: (val: boolean) => void;
}) {
  return (
    <div className="bg-[#03101c]/90 border border-cyan-500/20 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-950/40 pb-2.5">
        <div className="flex items-center gap-1.5 font-sans">
          <div className="p-1 rounded bg-cyan-950/40 border border-cyan-900/40">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-cyan-400 font-mono uppercase tracking-wider">
              📡 DETEKTOR KEKUATAN ALIRAN DANA BANDAR
            </h4>
            <p className="text-[9.5px] text-slate-400">Analisis sebaran modal kerja institusi, ritel, asing, dan insider secara real-time</p>
          </div>
        </div>
        <button
          onClick={() => setIs4PilarModalOpen(true)}
          className="text-[9px] font-mono text-cyan-400 bg-cyan-950/55 border border-cyan-800/30 px-2.5 py-1 rounded hover:bg-cyan-900/50 transition-colors cursor-pointer text-center font-bold"
        >
          💡 Pelajari 4 Pilar Flow
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Foreign Flow */}
        <div className="bg-slate-950/70 border border-slate-900 rounded-lg p-3 space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start text-[10px] font-mono">
            <span className="text-slate-400 font-bold">🛸 Foreign (Asing)</span>
            <span className={`font-black uppercase text-[8px] px-1 py-0.5 rounded ${capitalFlowForces.foreign.value >= 0 ? "bg-emerald-950/40 text-emerald-400" : "bg-rose-950/40 text-rose-450"}`}>
              {capitalFlowForces.foreign.value >= 0 ? "ACCUM" : "DIST"}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-base font-black font-mono ${capitalFlowForces.foreign.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {capitalFlowForces.foreign.value >= 0 ? "+" : ""}{capitalFlowForces.foreign.value}%
            </span>
          </div>
          {/* Linear horizontal bar */}
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full ${capitalFlowForces.foreign.value >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} 
              style={{ width: `${Math.min(100, Math.abs(capitalFlowForces.foreign.value))}%` }} 
            />
          </div>
        </div>

        {/* Big Money Flow */}
        <div className="bg-slate-950/70 border border-slate-900 rounded-lg p-3 space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start text-[10px] font-mono">
            <span className="text-slate-400 font-bold">🏛️ Big Money (Inst)</span>
            <span className={`font-black uppercase text-[8px] px-1 py-0.5 rounded ${capitalFlowForces.bigMoney.value >= 0 ? "bg-emerald-950/40 text-emerald-400" : "bg-rose-950/40 text-rose-450"}`}>
              {capitalFlowForces.bigMoney.value >= 0 ? "ACCUM" : "DIST"}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-base font-black font-mono ${capitalFlowForces.bigMoney.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {capitalFlowForces.bigMoney.value >= 0 ? "+" : ""}{capitalFlowForces.bigMoney.value}%
            </span>
          </div>
          {/* Linear horizontal bar */}
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full ${capitalFlowForces.bigMoney.value >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} 
              style={{ width: `${Math.min(100, Math.abs(capitalFlowForces.bigMoney.value))}%` }} 
            />
          </div>
        </div>

        {/* Corporate Flow */}
        <div className="bg-slate-950/70 border border-slate-900 rounded-lg p-3 space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start text-[10px] font-mono">
            <span className="text-slate-400 font-bold">💼 Insider (Corp)</span>
            <span className={`font-black uppercase text-[8px] px-1 py-0.5 rounded ${capitalFlowForces.corporate.value >= 0 ? "bg-emerald-950/40 text-emerald-400" : "bg-rose-950/40 text-rose-450"}`}>
              {capitalFlowForces.corporate.value >= 0 ? "ACCUM" : "DIST"}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-base font-black font-mono ${capitalFlowForces.corporate.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {capitalFlowForces.corporate.value >= 0 ? "+" : ""}{capitalFlowForces.corporate.value}%
            </span>
          </div>
          {/* Linear horizontal bar */}
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full ${capitalFlowForces.corporate.value >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} 
              style={{ width: `${Math.min(100, Math.abs(capitalFlowForces.corporate.value))}%` }} 
            />
          </div>
        </div>

        {/* Retail Flow */}
        <div className="bg-slate-950/70 border border-slate-900 rounded-lg p-3 space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start text-[10px] font-mono">
            <span className="text-slate-400 font-bold">🎈 Retail (Massa)</span>
            <span className={`font-black uppercase text-[8px] px-1 py-0.5 rounded ${capitalFlowForces.retail.value >= 0 ? "bg-rose-950/40 text-rose-400" : "bg-emerald-950/40 text-emerald-400"}`}>
              {capitalFlowForces.retail.value >= 0 ? "HIGH INF" : "SILENT"}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-base font-black font-mono ${capitalFlowForces.retail.value >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {capitalFlowForces.retail.value >= 0 ? "+" : ""}{capitalFlowForces.retail.value}%
            </span>
          </div>
          {/* Linear horizontal bar */}
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full ${capitalFlowForces.retail.value >= 0 ? "bg-rose-500" : "bg-emerald-500"}`} 
              style={{ width: `${Math.min(100, Math.abs(capitalFlowForces.retail.value))}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Intelligent Verdict Advice */}
      <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-[10px] leading-relaxed text-slate-300 font-sans flex items-start gap-2">
        <span className="p-1 px-1.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-[8px] font-mono uppercase font-black shrink-0 mt-0.5 select-none hover:scale-105 transition-transform">VERDICT</span>
        <span>
          {(() => {
            const isF = capitalFlowForces.foreign.value > 15;
            const isB = capitalFlowForces.bigMoney.value > 20;
            const isR = capitalFlowForces.retail.value > 15;
            if (isF && isB && !isR) {
              return `Aktivitas emiten ${activeStock.ticker} didominasi penuh oleh Foreign Institution dan Big Money dalam tren mark-up harga yang kokoh (Strong Accumulation Stage). Partisipasi retail terpantau rendah, meminimalkan tekanan profit taking harian. Rekomendasi: BUY/HOLD — Follow the Giants.`;
            } else if (isR && !isF && !isB) {
              return `Tekanan jual institusi ditampung penuh oleh massa investor retail (Distribution Stage). Perputaran dana bersifat fluktuatif cepat tanpa support harga berkelanjutan. Rekomendasi: SPEKULATIF BUY / SCALPING — Disiplin stop-loss ketat di batas level support harian.`;
            } else if (!isF && isB) {
              return `Meskipun asing netral, investor institusi domestik lokal bergerak senyap menyerap emiten ini (Silent Accumulation). Likuiditas order book dipertahankan stabil dengan holding cost yang tinggi. Rekomendasi: ACCUMULATIVE BUY — Buy on weakness.`;
            } else {
              return `Keseimbangan volume akumulasi dan distribusi tergolong seimbang (Neutral Stage / Sideways). Pasar cenderung menunggu pemicu sentimen bursa global atau laporan kinerja triwulan emiten. Rekomendasi: WAIT & SEE — Masuk saat harga breakout resistance utama harian.`;
            }
          })()}
        </span>
      </div>
    </div>
  );
}

export function TopNetBuySellTables({
  brokerSummaryData,
  activeStock,
  brokerFilter,
  setBrokerFilter,
  onSelectBroker,
  showBrokerUpdateFlash,
  isBrokerUpdating
}: {
  brokerSummaryData: BrokerSummaryData;
  activeStock: Stock;
  brokerFilter: string;
  setBrokerFilter: (val: string) => void;
  onSelectBroker?: (code: string) => void;
  showBrokerUpdateFlash: boolean;
  isBrokerUpdating: boolean;
}) {
  const [expandedBrokers, setExpandedBrokers] = React.useState<Record<string, boolean>>({});
  const toggleExpand = (code: string) => {
    setExpandedBrokers(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const buyersList = [...brokerSummaryData.buyers];
  const filteredBuyers = (() => {
    if (brokerFilter === "asing") {
      return buyersList.filter(b => ["BK", "AK"].includes(b.code));
    } else if (brokerFilter === "retail") {
      return [
        { code: "YP", name: "Mirae Asset Sekuritas", lot: 125430, avgPrice: activeStock.currentPrice * 1.01, value: 125430 * activeStock.currentPrice },
        { code: "PD", name: "Indo Premier Sekuritas", lot: 84320, avgPrice: activeStock.currentPrice * 0.99, value: 84320 * activeStock.currentPrice },
        { code: "NI", name: "BNI Sekuritas", lot: 71200, avgPrice: activeStock.currentPrice * 1.02, value: 71200 * activeStock.currentPrice }
      ];
    } else if (brokerFilter === "lokal") {
      return [
        { code: "OD", name: "BRI Danareksa Sekuritas", lot: 98550, avgPrice: activeStock.currentPrice * 0.98, value: 98550 * activeStock.currentPrice },
        { code: "BB", name: "BCA Sekuritas", lot: 62450, avgPrice: activeStock.currentPrice, value: 62450 * activeStock.currentPrice }
      ];
    }
    return buyersList;
  })();

  const sellersList = [...brokerSummaryData.sellers];
  const filteredSellers = (() => {
    if (brokerFilter === "asing") {
      return sellersList.filter(s => ["YP"].includes(s.code)); // foreign sell simulation
    } else if (brokerFilter === "retail") {
      return [
        { code: "CC", name: "Mandiri Sekuritas (Retail)", lot: 191200, avgPrice: activeStock.currentPrice * 1.03, value: 191200 * activeStock.currentPrice },
        { code: "YP", name: "Mirae Asset Sekuritas", lot: 111300, avgPrice: activeStock.currentPrice * 0.99, value: 111300 * activeStock.currentPrice }
      ];
    } else if (brokerFilter === "lokal") {
      return [
        { code: "MG", name: "Semesta Indovest", lot: 45000, avgPrice: activeStock.currentPrice * 1.01, value: 45000 * activeStock.currentPrice },
        { code: "GR", name: "CGS-CIMB Sekuritas", lot: 37200, avgPrice: activeStock.currentPrice, value: 37200 * activeStock.currentPrice }
      ];
    }
    return sellersList;
  })();

  const maxBuyerVal = Math.max(...filteredBuyers.map(x => x.value)) || 1;
  const maxSellerVal = Math.max(...filteredSellers.map(x => x.value)) || 1;

  return (
    <div className="space-y-4">
      {/* Quick Filter Chips for Broker Stalker */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider shrink-0 mr-1">🔍 Filter Bandar:</span>
        {([
          { id: "all", label: "📋 Semua Broker", desc: "Aktris Pasar" },
          { id: "asing", label: "🛸 Top Asing", desc: "Foreign Flow" },
          { id: "retail", label: "🎈 Aktivitas Retail", desc: "Kumpulan Ritel" },
          { id: "lokal", label: "🏦 Broker Lokal", desc: "Inst. Domestik" }
        ] as const).map((chip) => (
          <button
            key={chip.id}
            onClick={() => setBrokerFilter(chip.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
              brokerFilter === chip.id
                ? "bg-[#0b293c] text-[#22c55e] border-cyan-500/35 shadow shadow-cyan-950"
                : "bg-slate-950/60 text-slate-400 border-slate-900 hover:text-white"
            }`}
          >
            <span>{chip.label}</span>
            <span className="text-[8px] font-mono text-slate-500">[{chip.desc}]</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
        {/* BUYERS TABLE */}
        <div className="bg-slate-950/35 border border-cyan-950/20 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-cyan-950/30 pb-2">
            <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
              <span>📥</span> TOP NET BUYER ({brokerFilter === "all" ? "AKUMULATOR" : brokerFilter.toUpperCase()})
            </span>
            <span className="text-[9.5px] text-slate-500 font-mono font-bold">In-line bar volume</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[9.5px] text-slate-400 uppercase tracking-wider font-mono border-b border-cyan-950/20">
                  <th className="py-1.5 font-bold">Kode</th>
                  <th className="py-1.5 font-bold">Nama Broker</th>
                  <th className="py-1.5 text-right font-bold">Lot</th>
                  <th className="py-1.5 text-right font-bold">Avg Price</th>
                  <th className="py-1.5 text-right font-bold">Total &amp; Volume Bar</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuyers.map((b) => {
                  const barPercent = Math.min(100, Math.max(12, (b.value / maxBuyerVal) * 100));
                  return (
                    <tr 
                      key={b.code} 
                      onClick={() => onSelectBroker?.(b.code)}
                      title={`Klik untuk intip portfolio broker ${b.code} di Broker Stalker`}
                      className="border-b border-cyan-950/10 hover:bg-[#042031]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-mono font-black text-emerald-400">
                        <span className="hover:underline">{b.code}</span>
                      </td>
                      <td className="py-2.5 text-slate-300 font-sans">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className={`block ${expandedBrokers[b.code] ? "" : "max-w-[80px] md:max-w-[120px] truncate"}`} 
                            title={b.name}
                          >
                            {b.name}
                          </span>
                          {b.name.length > 8 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(b.code);
                              }}
                              className="text-[9px] text-cyan-400 hover:text-white px-1 bg-cyan-950/40 rounded border border-cyan-800/30 cursor-pointer shrink-0 ml-1 font-bold"
                              title={expandedBrokers[b.code] ? "Sembunyikan nama" : "Tampilkan nama lengkap (+)"}
                            >
                              {expandedBrokers[b.code] ? "-" : "+"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-100">{Math.round(b.lot).toLocaleString("id-ID")}</td>
                      <td className="py-2.5 text-right font-mono text-slate-100">Rp {Math.round(b.avgPrice).toLocaleString("id-ID")}</td>
                      <td className="py-2.5 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-400 font-bold">{(b.value / 1000000).toFixed(1)} M</span>
                          <div className="w-20 h-1 bg-slate-900 rounded-full overflow-hidden mt-1 p-0">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${barPercent}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SELLERS TABLE */}
        <div className="bg-slate-950/35 border border-cyan-950/20 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-cyan-950/30 pb-2">
            <span className="text-[11px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1">
              <span>📤</span> TOP NET SELLER ({brokerFilter === "all" ? "DISTRIBUTOR" : brokerFilter.toUpperCase()})
            </span>
            <span className="text-[9.5px] text-slate-500 font-mono font-bold">In-line bar volume</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[9.5px] text-slate-400 uppercase tracking-wider font-mono border-b border-cyan-950/20">
                  <th className="py-1.5 font-bold">Kode</th>
                  <th className="py-1.5 font-bold">Nama Broker</th>
                  <th className="py-1.5 text-right font-bold">Lot</th>
                  <th className="py-1.5 text-right font-bold">Avg Price</th>
                  <th className="py-1.5 text-right font-bold">Total &amp; Volume Bar</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map((s) => {
                  const barPercent = Math.min(100, Math.max(12, (s.value / maxSellerVal) * 100));
                  return (
                    <tr 
                      key={s.code} 
                      onClick={() => onSelectBroker?.(s.code)}
                      title={`Klik untuk intip portfolio broker ${s.code} di Broker Stalker`}
                      className="border-b border-cyan-950/10 hover:bg-[#310404]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-mono font-black text-rose-400">
                        <span className="hover:underline">{s.code}</span>
                      </td>
                      <td className="py-2.5 text-slate-300 font-sans">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className={`block ${expandedBrokers[s.code] ? "" : "max-w-[80px] md:max-w-[120px] truncate"}`} 
                            title={s.name}
                          >
                            {s.name}
                          </span>
                          {s.name.length > 8 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(s.code);
                              }}
                              className="text-[9px] text-cyan-400 hover:text-white px-1 bg-cyan-950/40 rounded border border-cyan-800/30 cursor-pointer shrink-0 ml-1 font-bold"
                              title={expandedBrokers[s.code] ? "Sembunyikan nama" : "Tampilkan nama lengkap (+)"}
                            >
                              {expandedBrokers[s.code] ? "-" : "+"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-100">{Math.round(s.lot).toLocaleString("id-ID")}</td>
                      <td className="py-2.5 text-right font-mono text-slate-100">Rp {Math.round(s.avgPrice).toLocaleString("id-ID")}</td>
                      <td className="py-2.5 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="text-rose-400 font-bold">{(s.value / 1000000).toFixed(1)} M</span>
                          <div className="w-20 h-1 bg-slate-900 rounded-full overflow-hidden mt-1 p-0">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${barPercent}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
