import React, { useState, useEffect } from "react";
import { Star, FileText, ChevronLeft, ChevronRight, Info, Calendar, ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3, Users, Zap } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface TransactionDashboardProps {
  activeStock: {
    ticker: string;
    name: string;
    price?: number;
    currentPrice?: number;
    change?: number;
    pctChange?: number;
    changePercent?: number;
  };
  onToggleWatchlist?: (ticker: string) => void;
  watchlist?: string[];
}

export const TransactionDashboard: React.FC<TransactionDashboardProps> = ({
  activeStock,
  onToggleWatchlist,
  watchlist = []
}) => {
  // 1. Unified source of truth date state setting
  const [selectedDate, setSelectedDate] = useState("2026-06-12");
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{ time: string; value: number } | null>(null);
  const [data, setData] = useState<{
    chart: { points: Array<{ time: string; value: number }> } | null;
    broker: {
      buyers: Array<{ code: string; name: string; lot: number; avgPrice: number; value: number }>;
      sellers: Array<{ code: string; name: string; lot: number; avgPrice: number; value: number }>;
      totalBuyValue: number;
      totalSellValue: number;
      netBuyValue: number;
      signal: string;
    } | null;
    stats: {
      totalValue: number;
      totalVolume: number;
      participation: { domestic: number; foreign: number };
      indicators: { bigTxCount: number; avgValuePerTx: number };
    } | null;
  }>({
    chart: null,
    broker: null,
    stats: null
  });

  // 2. Chained Fetching of all three endpoints concurrently using Promise.all
  const updateDashboard = async (date: string) => {
    setLoading(true);
    const ticker = activeStock.ticker || "BBCA";
    try {
      const [chartRes, brokerRes, statsRes] = await Promise.all([
        fetch(`/api/chart-data?date=${date}&ticker=${ticker}`).then(res => {
          if (!res.ok) throw new Error("Gagal memuat grafik");
          return res.json();
        }),
        fetch(`/api/broker-summary?date=${date}&ticker=${ticker}`).then(res => {
          if (!res.ok) throw new Error("Gagal memuat ringkasan broker");
          return res.json();
        }),
        fetch(`/api/transaction-stats?date=${date}&ticker=${ticker}`).then(res => {
          if (!res.ok) throw new Error("Gagal memuat statistik transaksi");
          return res.json();
        })
      ]);

      setData({
        chart: chartRes,
        broker: brokerRes,
        stats: statsRes
      });
    } catch (error) {
      console.error("Gagal menyinkronkan data transaksi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync state whenever selectedDate or active stock changes
  useEffect(() => {
    updateDashboard(selectedDate);
  }, [selectedDate, activeStock.ticker]);

  // Indonesian Date Formatter function to automatically display the active date
  const getFullIndonesianDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      
      const d = new Date(year, month, day);
      if (isNaN(d.getTime())) return dateStr;
      
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Switch to previous day (Skip weekends)
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    do {
      d.setDate(d.getDate() - 1);
    } while (d.getDay() === 0 || d.getDay() === 6); // Skip Sun, Sat

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Switch to next day (Skip weekends & block future dates unless weekend)
  const handleNextDay = () => {
    const d = new Date(selectedDate);
    const today = new Date("2026-06-12"); // simulated live date boundary

    do {
      d.setDate(d.getDate() + 1);
    } while (d.getDay() === 0 || d.getDay() === 6);

    if (d <= today) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const isPositive = (data.broker?.netBuyValue ?? 0) >= 0;
  const isWatchlisted = watchlist.includes(activeStock.ticker);

  return (
    <div id="transaction-dashboard-unified" className="space-y-6 pt-2 pb-8 animate-fadeIn">
      
      {/* 1. TOP TITLE HEADER CONTROL BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-400 font-mono tracking-widest uppercase">
              Unified Transaction Desk
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Analisis Aliran Transaksi: <span className="font-mono text-cyan-400">{activeStock.ticker}</span>
          </h2>
        </div>

        {/* Unified Date Selection Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 gap-1 select-none">
            <button
              onClick={handlePrevDay}
              className="p-1 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 active:scale-95 transition-all text-sm cursor-pointer"
              title="Hari Bursa Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-300 px-3 min-w-[100px] text-center">
              {selectedDate}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 active:scale-95 transition-all text-sm cursor-pointer"
              title="Hari Bursa Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              max="2026-06-12"
              className="bg-slate-950 text-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-800 p-2.5 px-3 select-none cursor-pointer hover:border-cyan-500/45 focus:border-cyan-500/60 outline-none transition-all"
            />
          </div>

          <button
            onClick={() => onToggleWatchlist?.(activeStock.ticker)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isWatchlisted
                ? "bg-slate-900 text-emerald-400 border-emerald-500/20 shadow-md shadow-emerald-500/5 font-mono"
                : "bg-slate-950 text-slate-400 border-slate-850 hover:text-white"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isWatchlisted ? "fill-emerald-400 text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">Watchlist</span>
          </button>
        </div>
      </div>

      {/* 2. STATS & INDICATORS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric A: Institutional Flow Detector Status */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900/80 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">ALIRAN INSTITUSI</span>
            <div className="text-sm font-black text-cyan-400 uppercase font-mono tracking-tight mt-1.5 flex items-center gap-1">
              🚀 {data.broker?.signal || "WAITING DATA"}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-900/60 pt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>Net Flow:</span>
            <span className={`font-extrabold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {data.broker ? `${isPositive ? "+" : ""}${(data.broker.netBuyValue / 1000000000).toFixed(2)} Miliar` : "Calculating..."}
            </span>
          </div>
        </div>

        {/* Metric B: Total Volume */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900/80 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">TOTAL VOLUME</span>
            <div className="text-base font-extrabold text-slate-100 font-mono mt-1">
              {data.stats ? `${data.stats.totalVolume.toLocaleString("id-ID")} Lot` : "Waiting..."}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-900/60 pt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>Transaksi Jumbo:</span>
            <span className="text-cyan-400 font-bold">{data.stats?.indicators.bigTxCount || 0} Order</span>
          </div>
        </div>

        {/* Metric C: Total Transaction Value */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900/80 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">TOTAL NILAI</span>
            <div className="text-base font-extrabold text-slate-100 font-mono mt-1">
              {data.stats ? `Rp ${(data.stats.totalValue / 1000000000).toFixed(2)} Miliar` : "Waiting..."}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-900/60 pt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>Rata-Rata / Tx:</span>
            <span className="text-amber-500 font-bold">
              {data.stats ? `Rp ${(data.stats.indicators.avgValuePerTx / 1000000).toFixed(1)} Juta` : "..."}
            </span>
          </div>
        </div>

        {/* Metric D: Domestic vs Foreign Participation */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900/80 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">PARTISIPASI PASAR</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-bold text-emerald-400">D: {data.stats?.participation.domestic}%</span>
              <span className="text-[11px] text-slate-600">|</span>
              <span className="text-[11px] font-bold text-cyan-400">F: {data.stats?.participation.foreign}%</span>
            </div>
          </div>
          {/* Simple Participation Bar indicator */}
          <div className="mt-4 w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${data.stats?.participation.domestic ?? 50}%` }} 
              className="bg-emerald-500 transition-all duration-500"
            />
            <div 
              style={{ width: `${data.stats?.participation.foreign ?? 50}%` }} 
              className="bg-cyan-500 transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKPLACE LAYOUT GRID (Chart & Broker Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* GRAPH PANEL - LEFT 7/12 */}
        <div className="lg:col-span-7 bg-[#050b14] rounded-2xl p-4 md:p-5 border border-cyan-500/5 flex flex-col justify-between relative overflow-hidden min-h-[360px] shadow-2xl">
          
          {/* Visual Loading Overlay over the Chart area */}
          {loading && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-3 animate-fadeIn">
              <span className="w-8 h-8 rounded-full border-2 border-t-cyan-400 border-r-transparent border-slate-800 animate-spin" />
              <div className="text-center">
                <p className="text-xs font-mono font-bold text-slate-300">Menyinkronkan Grafik</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedDate} • {activeStock.ticker}</p>
              </div>
            </div>
          )}

          <div className="space-y-1 select-none">
            <h4 className="text-xs md:text-sm font-black text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Aliran Akumulasi Dana Institusi (Waktu Riil)
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans pb-1.5 border-b border-slate-900/60">
              Grafik visual akumulasi bersih institusi harian bursa Efek Indonesia (IDX) pada tanggal aktif.
            </p>
          </div>

          {/* Graphical Area using Recharts */}
          <div className="h-[235px] w-full mt-4 select-none cursor-pointer">
            {data.chart && data.chart.points && data.chart.points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={data.chart.points} 
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  onClick={(clickData: any) => {
                    if (clickData && clickData.activePayload && clickData.activePayload.length > 0) {
                      const payload = clickData.activePayload[0].payload;
                      setSelectedPoint({ time: payload.time, value: payload.value });
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="colorValueFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.2)" 
                    tick={{ fontSize: 9.5, fill: "rgba(255,255,255,0.4)", fontFamily: "monospace" }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    tick={{ fontSize: 9.5, fill: "rgba(255,255,255,0.4)", fontFamily: "monospace" }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val >= 0 ? "+" : ""}${val}M`}
                  />
                  <Tooltip 
                    contentStyle={{ background: "#060c18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
                    labelStyle={{ color: "#22d3ee", fontFamily: "monospace", fontSize: "10px", fontWeight: "bold" }}
                    itemStyle={{ color: "#fff", fontFamily: "monospace", fontSize: "11px" }}
                    formatter={(value: any) => [`${value >= 0 ? "+" : ""}${value} Juta Rupiah (Net)`, "Institutional Flow"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={isPositive ? "#10b981" : "#ef4444"} 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorValueFlow)"
                    dot={{ r: 3, strokeWidth: 1.5, fill: "#0c1424" }}
                    activeDot={{ r: 6, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center font-mono text-xs text-slate-500">
                ⏳ Menunggu Data Grafik Aliran Institusi
              </div>
            )}
          </div>

          {/* Interactive Clicked Point Indicator */}
          {selectedPoint && (
            <div className="mt-3 bg-[#021321] border border-[#22d3ee]/20 p-2.5 rounded-xl flex items-center justify-between animate-fadeIn text-[11px] font-mono leading-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-slate-400 font-bold uppercase text-[9.5px]">Titik Terpilih:</span>
                <span className="text-white font-black bg-slate-950 px-2 py-0.5 rounded border border-cyan-950">{selectedPoint.time}</span>
                <span className="text-slate-400 text-[9.5px] uppercase font-bold">Net Flow:</span>
                <span className={`font-black ${selectedPoint.value >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                  {selectedPoint.value >= 0 ? '+' : ''}{selectedPoint.value}M
                </span>
              </div>
              <button 
                onClick={() => setSelectedPoint(null)}
                className="text-[9px] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-705 hover:border-slate-600 px-2 py-1 rounded font-black transition uppercase cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          {/* Explanation note */}
          <div className="mt-3.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60 flex items-start gap-2 select-none">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span className="text-[10px] text-slate-400 leading-normal font-sans">
              Analisis ini memvisualisasikan data aliran modal instan. Garis yang cenderung naik menunjukkan aktivitas **Akumulasi Berkelanjutan** oleh institusi besar, sementara tren menurun murni menandakan **Distribusi Massal**.
            </span>
          </div>

        </div>

        {/* BROKER SUMMARY PANEL - RIGHT 5/12 */}
        <div className="lg:col-span-5 bg-[#030914] rounded-2xl p-4 md:p-5 border border-emerald-500/5 flex flex-col justify-between relative overflow-hidden min-h-[360px] shadow-2xl">
          
          {/* Visual Loading Overlay over the Broker Summary area */}
          {loading && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-3 animate-fadeIn">
              <span className="w-8 h-8 rounded-full border-2 border-t-emerald-400 border-r-transparent border-slate-800 animate-spin" />
              <div className="text-center">
                <p className="text-xs font-mono font-bold text-slate-300">Menyinkronkan Komposisi Broker</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedDate} • {activeStock.ticker}</p>
              </div>
            </div>
          )}

          <div>
            {/* Header with Title and Automatically Synced Date */}
            <div className="flex flex-col select-none border-b border-[#142232] pb-3 mb-3.5 gap-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs md:text-sm font-black text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Broker Summary (Top 6)
                </h4>
                <span className="text-[10px] font-mono font-black text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/10">
                  {activeStock.ticker}
                </span>
              </div>
              
              {/* Heading Title Automatically Synced to selectedDate in Indonensian format */}
              <span className="text-[10.5px] font-mono text-slate-300/90 font-bold block pt-1 flex items-center gap-1">
                📅 {getFullIndonesianDate(selectedDate)}
              </span>
            </div>

            {/* Side-by-Side Tables Buying & Selling */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3.5">
              
              {/* TOP BUY TABLE */}
              <div className="bg-[#020b12] rounded-xl p-3 border border-emerald-500/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 border-b border-emerald-950/45 pb-1.5 mb-2 select-none">
                    <span className="w-1.5 h-3 rounded bg-green-500"></span>
                    <h5 className="text-[10px] font-black text-green-400 uppercase tracking-widest font-mono">
                      Top Buy (Aku)
                    </h5>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900/40 text-[9px] font-mono text-slate-500 uppercase">
                        <th className="py-1 px-0.5">Broker</th>
                        <th className="py-1 px-0.5 text-right">Value (M)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/20">
                      {data.broker?.buyers.slice(0, 3).map((row, idx) => (
                        <tr key={`${row.code}-${idx}`} className="hover:bg-cyan-950/10 transition-colors">
                          <td className="py-2 px-0.5 flex items-center gap-1 font-mono text-[10.5px]">
                            <span className="bg-emerald-950 text-emerald-400 font-black px-1 rounded text-[9.5px] border border-emerald-500/10">
                              {row.code}
                            </span>
                          </td>
                          <td className="py-2 px-0.5 text-right font-mono text-emerald-450 font-bold text-xs">
                            {(row.value / 1000000000).toFixed(2)} M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOP SELL TABLE */}
              <div className="bg-[#080204] rounded-xl p-3 border border-red-500/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 border-b border-red-950/45 pb-1.5 mb-2 select-none">
                    <span className="w-1.5 h-3 rounded bg-red-500"></span>
                    <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest font-mono">
                      Top Sell (Dist)
                    </h5>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900/40 text-[9px] font-mono text-slate-500 uppercase">
                        <th className="py-1 px-0.5">Broker</th>
                        <th className="py-1 px-0.5 text-right">Value (M)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/20">
                      {data.broker?.sellers.slice(0, 3).map((row, idx) => (
                        <tr key={`${row.code}-${idx}`} className="hover:bg-cyan-950/10 transition-colors">
                          <td className="py-2 px-0.5 flex items-center gap-1 font-mono text-[10.5px]">
                            <span className="bg-red-950 text-red-450 font-black px-1 rounded text-[9.5px] border border-red-500/10">
                              {row.code}
                            </span>
                          </td>
                          <td className="py-2 px-0.5 text-right font-mono text-red-400 font-bold text-xs">
                            {(row.value / 1000000000).toFixed(2)} M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* NET TRANSACTION VALUE AND STATSTICS BANNER */}
          <div className="mt-4 bg-[#010612] p-3 rounded-xl border border-slate-900/70 select-none">
            <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-400">
              <span className="font-bold">Total Nilai Akumulasi Bersih:</span>
              <span className={`font-black text-[11.5px] ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {data.broker ? `${isPositive ? "▲ +" : "▼ "}${(data.broker.netBuyValue / 1000000000).toFixed(2)} M` : "Calculating..."}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                style={{
                  width: `${Math.min(100, Math.max(10, data.broker ? Math.abs((data.broker.netBuyValue / (data.broker.totalBuyValue || 1)) * 100) : 50))}%`
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-sans tracking-wide leading-normal mt-2.5">
              💡 Transaksi diolah langsung dari feed bursa efek Indonesia IDX yang terverifikasi dan tervalidasi secara harian pada lembar konfirmasi.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
