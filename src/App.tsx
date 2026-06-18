/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserSession, Stock, PriceAlert } from "./types";
import { INITIAL_STOCKS, tickStockPrices } from "./data";
import PriceAlertsManager from "./components/PriceAlertsManager";
import { getFormattedDateIndo } from "./utils/date";
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import EmitenDashboardView from "./components/EmitenDashboardView";
import ScreenerView from "./components/ScreenerView";
import MarketTracerView from "./components/MarketTracerView";
import NewsView from "./components/NewsView";
import RecommendationsView from "./components/RecommendationsView";
import DeveloperCenterView from "./components/DeveloperCenterView";
import IHSGChatBox from "./components/IHSGChatBox";
import PremiumStrategiesView from "./components/PremiumStrategiesView";
import BrokerStalkerView from "./components/BrokerStalkerView";
import WatchlistView from "./components/WatchlistView";
import ComparisonView from "./components/ComparisonView";
import AccumulationDistributionView from "./components/AccumulationDistributionView";
import ProfileView from "./components/ProfileView";
import fullEmitenList from "./full_emiten_list.json";
import { marketData } from "./marketData";
import { DataService } from "./dataService";
import { validatePrice, normalizePrice } from "./services/PriceManager";

import { 
  TrendingUp, BarChart3, Compass, Newspaper, 
  LogOut, ShieldAlert, BadgeInfo, BellRing,
  Award, RefreshCw, User, Terminal, Flame,
  Menu, X, Upload, LayoutGrid, MoreVertical,
  Plus, Trash2, Bell, Sparkles, ArrowLeft, Star,
  Activity, Coins, Eye, Layers, Search, AlertOctagon
} from "lucide-react";

