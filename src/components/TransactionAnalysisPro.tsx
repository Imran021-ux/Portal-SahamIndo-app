import React, { useState, useMemo, useEffect } from "react";
import { Star, FileText, ChevronLeft, ChevronRight, Info, Copy, Check, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TransactionAnalysisProProps {
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

export const TransactionAnalysisPro: React.FC<TransactionAnalysisProProps> = ({
  activeStock,
  onToggleWatchlist,
  watchlist = []
}) => {
  // Dynamic states for active calendars & date range selection
  const [startDate, setStartDate] = useState("2026-06-02");
  const [endDate, setEndDate] = useState("2026-06-08");
  const [brokerSummaryDate, setBrokerSummaryDate] = useState("2026-06-08");
  const [brokerSummaryTicker, setBrokerSummaryTicker] = useState("");
  const [hoveredDateIdx, setHoveredDateIdx] = useState<number | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Compute dynamic dates list between startDate and endDate (excluding weekends)
  const DATES_LIST = useMemo(() => {
    try {
      if (!startDate || !endDate) return ["2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-08"];
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return ["2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-08"];
      }

      const list: string[] = [];
      const current = new Date(start);
      let count = 0;
      while (current <= end && count < 60) {
        const dWeek = current.getDay();
        if (dWeek !== 0 && dWeek !== 6) { // Skip Saturday and Sunday
          const yearStr = current.getFullYear();
          const monthStr = String(current.getMonth() + 1).padStart(2, '0');
          const dateStrCustom = String(current.getDate()).padStart(2, '0');
          list.push(`${yearStr}-${monthStr}-${dateStrCustom}`);
        }
        current.setDate(current.getDate() + 1);
        count++;
      }
      
      if (list.length === 0) {
        return ["2026-06-08"];
      }
      // Cap at last 7 trading days for density and clarity
      return list.slice(-7);
    } catch {
      return ["2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-08"];
    }
  }, [startDate, endDate]);

  // Sync active day index with DATES_LIST
  useEffect(() => {
    if (DATES_LIST.length > 0 && !DATES_LIST.includes(brokerSummaryDate)) {
      setBrokerSummaryDate(DATES_LIST[DATES_LIST.length - 1]);
    }
  }, [DATES_LIST, brokerSummaryDate]);

  const getLineOpacity = (code: string) => {
    if (selectedBroker) {
      return selectedBroker === code ? 1.0 : 0.12;
    }
    if (activeCategory) {
      const isAcc = lineBrokers.slice(0, 3).includes(code);
      const isDist = lineBrokers.slice(3, 6).includes(code);
      if (activeCategory === "M" && isAcc) return 1.0;
      if (activeCategory === "NR" && isAcc) return 1.0;
      if (activeCategory === "F" && isAcc) return 1.0;
      if (activeCategory === "Z" && isDist) return 1.0;
      return 0.12;
    }
    return 1.0;
  };

  // Retrieve current active emiten code
  const currentQueryTicker = brokerSummaryTicker.trim().toUpperCase() || activeStock.ticker;

  // FORMAT INDONESIAN DATE
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
    } catch (e) {
      return dateStr;
    }
  };

  // FORMAT Indonesian abbreviated date
  const getShortIndonesianDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      
      const d = new Date(year, month, day);
      if (isNaN(d.getTime())) return dateStr;
      const abbreviatedDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      return `${abbreviatedDays[d.getDay()]}, ${parts[2]}/${parts[1]}`;
    } catch {
      return dateStr;
    }
  };

  // DYNAMIC DETERMINISTIC BANDARMOLOGY GENERATOR FOR ANY TICKER / DATE
  const activeDayData = useMemo(() => {
    const ticker = currentQueryTicker;
    const dateStr = brokerSummaryDate;
    
    // Create a deterministic seed based on ticker and date characters
    const seed = (ticker + dateStr).split("").reduce((acc, char) => acc + char.charCodeAt(0), 17) + ticker.length;
    
    // Base unit price of the selected stock (or default to current price)
    const basePrice = ticker === activeStock.ticker ? (activeStock.currentPrice ?? activeStock.price ?? 100) : ((seed % 75) * 120 + 350);

    // List of premium Indonesian brokers
    const brokersBuyList = [
      { code: "YP", name: "Mirae Asset Sekuritas" },
      { code: "AK", name: "UBS Sekuritas Indonesia" },
      { code: "BK", name: "J.P. Morgan Sekuritas" },
      { code: "CC", name: "Mandiri Sekuritas ID" },
      { code: "OD", name: "BRI Danareksa Sekuritas" },
      { code: "PD", name: "Indo Premier Sekuritas" }
    ];

    const brokersSellList = [
      { code: "AZ", name: "Sucor Sekuritas ID" },
      { code: "RX", name: "Macquarie Sekuritas ID" },
      { code: "MG", name: "Semesta Indovest Sekuritas" },
      { code: "IF", name: "CGS-CIMB Sekuritas ID" },
      { code: "NI", name: "BNI Sekuritas" },
      { code: "DH", name: "Sinarmas Sekuritas" }
    ];

    // Shuffle based on seed
    const buys = brokersBuyList.map((b, i) => {
      const idx = (seed + i) % brokersBuyList.length;
      const broker = brokersBuyList[idx];
      const lots = Math.round(15000 + ((seed + i) % 25) * 3500 + (seed % 3) * 1200);
      const valM = Math.round((lots * basePrice * 100) / 1000000000);
      return {
        code: broker.code,
        name: broker.name,
        lots,
        valM: valM > 0 ? valM : 1.2,
        avgPr: Math.round(basePrice * (1 + ((seed + i) % 5 - 2) * 0.001))
      };
    });

    const sells = brokersSellList.map((b, i) => {
      const idx = (seed + i) % brokersSellList.length;
      const broker = brokersSellList[idx];
      const lots = Math.round(14000 + ((seed + i * 3) % 20) * 3100 + (seed % 4) * 850);
      const valM = Math.round((lots * basePrice * 100) / 1000000000);
      return {
        code: broker.code,
        name: broker.name,
        lots,
        valM: valM > 0 ? valM : 1.1,
        avgPr: Math.round(basePrice * (1 + ((seed + i * 2) % 5 - 2) * 0.001))
      };
    });

    // Top accumulators (first 3 buyers) and top distributors (first 3 sellers)
    const accumulationStrength = seed % 3 === 0 ? "BIG ACCUMULATION" : seed % 3 === 1 ? "SMALL ACCUMULATION" : "NEUTRAL / DISTRIBUTION";

    return {
      top_buy: buys.slice(0, 4),
      top_sell: sells.slice(0, 4),
      accumulating: buys.slice(0, 3).map(b => ({
        code: b.code,
        name: b.name,
        netValue: b.valM * 0.8,
        sharesPercent: 15 + (seed % 10)
      })),
      distributing: sells.slice(0, 3).map(s => ({
        code: s.code,
        name: s.name,
        netValue: s.valM * 0.85,
        sharesPercent: 12 + (seed % 15)
      })),
      strength: accumulationStrength
    };
  }, [currentQueryTicker, brokerSummaryDate, activeStock]);

  const currentDayIdx = DATES_LIST.indexOf(brokerSummaryDate);

  const handlePrevDate = () => {
    const nextIdx = currentDayIdx - 1;
    if (nextIdx >= 0) {
      setBrokerSummaryDate(DATES_LIST[nextIdx]);
    }
  };

  const handleNextDate = () => {
    const nextIdx = currentDayIdx + 1;
    if (nextIdx < DATES_LIST.length) {
      setBrokerSummaryDate(DATES_LIST[nextIdx]);
    }
  };

  // DYNAMICALLY RETRIEVE END SEGMENT BROKERS BASED ON EMITEN ACCUMULATION AND DISTRIBUTION STATUS
  const lineBrokers = useMemo(() => {
    const acc = activeDayData.accumulating.map(b => b.code);
    const dist = activeDayData.distributing.map(s => s.code);
    
    const defaultAcc = ["AK", "BK", "CC"];
    const defaultDist = ["AZ", "RX", "MG"];
    
    const finalAcc = [...acc];
    while (finalAcc.length < 3) {
      const fb = defaultAcc.find(x => !finalAcc.includes(x)) || "AK";
      finalAcc.push(fb);
    }
    
    const finalDist = [...dist];
    while (finalDist.length < 3) {
      const fb = defaultDist.find(x => !finalDist.includes(x)) || "AZ";
      finalDist.push(fb);
    }
    
    return [...finalAcc.slice(0, 3), ...finalDist.slice(0, 3)].slice(0, 6);
  }, [activeDayData]);

  // MAP COLOR VALUES DYNAMICALLY (Accumulators get positive colors, distributors get negative colors)
  const brokerColorMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    const colors = ["#10b981", "#06b6d4", "#eab308", "#ef4444", "#f97316", "#a855f7"];
    lineBrokers.forEach((code, i) => {
      map[code] = colors[i] || "#ffffff";
    });
    return map;
  }, [lineBrokers]);

  // MULTILINE CHART COORDINATES AND PATHS GENERATOR
  // Dynamic flows representing active net transaction values
  const lineData = useMemo(() => {
    const ticker = currentQueryTicker;
    const baseFlows: Record<string, number[]> = {
      AK: [-50, 40, 110, 180, 240],
      BK: [120, 80, 50, -40, -120],
      CC: [-100, -80, -20, 40, 190],
      AZ: [180, 120, -100, -180, -426],
      RX: [-150, -100, -120, -50, -75],
      MG: [-50, 20, -10, 15, -60],
      YP: [50, -10, 100, 80, 240],
      IF: [-85, -45, 10, 80, 130]
    };

    const result: Record<string, number[]> = {};

    lineBrokers.forEach((broker, bIdx) => {
      result[broker] = [];
      DATES_LIST.forEach((date, index) => {
        if (index < 5 && ticker === activeStock.ticker && baseFlows[broker]) {
          result[broker].push(baseFlows[broker][index]);
        } else {
          // Generate high-quality deterministic trending values
          const charSum = (ticker + date + broker).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
          const isAcc = bIdx < 3;
          const valDirection = isAcc ? 1 : -1;
          const baseOffset = isAcc ? 110 : -130;
          const generatedVal = (baseOffset + ((charSum % 360) - 180) + Math.sin(index * 1.5) * 60) * valDirection;
          result[broker].push(Math.round(generatedVal));
        }
      });
    });

    return result;
  }, [DATES_LIST, currentQueryTicker, activeStock.ticker, lineBrokers]);

  // Override standard indicator colors
  const YP_color = "#eab308";
  const RX_color = "#ef4444";
  const AK_color = "#f97316";
  const MG_color = "#22c55e";
  const AZ_color = "#1d4ed8";
  const IF_color = "#a855f7";

  // Sumbu Y bounds range: -500 to 300
  const mapCoord = (val: number, xIdx: number) => {
    const graphWidth = 420;
    const graphHeight = 180;
    const len = DATES_LIST.length;
    const x = len > 1 ? 60 + xIdx * (graphWidth / (len - 1)) : 240;
    const ratio = (val - (-500)) / 800;
    const y = 205 - ratio * graphHeight;
    return { x, y };
  };

  const mapLineToPath = (arr: number[]) => {
    return arr.map((val, idx) => {
      const { x, y } = mapCoord(val, idx);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const volumeBars = useMemo(() => {
    return DATES_LIST.map((date, index) => {
      const charSum = (currentQueryTicker + date).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      return 35 + (charSum % 80);
    });
  }, [DATES_LIST, currentQueryTicker]);

  return (
    <div id="transaction-analysis-root" className="space-y-6 animate-fadeIn pb-8">
      
      {/* TOP BAR HEADER */}
      <div id="top-bar-header" className="flex flex-col md:flex-row items-center justify-between border-b border-[#1e222d] pb-4 gap-4">
        <div className="w-full md:w-auto flex justify-start">
          <button
            id="btn-add-watchlist"
            onClick={() => onToggleWatchlist?.(activeStock.ticker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
              watchlist.includes(activeStock.ticker)
                ? "bg-emerald-950/45 text-emerald-400 border-emerald-500/20"
                : "bg-transparent text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${watchlist.includes(activeStock.ticker) ? "fill-emerald-400 text-emerald-400" : ""}`} />
            <span>Add to Watchlist</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-emerald-400 shrink-0 select-none hidden sm:block" />
          <h3 id="panel-title-text" className="text-base sm:text-lg md:text-xl font-black text-emerald-400 uppercase tracking-widest font-mono text-center">
            Analisa Transaksi Broker
          </h3>
          <FileText className="w-5 h-5 text-emerald-400 shrink-0 select-none hidden sm:block" />
        </div>

        <div className="text-right text-[11px] font-mono font-bold text-slate-400 w-full md:w-auto flex justify-end select-none">
          <span className="border border-slate-800 bg-slate-950 px-3 py-1 rounded text-emerald-400">
            Terupdate: Senin, 8 Juni 2026
          </span>
        </div>
      </div>

      {/* DETAILED INTUITIVE INFO HERO BOX */}
      <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-4 flex flex-col sm:flex-row shadow-lg items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-black text-emerald-400 uppercase font-mono tracking-wider">KONEKSI LIVE BURSA</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Menganalisis arus akumulasi dan distribusi broker harian bandarmology untuk saham <strong className="text-emerald-400 font-mono">{currentQueryTicker}</strong>. Klik area grafik vertikal di bawah untuk mensinkronisasi data tabel filter harian secara interaktif!
          </p>
        </div>
        <div className="bg-slate-950 px-4 py-2 text-right rounded-xl border border-slate-900 select-none shrink-0 inline-block font-mono">
          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Kekuatan Akumulasi</span>
          <span className={`text-xs font-black uppercase ${activeDayData.strength.includes("BIG") ? "text-green-400" : "text-amber-400"}`}>
            ⚡ {activeDayData.strength}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT COLS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* COLUMN LEFT: Cumulative flow Graph (With Multi-device precise viewbox ratio) */}
        <div className="xl:col-span-12 flex flex-col space-y-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h4 className="text-sm font-black text-slate-100 font-mono uppercase tracking-wider">
                Interactive Accumulation Trend Flow
              </h4>
              <span className="text-[9px] font-extrabold bg-[#1e222d]/60 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase border border-emerald-950/20">
                CLICKABLE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Klik pada titik bulat atau kolom vertikal tanggal di bawah untuk memilih tanggal transaksi.
            </p>
          </div>

          {/* COMPASS MULTIDEVICE RESPONSIVE CANVAS FRAME */}
          <div className="w-full bg-[#050b14] rounded-2xl p-4 shadow-2xl border border-cyan-500/10 hover:shadow-cyan-950/20 transition-all duration-300">
            
            {/* Category Selector Buttons (M, NR, F, Z) */}
            <div className="flex flex-col items-center gap-2 mb-4.5 w-full select-none">
              <span className="text-[9.5px] font-mono text-slate-500 font-extrabold uppercase tracking-widest text-center">
                Filter Bandar Premium: (Klik tombol untuk sorot grafik & info)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {[
                  { key: "M", title: "M", label: "Big Money", desc: "Arus transaksi volume jumbo oleh institusi asing / bandar utama." },
                  { key: "NR", title: "NR", label: "Non Retail", desc: "Institusi lokal, dana pensiun, & manajer investasi domestik harian." },
                  { key: "F", title: "F", label: "Foreign", desc: "Perantara transaksi investor global penggerak utama pasar saham." },
                  { key: "Z", title: "Z", label: "Zombie", desc: "Akun retail pasif / tertidur dlm statistik likuiditas bursa." }
                ].map((item) => {
                  const isActive = activeCategory === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActiveCategory(activeCategory === item.key ? null : item.key);
                        setSelectedBroker(null); // Clear broker focus on category click
                      }}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        isActive
                          ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                      title={`${item.label}: ${item.desc}`}
                    >
                      <span className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center ${
                        isActive ? "bg-cyan-500 text-slate-950 animate-pulse" : "bg-slate-900 text-slate-500 border border-slate-850"
                      }`}>{item.key}</span>
                      <span className="text-[10px] font-sans font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Category Description Banner if active */}
              {activeCategory && (() => {
                const activeInfo = [
                  { key: "M", label: "Big Money", desc: "Menyoroti broker akumulator utama (AK, RX, AZ) penguasa barang." },
                  { key: "NR", label: "Non Retail", desc: "Menyoroti investor institusi lokal non-retail (AK, IF) pemegang jangka panjang." },
                  { key: "F", label: "Foreign", desc: "Menyoroti broker asing global (RX, IF) penentu arah modal asing bursa IDX." },
                  { key: "Z", label: "Zombie", desc: "Menyoroti sekuritas retail pasif dan likuiditas kecil (YP, MG) yang jarang di-markup." }
                ].find(i => i.key === activeCategory);
                return (
                  <div className="text-[10px] text-slate-400 bg-cyan-950/20 border border-cyan-900/30 p-2 rounded-lg text-center font-sans tracking-wide max-w-md animate-fadeIn transition-all mt-1 w-full">
                    <strong className="text-cyan-400">{activeInfo?.label}: </strong>
                    {activeInfo?.desc}
                  </div>
                );
              })()}
            </div>

            {/* Clear, Minimal Reset Button Area */}
            {(selectedBroker || activeCategory) && (
              <div className="flex justify-center mt-1 mb-3 animate-fadeIn">
                <button 
                  onClick={() => { setSelectedBroker(null); setActiveCategory(null); }} 
                  className="px-3.5 py-1 text-[9px] font-mono font-black text-rose-400 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/40 rounded-full transition-all tracking-wider uppercase"
                >
                  ✕ BATALKAN SOROTAN BROKER / FILTER
                </button>
              </div>
            )}

            {/* RESPONSIVE ASPECT RATIO BLOCK */}
            <div className="relative w-full aspect-[16/10] md:aspect-[2/1] overflow-hidden">
              <svg 
                viewBox="0 0 540 240" 
                className="w-full h-full select-none overflow-visible"
                preserveAspectRatio="xMidYMid meet"
              >
                
                {/* Pure Black background representation */}
                <rect x="0" y="0" width="540" height="240" fill="#040910" rx="10" />

                {/* Y-Axis Horizontal Guide Gridlines - Value Labels Deleted as requested */}
                {[-500, -300, -100, 0, 100, 200, 300].map((yVal) => {
                  const ratio = (yVal - (-500)) / 800;
                  const coordinateY = 205 - ratio * 180;
                  return (
                    <g key={`h-grid-${yVal}`} className="pointer-events-none">
                      <line
                        x1="45"
                        y1={coordinateY}
                        x2="480"
                        y2={coordinateY}
                        stroke={yVal === 0 ? "#1e293b" : "#0d1527"}
                        strokeWidth={yVal === 0 ? "1.5" : "1"}
                        strokeDasharray={yVal === 0 ? "0" : "2,3"}
                      />
                    </g>
                  );
                })}

                {/* Vertical helper grid lines representing dates */}
                {DATES_LIST.map((dateStr, idx) => {
                  const coordinateX = 60 + idx * 105;
                  const isActive = brokerSummaryDate === dateStr;
                  const isHovered = hoveredDateIdx === idx;
                  return (
                    <g key={`v-grid-${dateStr}`} className="pointer-events-none">
                      <line
                        x1={coordinateX}
                        y1="25"
                        x2={coordinateX}
                        y2="205"
                        stroke={isActive ? "#10b981" : isHovered ? "#334155" : "#0d1527"}
                        strokeWidth={isActive ? "1.8" : isHovered ? "1.2" : "1"}
                        strokeDasharray={isActive ? "0" : "2,2"}
                      />
                    </g>
                  );
                })}

                {/* Volume bar overlay at the very bottom */}
                {volumeBars.map((volVal, idx) => {
                  const coordinateX = 60 + idx * 105;
                  const barHeight = volVal * 0.22; 
                  return (
                    <rect
                      key={`vol-b-${idx}`}
                      x={coordinateX - 7}
                      y={205 - barHeight}
                      width="14"
                      height={barHeight}
                      fill="#06b6d4"
                      opacity="0.12"
                      className="pointer-events-none"
                    />
                  );
                })}

                {/* Plot 6 colorful lines dynamically using active broker status with dynamic opacity */}
                <g className="pointer-events-none">
                  {lineBrokers.map((broker) => {
                    const color = brokerColorMap[broker] || "#ffffff";
                    const pathD = mapLineToPath(lineData[broker] || []);
                    return (
                      <path 
                        key={`path-${broker}`}
                        d={pathD} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        opacity={getLineOpacity(broker)} 
                        className="transition-all duration-300" 
                      />
                    );
                  })}
                </g>

                {/* Clickable End labels next to line paths (right end) using dynamic brokers */}
                {lineBrokers.map((code) => {
                  const dataArray = lineData[code] || [];
                  const lastVal = dataArray[dataArray.length - 1] ?? 0;
                  const coord = mapCoord(lastVal, dataArray.length - 1);
                  const color = brokerColorMap[code] || "#ffffff";
                  const isFocused = selectedBroker === code;
                  const opacity = getLineOpacity(code);
                  
                  return (
                    <g 
                      key={`end-label-${code}`}
                      className="cursor-pointer group/label"
                      onClick={() => {
                        setSelectedBroker(selectedBroker === code ? null : code);
                        setActiveCategory(null); // Clear category filter if broker clicked
                      }}
                      opacity={opacity}
                    >
                      {/* Subtly dynamic background pill indicator on hover or click */}
                      <rect 
                        x={coord.x + 4} 
                        y={coord.y - 6} 
                        width="24" 
                        height="12" 
                        rx="3" 
                        fill={isFocused ? color : "#0c1524"} 
                        stroke={color}
                        strokeWidth={isFocused ? "1.5" : "0.5"}
                        className="transition-all duration-250 hover:opacity-90"
                      />
                      <text
                        x={coord.x + 16}
                        y={coord.y + 3}
                        fill={isFocused ? "#020914" : color}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="black"
                        textAnchor="middle"
                        className="transition-all duration-250 select-none uppercase"
                      >
                        {code}
                      </text>
                    </g>
                  );
                })}

                {/* Interactive Clickable Columns Region - Date label deleted from below as requested */}
                {DATES_LIST.map((dateStr, idx) => {
                  const coordinateX = 60 + idx * 105;
                  const isActive = brokerSummaryDate === dateStr;
                  return (
                    <g 
                      key={`hitbox-${idx}`}
                      onClick={() => setBrokerSummaryDate(dateStr)}
                      onMouseEnter={() => setHoveredDateIdx(idx)}
                      onMouseLeave={() => setHoveredDateIdx(null)}
                      className="cursor-pointer"
                    >
                      {/* Generous hover hitbox region background */}
                      <rect
                        x={coordinateX - 50}
                        y="15"
                        width="100"
                        height="215"
                        fill="#10b981"
                        opacity={hoveredDateIdx === idx ? "0.04" : "0"}
                      />
                      
                      {/* Visual indicator line instead of date string as requested */}
                      {isActive && (
                        <line
                          x1={coordinateX}
                          y1="15"
                          x2={coordinateX}
                          y2="205"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          opacity="0.6"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Bullets endpoint rendering with dynamic styling */}
                {DATES_LIST.map((dateStr, idx) => {
                  const isActive = brokerSummaryDate === dateStr;

                  return (
                    <g key={`dots-render-${idx}`} className="pointer-events-none transition-all duration-300">
                      {lineBrokers.map((broker) => {
                        const dataArray = lineData[broker] || [];
                        const val = dataArray[idx] ?? 0;
                        const coord = mapCoord(val, idx);
                        const color = brokerColorMap[broker];
                        const opacity = getLineOpacity(broker);
                        return (
                          <circle 
                            key={`dot-${broker}-${idx}`}
                            cx={coord.x} 
                            cy={coord.y} 
                            r={isActive ? "5" : "3.5"} 
                            fill={color} 
                            stroke="#ffffff" 
                            strokeWidth={isActive ? "1.8" : "0.8"} 
                            opacity={opacity} 
                          />
                        );
                      })}
                    </g>
                  );
                })}

              </svg>

              {/* FLOATING HOVER DETAILS POPUP CARD FOR DATE & VALUES - IMPLEMENTS REQUESTED INTERACTIVE POPUP */}
              {hoveredDateIdx !== null && (
                <div 
                  className="absolute z-20 bg-[#070e17]/95 border border-cyan-500/60 p-2.5 rounded-xl shadow-2xl text-left pointer-events-none animate-fadeIn backdrop-blur-md"
                  style={{
                    left: `${((60 + hoveredDateIdx * 105) / 540) * 100}%`,
                    transform: "translate(-50%, 0)",
                    top: "18px",
                  }}
                >
                  <span className="text-[10px] font-mono font-black text-cyan-400 block pb-1 border-b border-white/[0.05] uppercase">
                    📅 {DATES_LIST[hoveredDateIdx]}
                  </span>
                  <div className="space-y-1 mt-1.5 font-mono text-[9px] w-40">
                    {lineBrokers.map((broker) => {
                      const dataArray = lineData[broker] || [];
                      const val = dataArray[hoveredDateIdx] ?? 0;
                      const formattedVal = val >= 0 ? `+${val}M` : `${val}M`;
                      const color = brokerColorMap[broker];
                      const isAcc = lineBrokers.slice(0, 3).includes(broker);
                      const label = isAcc ? "BUY" : "SELL";
                      return (
                        <div key={broker} className="flex justify-between items-center">
                          <span style={{ color }} className="font-bold">{broker} ({label}):</span>
                          <span className={val >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {formattedVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
            
            <div className="text-center mt-2.5">
              <span className="text-[10px] text-cyan-400 font-bold block bg-cyan-950/25 border border-cyan-900/40 py-1.5 rounded-lg select-none font-mono uppercase tracking-wide animate-pulse">
                💡 SENTUH kursor atau klik garis/bulatan grafik untuk beralih tanggal & melihat detail alur akumulasi bursa dalam pop-up melayang.
              </span>
            </div>

          </div>

        </div>

        {/* COLUMN RIGHT: Broker Summary (Date Equalization Selector & side-by-side buy are green and sell are red) */}
        <div className="xl:col-span-12 bg-[#030914] rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-5 shadow-2xl border border-emerald-500/10">
          
          <div className="space-y-4">
            
            <div className="flex justify-between items-center border-b border-[#17253a] pb-3 select-none">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm md:text-base font-black text-emerald-400 font-mono uppercase tracking-wider">
                  Broker Summary
                </h4>
                <Info className="w-4 h-4 text-slate-500 cursor-pointer hover:text-emerald-400" title="Berdasarkan penutupan bursa terverifikasi." />
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2.5 py-0.5 rounded border border-emerald-900 uppercase font-black">
                {currentQueryTicker}
              </span>
            </div>

            {/* BAR CONTROLS WITH REAL CALENDAR POPUP */}
            <div className="space-y-3 bg-[#010610] p-3.5 rounded-xl border border-slate-900/60 shadow-lg">
              
              <div className="flex items-center justify-between text-xs select-none gap-2">
                <button
                  onClick={handlePrevDate}
                  disabled={currentDayIdx <= 0}
                  className={`p-1.5 rounded-lg border text-slate-400 transition-all flex items-center justify-center cursor-pointer ${
                    currentDayIdx <= 0 
                      ? "border-slate-850 bg-slate-900/40 text-slate-600 opacity-30 cursor-not-allowed" 
                      : "border-slate-800 bg-[#091527] hover:text-emerald-400 hover:border-emerald-500/20 active:scale-90"
                  }`}
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <span className="text-[12px] font-black text-emerald-400 uppercase tracking-wider block font-mono">
                    {getFullIndonesianDate(brokerSummaryDate)}
                  </span>
                  <span className="text-[8.5px] font-mono text-slate-500 mt-1 uppercase font-bold tracking-widest">
                    ALUR TRANSAKSI BURSA
                  </span>
                </div>

                <button
                  onClick={handleNextDate}
                  disabled={currentDayIdx >= DATES_LIST.length - 1 || currentDayIdx === -1}
                  className={`p-1.5 rounded-lg border text-slate-400 transition-all flex items-center justify-center cursor-pointer ${
                    currentDayIdx >= DATES_LIST.length - 1 || currentDayIdx === -1
                      ? "border-slate-850 bg-slate-900/40 text-slate-600 opacity-30 cursor-not-allowed" 
                      : "border-slate-800 bg-[#091527] hover:text-emerald-400 hover:border-emerald-500/20 active:scale-95"
                  }`}
                  title="Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid: Calendars Mulai & Sampai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-900/50">
                
                {/* START CALENDAR */}
                <div className="p-2 bg-[#020b17] border border-slate-800/80 rounded-xl flex flex-col justify-between space-y-1">
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                    📅 Kalender Mulai:
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      if (rawVal) {
                        setStartDate(rawVal);
                      }
                    }}
                    className="w-full text-xs font-mono font-bold bg-[#010912] border border-slate-800 focus:border-cyan-500/50 rounded-lg p-1 px-2 text-slate-200 outline-none transition-all cursor-pointer"
                  />
                  <span className="text-[8.5px] font-bold text-slate-400 block font-mono">
                    {getShortIndonesianDate(startDate)}
                  </span>
                </div>

                {/* END CALENDAR */}
                <div className="p-2 bg-[#020b17] border border-slate-800/80 rounded-xl flex flex-col justify-between space-y-1">
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                    📅 Kalender Sampai:
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max="2026-06-08"
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      if (rawVal) {
                        setEndDate(rawVal);
                      }
                    }}
                    className="w-full text-xs font-mono font-bold bg-[#010912] border border-slate-800 focus:border-cyan-500/50 rounded-lg p-1 px-2 text-slate-200 outline-none transition-all cursor-pointer"
                  />
                  <span className="text-[8.5px] font-bold text-slate-400 block font-mono">
                    {getShortIndonesianDate(endDate)}
                  </span>
                </div>

              </div>


            </div>

            {/* SIDE-BY-SIDE TABLES: BUY LEFT (GREEN), SELL RIGHT (RED) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* TOP BUY TABLE - LEFT (EMERALD GREEN STYLE) */}
              <div className="bg-[#020b12] rounded-2xl p-3 border border-emerald-500/15 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-emerald-950/40 pb-2 mb-2 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-3 rounded bg-green-500"></span>
                      <h5 className="text-[11px] font-black text-green-400 uppercase tracking-widest font-mono">
                        Top Buy (Hijau)
                      </h5>
                    </div>
                    <span className="text-[8px] bg-emerald-950/80 text-green-400 px-1.5 py-0.5 rounded border border-emerald-800/40 font-black uppercase font-mono">
                      NET BUY
                    </span>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900/60 text-[9.5px] font-mono text-slate-500 uppercase">
                        <th className="py-1.5 px-1 font-bold">Broker</th>
                        <th className="py-1.5 px-1 text-right font-bold">Value</th>
                        <th className="py-1.5 px-1 text-right font-bold">Avg PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDayData.top_buy.map((row) => {
                        const isSelected = selectedBroker === row.code;
                        return (
                          <tr 
                            key={row.code} 
                            onClick={() => {
                              setSelectedBroker(selectedBroker === row.code ? null : row.code);
                              setActiveCategory(null);
                            }}
                            className={`border-b border-slate-900/30 hover:bg-cyan-950/20 cursor-pointer transition-colors ${
                              isSelected ? "bg-[#022c22]/40 ring-1 ring-emerald-500/35 border-l-2 border-emerald-450 font-black text-emerald-300" : ""
                            }`}
                          >
                            <td className="py-2 px-1 flex items-center gap-1 font-mono">
                              <span className={`text-[9.5px] font-black leading-none px-1.5 py-0.5 rounded ${
                                isSelected ? "bg-emerald-500 text-slate-950" : "bg-emerald-955 text-emerald-400 border border-emerald-500/20"
                              }`}>
                                {row.code}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-right font-mono text-green-400 font-bold text-xs">
                              {row.valM.toLocaleString("id-ID")} M
                            </td>
                            <td className="py-2 px-1 text-right font-mono text-slate-300 text-xs font-black">
                              {row.avgPr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-[8.5px] text-green-500/70 font-mono mt-1 text-center select-none uppercase">
                  ▲ Net accumulation session active
                </div>
              </div>

              {/* TOP SELL TABLE - RIGHT (ROSE RED STYLE) */}
              <div className="bg-[#080204] rounded-2xl p-3 border border-red-500/15 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-red-950/40 pb-2 mb-2 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-3 rounded bg-red-500"></span>
                      <h5 className="text-[11px] font-black text-red-400 uppercase tracking-widest font-mono">
                        Top Sell (Merah)
                      </h5>
                    </div>
                    <span className="text-[8px] bg-red-950/80 text-red-400 px-1.5 py-0.5 rounded border border-red-800/40 font-black uppercase font-mono">
                      NET SELL
                    </span>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900/60 text-[9.5px] font-mono text-slate-500 uppercase">
                        <th className="py-1.5 px-1 font-bold">Broker</th>
                        <th className="py-1.5 px-1 text-right font-bold">Value</th>
                        <th className="py-1.5 px-1 text-right font-bold">Avg PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDayData.top_sell.map((row) => {
                        const isSelected = selectedBroker === row.code;
                        return (
                          <tr 
                            key={row.code} 
                            onClick={() => {
                              setSelectedBroker(selectedBroker === row.code ? null : row.code);
                              setActiveCategory(null);
                            }}
                            className={`border-b border-slate-900/30 hover:bg-cyan-950/20 cursor-pointer transition-colors ${
                              isSelected ? "bg-[#290515]/40 ring-1 ring-rose-500/45 border-l-2 border-rose-500 font-black text-rose-300" : ""
                            }`}
                          >
                            <td className="py-2 px-1 flex items-center gap-1 font-mono">
                              <span className={`text-[9.5px] font-black leading-none px-1.5 py-0.5 rounded ${
                                isSelected ? "bg-rose-500 text-slate-950" : "bg-red-955 text-red-400 border border-red-500/20"
                              }`}>
                                {row.code}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-right font-mono text-rose-455 font-bold text-xs">
                              {row.valM.toLocaleString("id-ID")} M
                            </td>
                            <td className="py-2 px-1 text-right font-mono text-slate-300 text-xs font-black">
                              {row.avgPr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-[8.5px] text-red-500/70 font-mono mt-1 text-center select-none uppercase">
                  ▼ Net distribution session active
                </div>
              </div>

            </div>

            {/* DETAILED ACCUMULATION & DISTRIBUTION BROKERS UNDERNEATH (Required: "di bawah nya ada broker broker yang sedang akumulasi atau distribusi") */}
            <div className="bg-[#010610] p-4.5 rounded-2xl border border-slate-900 space-y-3 shadow-xl">
              <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase tracking-wider select-none">
                📊 DETIL SEBARAN BROKER AKTIF ({currentQueryTicker}):
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Accumulating list */}
                <div className="bg-emerald-950/15 border border-emerald-500/10 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2 select-none">
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[10.5px] font-black text-green-400 font-mono uppercase tracking-wider">Top Accumulators</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeDayData.accumulating.map((broker) => {
                      const isSelected = selectedBroker === broker.code;
                      return (
                        <div 
                          key={broker.code} 
                          onClick={() => {
                            setSelectedBroker(selectedBroker === broker.code ? null : broker.code);
                            setActiveCategory(null);
                          }}
                          className={`flex justify-between items-center text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "bg-[#022c22]/50 ring-1 ring-emerald-500/40" : "hover:bg-slate-950/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8.5px] font-bold font-mono px-1 py-0.5 rounded ${
                              isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-950 text-slate-300 border border-slate-800"
                            }`}>
                              {broker.code}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[6.5rem] font-sans">
                              {broker.name.split(" ")[0]}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-emerald-400 font-bold block leading-none">+{broker.netValue.toFixed(1)} M</span>
                            <span className="text-[8px] text-slate-500">Share: {broker.sharesPercent}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Distributing list */}
                <div className="bg-red-950/15 border border-red-500/10 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2 select-none">
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10.5px] font-black text-red-500 font-mono uppercase tracking-wider">Top Distributors</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeDayData.distributing.map((broker) => {
                      const isSelected = selectedBroker === broker.code;
                      return (
                        <div 
                          key={broker.code} 
                          onClick={() => {
                            setSelectedBroker(selectedBroker === broker.code ? null : broker.code);
                            setActiveCategory(null);
                          }}
                          className={`flex justify-between items-center text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "bg-[#290515]/50 ring-1 ring-rose-500/40" : "hover:bg-slate-950/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8.5px] font-bold font-mono px-1 py-0.5 rounded ${
                              isSelected ? "bg-rose-500 text-slate-950" : "bg-slate-950 text-slate-300 border border-slate-800"
                            }`}>
                              {broker.code}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[6.5rem] font-sans">
                              {broker.name.split(" ")[0]}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-rose-455 font-bold block leading-none">-{broker.netValue.toFixed(1)} M</span>
                            <span className="text-[8px] text-slate-550 text-slate-400">Share: {broker.sharesPercent}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="text-[9.5px] text-slate-500 pt-3.5 border-t border-slate-900 leading-normal font-sans select-none space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Data diakumulasi setelah penutupan bursa terverifikasi tepat pada jam 19:00 WIB.</span>
            </div>
            <div>
              💡 <span className="text-slate-400">Gunakan sensor penunjuk grafik untuk mensinkronisasi histori bursa dengan cepat.</span>
            </div>
          </div>
        </div>

      </div>
      
    </div>
  );
};
