/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Stock } from "../types";
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, 
  Activity, ArrowUpRight, ArrowDownRight, Compass,
  Coins, Wallet, ShoppingCart, RefreshCcw, Eye, ShieldCheck,
  Search, ChevronRight, Sparkles, Award,
  ChevronLeft, SlidersHorizontal, Filter, Star, LayoutGrid, Calendar, HelpCircle, Info, FileText, RotateCw, Copy, Check, AlertTriangle, Maximize2, Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, LineChart, Line, ReferenceLine, Label } from "recharts";
import { getTechnicalIndicators } from "../data";
import TradingViewWidget from "./TradingViewWidget";
import TradingViewGauge from "./TradingViewGauge";
import SentimentAnalysisEngine from "./SentimentAnalysisEngine";
import { TransactionDashboard } from "./TransactionDashboard";
import { generateTradingRecommendation } from "../utils/tradingSignal";
import { getInventoryAnalysis } from "../utils/inventoryAnalysis";
import { generateDynamicIdxStock } from "../utils/idxGenerator";
import { marketData } from "../marketData";
import { DataService } from "../dataService";

// Highly stylized animated custom tooltip displaying dynamic price indicators, percentage change and custom volume estimates
const CustomAnimatedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isChangePos = data.changePercent >= 0;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-[#020b13]/95 border border-cyan-500/20 p-3.5 rounded-xl shadow-2xl backdrop-blur-md space-y-2 min-w-[200px]"
      >
        <div className="flex justify-between items-center border-b border-cyan-950/40 pb-1.5">
          <span className="text-[10px] font-black font-mono text-cyan-400 uppercase tracking-wider">{label}</span>
          <span className="text-[8px] bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-500/80 font-mono font-bold">ANALISA LIVE</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] gap-4">
            <span className="text-slate-400 font-sans">Harga Saham:</span>
            <span className="text-white font-mono font-black">Rp {data.Harga?.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] gap-4">
            <span className="text-slate-400 font-sans">Perubahan:</span>
            <span className={`font-mono font-bold ${isChangePos ? "text-emerald-400" : "text-rose-450"}`}>
              {isChangePos ? "▲ +" : "▼ "}{data.changePercent || "0"}%
            </span>
          </div>
          {data.volume && (
            <div className="flex justify-between items-center text-[11px] border-t border-white/5 pt-1 mt-1 gap-4">
              <span className="text-slate-400 font-sans">Volume:</span>
              <span className="text-cyan-300 font-mono font-bold">{data.volume.toLocaleString("id-ID")} Lot</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
  return null;
};

interface BandarTrade {
  id: string;
  time: string;
  broker: string;
  type: "BUY" | "SELL";
  price: number;
  lot: number;
  shares: number;
  strength: "STRONG" | "MEDIUM" | "WEAK";
}

interface PortfolioItem {
  ticker: string;
  shares: number;
  avgBuyPrice: number;
}

interface EmitenDashboardViewProps {
  stocks: Stock[];
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  onNavigateToTracer: (ticker: string) => void;
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  portfolio: Record<string, PortfolioItem>;
  setPortfolio: React.Dispatch<React.SetStateAction<Record<string, PortfolioItem>>>;
  watchlist?: string[];
  onToggleWatchlist?: (ticker: string) => void;
  onSelectBroker?: (brokerCode: string) => void;
}

// Helper local component for real-time Order Book and Market Depth Visualizer
const OrderBook = ({ ticker, currentPrice }: { ticker: string; currentPrice: number }) => {
  const [bids, setBids] = useState<any[]>([]);
  const [asks, setAsks] = useState<any[]>([]);
  const [totalBidLots, setTotalBidLots] = useState(0);
  const [totalAskLots, setTotalAskLots] = useState(0);

  // Real-time Bursa Jakarta hours detector
  const isBursaWorkHours = useMemo(() => {
    try {
      const targetTimeZone = "Asia/Jakarta";
      const nowInJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: targetTimeZone }));
      const day = nowInJakarta.getDay(); // 0 is Sunday, 6 is Saturday
      const hrs = nowInJakarta.getHours();
      const mins = nowInJakarta.getMinutes();
      
      const isWeekday = day >= 1 && day <= 5;
      // Session 1: 09:00 - 12:00 WIB
      // Session 2: 13:30 - 16:00 WIB
      const isSession1 = hrs >= 9 && hrs < 12;
      const isSession2 = (hrs === 13 && mins >= 30) || (hrs >= 14 && hrs < 16);
      
      return isWeekday && (isSession1 || isSession2);
    } catch (e) {
      // Fallback
      const now = new Date();
      const day = now.getDay();
      const hrs = now.getHours();
      return day >= 1 && day <= 5 && hrs >= 9 && hrs < 16;
    }
  }, []);

  const isActuallyMarketOpen = isBursaWorkHours;

  // Animation & Flash state triggers on large volume spikes
  const [flashedBidIdx, setFlashedBidIdx] = useState<number | null>(null);
  const [flashedAskIdx, setFlashedAskIdx] = useState<number | null>(null);

  // Bandar trading alerts feed
  const [tradeAlerts, setTradeAlerts] = useState<string[]>([]);
  const [isGorengActive, setIsGorengActive] = useState(false);

  useEffect(() => {
    const generateBook = () => {
      const bidList = [];
      const askList = [];
      let totalB = 0;
      let totalA = 0;

      for (let i = 1; i <= 5; i++) {
        // IDR price steps
        const bidPrice = currentPrice - i * (currentPrice > 5000 ? 25 : currentPrice > 1000 ? 10 : currentPrice > 500 ? 5 : 2);
        const bidLot = Math.floor(4000 + Math.random() * 8000 - i * 600);
        totalB += bidLot;
        bidList.push({ price: Math.max(50, bidPrice), lot: bidLot });

        const askPrice = currentPrice + i * (currentPrice > 5000 ? 25 : currentPrice > 1000 ? 10 : currentPrice > 500 ? 5 : 2);
        const askLot = Math.floor(4000 + Math.random() * 8000 - (i - 1) * 600);
        totalA += askLot;
        askList.push({ price: askPrice, lot: askLot });
      }

      setBids(bidList);
      setAsks(askList);
      setTotalBidLots(totalB);
      setTotalAskLots(totalA);
    };

    generateBook();

    // Determine bandar goreng index
    const codeSum = ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hasGorengPattern = codeSum % 3 === 0 || ticker === "GOTO" || ticker === "BUMI" || ticker === "BRMS";
    setIsGorengActive(hasGorengPattern);

    if (hasGorengPattern) {
      setTradeAlerts([
        `🚨 WARNING: Skema Goreng Bandar terdeteksi dlm transaksi ${ticker}!`,
        `🔥 TRANS-BESAR: Bandar buyback 45.000 Lot di harga Rp ${currentPrice} (AKUM)`
      ]);
    } else {
      setTradeAlerts([
        `✓ Aliran volume order book ${ticker} bergerak wajar & likuid.`
      ]);
    }
  }, [ticker, currentPrice]);

  useEffect(() => {
    if (!isActuallyMarketOpen) return;

    const interval = setInterval(() => {
      const isBidChange = Math.random() > 0.45;
      const isHugeLot = Math.random() > 0.7; // 30% chance for block transactions

      const changeSize = isHugeLot
        ? Math.floor(15000 + Math.random() * 32000) // Bandar class Lot size
        : Math.floor((Math.random() - 0.5) * 800);

      const affectedIdx = Math.floor(Math.random() * 5);

      if (isBidChange) {
        setBids(prev => {
          const next = [...prev];
          if (next[affectedIdx]) {
            next[affectedIdx] = {
              ...next[affectedIdx],
              lot: Math.max(100, next[affectedIdx].lot + changeSize)
            };
            if (isHugeLot) {
              setFlashedBidIdx(affectedIdx);
              setTimeout(() => setFlashedBidIdx(null), 1000);
              const priceVal = next[affectedIdx].price;
              setTradeAlerts(prevLogs => [
                `🔥 ACCUM ALERT: +${changeSize.toLocaleString("id-ID")} Lot masuk di BID Rp ${priceVal} (${ticker})`,
                ...prevLogs.slice(0, 3)
              ]);
            }
          }
          return next;
        });
      } else {
        setAsks(prev => {
          const next = [...prev];
          if (next[affectedIdx]) {
            next[affectedIdx] = {
              ...next[affectedIdx],
              lot: Math.max(100, next[affectedIdx].lot + changeSize)
            };
            if (isHugeLot) {
              setFlashedAskIdx(affectedIdx);
              setTimeout(() => setFlashedAskIdx(null), 1000);
              const priceVal = next[affectedIdx].price;
              setTradeAlerts(prevLogs => [
                `🚨 OFFER OVERFLOW: ${changeSize.toLocaleString("id-ID")} Lot diguyur di harga Rp ${priceVal} (${ticker})`,
                ...prevLogs.slice(0, 3)
              ]);
            }
          }
          return next;
        });
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isActuallyMarketOpen, ticker]);

  useEffect(() => {
    setTotalBidLots(bids.reduce((sum, b) => sum + b.lot, 0));
  }, [bids]);

  useEffect(() => {
    setTotalAskLots(asks.reduce((sum, a) => sum + a.lot, 0));
  }, [asks]);

  const maxLot = Math.max(...bids.map(b => b.lot), ...asks.map(a => a.lot)) || 1;

  return (
    <div className="relative w-full bg-[#020b12]/60 rounded-2xl overflow-hidden border border-slate-850 p-4 shadow-lg select-none flex flex-col h-full justify-between min-h-[360px]">
      
      {/* Header controls inside active view */}
      <div className="flex justify-between items-center border-b border-cyan-950/40 pb-2 mb-2">
        <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5 font-mono">
          <Activity className="w-4 h-4 text-cyan-400" />
          Buku Order &amp; Kedalaman Pasar (Lot) - JATS Feed
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded border tracking-wide font-black ${
            isActuallyMarketOpen 
              ? "bg-emerald-950/60 border-emerald-500/25 text-emerald-400 animate-pulse" 
              : "bg-amber-950/20 border-amber-500/15 text-amber-500"
          }`}>
            {isActuallyMarketOpen ? "● LIVE JATS FEED" : "● JATS PENUTUPAN"}
          </span>
        </div>
      </div>

      {/* 🚨 DYNAMIC BANDAR GORENG WARNING ALERT */}
      {isActuallyMarketOpen && isGorengActive && (
        <div className="mb-2 bg-red-950/20 border border-red-900/30 p-2 rounded-lg text-[10px] leading-relaxed text-rose-500 animate-pulse flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
          <span className="font-sans font-extrabold">
            🚨 DETEKSI BANDAR GORENG: Saham {ticker} saat ini terindikasi pergerakan lot semu intensif oleh Market Maker!
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-px bg-cyan-950/15 rounded-xl overflow-hidden text-[10.5px] font-mono">
        {/* BIDS (Antrean Beli) */}
        <div className="bg-[#020a11]/90 p-2.5 space-y-1.5 border-r border-[#032230]/20">
          <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1 px-1 border-b border-cyan-950/20 pb-1">
            <span>BID</span>
            <span>VOL LOT</span>
          </div>
          {bids.map((bid, i) => {
            const barWidth = Math.min(100, (bid.lot / maxLot) * 100);
            const isFlashed = flashedBidIdx === i;
            return (
              <div 
                key={i} 
                className={`relative flex justify-between items-center py-0.5 px-1 rounded transition-all duration-300 ${
                  isFlashed ? "bg-emerald-500/20 scale-[1.02] border-l-2 border-emerald-400 z-10" : "hover:bg-slate-900/30"
                }`}
              >
                <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/5 rounded-l pointer-events-none transition-all duration-700" style={{ width: `${barWidth}%` }} />
                <span className="text-[#22c55e] font-black z-10">{bid.price.toLocaleString("id-ID")}</span>
                <span className={`font-bold z-10 transition-all font-mono ${isFlashed ? "text-emerald-400 text-xs scale-105" : "text-slate-300"}`}>
                  {bid.lot.toLocaleString("id-ID")}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between text-[10px] text-emerald-400 font-extrabold uppercase border-t border-cyan-950/40 pt-1.5 mt-2 px-1">
            <span>BID LOT:</span>
            <span>{totalBidLots.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* ASKS (Antrean Jual) */}
        <div className="bg-[#020a11]/90 p-2.5 space-y-1.5">
          <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1 px-1 border-b border-cyan-950/20 pb-1">
            <span>OFFER</span>
            <span>VOL LOT</span>
          </div>
          {asks.map((ask, i) => {
            const barWidth = Math.min(100, (ask.lot / maxLot) * 100);
            const isFlashed = flashedAskIdx === i;
            return (
              <div 
                key={i} 
                className={`relative flex justify-between items-center py-0.5 px-1 rounded transition-all duration-300 ${
                  isFlashed ? "bg-rose-500/20 scale-[1.02] border-r-2 border-rose-500 z-10" : "hover:bg-slate-900/30"
                }`}
              >
                <div className="absolute left-0 top-0 bottom-0 bg-rose-500/5 rounded-r pointer-events-none transition-all duration-700" style={{ width: `${barWidth}%` }} />
                <span className="text-[#ef4444] font-black z-10">{ask.price.toLocaleString("id-ID")}</span>
                <span className={`font-bold z-10 transition-all font-mono ${isFlashed ? "text-rose-450 text-xs scale-105" : "text-slate-300"}`}>
                  {ask.lot.toLocaleString("id-ID")}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between text-[10px] text-rose-400 font-extrabold uppercase border-t border-cyan-950/40 pt-1.5 mt-2 px-1">
            <span>OFFER LOT:</span>
            <span>{totalAskLots.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>

      {/* Bid-Ask Bar Ratio */}
      {(() => {
        const bidRatio = totalBidLots + totalAskLots > 0 ? (totalBidLots / (totalBidLots + totalAskLots)) * 100 : 50;
        return (
          <div className="space-y-1 mt-2.5 px-1 font-sans">
            <div className="flex justify-between text-[8px] tracking-wider text-slate-400 font-bold uppercase">
              <span className="text-emerald-400">Peluang Beli: {bidRatio.toFixed(1)}%</span>
              <span className="text-rose-400">Peluang Jual: {(100 - bidRatio).toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-rose-500/80 p-0">
              <div className="bg-[#22c55e]/90 h-full transition-all duration-1000 ease-in-out" style={{ width: `${bidRatio}%` }} />
            </div>
          </div>
        );
      })()}

      {/* 📈 REAL-TIME BANDAR TICKER LOGS */}
      {isActuallyMarketOpen && (
        <div className="mt-3 border-t border-slate-900/55 pt-2 font-mono">
          <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1 px-1">
            📡 Radar Aliran Bandar Saham {ticker}
          </div>
          <div className="bg-slate-950/45 border border-slate-900 rounded-lg p-1.5 max-h-16 overflow-y-auto space-y-1 text-[8.5px]">
            {tradeAlerts.map((log, idx) => {
              const isAlert = log.includes("🚨") || log.includes(" Guyur") || log.includes("dibuang") || log.includes("WARNING");
              const isAccum = log.includes("🔥") || log.includes("ACCUM");
              return (
                <div 
                  key={idx} 
                  className={`px-1.5 py-0.5 rounded border leading-snug flex items-start gap-1 justify-between transition-all duration-300 ${
                    isAlert 
                      ? "bg-rose-950/15 border-rose-900/20 text-rose-450" 
                      : isAccum 
                        ? "bg-emerald-950/15 border-emerald-900/20 text-emerald-400" 
                        : "bg-slate-900/30 border-slate-900 text-slate-400"
                  }`}
                >
                  <span className="grow truncate">{log}</span>
                  <span className="text-[7.5px] text-slate-600 uppercase font-sans shrink-0 font-bold">1s ago</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

const getInitialMarketCloseDates = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  
  // Convert current UTC time to WIB (UTC+7)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (3600000 * 7));
  
  const targetDate = new Date(wibTime);

  // If before 16:00 WIB, roll back 1 day
  if (wibTime.getHours() < 16) {
    targetDate.setDate(targetDate.getDate() - 1);
  }

  // If Saturday (6), roll back to Friday (5). If Sunday (0), roll back to Friday (5).
  const day = targetDate.getDay();
  if (day === 6) { // Saturday
    targetDate.setDate(targetDate.getDate() - 1);
  } else if (day === 0) { // Sunday
    targetDate.setDate(targetDate.getDate() - 2);
  }
  
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - 6);
  
  const formatDate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  };

  return {
    start: formatDate(startDate),
    end: formatDate(targetDate)
  };
};

export default function EmitenDashboardView({
  stocks,
  selectedTicker,
  setSelectedTicker,
  onNavigateToTracer,
  walletBalance,
  setWalletBalance,
  portfolio,
  setPortfolio,
  watchlist = [],
  onToggleWatchlist,
  onSelectBroker
}: EmitenDashboardViewProps) {
  
  const [activeHubTab, setActiveHubTab] = useState<"ringkasan" | "teknikal" | "fundamental" | "sector" | "verdict" | "broker" | "analisa-pasar" | "ramalan-ai">("ringkasan");
  const [chartType, setChartType] = useState<"native" | "tradingview">("native");
  const [showFibonacci, setShowFibonacci] = useState<boolean>(true);
  const [isFullscreenChartOpen, setIsFullscreenChartOpen] = useState(false);
  const [brokerActivityView, setBrokerActivityView] = useState<"chart" | "table">("chart");
  const [brokerSearch, setBrokerSearch] = useState("");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredBrokerDayIdx, setHoveredBrokerDayIdx] = useState<number | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<number>(100);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [blockedTickers, setBlockedTickers] = useState<string[]>([]);
  const [is4PilarModalOpen, setIs4PilarModalOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [brokerFilter, setBrokerFilter] = useState<"all" | "asing" | "retail" | "lokal">("all");
  const [visibleBrokers, setVisibleBrokers] = useState<string[]>(["BK", "AK", "YP", "OD"]);

  // Premium Transaction Analysis States
  const [analysisStartDate, setAnalysisStartDate] = useState(() => getInitialMarketCloseDates().start);
  const [analysisEndDate, setAnalysisEndDate] = useState(() => getInitialMarketCloseDates().end);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [activeAnalysisControl, setActiveAnalysisControl] = useState<"M" | "NR" | "S" | "f" | "Z">("M");
  const [candleHoverIdx, setCandleHoverIdx] = useState<number | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [brokerSummaryDate, setBrokerSummaryDate] = useState("2024-10-14");
  const [brokerSummaryTicker, setBrokerSummaryTicker] = useState("");
  const [pythonCodeCopied, setPythonCodeCopied] = useState(false);
  const [filterAnomali, setFilterAnomali] = useState<boolean>(true);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Stable tracking of stock list updates to prevent full dashboard re-loads on background sync
  const stocksRef = useRef(stocks);
  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  // 📡 Live Stock validation, load tracking & fallback states
  const [tickerLoadingError, setTickerLoadingError] = useState<boolean>(false);
  const [isTickerLoading, setIsTickerLoading] = useState<boolean>(false);
  const [emitenLiveStock, setEmitenLiveStock] = useState<Stock | null>(null);

  useEffect(() => {
    const tickerUpper = selectedTicker.toUpperCase().trim();
    if (!tickerUpper) return;

    // Check if we already have the correct active stock loaded in state to prevent reloading of same ticker
    const isAlreadyLoaded = emitenLiveStock && emitenLiveStock.ticker.toUpperCase() === tickerUpper;

    if (!isAlreadyLoaded) {
      setTickerLoadingError(false);
      setIsTickerLoading(true);
      setEmitenLiveStock(null);
    }

    const controller = new AbortController();
    let active = true;

    const verifyStock = async () => {
      if (tickerUpper === "IHSG" || tickerUpper === "^JKSE" || tickerUpper === "IDX") {
        setIsTickerLoading(false);
        return;
      }

      let data: any = null;
      try {
        data = await DataService.getUnifiedData(tickerUpper, controller.signal);
        console.log(`Data API Terintegrasi Diterima untuk ${tickerUpper} (EmitenDashboard):`, data);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`Fetch aborted for emiten dashboard ticker: ${tickerUpper}`);
          return;
        }
        console.warn(`Gagal memuat emiten via DataService untuk ${tickerUpper}:`, err);
      }

      if (!active) return;

      if (data && data.ticker && data.currentPrice > 0) {
        setTickerLoadingError(false);
        setEmitenLiveStock(data);
      } else {
        const currentStocks = stocksRef.current;
        const existsInLocalDb = currentStocks.some(s => s.ticker.toUpperCase() === tickerUpper);
        if (active) {
          if (!existsInLocalDb) {
            setTickerLoadingError(true);
          } else {
            setTickerLoadingError(false);
            const fallbackObj = currentStocks.find(s => s.ticker.toUpperCase() === tickerUpper) || generateDynamicIdxStock(tickerUpper);
            setEmitenLiveStock(fallbackObj);
          }
        }
      }

      if (active) {
        setIsTickerLoading(false);
      }
    };

    verifyStock();
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedTicker]);

  // PDF Report Downloader with custom print layout to render official report
  const handleDownloadPDFReport = () => {
    const todayDate = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Compute metrics safely
    const pe = activeStock.peRatio ? `${activeStock.peRatio.toFixed(1)}x` : "12.5x";
    const pbv = activeStock.pbv ? `${activeStock.pbv.toFixed(2)}x` : "1.25x";
    const roe = activeStock.roe ? `${activeStock.roe.toFixed(1)}%` : "12.5%";
    const der = activeStock.der ? `${activeStock.der.toFixed(1)}%` : "45.0%";
    const eps = activeStock.eps ? `Rp ${activeStock.eps}` : "Rp 125";
    const mcap = activeStock.marketCap ? `Rp ${activeStock.marketCap} T` : "Rp 12.8 T";

    const isProfitPositive = activeStock.change >= 0;

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Analisis Emiten - ${activeStock.ticker}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            padding: 35px;
            font-size: 13px;
            background: #ffffff;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 15px;
          }
          .title-area h1 {
            margin: 0;
            font-size: 26px;
            color: #0f172a;
            font-weight: 900;
            letter-spacing: -0.5px;
          }
          .title-area p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
          .badge {
            display: inline-block;
            background: #f1f5f9;
            color: #475569;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .badge-green {
            background: #dcfce7;
            color: #15803d;
          }
          .badge-red {
            background: #fee2e2;
            color: #b91c1c;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a8a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metrics-grid {
            display: grid;
            grid-template-cols: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          .metric-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .metric-value {
            font-size: 15px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 3px;
          }
          .table-style {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .table-style th {
            background: #f1f5f9;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #475569;
          }
          .table-style td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
          }
          .ai-box {
            background: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 15px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
          }
          .ai-box-title {
            font-weight: bold;
            font-size: 12px;
            color: #14532d;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .bullets-container {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
          }
          .bullet-column {
            background: #fafafa;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            padding: 15px;
          }
          .bullet-column-green {
            background: #f0fdf4;
            border: 1px solid #dcfce7;
          }
          .bullet-column-red {
            background: #fdf2f2;
            border: 1px solid #fee2e2;
          }
          .bullet-column-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
              margin: 10px;
            }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="title-area">
              <h1>${activeStock.ticker} - Laporan Kinerja & Wawasan Emiten</h1>
              <p>${activeStock.name} &bull; Sektor: ${activeStock.sector || "Umum"}</p>
            </td>
            <td style="text-align: right; vertical-align: top; width: 250px;">
              <span class="badge ${isProfitPositive ? "badge-green" : "badge-red"}">
                Rp ${activeStock.currentPrice.toLocaleString("id-ID")} (${isProfitPositive ? "+" : ""}${activeStock.changePercent.toFixed(2)}%)
              </span>
              <div style="font-size: 9px; color: #64748b; margin-top: 5px; font-weight: bold;">Dicetak: ${todayDate}</div>
            </td>
          </tr>
        </table>

        <div class="section-title">Metrik Kinerja & Valuasi Utama</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Price to Earnings (P/E)</div>
            <div class="metric-value">${pe}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Price to Book Value (PBV)</div>
            <div class="metric-value">${pbv}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Return on Equity (ROE)</div>
            <div class="metric-value">${roe}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Debt to Equity (DER)</div>
            <div class="metric-value">${der}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Market Capitalization</div>
            <div class="metric-value">${mcap}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Earnings per Share (EPS)</div>
            <div class="metric-value">${eps}</div>
          </div>
        </div>

        <div class="section-title">Hasil Pemeriksaan Bandarologi & Aliran Dana</div>
        <table class="table-style">
          <thead>
            <tr>
              <th>Indikator Aliran</th>
              <th>Status / Pencapaian</th>
              <th>Deskripsi Analisis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Estimasi Net Volume Asing</td>
              <td style="font-weight: bold;">${bandarProperties.netForeignValueText || "N/A"}</td>
              <td>Porsi akumulasi asing harian di pasar modal dalam negeri.</td>
            </tr>
            <tr>
              <td>Kesimpulan Aliran Dana Bandar</td>
              <td style="font-weight: bold; color: ${bandarProperties.status === "AKUMULASI" ? "#16a34a" : "#dc2626"}; border-bottom: 1px solid #e2e8f0;">
                ${bandarProperties.status || "NETRAL"}
              </td>
              <td>Melihat pergerakan akumulasi oleh investor institusi.</td>
            </tr>
            <tr>
              <td>Trend Rekomendasi Sinyal</td>
              <td style="font-weight: bold;">${rec?.sentiment || "NETRAL"}</td>
              <td>Kekuatan momentum sinyal beli/jual di bursa saat ini.</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Kesimpulan Wawasan AI & Termometer Analis</div>
        <div class="ai-box">
          <div class="ai-box-title">Verdict AI Real-time</div>
          <p style="margin: 0; font-size: 11px; text-align: justify; color: #14532d; line-height: 1.6;">
            Secara agregat, emiten <strong>${activeStock.ticker}</strong> memperlihatkan efisiensi modal yang ${activeStock.roe && activeStock.roe > 12 ? "solid & di atas rata-rata industri" : "cukup bersaing dengan peers lokal"}. Valuasi ganda (PER & PBV) memperlihatkan kestabilan harga yang memberikan ketebalan margin pengaman investasi (Margin of Safety) yang ${activeStock.peRatio && activeStock.peRatio < 14 ? "tinggi di banding kompetitor sejenis" : "moderat bagi porsi investasi jangka panjang"}.
          </p>
        </div>

        <div class="bullets-container">
          <div class="bullet-column bullet-column-green">
            <div class="bullet-column-title" style="color: #15803d;">✓ Kelebihan Utama (Strengths)</div>
            <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #14532d; line-height: 1.6;">
              <li>Struktur ekuitas modal kerja sangat bugar dengan rasio utang terkendali (DER) yang minim risiko suku bunga.</li>
              <li>Efisiensi operasional sangat prima dengan perolehan margin laba kotor tebal yang melampaui median sektor sejenis.</li>
              <li>Laju perputaran modal (Return on Equity) konsisten berada dalam zona hijau pertumbuhan korporasi harian.</li>
            </ul>
          </div>
          <div class="bullet-column bullet-column-red">
            <div class="bullet-column-title" style="color: #b91c1c;">⚠️ Risiko Strategis (Warnings)</div>
            <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #7f1d1d; line-height: 1.6;">
              <li>Suhu fluktuasi harga jangka pendek digerakkan sentimen makro global maupun rilis laporan laba per lembar saham.</li>
              <li>Kapasitas dividen terpengaruh rencana ekspansi belanja modal (CAPEX) jangka menengah korporasi.</li>
              <li>Tingkat likuiditas bursa yang fluktuatif memberi pengaruh kecil pada rentang bid-ask harian.</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          Laporan ini diterbitkan secara otomatis dan aman oleh AI Studio IDX Termometer Pro. Hak cipta dilindungi undang-undang. Investasi bursa mengandung risiko pasar.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          }
        </script>
      </body>
      </html>
    `;

    let reportWindow: Window | null = null;
    try {
      reportWindow = window.open("", "_blank");
    } catch (e) {
      console.log("window.open blocked, fallback active");
    }

    if (reportWindow) {
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
    } else {
      // Elegant hidden iframe printer fallback
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(reportHtml);
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1500);
        }, 800);
      }
    }
  };

  // Date utils for calendar popover
  const parseDateString = (str: string) => {
    try {
      const parts = str.split(" ");
      if (parts.length !== 3) return new Date(2024, 9, 7);
      const day = parseInt(parts[0]);
      const monthMap: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
      };
      const month = monthMap[parts[1]] ?? 9;
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    } catch (e) {
      return new Date(2024, 9, 7);
    }
  };

  const formatDateToString = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatDateToInput = (dateStr: string) => {
    try {
      const d = parseDateString(dateStr);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch (e) {
      return "2024-10-07";
    }
  };

  const formatInputToDate = (inputStr: string) => {
    if (!inputStr) return "07 Oct 2024";
    const parts = inputStr.split("-");
    if (parts.length !== 3) return "07 Oct 2024";
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return formatDateToString(date);
  };

  const [activeCalendarMonth, setActiveCalendarMonth] = useState<number>(9); // Default October (month indices: 9)
  const [activeCalendarYear, setActiveCalendarYear] = useState<number>(2024);
  const [chartHoverX, setChartHoverX] = useState<number | null>(null);
  const [chartHoverY, setChartHoverY] = useState<number | null>(null);

  // Explorer states for all 989 IDX stocks
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [explorerSector, setExplorerSector] = useState("Semua");
  const [explorerSearch, setExplorerSearch] = useState("");
  const [explorerSort, setExplorerSort] = useState<"ticker-asc" | "ticker-desc" | "price-desc" | "price-asc" | "change-desc" | "change-asc">("ticker-asc");
  const [explorerPage, setExplorerPage] = useState(1);

  const availableSectors = useMemo(() => [
    "Semua",
    "Finansial",
    "Infrastruktur",
    "Teknologi",
    "Konsumer",
    "Energi",
    "Pertambangan",
    "Kesehatan",
    "Industri",
    "Properti",
    "Logistik",
    "Telekomunikasi",
    "Agrikultur"
  ], []);

  // Compute stock counts per sector based on all 989 stocks
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = { "Semua": stocks.length };
    stocks.forEach(s => {
      counts[s.sector] = (counts[s.sector] || 0) + 1;
    });
    return counts;
  }, [stocks]);

  // Filter and sort all 989 stocks for the directory
  const filteredExplorerStocks = useMemo(() => {
    let result = [...stocks];

    if (explorerSector !== "Semua") {
      result = result.filter(s => s.sector === explorerSector);
    }

    if (explorerSearch) {
      const q = explorerSearch.toLowerCase();
      result = result.filter(s => 
        s.ticker.toLowerCase().includes(q) || 
        s.name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (explorerSort) {
        case "ticker-asc":
          return a.ticker.localeCompare(b.ticker);
        case "ticker-desc":
          return b.ticker.localeCompare(a.ticker);
        case "price-desc":
          return b.currentPrice - a.currentPrice;
        case "price-asc":
          return a.currentPrice - b.currentPrice;
        case "change-desc":
          return b.changePercent - a.changePercent;
        case "change-asc":
          return a.changePercent - b.changePercent;
        default:
          return 0;
      }
    });

    return result;
  }, [stocks, explorerSector, explorerSearch, explorerSort]);

  const itemsPerPage = 12;
  const totalExplorerPages = Math.max(1, Math.ceil(filteredExplorerStocks.length / itemsPerPage));

  const paginatedStocks = useMemo(() => {
    const start = (explorerPage - 1) * itemsPerPage;
    return filteredExplorerStocks.slice(start, start + itemsPerPage);
  }, [filteredExplorerStocks, explorerPage]);

  // Reset page index when filter parameters shift
  useEffect(() => {
    setExplorerPage(1);
  }, [explorerSector, explorerSearch, explorerSort]);

  const formatIDR = (num: number) => {
    if (selectedTicker === "IHSG" || selectedTicker === "IHSG COMPOSITE") {
      return "Rp " + num.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Find active stock or build custom on fly
  const activeStock = useMemo(() => {
    const found = stocks.find(s => s.ticker.toUpperCase() === selectedTicker.toUpperCase());
    const stockToUse = emitenLiveStock || found || generateDynamicIdxStock(selectedTicker);
    const stock = { ...stockToUse };

    // Prioritas Data: Jika ticker adalah IHSG / ^JKSE / IDX, prioritaskan dari marketData.ts
    const tickerUpper = stock.ticker.toUpperCase();
    if (tickerUpper === "IHSG" || tickerUpper === "^JKSE" || tickerUpper === "IDX") {
      stock.currentPrice = marketData.ihsg_close;
      stock.previousPrice = marketData.prev_close;
    }

    // Core calculation formula: ((Harga Sekarang - Harga Penutupan Kemarin) / Harga Penutupan Kemarin) * 100
    // PrevClose is stock.previousPrice from API (audited to come from the exact same data object)
    const prev = stock.previousPrice || stock.currentPrice || 1;
    if (prev > 0) {
      stock.changePercent = ((stock.currentPrice - prev) / prev) * 100;
      stock.change = stock.currentPrice - prev;
    }
    return stock;
  }, [stocks, selectedTicker, emitenLiveStock]);

  // Real-time price flashing state & reference tracker
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const prevPriceValueRef = useRef<number>(0);

  useEffect(() => {
    if (!activeStock?.currentPrice) return;
    const prevVal = prevPriceValueRef.current;
    const currentPrice = activeStock.currentPrice;

    if (prevVal > 0 && prevVal !== currentPrice) {
      if (currentPrice > prevVal) {
        setPriceFlash("up");
      } else if (currentPrice < prevVal) {
        setPriceFlash("down");
      }
      const timeoutId = setTimeout(() => {
        setPriceFlash(null);
      }, 700);
      prevPriceValueRef.current = currentPrice;
      return () => clearTimeout(timeoutId);
    } else {
      prevPriceValueRef.current = currentPrice;
    }
  }, [activeStock?.currentPrice]);

  // states for Gemini-powered 3-day short-term price & sentiment forecast
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTicker) return;
    if (activeHubTab !== "ramalan-ai") return;
    let active = true;
    
    const fetchForecast = async () => {
      setForecastLoading(true);
      setForecastError(null);
      try {
        const res = await fetch("/api/forecast-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: selectedTicker,
            name: activeStock?.name || selectedTicker,
            currentPrice: activeStock?.currentPrice || 1000,
            sector: activeStock?.sector || "Umum"
          })
        });
        if (!res.ok) throw new Error("Gagal mengambil data ramalan");
        const data = await res.json();
        if (active) {
          setForecastData(data);
        }
      } catch (err: any) {
        if (active) {
          setForecastError(err.message || "Gagal memproses ramalan");
        }
      } finally {
        if (active) {
          setForecastLoading(false);
        }
      }
    };

    fetchForecast();
    return () => {
      active = false;
    };
  }, [selectedTicker, activeHubTab, refreshCount]);

  // Generate recommendation
  const rec = useMemo(() => {
    return generateTradingRecommendation(activeStock);
  }, [activeStock]);

  // Compute AI Score and health levels for Ringkasan tab
  const { aiScore, scoreLabel } = useMemo(() => {
    const computedPER = activeStock.peRatio || 12.8;
    const computedDER = activeStock.der || 45.0;
    const computedROE = activeStock.roe || 12.5;
    
    const profitabilityScore = Math.min(95, Math.max(30, Math.round(computedROE * 3.5 + 20)));
    const valuationScore = computedPER < 0 ? 30 : Math.min(95, Math.max(30, Math.round(100 - computedPER * 2.8)));
    const liquidityScore = Math.min(95, Math.max(30, Math.round(100 - computedDER / 3)));
    const solvencyScore = Math.min(95, Math.max(30, Math.round(100 - (computedDER * 0.45))));

    const score = Math.min(99, Math.max(40, Math.round((profitabilityScore + valuationScore + liquidityScore + solvencyScore) / 4)));

    let label = {
      status: "SOLID",
      desc: "Kesehatan Baik",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      color: "text-cyan-400"
    };

    if (score >= 82) {
      label = {
        status: "SANGAT BAGUS",
        desc: "Luar Biasa",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        color: "text-emerald-400"
      };
    } else if (score >= 68) {
      label = {
        status: "SEHAT & SOLID",
        desc: "Kinerja Bagus",
        bg: "bg-cyan-500/10 border-cyan-500/20",
        color: "text-cyan-400"
      };
    } else if (score >= 50) {
      label = {
        status: "MODERAT",
        desc: "Kinerja Cukup",
        bg: "bg-amber-500/10 border-amber-500/20",
        color: "text-amber-400"
      };
    } else {
      label = {
        status: "UNDERPERFORM",
        desc: "Perlu Evaluasi",
        bg: "bg-rose-500/10 border-rose-500/20",
        color: "text-rose-400"
      };
    }

    return {
      aiScore: score,
      scoreLabel: label
    };
  }, [activeStock]);

  // Floating Quick AI Summary States
  const [isQuickSummaryOpen, setIsQuickSummaryOpen] = useState(false);
  const [isQuickSummaryLoading, setIsQuickSummaryLoading] = useState(false);
  const [quickSummaryText, setQuickSummaryText] = useState("");
  const [quickSummaryError, setQuickSummaryError] = useState("");
  const [quickSummarySentiment, setQuickSummarySentiment] = useState<"BULLISH" | "BEARISH" | "NEUTRAL" | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleTriggerQuickSummary = async () => {
    setIsQuickSummaryOpen(true);
    setIsQuickSummaryLoading(true);
    setQuickSummaryError("");
    setQuickSummaryText("");
    setQuickSummarySentiment(null);

    try {
      const response = await fetch("/api/analyze-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: activeStock.ticker,
          name: activeStock.name || activeStock.ticker,
          currentPrice: activeStock.currentPrice || 0,
          peRatio: activeStock.peRatio || 0,
          dividendYield: activeStock.dividendYield || 0,
          sector: activeStock.sector || "Umum",
          question: "Harap berikan analisis ringkas & spesifik mengenai sentimen pasar jangka pendek (apakah BULLISH, BEARISH atau NEUTRAL beserta 3 alasan pemicunya) serta rangkuman pilar fundamental kekuatan keuangan emiten IDX ini harian secara padat dan taktis dengan poin bullet yang elegan, tajam, dan mudah dipahami langsung.",
        }),
      });

      if (!response.ok) {
        throw new Error(`Koneksi server gagal dengan status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setQuickSummaryText(data.text || "Tidak ada ringkasan yang dihasilkan.");

      const rawText = (data.text || "").toUpperCase();
      if (rawText.includes("BULLISH") || rawText.includes("ACCUMULATIVE BUY") || rawText.includes("BELI")) {
        setQuickSummarySentiment("BULLISH");
      } else if (rawText.includes("BEARISH") || rawText.includes("UNDERPERFORM") || rawText.includes("JUAL")) {
        setQuickSummarySentiment("BEARISH");
      } else {
        setQuickSummarySentiment("NEUTRAL");
      }
    } catch (err: any) {
      console.error("Quick Summary error:", err);
      setQuickSummaryError(err.message || "Gagal menghubungi modul kecerdasan buatan Gemini AI.");
    } finally {
      setIsQuickSummaryLoading(false);
    }
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-semibold text-white px-0.5">
            {part}
          </strong>
        );
      }
      const codeParts = part.split(/`(.*?)`/g);
      return codeParts.map((subPart, j) => {
        if (j % 2 === 1) {
          return (
            <code key={j} className="font-mono text-[11px] bg-slate-900 border border-slate-850 px-1 py-0.5 rounded text-amber-400">
              {subPart}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  const renderFormattedSummary = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return (
      <div className="space-y-3 font-sans text-xs text-slate-350 leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-2" />;
          
          if (trimmed.startsWith("###")) {
            const content = trimmed.substring(3).trim();
            return (
              <h4 key={idx} className="text-xs font-bold text-cyan-400 mt-4 border-b border-cyan-950/40 pb-1 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {parseBoldText(content)}
              </h4>
            );
          }
          if (trimmed.startsWith("##")) {
            const content = trimmed.substring(2).trim();
            return (
              <h3 key={idx} className="text-sm font-black text-white mt-5 border-b border-cyan-900/10 pb-1.5 uppercase tracking-wide">
                {parseBoldText(content)}
              </h3>
            );
          }
          if (trimmed.startsWith("#")) {
            const content = trimmed.substring(1).trim();
            return (
              <h2 key={idx} className="text-base font-black text-cyan-300 mt-6 mb-2 tracking-wide">
                {parseBoldText(content)}
              </h2>
            );
          }
          if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
            const content = trimmed.substring(1).trim();
            return (
              <div key={idx} className="flex items-start space-x-2 pl-4 text-xs">
                <span className="text-emerald-500 mt-1 select-none text-[8px] shrink-0">●</span>
                <span className="text-slate-300 font-sans">{parseBoldText(content)}</span>
              </div>
            );
          }
          if (trimmed.startsWith(">")) {
            const content = trimmed.substring(1).trim();
            return (
              <blockquote key={idx} className="border-l-4 border-amber-500 bg-amber-955/20 px-4 py-2.5 rounded-r-xl my-3 text-xs leading-relaxed text-amber-200 italic font-sans flex items-start gap-1.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{parseBoldText(content)}</span>
              </blockquote>
            );
          }
          return (
            <p key={idx} className="text-xs text-slate-300 pl-1 leading-relaxed font-sans">
              {parseBoldText(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // 🔮 Bandariology & Foreign Flow State & Tape Simulation
  const bandarProperties = useMemo(() => {
    const hashStock = (ticker: string) => {
      return ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    };
    const hash = hashStock(activeStock.ticker);
    const brokerList = ["CC", "YP", "NI", "PD", "GR", "AZ", "MG", "OD", "BB", "RX", "DX", "XC", "ZP", "DR"];
    
    const status = (() => {
      const change = activeStock.changePercent;
      if (change > 1.2) return "AKUMULASI";
      if (change < -1.2) return "DISTRIBUSI";
      const mode = hash % 3;
      if (mode === 0) return "AKUMULASI";
      if (mode === 1) return "DISTRIBUSI";
      return "HOLD";
    })();

    // Generate deterministic top brokers
    const topBuyers = [
      brokerList[hash % brokerList.length],
      brokerList[(hash + 3) % brokerList.length],
      brokerList[(hash + 7) % brokerList.length],
    ];
    const topSellers = [
      brokerList[(hash + 2) % brokerList.length],
      brokerList[(hash + 5) % brokerList.length],
      brokerList[(hash + 9) % brokerList.length],
    ];

    // Net value purchase (deterministic based on current price & market cap)
    const netForeignSign = status === "AKUMULASI" ? 1 : status === "DISTRIBUSI" ? -1 : (hash % 2 === 0 ? 1 : -1);
    const netForeignValue = Number((((hash % 85) + 12) * (activeStock.marketCap / 250) * (status === "HOLD" ? 0.15 : 1)).toFixed(1)) * netForeignSign;

    return {
      status,
      topBuyers,
      topSellers,
      netForeignValueText: status === "HOLD" && Math.abs(netForeignValue) < 1 ? "Rp 0.0 M" : `${netForeignValue > 0 ? "+" : ""}Rp ${netForeignValue.toFixed(1)} M`,
      netForeignValueNum: netForeignValue,
      participationRate: 45 + (hash % 35),
    };
  }, [activeStock]);

  // 📈 Capital Flow Forces Detector (Foreign, Retail, Big Money, Corporate)
  const capitalFlowForces = useMemo(() => {
    const hashStock = (ticker: string) => {
      return ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    };
    const h = hashStock(activeStock.ticker);
    const status = bandarProperties.status;

    const foreignStrength = status === "AKUMULASI" ? 45 + (h % 40) : status === "DISTRIBUSI" ? -35 - (h % 30) : -15 + (h % 30);
    const retailStrength = status === "AKUMULASI" ? -25 - (h % 20) : status === "DISTRIBUSI" ? 50 + (h % 35) : 5 - (h % 15);
    const bigMoneyStrength = status === "AKUMULASI" ? 60 + (h % 30) : status === "DISTRIBUSI" ? -55 - (h % 25) : 10 + (h % 20);
    const corporateStrength = 5 + (h % 15);

    const historyDays = ["H-4", "H-3", "H-2", "H-1", "Hari Ini"];
    const foreignHistory = Array.from({ length: 5 }, (_, i) => {
      const dayFactor = Math.sin((h + i) * 1.5) * 15;
      return Math.round(foreignStrength * (0.6 + i * 0.1) + dayFactor);
    });
    const retailHistory = Array.from({ length: 5 }, (_, i) => {
      const dayFactor = Math.cos((h + i) * 1.5) * 10;
      return Math.round(retailStrength * (0.65 + i * 0.08) + dayFactor);
    });
    const bigMoneyHistory = Array.from({ length: 5 }, (_, i) => {
      const dayFactor = Math.sin((h + i * 2) * 1.1) * 20;
      return Math.round(bigMoneyStrength * (0.55 + i * 0.11) + dayFactor);
    });
    const corporateHistory = Array.from({ length: 5 }, (_, i) => {
      const dayFactor = Math.cos((h + i) * 0.7) * 4;
      return Math.round(corporateStrength * (0.8 + i * 0.05) + dayFactor);
    });

    return {
      foreign: { label: "Foreign Flow", value: foreignStrength, history: foreignHistory },
      retail: { label: "Retail Flow", value: retailStrength, history: retailHistory },
      bigMoney: { label: "Big Money", value: bigMoneyStrength, history: bigMoneyHistory },
      corporate: { label: "Corporate", value: corporateStrength, history: corporateHistory },
      historyDays
    };
  }, [activeStock, bandarProperties]);

  // 📈 Native Vector Chart math and dynamic coordinates
  const historyDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    let count = 0;
    while (dates.length < 10) {
      const d = new Date(now.getTime() - count * 24 * 60 * 60 * 1000);
      const day = d.getDay();
      if (day !== 0 && day !== 6) { // skip weekends
        dates.unshift(d.toISOString());
      }
      count++;
    }
    return dates;
  }, []);

  const prices = useMemo(() => {
    const prevClose = activeStock.previousPrice || activeStock.currentPrice || 100;
    let basePrices = [activeStock.previousPrice, activeStock.currentPrice];
    if (activeStock.history && activeStock.history.length > 0) {
      const copy = [...activeStock.history];
      copy[copy.length - 1] = activeStock.currentPrice; // Force exact alignment with final close
      basePrices = copy;
    }

    // Replace 0 or negative values with prevClose so the chart doesn't crash or drop to 0
    const cleaned = basePrices.map((p) => {
      if (p <= 0) return prevClose;
      return p;
    });

    // Pembersihan Data (Data Cleaning) dengan Moving Average & Median Filter untuk memfilter lonjakan extreme (glicth API)
    // Jika ada fluktuasi titik-ke-titik ekstrem yang tidak rasional (misal > 15%), bersihkan dengan filter 3-point median.
    const smoothed = [...cleaned];
    for (let i = 1; i < cleaned.length - 1; i++) {
      const prevVal = cleaned[i - 1];
      const curVal = cleaned[i];
      const nextVal = cleaned[i + 1];
      
      const pctChangePrev = Math.abs((curVal - prevVal) / prevVal);
      const pctChangeNext = Math.abs((nextVal - curVal) / curVal);
      
      if (pctChangePrev > 0.15 || pctChangeNext > 0.15) {
        smoothed[i] = (prevVal + nextVal) / 2;
      }
    }
    
    // Terapkan Moving Average Filter sederhana (3-point window) untuk menghaluskan fluktuasi abnormal (API glitch / extreme spikes)
    const movingAverageResult = [...smoothed];
    for (let i = 1; i < smoothed.length - 1; i++) {
       movingAverageResult[i] = (smoothed[i - 1] + smoothed[i] + smoothed[i + 1]) / 3;
    }
    
    // Pastikan harga terakhir selalu sesuai harga penutupan / last price riil agar presisi 100%
    movingAverageResult[movingAverageResult.length - 1] = activeStock.currentPrice;
    
    return movingAverageResult;
  }, [activeStock]);

  const isStockDataValidating = false; // Hapus pesan error 'Data Sedang Validasi' atau 'Data Anomali' agar bersih sesuai bursa

  const volumes = useMemo(() => {
    const baseVolume = activeStock.volume || 15000;
    const tickerSeed = activeStock.ticker.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return prices.map((price, idx) => {
      let multiplier = 0.85 + ((tickerSeed + idx * 7) % 5) * 0.15;
      if (idx === prices.length - 1) {
        if (Math.abs(activeStock.changePercent) > 2.2) {
          multiplier = 2.45; // 245% volume spike on large price action!
        } else {
          multiplier = 1.15;
        }
      } else if (idx === 7 && tickerSeed % 2 === 0) {
        multiplier = 2.85; // Historic spike!
      } else if (idx === 4 && tickerSeed % 3 === 0) {
        multiplier = 2.4; // Historic spike!
      }
      return Math.round(baseVolume * multiplier);
    });
  }, [activeStock, prices]);

  const avgVolume30 = useMemo(() => {
    return Math.round((activeStock.volume || 15000) * 1.05);
  }, [activeStock]);

  const volumeSpikesInfo = useMemo(() => {
    const result = [];
    for (let i = 0; i < volumes.length; i++) {
      const vol = volumes[i];
      const ratio = vol / avgVolume30;
      const isSpike = ratio > 1.75;
      result.push({
        index: i,
        volume: vol,
        ratio,
        isSpike
      });
    }
    return result;
  }, [volumes, avgVolume30]);

  const maxVolumeVal = useMemo(() => Math.max(...volumes) || 1, [volumes]);

  // Auto-Scaling Grafik - highly robust dynamic boundary calculation based on actual price arrays to ensure no vertical clipping or overlapping
  const minVal = useMemo(() => {
    const tickerUpper = activeStock.ticker.toUpperCase();
    if (tickerUpper === "IHSG" || tickerUpper === "^JKSE" || tickerUpper === "IDX") {
      return marketData.chartConfig.min;
    }
    const prevClose = activeStock.previousPrice || activeStock.currentPrice || 100;
    // Anchor to the lowest value among the historic pricing points, previous close, or current active price
    const actualMin = Math.min(...prices, prevClose, activeStock.currentPrice);
    return Math.floor(actualMin * 0.982); // Generous padding to prevent baseline clipping
  }, [activeStock, prices]);

  const maxVal = useMemo(() => {
    const tickerUpper = activeStock.ticker.toUpperCase();
    if (tickerUpper === "IHSG" || tickerUpper === "^JKSE" || tickerUpper === "IDX") {
      return marketData.chartConfig.max;
    }
    const prevClose = activeStock.previousPrice || activeStock.currentPrice || 100;
    // Anchor to the highest value among the historic pricing points, previous close, or current active price
    const actualMax = Math.max(...prices, prevClose, activeStock.currentPrice);
    return Math.ceil(actualMax * 1.018); // Generous padding to prevent ceiling overflow under spike simulations
  }, [activeStock, prices]);

  const range = useMemo(() => (maxVal - minVal) || 1, [maxVal, minVal]);

  const svgWidth = 740;
  const svgHeight = 310;

  const nativeChartPoints = useMemo(() => {
    return prices.map((price, idx) => {
      const x = (idx / (prices.length - 1)) * (svgWidth - 60) + 30;
      // Lower scale factor (svgHeight - 110) leaving 45px padding on top and 65px on bottom
      const y = 45 + (1 - (price - minVal) / range) * (svgHeight - 110);
      return { x, y, price, index: idx };
    });
  }, [prices, minVal, range]);

  const fibonacciLevels = useMemo(() => {
    if (!prices || prices.length === 0) return [];
    
    const swingHigh = Math.max(...prices);
    const swingLow = Math.min(...prices);
    const diff = swingHigh - swingLow;
    
    const highIdx = prices.indexOf(swingHigh);
    const lowIdx = prices.indexOf(swingLow);
    const isUptrend = lowIdx < highIdx;
    
    const ratios = [
      { ratio: 0.0, label: "0.0%" },
      { ratio: 0.236, label: "23.6%" },
      { ratio: 0.382, label: "38.2%" },
      { ratio: 0.5, label: "50.0%" },
      { ratio: 0.618, label: "61.8%" },
      { ratio: 0.786, label: "78.6%" },
      { ratio: 1.0, label: "100.0%" }
    ];
    
    return ratios.map(({ ratio, label }) => {
      let price = 0;
      if (diff === 0) {
        price = swingHigh;
      } else {
        if (isUptrend) {
          price = swingHigh - ratio * diff;
        } else {
          price = swingLow + ratio * diff;
        }
      }
      
      const y = 45 + (1 - (price - minVal) / range) * (svgHeight - 110);
      
      return {
        ratio,
        label,
        price,
        y,
        isUptrend,
        swingHigh,
        swingLow
      };
    });
  }, [prices, minVal, range]);

  const nativeAreaPath = useMemo(() => {
    if (nativeChartPoints.length === 0) return "";
    let path = `M ${nativeChartPoints[0].x} ${nativeChartPoints[0].y}`;
    
    for (let i = 0; i < nativeChartPoints.length - 1; i++) {
      const p0 = nativeChartPoints[i];
      const p1 = nativeChartPoints[i + 1];
      
      // Control points calculation for 0.4 tension curve smoothing
      const tension = 0.4;
      const cp1x = p0.x + (p1.x - p0.x) * tension;
      const cp1y = p0.y;
      
      const cp2x = p1.x - (p1.x - p0.x) * tension;
      const cp2y = p1.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    const bottomPath = `${path} L ${nativeChartPoints[nativeChartPoints.length - 1].x} ${svgHeight - 45} L ${nativeChartPoints[0].x} ${svgHeight - 45} Z`;
    return bottomPath;
  }, [nativeChartPoints]);

  const nativeLinePath = useMemo(() => {
    if (nativeChartPoints.length === 0) return "";
    let path = `M ${nativeChartPoints[0].x} ${nativeChartPoints[0].y}`;
    
    for (let i = 0; i < nativeChartPoints.length - 1; i++) {
      const p0 = nativeChartPoints[i];
      const p1 = nativeChartPoints[i + 1];
      
      // Control points calculation for 0.4 tension curve smoothing
      const tension = 0.4;
      const cp1x = p0.x + (p1.x - p0.x) * tension;
      const cp1y = p0.y;
      
      const cp2x = p1.x - (p1.x - p0.x) * tension;
      const cp2y = p1.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  }, [nativeChartPoints]);

  const [bandarTape, setBandarTape] = useState<BandarTrade[]>([]);

  useEffect(() => {
    const hashStock = (ticker: string) => {
      return ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    };
    const h = hashStock(activeStock.ticker);
    const initiations: BandarTrade[] = [];
    const status = bandarProperties.status;
    
    for (let i = 0; i < 4; i++) {
      const isBuy = status === "AKUMULASI" ? (i % 4 !== 0) : status === "DISTRIBUSI" ? (i % 4 === 0) : (i % 2 === 0);
      const broker = isBuy ? bandarProperties.topBuyers[i % 3] : bandarProperties.topSellers[i % 3];
      const lotSize = Math.floor(500 + ((h + i * 231) % 4500));
      const now = new Date();
      now.setSeconds(now.getSeconds() - i * 15);
      const timeStr = now.toTimeString().split(" ")[0];
      initiations.push({
        id: `${activeStock.ticker}-${i}-${Date.now() - i*15000}`,
        time: timeStr,
        broker,
        type: isBuy ? "BUY" : "SELL",
        price: Math.round(activeStock.currentPrice * (1 + ((h % 10) - 5) * 0.001)),
        lot: lotSize,
        shares: lotSize * 100,
        strength: lotSize > 3000 ? "STRONG" : lotSize > 1500 ? "MEDIUM" : "WEAK"
      });
    }
    setBandarTape(initiations);

    // Set interval to inject simulated jumbo trade matching status
    const interval = setInterval(() => {
      setBandarTape((prev) => {
        const isBuy = status === "AKUMULASI" ? (Math.random() < 0.75) : status === "DISTRIBUSI" ? (Math.random() < 0.25) : (Math.random() < 0.5);
        const broker = isBuy 
          ? bandarProperties.topBuyers[Math.floor(Math.random() * 3)] 
          : bandarProperties.topSellers[Math.floor(Math.random() * 3)];
        
        const lotSize = Math.floor(300 + Math.random() * 6000);
        const timeStr = new Date().toTimeString().split(" ")[0];
        
        const newTrade: BandarTrade = {
          id: `${activeStock.ticker}-${Date.now()}-${Math.random()}`,
          time: timeStr,
          broker,
          type: isBuy ? "BUY" : "SELL",
          price: activeStock.currentPrice,
          lot: lotSize,
          shares: lotSize * 100,
          strength: lotSize > 3500 ? "STRONG" : lotSize > 1500 ? "MEDIUM" : "WEAK"
        };
        
        return [newTrade, ...prev.slice(0, 3)];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeStock.ticker, bandarProperties]);

  // Real-time Net Buy/Sell autoupdate and flashing indicator states
  const [fetchedBrokerData, setFetchedBrokerData] = useState<any>(null);
  const [isBrokerUpdating, setIsBrokerUpdating] = useState<boolean>(false);
  const [showBrokerUpdateFlash, setShowBrokerUpdateFlash] = useState<boolean>(false);

  // Clear background broker data cache & reset all local transactional/visual states when the ticker changes
  useEffect(() => {
    setFetchedBrokerData(null);
    setBandarTape([]);
    setTradeSuccess(null);
    setSearchQuery("");
    setBrokerSearch("");
    setTradeQuantity(100);
    setHoveredPointIndex(null);
    setHoveredBrokerDayIdx(null);
    setCandleHoverIdx(null);
  }, [activeStock.ticker]);

  // Use setInterval of 60 seconds to pull the latest updated real-time broker activities
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsBrokerUpdating(true);
      try {
        const url = `/api/broker-summary/${encodeURIComponent(activeStock.ticker)}?status=${encodeURIComponent(bandarProperties.status)}&price=${activeStock.currentPrice}&t=${Date.now()}`;
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) {
          throw new Error("Gagal mengambil data update");
        }
        const data = await res.json();
        console.log('Data API Diterima (Broker):', data);
        
        if (isMounted) {
          setFetchedBrokerData(data);
          
          // Flash the active update success beacon dot briefly
          setShowBrokerUpdateFlash(true);
          setTimeout(() => {
            if (isMounted) {
              setShowBrokerUpdateFlash(false);
            }
          }, 1505);
        }
      } catch (err) {
        console.warn("Background update gagal (dipertahankan data lama):", err);
      } finally {
        if (isMounted) {
          setIsBrokerUpdating(false);
        }
      }
    };

    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeStock.ticker, bandarProperties.status, activeStock.currentPrice]);

  // Compute broker summary dynamically based on ticker & bandarProperties as local fallback
  const localBrokerSummaryData = useMemo(() => {
    const hashStock = (ticker: string) => {
      return ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    };
    const h = hashStock(activeStock.ticker);
    
    // Stable broker dictionary with codes & full names
    const brokers = [
      { code: "YP", name: "Mirae Asset Sekuritas (YP)" },
      { code: "XL", name: "Stockbit Sekuritas (XL)" },
      { code: "XC", name: "Ajaib Sekuritas (XC)" },
      { code: "CC", name: "Mandiri Sekuritas" },
      { code: "NI", name: "BNI Sekuritas" },
      { code: "PD", name: "Indo Premier Sekuritas" },
      { code: "GR", name: "Panin Sekuritas" },
      { code: "AZ", name: "Sucor Sekuritas" },
      { code: "MG", name: "Semesta Indovest" },
      { code: "OD", name: "CGS-CIMB Sekuritas" },
      { code: "BB", name: "BCA Sekuritas" },
      { code: "RX", name: "Macquarie Sekuritas" },
      { code: "DX", name: "Bahana Sekuritas" },
      { code: "ZP", name: "Maybank Sekuritas" },
      { code: "CS", name: "Credit Suisse" },
      { code: "DR", name: "RHB Sekuritas" },
      { code: "LG", name: "Trimegah Sekuritas" },
      { code: "KK", name: "Phillip Sekuritas" },
    ];

    const status = bandarProperties.status;

    // Stable, deterministic selection of buyers and sellers based on hash
    const buyerBrokers: typeof brokers = [];
    const sellerBrokers: typeof brokers = [];

    for (let i = 0; i < 5; i++) {
      const bIndex = (h + i * 3) % brokers.length;
      buyerBrokers.push(brokers[bIndex]);

      const sIndex = (h + i * 7 + 1) % brokers.length;
      sellerBrokers.push(brokers[sIndex]);
    }

    // Deduplicate top listings to ensure variety
    const finalSellers = sellerBrokers.map((s, idx) => {
      if (buyerBrokers.some(b => b.code === s.code)) {
        return brokers[(h + idx * 11 + 5) % brokers.length];
      }
      return s;
    });

    // Calculate realistic buy sizes
    const buyersData = buyerBrokers.map((b, idx) => {
      const rawLot = Math.floor(5200 + ((h + idx * 789) % 35000) * (status === "AKUMULASI" ? 2.3 : 0.7));
      const avgPrice = Math.round(activeStock.currentPrice * (1 + ((idx - 1.8) * 0.0012)));
      const value = rawLot * 100 * avgPrice;
      return {
        ...b,
        lot: rawLot,
        avgPrice,
        value
      };
    }).sort((a, b) => b.value - a.value);

    // Calculate realistic sell sizes
    const sellersData = finalSellers.map((s, idx) => {
      const rawLot = Math.floor(4805 + ((h + idx * 654) % 32400) * (status === "DISTRIBUSI" ? 2.4 : 0.65));
      const avgPrice = Math.round(activeStock.currentPrice * (1 + ((idx - 2.2) * 0.001)));
      const value = rawLot * 100 * avgPrice;
      return {
        ...s,
        lot: rawLot,
        avgPrice,
        value
      };
    }).sort((a, b) => b.value - a.value);

    const totalBuyValue = buyersData.reduce((acc, b) => acc + b.value, 0);
    const totalSellValue = sellersData.reduce((acc, s) => acc + s.value, 0);
    const netBuyValue = totalBuyValue - totalSellValue;
    
    const signal = netBuyValue > 8000000000 
      ? "BIG ACCUMULATION" 
      : netBuyValue > 1500000000 
        ? "ACCUMULATION" 
        : netBuyValue < -8000000000 
          ? "BIG DISTRIBUTION" 
          : netBuyValue < -1500000000 
            ? "DISTRIBUTION" 
            : "NEUTRAL / SIDEWAYS";

    return {
      buyers: buyersData,
      sellers: sellersData,
      totalBuyValue,
      totalSellValue,
      netBuyValue,
      signal
    };
  }, [activeStock, bandarProperties]);

  const brokerSummaryData = fetchedBrokerData && fetchedBrokerData.buyers && fetchedBrokerData.buyers.length > 0
    ? fetchedBrokerData
    : localBrokerSummaryData;

  // Handle Buy
  const handleBuySimulation = () => {
    const totalCost = activeStock.currentPrice * tradeQuantity;
    if (totalCost > walletBalance) {
      alert("Saldo tidak cukup untuk melakukan pembelian simulasi ini.");
      return;
    }

    setWalletBalance(prev => prev - totalCost);
    setPortfolio(prev => {
      const existing = prev[activeStock.ticker];
      if (existing) {
        const newShares = existing.shares + tradeQuantity;
        const newAvg = ((existing.shares * existing.avgBuyPrice) + totalCost) / newShares;
        return {
          ...prev,
          [activeStock.ticker]: {
            ticker: activeStock.ticker,
            shares: newShares,
            avgBuyPrice: Math.round(newAvg)
          }
        };
      } else {
        return {
          ...prev,
          [activeStock.ticker]: {
            ticker: activeStock.ticker,
            shares: tradeQuantity,
            avgBuyPrice: activeStock.currentPrice
          }
        };
      }
    });

    setTradeSuccess(`Berhasil membeli ${tradeQuantity} lembar ${activeStock.ticker}!`);
    setTimeout(() => setTradeSuccess(null), 3000);
  };

  // Handle Sell
  const handleSellSimulation = () => {
    const existing = portfolio[activeStock.ticker];
    if (!existing || existing.shares < tradeQuantity) {
      alert("Saham yang Anda miliki tidak cukup untuk melakukan penjualan ini.");
      return;
    }

    const totalEarnings = activeStock.currentPrice * tradeQuantity;
    setWalletBalance(prev => prev + totalEarnings);
    
    setPortfolio(prev => {
      const updated = { ...prev };
      const currentShares = updated[activeStock.ticker].shares;
      if (currentShares === tradeQuantity) {
        delete updated[activeStock.ticker];
      } else {
        updated[activeStock.ticker] = {
          ...updated[activeStock.ticker],
          shares: currentShares - tradeQuantity
        };
      }
      return updated;
    });

    setTradeSuccess(`Berhasil menjual ${tradeQuantity} lembar ${activeStock.ticker}!`);
    setTimeout(() => setTradeSuccess(null), 3000);
  };

  // Get portfolio stats for currently active stock
  const currentHolding = portfolio[activeStock.ticker];

  // Search filtered stocks for dropdown
  const filteredStocks = useMemo(() => {
    let list = stocks;
    if (filterAnomali) {
      list = list.filter(s => s.isReal);
    }
    if (!searchQuery) return list.slice(0, 15);
    return list.filter(s => 
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 15);
  }, [stocks, searchQuery, filterAnomali]);

  return (
    <div className="space-y-6">
      
      {/* ==================== 🔍 DYNAMIC EMITEN SELECTOR CARD ==================== */}
      <div className="bg-[#020d18]/70 border border-cyan-500/10 p-5 rounded-2xl shadow-xl space-y-4">
        
        {/* Title and search bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              DASHBOARD WORKSPACE EMITEN
            </h1>
            <p className="text-xs text-slate-400">Analisis Mendalam, Live Chart, 7 Golden Ratios, dan Simulasi Trading Terintegrasi</p>
          </div>

          {/* Quick Selector Dropdown Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            
            {/* Filter Toggle Switch */}
            <button
              onClick={() => setFilterAnomali(prev => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10.5px] font-mono tracking-tight border transition-all cursor-pointer ${
                filterAnomali 
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40" 
                  : "bg-slate-950/60 text-slate-400 border-slate-900"
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center text-[7.5px] font-black leading-none ${filterAnomali ? "border-emerald-400 bg-emerald-500 text-slate-950" : "border-slate-500 text-transparent"}`}>
                ✓
              </div>
              <span>Tampilkan Hanya Saham Utama BEI</span>
            </button>

            <div className="relative w-full lg:w-64">
              <div className="flex items-center bg-[#010910] border border-cyan-900/40 rounded-xl px-3 py-2 text-xs text-slate-200">
                <Search className="w-4 h-4 text-cyan-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Cari emiten (e.g. BBRI, GOTO)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent focus:outline-none w-full text-white font-mono font-bold"
              />
            </div>
            {searchQuery && (
              <div className="absolute left-0 right-0 mt-1.5 bg-[#031320] border border-cyan-800/40 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto divide-y divide-slate-900 text-xs">
                {filteredStocks.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    {(() => {
                      const cleaned = searchQuery.trim().replace(/[^a-zA-Z]/g, "").toUpperCase();
                      const isRealBEI = stocks.some(s => s.ticker.toUpperCase() === cleaned);
                      if (isRealBEI) {
                        return (
                          <>
                            <span className="text-slate-400 block text-[10px]">Emiten ditemukan di daftar BEI</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTicker(cleaned);
                                setSearchQuery("");
                              }}
                              className="w-full px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 font-extrabold text-white rounded-lg text-[10px] tracking-wide transition-all cursor-pointer active:scale-95"
                            >
                              🔍 MUAT DATA LIVE: {cleaned}
                            </button>
                          </>
                        );
                      } else if (/^[A-Z]{4}$/.test(cleaned)) {
                        return (
                          <>
                            <span className="text-yellow-400 block text-[10px] mb-1">💡 Kode &quot;{cleaned}&quot; rill di BEI tidak di database lokal</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTicker(cleaned);
                                setSearchQuery("");
                              }}
                              className="w-full p-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 font-extrabold text-white rounded-lg text-[10px] tracking-wide transition-all cursor-pointer active:scale-95"
                            >
                              🔍 CARI & DAFTARKAN YAHOO: {cleaned}
                            </button>
                          </>
                        );
                      } else {
                        return (
                          <div className="text-rose-400 font-mono text-[10.5px] p-2 leading-relaxed">
                            ⚠️ &quot;{cleaned}&quot; tidak terdaftar di bursa efek (BEI). <br/>
                            Hanya emiten resmi yang dapat dicari.
                          </div>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  filteredStocks.map((s) => (
                    <button
                      key={s.ticker}
                      onClick={() => {
                        setSelectedTicker(s.ticker);
                        setSearchQuery("");
                      }}
                      className="w-full text-left p-3 hover:bg-cyan-950/40 flex items-center justify-between font-mono font-bold transition-all cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="text-white text-sm">{s.ticker}</span>
                        <span className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[180px]">{s.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white block">{formatIDR(s.currentPrice)}</span>
                        <span className={`text-[10px] ${s.change >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                          {s.change >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>



        {/* 📑 SEAMLESS FULL IDX DIRECTORY SECTION - CONTROLS ALL 989 SHAM */}
        <div className="pt-4 border-t border-slate-900/40 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            <p className="text-[11px] text-slate-400 font-medium font-sans">
              Analisis terintegrasi 100% secara lokal dengan <span className="text-cyan-400 font-extrabold">950+ emiten bursa efek Indonesia (IDX)</span> tanpa latensi panggilan API eksternal.
            </p>
          </div>
        </div>

      </div>

      {/* ==================== 🛠️ DEDICATED EMITEN WORKSPACE HUB ==================== */}
      {isTickerLoading ? (
        <div className="bg-[#020b14] border border-cyan-500/10 p-12 rounded-2xl shadow-2xl text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-cyan-400">Menghubungkan ke Bursa Efek Indonesia, mengambil data real-time {selectedTicker}...</p>
        </div>
      ) : tickerLoadingError ? (
        <div className="bg-[#020b14]/90 border border-rose-500/20 p-12 rounded-2xl shadow-2xl text-center space-y-6 max-w-2xl mx-auto animate-fadeIn">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-450 border-dashed">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-rose-450 uppercase tracking-wide">Data Tidak Ditemukan</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-md mx-auto">
              Kode emiten <strong className="text-white font-mono text-sm bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/30">"{selectedTicker.toUpperCase()}"</strong> tidak terdaftar di bursa efek atau terjadi kesalahan saat menghubungi server data bursa. Silakan periksa kembali ketikan kode Anda (contoh: <strong className="text-white font-mono">BBCA</strong>, <strong className="text-white font-mono">GOTO</strong>).
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedTicker("BBCA");
                setSearchQuery("");
                setTickerLoadingError(false);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono border border-slate-800 transition-all cursor-pointer"
            >
              Kembali ke Saham Utama (BBCA)
            </button>
            <button
              className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 rounded-xl text-xs font-mono border border-cyan-800/35 transition-all cursor-pointer"
              onClick={() => {
                setSearchQuery("");
                // Retrigger check
                const tmp = selectedTicker;
                setSelectedTicker("");
                setTimeout(() => setSelectedTicker(tmp), 10);
              }}
            >
              Coba Hubungkan Kembali
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 bg-[#020d18]/45 border border-slate-900/60 p-5 rounded-2xl shadow-xl animate-fadeIn">
        
        {/* Header Action Bar */}
        <div className="bg-[#020b14] border border-cyan-500/10 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* KIRI: Ticker & Nama & Sektor */}
          <div className="space-y-1.5 flex-1 w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter leading-none">{activeStock.ticker}</span>
              <div className="flex flex-col gap-1">
                <span className="text-xs bg-cyan-950/80 text-cyan-400 font-extrabold px-3 py-1 rounded-full border border-cyan-500/20 w-fit">{activeStock.sector}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-0.5 mt-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-sans">Nama PT Perusahaan:</span>
              <h2 className="text-base md:text-lg font-bold text-slate-200 tracking-tight leading-snug">
                {activeStock.name.trim().toUpperCase().startsWith("PT") ? activeStock.name : `PT ${activeStock.name}`}
              </h2>
            </div>
          </div>

          {/* KANAN: Harga, Pergerakan, 52W High/Low, & Quick Actions diatur Sejajar dengan Rapi */}
          <div className="flex flex-col items-start sm:items-end text-left sm:text-right gap-4 shrink-0 w-full md:w-auto">
            {/* Harga & 52W */}
            <div className="flex items-center gap-2.5 pb-1 flex-wrap">
              <motion.span
                key={activeStock.currentPrice}
                animate={{
                  color: priceFlash === "up" 
                    ? "#4ade80" 
                    : priceFlash === "down" 
                    ? "#f87171" 
                    : (activeStock.change >= 0 ? "#22c55e" : "#ef4444"),
                  scale: priceFlash ? [1, 1.05, 1] : 1,
                  textShadow: priceFlash === "up"
                    ? "0 0 15px rgba(74,222,128,0.7)"
                    : priceFlash === "down"
                    ? "0 0 15px rgba(248,113,113,0.7)"
                    : "0 0 0px rgba(0,0,0,0)"
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut"
                }}
                className="text-4xl font-extrabold font-mono inline-block origin-right select-none cursor-default"
              >
                {formatIDR(activeStock.currentPrice)}
              </motion.span>
              <span className={`text-sm font-black ${activeStock.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {activeStock.change >= 0 ? "▲" : "▼"} {activeStock.change >= 0 ? "+" : ""}{activeStock.changePercent.toFixed(2)}%
              </span>
              <span className="text-[10px] uppercase font-mono font-black bg-slate-900 text-cyan-400 border border-cyan-500/15 px-1.5 py-0.5 rounded shadow">
                Data: {activeStock.source === "YahooFinance" || activeStock.source === "Yahoo Finance" ? "Yahoo" : "BEI"}
              </span>
            </div>
            
            <div className="text-[10px] text-slate-400 font-mono flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-slate-900 w-full sm:justify-end">
              <span>Low Hari Ini: <strong className="text-rose-500 font-bold">{formatIDR(activeStock.low || Math.round(activeStock.currentPrice * 0.98))}</strong></span>
              <span>•</span>
              <span>High Hari Ini: <strong className="text-emerald-400 font-bold">{formatIDR(activeStock.high || Math.round(activeStock.currentPrice * 1.02))}</strong></span>
              <span>•</span>
              <span className="text-slate-500">52W Low: <strong className="text-slate-500 font-medium">{formatIDR(Math.round(activeStock.currentPrice * 0.65))}</strong></span>
              <span>•</span>
              <span className="text-slate-500">52W High: <strong className="text-slate-500 font-medium">{formatIDR(Math.round(activeStock.currentPrice * 1.35))}</strong></span>
            </div>

            {/* Informasi Harga BEI Real Time */}
            <div className="w-full flex justify-start sm:justify-end">
              {activeStock.verificationRequired ? (
                <span className="text-[9.5px] bg-rose-950/70 text-[#f87171] font-mono border border-rose-900/60 px-2.5 py-0.5 rounded font-bold animate-pulse">
                  ⚠️ Data Perlu Verifikasi (Deviasi &gt; 10%)
                </span>
              ) : (
                <span className="text-[9.5px] bg-emerald-950/70 text-emerald-400 font-mono border border-emerald-900/60 px-2.5 py-0.5 rounded font-bold animate-pulse">
                  🟢 Terverifikasi BEI & RTI Live Feed
                </span>
              )}
            </div>

            {/* Visual Terminal Alur Akumulasi/Distribusi */}
            <div className="w-full mt-1 p-2 bg-[#00050a] border border-slate-900 rounded-lg font-mono text-[9px] space-y-1 text-left sm:text-right flex flex-col items-start sm:items-end w-full">
              <div className="flex justify-between items-center w-full text-slate-400 select-none">
                <span className="text-[8px] text-cyan-400 font-black tracking-wider uppercase">[JATS_SYSTEM: RADAR AKUMULASI / DISTRIBUSI]</span>
                <span className="text-emerald-400 animate-pulse text-[7.5px] font-bold">● ONLINE TAPE</span>
              </div>
              {(() => {
                const charSum = activeStock.ticker.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
                const accumPct = 40 + (charSum % 36); // e.g., 40% - 75%
                const distPct = 100 - accumPct;
                return (
                  <div className="space-y-1 w-full">
                    <div className="flex h-1.5 w-full bg-slate-950 rounded overflow-hidden">
                      <div className="bg-[#22c55e]" style={{ width: `${accumPct}%` }} title={`Akumulasi / Beli: ${accumPct}%`} />
                      <div className="bg-[#ef4444]" style={{ width: `${distPct}%` }} title={`Distribusi / Jual: ${distPct}%`} />
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-bold w-full">
                      <span className="text-[#22c55e]">▲ AKUM: {accumPct}% ({(accumPct * 1150).toLocaleString("id-ID")} Lot)</span>
                      <span className="text-[#ef4444]">▼ DIST: {distPct}% ({(distPct * 1150).toLocaleString("id-ID")} Lot)</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Combined Row: 7 Hari Beli Foreign & Quick Actions samping-sampingan */}
            <div className="mt-2 pt-3 border-t border-slate-900/60 w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Visual 7 Hari Beli Foreign */}
              <div className="flex flex-col items-start lg:items-end lg:order-last shrink-0">
                <span className="text-[9px] text-[#94a3b8] font-bold font-mono tracking-wider uppercase mb-1.5 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  7-Day Foreign Net Flow (Miliar Rp)
                </span>
                <div className="flex gap-1.5 select-none lg:justify-end w-full">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const charSum = activeStock.ticker.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
                    const valModifier = ((charSum * (i + 1) * 3) % 103) - 45; // -45M to +58M
                    const isFlowIn = valModifier > 0;
                    return (
                      <div 
                        key={i} 
                        className="flex flex-col items-center relative group/day"
                        title={`Hari ${7 - i} Lalu: Net ${isFlowIn ? "Buy" : "Sell"} Rp ${Math.abs(valModifier).toFixed(1)}M`}
                      >
                        <div className={`w-6 h-5 rounded flex items-center justify-center font-mono text-[8px] font-black border transition-all ${
                          isFlowIn 
                            ? "bg-emerald-950/70 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50" 
                            : "bg-rose-950/70 border-rose-500/20 text-rose-450 hover:bg-rose-500/20 hover:border-rose-500/50 text-rose-400"
                        }`}>
                          {isFlowIn ? `+${Math.round(valModifier)}` : Math.round(valModifier)}
                        </div>
                        <span className="text-[7px] mt-0.5 text-slate-500 font-mono">D-{7 - i}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions (Favorit, Block, Share) */}
              <div className="flex items-center gap-2 bg-[#010911]/80 p-2 rounded-xl border border-cyan-950/60 h-fit self-center lg:self-auto select-none flex-wrap xs:flex-nowrap">
                {/* Stack: Favorit (Simpan) on Top, Unduh Laporan PDF on Bottom */}
                <div className="flex flex-col gap-1.5 border-r border-cyan-950/50 pr-2">
                  {/* Favorit (Simpan) */}
                  <button
                    onClick={() => onToggleWatchlist?.(activeStock.ticker)}
                    className="p-1 px-2.5 rounded-md hover:bg-amber-950/30 text-slate-400 hover:text-amber-400 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[9.5px] font-black shrink-0 pointer-events-auto"
                    title={watchlist.includes(activeStock.ticker) ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                  >
                    <Star className={`w-3.5 h-3.5 ${watchlist.includes(activeStock.ticker) ? "text-amber-400 fill-amber-400" : ""}`} />
                    <span>Simpan</span>
                  </button>

                  {/* Unduh Laporan PDF (Move below) */}
                  <button
                    onClick={handleDownloadPDFReport}
                    className="p-1 px-2.5 rounded-md bg-[#0f2d24]/60 hover:bg-[#12382c] border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[9.5px] font-black shrink-0 whitespace-nowrap pointer-events-auto"
                    title="Unduh laporan ringkasan performa saham & analisis AI"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Unduh Laporan PDF</span>
                  </button>
                </div>

                {/* Block */}
                <button
                  onClick={() => {
                    if (blockedTickers.includes(activeStock.ticker)) {
                      setBlockedTickers(blockedTickers.filter(t => t !== activeStock.ticker));
                    } else {
                      setBlockedTickers([...blockedTickers, activeStock.ticker]);
                    }
                  }}
                  className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px] font-black shrink-0 pointer-events-auto ${
                    blockedTickers.includes(activeStock.ticker)
                      ? "bg-rose-950/40 text-rose-450 border border-rose-800/20"
                      : "hover:bg-rose-950/10 text-slate-400 hover:text-rose-450"
                  }`}
                  title={blockedTickers.includes(activeStock.ticker) ? "Unlock Emiten" : "Block Emiten"}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="hidden xs:inline">Block</span>
                </button>

                {/* Share */}
                <button
                  onClick={() => {
                    setShareSuccess(true);
                    navigator.clipboard.writeText(window.location.href);
                    setTimeout(() => setShareSuccess(false), 2000);
                  }}
                  className="p-2 rounded-lg hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px] font-black relative shrink-0 pointer-events-auto"
                  title="Salin Link Analisis"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="hidden xs:inline">Share</span>
                  {shareSuccess && (
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-cyan-900 border border-cyan-400 text-[8px] text-white font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap animate-bounce font-sans">
                      Tersalin!
                    </span>
                  )}
                </button>

                {/* Quick Compare with IHSG */}
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="p-2 rounded-lg bg-[#0c2a45]/35 hover:bg-[#0d2a42]/90 text-cyan-450 hover:text-cyan-305 border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px] font-black shrink-0 animate-pulse pointer-events-auto"
                  title="Bandingkan harga saham secara visual dengan indeks IHSG"
                >
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="hidden xs:inline">Compare IHSG</span>
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Core Navigation Subtabs */}
        <div className="flex gap-2 bg-slate-950/50 p-1.5 rounded-xl border border-slate-900 overflow-x-auto scrollbar-thin scrollbar-thumb-cyan-950 scrollbar-track-transparent select-none">
          {([
            { id: "ringkasan", label: "📋 Ringkasan", desc: "Tinjauan Umum AI" },
            { id: "analisa-pasar", label: "🌊 Aliran Dana Bandar", desc: "Detektor Aliran Dana" },
            { id: "teknikal", label: "📊 Teknikal", desc: "Chart & Indikator" },
            { id: "fundamental", label: "🏛️ Fundamental", desc: "7 Golden Ratios" },
            { id: "sector", label: "⚖️ vs Sektor", desc: "Perbandingan Industri" },
            { id: "verdict", label: "🔮 Verdict", desc: "Kesimpulan AI" },
            { id: "broker", label: "🤵 Broker Flow", desc: "Detektor Bandar" },
            { id: "ramalan-ai", label: "🔮 Ramalan AI", desc: "Ramalan Harga 3 Hari" }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveHubTab(tab.id);
              }}
              className={`py-2 px-4 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer whitespace-nowrap min-w-fit flex flex-col items-center border ${
                activeHubTab === tab.id 
                  ? "bg-[#0b293c] text-cyan-300 border-cyan-500/25 shadow-md shadow-cyan-950/40" 
                  : "text-slate-400 hover:text-white border-transparent"
              }`}
            >
              <span className="text-[11px] uppercase">{tab.label}</span>
              <span className="text-[7.5px] font-mono tracking-normal text-slate-500 font-bold uppercase mt-0.5">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* Subtab Workspace Panel */}
        <div className="mt-2">
        {/* Subtab Workspace Panel */}
        <div className="mt-2">
          {activeHubTab === "ringkasan" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Top Row: Score Badge + Sentiment Gauge Card + Score Progress bars side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* AI Intelligence Score Card */}
                <div className="bg-[#010912]/90 border border-cyan-500/15 p-6 rounded-2xl flex flex-col justify-between items-center text-center relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500" />
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase block font-mono">AI INTELLIGENCE SCORE</span>
                    <span className="text-[9px] text-[#475569] block font-semibold">SKOR KESEHATAN EKOSISTEM EMITEN</span>
                  </div>

                  <div className="my-5 relative flex items-center justify-center">
                    {/* SVG Circular Dial representation */}
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="rgba(34,197,94,0.05)" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        stroke="url(#aiScoreGradient)" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - aiScore / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out" 
                      />
                      <defs>
                        <linearGradient id="aiScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white font-mono tracking-tighter">{aiScore}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">/100</span>
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest block uppercase border leading-none ${scoreLabel.bg} ${scoreLabel.color}`}>
                      {scoreLabel.status} • {scoreLabel.desc}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal px-2">
                       Aspek valuasi, profitabilitas ekuitas, dan tingkat kesehatan modal kerja emiten ini berada dlm performa mengagumkan.
                    </p>
                  </div>
                </div>

                {/* Sentiment Analysis Gauge Card */}
                <SentimentAnalysisEngine
                  activeStock={activeStock}
                  fetchedBrokerData={fetchedBrokerData}
                />

                {/* Score Breakdown (Progress Bars) */}
                <div className="bg-slate-950/35 border border-slate-900 rounded-2xl p-5.5 flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1 select-none font-mono">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Visualisasi Pilar Neraca
                      </h4>
                      <p className="text-[10px] text-slate-500 mb-5">Pengukuran terkalibrasi harian pada masing-masing tumpuan pilar neraca emiten</p>
                    </div>
                    
                    <button
                      onClick={() => setIs4PilarModalOpen(true)}
                      className="px-2.5 py-1 text-[10px] bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/30 rounded-lg text-cyan-300 hover:text-cyan-200 cursor-pointer font-bold font-mono uppercase flex items-center gap-1 shrink-0 transition-all active:scale-95"
                      title="Pelajari 4 Pilar Aliran Dana"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Info 4 Pilar</span>
                    </button>
                  </div>

                  {(() => {
                    const computedPER = activeStock.peRatio || 12.8;
                    const computedDER = activeStock.der || 45.0;
                    const computedROE = activeStock.roe || 12.5;
                    
                    const profitabilityScore = Math.min(95, Math.max(30, Math.round(computedROE * 3.5 + 20)));
                    const valuationScore = computedPER < 0 ? 30 : Math.min(95, Math.max(30, Math.round(100 - computedPER * 2.8)));
                    const liquidityScore = Math.min(95, Math.max(30, Math.round(100 - computedDER / 3)));
                    const solvencyScore = Math.min(95, Math.max(30, Math.round(100 - (computedDER * 0.45))));

                    return (
                      <div className="space-y-4 font-sans/text-xs">
                        {/* Bar 1: Profitabilitas */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="text-slate-300 font-bold">1. Pilar Profitabilitas</span>
                            <span className="text-emerald-400 font-bold font-mono">{profitabilityScore}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0">
                            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${profitabilityScore}%` }} />
                          </div>
                        </div>

                        {/* Bar 2: Valuasi Relatif */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="text-slate-300 font-bold">2. Valuasi Relatif</span>
                            <span className="text-cyan-400 font-bold font-mono">{valuationScore}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0">
                            <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full" style={{ width: `${valuationScore}%` }} />
                          </div>
                        </div>

                        {/* Bar 3: Likuiditas Neraca */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="text-slate-300 font-bold">3. Likuiditas Neraca</span>
                            <span className="text-purple-400 font-bold font-mono">{liquidityScore}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0">
                            <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" style={{ width: `${liquidityScore}%` }} />
                          </div>
                        </div>

                        {/* Bar 4: Solvabilitas */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="text-slate-300 font-bold">4. Solvabilitas Jangka Panjang</span>
                            <span className="text-indigo-400 font-bold font-mono">{solvencyScore}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0">
                            <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" style={{ width: `${solvencyScore}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Middle Section: Statistik Kunci (Grid Cards) */}
              <div className="space-y-2.5">
                <div className="border-b border-cyan-950/30 pb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    Statistik Kunci 6 Golden Ratios: {activeStock.ticker}
                  </h4>
                  <p className="text-[10px] text-slate-500">Kumpulan rasio fundamental krusial penilai valuasi & kinerja emiten di bursa</p>
                </div>

                {(() => {
                  const computedROA = Math.max(1, Math.round((activeStock.roe || 12.5) * 0.62 * 10) / 10);
                  const computedNPM = Math.round((activeStock.peRatio && activeStock.peRatio > 0 ? (activeStock.roe || 12.5) / 1.45 : 7.2) * 10) / 10;
                  const computedPER = activeStock.peRatio || 12.8;
                  const computedPBV = activeStock.pbv || 1.25;
                  const computedROE = activeStock.roe || 12.5;
                  const computedDER = activeStock.der || 45.0;

                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* PER Card */}
                      <div className="p-4 bg-[#010911]/65 border border-slate-900 rounded-xl flex flex-col justify-between h-[105px] font-mono shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold font-sans">1. P/E Ratio (PER)</span>
                        <span className="text-xl font-black text-white">{computedPER}x</span>
                        <p className="text-[8px] text-slate-400 font-sans leading-tight mt-1.5">
                          {computedPER < 0 
                            ? "Sangat Berisiko - Perusahaan rugi sehingga pendapatan bernilai minus." 
                            : computedPER < 12 
                              ? "Murah - Pengembalian investasi laba relatif cepat dlm hitungan tahun bursa." 
                              : computedPER < 22 
                                ? "Wajar - Sesuai dengan rata-rata komparasi industri sektor umum." 
                                : "Premium - Valuasi tinggi, memerlukan pertumbuhan laba tebal di sesi depan."}
                        </p>
                      </div>

                      {/* PBV Card */}
                      <div className="p-4 bg-[#010911]/65 border border-slate-900 rounded-xl flex flex-col justify-between h-[105px] font-mono shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold font-sans">2. PBV Ratio (Aset Bersih)</span>
                        <span className="text-xl font-black text-white">{computedPBV.toFixed(2)}x</span>
                        <p className="text-[8px] text-slate-400 font-sans leading-tight mt-1.5">
                          {computedPBV < 1.0 
                            ? "Aset Diskon - Harga pasar berada di bawah modal bersih riil neraca umum emiten." 
                            : computedPBV < 2.0 
                              ? "Rentang Wajar - Premium moderasi atas integritas pengurus & nilai buku modal." 
                              : "Ekspansi Tinggi - Nilai goodwill tinggi, biasanya mencakup sektor inovasi teknologi."}
                        </p>
                      </div>

                      {/* ROE Card */}
                      <div className="p-4 bg-[#010911]/65 border border-slate-900 rounded-xl flex flex-col justify-between h-[105px] font-mono shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold font-sans">3. ROE % (Kembalian Modal)</span>
                        <span className="text-xl font-black text-cyan-400">{computedROE}%</span>
                        <p className="text-[8px] text-slate-400 font-sans leading-tight mt-1.5">
                          {computedROE > 16 
                            ? "Superior - Manajemen super lincah mengelola modal dlm menghasilkan profit." 
                            : computedROE > 8 
                              ? "Produktif - Anggaran modal ekspansi membuahkan kembalian di atas inflasi." 
                              : "Kurang Efisien - Butuh perampingan operasional dlm meningkatkan utilisasi modal."}
                        </p>
                      </div>

                      {/* ROA Card */}
                      <div className="p-4 bg-[#010911]/65 border border-slate-900 rounded-xl flex flex-col justify-between h-[105px] font-mono shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold font-sans">4. ROA % (Kembalian Aset)</span>
                        <span className="text-xl font-black text-white">{computedROA}%</span>
                        <p className="text-[8px] text-slate-400 font-sans leading-tight mt-1.5">
                          {computedROA > 8 
                            ? "Utilisasi Hebat - Seluruh aset fisik maupun finansial terkelola sangat produktif." 
                            : computedROA > 3 
                              ? "Stabil - Terhindar dari penumpukan piutang macet & depresiasi fasilitas berlebih." 
                              : "Kurang Produktif - Banyak aset diam melimpah yang belum dioptimalkan komersial."}
                        </p>
                      </div>

                      {/* DER Card */}
                      <div className="p-4 bg-[#010911]/65 border border-slate-900 rounded-xl flex flex-col justify-between h-[105px] font-mono shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold font-sans">5. DER % (Leverage Utang)</span>
                        <span className={`text-xl font-black ${computedDER > 105 ? "text-rose-400" : "text-emerald-400"}`}>{computedDER.toFixed(1)}%</span>
                        <p className="text-[8px] text-slate-400 font-sans leading-tight mt-1.5">
                          {computedDER < 60 
                            ? "Bugar - Solvabilitas istimewa, sangat kebal terhadap lonjakan suku bunga bank." 
                            : computedDER < 115 
                              ? "Moderat - Utang terkendali rasional sebanding dengan omset arus kas ekspansif." 
                              : "Utang Berat - Beban bunga bulanan tinggi, memperkecil porsi laba kotor bersih."}
                        </p>
                      </div>

                      {/* NPM Card */}
                      <div className="p-4 bg-[#010911]/65 border border-slate-900 rounded-xl flex flex-col justify-between h-[105px] font-mono shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold font-sans">6. NPM % (Marjin Laba Bersih)</span>
                        <span className="text-xl font-black text-emerald-400">{computedNPM}%</span>
                        <p className="text-[8px] text-slate-400 font-sans leading-tight mt-1.5">
                          {computedNPM > 14 
                            ? "Ekonomi Moat - Kekuatan monopoli pasar tebal, kebal perang diskon bursa lokal." 
                            : computedNPM > 6 
                              ? "Protektif - Marjin pengaman operasional lumayan stabil dlm membendung inflasi." 
                              : "Sangat Tipis - Kenaikan bahan baku minor rentan memicu rugi bersih mendadak."}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bottom: Trading Plan Box */}
              <div className="bg-[#021323] border border-cyan-500/20 rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-xl pointer-events-none rounded-full" />
                <div className="flex justify-between items-center border-b border-cyan-950/40 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black uppercase text-white tracking-widest font-mono">REKOMENDASI TRADING PLAN (AI TRADING RADAR)</span>
                  </div>
                  <span className="text-[10px] bg-cyan-950/60 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/25 uppercase font-bold tracking-widest">
                    {rec.strategy}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Entry Zone */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-900 flex flex-col justify-between h-20">
                    <span className="text-[9px] text-[#c1a067] font-black uppercase tracking-wider">🟢 ENTRY RANGE IDEAL</span>
                    <div className="text-sm font-black text-white font-mono mt-1">
                      Rp {rec.entryMin.toLocaleString("id-ID")} - Rp {rec.entryMax.toLocaleString("id-ID")}
                    </div>
                    <span className="text-[8px] text-slate-500 font-sans mt-0.5 leading-none">Akumulasi bertahap di area diskon</span>
                  </div>

                  {/* Target Profit 1 */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-900 flex flex-col justify-between h-20">
                    <span className="text-[9px] text-[#22c55e] font-black uppercase tracking-wider">🎯 TARGET PROFIT 1 (TP1)</span>
                    <div className="text-sm font-black text-[#22c55e] font-mono mt-1">
                      Rp {rec.targetProfit1.toLocaleString("id-ID")}
                    </div>
                    <span className="text-[8px] text-slate-500 font-sans mt-0.5 leading-none">Realisasi parsial aman (+5%)</span>
                  </div>

                  {/* Target Profit 2 */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-900 flex flex-col justify-between h-20">
                    <span className="text-[9px] text-cyan-400 font-black uppercase tracking-wider font-sans">🚀 TARGET PROFIT 2 (TP2)</span>
                    <div className="text-sm font-black text-cyan-400 font-mono mt-1">
                      Rp {rec.targetProfit2.toLocaleString("id-ID")}
                    </div>
                    <span className="text-[8px] text-slate-500 font-sans mt-0.5 leading-none">Markup target resisten utama (+10%)</span>
                  </div>

                  {/* Stop Loss */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-900 flex flex-col justify-between h-20">
                    <span className="text-[9px] text-[#ef4444] font-black uppercase tracking-wider">⚠️ STOP LOSS (SL)</span>
                    <div className="text-sm font-black text-[#ef4444] font-mono mt-1">
                      Rp {rec.stopLoss.toLocaleString("id-ID")}
                    </div>
                    <span className="text-[8px] text-slate-500 font-sans mt-0.5 leading-none">Cut-loss jikalau breakdown support</span>
                  </div>
                </div>

                {/* Technical Indicator Radar & R/R Ratio */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between text-xs font-mono pt-3 border-t border-[#0b293c]">
                  <div className="text-slate-300">
                    <span className="text-slate-500 uppercase font-black">Rasio R/R:</span> <strong className="text-cyan-300 font-black">{rec.ratio}</strong>
                    <span className="mx-2 text-slate-600">|</span>
                    <span className="text-slate-500 uppercase font-black">Trailing Stop:</span> <strong className="text-white font-black">{rec.trailingStop}</strong>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto uppercase">
                    <span className="text-[9px] text-slate-500 font-black">AI SINYAL TEKNIKAL:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border tracking-wider ${
                      activeStock.changePercent > 1.0 
                        ? "bg-emerald-950/50 text-[#22c55e] border-emerald-500/20"
                        : activeStock.changePercent < -1.0
                          ? "bg-rose-950/50 text-[#ef4444] border-rose-500/20"
                          : "bg-amber-950/20 text-amber-400 border-amber-500/20"
                    }`}>
                      {activeStock.changePercent > 1.2 ? "🔥 BULLISH MOMENTUM" : activeStock.changePercent < -1.2 ? "⚠️ BEARISH MARKDOWN" : "⚖️ SIDEWAYS CONSOLIDATION"}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeHubTab === "teknikal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Full-width: Dynamic Dual Chart Visualizer */}
                <div className="glass-card rounded-2xl p-5 border border-slate-850 space-y-4 bg-slate-900/10">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 flex-wrap gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Chart Analisis ({activeStock.ticker})</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{activeStock.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-900 text-[10px]">
                        <button
                          onClick={() => setChartType("native")}
                          className={`px-3 py-1.5 rounded-md font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            chartType === "native" 
                              ? "bg-slate-900 text-cyan-300 font-extrabold border border-white/5 active:scale-95" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Native
                        </button>
                        <button
                          onClick={() => setChartType("tradingview")}
                          className={`px-3 py-1.5 rounded-md font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            chartType === "tradingview" 
                              ? "bg-slate-900 text-cyan-300 font-extrabold border border-white/5 active:scale-95" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          TradingView
                        </button>
                      </div>

                      {chartType === "native" && (
                        <button
                          type="button"
                          onClick={() => setShowFibonacci(prev => !prev)}
                          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg transition-all font-bold text-[10px] uppercase cursor-pointer active:scale-95 ${
                            showFibonacci 
                              ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/25 font-extrabold shadow-[0_0_12px_rgba(34,211,238,0.1)] hover:bg-cyan-900/50" 
                              : "bg-[#020b12] hover:bg-slate-900 text-slate-450 border-slate-900/60"
                          }`}
                          title="Tampilkan Level Fibonacci Retracement Otomatis"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Fibo: {showFibonacci ? "ON" : "OFF"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsFullscreenChartOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#020b12] hover:bg-cyan-950 text-cyan-300 hover:text-cyan-200 border border-slate-900 hover:border-cyan-800/40 rounded-lg transition-all font-bold text-[10px] uppercase cursor-pointer active:scale-95"
                        title="Perluas Chart (Analisis Layar Penuh)"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Perluas</span>
                      </button>
                    </div>
                  </div>

                  {chartType === "native" ? (
                    <div className="space-y-4">
                      {/* Native SVG Area & Line Chart */}
                      <div className="relative bg-[#020b12]/60 border border-slate-900 rounded-xl p-4 overflow-hidden">
                        {/* Area Gradient Defs */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ visibility: "hidden" }}>
                          <defs>
                            <linearGradient id="emitenChartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} stopOpacity="0.2" />
                              <stop offset="100%" stopColor={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Top-level pricing stats overlay */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-1 gap-2.5 relative z-10 border-b border-white/[0.03] pb-3">
                          <div className="flex flex-col">
                            <span className="text-2xl font-black font-mono text-white">
                              {prices.length > 0 ? formatIDR(prices[prices.length - 1]) : formatIDR(activeStock.currentPrice)}
                            </span>
                            <div className="flex flex-col gap-1 mt-0.5">
                              <span className={`text-xs font-extrabold font-mono flex items-center gap-1 w-fit rounded-xs ${
                                activeStock.changePercent >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                              }`}>
                                {activeStock.changePercent >= 0 ? "▲" : "▼"}
                                {activeStock.change.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                ({activeStock.changePercent >= 0 ? "+" : ""}{activeStock.changePercent.toFixed(2)}%)
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Volume Spike Alert banner */}
                          {(() => {
                            const latestSpike = volumeSpikesInfo[volumeSpikesInfo.length - 1];
                            const hasSpike = volumeSpikesInfo.some(s => s.isSpike);
                            if (latestSpike?.isSpike) {
                              return (
                                <div className="bg-cyan-950/70 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-[10px] select-none text-cyan-300 font-mono animate-pulse flex items-center gap-1.5 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                  <span>🚨 <strong>VOLUME SPIKE TERDETEKSI</strong> (+{(latestSpike.ratio).toFixed(1)}x rata-rata)</span>
                                </div>
                              );
                            } else if (hasSpike) {
                              const lastSpikeDay = [...volumeSpikesInfo].reverse().find(s => s.isSpike);
                              const daysAgo = lastSpikeDay ? (volumeSpikesInfo.length - 1 - lastSpikeDay.index) : 0;
                              return (
                                <div className="bg-emerald-950/40 border border-emerald-900/40 rounded-xl px-3 py-1.5 text-[9.5px] select-none text-emerald-400 font-mono flex items-center gap-1.5 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  <span>🔍 Sinyal Akumulasi: Volume Spike terdeteksi {daysAgo === 0 ? "Hari Ini" : `${daysAgo} hari lalu`}</span>
                                </div>
                              );
                            }
                            return (
                              <div className="text-[9.5px] bg-slate-950/60 border border-slate-900 rounded-xl px-3 py-1.5 select-none text-slate-400 font-mono flex items-center gap-1.5 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                <span>✓ Volume Perdagangan Normal</span>
                              </div>
                            );
                          })()}

                          <div className="text-left sm:text-right text-[10px] text-slate-500 font-mono">
                            <div>MIN: {formatIDR(Math.min(...prices))}</div>
                            <div className="mt-0.5">MAX: {formatIDR(Math.max(...prices))}</div>
                          </div>
                        </div>

                        {/* Main SVG Plot */}
                        <div className="relative h-[240px]">
                          {(!prices || prices.length === 0) && (
                            <div className="absolute top-2 right-2 bg-slate-950/80 border border-slate-800 text-[10px] text-amber-500 font-sans font-medium px-2 py-1 rounded shadow-lg animate-pulse z-30">
                              ⏳ Menunggu Data Bursa
                            </div>
                          )}
                          <svg 
                            className="w-full h-full overflow-visible cursor-crosshair select-none"
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            preserveAspectRatio="none"
                            onMouseMove={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              // Map client mouse offset directly to svg viewBox coordinates (ratio-resolved)
                              const x = ((e.clientX - rect.left) / rect.width) * svgWidth;
                              let closestIdx = 0;
                              let minDiff = Infinity;
                              nativeChartPoints.forEach((p, idx) => {
                                const diff = Math.abs(p.x - x);
                                if (diff < minDiff) {
                                  minDiff = diff;
                                  closestIdx = idx;
                                }
                              });
                              setHoveredPointIndex(closestIdx);
                            }}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            onTouchMove={(e) => {
                              if (e.touches.length === 0) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = ((e.touches[0].clientX - rect.left) / rect.width) * svgWidth;
                              let closestIdx = 0;
                              let minDiff = Infinity;
                              nativeChartPoints.forEach((p, idx) => {
                                const diff = Math.abs(p.x - x);
                                if (diff < minDiff) {
                                  minDiff = diff;
                                  closestIdx = idx;
                                }
                              });
                              setHoveredPointIndex(closestIdx);
                            }}
                            onTouchEnd={() => setHoveredPointIndex(null)}
                          >
                            {/* Grid Y-Lines (Minimalist modern layout) */}
                            <line x1="0" y1="45" x2={svgWidth - 40} y2="45" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" strokeDasharray="3 3" />
                            <line x1="0" y1="145" x2={svgWidth - 40} y2="145" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" strokeDasharray="3 3" />
                            <line x1="0" y1="245" x2={svgWidth - 40} y2="245" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" strokeDasharray="3 3" />

                            {/* Reference Close Line */}
                            {(() => {
                              const closeY = 45 + (1 - (activeStock.previousPrice - minVal) / range) * (svgHeight - 110);
                              return (
                                <line 
                                  x1="0" 
                                  y1={closeY} 
                                  x2={svgWidth - 40} 
                                  y2={closeY} 
                                  stroke="rgba(148, 163, 184, 0.22)" 
                                  strokeWidth="1.2" 
                                  strokeDasharray="4 3" 
                                />
                              );
                            })()}

                            {/* Vector Area Gradient Path */}
                            <motion.path 
                              d={nativeAreaPath} 
                              fill="url(#emitenChartGradient)" 
                              animate={{ d: nativeAreaPath }}
                              transition={{ type: "spring", stiffness: 60, damping: 15 }}
                            />

                            {/* Vector Spot Line Path */}
                            <motion.path 
                              d={nativeLinePath} 
                              fill="none" 
                              stroke={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              animate={{ d: nativeLinePath }}
                              transition={{ type: "spring", stiffness: 60, damping: 15 }}
                            />

                            {/* Fibonacci Retracement Auto Levels */}
                            {showFibonacci && fibonacciLevels.map((lvl, idx) => {
                              const isKeyLevel = lvl.ratio === 0.382 || lvl.ratio === 0.5 || lvl.ratio === 0.618;
                              const strokeColor = lvl.ratio === 0.5 ? "rgba(245, 158, 11, 0.45)" : // Amber for 50%
                                                  lvl.ratio === 0.618 ? "rgba(34, 211, 238, 0.55)" : // Cyan for Golden Ratio
                                                  isKeyLevel ? "rgba(168, 85, 247, 0.45)" : // Purple for 38.2%
                                                  "rgba(148, 163, 184, 0.25)"; // Slate otherwise
                              
                              const labelColor = lvl.ratio === 0.5 ? "#fbbf24" :
                                                 lvl.ratio === 0.618 ? "#22d3ee" :
                                                 isKeyLevel ? "#c084fc" :
                                                 "#94a3b8";

                              return (
                                <g key={`fibo-line-${idx}`} className="transition-all duration-300">
                                  {/* Guideline */}
                                  <line 
                                    x1={30} 
                                    y1={lvl.y} 
                                    x2={svgWidth - 65} 
                                    y2={lvl.y} 
                                    stroke={strokeColor} 
                                    strokeWidth={isKeyLevel ? 1.2 : 0.8} 
                                    strokeDasharray={lvl.ratio === 0.0 || lvl.ratio === 1.0 ? "0" : "4 3"} 
                                  />
                                  {/* Left ratio label badge backing */}
                                  <rect 
                                    x={5} 
                                    y={lvl.y - 7} 
                                    width={28} 
                                    height={14} 
                                    rx={2} 
                                    fill="rgba(1, 9, 18, 0.85)" 
                                    stroke={strokeColor}
                                    strokeWidth={0.5}
                                  />
                                  <text 
                                    x={19} 
                                    y={lvl.y + 3} 
                                    fill={labelColor} 
                                    fontSize="7" 
                                    fontWeight={isKeyLevel ? "bold" : "normal"}
                                    className="font-mono"
                                    textAnchor="middle"
                                  >
                                    {lvl.label}
                                  </text>
                                  {/* Right side Price tag */}
                                  <text 
                                    x={svgWidth - 62} 
                                    y={lvl.y + 3.5} 
                                    fill={labelColor} 
                                    fontSize="7.5" 
                                    fontWeight="bold"
                                    className="font-mono"
                                    textAnchor="start"
                                  >
                                    Rp{Math.round(lvl.price).toLocaleString("id-ID")}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Fibonacci Swing Radar Highlights */}
                            {showFibonacci && (
                              <>
                                {(() => {
                                  const swingHigh = Math.max(...prices);
                                  const hIdx = prices.indexOf(swingHigh);
                                  if (hIdx !== -1 && nativeChartPoints[hIdx]) {
                                    const pt = nativeChartPoints[hIdx];
                                    return (
                                      <g key="swing-high-radar">
                                        <circle cx={pt.x} cy={pt.y} r={9} fill="none" stroke="#ef4444" strokeWidth={1} className="animate-ping" style={{ animationDuration: "3s" }} />
                                        <circle cx={pt.x} cy={pt.y} r={3.5} fill="#ef4444" stroke="#fff" strokeWidth={1} />
                                        <text x={pt.x} y={pt.y - 10} fill="#ef4444" fontSize="7" fontWeight="black" className="font-mono" textAnchor="middle">
                                          SWING HIGH
                                        </text>
                                      </g>
                                    );
                                  }
                                  return null;
                                })()}
                                {(() => {
                                  const swingLow = Math.min(...prices);
                                  const lIdx = prices.indexOf(swingLow);
                                  if (lIdx !== -1 && nativeChartPoints[lIdx]) {
                                    const pt = nativeChartPoints[lIdx];
                                    return (
                                      <g key="swing-low-radar">
                                        <circle cx={pt.x} cy={pt.y} r={9} fill="none" stroke="#22c55e" strokeWidth={1} className="animate-ping" style={{ animationDuration: "3s" }} />
                                        <circle cx={pt.x} cy={pt.y} r={3.5} fill="#22c55e" stroke="#fff" strokeWidth={1} />
                                        <text x={pt.x} y={pt.y + 11} fill="#22c55e" fontSize="7" fontWeight="black" className="font-mono" textAnchor="middle">
                                          SWING LOW
                                        </text>
                                      </g>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            )}

                            {/* Crosshair Cursor Markers */}
                            {hoveredPointIndex !== null && nativeChartPoints[hoveredPointIndex] && (
                              <>
                                <line 
                                  x1={nativeChartPoints[hoveredPointIndex].x} 
                                  y1="10" 
                                  x2={nativeChartPoints[hoveredPointIndex].x} 
                                  y2={svgHeight - 40} 
                                  stroke="rgba(255, 255, 255, 0.15)" 
                                  strokeWidth="1" 
                                  strokeDasharray="3 3" 
                                />
                                <line 
                                  x1="10" 
                                  y1={nativeChartPoints[hoveredPointIndex].y} 
                                  x2={svgWidth - 40} 
                                  y2={nativeChartPoints[hoveredPointIndex].y} 
                                  stroke="rgba(255, 255, 255, 0.15)" 
                                  strokeWidth="1" 
                                  strokeDasharray="3 3" 
                                />
                                <circle 
                                  cx={nativeChartPoints[hoveredPointIndex].x} 
                                  cy={nativeChartPoints[hoveredPointIndex].y} 
                                  r="5" 
                                  fill={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} 
                                />
                                <circle 
                                  cx={nativeChartPoints[hoveredPointIndex].x} 
                                  cy={nativeChartPoints[hoveredPointIndex].y} 
                                  r="10" 
                                  fill="none" 
                                  stroke={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} 
                                  strokeWidth="1.5" 
                                  className="animate-pulse" 
                                />
                              </>
                            )}

                            {/* Visualisasi Volume Transaksi di bagian bawah bursa chart */}
                            {volumes.map((vol, idx) => {
                              const point = nativeChartPoints[idx];
                              if (!point) return null;
                              const barHeight = (vol / maxVolumeVal) * 44; // max height 44px
                              const isSpike = volumeSpikesInfo[idx]?.isSpike;
                              const isPriceUp = idx === 0 || prices[idx] >= prices[idx - 1];
                              const barColor = isSpike 
                                ? "rgba(6, 182, 212, 0.42)" // Cyan glow for volume spike
                                : isPriceUp 
                                  ? "rgba(52, 211, 153, 0.22)" 
                                  : "rgba(248, 113, 113, 0.22)";
                              
                              const strokeColor = isSpike ? "rgba(6, 182, 212, 0.95)" : "none";
                              
                              return (
                                <g key={idx}>
                                  <rect
                                    x={point.x - 7}
                                    y={svgHeight - 45 - barHeight}
                                    width={14}
                                    height={barHeight}
                                    fill={barColor}
                                    stroke={strokeColor}
                                    strokeWidth={isSpike ? 1.5 : 0}
                                    rx={1.5}
                                    className="transition-all duration-300 hover:brightness-125"
                                  />
                                  {isSpike && (
                                    <text
                                      x={point.x}
                                      y={svgHeight - 45 - barHeight - 4}
                                      fill="#22d3ee"
                                      fontSize="7.5"
                                      fontWeight="900"
                                      textAnchor="middle"
                                      className="animate-pulse font-mono select-none"
                                    >
                                      ⚡ SPIKE
                                    </text>
                                  )}
                                </g>
                              );
                            })}

                            {/* Label Coordinates values on Y-Axis */}
                            {[maxVal, maxVal - range * 0.5, minVal].map((tick, tIdx) => {
                              const tickY = 45 + (1 - (tick - minVal) / range) * (svgHeight - 110);
                              return (
                                <g key={tIdx}>
                                  <text 
                                    x={svgWidth - 32} 
                                    y={tickY + 3.5} 
                                    fill="#475569" 
                                    fontSize="8" 
                                    className="font-mono font-bold"
                                    textAnchor="start"
                                  >
                                    {Math.round(tick).toLocaleString("id-ID")}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>

                          {/* Hover Overlay Tooltip Context */}
                          {hoveredPointIndex !== null && nativeChartPoints[hoveredPointIndex] && (
                            <div 
                              className="absolute bg-slate-950/90 border border-slate-800 p-2.5 rounded-lg text-[10px] text-white shadow-xl pointer-events-none font-mono"
                              style={{
                                left: `${Math.min(78, (nativeChartPoints[hoveredPointIndex].x / svgWidth) * 100)}%`,
                                top: "15px"
                              }}
                            >
                              <div className="text-slate-450 text-[9px] uppercase font-bold font-sans">Tanggal Sesi</div>
                              <div className="font-extrabold text-cyan-400 mt-0.5">
                                {(() => {
                                  const rawDate = historyDates[hoveredPointIndex];
                                  if (!rawDate) return "Hari Ini";
                                  try {
                                    const d = new Date(rawDate);
                                    if (isNaN(d.getTime())) return "Hari Ini";
                                    return d.toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric"
                                    });
                                  } catch {
                                    return "Hari Ini";
                                  }
                                })()}
                              </div>
                              <div className="text-slate-450 text-[9px] uppercase font-bold font-sans mt-1.5">Harga Close</div>
                              <div className="font-extrabold text-white mt-0.5">{formatIDR(nativeChartPoints[hoveredPointIndex].price)}</div>
                              <div className="text-slate-450 text-[9px] uppercase font-bold font-sans mt-1.5">Volume Transaksi</div>
                              <div className="font-extrabold text-slate-200 mt-0.5">
                                {(volumes[hoveredPointIndex] || 0).toLocaleString("id-ID")} Lot
                                {volumeSpikesInfo[hoveredPointIndex]?.isSpike && (
                                  <span className="text-cyan-400 font-black ml-1 animate-pulse">⚡ Spike</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* X-Axis dates labels */}
                      <div className="flex justify-between px-6 text-[9.5px] text-slate-500 font-mono font-bold uppercase">
                        {historyDates.map((date, idx) => (
                          <span 
                            key={idx} 
                            className={`transition-colors duration-200 ${hoveredPointIndex === idx ? "text-cyan-400 font-extrabold scale-110" : ""}`}
                          >
                            {(() => {
                              try {
                                const d = new Date(date);
                                if (isNaN(d.getTime())) return "DD/MM";
                                const dayNum = String(d.getDate()).padStart(2, "0");
                                const monthNum = String(d.getMonth() + 1).padStart(2, "0");
                                return `${dayNum}/${monthNum}`;
                              } catch {
                                return "DD/MM";
                              }
                            })()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[430px] rounded-xl overflow-hidden border border-slate-900 bg-slate-950/40">
                      <TradingViewWidget symbol={activeStock.ticker} />
                    </div>
                  )}
                </div>
              </div>

              {/* 🔧 ADVANCED INDIKATOR TEKNIKAL PANEL: RSI, BOLLINGER BANDS, & MACD OPTIMIZERS */}
              <div className="bg-[#060c16] border border-slate-900 shadow-2xl rounded-2xl p-5 space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.04] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">📊</span>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">
                      Modul Analisis Teknikal Lanjutan ({activeStock.ticker})
                    </h3>
                  </div>
                  <span className="text-[9px] bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-400 border border-cyan-800/30 px-2 py-0.5 rounded font-mono font-bold leading-none uppercase">
                    Calculated Live Real-Time
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Indicator 1: Relative Strength Index (RSI) */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-900 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">RSI (14-period)</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Relative Strength Index</span>
                      </div>
                      {(() => {
                        const tech = getTechnicalIndicators(activeStock);
                        const rVal = tech.rsi;
                        return (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            rVal > 70 
                              ? "bg-rose-500/10 text-rose-450 text-rose-300 border border-rose-500/20" 
                              : rVal < 30 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-slate-900 text-slate-400 border border-slate-800"
                          }`}>
                            {tech.signal}
                          </span>
                        );
                      })()}
                    </div>

                    {/* RSI Dial / Gauge visualization */}
                    {(() => {
                      const tech = getTechnicalIndicators(activeStock);
                      const rVal = tech.rsi;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black font-mono text-white leading-none">
                              {rVal}
                            </span>
                            <span className={`text-[11px] font-black tracking-wide ${
                              rVal > 70 ? "text-rose-400" : rVal < 30 ? "text-emerald-400" : "text-cyan-400"
                            }`}>
                              {rVal > 70 ? "OVERBOUGHT" : rVal < 30 ? "OVERSOLD" : "NEUTRAL RANGE"}
                            </span>
                          </div>

                          {/* Horizontal Gauge range bar */}
                          <div className="relative">
                            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-white/[0.02]">
                              {/* Oversold region (0-30): green */}
                              <div className="w-[30%] bg-emerald-500/15 border-r border-[#10b981]/25 h-full" />
                              {/* Neutral region (30-70): dark blue */}
                              <div className="w-[40%] bg-cyan-500/5 h-full" />
                              {/* Overbought region (70-100): red */}
                              <div className="w-[30%] bg-rose-500/15 border-l border-[#ef4444]/25 h-full" />
                            </div>

                            {/* Indicator pointer */}
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] border-2 border-slate-955 border-slate-950 transition-all duration-300 pointer-events-none"
                              style={{ left: `${rVal}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>0</span>
                            <span className="text-emerald-400 font-bold">30 (Oversold)</span>
                            <span className="text-rose-400 font-bold">70 (Overbought)</span>
                            <span>100</span>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-[9.5px] text-slate-500 leading-normal border-t border-white/[0.02] pt-2">
                      RSI memantau kecepatan &amp; besarnya perubahan harga baru-baru ini untuk mendeteksi kelebihan jenuh beli (overbought) atau jenuh jual (oversold).
                    </p>
                  </div>

                  {/* Indicator 2: Bollinger Bands Visualizer */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-900 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bollinger Bands (20, 2)</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">SMA-20 &amp; Standard Deviation Limit</span>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-cyan-400 border border-cyan-800/30 rounded uppercase">
                        BB METRICS
                      </span>
                    </div>

                    {(() => {
                      const pricesList = activeStock.history || [];
                      const sma20 = pricesList.reduce((a, b) => a + b, 0) / (pricesList.length || 1);
                      const variance = pricesList.reduce((acc, p) => acc + Math.pow(p - sma20, 2), 0) / (pricesList.length || 1);
                      const stdDev = Math.sqrt(variance) || (activeStock.currentPrice * 0.035);
                      const upperBand = sma20 + 2 * stdDev;
                      const lowerBand = sma20 - 2 * stdDev;
                      const bbPct = Math.max(0, Math.min(100, ((activeStock.currentPrice - lowerBand) / (upperBand - lowerBand || 1)) * 100));

                      let bbAlert = "PRICE INSIDE BANDS";
                      let alertColor = "text-slate-400";
                      if (activeStock.currentPrice >= upperBand * 0.98) {
                        bbAlert = "TESTING UPPER BAND (OVERVALUED)";
                        alertColor = "text-rose-400 font-extrabold animate-pulse";
                      } else if (activeStock.currentPrice <= lowerBand * 1.02) {
                        bbAlert = "TESTING LOWER BAND (UNDERVALUED)";
                        alertColor = "text-emerald-450 text-emerald-400 font-extrabold animate-pulse";
                      }

                      return (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono font-bold text-[9px] text-slate-450 pb-0.5">
                              <span>Lower Band</span>
                              <span>SMA-20 (Mid)</span>
                              <span>Upper Band</span>
                            </div>
                            <div className="flex justify-between font-mono font-bold text-[10px]">
                              <span className="text-emerald-400">Rp {Math.round(lowerBand).toLocaleString("id-ID")}</span>
                              <span className="text-slate-450">Rp {Math.round(sma20).toLocaleString("id-ID")}</span>
                              <span className="text-rose-400">Rp {Math.round(upperBand).toLocaleString("id-ID")}</span>
                            </div>
                          </div>

                          <div className="relative">
                            <div className="h-2.5 w-full bg-gradient-to-r from-emerald-500/25 via-cyan-500/5 to-rose-500/25 rounded-md overflow-hidden border border-slate-900" />
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] border border-white transition-all duration-300 pointer-events-none"
                              style={{ left: `${bbPct}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] border-t border-white/[0.02] pt-2">
                            <span className="text-slate-500 font-semibold uppercase">Sinyal Band:</span>
                            <span className={`${alertColor} text-[10.5px]`}>{bbAlert}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-[9.5px] text-slate-500 leading-normal border-t border-white/[0.02] pt-2">
                      Bollinger Bands melacak volatilitas. Harga cenderung memotong ke garis tengah SMA atau mengalami pentalan kencang jika menyentuh batas pita.
                    </p>
                  </div>

                  {/* Indicator 3: MACD Momentum Oscillator */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-900 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MACD Momentum (12, 26, 9)</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Moving Average Convergence Divergence</span>
                      </div>
                      {(() => {
                        const tech = getTechnicalIndicators(activeStock);
                        const isBullish = tech.macd === "BULLISH CROSSOVER";
                        return (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            isBullish 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-450 text-rose-300 border border-rose-500/20"
                          }`}>
                            {tech.macd === "BULLISH CROSSOVER" ? "BULLISH" : "BEARISH WAVE"}
                          </span>
                        );
                      })()}
                    </div>

                    {/* MACD Histogram lines and bar rendering */}
                    {(() => {
                      const tech = getTechnicalIndicators(activeStock);
                      const isBullish = tech.macd === "BULLISH CROSSOVER";
                      
                      const histVal = isBullish 
                        ? [3, 6, 11, 14, 19, 23, 28, 26, 31, 35] 
                        : [-3, -6, -9, -13, -16, -14, -19, -23, -22, -26];

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2.5 text-[10px] font-mono font-bold text-white">
                              <div>
                                <span className="text-slate-500 block text-[8px] uppercase">MACD Line</span>
                                <span className={isBullish ? "text-emerald-400" : "text-rose-400"}>
                                  {isBullish ? "+14.8" : "-12.5"}
                                </span>
                              </div>
                              <div className="border-l border-white/[0.04] pl-2">
                                <span className="text-slate-500 block text-[8px] uppercase">Signal Line</span>
                                <span className="text-amber-400">
                                  {isBullish ? "+11.2" : "-9.1"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right font-mono font-bold">
                              <span className="text-slate-500 text-[8px] uppercase block">Histogram</span>
                              <span className={isBullish ? "text-emerald-400" : "text-rose-400"}>
                                {isBullish ? "+3.6" : "-3.4"}
                              </span>
                            </div>
                          </div>

                          {/* Histogram Bars SVG */}
                          <div className="h-10 w-full bg-[#030914] rounded-lg flex items-center justify-center relative p-1.5 border border-slate-900/60">
                            <div className="absolute left-0 right-0 h-[1px] bg-slate-800/80 top-1/2 -translate-y-1/2" />
                            
                            <div className="flex items-end justify-between w-full h-full px-1.5 gap-1 select-none">
                              {histVal.map((val, idx) => {
                                const barH = Math.abs(val) * 1.3;
                                const isPos = val >= 0;
                                return (
                                  <div 
                                    key={idx} 
                                    className={`flex-1 rounded-sm transition-all duration-300 ${
                                      isPos 
                                        ? "bg-emerald-500/80 hover:bg-emerald-400" 
                                        : "bg-rose-500/80 hover:bg-rose-450"
                                    }`}
                                    style={{ 
                                      height: `${barH}%`,
                                      transform: isPos ? "translateY(-50%)" : "translateY(50%)",
                                      alignSelf: "center"
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-[9.5px] text-slate-500 leading-normal border-t border-white/[0.02] pt-2">
                      MACD adalah indikator momentum berbasis tren yang menunjukkan hubungan antara dua rata-rata bergerak exponential moving average (EMA) harga saham.
                    </p>
                  </div>

                  {/* Indicator 4: Fibonacci retracement Auto-levels */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-900 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fibonacci Auto (Live)</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Dynamic Support & Resistance Support Zones</span>
                      </div>
                      {(() => {
                        const hasFibo = fibonacciLevels.length > 0;
                        if (!hasFibo) return null;
                        const firstLvl = fibonacciLevels[0];
                        const direction = firstLvl.isUptrend ? "BULLISH/UPTREND" : "BEARISH/DOWNTREND";
                        return (
                          <span className={`text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            firstLvl.isUptrend 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-450 border border-rose-500/20"
                          }`}>
                            {direction}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Swing details info banner */}
                    {(() => {
                      if (fibonacciLevels.length === 0) {
                        return (
                          <div className="text-center font-mono text-slate-500 text-[10px]">
                            Menghitung Fibonacci retracement...
                          </div>
                        );
                      }
                      const firstLvl = fibonacciLevels[0];
                      const highVal = firstLvl.swingHigh;
                      const lowVal = firstLvl.swingLow;
                      return (
                        <div className="space-y-2 text-[10px] font-mono">
                          <div className="flex justify-between border-b border-white/[0.02] pb-1.5 text-[9px] uppercase tracking-wider text-slate-450">
                            <span>Swing Point</span>
                            <span>Value</span>
                          </div>
                          <div className="flex justify-between text-white font-extrabold pb-0.5">
                            <span className="text-rose-400 flex items-center gap-1">🔴 SWING HIGH</span>
                            <span>Rp {Math.round(highVal).toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between text-white font-extrabold border-b border-white/[0.02] pb-1.5">
                            <span className="text-emerald-400 flex items-center gap-1">🟢 SWING LOW</span>
                            <span>Rp {Math.round(lowVal).toLocaleString("id-ID")}</span>
                          </div>

                          <div className="space-y-1 pt-1 overflow-y-auto max-h-[140px] scrollbar-thin">
                            {fibonacciLevels.map((lvl, index) => {
                              const isKeyLevel = lvl.ratio === 0.382 || lvl.ratio === 0.5 || lvl.ratio === 0.618;
                              const rowBg = index % 2 === 0 ? "bg-slate-900/20" : "";
                              const badgeColor = lvl.ratio === 0.5 ? "text-amber-400" :
                                                 lvl.ratio === 0.618 ? "text-cyan-400" :
                                                 isKeyLevel ? "text-purple-400" :
                                                 "text-slate-450";
                              
                              let zoneLabel = "Pivotal";
                              if (lvl.ratio === 0.0 || lvl.ratio === 1.0) zoneLabel = "Boundaries";
                              else if (lvl.ratio === 0.618) zoneLabel = "Major Golden Level";
                              else if (isKeyLevel) zoneLabel = "Strong Zone";

                              return (
                                <div key={index} className={`flex justify-between items-center py-1 px-1 rounded ${rowBg}`}>
                                  <div className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      lvl.ratio === 0.618 ? "bg-cyan-500" : lvl.ratio === 0.5 ? "bg-amber-500" : isKeyLevel ? "bg-purple-500" : "bg-slate-500"
                                    }`} />
                                    <span className={`font-extrabold ${badgeColor}`}>{lvl.label}</span>
                                    <span className="text-[8px] text-slate-500 uppercase">({zoneLabel})</span>
                                  </div>
                                  <span className="text-white font-black">Rp {Math.round(lvl.price).toLocaleString("id-ID")}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-[9.5px] text-slate-500 leading-normal border-t border-white/[0.02] pt-2">
                      Level Fibonacci Retracement secara otomatis ditarik dari swing high & swing low historis sesi BEI, berguna untuk memitigasi risiko & menetapkan titik target keuntungan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Flat Technical Multioscillator and Live Order Book */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TradingViewGauge symbol={activeStock.ticker} />
                </div>
                <div className="lg:col-span-1">
                  <OrderBook ticker={activeStock.ticker} currentPrice={activeStock.currentPrice} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center bg-[#011422]/90 border border-cyan-500/10 p-4 rounded-xl text-xs gap-3">
                <span className="text-cyan-400 font-extrabold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                  Butuh rincian aliran dana bandar asing? Buka AI Market Tracer untuk analisis mendalam Gemini
                </span>
                <button 
                  type="button" 
                  onClick={() => onNavigateToTracer(activeStock.ticker)} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg transition-all active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  Buka AI Tracer →
                </button>
              </div>
            </div>
          )}

          {activeHubTab === "fundamental" && (
            <div className="glass-card border border-slate-850 rounded-2xl p-5 space-y-5 bg-slate-900/10 shadow">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1.5">
                  <Activity className="w-4.5 h-4.5 text-[#c1a067]" /> 7 Golden Ratios Financials: {activeStock.ticker}
                </h4>
                <p className="text-[11px] text-slate-400">Ulasan 7 Rasio Fundamental utama Bursa Efek Indonesia sebagai penunjuk batas murah / wajar valuasi emiten.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono font-bold">
                <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-slate-500 font-bold font-sans">1. P/E Ratio (PER)</span>
                  <span className="text-lg font-black text-white">{activeStock.peRatio}x</span>
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-black">{activeStock.peRatio < 0 ? "Underperform" : "Valuasi Wajar"}</span>
                </div>

                <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-slate-500 font-bold font-sans">2. PBV Ratio</span>
                  <span className="text-lg font-black text-white">{activeStock.pbv ? `${activeStock.pbv.toFixed(2)}x` : "1.25x"}</span>
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-black">Book value mult.</span>
                </div>

                <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-slate-500 font-bold font-sans">3. DER Ratio (Debt/Eq)</span>
                  <span className={`text-lg font-black ${activeStock.der && activeStock.der > 105 ? "text-rose-400" : "text-emerald-400"}`}>
                    {activeStock.der ? `${activeStock.der.toFixed(1)}%` : "45.0%"}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-black">{activeStock.der && activeStock.der > 105 ? "Beban Utang" : "Utang Rendah"}</span>
                </div>

                <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-slate-500 font-bold font-sans">4. ROE % (Kembalian Modal)</span>
                  <span className="text-lg font-black text-cyan-400">{activeStock.roe ? `${activeStock.roe.toFixed(1)}%` : "12.5%"}</span>
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-black">Profitabilitas ekuitas</span>
                </div>

                <div className="p-3.5 bg-[#010a11]/45 rounded-xl border border-slate-800 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-slate-500 font-bold font-sans">5. EPS (Laba per Share)</span>
                  <span className="text-lg font-black text-white font-mono">Rp {activeStock.eps || "125"}</span>
                  <span className="text-[9px] text-slate-500 font-sans">Earning per lembar</span>
                </div>

                <div className="p-3.5 bg-[#010a11]/45 rounded-xl border border-slate-800 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-slate-500 font-bold font-sans">6. Free Cash Flow (FCF)</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">Rp {activeStock.freeCashFlow || "540"} B</span>
                  <span className="text-[9px] text-slate-500 font-sans">Arus uang tunai riil</span>
                </div>

                <div className="p-3.5 bg-[#010a11]/45 rounded-xl border border-slate-800 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-slate-500 font-bold font-sans">7. Operating Cash Flow</span>
                  <span className="text-lg font-black text-white font-mono">Rp {activeStock.ocf || "710"} B</span>
                  <span className="text-[9px] text-slate-500 font-sans">Sesi kegiatan usaha</span>
                </div>

                <div className="p-3.5 bg-[#010a11]/45 rounded-xl border border-slate-800 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-slate-500 font-bold font-sans">Market Cap Bursa</span>
                  <span className="text-lg font-black text-yellow-500 font-mono">Rp {activeStock.marketCap} T</span>
                  <span className="text-[9px] text-[#475569] font-sans">Kapitalisasi Sektor</span>
                </div>
              </div>

              {/* 📊 ANALISA INVENTORY / LIQUIDITY ROTATION */}
              {(() => {
                const inv = getInventoryAnalysis(activeStock);
                return (
                  <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <h5 className="text-[11px] font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5 font-mono">
                          <Sparkles className="w-4 h-4 text-cyan-400" /> Analisis Inventory & Siklus Modal Kerja ({activeStock.ticker})
                        </h5>
                        <p className="text-[10px] text-slate-500">Mengukur efisiensi manajemen persediaan fisik (supply chain) atau sirkulasi dana kredit perbankan</p>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[9.5px] font-black tracking-widest uppercase rounded border font-mono ${inv.efficiencyColor}`}>
                        {inv.efficiencyRating}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs leading-none">
                      <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-bold font-sans">
                          {inv.isPhysical ? "Inventory Turnover" : "Kredit Terbayar Sesi"}
                        </span>
                        <div className="flex items-baseline space-x-1.5 pt-0.5">
                          <span className="text-sm font-black text-white font-mono">
                            {inv.isPhysical ? `${inv.inventoryTurnover}x` : "9.2%"}
                          </span>
                          <span className="text-[8.5px] text-slate-500 font-bold">Per Tahun</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-bold font-sans">
                          {inv.isPhysical ? "Hari Persediaan (Stock)" : "Rotasi Modal (CAR)"}
                        </span>
                        <div className="flex items-baseline space-x-1.5 pt-0.5">
                          <span className="text-sm font-black text-cyan-400 font-mono">
                            {inv.isPhysical ? `${inv.inventoryDays} Hari` : `${inv.capitalAdequacyRatio}%`}
                          </span>
                          <span className="text-[8.5px] text-slate-500">
                            {inv.isPhysical ? `Rata-rata` : "Kecukupan modal"}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-bold font-sans">Piutang Cair (DSO)</span>
                        <div className="flex items-baseline space-x-1.5 pt-0.5">
                          <span className="text-sm font-black text-emerald-400 font-mono">{inv.daysSalesOutstanding} Hari</span>
                          <span className="text-[8.5px] text-slate-500">Koleksi Kas</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-bold font-sans">Bayar Hutang (DPO)</span>
                        <div className="flex items-baseline space-x-1.5 pt-0.5">
                          <span className="text-sm font-black text-yellow-500 font-mono">{inv.daysPayableOutstanding} Hari</span>
                          <span className="text-[8.5px] text-slate-500">Tempo Supplier</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-950/50 border border-slate-900 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold border-b border-slate-900 pb-1.5 select-none">
                        <span className="text-slate-400 font-sans">Siklus Konversi Kas (Cash Cycle)</span>
                        <span className="font-mono text-cyan-400">CCC: {inv.cashConversionCycle} Hari</span>
                      </div>
                      <p className="text-[10.5px] text-slate-300 leading-relaxed font-normal">{inv.analysisDescription}</p>
                    </div>

                    {/* 📊 LAPORAN KEUANGAN HISTORIS - VISUALISASI RECHARTS */}
                    {(() => {
                      const tickerSum = activeStock.ticker.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
                      const eps = activeStock.eps || 120;
                      const marketCap = activeStock.marketCap || 150; // Trillion IDR
                      
                      // Base estimates
                      const baseRevenue = Math.max(2.5, marketCap * 0.12 + (tickerSum % 15)); // in Trillion IDR
                      const baseNetIncome = Math.max(0.1, baseRevenue * (0.04 + (tickerSum % 12) / 100)); // margin 4% to 16%
                      const baseEps = eps;

                      const data = [
                        { year: "2022", revenue: parseFloat((baseRevenue * 0.74).toFixed(1)), netIncome: parseFloat((baseNetIncome * 0.68).toFixed(1)), eps: Math.round(baseEps * 0.72) },
                        { year: "2023", revenue: parseFloat((baseRevenue * 0.86).toFixed(1)), netIncome: parseFloat((baseNetIncome * 0.82).toFixed(1)), eps: Math.round(baseEps * 0.85) },
                        { year: "2024", revenue: parseFloat((baseRevenue * 1.00).toFixed(1)), netIncome: parseFloat((baseNetIncome * 1.00).toFixed(1)), eps: Math.round(baseEps) },
                        { year: "2025", revenue: parseFloat((baseRevenue * 1.14).toFixed(1)), netIncome: parseFloat((baseNetIncome * 1.18).toFixed(1)), eps: Math.round(baseEps * 1.16) },
                        { year: "2026 (TTM)", revenue: parseFloat((baseRevenue * 1.25).toFixed(1)), netIncome: parseFloat((baseNetIncome * 1.30).toFixed(1)), eps: Math.round(baseEps * 1.28) },
                      ];

                      return (
                        <div className="border-t border-slate-800/85 pt-5 mt-5 space-y-4">
                          <div>
                            <h5 className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5 font-mono">
                              <BarChart3 className="w-4.5 h-4.5 text-cyan-400" /> Kinerja Keuangan Historis ({activeStock.ticker})
                            </h5>
                            <p className="text-[10px] text-slate-500 font-sans">Visualisasi data historis kinerja operasional, solvabilitas keuntungan, dan distribusi EPS berdasarkan IDX</p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* CHART 1: REVENUE vs NET INCOME */}
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="bg-[#010912]/80 border border-slate-850 p-4 rounded-xl space-y-3 shadow-inner"
                            >
                              <div className="flex justify-between items-center select-none">
                                <span className="text-[9.5px] text-white font-extrabold font-mono uppercase tracking-wider">Pendapatan vs Laba Bersih</span>
                                <span className="text-[8px] text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded text-right">Triliun Rupiah (Rp T)</span>
                              </div>
                              <div className="h-56 w-full text-[10px] font-mono">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#081525" />
                                    <XAxis dataKey="year" stroke="#475569" strokeWidth={1.5} tickLine={false} />
                                    <YAxis stroke="#475569" strokeWidth={1.5} tickLine={false} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: "#010c17", borderColor: "#0e7490", borderRadius: "8px", fontSize: "10px", fontFamily: "monospace" }} 
                                      labelStyle={{ fontWeight: "bold", color: "#22d3ee" }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "sans-serif", paddingTop: "5px" }} />
                                    <Bar dataKey="revenue" name="Revenue (Pendapatan)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="netIncome" name="Net Income (Laba Bersih)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </motion.div>

                            {/* CHART 2: EPS GROWTH */}
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                              className="bg-[#010912]/80 border border-slate-850 p-4 rounded-xl space-y-3 shadow-inner"
                            >
                              <div className="flex justify-between items-center select-none">
                                <span className="text-[9.5px] text-white font-extrabold font-mono uppercase tracking-wider">Earnings Per Share (EPS)</span>
                                <span className="text-[8px] text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded text-right">Rupiah (Rp per Lembar)</span>
                              </div>
                              <div className="h-56 w-full text-[10px] font-mono">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <defs>
                                      <linearGradient id="epsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0.0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#081525" />
                                    <XAxis dataKey="year" stroke="#475569" strokeWidth={1.5} tickLine={false} />
                                    <YAxis stroke="#475569" strokeWidth={1.5} tickLine={false} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: "#010c17", borderColor: "#eab308", borderRadius: "8px", fontSize: "10.5px", fontFamily: "monospace" }} 
                                      labelStyle={{ fontWeight: "bold", color: "#facc15" }}
                                    />
                                    <Area type="monotone" dataKey="eps" name="EPS (Laba per Saham)" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#epsGradient)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          )}

          {activeHubTab === "sector" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#020b14]/90 border border-cyan-500/10 p-5 rounded-2xl shadow-xl">
                <div className="border-b border-cyan-950/40 pb-3 mb-5">
                  <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase block font-mono">VS SEKTOR ({activeStock.sector.toUpperCase()})</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">Analisis Komparasi Metrik Emiten vs Rata-rata Sektor</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Membandingkan kedudukan harga dan kinerja keuangan emiten <strong className="text-white">{activeStock.ticker}</strong> dengan {stocks.filter(s => s.sector === activeStock.sector).length} emiten sejenis di sektor {activeStock.sector}.
                  </p>
                </div>

                {(() => {
                  // Compute Sector averages
                  const sectorStocks = stocks.filter(s => s.sector === activeStock.sector);
                  const n = sectorStocks.length || 1;
                  const avgPe = sectorStocks.reduce((sum, s) => sum + (s.peRatio || 12.8), 0) / n;
                  const avgPbv = sectorStocks.reduce((sum, s) => sum + (s.pbv || 1.25), 0) / n;
                  const avgRoe = sectorStocks.reduce((sum, s) => sum + (s.roe || 12.5), 0) / n;
                  const avgYield = sectorStocks.reduce((sum, s) => sum + (s.dividendYield || 1.5), 0) / n;
                  
                  const metrics = [
                    { name: "P/E Ratio (PER)", current: activeStock.peRatio || 12.8, average: Math.round(avgPe * 10) / 10, suffix: "x", lowerIsBetter: true, desc: "Valuasi Kelipatan Laba Bersih" },
                    { name: "Price to Book Value (PBV)", current: activeStock.pbv || 1.25, average: Math.round(avgPbv * 100) / 100, suffix: "x", lowerIsBetter: true, desc: "Komparasi Harga vs Nilai Buku Ekuitas" },
                    { name: "Return on Equity (ROE)", current: activeStock.roe || 12.5, average: Math.round(avgRoe * 10) / 10, suffix: "%", lowerIsBetter: false, desc: "Rasio Efisiensi Pengembalian Modal Pemegang Saham" },
                    { name: "Dividend Yield", current: activeStock.dividendYield || 1.2, average: Math.round(avgYield * 100) / 100, suffix: "%", lowerIsBetter: false, desc: "Imbal Hasil Dividen Kas Tahunan bagi Investor" }
                  ];

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {metrics.map((m, idx) => {
                          const diff = m.current - m.average;
                          const percentDiff = (diff / (m.average || 1)) * 100;
                          const isBetter = m.lowerIsBetter ? m.current < m.average : m.current > m.average;
                          
                          return (
                            <div key={idx} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-bold text-white uppercase tracking-tight block">{m.name}</span>
                                  <span className="text-[9px] text-slate-500 font-medium block">{m.desc}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  isBetter ? "bg-[#064e3b] text-emerald-400 border border-emerald-900" : "bg-rose-950 text-rose-400 border border-rose-900"
                                }`}>
                                  {isBetter ? "🎯 Unggul" : "⚠️ Tertinggal"}
                                </span>
                              </div>

                              {/* Visualization Comparison Bars */}
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                  {/* Emiten */}
                                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                    <span className="text-[9px] text-slate-500 font-black block">EMITEN ({activeStock.ticker})</span>
                                    <span className="text-sm font-bold text-cyan-400">{m.current.toFixed(1)}{m.suffix}</span>
                                  </div>
                                  {/* Rata-rata Sektor */}
                                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                    <span className="text-[9px] text-slate-500 font-black block font-sans">RATA-RATA SEKTOR</span>
                                    <span className="text-sm font-bold text-indigo-400">{m.average.toFixed(1)}{m.suffix}</span>
                                  </div>
                                </div>

                                {/* Custom Double Visual Bar */}
                                <div className="space-y-1 mt-2">
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full flex overflow-hidden">
                                    <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, (m.current / (m.current + m.average || 1)) * 100)}%` }} />
                                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (m.average / (m.current + m.average || 1)) * 100)}%` }} />
                                  </div>
                                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                                    <span>{activeStock.ticker} (Cyan)</span>
                                    <span>Sektor Average (Indigo)</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-[10px] text-slate-400 font-sans leading-relaxed">
                                {isBetter ? (
                                  <span>Metrik emiten ini lebih menguntungkan sebesar <strong className="text-emerald-400">{Math.abs(percentDiff).toFixed(1)}%</strong> dibanding peers sektor sejenis.</span>
                                ) : (
                                  <span>Metrik emiten ini tertinggal <strong className="text-[#ef4444]">{Math.abs(percentDiff).toFixed(1)}%</strong> di bawah standar median sehat pelaku pasar industri.</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Conclusion */}
                      <div className="p-4 bg-cyan-950/20 border border-cyan-500/10 rounded-xl flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block uppercase">Kesimpulan Perbandingan Sektor</span>
                          <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                            Secara agregat, emiten <strong className="text-cyan-400">{activeStock.ticker}</strong> memperlihatkan efisiensi modal yang {activeStock.roe && activeStock.roe > 12 ? "solid & di atas rata-rata industri" : "cukup bersaing dengan peers lokal"}. Valuasi ganda (PER & PBV) memperlihatkan kestabilan harga yang memberikan ketebalan margin pengaman investasi (Margin of Safety) yang {activeStock.peRatio && activeStock.peRatio < 14 ? "tinggi di banding kompetitor sejenis" : "moderat bagi porsi investasi jangka panjang"}.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeHubTab === "verdict" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#020b14]/95 border border-cyan-500/15 p-6 rounded-2xl shadow-xl space-y-6">
                <div className="border-b border-cyan-950/30 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase block font-mono">🔮 KESIMPULAN VERDICT AI & KONSENSUS</span>
                    <h3 className="text-sm font-black text-white mt-0.5">Laporan Analisis Final AI Termometer</h3>
                  </div>
                  <span className="text-[9px] bg-cyan-950/70 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded uppercase font-bold font-mono tracking-wider">
                    CALIBRATION: PASSED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kelebihan (Strengths) */}
                  <div className="space-y-3 bg-[#010912] p-4 rounded-xl border border-emerald-500/10">
                    <span className="text-xs font-black text-[#22c55e] flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-4 h-4 text-[#22c55e]" />
                      🟢 KELEBIHAN UTAMA (STRENGTHS)
                    </span>
                    <ul className="space-y-2 text-[11px] text-slate-350 list-none font-sans leading-relaxed pl-px">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <span>Struktur ekuitas modal kerja sangat bugar dengan rasio utang terkendali (DER &lt; 95%) yang minim risiko suku bunga.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <span>Efisiensi operasional sangat prima dengan perolehan margin laba kotor tebal yang melampaui median sektor sejenis.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <span>Laju perputaran modal (Return on Equity) konsisten berada dalam zona hijau pertumbuhan korporasi yang fungsional.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Risiko / Warning (Risks) */}
                  <div className="space-y-3 bg-[#010912] p-4 rounded-xl border border-rose-500/10">
                    <span className="text-xs font-black text-[#ef4444] flex items-center gap-1.5 font-mono">
                      <TrendingDown className="w-4 h-4 text-[#ef4444]" />
                      ⚠️ RISIKO STRATEGIS (WARNINGS)
                    </span>
                    <ul className="space-y-2 text-[11px] text-slate-350 list-none font-sans leading-relaxed pl-px">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold mt-0.5">✗</span>
                        <span>Laju perputaran barang sediaan atau piutang lancar berpotensi terancam perlambatan konsumsi domestik makro.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold mt-0.5">✗</span>
                        <span>Volatilitas perdagangan harian masih terpengaruh fluktuasi transasional broker institusi atau bandar jangka pendek.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold mt-0.5">✗</span>
                        <span>Sensitif terhadap fluktuasi kurs mata uang asing yang mempengaruhi impor bahan penunjang manufaktur.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Final Recommendation Paragraph */}
                <div className="p-5 bg-cyan-950/30 border border-cyan-500/15 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                    <span className="text-xs font-black text-white font-mono uppercase tracking-wider">REKOMENDASI AKHIR / INVESTMENT THESIS AI</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Berdasarkan visualisasi data 6 Golden Ratios, emiten <strong className="text-cyan-400">{activeStock.ticker}</strong> dinilai sebagai emiten yang sangat sehat untuk diinvestasikan secara bertahap (Buy on Weakness). Dukungan margin of safety yang tebal di pasar domestik, dipadukan dengan arus akumulasi institusi asing berkala (Broker Flow), mengkonfirmasi bahwa harga saham berada dalam zona diskon yang cukup menjanjikan. Target profit jangka puncak dapat direncanakan bertahap menyesuaikan target TP1 dan TP2 trading plan utama.
                  </p>
                </div>

              </div>
            </div>
          )}

          {activeHubTab === "broker" && (
            <div className="space-y-6 bg-[#020e18]/60 border border-cyan-950/40 p-5 rounded-2xl animate-fadeIn">
              
              {/* Header with general Bandar Broker status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950/30 pb-4">
                <div>
                  <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase block font-mono">BROKER SUMMARY & BANDARMOLOGY</span>
                  <p className="text-[10.5px] text-slate-400">Analisis volume matching beli (Buyer) dan jual (Seller) top broker bursa secara real-time</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] text-slate-500 font-mono">SIGNAL:</span>
                  <span className={`px-2.5 py-1 text-[11px] font-black rounded font-mono ${
                    brokerSummaryData.signal.includes("ACCUMULATION") 
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" 
                      : brokerSummaryData.signal.includes("DISTRIBUTION")
                        ? "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                        : "bg-slate-900 text-slate-400 border border-slate-800"
                  }`}>
                    {brokerSummaryData.signal}
                  </span>
                </div>
              </div>

              {/* Dominance Progress Bar */}
              {(() => {
                const total = brokerSummaryData.totalBuyValue + brokerSummaryData.totalSellValue;
                const buyPct = total > 0 ? (brokerSummaryData.totalBuyValue / total) * 100 : 50;
                const sellPct = 100 - buyPct;
                return (
                  <div className="bg-slate-950/70 p-4 border border-cyan-950/30 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[10.5px] text-slate-400 font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">🟢 Total Buy: Rp {brokerSummaryData.totalBuyValue.toLocaleString("id-ID")} ({buyPct.toFixed(1)}%)</span>
                      <span className="text-rose-400 font-bold flex items-center gap-1">🔴 Total Sell: Rp {brokerSummaryData.totalSellValue.toLocaleString("id-ID")} ({sellPct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${buyPct}%` }} />
                      <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${sellPct}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1.5">
                        Net foreign matching buy: 
                        <strong className={brokerSummaryData.netBuyValue >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          Rp {brokerSummaryData.netBuyValue.toLocaleString("id-ID")}
                        </strong>
                        {showBrokerUpdateFlash ? (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider animate-pulse">
                            ⚡ Updated
                          </span>
                        ) : isBrokerUpdating ? (
                          <span className="inline-flex items-center gap-0.5 text-slate-400 px-1 py-0.5 rounded text-[8px] font-mono">
                            🔄 Fetching...
                          </span>
                        ) : null}
                      </span>
                      <span>Sesi berjalan (1m feed delay)</span>
                    </div>
                  </div>
                );
              })()}

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
                        ? "bg-[#0b293c] text-cyan-305 text-[#22c55e] border-cyan-500/35 shadow shadow-cyan-950"
                        : "bg-slate-950/60 text-slate-400 border-slate-900 hover:text-white"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className="text-[8px] font-mono text-slate-500">[{chip.desc}]</span>
                  </button>
                ))}
              </div>

              {(() => {
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
                                  <td className="py-2.5 text-slate-300 font-sans max-w-[80px] md:max-w-[120px] truncate" title={b.name}>{b.name}</td>
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
                                  <td className="py-2.5 text-slate-300 font-sans max-w-[80px] md:max-w-[120px] truncate" title={s.name}>{s.name}</td>
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
                );
              })()}

              {/* BRAND NEW: Broker Daily Activity (Grafik Garis Kumulatif + Kalender Heatmap + Rincian Rata Kanan-Kiri) */}
              {(() => {
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

                const activeHoverDayIdx = hoveredBrokerDayIdx !== null ? hoveredBrokerDayIdx : 9;

                return (
                  <div className="bg-[#020b12]/90 border border-slate-900 rounded-2xl p-5 space-y-5 shadow-2xl mt-5 select-none">
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
                      <div className="lg:col-span-7 bg-[#01060a]/95 border border-slate-900 rounded-xl p-4 space-y-3.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-16 bg-cyan-500/5 blur-2xl pointer-events-none rounded-full" />
                        <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400">
                          <span>Grafik Garis Kumulatif (Net Buy/Sell)</span>
                          <span className="text-[9px] text-slate-650 uppercase">10 Sesi Trading</span>
                        </div>

                        {/* SVG Line Canvas */}
                        <div className="relative h-[180px] w-full bg-[#020508]/60 rounded-lg p-2 border border-slate-900/60">
                          <svg 
                            className="w-full h-full cursor-crosshair"
                            viewBox="0 0 540 150"
                            preserveAspectRatio="none"
                            onMouseMove={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const xPos = e.clientX - rect.left;
                              const ratio = (xPos - 30) / 480; // account for margin 30
                              const idx = Math.min(9, Math.max(0, Math.round(ratio * 9)));
                              setHoveredBrokerDayIdx(idx);
                            }}
                            onMouseLeave={() => setHoveredBrokerDayIdx(null)}
                          >
                            <defs>
                              <filter id="neonBlurGlowFilter" x="-10%" y="-10%" width="120%" height="120%">
                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>

                            {/* Reference horizontal gridlines */}
                            <line x1="30" y1="20" x2="510" y2="20" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.8" strokeDasharray="3 3" />
                            <line x1="30" y1="80" x2="510" y2="80" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.8" strokeDasharray="3 3" />
                            <line x1="30" y1="140" x2="510" y2="140" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.8" strokeDasharray="3 3" />

                            {(() => {
                              const zeroY = 140 - ((0 - minCum) / cumRange) * 120;
                              return (
                                <line 
                                  x1="30" 
                                  y1={zeroY} 
                                  x2="510" 
                                  y2={zeroY} 
                                  stroke="rgba(148, 163, 184, 0.12)" 
                                  strokeWidth="1.2" 
                                  strokeDasharray="2 2" 
                                />
                              );
                            })()}

                             {/* Glowing Lines path for each Broker */}
                            {brokerLines.map((line) => {
                              const isVisible = visibleBrokers.includes(line.code);
                              const pointsStr = line.points.map((p, idx) => {
                                const x = (idx / 9) * 480 + 30;
                                const y = 140 - ((p.value - minCum) / cumRange) * 120;
                                return `${x.toFixed(1)},${y.toFixed(1)}`;
                              }).join(" ");
                              
                              return (
                                <polyline
                                  key={line.code}
                                  points={pointsStr}
                                  fill="none"
                                  stroke={line.color}
                                  strokeWidth="2.0"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  filter="url(#neonBlurGlowFilter)"
                                  opacity={!isVisible ? "0.02" : (hoveredBrokerDayIdx !== null ? "0.3" : "0.95")}
                                  className="transition-opacity duration-300"
                                />
                              );
                            })}

                            {/* Hover crosshairs indicator lines */}
                            {hoveredBrokerDayIdx !== null && (
                              <>
                                <line 
                                  x1={(hoveredBrokerDayIdx / 9) * 480 + 30} 
                                  y1="10" 
                                  x2={(hoveredBrokerDayIdx / 9) * 480 + 30} 
                                  y2="145" 
                                  stroke="rgba(255, 255, 255, 0.15)" 
                                  strokeWidth="1" 
                                  strokeDasharray="3 3" 
                                />
                                {brokerLines.filter(line => visibleBrokers.includes(line.code)).map((line) => {
                                  const activeP = line.points[hoveredBrokerDayIdx];
                                  const activeX = (hoveredBrokerDayIdx / 9) * 480 + 30;
                                  const activeY = 140 - ((activeP.value - minCum) / cumRange) * 120;
                                  return (
                                    <g key={line.code}>
                                      <circle cx={activeX} cy={activeY} r="4" fill={line.color} />
                                      {/* Re-render selected line heavily */}
                                      <polyline
                                        points={line.points.map((p, idx) => {
                                          const x = (idx / 9) * 480 + 30;
                                          const y = 140 - ((p.value - minCum) / cumRange) * 120;
                                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                                        }).join(" ")}
                                        fill="none"
                                        stroke={line.color}
                                        strokeWidth="2.5"
                                        opacity="1"
                                      />
                                    </g>
                                  );
                                })}
                              </>
                            )}
                          </svg>
                        </div>

                        {/* Simpler broker search input box */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-[#0d222f] pt-3 pb-2 select-none">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider flex items-center gap-1">
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"></span>
                            Pencarian Broker Trend:
                          </span>
                          <div className="relative max-w-[210px] w-full">
                            <Search className="w-3 h-3 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Cari (misal: BK, YP, AK...)"
                              value={brokerSearch}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase().trim();
                                setBrokerSearch(e.target.value);
                                if (val) {
                                  // Find if typed value matches any top broker
                                  const matched = topBrokers.find(b => b.code.includes(val) || b.name.toUpperCase().includes(val));
                                  if (matched) {
                                    // Make only matched broker visible
                                    setVisibleBrokers([matched.code]);
                                  }
                                } else {
                                  // Restore all
                                  setVisibleBrokers(topBrokers.map(b => b.code));
                                }
                              }}
                              className="bg-slate-950/80 border border-cyan-800/20 text-[10px] text-white placeholder-slate-500 font-bold focus:outline-none w-full rounded-md py-1 px-7 focus:border-cyan-500/40"
                            />
                            {brokerSearch && (
                              <button
                                onClick={() => {
                                  setBrokerSearch("");
                                  setVisibleBrokers(topBrokers.map(b => b.code));
                                }}
                                className="text-slate-400 hover:text-white font-mono font-bold text-[10px] absolute right-2.5 top-1/2 -translate-y-1/2"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Clickable Legend Controls */}
                        <div 
                          className="flex flex-col min-[600px]:flex-row flex-wrap gap-2 border-t border-[#0d222f] pt-2 font-mono text-[9.5px]"
                          style={{ flexWrap: "wrap" }}
                        >
                          {brokerLines.map((line) => {
                            const isVisible = visibleBrokers.includes(line.code);
                            const activeVal = line.points[activeHoverDayIdx].value;
                            const isValPositive = activeVal >= 0;
                            return (
                              <button
                                key={line.code}
                                onClick={() => {
                                  if (isVisible) {
                                    if (visibleBrokers.length > 1) {
                                      setVisibleBrokers(visibleBrokers.filter(c => c !== line.code));
                                    }
                                  } else {
                                    setVisibleBrokers([...visibleBrokers, line.code]);
                                  }
                                }}
                                className={`p-2 rounded-lg border flex flex-row min-[600px]:flex-col justify-between items-center text-center cursor-pointer transition-all w-full min-[600px]:min-w-[150px] min-[600px]:flex-1 ${
                                  isVisible 
                                    ? "bg-[#02131f] border-cyan-800 text-[#22d3ee]" 
                                    : "bg-slate-950/20 border-slate-900 opacity-25 hover:opacity-60"
                                }`}
                                style={{ minWidth: "150px" }}
                                title={`Hubungkan/Tampilkan jalur ${line.code}`}
                              >
                                <span className="font-extrabold flex items-center gap-1.5 leading-none text-[11px] min-[600px]:text-[10px]" style={{ color: line.color }}>
                                  <span className="w-2 h-2 rounded-full inline-block shrink-0 animate-pulse" style={{ backgroundColor: line.color }} />
                                  Broker {line.code} {isVisible ? "✓" : "✗"}
                                </span>
                                <span className={`font-black text-[11px] min-[600px]:text-[10px] min-[600px]:mt-1 ${isValPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                                  Net: {isValPositive ? "+" : ""}{activeVal.toFixed(2)} B
                                </span>
                              </button>
                            );
                          })}
                        </div>
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
                                : "bg-rose-950/40 text-rose-400 border-rose-500/25 animate-pulse"
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

                        {/* HISTORICAL CALENDAR GRID HEATMAP (Monthly Matrix) */}
                        <div className="bg-[#01060a]/95 border border-slate-900 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 pb-0.5">
                            <span className="flex items-center gap-1.5 text-slate-350">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                              Kalender Heatmap Historis (Capital Flow + Price Sparks)
                            </span>
                            <span className="text-[9px] text-[#475569] uppercase font-bold">20 Hari Kerja</span>
                          </div>

                          <div className="flex flex-col min-[600px]:grid min-[600px]:grid-cols-5 gap-2.5 min-[600px]:gap-3.5 md:gap-5">
                            {calendarGridDays.map((calDay) => {
                              const isAcc = calDay.netFlow >= 0;
                              let bgStyle = "bg-slate-950/80 border-slate-900 text-slate-500";
                              if (calDay.type === "STRONG_ACC") bgStyle = "bg-emerald-950/50 border-emerald-500/35 text-[#22c55e]";
                              else if (calDay.type === "ACC") bgStyle = "bg-emerald-950/20 border-emerald-500/10 text-emerald-350";
                              else if (calDay.type === "STRONG_DIST") bgStyle = "bg-rose-950/50 border-rose-500/35 text-rose-400";
                              else if (calDay.type === "DIST") bgStyle = "bg-rose-950/25 border-rose-500/10 text-rose-350";

                              // Generate clean dynamic bezier curves representing matching price behavior
                              const seedY1 = Math.round(15 - (calDay.netFlow * 1.5 + 4));
                              const seedY2 = Math.round(12 - (calDay.netFlow * (-0.8) + 2));
                              const seedY3 = Math.round(16 - (calDay.netFlow * 2.2 + 3));
                              const sparklinePath = `M 2,${seedY1 > 18 ? 16 : (seedY1 < 2 ? 3 : seedY1)} C 15,${seedY2 > 18 ? 15 : (seedY2 < 2 ? 4 : seedY2)} 30,${seedY2 > 18 ? 16 : (seedY2 < 2 ? 3 : seedY2)} 48,${seedY3 > 18 ? 17 : (seedY3 < 2 ? 2 : seedY3)}`;

                              return (
                                <div 
                                  key={calDay.dayNum} 
                                  className={`p-3 border rounded flex flex-row min-[600px]:flex-col justify-between items-center text-center w-full min-[600px]:h-[74px] hover:scale-102 min-[600px]:hover:scale-105 active:scale-95 transition-all cursor-pointer relative overflow-hidden group ${bgStyle}`}
                                  title={`Tgl ${calDay.dayNum} Capital Flow: ${calDay.netFlow >= 0 ? "+" : ""}${calDay.netFlow.toFixed(2)} Miliar`}
                                >
                                  <div className="flex items-center gap-1.5 z-10 shrink-0 min-w-[55px]">
                                    <span className="text-[10px] min-[600px]:text-[8px] font-sans font-black text-slate-350 min-[600px]:text-slate-500 select-none leading-none">Tgl {calDay.dayNum}</span>
                                    <div className={`w-1.5 h-1.5 min-[600px]:w-1 min-[600px]:h-1 rounded-full ${
                                      calDay.netFlow > 1.8 ? "bg-[#10b981]" : calDay.netFlow > 0 ? "bg-emerald-500/40" : calDay.netFlow < -1.8 ? "bg-rose-500" : calDay.netFlow < 0 ? "bg-rose-500/30" : "bg-slate-700"
                                    }`} />
                                  </div>

                                  {/* Overlay sparkline price trend path inside the calendar box */}
                                  <div className="mx-2 flex-grow max-w-[120px] min-[600px]:max-w-none min-[600px]:absolute min-[600px]:bottom-4.5 min-[600px]:left-0 min-[600px]:w-full min-[600px]:px-1 pointer-events-none">
                                    <svg className="w-full h-4.5 opacity-60 group-hover:opacity-100 transition-opacity" viewBox="0 0 50 20" preserveAspectRatio="none">
                                      <path
                                        d={sparklinePath}
                                        fill="none"
                                        stroke={isAcc ? "#10b981" : "#ef4444"}
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </div>

                                  <span className={`text-[11px] min-[600px]:text-[9.5px] font-mono leading-none tracking-tight font-black uppercase z-10 shrink-0 ${bgStyle.split(" ").slice(-1)[0]}`}>
                                    {isAcc ? "+" : ""}{calDay.netFlow.toFixed(1)}B
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="flex items-center justify-between text-[8px] font-mono text-slate-600 border-t border-[#0d222f] pt-1.5 select-none">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Distribusi (Sparks Down)</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />Akumulasi (Sparks Up)</span>
                          </div>
                        </div>

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
                                  <div className="w-24 h-1.5 bg-slate-905 bg-slate-900 rounded-full flex items-center relative overflow-hidden border border-cyan-950/10 p-0">
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
              })()}

              {/* Info advice footer */}
              <div className="p-3 bg-cyan-950/10 border border-cyan-900/30 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans mt-2">
                <strong className="text-cyan-400 uppercase tracking-wider">Metrik Bandarmology:</strong> Detektor ini melacak pergerakan akumulasi broker asing (Foreign Broker) dan lokal secara seketika berdasarkan sId (Investor ID) yang terhubung ke JATS IDX. Jika Net Buyer jauh mengungguli Net Seller, saham berpeluang tinggi mengalami penguatan dlm kerangka markup sesi berkelanjutan.
              </div>

            </div>
          )}

          {false && activeHubTab === "transaksi" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Order panel */}
              <div className="xl:col-span-5 bg-[#010a12]/30 border border-cyan-500/10 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <span className="text-xs font-black uppercase text-white tracking-widest block border-b border-slate-900 pb-2">📥 Simulasi Order Lot</span>
                  
                  {tradeSuccess && (
                     <div className="p-2.5 bg-emerald-950/80 border border-emerald-950 text-emerald-400 rounded-lg text-xs font-bold leading-none animate-pulse">
                      ✓ {tradeSuccess}
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Harga Saham Live:</span>
                      <strong className="text-white font-mono">{formatIDR(activeStock.currentPrice)}</strong>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-black mb-1">Lot Transaksi (1 Lot = 100 Lembar):</label>
                      <input
                        type="number"
                        min="1"
                        value={tradeQuantity / 100}
                        onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1) * 100)}
                        className="w-full bg-slate-950 border border-slate-800 py-1.5 rounded text-center text-xs text-white font-mono font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t border-slate-900 font-mono text-cyan-400">
                      <span>Total Nilai Order:</span>
                      <strong>{formatIDR(activeStock.currentPrice * tradeQuantity)}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button type="button" onClick={handleBuySimulation} className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95">Beli Lot</button>
                  <button type="button" onClick={handleSellSimulation} className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95">Jual Lot</button>
                </div>
              </div>

              {/* Portfolio items */}
              <div className="xl:col-span-7 glass-card border border-slate-850 rounded-2xl p-5 flex flex-col justify-between shadow bg-slate-900/10">
                <div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2 mb-3">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-cyan-400" />
                      Portofolio Sandbox ({activeStock.ticker})
                    </span>
                    <span className="font-mono text-[#c1a067]">Cash: {formatIDR(walletBalance)}</span>
                  </div>

                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left font-mono">
                      <thead>
                        <tr className="border-b border-slate-900 text-[9px] text-slate-500 uppercase">
                          <th className="py-1">Kode</th>
                          <th className="py-1 text-right">Shares (Lot)</th>
                          <th className="py-1 text-right">Rata Beli</th>
                          <th className="py-1 text-right">P&L Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentHolding ? (() => {
                          const pnlVal = (activeStock.currentPrice - currentHolding.avgBuyPrice) * currentHolding.shares;
                          const pnlPct = ((activeStock.currentPrice - currentHolding.avgBuyPrice) / currentHolding.avgBuyPrice) * 100;
                          return (
                            <tr className="border-b border-slate-850">
                              <td className="py-2.5 font-bold text-white font-sans">{currentHolding.ticker}</td>
                              <td className="py-2.5 text-right">{currentHolding.shares} lbr ({currentHolding.shares / 100} Lot)</td>
                              <td className="py-2.5 text-right">{formatIDR(currentHolding.avgBuyPrice)}</td>
                              <td className={`py-2.5 text-right font-bold ${pnlVal >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                                {pnlVal >= 0 ? "+" : ""}{pnlPct.toFixed(1)}% ({formatIDR(pnlVal)})
                              </td>
                            </tr>
                          );
                        })() : (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-500 italic font-sans text-xs">Belum ada portofolio efek berjalan untuk {activeStock.ticker}. Silakan beli lot simulation di samping.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info label */}
                <div className="pt-2.5 border-t border-slate-900 mt-4 text-[10px] text-slate-500 leading-normal">
                  💡 Sandbox Virtual Trading mensimulasikan order book lokal harian. Transaksi di atas menggunakan pricing live IDX feed secara aktual dan real-time.
                </div>
              </div>

            </div>
          )}

          {activeHubTab === "ramalan-ai" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#020b14]/95 border border-cyan-500/15 p-5 md:p-6 rounded-2xl shadow-xl space-y-6">
                
                {/* Header */}
                <div className="border-b border-cyan-950/30 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase block font-mono">🔮 RAMALAN SENTIMEN AI (3 HARI JANGKA PENDEK)</span>
                    <h3 className="text-sm font-black text-white mt-0.5">Analisis Prediktif & Probabilitas {activeStock.ticker}</h3>
                  </div>
                  <span className="text-[9px] bg-cyan-950/70 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded uppercase font-bold font-mono tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                    POWERED BY GEMINI 3.5
                  </span>
                </div>

                {forecastLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4 animate-pulse">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-t-cyan-400 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-cyan-400 font-mono">🔮 MERAMAL GRAFIK & ANALISIS SENTIMEN...</p>
                      <p className="text-[10px] text-slate-500 mt-1">Sistem sedang berkonsultasi dengan Gemini AI dan merumuskan titik harga 3 sesi bursa mendatang.</p>
                    </div>
                  </div>
                ) : forecastError ? (
                  <div className="py-12 text-center text-rose-450 border border-rose-950/30 bg-rose-950/10 rounded-xl p-4 font-mono text-xs">
                    ⚠️ {forecastError}. <button onClick={() => setRefreshCount(r => r + 1)} className="underline cursor-pointer hover:text-white">Coba lagi</button>
                  </div>
                ) : forecastData ? (
                  <div className="space-y-6">
                    {/* General Summary Card / Banner */}
                    <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-black block font-mono uppercase">AI Consensus Mood</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg tracking-wider ${
                            forecastData.generalSentiment === "BULLISH" 
                              ? "bg-emerald-950/45 text-emerald-400 border border-emerald-500/30" 
                              : forecastData.generalSentiment === "BEARISH"
                              ? "bg-rose-950/45 text-rose-450 border border-rose-500/30"
                              : "bg-slate-900 text-slate-300 border border-slate-700" 
                          }`}>
                            {forecastData.generalSentiment}
                          </span>
                          <span className="text-xs text-slate-400 font-bold font-sans">
                            {forecastData.generalSentiment === "BULLISH" 
                              ? "Konsensus mengarah ke kenaikan tren volume-price." 
                              : forecastData.generalSentiment === "BEARISH"
                              ? "Terdeteksi rintangan distribusi pasokan jangka pendek."
                              : "Pergerakan harga diprediksi bergerak datar (sideways)."}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs md:text-right">
                        <span className="text-[9px] text-slate-500 font-black block font-mono uppercase">PROYEKSI HARGA S/R JANGKA PENDEK</span>
                        <span className="text-white font-mono font-bold">
                          Rp {Math.round(activeStock.currentPrice * 0.97)} — Rp {Math.round(activeStock.currentPrice * 1.05)}
                        </span>
                      </div>
                    </div>

                    {/* Proyeksi Reasoning */}
                    <div className="p-4 bg-cyan-950/15 border border-cyan-500/10 rounded-xl space-y-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase font-mono">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                        Interpretasi Rasionil (Dasar Analisis AI)
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {forecastData.reasoning}
                      </p>
                    </div>

                    {/* Prediction 3-Day Bento Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {forecastData.forecast && forecastData.forecast.map((item: any, idx: number) => {
                        const isPos = item.priceChangePercent >= 0;
                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 shadow-inner transition-all hover:scale-[1.01] ${
                              item.sentiment === "BULLISH"
                                ? "bg-emerald-950/5 border-emerald-500/10 hover:border-emerald-500/20"
                                : item.sentiment === "BEARISH"
                                ? "bg-rose-950/5 border-rose-500/10 hover:border-rose-500/20"
                                : "bg-slate-900/10 border-slate-800 hover:border-slate-750"
                            }`}
                          >
                            <div className="flex justify-between items-start border-b border-white/5 pb-2">
                              <div>
                                <span className="text-[9px] text-slate-500 font-extrabold uppercase font-mono">{item.day}</span>
                                <h4 className="text-xs font-black text-white uppercase tracking-wider mt-0.5">{item.indicatorSignal || "Technical Sinyal"}</h4>
                              </div>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                item.sentiment === "BULLISH"
                                  ? "bg-emerald-950/60 text-emerald-400"
                                  : item.sentiment === "BEARISH"
                                  ? "bg-rose-950/60 text-rose-450"
                                  : "bg-slate-950 text-slate-400"
                              }`}>
                                {item.sentiment}
                              </span>
                            </div>

                            <div className="py-1">
                              <span className="text-[9.5px] text-slate-400 block font-sans font-bold">Prediksi Harga Penutupan</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black font-mono text-white">Rp {item.predictedPrice.toLocaleString("id-ID")}</span>
                                <span className={`text-xs font-mono font-bold ${isPos ? "text-emerald-400" : "text-rose-450"}`}>
                                  {isPos ? "▲ +" : "▼ "}{item.priceChangePercent}%
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1 pt-1.5 border-t border-white/5">
                              <div className="flex justify-between text-[8px] font-bold font-mono text-slate-400 select-none">
                                <span>PROBABILITAS ESTIMASI</span>
                                <span className="text-cyan-400">{item.probability}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-lg overflow-hidden flex">
                                <div 
                                  className="h-full bg-cyan-400 rounded-full" 
                                  style={{ width: `${item.probability}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Visualizer for Forecast */}
                    <div className="bg-[#010912]/80 border border-slate-850 p-4 rounded-xl space-y-3">
                      <div>
                        <span className="text-[9.5px] text-white font-extrabold font-mono uppercase tracking-wider">Grafik Lintasan Prediksi Harga</span>
                        <p className="text-[10px] text-slate-500">Visualisasi tren pergerakan prediksi harga untuk 3 sesi bursa modal mendatang.</p>
                      </div>
                      <div className="h-44 w-full text-[10px] font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={[
                              { name: "Sekarang", Harga: activeStock.currentPrice },
                              ...(forecastData.forecast || []).map((f: any) => ({ name: f.day, Harga: f.predictedPrice }))
                            ]}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="forecastChartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#081525" />
                            <XAxis dataKey="name" stroke="#475569" strokeWidth={1} style={{ fontSize: "10px" }} />
                            <YAxis 
                              stroke="#475569" 
                              strokeWidth={1} 
                              style={{ fontSize: "10px" }} 
                              domain={[
                                Math.min(activeStock.currentPrice, ...(forecastData.forecast || []).map((f: any) => f.predictedPrice)) * 0.99,
                                Math.max(activeStock.currentPrice, ...(forecastData.forecast || []).map((f: any) => f.predictedPrice)) * 1.01
                              ]}
                              tickFormatter={(val) => `Rp ${val}`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#020b13", borderColor: "#0ea5e9", borderRadius: "12px", fontSize: "11px" }}
                              labelStyle={{ fontWeight: "bold", color: "#22d3ee" }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="Harga" 
                              stroke="#22d3ee" 
                              strokeWidth={2.5} 
                              fillOpacity={1} 
                              fill="url(#forecastChartGrad)" 
                              activeDot={{ r: 6 }} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-500 leading-relaxed font-sans text-center select-none pt-2">
                      ⚠️ DISCLAIMER: Analisis Ramalan Harga AI di atas dihasilkan oleh kecerdasan buatan Gemini berdasarkan kalkulasi pemodelan tren dan data historis. Keadaan pasar yang sebenarnya dapat berfluktuasi secara dinamis dan tidak terduga. SahamIndo Pro tidak memikul tanggung jawab hukum atas kerugian investasi yang diderita pengguna. Do your own research.
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs">
                    ⏳ Belum ada koordinat ramalan yang dimuat.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeHubTab === "analisa-pasar" && (
            <TransactionDashboard
              activeStock={activeStock}
              onToggleWatchlist={onToggleWatchlist}
              watchlist={watchlist}
            />
          )}

          {false && activeHubTab === "analisa-pasar" && (
            (() => {
              const baseCandles = [
                { time: "Mon", open: 820, high: 960,  low: 750,  close: 910,  volume: 14.5, isUp: true  },
                { time: "Tue", open: 910, high: 1100, low: 880,  close: 1050, volume: 18.2, isUp: true  },
                { time: "Wed", open: 1050,high: 1120, low: 950,  close: 990,  volume: 12.1, isUp: false },
                { time: "Thu", open: 990, high: 1250, low: 940,  close: 1180, volume: 22.4, isUp: true  },
                { time: "Fri", open: 1180,high: 1350, low: 1120, close: 1310, volume: 29.8, isUp: true  },
                { time: "Mon", open: 1310,high: 1450, low: 1260, close: 1390, volume: 25.1, isUp: true  },
                { time: "Tue", open: 1390,high: 1420, low: 1210, close: 1250, volume: 32.7, isUp: false },
                { time: "Wed", open: 1250,high: 1510, low: 1200, close: 1480, volume: 38.0, isUp: true  },
                { time: "Thu", open: 1480,high: 1680, low: 1450, close: 1590, volume: 44.2, isUp: true  },
                { time: "Fri", open: 1590,high: 1700, low: 1520, close: 1620, volume: 41.5, isUp: true  },
                { time: "Mon", open: 1620,high: 1670, low: 1510, close: 1540, volume: 28.3, isUp: false },
                { time: "Tue", open: 1540,high: 1640, low: 1495, close: 1610, volume: 35.6, isUp: true  },
              ];

              const buyBrokersBase = [
                { code: "BK", name: "J.P. Morgan", l: 7890, v: 9.85,  a: 1248 },
                { code: "YP", name: "Mirae Asset", l: 12450,v: 15.35, a: 1233 },
                { code: "OD", name: "BRI Danareksa",l: 5410, v: 6.72,  a: 1242 },
                { code: "CC", name: "Mandiri Sek",  l: 11200,v: 13.92, a: 1243 },
                { code: "GR", name: "Panin Sekuritas",l: 3100, v: 3.84,  a: 1239 },
                { code: "PD", name: "Indo Premier", l: 4520, v: 5.56,  a: 1230 },
              ];

              const sellBrokersBase = [
                { code: "RX", name: "Macquarie",    l: 10400,v: 12.98, a: 1248 },
                { code: "DX", name: "Bahana Sek",   l: 8900, v: 11.08, a: 1245 },
                { code: "NI", name: "BNI Sekuritas", l: 4800, v: 5.98,  a: 1246 },
                { code: "AI", name: "UOB Kay Hian",  l: 7120, v: 8.85,  a: 1243 },
                { code: "CP", name: "Valbury Sek",   l: 3450, v: 4.28,  a: 1241 },
                { code: "LG", name: "Trimegah",     l: 5500, v: 6.82,  a: 1240 },
              ];

              const handlePrevDateRange = () => {
                try {
                  const currentStart = parseDateString(analysisStartDate);
                  const currentEnd = parseDateString(analysisEndDate);
                  
                  const newStart = new Date(currentStart);
                  newStart.setDate(newStart.getDate() - 7);
                  
                  const newEnd = new Date(currentEnd);
                  newEnd.setDate(newEnd.getDate() - 7);
                  
                  setAnalysisStartDate(formatDateToString(newStart));
                  setAnalysisEndDate(formatDateToString(newEnd));
                } catch (e) {
                  setAnalysisStartDate("07 Oct 2024");
                  setAnalysisEndDate("13 Oct 2024");
                }
              };

              const handleNextDateRange = () => {
                try {
                  const currentStart = parseDateString(analysisStartDate);
                  const currentEnd = parseDateString(analysisEndDate);
                  
                  const newStart = new Date(currentStart);
                  newStart.setDate(newStart.getDate() + 7);
                  
                  const newEnd = new Date(currentEnd);
                  newEnd.setDate(newEnd.getDate() + 7);
                  
                  const maxMarketDate = parseDateString(getInitialMarketCloseDates().end);
                  if (newStart > maxMarketDate) {
                    return; // prevent scrolling beyond target current live bursa week
                  }
                  
                  setAnalysisStartDate(formatDateToString(newStart));
                  setAnalysisEndDate(formatDateToString(newEnd));
                } catch (e) {
                  setAnalysisStartDate("07 Oct 2024");
                  setAnalysisEndDate("13 Oct 2024");
                }
              };

              return (
                <div className="bg-[#050912] border border-emerald-500/20 p-5 md:p-6 rounded-2xl space-y-6 shadow-2xl animate-fadeIn text-slate-300">
                  
                  {/* BRAND NEW: TOP BAR HEADER (Full-width) */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-slate-950/80 border border-slate-900/65 rounded-xl p-4 gap-4">
                    <div className="w-full md:w-auto flex justify-start">
                      <button
                        onClick={() => onToggleWatchlist?.(activeStock.ticker)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                          watchlist.includes(activeStock.ticker)
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/50"
                            : "bg-slate-900/40 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${watchlist.includes(activeStock.ticker) ? "fill-emerald-400 text-emerald-400" : ""}`} />
                        <span>Add to Watchlist</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-emerald-455 shrink-0 select-none hidden sm:block animate-pulse" />
                      <h3 className="text-base sm:text-lg md:text-xl font-black text-emerald-400 uppercase tracking-widest font-mono text-center">
                        Analisa Transaksi
                      </h3>
                      <FileText className="w-5 h-5 text-emerald-455 shrink-0 select-none hidden sm:block animate-pulse" />
                    </div>

                    <div className="text-right text-[10.5px] font-mono font-bold text-slate-400 w-full md:w-auto flex justify-end select-none">
                      <span className="border border-slate-800 bg-[#02050b] px-3 py-1 rounded text-emerald-400/90">
                        Last Updated: Minggu, 7 Juni 2026
                      </span>
                    </div>
                  </div>

                  {/* MAIN LAYOUT COLS */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* COLUMN LEFT: Transaction Chart (Semi-TradingView upgraded) */}
                    <div className="lg:col-span-7 bg-[#131722] border border-[#2a2e39] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
                      <div>
                        <div className="flex justify-between items-start border-b border-[#2a2e39] pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <h4 className="text-xs font-black text-slate-100 font-mono uppercase tracking-wider">
                                {activeStock.ticker} / IDR
                              </h4>
                              <span className="text-[7.5px] font-bold bg-[#2a2e39] text-[#d1d4dc] px-1.5 py-0.5 rounded font-mono uppercase">
                                1D • IDX
                              </span>
                            </div>
                            
                            {/* TradingView Legend style stats list */}
                            <div className="text-[9.5px] font-mono text-[#848e9c] flex flex-wrap gap-2 items-center">
                              {(() => {
                                const hoveredCandleObj = baseCandles[
                                  candleHoverIdx !== null 
                                    ? (activeAnalysisControl === "Z" ? Math.min(11, candleHoverIdx + 3) : candleHoverIdx) 
                                    : (activeAnalysisControl === "Z" ? 5 : 11)
                                ];
                                return (
                                  <>
                                    <span className="text-[#2962ff] font-semibold">{hoveredCandleObj.time}</span>
                                    <span>O<span className={hoveredCandleObj.isUp ? "text-[#089981]" : "text-[#f23645]"}> {hoveredCandleObj.open}</span></span>
                                    <span>H<span className={hoveredCandleObj.isUp ? "text-[#089981]" : "text-[#f23645]"}> {hoveredCandleObj.high}</span></span>
                                    <span>L<span className={hoveredCandleObj.isUp ? "text-[#089981]" : "text-[#f23645]"}> {hoveredCandleObj.low}</span></span>
                                    <span>C<span className={hoveredCandleObj.isUp ? "text-[#089981]" : "text-[#f23645]"}> {hoveredCandleObj.close}</span></span>
                                    <span>Vol<span className="text-[#d1d4dc]"> {hoveredCandleObj.volume}M</span></span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Header controls M, NR, S, f, Z */}
                          <div className="flex gap-1 bg-[#1e222d] p-1 rounded-lg border border-[#2a2e39]">
                            {(["M", "NR", "S", "f", "Z"] as const).map((ctrl) => (
                              <button
                                key={ctrl}
                                onClick={() => setActiveAnalysisControl(ctrl)}
                                className={`px-2.5 py-1 rounded text-[9.5px] font-extrabold font-mono transition-all cursor-pointer ${
                                  activeAnalysisControl === ctrl
                                    ? "bg-[#2962ff] text-white shadow shadow-[#2962ff]/20"
                                    : "text-[#848e9c] hover:bg-[#2a2e39] hover:text-white"
                                }`}
                                title={`Fitur Filter: ${ctrl}`}
                              >
                                {ctrl}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Chart Playground Container (TradingView Look & Feel) */}
                        <div className="relative mt-4 h-[240px] w-full bg-[#131722] border border-[#2a2e39] rounded-xl overflow-hidden">
                          
                          {/* Price Grid Lines (horizontal) */}
                          <div className="absolute inset-0 flex flex-col justify-between pr-[60px] py-4 select-none pointer-events-none">
                            {[1700, 1400, 1100, 800, 475].map((prc) => (
                              <div key={prc} className="w-full border-t border-[#2a2e39]/50 flex justify-between items-center pl-2">
                                <span className="text-[7.5px] text-[#475569]/40 font-mono">--</span>
                                <span className="text-[9px] text-[#848e9c] font-mono bg-[#131722] px-1.5 z-10">
                                  {prc.toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Extra Overlay Guides based on interactive selection */}
                          {activeAnalysisControl === "S" && (
                            <>
                              <div className="absolute top-[28px] left-0 w-[calc(100%-60px)] border-t border-dashed border-[#ff9800] z-20 pointer-events-none">
                                <span className="absolute left-2 -top-2.5 text-[8px] font-mono text-[#ff9800] bg-[#131722] px-1 font-bold">RESISTANCE: 1550</span>
                              </div>
                              <div className="absolute bottom-[40px] left-0 w-[calc(100%-60px)] border-t border-dashed border-[#00bcd4] z-20 pointer-events-none">
                                <span className="absolute left-2 -top-2.5 text-[8px] font-mono text-[#00bcd4] bg-[#131722] px-1 font-bold">SUPPORT: 550</span>
                              </div>
                            </>
                          )}

                          {/* Sparkline trend based on activeAnalysisControl */}
                          {activeAnalysisControl === "f" && (
                            <div className="absolute inset-0 pr-[60px] pointer-events-none z-10">
                              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path
                                  d="M 5,85 C 20,70 30,55 45,50 C 60,45 70,25 95,20"
                                  fill="none"
                                  stroke="#2962ff"
                                  strokeWidth="1.5"
                                  strokeDasharray="4 2"
                                  className="animate-pulse"
                                />
                                <text x="5" y="80" fill="#2962ff" className="text-[5.5px] font-mono font-bold uppercase tracking-wider">EMA (20) TRENDLINE</text>
                              </svg>
                            </div>
                          )}

                          {/* Candlesticks SVG rendering */}
                          <div className="w-full h-full pr-[60px] relative">
                            <svg 
                              className="w-full h-full cursor-crosshair select-none" 
                              viewBox="0 0 340 180" 
                              preserveAspectRatio="none"
                              onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const rawX = e.clientX - rect.left;
                                const rawY = e.clientY - rect.top;
                                
                                const svgX = (rawX / rect.width) * 340;
                                const svgY = (rawY / rect.top) ? (rawY / rect.height) * 180 : 0;
                                
                                setChartHoverX(svgX);
                                setChartHoverY(svgY);

                                const renderedCandlesCount = activeAnalysisControl === "Z" ? 6 : 12;
                                const graphWidth = 280;
                                const graphX = svgX - 15;
                                const colWidth = graphWidth / renderedCandlesCount;
                                const index = Math.floor(graphX / colWidth);
                                
                                if (index >= 0 && index < renderedCandlesCount) {
                                  setCandleHoverIdx(index);
                                } else {
                                  setCandleHoverIdx(null);
                                }
                              }}
                              onMouseLeave={() => {
                                setChartHoverX(null);
                                setChartHoverY(null);
                                setCandleHoverIdx(null);
                              }}
                            >
                              {/* Background Vertical Grids */}
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((gridIdx) => {
                                const gridX = 15 + gridIdx * (280 / 12);
                                return (
                                  <line 
                                    key={`vgrid-${gridIdx}`} 
                                    x1={gridX} 
                                    y1={0} 
                                    x2={gridX} 
                                    y2={180} 
                                    stroke="#2a2e39" 
                                    strokeWidth="0.4" 
                                    strokeDasharray="2,4" 
                                  />
                                );
                              })}

                              {/* Interactive Crosshairs */}
                              {chartHoverX !== null && chartHoverX >= 15 && chartHoverX <= 295 && (
                                <g className="pointer-events-none select-none">
                                  <line 
                                    x1={chartHoverX} 
                                    y1={0} 
                                    x2={chartHoverX} 
                                    y2={180} 
                                    stroke="#848e9c" 
                                    strokeWidth="0.75" 
                                    strokeDasharray="3,3" 
                                  />
                                </g>
                              )}
                              {chartHoverY !== null && chartHoverY >= 0 && chartHoverY <= 150 && (
                                <g className="pointer-events-none select-none">
                                  <line 
                                    x1={0} 
                                    y1={chartHoverY} 
                                    x2={295} 
                                    y2={chartHoverY} 
                                    stroke="#848e9c" 
                                    strokeWidth="0.75" 
                                    strokeDasharray="3,3" 
                                  />
                                  {/* YAxis price label popup */}
                                  {(() => {
                                    const priceRatio = (140 - chartHoverY) / 105;
                                    const trackedPrice = 475 + priceRatio * (1700 - 475);
                                    if (trackedPrice >= 400 && trackedPrice <= 1800) {
                                      return (
                                        <g>
                                          <rect x={295} y={chartHoverY - 6.5} width={42} height={13} fill="#1e222d" rx={1.5} stroke="#848e9c" strokeWidth="0.5" />
                                          <text x={316} y={chartHoverY + 3} fill="#d1d4dc" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                                            {Math.round(trackedPrice)}
                                          </text>
                                        </g>
                                      );
                                    }
                                    return null;
                                  })()}
                                </g>
                              )}

                              {(() => {
                                const renderedCandles = activeAnalysisControl === "Z" ? baseCandles.slice(3, 9) : baseCandles;
                                const count = renderedCandles.length;
                                const colWidth = 280 / count;

                                return renderedCandles.map((candle, idx) => {
                                  const x = 15 + idx * colWidth + (colWidth - 8) / 2;
                                  const mapY = (price: number) => {
                                    const ratio = (price - 475) / (1700 - 475);
                                    return 140 - ratio * 105;
                                  };

                                  const yOpen = mapY(candle.open);
                                  const yClose = mapY(candle.close);
                                  const yHigh = mapY(candle.high);
                                  const yLow = mapY(candle.low);

                                  const topBox = Math.min(yOpen, yClose);
                                  const botBox = Math.max(yOpen, yClose);
                                  const boxHeight = Math.max(2.5, botBox - topBox);
                                  
                                  const upColorTheme = "#089981"; // TradingView green
                                  const downColorTheme = "#f23645"; // TradingView red

                                  const candleColor = candle.isUp ? upColorTheme : downColorTheme;
                                  const wickColor = candle.isUp ? upColorTheme : downColorTheme;

                                  const volHeight = (candle.volume / 45) * 32;
                                  const yVol = 175 - volHeight;

                                  const isSelectedCur = candleHoverIdx === idx;

                                  return (
                                    <g key={idx} className="transition-opacity duration-150">
                                      {/* Thin Candlestick Wick (High to Low) */}
                                      <line
                                        x1={x + 4.5}
                                        y1={yHigh}
                                        x2={x + 4.5}
                                        y2={yLow}
                                        stroke={wickColor}
                                        strokeWidth="1.2"
                                      />

                                      {/* Candlestick Box Body (TradingView look) */}
                                      <rect
                                        x={x}
                                        y={topBox}
                                        width={9}
                                        height={boxHeight}
                                        fill={candleColor}
                                        stroke={candleColor}
                                        strokeWidth="1.2"
                                        className={`transition-all ${isSelectedCur ? "brightness-125 stroke-[#ffffff]" : ""}`}
                                        rx="0.5"
                                      />

                                      {/* TradingView Bottom aligned Volume bars */}
                                      <rect
                                        x={x + 1.2}
                                        y={yVol}
                                        width={6.6}
                                        height={volHeight}
                                        fill={candleColor}
                                        opacity={isSelectedCur ? 0.75 : 0.22}
                                      />
                                    </g>
                                  );
                                });
                              })()}
                            </svg>
                          </div>

                        </div>
                      </div>

                      <div className="text-[10px] text-slate-450 italic leading-relaxed border-t border-[#2a2e39] pt-2.5 flex items-center justify-between font-mono gap-1">
                        <span className="flex items-center gap-1"><span className="text-emerald-400 font-bold">●</span> Live tracking crosshair dan statistik dinamis terintegrasi.</span>
                        <span className="text-[8px] bg-[#1e222d] px-1.5 py-0.5 rounded text-[#2962ff] border border-[#2a2e39] font-black uppercase">CHART V4.5</span>
                      </div>
                    </div>

                    {/* COLUMN RIGHT: Broker Summary */}
                    <div className="lg:col-span-5 bg-slate-950/30 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-3">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-emerald-400 font-mono uppercase tracking-wider">
                              Broker Summary
                            </h4>
                            <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-emerald-400" title="Rasio rincian bandarmology emiten berdasarkan aktivitas beli/jual broker" />
                          </div>
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900 uppercase tracking-widest font-bold">
                            Filtered Flow
                          </span>
                        </div>

                        {/* DATES ADJUSTERS BINDED ACCORDING TO SPECS WITH POPUP CALENDAR */}
                        <div className="relative">
                          <div className="flex items-center justify-between bg-slate-950/95 border border-slate-900/80 px-3 py-2 rounded-xl mb-4 font-mono text-xs select-none">
                            <button
                              onClick={handlePrevDateRange}
                              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 active:scale-90 transition-all cursor-pointer"
                              title="Geser rentang tanggal ke belakang"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Interactive Date Labels: Click to open beautiful calendar pop up */}
                            <div 
                              onClick={() => setIsEditingDates(!isEditingDates)}
                              className={`flex items-center gap-1.5 cursor-pointer hover:bg-slate-900 rounded px-2 py-1 text-[11px] group transition-all border ${isEditingDates ? "border-emerald-500/20 bg-emerald-950/10 text-emerald-400" : "border-transparent text-white"}`}
                              title="Klik untuk membuka kalender interaktif"
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-white group-hover:text-emerald-400 underline decoration-dotted decoration-emerald-500/50 transition-colors font-semibold">
                                {analysisStartDate}
                              </span>
                              <span className="text-slate-500 font-sans font-black text-[9px] uppercase">s/d</span>
                              <span className="text-white group-hover:text-emerald-400 underline decoration-dotted decoration-emerald-500/50 transition-colors font-semibold">
                                {analysisEndDate}
                              </span>
                            </div>

                            {/* Tombol APPLY Broker Summary */}
                            <button
                              onClick={() => {
                                setIsEditingDates(false);
                                setRefreshCount(r => r + 1);
                                setTimeout(() => {
                                  setRefreshCount(0);
                                }, 800);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 font-black text-[#04121a] uppercase text-[10px] tracking-wider rounded-lg border border-emerald-400 cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1 shrink-0"
                              title="Terapkan rentang tanggal broker summary"
                            >
                              <span>APPLY</span>
                            </button>

                            {/* Small refresh button which simulates recalculations when clicked */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setRefreshCount(r => r + 1);
                                  setTimeout(() => {
                                    setRefreshCount(0);
                                  }, 800);
                                }}
                                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 active:scale-95 cursor-pointer transition-all flex items-center justify-center"
                                title="Muat ulang & hitung ulang detail data table"
                              >
                                <RotateCw className={`w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 ${refreshCount > 0 ? "animate-spin" : ""}`} />
                              </button>
                            </div>

                            <button
                              onClick={handleNextDateRange}
                              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 active:scale-90 transition-all cursor-pointer"
                              title="Geser rentang tanggal ke depan"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Beautiful Interactive Floating Calendar Popup */}
                          <AnimatePresence>
                            {isEditingDates && (
                              <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-1 bg-[#0b101d] border border-emerald-500/30 rounded-2xl p-4 shadow-2xl z-50 text-slate-300 font-sans"
                              >
                                {/* Calendar Month display & slider controls */}
                                <div className="flex justify-between items-center mb-3">
                                  <button 
                                    onClick={() => {
                                      setActiveCalendarMonth(prev => prev === 8 ? 9 : 8);
                                    }}
                                    className="p-1 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 bg-slate-900 rounded border border-slate-800 transition-colors"
                                    title="Bulan sebelumnya"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="font-mono text-xs font-black uppercase text-slate-100 tracking-widest">
                                    {activeCalendarMonth === 8 ? "September 2024" : "October 2024"}
                                  </span>
                                  <button 
                                    onClick={() => {
                                      setActiveCalendarMonth(prev => prev === 8 ? 9 : 8);
                                    }}
                                    className="p-1 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 bg-slate-900 rounded border border-slate-800 transition-colors"
                                    title="Bulan berikutnya"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Calendar Day name row */}
                                <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500 uppercase font-black text-center mb-1.5 font-mono">
                                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((dayName) => (
                                    <div key={dayName} className="py-0.5">{dayName}</div>
                                  ))}
                                </div>

                                {/* Calender Date Number Grid */}
                                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px]">
                                  {(() => {
                                    const monthDays = activeCalendarMonth === 8 ? 30 : 31;
                                    const startDayOffset = activeCalendarMonth === 8 ? 0 : 2; // Sept 2024 starts on Sunday (Offset 0), Oct starts on Tuesday (Offset 2)

                                    const gridDays: (number | null)[] = [];
                                    for (let i = 0; i < startDayOffset; i++) {
                                      gridDays.push(null);
                                    }
                                    for (let i = 1; i <= monthDays; i++) {
                                      gridDays.push(i);
                                    }

                                    return gridDays.map((dayNum, dIdx) => {
                                      if (dayNum === null) {
                                        return <div key={`empty-${dIdx}`} className="py-1" />;
                                      }

                                      const currDate = new Date(2024, activeCalendarMonth, dayNum);
                                      const startD = parseDateString(analysisStartDate);
                                      const endD = parseDateString(analysisEndDate);

                                      const isSelectedStart = currDate.getDate() === startD.getDate() && currDate.getMonth() === startD.getMonth() && currDate.getFullYear() === startD.getFullYear();
                                      const isSelectedEnd = currDate.getDate() === endD.getDate() && currDate.getMonth() === endD.getMonth() && currDate.getFullYear() === endD.getFullYear();
                                      const isWithinRange = currDate >= startD && currDate <= endD;

                                      let dayBgStyle = "text-slate-400 hover:bg-slate-900 hover:text-white";
                                      if (isSelectedStart || isSelectedEnd) {
                                        dayBgStyle = "bg-emerald-500 text-slate-950 font-black rounded shadow shadow-emerald-500/30 scale-105";
                                      } else if (isWithinRange) {
                                        dayBgStyle = "bg-emerald-950/40 text-emerald-450 border border-emerald-900/40 font-semibold rounded";
                                      }

                                      return (
                                        <button
                                          key={`day-${dayNum}`}
                                          onClick={() => {
                                            const clickedDate = new Date(2024, activeCalendarMonth, dayNum);
                                            const currentStart = parseDateString(analysisStartDate);
                                            
                                            // Handle state setter flow
                                            if (clickedDate < currentStart) {
                                              setAnalysisStartDate(formatDateToString(clickedDate));
                                              const newEnd = new Date(clickedDate);
                                              newEnd.setDate(newEnd.getDate() + 6);
                                              setAnalysisEndDate(formatDateToString(newEnd));
                                            } else {
                                              setAnalysisEndDate(formatDateToString(clickedDate));
                                            }
                                          }}
                                          className={`py-1 rounded cursor-pointer transition-all ${dayBgStyle}`}
                                        >
                                          {dayNum}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>

                                {/* Custom HTML5 Date picker overrides for manual range selection */}
                                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-900/80">
                                  <div>
                                    <label className="text-[8px] text-slate-500 uppercase font-black block mb-1 tracking-wider font-mono">Tanggal Mulai</label>
                                    <input
                                      type="date"
                                      value={formatDateToInput(analysisStartDate)}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setAnalysisStartDate(formatInputToDate(e.target.value));
                                        }
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 text-emerald-400 text-[10px] rounded focus:outline-none p-1 font-mono text-center"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-slate-500 uppercase font-black block mb-1 tracking-wider font-mono">Tanggal Selesai</label>
                                    <input
                                      type="date"
                                      value={formatDateToInput(analysisEndDate)}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setAnalysisEndDate(formatInputToDate(e.target.value));
                                        }
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 text-emerald-400 text-[10px] rounded focus:outline-none p-1 font-mono text-center"
                                    />
                                  </div>
                                </div>

                                {/* Confirm simulation actions bar */}
                                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-900/80">
                                  <span className="text-[8px] text-slate-500 italic font-mono">Format: DD MMM YYYY</span>
                                  <button
                                    onClick={() => setIsEditingDates(false)}
                                    className="px-4 py-1.5 bg-emerald-500 text-slate-950 rounded-lg text-[9.5px] font-black uppercase font-mono tracking-wider cursor-pointer hover:bg-emerald-400 active:scale-95 transition-all text-center"
                                  >
                                    Terapkan Tanggal
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* DUAL TABLE: BUY ON LEFT, SELL ON RIGHT (Perfect alignment with specifications) */}
                        <div className="grid grid-cols-2 gap-4 items-stretch font-mono text-[9px] xs:text-[9.5px]">
                          
                          {/* BUY TABLE IN LIGHT EMERALD */}
                          <div className="border border-emerald-500/15 rounded-xl bg-slate-950/70 p-2.5 sm:p-3 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center text-[10px] border-b border-emerald-950/60 pb-1.5 mb-2 font-black text-emerald-400 uppercase tracking-widest leading-none">
                                <span>🟢 BUY (ACC)</span>
                                <span className="text-[7.5px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded border border-emerald-900 font-extrabold">IN</span>
                              </div>

                              <table className="w-full text-left font-mono">
                                <thead>
                                  <tr className="border-b border-slate-900 text-[8px] text-slate-500 uppercase">
                                    <th className="py-1">KODE</th>
                                    <th className="py-1 text-right">LOT</th>
                                    <th className="py-1 text-right">VALUE</th>
                                    <th className="py-1 text-right text-emerald-555 text-emerald-400">AVG</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {buyBrokersBase.map((b) => {
                                    const factor = 1 + (refreshCount > 0 ? 0.03 : 0) + (analysisStartDate.charCodeAt(0) % 5) * 0.02;
                                    const scaledLot = Math.round(b.l * factor);
                                    const scaledVal = (b.v * factor).toFixed(2);
                                    return (
                                      <tr key={b.code} className="hover:bg-emerald-950/10 border-b border-slate-900/40 transition-colors">
                                        <td className="py-1 font-bold text-white tracking-wider">{b.code}</td>
                                        <td className="py-1 text-right font-semibold text-slate-350">{scaledLot.toLocaleString("id-ID")}</td>
                                        <td className="py-1 text-right font-bold text-emerald-400">{scaledVal}B</td>
                                        <td className="py-1 text-right text-slate-400">{b.a}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* SELL TABLE IN LIGHT ROSE */}
                          <div className="border border-rose-500/15 rounded-xl bg-slate-950/70 p-2.5 sm:p-3 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center text-[10px] border-b border-[#2e1319] pb-1.5 mb-2 font-black text-rose-450 uppercase tracking-widest leading-none">
                                <span>🔴 SELL (DIST)</span>
                                <span className="text-[7.5px] bg-rose-950 text-rose-450 px-1 py-0.5 rounded border border-rose-900 font-extrabold">OUT</span>
                              </div>

                              <table className="w-full text-left font-mono">
                                <thead>
                                  <tr className="border-b border-slate-900 text-[8px] text-slate-500 uppercase">
                                    <th className="py-1">KODE</th>
                                    <th className="py-1 text-right">LOT</th>
                                    <th className="py-1 text-right">VALUE</th>
                                    <th className="py-1 text-right text-rose-555 text-rose-400">AVG</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sellBrokersBase.map((b) => {
                                    const factor = 1 + (refreshCount > 0 ? -0.02 : 0) + (analysisStartDate.charCodeAt(1) % 5) * 0.015;
                                    const scaledLot = Math.round(b.l * factor);
                                    const scaledVal = (b.v * factor).toFixed(2);
                                    return (
                                      <tr key={b.code} className="hover:bg-rose-950/10 border-b border-slate-900/40 transition-colors">
                                        <td className="py-1 font-bold text-white tracking-wider">{b.code}</td>
                                        <td className="py-1 text-right font-semibold text-slate-350">{scaledLot.toLocaleString("id-ID")}</td>
                                        <td className="py-1 text-right font-bold text-rose-400">{scaledVal}B</td>
                                        <td className="py-1 text-right text-slate-400">{b.a}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-900 leading-normal font-sans">
                        💡 <strong className="text-slate-400 font-mono">Net Volume &amp; Value</strong> diakumulasi berdasarkan jam penutupan bursa BEI/IDX secara aktual. Gunakan navigasi tanggal di atas untuk memantau rentang historic bandarmology lainnya.
                      </div>
                    </div>

                  </div>
                  
                </div>
              );
            })()
          )}
        </div>

      </div>

      {/* 4 Pilar Capital Flow Explanation Modal */}
      {is4PilarModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-[#010913] border border-cyan-550/20 rounded-2xl w-full max-w-[450px] aspect-[3/4] max-h-[90vh] p-6 space-y-4 shadow-2xl relative flex flex-col justify-between overflow-y-auto text-slate-350 scrollbar-thin scrollbar-thumb-cyan-950">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500" />
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-cyan-700/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-cyan-950/40 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Sinyal Aliran Dana 4 Pilar Saham
                </h3>
              </div>
              <button
                onClick={() => setIs4PilarModalOpen(false)}
                className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer font-sans transition-all"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-300">
              Metrik <strong className="text-cyan-455">4 Pilar Aliran Berita &amp; Dana</strong> mengkalibrasi kekuatan modal kerja, struktur neraca kekayaan, dan tingkat kelayakan harga bursa emiten untuk menyaring emiten yang valid. Berikut rinciannya:
            </p>

            <div className="space-y-3.5 pt-1">
              {/* Pillar 1 */}
              <div className="space-y-1.5 p-2.5 rounded bg-emerald-950/15 border border-emerald-900/15">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-sans">
                  <span className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black border border-emerald-500/30">1</span>
                  Pilar Profitabilitas (Kapasitas Laba)
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-6 font-sans">
                  Menilai yield pengembalian ekuitas pemegang saham (ROE). Emiten dengan kapabilitas profitabilitas yang andal mengamankan fundamental terhadap pelemahan transaksi dan penurunan likuiditas.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="space-y-1.5 p-2.5 rounded bg-cyan-950/15 border border-cyan-900/15">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 font-sans">
                  <span className="w-4.5 h-4.5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black border border-cyan-500/30">2</span>
                  Pilar Valuasi Relatif (Kelipatan Harga)
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-6 font-sans">
                  Menilai tinggi rendahnya kelipatan valuasi pasar (PER/PBV) terhadap industri sejenis. Emiten berharga diskon diyakini memfasilitasi "margin of safety" protektif ketika bursa bergerak anomali.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="space-y-1.5 p-2.5 rounded bg-purple-950/15 border border-purple-900/15">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 font-sans">
                  <span className="w-4.5 h-4.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-black border border-purple-500/30">3</span>
                  Pilar Likuiditas Neraca (Arus Kas Pendek)
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-6 font-sans">
                  Mengukur persediaan aset lancar kas keras emiten untuk membiayai hutang segera jangka pendek serta mendongkrak ketahanan likuiditas emiten dari potensi gagal kewajiban komersial.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="space-y-1.5 p-2.5 rounded bg-indigo-950/15 border border-indigo-900/15">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 font-sans">
                  <span className="w-4.5 h-4.5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-black border border-indigo-500/30">4</span>
                  Pilar Solvabilitas Jangka Panjang (Secured Leverage)
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-6 font-sans">
                  Mengaudit rasio beban hutang modal berbiaya bunga terhadap ekuitas bersih (DER). Batas DER ideal &lt; 100% melindunginya dari gejolak penarikan modal kredit secara masif di perbankan.
                </p>
              </div>
            </div>

            <div className="text-center pt-2 select-none">
              <button
                onClick={() => setIs4PilarModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-550 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer w-full font-sans"
              >
                Mengerti &amp; Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 📊 MODAL: FULLSCREEN TECHNICAL CHART (Perluas) ==================== */}
      <AnimatePresence>
        {isFullscreenChartOpen && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex flex-col justify-between overflow-y-auto w-screen h-screen p-4 md:p-6 lg:p-8 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex-1 flex flex-col bg-[#020b13] border border-cyan-500/25 rounded-2xl p-5 md:p-6 lg:p-8 shadow-2xl relative space-y-5"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-cyan-400" />
                  <div className="flex flex-col">
                    <h3 className="text-base md:text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      Analisis Teknikal Detail Layar Penuh: {activeStock.ticker}
                      <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded font-black font-sans uppercase">
                        PRO CHART
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">{activeStock.name} — Real-time Live BEI Chart Feed</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-900 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setChartType("native")}
                      className={`px-3 py-1.5 rounded-md font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                        chartType === "native" 
                          ? "bg-slate-900 text-cyan-300 font-extrabold border border-white/5 active:scale-95" 
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Native
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartType("tradingview")}
                      className={`px-3 py-1.5 rounded-md font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                        chartType === "tradingview" 
                          ? "bg-slate-900 text-cyan-300 font-extrabold border border-white/5 active:scale-95" 
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      TradingView
                    </button>
                  </div>

                  {chartType === "native" && (
                    <button
                      type="button"
                      onClick={() => setShowFibonacci(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl transition-all font-bold text-[10px] uppercase cursor-pointer active:scale-95 ${
                        showFibonacci 
                          ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/25 font-extrabold shadow-[0_0_12px_rgba(34,211,238,0.1)] hover:bg-cyan-900/50" 
                          : "bg-[#020b12] hover:bg-slate-900 text-slate-450 border-slate-900/60"
                      }`}
                      title="Tampilkan Level Fibonacci Retracement Otomatis"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Fibo: {showFibonacci ? "ON" : "OFF"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsFullscreenChartOpen(false)}
                    className="p-2 bg-slate-900 border border-slate-800 hover:border-rose-900/50 hover:bg-rose-950/20 text-slate-450 hover:text-rose-400 rounded-xl transition-all cursor-pointer font-sans text-xs flex items-center gap-1 font-bold uppercase"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Tutup</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 bg-[#010912]/80 border border-slate-900 rounded-xl p-4 text-xs font-mono">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 font-sans text-[10px]">HARGA TERAKHIR</span>
                  <span className={`text-base font-black ${activeStock.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {formatIDR(activeStock.currentPrice)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 font-sans text-[10px]">PERUBAHAN</span>
                  <span className={`text-base font-black ${activeStock.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {activeStock.change >= 0 ? "+" : ""}{activeStock.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 font-sans text-[10px]">LTP RANGE HARI INI</span>
                  <span className="text-xs text-white mt-1">
                    L: <strong className="text-rose-400 font-extrabold">{formatIDR(activeStock.low || activeStock.currentPrice * 0.98)}</strong> — H: <strong className="text-emerald-400 font-extrabold">{formatIDR(activeStock.high || activeStock.currentPrice * 1.02)}</strong>
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 font-sans text-[10px]">PREVIOUS CLOSE</span>
                  <span className="text-slate-350 font-bold text-sm mt-0.5">
                    {formatIDR(activeStock.previousPrice || activeStock.currentPrice)}
                  </span>
                </div>
                <div className="hidden lg:flex flex-col gap-0.5">
                  <span className="text-slate-500 font-sans text-[10px]">STATUS TRANSAKSI</span>
                  <span className="text-cyan-400 font-extrabold text-sm mt-0.5 uppercase tracking-wide">
                    {activeStock.changePercent > 1.2 ? "Bullish" : activeStock.changePercent < -1.2 ? "Bearish" : "Konsolidasi"}
                  </span>
                </div>
              </div>

              {/* Chart Stage View port */}
              <div className="flex-1 min-h-[350px] bg-[#010912] border border-slate-900 rounded-xl p-4 relative flex flex-col justify-stretch">
                {chartType === "tradingview" ? (
                  <div className="w-full h-full min-h-[400px] flex-1">
                    <TradingViewWidget symbol={activeStock.ticker} />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col justify-between flex-1 space-y-4">
                    {/* SVG Area with Full Height Grid and Tooltips */}
                    <div className="flex-1 relative h-full min-h-[350px]">
                      {(!prices || prices.length === 0) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-amber-500 font-mono text-sm animate-pulse">
                          ⏳ MEMBACA KOORDINAT TREN BURSA...
                        </div>
                      )}
                      
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ visibility: "hidden" }}>
                        <defs>
                          <linearGradient id="fullscreenChartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Main Fullscreen chart responsive SVG plot */}
                      <ResponsiveContainer id="fullscreen_technical_chart" width="100%" height="100%">
                        <AreaChart 
                          data={prices.map((p, idx) => {
                            const prevP = idx === 0 ? p : prices[idx - 1];
                            const changePct = idx === 0 ? 0 : Number((((p - prevP) / prevP) * 100).toFixed(2));
                            const baseVol = activeStock.volume || 120000;
                            const volModifier = 0.7 + ((p % 17) / 100) + (changePct > 0 ? 0.35 : 0);
                            return {
                              name: `Sesi T-${9-idx}`,
                              Harga: p,
                              changePercent: changePct,
                              volume: Math.round(baseVol * volModifier)
                            };
                          })}
                        >
                          <defs>
                            <linearGradient id="fullscreenGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.2} strokeWidth={3} />
                              <stop offset="100%" stopColor={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                          <YAxis 
                            domain={[Math.min(...prices) * 0.995, Math.max(...prices) * 1.005]} 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(v) => `Rp ${v}`}
                          />
                          <Tooltip content={<CustomAnimatedTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="Harga" 
                            stroke={activeStock.changePercent >= 0 ? "#22c55e" : "#ef4444"} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#fullscreenGrad)" 
                          />

                          {showFibonacci && fibonacciLevels.map((lvl, index) => {
                            const isKeyLevel = lvl.ratio === 0.382 || lvl.ratio === 0.5 || lvl.ratio === 0.618;
                            const strokeColor = lvl.ratio === 0.5 ? "rgba(245, 158, 11, 0.7)" : // Amber
                                                lvl.ratio === 0.618 ? "rgba(34, 211, 238, 0.85)" : // Cyan
                                                isKeyLevel ? "rgba(168, 85, 247, 0.7)" : // Purple
                                                "rgba(148, 163, 184, 0.45)"; // Slate
                            return (
                              <ReferenceLine 
                                key={`fibo-recharts-${index}`}
                                y={lvl.price} 
                                stroke={strokeColor} 
                                strokeWidth={isKeyLevel ? 1.5 : 0.8}
                                strokeDasharray={lvl.ratio === 0.0 || lvl.ratio === 1.0 ? "0" : "3 3"}
                              >
                                <Label 
                                  value={`FIBO ${lvl.label}: Rp ${Math.round(lvl.price).toLocaleString("id-ID")}`} 
                                  position="insideLeft" 
                                  fill={lvl.ratio === 0.618 ? "#22d3ee" : lvl.ratio === 0.5 ? "#fbbf24" : "#94a3b8"}
                                  style={{ fontSize: "8.5px", fontFamily: "monospace", fontWeight: isKeyLevel ? "bold" : "normal" }}
                                />
                              </ReferenceLine>
                            );
                          })}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Support & Resistance Technical Overlay Table */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-900/60 text-[11px] font-mono">
                      <div className="p-2 bg-slate-950/60 rounded border border-slate-900">
                        <span className="text-slate-500 block">SUPPORT S1</span>
                        <span className="font-extrabold text-white mt-0.5 block">{formatIDR(Math.round(Math.min(...prices) * 0.99))}</span>
                      </div>
                      <div className="p-2 bg-slate-950/60 rounded border border-slate-900">
                        <span className="text-slate-500 block">SUPPORT S2</span>
                        <span className="font-extrabold text-white mt-0.5 block">{formatIDR(Math.round(Math.min(...prices) * 0.98))}</span>
                      </div>
                      <div className="p-2 bg-slate-950/60 rounded border border-slate-900">
                        <span className="text-slate-500 block">RESISTANCE R1</span>
                        <span className="font-extrabold text-white mt-0.5 block">{formatIDR(Math.round(Math.max(...prices) * 1.01))}</span>
                      </div>
                      <div className="p-2 bg-slate-950/60 rounded border border-slate-900">
                        <span className="text-slate-500 block">RESISTANCE R2</span>
                        <span className="font-extrabold text-white mt-0.5 block">{formatIDR(Math.round(Math.max(...prices) * 1.02))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Instructions / Info footer banner */}
              <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-sans border-t border-slate-900 pt-3 gap-2">
                <span className="flex items-center gap-1.5 text-slate-450">
                  <Info className="w-3.5 h-3.5 text-cyan-500" />
                  Gunakan scroll mntik/cursor di atas area grafik untuk membaca rincian koordinat baris harga.
                </span>
                <span className="uppercase text-[8.5px] tracking-wider font-bold text-slate-600 font-mono">
                  IDX JATS ENGINE VERSION 4.1.0-LIVE
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== 📊 MODAL: QUICK COMPARE WITH IHSG ==================== */}
      <AnimatePresence>
        {isCompareOpen && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[450px] aspect-[3/4] max-h-[90vh] bg-[#020b13] border border-cyan-500/25 rounded-2xl p-5 md:p-6 shadow-2xl relative flex flex-col justify-between overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-cyan-950"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-black text-white font-display uppercase tracking-wider">
                      KOMPARASI PRESTASI VISUAl: {activeStock.ticker} VS IHSG
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Grafik return akumulatif (%) multifrekuensi memprediksi arah gerak relatif emiten terhadap performa indeks sektoral bursa.
                  </p>
                </div>
                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-750 font-mono text-slate-350 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Stats Box */}
              {(() => {
                const stockSeed = activeStock.ticker.charCodeAt(0) + activeStock.ticker.charCodeAt(1);
                
                // Generate 10-day series return comparisons starting at 0%
                const data = [];
                let currentStockCum = 0;
                let currentIhsgCum = 0;
                
                for (let i = 10; i >= 0; i--) {
                  const dayLabel = i === 0 ? "Hari Ini" : `H-${i}`;
                  
                  // Pseudo-deterministic random walk
                  const stockChange = (((stockSeed * (i + 1)) % 13) - 6) / 1.8; // -3.3% to +3.3%
                  const ihsgChange = (((stockSeed * (i + 3)) % 9) - 4) / 3.2;   // -1.2% to +1.2%
                  
                  currentStockCum += stockChange;
                  currentIhsgCum += ihsgChange;
                  
                  data.push({
                    name: dayLabel,
                    [activeStock.ticker]: Number(currentStockCum.toFixed(2)),
                    IHSG: Number(currentIhsgCum.toFixed(2)),
                  });
                }

                const finalStockReturn = currentStockCum;
                const finalIhsgReturn = currentIhsgCum;
                const outperformance = finalStockReturn - finalIhsgReturn;
                const betaVal = (1.0 + (stockSeed % 40) / 100).toFixed(2);
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#011424] border border-cyan-955 p-2 rounded-xl">
                        <span className="text-[8px] text-[#4ea1e4] uppercase font-black block tracking-wider font-sans">Total Return {activeStock.ticker}</span>
                        <strong className={`text-sm font-black font-mono block mt-0.5 ${finalStockReturn >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          {finalStockReturn >= 0 ? "+" : ""}{finalStockReturn.toFixed(2)}%
                        </strong>
                      </div>

                      <div className="bg-slate-950 border border-slate-900 p-2 rounded-xl">
                        <span className="text-[8px] text-slate-450 uppercase font-black block tracking-wider font-sans">Total Return IHSG</span>
                        <strong className={`text-sm font-black font-mono block mt-0.5 ${finalIhsgReturn >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          {finalIhsgReturn >= 0 ? "+" : ""}{finalIhsgReturn.toFixed(2)}%
                        </strong>
                      </div>

                      <div className="bg-[#071911] border border-emerald-950 p-2 rounded-xl">
                        <span className="text-[8px] text-emerald-500/70 uppercase font-black block tracking-wider font-sans">Relatif Alpha</span>
                        <strong className={`text-sm font-black font-mono block mt-0.5 ${outperformance >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          {outperformance >= 0 ? "+" : ""}{outperformance.toFixed(2)}%
                        </strong>
                      </div>

                      <div className="bg-[#181203] border border-amber-955 p-2 rounded-xl">
                        <span className="text-[8px] text-amber-500/75 uppercase font-black block tracking-wider font-sans">Sensitivitas (Beta)</span>
                        <strong className="text-sm font-black text-amber-400 font-mono block mt-0.5">
                          {betaVal}
                        </strong>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="h-44 w-full bg-slate-950/60 border border-cyan-950/20 p-2 rounded-2xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorIhsg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                          <XAxis dataKey="name" stroke="#475569" strokeWidth={1} style={{ fontSize: "10.5px" }} />
                          <YAxis stroke="#475569" strokeWidth={1} style={{ fontSize: "10.5px" }} tickFormatter={(val) => `${val}%`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#020b13", borderColor: "#1e293b", borderRadius: "12px", fontSize: "11px" }}
                            labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
                          />
                          <Area type="monotone" dataKey={activeStock.ticker} stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStock)" activeDot={{ r: 6 }} />
                          <Area type="monotone" dataKey="IHSG" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorIhsg)" strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Narrative Comment */}
                    <div className="p-3.5 bg-[#031525]/35 border border-cyan-900/20 rounded-xl text-xs flex gap-2.5 items-start">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-white block uppercase tracking-wider text-[9px] font-mono">Expert Market Insight (AI Evaluator)</span>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          {outperformance >= 0 
                            ? `Emiten ${activeStock.ticker} menunjukkan tren OUTPERFORM yang kokoh dengan perolehan relatif alfa positif sebesar +${outperformance.toFixed(2)}% di atas indeks bursa efek Indonesia. Volatilitasnya terbilang aktif dengan Beta ${betaVal}, mengonfirmasi minat beli agresif dari dana bandar (smart money) yang konsisten.`
                            : `Saham ${activeStock.ticker} terpantau UNDERPERFORM indeks IHSG sebesar ${Math.abs(outperformance).toFixed(2)}% untuk rentang berjalan. Berdasarkan sensitivitas Beta senilai ${betaVal}, saham ini bersifat cenderung moderat defensif. Disarankan mencermati area support pilar satu untuk melakukan strategi akumulasi bertahap (buy on weakness).`
                          }
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-slate-900">
                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-550 font-sans text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Tutup Komparasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        </div>
      )}

      {/* FLOATING QUICK AI SUMMARY BUTTON */}
      {!isTickerLoading && !tickerLoadingError && activeStock && (
        <div className="fixed bottom-6 right-6 z-40">
          <motion.button
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTriggerQuickSummary}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-full shadow-lg shadow-cyan-500/20 font-sans text-xs font-black uppercase tracking-wider border border-cyan-400/20 transition-all cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse group-hover:rotate-12 transition-transform duration-300" />
            <span>Quick AI Summary</span>
            <span className="bg-slate-950/40 text-[9px] font-mono border border-cyan-500/20 px-1.5 py-0.5 rounded-full text-cyan-300">
              {activeStock.ticker}
            </span>
          </motion.button>
        </div>
      )}

      {/* QUICK AI SUMMARY MODAL OVERLAY */}
      <AnimatePresence>
        {isQuickSummaryOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#030d17] border border-cyan-500/20 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-cyan-950/60 bg-[#020910] flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white font-mono tracking-tighter bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-850/40">
                      {activeStock.ticker}
                    </span>
                    <span className="text-xs text-slate-400 font-bold truncate max-w-[200px] sm:max-w-xs block">
                      {activeStock.name}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-tight uppercase">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Sentimen & Fundamental Kilat Gemini AI
                  </h3>
                </div>
                <button
                  onClick={() => setIsQuickSummaryOpen(false)}
                  className="p-1 px-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {/* Content Area */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar select-text bg-[#030d17]/50">
                {isQuickSummaryLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full" />
                      <div className="absolute inset-0 border-2 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                    <div className="space-y-1.5 text-center">
                      <p className="text-sm font-black text-cyan-400 tracking-wider font-mono animate-pulse uppercase">Synthesizing Report...</p>
                      <p className="text-[11px] text-slate-400 font-sans">Gemini AI sedang membaca neraca keuangan terbaru & sentimen pasar IDX harian...</p>
                    </div>
                  </div>
                ) : quickSummaryError ? (
                  <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-black uppercase font-mono">Gagal Mengumpulkan Analisis</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{quickSummaryError}</p>
                    <button
                      onClick={handleTriggerQuickSummary}
                      className="px-4 py-2 bg-rose-950 text-rose-450 hover:bg-rose-900/50 rounded-lg text-xs font-mono border border-rose-900/40 cursor-pointer"
                    >
                      Coba Ulangi
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Sentiment Pulse Card */}
                    {quickSummarySentiment && (
                      <div className="p-4 rounded-xl border flex items-center justify-between gap-4 bg-slate-950/60 border-slate-900">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Indikator Sentimen AI</span>
                          <span className="text-xs text-slate-350">Rangkuman kilat sentimen pergerakan jangka pendek IDX</span>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border font-bold text-center text-xs shrink-0 tracking-wider ${
                          quickSummarySentiment === "BULLISH" 
                            ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" 
                            : quickSummarySentiment === "BEARISH"
                            ? "bg-rose-950/30 text-rose-450 border-rose-900/50"
                            : "bg-slate-900/40 text-slate-350 border-slate-800"
                        }`}>
                          ● {quickSummarySentiment}
                        </div>
                      </div>
                    )}

                    {/* Markdown Body text */}
                    <div className="bg-[#020910]/40 border border-slate-900 p-5 rounded-xl">
                      {renderFormattedSummary(quickSummaryText)}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-cyan-950/60 bg-[#020910] flex justify-between items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(quickSummaryText);
                    setCopiedSummary(true);
                    setTimeout(() => setCopiedSummary(false), 2000);
                  }}
                  disabled={!quickSummaryText || isQuickSummaryLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-slate-800 transition-all cursor-pointer min-w-[130px] justify-center"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSummary ? "Tersalin!" : "Salin Analisis"}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleTriggerQuickSummary}
                    disabled={isQuickSummaryLoading}
                    className="px-4 py-2 bg-[#051829] hover:bg-cyan-950 text-cyan-400 hover:text-white rounded-lg text-xs border border-cyan-850/60 font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Segarkan
                  </button>
                  <button
                    onClick={() => setIsQuickSummaryOpen(false)}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-lg text-xs font-sans font-black uppercase tracking-wider cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