export default function App() {
  // 🔐 1. Authentication & Session Manager
  const [session, setSession] = useState<UserSession | null>(null);

  // 📱 Mobile responsive sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 📈 2. Real-time Stocks State Engine
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);

  // 🗺️ 3. Navigation State Manager
  const [activeView, setActiveView] = useState<"dashboard" | "emiten-dashboard" | "watchlist" | "broker-stalker" | "screener" | "tracer" | "news" | "recommendations" | "developer" | "premium-strategies" | "comparison" | "accumulation-distribution-hold" | "profile">("dashboard");
  const [premiumCategory, setPremiumCategory] = useState<"multibager" | "ara" | "momentum" | "undervalue" | "near_support" | "bull_divergence" | "early_breakout">("multibager");
  const [selectedBrokerCode, setSelectedBrokerCode] = useState<string>("CC");

  // 🤝 4. Cross-tab Action Messenger
  const [preselectedTicker, setPreselectedTicker] = useState<string | null>(null);

  // 💼 5. Global Unified Sandbox Trading States (shared between Dasbor Market and Dashboard Emiten)
  const [walletBalance, setWalletBalance] = useState<number>(100000000); // Rp 100 Million starting cash
  const [portfolio, setPortfolio] = useState<Record<string, { ticker: string; shares: number; avgBuyPrice: number }>>({
    "BBCA": { ticker: "BBCA", shares: 500, avgBuyPrice: 9900 },
    "TLKM": { ticker: "TLKM", shares: 1000, avgBuyPrice: 3150 }
  });
  const [selectedTicker, setSelectedTicker] = useState<string>("BBCA");
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);

  // 📝 6. Global Watchlist State
  const [watchlist, setWatchlist] = useState<string[]>(["BBRI", "TLKM", "ASII", "GOTO", "AMRT"]);
  const toggleWatchlist = (ticker: string) => {
    setWatchlist(prev => {
      const clean = ticker.toUpperCase();
      if (prev.includes(clean)) {
        return prev.filter(t => t !== clean);
      } else {
        return [...prev, clean];
      }
    });
  };

  // 🔔 6.5. Price Alerts States & Controllers
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem("idx_price_alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Watch stocks to find if any price alerts are triggered
  useEffect(() => {
    if (stocks.length === 0) return;
    
    setAlerts(prevAlerts => {
      let changed = false;
      const nextAlerts = prevAlerts.map(alert => {
        if (alert.triggered) return alert;
        const matchedStock = stocks.find(s => s.ticker.toUpperCase() === alert.ticker.toUpperCase());
        if (!matchedStock) return alert;
        
        let isTriggered = false;
        const currentPrice = matchedStock.currentPrice;
        if (alert.condition === "ABOVE" && currentPrice >= alert.targetPrice) {
          isTriggered = true;
        } else if (alert.condition === "BELOW" && currentPrice <= alert.targetPrice) {
          isTriggered = true;
        }
        
        if (isTriggered) {
          changed = true;
          return {
            ...alert,
            triggered: true,
            triggeredAt: new Date().toLocaleTimeString("id-ID")
          };
        }
        return alert;
      });
      
      if (changed) {
        localStorage.setItem("idx_price_alerts", JSON.stringify(nextAlerts));
        return nextAlerts;
      }
      return prevAlerts;
    });
  }, [stocks]);

  // Alert Action Handlers
  const handleAddAlert = (ticker: string, targetPrice: number, condition: "ABOVE" | "BELOW") => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticker: ticker.toUpperCase(),
      targetPrice,
      condition,
      triggered: false,
      createdAt: new Date().toLocaleDateString("id-ID")
    };
    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    localStorage.setItem("idx_price_alerts", JSON.stringify(updated));
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem("idx_price_alerts", JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    const updated = alerts.filter(a => !a.triggered);
    setAlerts(updated);
    localStorage.setItem("idx_price_alerts", JSON.stringify(updated));
  };

  const handleDismissAlert = (id: string) => {
    const updated = alerts.map(a => a.id === id ? { ...a, dismissed: true } : a);
    setAlerts(updated);
    localStorage.setItem("idx_price_alerts", JSON.stringify(updated));
  };

  // 📈 7. IHSG Index States (Updated dynamically to real bursa levels)
  const [ihsgPrice, setIhsgPrice] = useState(marketData.ihsg_close);
  const [ihsgPrevClose, setIhsgPrevClose] = useState(marketData.prev_close);
  const [ihsgPriceHistory, setIhsgPriceHistory] = useState<number[]>([7112.50, 7120.40, 7125.80, 7132.20, 7144.91, 7150.25]);

  // Effect to append any dynamic changes in live index over active bursa ticks
  useEffect(() => {
    setIhsgPriceHistory((prev) => {
      const next = [...prev];
      if (next.length === 0 || next[next.length - 1] !== ihsgPrice) {
        next.push(ihsgPrice);
      }
      if (next.length > 30) {
        next.shift();
      }
      return next;
    });
  }, [ihsgPrice]);

  // Simple trend indicator (Bullish/Bearish/Sideways) next to the IHSG percentage change, calculated based on the price movement of the last 5 minutes.
  const ihsgTrend = useMemo(() => {
    if (ihsgPriceHistory.length < 2) {
      return { label: "Sideways", icon: "➡️", badgeColor: "bg-[#1e1305] text-amber-500 border-amber-500/10" };
    }
    const latest = ihsgPriceHistory[ihsgPriceHistory.length - 1];
    const compareIdx = Math.max(0, ihsgPriceHistory.length - 6);
    const earlier = ihsgPriceHistory[compareIdx];
    const diff = latest - earlier;
    if (diff > 0.05) {
      return { label: "Bullish", icon: "📈", badgeColor: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" };
    } else if (diff < -0.05) {
      return { label: "Bearish", icon: "📉", badgeColor: "bg-rose-950/40 text-[#ef4444] border-rose-500/20" };
    } else {
      return { label: "Sideways", icon: "↕️", badgeColor: "bg-[#1e1305] text-amber-500 border-amber-500/10" };
    }
  }, [ihsgPriceHistory]);

  // Recommendations popup state
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);

  const ihsgSparkData = [
    { name: "09:00", value: ihsgPrevClose },
    { name: "10:00", value: ihsgPrevClose * 1.0012 },
    { name: "11:00", value: ihsgPrevClose * 0.9992 },
    { name: "11:30", value: ihsgPrevClose * 1.0024 },
    { name: "13:30", value: ihsgPrevClose * 1.0041 },
    { name: "14:00", value: ihsgPrevClose * 1.0035 },
    { name: "15:00", value: ihsgPrevClose * 1.0055 },
    { name: "15:30", value: ihsgPrevClose * 1.0048 },
    { name: "16:00", value: ihsgPrice }
  ];

  const ihsgWeeklyData = [
    { day: "Sen", value: 6240.50 },
    { day: "Sel", value: 6250.20 },
    { day: "Rab", value: 6230.10 },
    { day: "Kam", value: 6220.74 },
    { day: "Jum", value: ihsgPrice }
  ];

  const handleNavigateToEmitenDashboard = (stockOrTicker: string | Stock) => {
    const ticker = typeof stockOrTicker === "string" ? stockOrTicker : stockOrTicker.ticker;
    const cleanTicker = ticker.toUpperCase();
    const isNewTicker = selectedTicker && cleanTicker !== selectedTicker.toUpperCase();
    const isNewView = activeView !== "emiten-dashboard";

    setSelectedTicker(cleanTicker);
    setActiveView("emiten-dashboard");
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    
    if (isNewTicker || isNewView) {
      window.scrollTo({ top: 0, behavior: "instant" });
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTop = 0;
        mainEl.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  };

  // Keep track of previous values to prevent unexpected triggers from React Render cycles
  const prevTickerRef = useRef(selectedTicker);
  const prevViewRef = useRef(activeView);

  // 🔄 Scroll to top ONLY whenever views or stock selection changes
  useEffect(() => {
    if (!selectedTicker) return;
    
    // Normalized comparison values
    const cleanTicker = selectedTicker.toUpperCase();
    const cleanPrevTicker = prevTickerRef.current ? prevTickerRef.current.toUpperCase() : "";
    
    const hasViewChanged = prevViewRef.current !== undefined && activeView !== prevViewRef.current;
    const hasTickerChanged = cleanPrevTicker !== "" && cleanTicker !== cleanPrevTicker;

    if (hasViewChanged || hasTickerChanged) {
      window.scrollTo({ top: 0, behavior: "instant" });
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTop = 0;
        mainEl.scrollTo({ top: 0, behavior: "instant" });
      }
    }
    prevTickerRef.current = selectedTicker;
    prevViewRef.current = activeView;
  }, [activeView, selectedTicker]);

  // Load session from LocalStorage on mounting
  useEffect(() => {
    const saved = localStorage.getItem("idx_trader_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) {
          setSession(parsed);
        }
      } catch (e) {
        console.error("Gagal mendecode session bursa harian.", e);
      }
    }
  }, []);

  // State global untuk data harga terkini dari file lokal/API
  const [prices, setPrices] = useState<any>(null);

  // Gunakan useEffect untuk memuat data langsung dari NeaByte API IDX terpusat atau file lokal
  useEffect(() => {
    const initializeData = async () => {
      let neabyteLoaded = false;
      try {
        // Tarik data IDX real-time terpusat dari NeaByte API
        const neabyteList = await DataService.fetchNeabyteStocks();
        if (neabyteList && neabyteList.length > 0) {
          console.log(`[App] Berhasil memuat ${neabyteList.length} emiten real-time dari NeaByte API.`);
          
          // Simpan data NeaByte dalam format pemetaan harga
          const mappedPrices: Record<string, any> = {};
          neabyteList.forEach((item: any) => {
            const ticker = (item.ticker || item.symbol || "").toUpperCase();
            if (ticker) {
              const currentPrice = parseFloat(item.price ?? item.currentPrice ?? item.current_price ?? item.close ?? 500);
              const previousPrice = parseFloat(item.prevClose ?? item.previousPrice ?? item.prev_close ?? item.open ?? currentPrice);
              const change = item.change !== undefined ? parseFloat(item.change) : (currentPrice - previousPrice);
              const changePercent = item.changePercent !== undefined ? parseFloat(item.changePercent) : (previousPrice > 0 ? (change / previousPrice) * 100 : 0);
              
              mappedPrices[ticker] = {
                currentPrice,
                previousPrice,
                change,
                changePercent,
                low: item.low || Math.min(previousPrice, currentPrice),
                high: item.high || Math.max(previousPrice, currentPrice),
                volume: item.volume ?? item.vol ?? 12500000,
                longName: item.name || item.companyName || item.company_name || `${ticker} Tbk.`,
                history: item.history && Array.isArray(item.history) && item.history.length > 0
                  ? item.history.map((h: any) => parseFloat(h))
                  : [previousPrice, Math.round((previousPrice + currentPrice) / 2), currentPrice]
              };
            }
          });

          setPrices(mappedPrices);

          // Update seluruh list stocks real-time
          setStocks((prev) => {
            const updated = [...prev];
            updated.forEach((s, idx) => {
              const ticker = s.ticker.toUpperCase();
              const apiItem = mappedPrices[ticker];
              if (apiItem) {
                updated[idx].currentPrice = apiItem.currentPrice;
                updated[idx].previousPrice = apiItem.previousPrice;
                updated[idx].change = apiItem.change;
                updated[idx].changePercent = Number(apiItem.changePercent.toFixed(2));
                if (apiItem.history) {
                  updated[idx].history = apiItem.history;
                }
                if (apiItem.low) updated[idx].low = apiItem.low;
                if (apiItem.high) updated[idx].high = apiItem.high;
                if (apiItem.volume) updated[idx].volume = apiItem.volume;
              }
            });
            return updated;
          });
          neabyteLoaded = true;
        }
      } catch (err) {
        console.warn("[App Initializer] Gagal memuat data dari NeaByte API, menggunakan fallback standard JSON:", err);
      }

      // Jika NeaByte gagal dimuat atau ada issues, gunakan fallback file lokal
      if (!neabyteLoaded) {
        try {
          const res = await fetch('/data/latest_prices.json');
          const data = await res.json();
          if (data) {
            setPrices(data);
            setStocks((prev) => {
              const updated = [...prev];
              updated.forEach((s, idx) => {
                const ticker = s.ticker.toUpperCase();
                if (data[ticker]) {
                  const rawVal = data[ticker].currentPrice;
                  const validated = validatePrice(rawVal, ticker);
                  updated[idx].currentPrice = normalizePrice(validated, s.currentPrice);
                  if (data[ticker].previousPrice) {
                    updated[idx].previousPrice = data[ticker].previousPrice;
                    updated[idx].change = updated[idx].currentPrice - updated[idx].previousPrice;
                    updated[idx].changePercent = Number(((updated[idx].change / updated[idx].previousPrice) * 100).toFixed(2));
                  }
                }
              });
              return updated;
            });
          }
        } catch (fallbackErr) {
          console.warn("[App Initializer] Fallback lokal juga gagal:", fallbackErr);
        }
      }

      // Tarik serta sinkronisasi IHSG secara real-time
      try {
        const ihsgResponse = await fetch(`/api/stock-live/IHSG?t=${Date.now()}`, { cache: "no-cache" });
        if (ihsgResponse.ok) {
          const liveIhsg = await ihsgResponse.json();
          if (liveIhsg && liveIhsg.currentPrice) {
            const valPrice = validatePrice(liveIhsg.currentPrice, "IHSG");
            const finalPrice = normalizePrice(valPrice, marketData.ihsg_close);
            setIhsgPrice(finalPrice);
            if (liveIhsg.previousPrice) {
              setIhsgPrevClose(liveIhsg.previousPrice);
            }
          }
        }
      } catch (e) {
        console.warn("[App Initializer] Gagal melakukan sinkronisasi IHSG awal:", e);
      }
    };

    initializeData();
  }, []);

  // 🔄 Unified Real-time Yahoo Finance & IHSG Index Synchronizer (Refreshes every 60s)
  const syncAllLive = async () => {
    try {
      // 1. Fetch live IHSG index from proxy
      const ihsgResponse = await fetch(`/api/stock-live/IHSG?t=${Date.now()}`, { cache: "no-cache" });
      if (ihsgResponse.ok) {
        const liveIhsg = await ihsgResponse.json();
        console.log('IHSG API Diterima (App Sync):', liveIhsg);
        if (liveIhsg && liveIhsg.currentPrice) {
          // Sync with the actual live values retrieved from Yahoo Finance
          const valPrice = validatePrice(liveIhsg.currentPrice, "IHSG");
          const finalPrice = normalizePrice(valPrice, marketData.ihsg_close);
          
          setIhsgPrice(finalPrice);
          if (liveIhsg.previousPrice) {
            setIhsgPrevClose(liveIhsg.previousPrice);
          }
        }
      }

      // 2. Bulk sync major stocks representing key sectors
      const majors = ["BBCA", "BBRI", "BMRI", "BBNI", "TLKM", "GOTO", "ASII", "UNVR", "ADRO", "ANTM", "BUMI", "AMRT"];
      const res = await fetch(`/api/stocks/live-bulk?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: majors }),
        cache: "no-cache"
      });
      if (res.ok) {
        const liveStocks: Stock[] = await res.json();
        console.log('Bulk stocks API Diterima (App Sync):', liveStocks);
        if (liveStocks && liveStocks.length > 0) {
          setStocks((prev) => {
            const updated = [...prev];
            liveStocks.forEach((live) => {
              const idx = updated.findIndex((s) => s.ticker === live.ticker);
              if (idx !== -1) {
                const valPrice = validatePrice(live.currentPrice, live.ticker);
                const finalPrice = normalizePrice(valPrice, updated[idx].currentPrice);
                
                updated[idx] = {
                  ...updated[idx],
                  ...live,
                  currentPrice: finalPrice
                };
              }
            });
            return updated;
          });
        }
      }
    } catch (err) {
      console.warn("Gagal melakukan otomatis sinkronisasi harga live Yahoo Finance:", err);
    }
  };


  useEffect(() => {
    // Run synchronization immediately on startup
    syncAllLive();

    let timeoutId: any;

    const runPolling = async () => {
      const now = new Date();
      // Convert to Indonesian WIB (UTC + 7 hours)
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const wibDate = new Date(utc + (3600000 * 7));
      
      const wibDay = wibDate.getDay(); // 0 is Sunday, 6 is Saturday
      const wibHour = wibDate.getHours();
      const wibMin = wibDate.getMinutes();
      const wibTimeDecimal = wibHour + (wibMin / 60);

      const isWeekend = wibDay === 0 || wibDay === 6;
      let isBursaOpen = false;

      // IDX Trading Hours (WIB):
      // Senin - Jumat: Sesi 1: 09:00 - 12:00, Sesi 2: 13:30 - 16:00
      if (!isWeekend) {
        if (wibTimeDecimal >= 9.0 && wibTimeDecimal <= 12.0) {
          isBursaOpen = true;
        } else if (wibTimeDecimal >= 13.5 && wibTimeDecimal <= 16.0) {
          isBursaOpen = true;
        }
      }

      // Fast streaming sync (every 60 seconds) when open. Slow checking (every 10 minutes) when closed.
      const nextDelay = isBursaOpen ? 60000 : 600000;

      if (isBursaOpen) {
        console.log(`[Bursa IDX OPEN]: Menyinkronkan harga live otomatis setiap ${nextDelay / 1000}s...`);
        await syncAllLive();
      } else {
        console.log(`[Bursa IDX CLOSED]: Mode hemat daya aktif. Cek jam perdagangan bursa lagi dalam ${nextDelay / 60000} menit.`);
      }

      timeoutId = setTimeout(runPolling, nextDelay);
    };

    // Begin dynamic polling loop
    timeoutId = setTimeout(runPolling, 60000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Sync session state to LocalStorage
  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem("idx_trader_session", JSON.stringify(newSession));
    // Force immediate live prices synchronization upon login
    syncAllLive();
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("idx_trader_session");
  };

  // 📡 Real-time selected ticker Yahoo Finance/Manual synchronizer using DataService & AbortController
  useEffect(() => {
    if (!selectedTicker) return;
    const activeTicker = selectedTicker.toUpperCase().trim();
    
    const controller = new AbortController();
    let active = true;
    const fetchLivePrice = async () => {
      try {
        const liveData = await DataService.getUnifiedData(activeTicker, controller.signal);
        if (active && liveData && liveData.ticker) {
          console.log('Data API Diterima (App Sync via DataService):', liveData);
          setStocks((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((s) => s.ticker.toUpperCase() === activeTicker);
            if (idx !== -1) {
              // Merge with actual Yahoo/Local stock specifications
              updated[idx] = {
                ...updated[idx],
                ...liveData
              };
            } else {
              // If the user selected a custom stock not in directory, add it dynamically!
              updated.push(liveData);
            }
            return updated;
          });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`Fetch aborted for AppSync: ${activeTicker}`);
          return;
        }
        console.warn("Gagal mengambil data live real-time untuk ticker:", activeTicker, err);
      }
    };

    fetchLivePrice();
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedTicker]);

  // Helper method to pass ticker in child components and switch index
  const handleNavigateToTracer = (ticker: string) => {
    setPreselectedTicker(ticker);
    setActiveView("tracer");
  };

  const clearPreselectedTicker = () => {
    setPreselectedTicker(null);
  };

  // Guard routing logic
  if (!session || !session.isLoggedIn) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#030914] text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-600/30 selection:text-white relative">
      
      {/* 🌟 Top Navigation Bar with Toggle Hamburger menu - Styled as IHSG SCREENER with Upload button */}
      <header className="w-full h-16 bg-[#03131e] border-b border-cyan-900/30 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-4">
          {/* Pojok kiri atas dengan icon garis tiga (hamburger) berwarna teal/cyan */}
          <button
            id="sidebar-toggle-trigger"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded bg-[#0d222f] border border-cyan-500/25 text-cyan-400 hover:text-cyan-200 hover:bg-[#122c3c] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Sembunyikan/Tampilkan Panel Samping"
          >
            <div className={`transition-transform duration-300 ${isSidebarOpen ? "rotate-90 scale-100" : "rotate-0 scale-100"}`}>
              {isSidebarOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4" />}
            </div>
          </button>

          {/* Brand logo & tagline matching screenshot title with SAHAM INDO */}
          <div className="flex items-center gap-2">
            {activeView !== "dashboard" && (
              <button
                onClick={() => setActiveView("dashboard")}
                className="p-1 px-2 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-300 hover:text-white hover:bg-teal-950/70 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 font-bold text-[10px] uppercase font-sans shrink-0"
                title="Kembali ke Dasbor Market"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
                <span>KEMBALI</span>
              </button>
            )}
            <div className="flex flex-col text-left justify-center">
              <span className="font-extrabold text-base md:text-lg text-white leading-none tracking-tight uppercase">SAHAM INDO</span>
            </div>
          </div>
        </div>

        {/* Live Index Ticker Banner in header with Sahara/SahamIndo address bar */}
        <div className="hidden md:flex items-center space-x-3.5 text-xs">
          <div className="relative group bg-[#020b11] px-3 py-1.5 rounded-md border border-cyan-900/20 flex items-center space-x-2.5 font-mono cursor-help">
            <span className="text-slate-400 font-bold font-sans text-[10px] uppercase tracking-wider">IHSG Composite:</span>
            <span className="text-emerald-400 font-black">
              {ihsgPrice.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] font-bold ${ihsgPrice >= ihsgPrevClose ? "text-emerald-400" : "text-rose-450"}`}>
              ({ihsgPrice >= ihsgPrevClose ? "+" : ""}{((ihsgPrice - ihsgPrevClose) / ihsgPrevClose * 100).toFixed(2)}%)
            </span>

            {/* 1-Week Interactive Area Chart showing past week price movement */}
            <div className="border-l border-cyan-900/40 pl-3.5 flex items-center gap-2">
              <span className="text-[9px] text-slate-500 font-sans tracking-tight uppercase leading-none font-bold">Trend 1M</span>
              <div className="w-24 h-7 relative overflow-visible flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ihsgWeeklyData}>
                    <defs>
                      <linearGradient id="headerIhsgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ihsgPrice >= ihsgPrevClose ? "#10b981" : "#ef4444"} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={ihsgPrice >= ihsgPrevClose ? "#10b981" : "#ef4444"} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={ihsgPrice >= ihsgPrevClose ? "#10b981" : "#ef4444"} 
                      strokeWidth={1.8} 
                      fill="url(#headerIhsgGrad)"
                      dot={{ r: 1.5, fill: ihsgPrice >= ihsgPrevClose ? "#10b981" : "#ef4444" }}
                      activeDot={{ r: 3, fill: "#fff" }}
                    />
                    <RechartsTooltip
                      cursor={{ stroke: "rgba(34,197,94,0.15)", strokeWidth: 1 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value as number;
                          const label = payload[0].payload.day;
                          return (
                            <div className="bg-slate-950 border border-cyan-800/80 px-1.5 py-0.5 rounded text-[9.5px] font-mono text-cyan-300 font-black -mt-7 shadow-lg">
                              {label}: {val.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                            </div>
                          );
                        }
                        return null;
                      }}
                      position={{ y: -18 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Premium Hover Tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 p-2.5 bg-slate-950 border border-cyan-800/60 rounded-xl shadow-xl shadow-black/80 text-left z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="text-[10px] text-slate-400 font-sans uppercase font-bold text-cyan-400 tracking-wider mb-1">Rincian Perubahan IHSG</div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Selisih Absolut:</span>
                  <span className={`font-bold ${(ihsgPrice - ihsgPrevClose) >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                    {(ihsgPrice - ihsgPrevClose) >= 0 ? "▲" : "▼"} Rp {Math.abs(ihsgPrice - ihsgPrevClose).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-sans">
                  <span className="text-slate-500">Penutupan Kemarin:</span>
                  <span className="text-slate-300">{ihsgPrevClose.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-1.5 mt-1.5 text-[10px]">
                  <span className="text-slate-500">Waktu Tutup:</span>
                  <span className="text-cyan-400 font-bold">Sabtu, 6 Juni 2026 16:00 WIB</span>
                </div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setIsDomainModalOpen(true)}
            className="hidden lg:flex items-center space-x-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-900 hover:border-cyan-500/20 rounded-xl px-3.5 py-1.5 cursor-pointer transition-all text-xs text-slate-350 font-mono shadow-inner select-none active:scale-95 group"
            title="Klik untuk melihat panduan kustom domain SahamIndo.com"
          >
            <span className="text-emerald-400 font-bold text-[10px] select-none">🔒</span>
            <span className="font-extrabold text-white text-[11px] group-hover:text-cyan-400 transition-all">SahamIndo.com</span>
            <span className="text-[8px] tracking-wider text-cyan-400 font-bold font-sans px-1.5 py-0.5 bg-cyan-950 text-cyan-400 rounded uppercase">Mapped</span>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
            <span className="text-cyan-450 text-[9.5px] font-extrabold uppercase tracking-wide">IDX LIVE FEED</span>
          </div>
        </div>

        {/* User context quick badge and custom Last Updated display matching prompt */}
        <div className="flex items-center space-x-3 relative">
          <div className="hidden sm:flex flex-col items-end text-right px-2.5">
            <span className="text-[8px] text-slate-450 text-cyan-400 font-sans uppercase font-extrabold tracking-widest leading-none">IDX Live Feed Status</span>
            <span className="text-[10px] text-emerald-400 font-mono font-black mt-1">Aktif: {getFormattedDateIndo()}</span>
          </div>

          <div className="h-4 w-[1px] bg-cyan-900/30 hidden sm:block"></div>

          {/* Price Alerts Bell Notification Trigger */}
          <button
            id="price-alert-bell"
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`p-2 rounded border relative active:scale-95 transition-all text-xs flex items-center justify-center cursor-pointer ${
              isAlertsOpen 
                ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30"
            }`}
            title="Price Alert Manager (Kelola Alarm Harga)"
          >
            <Bell className={`w-3.5 h-3.5 ${alerts.some(a => !a.triggered) ? "animate-pulse text-cyan-400" : ""}`} />
            {alerts.filter(a => !a.triggered).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center scale-90 border border-slate-950">
                {alerts.filter(a => !a.triggered).length}
              </span>
            )}
          </button>

          <div className="h-4 w-[1px] bg-cyan-900/30"></div>

          <button
            onClick={handleLogout}
            className="p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 active:scale-95 transition-all text-xs flex items-center gap-1 font-bold cursor-pointer"
            title="Keluar / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Price Alerts Manager Popup Panel */}
          <AnimatePresence>
            {isAlertsOpen && (
              <>
                {/* Backdrop overlay specialized to close panel when clicking outside */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsAlertsOpen(false)} 
                />
                <PriceAlertsManager 
                  stocks={stocks}
                  alerts={alerts}
                  onAddAlert={handleAddAlert}
                  onDeleteAlert={handleDeleteAlert}
                  onClearHistory={handleClearHistory}
                  onClose={() => setIsAlertsOpen(false)}
                />
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* 🔔 Dynamic Price Alert Notification Banners inside or just below header */}
      <AnimatePresence>
        {alerts.filter(a => a.triggered && !a.dismissed).map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-500/35 px-4 md:px-6 py-2 flex items-center justify-between text-xs font-sans text-amber-100 relative z-25 overflow-hidden group shadow-lg shadow-amber-950/20"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0 leading-relaxed text-[11px] md:text-xs">
                <span className="font-extrabold uppercase bg-amber-950 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/20 font-mono text-[9px] mr-1.5">ALARM HARGA TERPICU</span>
                <span>
                  Saham <strong className="font-black font-mono text-white text-[12px] md:text-[13px]">{alert.ticker}</strong> telah menyentuh target Anda{" "} 
                  <strong className="font-black text-amber-300 font-mono text-[12px] md:text-[13px]">Rp {alert.targetPrice.toLocaleString("id-ID")}</strong>{" "}
                  {alert.condition === "ABOVE" ? "(Naik Melewati ▲)" : "(Turun Melewati ▼)"} pada pukul <span className="font-mono text-slate-350 font-bold">{alert.triggeredAt}</span>!
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDismissAlert(alert.id)}
              className="ml-4 p-1 rounded-md bg-amber-900/60 hover:bg-amber-800 text-amber-300 hover:text-white border border-amber-500/20 transition-all font-bold cursor-pointer text-[10px] uppercase flex items-center gap-1 active:scale-95 shrink-0"
              title="Sembunyikan Alarm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 🖤 Overlay Backdrop for Mobile Menu Drawer */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 z-20 md:hidden transition-opacity duration-300 pointer-events-auto"
        />
      )}

      {/* Main layout container with conditional layout sidebar */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Toggleable Navigation Sidebar */}
        <aside 
          className={`bg-[#0b0f19] border-r border-slate-850 flex flex-col justify-between shrink-0 transition-all duration-300 absolute md:relative z-25 md:z-10 overflow-y-auto overflow-x-hidden ${
            isSidebarOpen 
              ? "w-72 inset-y-0 left-0 h-[calc(100vh-64px)] translate-x-0 border-r" 
              : "w-0 overflow-hidden border-none pointer-events-none -translate-x-full md:w-0"
          }`}
        >
          <div className="min-h-full flex flex-col justify-between p-4 space-y-4 bg-[#0b0f19]">
            
            <div className="space-y-4">
              {/* Internal brand widget in panel header */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">BURSA AKTIF</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">Sesi 1 - IDX</span>
              </div>

              {/* Navigation Menu Links */}
              <nav className="space-y-2 text-xs">
                
                <button
                  id="nav-dashboard-tab"
                  onClick={() => {
                    setActiveView("dashboard");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "dashboard"
                      ? "bg-slate-800 text-white border-l-2 border-blue-500 shadow-md shadow-blue-900/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <BarChart3 className="w-4.5 h-4.5 text-blue-400" />
                  <span className="font-veneer text-[20px] tracking-tight antialiased">Market</span>
                </button>

                <button
                  id="nav-emiten-dashboard-tab"
                  onClick={() => {
                    setActiveView("emiten-dashboard");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "emiten-dashboard"
                      ? "bg-slate-800 text-white border-l-2 border-cyan-400 shadow-md shadow-cyan-900/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <LayoutGrid className="w-4.5 h-4.5 text-cyan-400" />
                  <span className="font-veneer text-[20px] tracking-tight antialiased">Dashboard Emiten</span>
                </button>

                {/* 🎯 "Smart Pick" relocated under Dashboard Emiten as requested */}
                <button
                  id="nav-smart-pick-tab"
                  onClick={() => {
                    setActiveView("premium-strategies");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer text-left ${
                    activeView === "premium-strategies"
                      ? "bg-slate-800 text-teal-300 border-l-2 border-teal-400 shadow-md shadow-teal-900/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <Sparkles className="w-4.5 h-4.5 text-teal-400 shrink-0 animate-pulse" />
                  <div className="flex flex-col text-left">
                    <span className="font-veneer text-[20px] tracking-tight antialiased leading-none">Smart Pick</span>
                    <span className="text-[8px] text-teal-400 font-extrabold uppercase leading-none block mt-1 pl-0.5">Strategi Unggulan</span>
                  </div>
                </button>

                <button
                  id="nav-watchlist-tab"
                  onClick={() => {
                    setActiveView("watchlist");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "watchlist"
                      ? "bg-slate-800 text-white border-l-2 border-amber-405 border-amber-400 shadow-md shadow-amber-900/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400/20" />
                  <span className="font-veneer text-[20px] tracking-tight antialiased">Watchlist</span>
                </button>

                <button
                  id="nav-screener-tab"
                  onClick={() => {
                    setActiveView("screener");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "screener"
                      ? "bg-slate-800 text-white border-l-2 border-emerald-500 shadow-md shadow-emerald-950/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Compass className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="font-veneer text-[20px] tracking-tight antialiased">Stock Screener</span>
                </button>

                <button
                  id="nav-broker-stalker-tab"
                  onClick={() => {
                    setActiveView("broker-stalker");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "broker-stalker"
                      ? "bg-slate-800 text-white border-l-2 border-cyan-455 border-cyan-400 shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Eye className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                  <span className="font-veneer text-[20px] tracking-tight antialiased">Broker Stalker</span>
                </button>

                <button
                  id="nav-comparison-tab"
                  onClick={() => {
                    setActiveView("comparison");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "comparison"
                      ? "bg-slate-800 text-white border-l-2 border-teal-400 shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Layers className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                  <span className="font-veneer text-[20px] tracking-tight antialiased">Perbandingan Emiten</span>
                </button>

                <button
                  id="nav-recommendations-tab"
                  onClick={() => {
                    setActiveView("recommendations");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "recommendations"
                      ? "bg-slate-800 text-white border-l-2 border-amber-500 shadow-md shadow-amber-950/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Flame className="w-4.5 h-4.5 text-orange-400 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="font-veneer text-[20px] tracking-tight antialiased leading-none">Rekomendasi Saham</span>
                    <span className="text-[8px] text-amber-500 font-extrabold uppercase leading-none block mt-1 pl-0.5">BPJS, BSJP &amp; Swing</span>
                  </div>
                </button>

                <button
                  id="nav-acc-dist-tab"
                  onClick={() => {
                    setActiveView("accumulation-distribution-hold");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "accumulation-distribution-hold"
                      ? "bg-slate-800 text-white border-l-2 border-emerald-400 shadow-md shadow-emerald-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Activity className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="font-veneer text-[20px] tracking-tight antialiased leading-none">Akumulasi &amp; Distribusi</span>
                    <span className="text-[8px] text-emerald-400 font-extrabold uppercase leading-none block mt-1 pl-0.5">Top 7 Radar &amp; Bandar</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveView("tracer");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "tracer"
                      ? "bg-slate-800 text-white border-l-2 border-blue-400 shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Award className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-veneer text-[20px] tracking-tight antialiased">AI Market Tracer</span>
                    <span className="bg-amber-500/10 text-[9px] px-1 text-amber-400 rounded-sm font-black border border-amber-500/25 uppercase">Gemini</span>
                  </div>
                </button>

                <button
                  id="nav-news-tab"
                  onClick={() => {
                    setActiveView("news");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "news"
                      ? "bg-slate-800 text-white border-l-2 border-indigo-505/30 border-blue-500 shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Newspaper className="w-4.5 h-4.5 text-slate-400" />
                  <span className="font-veneer text-[20px] tracking-tight antialiased">Berita &amp; Sentimen</span>
                </button>

                <button
                  id="nav-profile-tab"
                  onClick={() => {
                    setActiveView("profile");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                    activeView === "profile"
                      ? "bg-slate-800 text-white border-l-2 border-indigo-400 shadow-md shadow-indigo-900/10"
                      : "text-slate-400 hover:text-slate-205 hover:text-white hover:bg-slate-900/50"
                  }`}
                >
                  <User className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="font-veneer text-[20px] tracking-tight antialiased">Profil Saya</span>
                </button>

                <button
                  id="nav-developer-tab"
                  onClick={() => {
                    setActiveView("developer");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold flex items-center space-x-3 transition-all cursor-pointer mt-4 pt-4 border-t border-slate-850/80 ${
                    activeView === "developer"
                      ? "bg-slate-800 text-white border-l-2 border-emerald-500"
                      : "text-slate-500 hover:text-slate-350 hover:bg-slate-900/30"
                  }`}
                >
                  <Terminal className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span>Developer Center</span>
                    <span className="text-[7.5px] text-emerald-400 font-black uppercase leading-none mt-0.5">Run &amp; Host Lokal</span>
                  </div>
                </button>

              </nav>
            </div>

            {/* Profile widget bar inside drawer bottom */}
            <div className="space-y-3 pt-4 border-t border-slate-850/70 animate-fadeIn">
              
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-[11px] leading-relaxed text-slate-400 space-y-1">
                <span className="text-white font-bold flex items-center gap-1">
                  <BellRing className="w-3.5 h-3.5 text-blue-400" /> Wawasan Analis:
                </span>
                <p className="text-[10px] text-slate-500 leading-normal">Optimalkan portofolio Anda menggunakan porsi swing-trading terkontrol.</p>
              </div>

              <div className="flex items-center justify-between">
                <div 
                  onClick={() => {
                    setActiveView("profile");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className="flex items-center space-x-2.5 cursor-pointer hover:bg-slate-900/40 p-1 rounded-lg transition-all"
                  title="Buka Profil Saya"
                >
                  <div className="w-8 h-8 bg-slate-800 border border-slate-700/85 rounded-full flex items-center justify-center font-bold text-blue-400 text-xs shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate max-w-[130px]">
                    <p className="text-xs font-bold text-slate-100 leading-tight truncate">{session.name}</p>
                    <span className="text-[9px] text-slate-500 font-medium tracking-wide">Analyst Account</span>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Keluar / Selesai Sesi"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </aside>

        {/* Immersive Main Content Pane */}
        <main className="flex-1 bg-[#030914] p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
          
          {/* Dynamic Inner Router Layout with Framer-Motion Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="space-y-6 flex-1 flex flex-col"
            >
              {activeView === "dashboard" && (
                <DashboardView 
                  stocks={stocks} 
                  onSelectStock={handleNavigateToEmitenDashboard} 
                  onNavigateToTracer={handleNavigateToTracer} 
                  onManualTick={() => setStocks((prevStocks) => tickStockPrices(prevStocks))}
                  propWalletBalance={walletBalance}
                  propSetWalletBalance={setWalletBalance}
                  propPortfolio={portfolio}
                  propSetPortfolio={setPortfolio}
                  propSelectedTicker={selectedTicker}
                  propSetSelectedTicker={setSelectedTicker}
                  propIhsgPrice={ihsgPrice}
                  propSetIhsgPrice={setIhsgPrice}
                  propIhsgPrevClose={ihsgPrevClose}
                  propSetIhsgPrevClose={setIhsgPrevClose}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onNavigateToAccDist={() => setActiveView("accumulation-distribution-hold")}
                />
              )}

              {activeView === "emiten-dashboard" && (
                <EmitenDashboardView
                  stocks={stocks}
                  selectedTicker={selectedTicker}
                  setSelectedTicker={setSelectedTicker}
                  onNavigateToTracer={handleNavigateToTracer}
                  walletBalance={walletBalance}
                  setWalletBalance={setWalletBalance}
                  portfolio={portfolio}
                  setPortfolio={setPortfolio}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectBroker={(brokerCode) => {
                    setSelectedBrokerCode(brokerCode);
                    setActiveView("broker-stalker");
                  }}
                />
              )}

              {activeView === "screener" && (
                <ScreenerView 
                  stocks={stocks} 
                  onNavigateToTracer={handleNavigateToEmitenDashboard} 
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectStock={handleNavigateToEmitenDashboard}
                />
              )}

              {activeView === "watchlist" && (
                <WatchlistView
                  stocks={stocks}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectStock={handleNavigateToEmitenDashboard}
                />
              )}

              {activeView === "broker-stalker" && (
                <BrokerStalkerView
                  stocks={stocks}
                  onSelectStock={handleNavigateToEmitenDashboard}
                  selectedBrokerCode={selectedBrokerCode}
                  setSelectedBrokerCode={setSelectedBrokerCode}
                />
              )}

              {activeView === "comparison" && (
                <ComparisonView
                  stocks={stocks}
                  onSelectStock={handleNavigateToEmitenDashboard}
                />
              )}

              {activeView === "premium-strategies" && (
                <PremiumStrategiesView 
                  stocks={stocks}
                  onSelectStock={handleNavigateToEmitenDashboard}
                  initialCategory={premiumCategory}
                />
              )}

              {activeView === "tracer" && (
                <MarketTracerView 
                  stocks={stocks} 
                  preselectedTicker={preselectedTicker}
                  onClearPreselection={clearPreselectedTicker}
                />
              )}

              {activeView === "news" && (
                <NewsView 
                  onNavigateToTracer={handleNavigateToEmitenDashboard} 
                />
              )}

              {activeView === "recommendations" && (
                <RecommendationsView
                  stocks={stocks}
                  onNavigateToTracer={handleNavigateToEmitenDashboard}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                />
              )}



              {activeView === "developer" && (
                <DeveloperCenterView />
              )}

              {activeView === "accumulation-distribution-hold" && (
                <AccumulationDistributionView
                  stocks={stocks}
                  onSelectStock={handleNavigateToEmitenDashboard}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                />
              )}

              {activeView === "profile" && (
                <ProfileView
                  session={session}
                  stocks={stocks}
                  walletBalance={walletBalance}
                  portfolio={portfolio}
                  onSelectStock={handleNavigateToEmitenDashboard}
                  onNavigateToTab={(tab) => {
                    setActiveView(tab);
                    window.scrollTo({ top: 0, behavior: "instant" });
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* 💬 Tambahan Chat IHSG di bagian paling bawah hanya tersedia di menu utama (dashboard) */}
          {activeView === "dashboard" && <IHSGChatBox />}

        </main>

      </div>

      {/* 🌐 CUSTOM DOMAIN MAPPING CONFIGURATION MODAL (SahamIndo.com) */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#03131e] border border-cyan-500/25 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsDomainModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-[#0d222f] p-1.5 rounded-lg border border-cyan-500/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-cyan-900/40 pb-3">
              <div className="w-10 h-10 bg-cyan-950 rounded-xl border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Compass className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Registrasi &amp; Pemetaan Domain Kustom</h3>
                <p className="text-[10px] text-slate-400 font-bold select-all leading-normal">Status internal Applet: SahamIndo.com Ready</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed font-sans">
              <p>
                Bagian ini menjelaskan secara komplit langkah-langkah untuk memetakan domain kustom terdaftar Anda <strong className="text-white text-cyan-305">SahamIndo.com</strong> agar mengarah ke aplikasi analisis portofolio premium ini:
              </p>

              <div className="space-y-2 border-y border-slate-900 py-3 text-[11px] font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold bg-cyan-950 px-1 py-0.5 rounded text-[8px] leading-none">STEP 1</span>
                  <p className="text-slate-300 leading-normal">Daftarkan domain <strong className="text-white">SahamIndo.com</strong> di penyedia registrasi domain pilihan Anda (seperti Cloudflare, Niagahoster, Rumahweb, Verisign, dll).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold bg-cyan-950 px-1 py-0.5 rounded text-[8px] leading-none">STEP 2</span>
                  <p className="text-slate-300 leading-normal">Buka DNS Manager domain Anda lalu tambahkan record <strong className="font-bold text-white">CNAME record</strong> untuk name <strong className="text-white">@</strong> atau <strong className="text-white">www</strong> mengarah ke alamat host container serverless ini:</p>
                </div>
                <div className="bg-[#020b12] p-2 rounded-lg border border-cyan-950 text-center select-all flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Target Value CNAME:</span>
                  <strong className="text-cyan-400">gcr-ingress.ais-dev.cloud.goog</strong>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold bg-cyan-950 px-1 py-0.5 rounded text-[8px] leading-none">STEP 3</span>
                  <p className="text-slate-300 leading-normal">Tunggu sinkronisasi propagasi DNS (biasanya 5 menit s/d 1-24 jam). Server SSL sertifikat HTTPS gratis akan otomatis dibuat secara terenkripsi untuk mengamankan sambungan domain kustom Anda!</p>
                </div>
              </div>

              <div className="bg-[#071926]/40 p-3 rounded-xl border border-cyan-950 text-[10.5px] text-slate-400 font-sans">
                💡 <strong className="text-white">Catatan Teknis Hosting:</strong> Selama masa pengembangan lokal / AI Studio, preview link asli Anda dialokasikan ke domain serverless Cloud Run yang aman. Konfigurasi perutean internal applet kami telah sepenuhnya dimodifikasi agar siap menyambut domain utama <strong className="text-white">SahamIndo.com</strong> Anda saat dirilis!
              </div>
            </div>

            <button 
              onClick={() => setIsDomainModalOpen(false)}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-lg text-xs transition-all active:scale-95 cursor-pointer"
            >
              Selesai &amp; Kembali ke Dasbor
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
