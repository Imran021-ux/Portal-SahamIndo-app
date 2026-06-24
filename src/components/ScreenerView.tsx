/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { getFormattedShortDateIndo } from "../utils/date";
import { Stock } from "../types";
import { Search, Filter, Compass, Sliders, ArrowUpDown, ChevronDown, Star, Bell, BellRing, Trash2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface ScreenerViewProps {
  stocks: Stock[];
  onNavigateToTracer: (ticker: string) => void;
  watchlist?: string[];
  onToggleWatchlist?: (ticker: string) => void;
  onSelectStock?: (ticker: string) => void;
}

type SortField = 'ticker' | 'currentPrice' | 'changePercent' | 'peRatio' | 'dividendYield' | 'marketCap' | 'volumeChangePercent';
type SortOrder = 'asc' | 'desc';

const renderStockLogo = (ticker: string) => {
  const charSum = ticker.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const colors = [
    { bg: "bg-cyan-600/20 border-cyan-500/35 text-cyan-400", hex: "#06b6d4" },
    { bg: "bg-emerald-600/20 border-emerald-500/35 text-emerald-400", hex: "#10b981" },
    { bg: "bg-blue-600/20 border-blue-500/35 text-blue-400", hex: "#3b82f6" },
    { bg: "bg-amber-600/20 border-amber-500/35 text-amber-400", hex: "#f59e0b" },
    { bg: "bg-rose-600/20 border-rose-500/35 text-rose-400", hex: "#f43f5e" },
    { bg: "bg-purple-600/20 border-purple-500/35 text-purple-400", hex: "#a855f7" },
    { bg: "bg-indigo-600/20 border-indigo-500/35 text-indigo-400", hex: "#6366f1" }
  ];
  const color = colors[charSum % colors.length];

  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-[12px] border shrink-0 select-none ${color.bg}`} style={{ boxShadow: `0 0 10px ${color.hex}18` }}>
      {ticker.slice(0, 2)}
    </div>
  );
};

interface PriceFlashCellProps {
  price: number;
  formatIDR: (val: number) => string;
}

function PriceFlashCell({ price, formatIDR }: PriceFlashCellProps) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = React.useRef<number>(price);

  useEffect(() => {
    if (price !== prevPriceRef.current) {
      if (price > prevPriceRef.current) {
        setFlash("up");
      } else if (price < prevPriceRef.current) {
        setFlash("down");
      }
      prevPriceRef.current = price;

      const timer = setTimeout(() => {
        setFlash(null);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [price]);

  const flashClass = flash === "up" 
    ? "bg-emerald-500/25 text-emerald-450 border border-emerald-500/35 rounded scale-[1.04] px-1.5 py-0.5" 
    : flash === "down" 
      ? "bg-rose-500/25 text-rose-450 border border-rose-500/25 rounded px-1.5 py-0.5 scale-[1.04]" 
      : "px-1 text-white group-hover:text-cyan-100";

  return (
    <span className={`inline-block font-mono font-bold transition-all duration-300 ${flashClass}`}>
      {formatIDR(price)}
    </span>
  );
}

export default function ScreenerView({ stocks, onNavigateToTracer, watchlist = [], onToggleWatchlist, onSelectStock }: ScreenerViewProps) {
  // Screens Mode: Standard Stock Scanner vs Pasar Nego Crossing
  const [screenerMode, setScreenerMode] = useState<"regular" | "nego">("regular");

  // Negotiated Crossing screen items data generator
  const negoItems = useMemo(() => {
    return stocks.slice(0, 15).map((s, idx) => {
      const hash = s.ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const brokerBuyers = ["LG", "CC", "YP", "NI", "RX", "ZP", "CS", "DX", "MG"];
      const brokerSellers = ["ZP", "YP", "CC", "LG", "DR", "ZP", "ML", "KZ", "OD"];
      
      const buyer = brokerBuyers[(hash + idx * 3) % brokerBuyers.length];
      const seller = brokerSellers[(hash + idx * 7) % brokerSellers.length];
      
      const spreadPct = ((hash % 15) - 7.5) * 0.8; 
      const negoPrice = Math.round(s.currentPrice * (1 + spreadPct / 100));
      
      const lotNego = Math.floor(15000 + (hash % 1500) * 120); 
      const totalValue = lotNego * 100 * negoPrice;
      
      const transactionType = spreadPct < -3 
        ? "DISCOUNT OVER-THE-COUNTER" 
        : spreadPct > 3 
          ? "PREMIUM ACQUISITION" 
          : "MANDATE CROSSING";

      return {
        ticker: s.ticker,
        name: s.name,
        currentPrice: s.currentPrice,
        negoPrice,
        spreadPct,
        lotNego,
        totalValue,
        buyer,
        seller,
        transactionType,
        sector: s.sector
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [stocks]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("Semua");
  const [peFilter, setPeFilter] = useState("Semua"); // "Semua", "Murah", "Wajar", "Premium", "Negatif"
  const [divFilter, setDivFilter] = useState("Semua"); // "Semua", "Tinggi", "Sedang", "Nol"
  const [capFilter, setCapFilter] = useState("Semua"); // "Semua", "Mega", "Big", "MidSmall"
  const [volumeFilter, setVolumeFilter] = useState("Semua"); // "Semua", "Positif", "Tinggi", "Negatif"
  const [priceFilter, setPriceFilter] = useState("Semua"); // "Semua", "under500", "500-2000", "2000-5000", "above5005"
  
  // Advanced Screener Filters
  const [pbvFilter, setPbvFilter] = useState("Semua"); // "Semua", "Murah", "Wajar", "Premium"
  const [roeFilter, setRoeFilter] = useState("Semua"); // "Semua", "Tinggi", "Sedang", "Negatif"
  const [derFilter, setDerFilter] = useState("Semua"); // "Semua", "Sehat", "Tinggi"
  const [syariahFilter, setSyariahFilter] = useState("Semua"); // "Semua", "Syariah", "Non-Syariah"

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset page when any filter or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSector, peFilter, divFilter, capFilter, pbvFilter, roeFilter, derFilter, syariahFilter, volumeFilter, priceFilter, sortField, sortOrder]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSector("Semua");
    setPeFilter("Semua");
    setDivFilter("Semua");
    setCapFilter("Semua");
    setVolumeFilter("Semua");
    setPriceFilter("Semua");
    setPbvFilter("Semua");
    setRoeFilter("Semua");
    setDerFilter("Semua");
    setSyariahFilter("Semua");
  };

  // Pre-calculate deterministic volume changes so we can filter and sort by it!
  const volumeChangeMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!stocks) return map;
    stocks.forEach((s) => {
      const hash = s.ticker.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const val = (hash % 60) - 25; // range: -25% to +35%
      map[s.ticker] = val === 0 ? 4.5 : val;
    });
    return map;
  }, [stocks]);

  // --- Price Alerts System ---
  interface PriceAlert {
    ticker: string;
    targetPrice: number;
    condition: "above" | "below";
    triggered: boolean;
  }

  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem("saham_indo_screener_alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeAlertModalStock, setActiveAlertModalStock] = useState<Stock | null>(null);
  const [targetPriceInput, setTargetPriceInput] = useState<number>(0);
  const [alertCondition, setAlertCondition] = useState<"above" | "below">("above");
  const [triggeredAlertMessage, setTriggeredAlertMessage] = useState<string | null>(null);

  // Sync alerts to LocalStorage
  useEffect(() => {
    localStorage.setItem("saham_indo_screener_alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Request browser notification permissions on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Monitor live stocks to trigger alerts!
  useEffect(() => {
    if (!stocks || stocks.length === 0 || alerts.length === 0) return;

    alerts.forEach((alert) => {
      if (alert.triggered) return;

      const stock = stocks.find((s) => s.ticker === alert.ticker);
      if (!stock) return;

      let isTriggered = false;
      if (alert.condition === "above" && stock.currentPrice >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === "below" && stock.currentPrice <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.ticker === alert.ticker && a.targetPrice === alert.targetPrice && a.condition === alert.condition
              ? { ...a, triggered: true }
              : a
          )
        );

        // Standard browser HTML5 Web Notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`🚨 TARGET PRICE HIT: ${alert.ticker}`, {
            body: `Saham ${alert.ticker} menyentuh target Rp ${alert.targetPrice.toLocaleString("id-ID")} (Harga live sekarang: Rp ${stock.currentPrice.toLocaleString("id-ID")})`,
            tag: `${alert.ticker}-${alert.targetPrice}`
          });
        }

        // In-app alert notification bubble
        setTriggeredAlertMessage(`🚨 NOTIFIKASI BURSA: Saham ${alert.ticker} telah berhasil mencapai target harga Rp ${alert.targetPrice.toLocaleString("id-ID")} Anda!`);
      }
    });
  }, [stocks, alerts]);

  // Handler for setting an alert
  const handleSaveAlert = () => {
    if (!activeAlertModalStock) return;
    const targetVal = Number(targetPriceInput);
    if (!targetVal || targetVal <= 0) return;

    const newAlert: PriceAlert = {
      ticker: activeAlertModalStock.ticker,
      targetPrice: targetVal,
      condition: alertCondition,
      triggered: false
    };

    setAlerts((prev) => [...prev, newAlert]);
    setActiveAlertModalStock(null);
  };

  const handleDeleteAlert = (index: number) => {
    setAlerts((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live filter computation - filter out any non-real anomaly stocks
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((s) => s.isReal)
      .filter((s) => {
        const matchesSearch = s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesSector = selectedSector === "Semua" || s.sector === selectedSector;
        
        // P/E validation
        let matchesPe = true;
        if (peFilter === "Murah") matchesPe = s.peRatio > 0 && s.peRatio < 10;
        else if (peFilter === "Wajar") matchesPe = s.peRatio >= 10 && s.peRatio <= 20;
        else if (peFilter === "Premium") matchesPe = s.peRatio > 20;
        else if (peFilter === "Negatif") matchesPe = s.peRatio < 0;

        // Dividend validation
        let matchesDiv = true;
        if (divFilter === "Tinggi") matchesDiv = s.dividendYield > 5;
        else if (divFilter === "Sedang") matchesDiv = s.dividendYield >= 1 && s.dividendYield <= 5;
        else if (divFilter === "Nol") matchesDiv = s.dividendYield === 0;

        // Cap scale validation (marketCap is in Billion IDR)
        let matchesCap = true;
        if (capFilter === "Mega") matchesCap = s.marketCap >= 500000; // >= 500 Trillion
        else if (capFilter === "Big") matchesCap = s.marketCap > 100000 && s.marketCap < 500000; // 100-500 Trillion
        else if (capFilter === "MidSmall") matchesCap = s.marketCap <= 100000; // <= 100 Trillion

        // PBV validation
        let matchesPbv = true;
        const pbvVal = s.pbv !== undefined ? s.pbv : 1.25;
        if (pbvFilter === "Murah") matchesPbv = pbvVal < 1.0;
        else if (pbvFilter === "Wajar") matchesPbv = pbvVal >= 1.0 && pbvVal <= 2.5;
        else if (pbvFilter === "Premium") matchesPbv = pbvVal > 2.5;

        // ROE validation
        let matchesRoe = true;
        const roeVal = s.roe !== undefined ? s.roe : 12.5;
        if (roeFilter === "Tinggi") matchesRoe = roeVal >= 15;
        else if (roeFilter === "Sedang") matchesRoe = roeVal > 0 && roeVal < 15;
        else if (roeFilter === "Negatif") matchesRoe = roeVal <= 0;

        // DER validation
        let matchesDer = true;
        const derVal = s.der !== undefined ? s.der : 45.0;
        if (derFilter === "Sehat") matchesDer = derVal < 100;
        else if (derFilter === "Tinggi") matchesDer = derVal >= 100;

        // Syariah validation
        let matchesSyariah = true;
        const isSyariahVal = s.isSyariah !== undefined ? s.isSyariah : true;
        if (syariahFilter === "Syariah") matchesSyariah = isSyariahVal === true;
        else if (syariahFilter === "Non-Syariah") matchesSyariah = isSyariahVal === false;

        // Volume Change validation
        let matchesVolume = true;
        const volChg = volumeChangeMap[s.ticker] || 0;
        if (volumeFilter === "Positif") matchesVolume = volChg > 0;
        else if (volumeFilter === "Tinggi") matchesVolume = volChg >= 15;
        else if (volumeFilter === "Negatif") matchesVolume = volChg < 0;

        // Price validation
        let matchesPrice = true;
        if (priceFilter === "under500") matchesPrice = s.currentPrice < 500;
        else if (priceFilter === "500-2000") matchesPrice = s.currentPrice >= 500 && s.currentPrice <= 2000;
        else if (priceFilter === "2000-5000") matchesPrice = s.currentPrice > 2000 && s.currentPrice <= 5000;
        else if (priceFilter === "above5005") matchesPrice = s.currentPrice > 5000;

        return matchesSearch && matchesSector && matchesPe && matchesDiv && matchesCap && matchesPbv && matchesRoe && matchesDer && matchesSyariah && matchesVolume && matchesPrice;
      })
      .sort((a, b) => {
        let valA = sortField === 'volumeChangePercent' ? (volumeChangeMap[a.ticker] || 0) : a[sortField];
        let valB = sortField === 'volumeChangePercent' ? (volumeChangeMap[b.ticker] || 0) : b[sortField];
        
        if (valA === undefined) valA = 0;
        if (valB === undefined) valB = 0;

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [stocks, searchQuery, selectedSector, peFilter, divFilter, capFilter, pbvFilter, roeFilter, derFilter, syariahFilter, volumeFilter, priceFilter, sortField, sortOrder, volumeChangeMap]);

  const sectors = useMemo(() => {
    const list = new Set(stocks.filter(s => s.isReal).map(s => s.sector));
    return ["Semua", ...Array.from(list)];
  }, [stocks]);

  // Consolidate all filtering, sorting, and pagination parameters to trigger remount animation
  const filterStateKey = useMemo(() => {
    return `${searchQuery}-${selectedSector}-${peFilter}-${divFilter}-${capFilter}-${pbvFilter}-${roeFilter}-${derFilter}-${syariahFilter}-${volumeFilter}-${priceFilter}-${sortField}-${sortOrder}-${currentPage}-${screenerMode}`;
  }, [
    searchQuery, selectedSector, peFilter, divFilter, capFilter, pbvFilter,
    roeFilter, derFilter, syariahFilter, volumeFilter, priceFilter, sortField,
    sortOrder, currentPage, screenerMode
  ]);

  // Paginated chunk of filtered stocks
  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStocks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStocks, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStocks.length / itemsPerPage));
  }, [filteredStocks, itemsPerPage]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* 🔮 ALERTS BUBBLE NOTIFICATION */}
      {triggeredAlertMessage && (
        <div id="alert-notification-bubble" className="bg-emerald-950/80 border-2 border-emerald-500/30 p-4 rounded-xl text-emerald-300 text-xs flex justify-between items-center shadow-2xl animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔔</span>
            <span className="font-bold">{triggeredAlertMessage}</span>
          </div>
          <button 
            onClick={() => setTriggeredAlertMessage(null)}
            className="text-[10px] bg-emerald-900/60 border border-emerald-500/20 px-2 py-1 rounded text-emerald-200 hover:text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 🔔 ACTIVE ALERTS MANAGEMENT DOCK */}
      {alerts.length > 0 && (
        <div className="bg-[#05090f] border border-slate-900 rounded-xl p-3.5 space-y-2.5">
          <div className="flex justify-between items-center pb-1 border-b border-slate-900/40">
            <h4 className="text-[11px] font-black tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-450 animate-pulse" />
              Layanan Alarm Monitor Harga Aktif ({alerts.filter(a => !a.triggered).length})
            </h4>
            <span className="text-[9px] text-[#4b5563] font-mono font-bold leading-none uppercase">Saved LocalStorage</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${
                  alert.triggered 
                    ? "bg-emerald-950/25 border-emerald-500/10 text-emerald-400 font-bold"
                    : "bg-slate-900 border-slate-850 text-slate-350"
                }`}
              >
                <span className="font-extrabold">{alert.ticker}</span>
                <span className="font-mono">{alert.condition === "above" ? "≥" : "≤"} Rp {alert.targetPrice.toLocaleString("id-ID")}</span>
                {alert.triggered ? (
                  <span className="text-[8px] bg-emerald-500/15 text-emerald-300 px-1 rounded uppercase font-bold leading-none">Hit</span>
                ) : (
                  <button 
                    onClick={() => handleDeleteAlert(idx)}
                    className="text-rose-400 hover:text-rose-350 transition-colors p-0.5 cursor-pointer active:scale-90"
                    title="Batal monitor"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔔 MODAL ATUR ALARM TARGET HARGA */}
      {activeAlertModalStock && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border-2 border-cyan-500/20 max-w-sm w-full rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-display uppercase tracking-wider text-cyan-400">
                <BellRing className="w-4 h-4 text-cyan-400" /> Atur Alarm Monitor Harga
              </h3>
              <button 
                onClick={() => setActiveAlertModalStock(null)} 
                className="text-slate-400 hover:text-white font-black text-xs leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 leading-normal">
                Sistem akan memancarkan Notifikasi Desktop dan Bunyi apabila harga saham <strong className="text-white font-mono">{activeAlertModalStock.ticker}</strong> menyentuh target Anda.
              </p>
              <div className="bg-[#091524] p-2.5 rounded-xl border border-cyan-500/15 mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[8.5px] text-slate-450 block uppercase tracking-wide">Harga Saat Ini</span>
                  <strong className="text-white font-mono text-sm">Rp {activeAlertModalStock.currentPrice.toLocaleString("id-ID")}</strong>
                </div>
                <div>
                  <span className="text-[8.5px] text-slate-450 block uppercase tracking-wide">Perubahan Hari Ini</span>
                  <span className={`font-mono text-[11px] font-bold ${activeAlertModalStock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {activeAlertModalStock.changePercent >= 0 ? "+" : ""}{activeAlertModalStock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Kondisi Pemicu</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAlertCondition("above")}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      alertCondition === "above"
                        ? "bg-[#0b1d31] border-cyan-500 text-cyan-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    Harga &ge; (Naik Ke)
                  </button>
                  <button
                    onClick={() => setAlertCondition("below")}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      alertCondition === "below"
                        ? "bg-[#0b1d31] border-cyan-500 text-cyan-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    Harga &le; (Turun Ke)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Target Harga (Rupiah)</label>
                <input
                  type="number"
                  value={targetPriceInput}
                  onChange={(e) => setTargetPriceInput(Number(e.target.value))}
                  placeholder="Contoh: 8500"
                  className="w-full bg-[#060c18] border border-slate-850 rounded-lg p-2.5 font-mono font-bold text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setActiveAlertModalStock(null)}
                className="py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAlert}
                className="py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase shadow-lg transition-all cursor-pointer"
              >
                Simpan Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-white">Screener &amp; Crossing Board</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
            <p>Saring efek berdasarkan rasio fundamental reguler atau lacak transaksi jumbo pasar negosiasi secara seketika.</p>
            <span className="text-[10px] bg-slate-900 text-[#22c55e] border border-slate-800 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
              Terakhir Diperbarui: {getFormattedShortDateIndo()}
            </span>
          </div>
        </div>
        {screenerMode === "regular" && (
          <button
            id="reset-screener-filters"
            onClick={handleResetFilters}
            className="text-xs px-3.5 py-2 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
          >
            Bersihkan Filter
          </button>
        )}
      </div>

      {/* 🤝 Mode Switcher Tab Bar */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 max-w-md select-none">
        <button
          onClick={() => setScreenerMode("regular")}
          className={`flex-1 py-1 px-3 text-[11px] font-black tracking-wider rounded-lg transition-all cursor-pointer text-center outline-none ${
            screenerMode === "regular" 
              ? "bg-[#0b293c] text-cyan-300 border border-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.05)] font-extrabold" 
              : "text-slate-450 hover:text-white"
          }`}
        >
          🔍 SCANNER SAHAM REGULER
        </button>
        <button
          onClick={() => setScreenerMode("nego")}
          className={`flex-1 py-1 px-3 text-[11px] font-black tracking-wider rounded-lg transition-all cursor-pointer text-center outline-none ${
            screenerMode === "nego" 
              ? "bg-[#0b293c] text-cyan-300 border border-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.05)] font-extrabold" 
              : "text-slate-450 hover:text-white"
          }`}
        >
          🤝 SCRINING PASAR NEGO (CROSSING)
        </button>
      </div>

      {screenerMode === "regular" ? (
        <>
          {/* 🛠️ Multi-Criteria Filters Container */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/10">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" /> Filter Parameter Efek Indonesia
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Search text query */}
          <div className="lg:col-span-1">
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Pencarian Emiten</label>
            <div className="relative">
              <Search className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="screener-search-input"
                type="text"
                placeholder="Cari BBRI, GOTO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Valuasi PE Ratio drops */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Valuasi (P/E Ratio)</label>
            <select
              id="screener-pe-select"
              value={peFilter}
              onChange={(e) => setPeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Semua">Semua Valuasi</option>
              <option value="Murah">Undervalued / Murah (&lt; 10x)</option>
              <option value="Wajar">Menengah / Wajar (10x - 20x)</option>
              <option value="Premium">Premium / Mahal (&gt; 20x)</option>
              <option value="Negatif">Negatif / Merugi</option>
            </select>
          </div>

          {/* Div yield selector */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Dividen (Yield %)</label>
            <select
              id="screener-div-select"
              value={divFilter}
              onChange={(e) => setDivFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Semua">Semua Yield</option>
              <option value="Tinggi">Yield Tinggi (&gt; 5%)</option>
              <option value="Sedang">Yield Menengah (1% - 5%)</option>
              <option value="Nol">Tanpa Dividen (0%)</option>
            </select>
          </div>

          {/* Market Cap bounds */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Kapitalisasi Pasar</label>
            <select
              id="screener-cap-select"
              value={capFilter}
              onChange={(e) => setCapFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Semua">Semua Ukuran Cap</option>
              <option value="Mega">Mega Cap (&gt; Rp 500 T)</option>
              <option value="Big">Big Cap (Rp 100 T - Rp 500 T)</option>
              <option value="MidSmall">Mid &amp; Small Cap (&lt; Rp 100 T)</option>
            </select>
          </div>

          {/* Rentang Harga Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Rentang Harga</label>
            <select
              id="screener-price-select"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="Semua">Semua Harga</option>
              <option value="under500">Di Bawah Rp 500 (Penny Stock)</option>
              <option value="500-2000">Rp 500 - Rp 2.000</option>
              <option value="2000-5000">Rp 2.000 - Rp 5.000</option>
              <option value="above5005">Di Atas Rp 5.000 (Premium)</option>
            </select>
          </div>

        </div>

        {/* Divider and Subtitle for advanced filters */}
        <div className="border-t border-slate-850/60 my-4 pt-4 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
            Penyaringan Screener Lanjutan (Advanced Filters)
          </span>
          <button 
            onClick={handleResetFilters}
            className="text-[9.5px] text-slate-500 hover:text-amber-400 font-black transition-all flex items-center gap-1 cursor-pointer"
          >
            🧹 Reset Semua Parameter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PBV Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Rasio Harga/Nilai Buku (PBV)</label>
            <select
              value={pbvFilter}
              onChange={(e) => setPbvFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              <option value="Semua">Semua Nilai PBV</option>
              <option value="Murah">Di Bawah Nilai Buku / Diskon (&lt; 1.0x)</option>
              <option value="Wajar">Rasio Wajar Pendanaan (1.0x - 2.5x)</option>
              <option value="Premium">Rasio Tumbuh / Premium (&gt; 2.5x)</option>
            </select>
          </div>

          {/* ROE Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Tingkat Pengembalian Modal (ROE %)</label>
            <select
              value={roeFilter}
              onChange={(e) => setRoeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              <option value="Semua">Semua Persentase ROE</option>
              <option value="Tinggi">Sangat Baik / Produktif (&ge; 15%)</option>
              <option value="Sedang">Moderat Bertumbuh (0% - 15%)</option>
              <option value="Negatif">Negatif (Posisi Merugi)</option>
            </select>
          </div>

          {/* DER Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Rasio Leverage Utang (DER %)</label>
            <select
              value={derFilter}
              onChange={(e) => setDerFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              <option value="Semua">Semua Likuiditas Utang</option>
              <option value="Sehat">Utang Sangat Sehat / Aman (&lt; 100%)</option>
              <option value="Tinggi">Leverage Utang Tinggi (&ge; 100%)</option>
            </select>
          </div>

          {/* Syariah Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Index Saham Syariah (ISSI)</label>
            <select
              value={syariahFilter}
              onChange={(e) => setSyariahFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              <option value="Semua">Semua Klasifikasi</option>
              <option value="Syariah">🕌 Terdaftar Syariah ISSI</option>
              <option value="Non-Syariah">💼 Non-Syariah / Konvensional</option>
            </select>
          </div>
        </div>

      </div>

      {/* 📊 Screener Results Area */}
      <div className="glass-card rounded-2xl border border-slate-805 overflow-hidden">
        
        {/* Subheader summary stats */}
        <div className="px-6 py-4 bg-slate-900/35 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2 text-xs">
          <span className="text-slate-300">
            Ditemukan <strong className="text-emerald-400 font-mono font-bold">{filteredStocks.length}</strong> Emiten | Menampilkan Halaman <strong className="text-blue-400 font-mono font-bold">{currentPage}</strong> dari <strong className="text-slate-400 font-mono font-bold">{totalPages}</strong>
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            Klik kolom untuk membalikkan urutan sortasi
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-slate-300 min-w-[950px]">
            <thead>
              <tr className="bg-slate-950/65 text-slate-400 border-b border-slate-800 uppercase text-[10px] select-none">
                {/* 1. Emiten code */}
                <th className="py-3.5 px-6 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('ticker')}>
                  <span className="flex items-center gap-1.5">Emiten <ArrowUpDown className="w-3 h-3 text-slate-500" /></span>
                </th>
                {/* 2. Last price */}
                <th className="py-3.5 px-4 font-bold cursor-pointer hover:text-white text-right" onClick={() => handleSort('currentPrice')}>
                  <span className="flex items-center justify-end gap-1.5">Harga Terakhir <ArrowUpDown className="w-3 h-3 text-slate-500" /></span>
                </th>
                {/* 3. Daily shift % */}
                <th className="py-3.5 px-4 font-bold cursor-pointer hover:text-white text-right" onClick={() => handleSort('changePercent')}>
                  <span className="flex items-center justify-end gap-1.5">Perubahan% <ArrowUpDown className="w-3 h-3 text-slate-500" /></span>
                </th>
                {/* 3b. Yesterday close VS today price movement indicator arrow */}
                <th className="py-3.5 px-3 font-bold text-center">Arah Harian</th>
                {/* 3c. Yesterday close VS today price movement difference with simple green/red arrow */}
                <th className="py-3.5 px-3 font-bold text-center">Pergerakan Harian</th>
                {/* 4. Perubahan Volume % with dropdown filter */}
                <th className="py-3.5 px-4 font-bold text-right" onClick={() => handleSort('volumeChangePercent')}>
                  <div className="flex flex-col items-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5 cursor-pointer hover:text-white" onClick={() => handleSort('volumeChangePercent')}>
                      <span>∆ Vol %</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                    <select
                      id="header-volume-change-filter"
                      value={volumeFilter}
                      onChange={(e) => setVolumeFilter(e.target.value)}
                      className="mt-1 bg-[#091524] border border-cyan-900/40 text-[9px] text-cyan-300 rounded font-black px-1.5 py-0.5 outline-none focus:border-cyan-500 cursor-pointer max-w-[90px]"
                    >
                      <option value="Semua">Semua</option>
                      <option value="Positif">Positif (&gt;0%)</option>
                      <option value="Tinggi">Tinggi (&ge;15%)</option>
                      <option value="Negatif">Negatif (&lt;0%)</option>
                    </select>
                  </div>
                </th>
                {/* 5. 5-day Sparkline Trend representation */}
                <th className="py-3.5 px-4 font-bold text-center">Trend 5-Hari</th>
                {/* 6. P/E ratio */}
                <th className="py-3.5 px-4 font-bold cursor-pointer hover:text-white text-right" onClick={() => handleSort('peRatio')}>
                  <span className="flex items-center justify-end gap-1.5">P/E Ratio <ArrowUpDown className="w-3 h-3 text-slate-500" /></span>
                </th>
                {/* 7. Dividend yield */}
                <th className="py-3.5 px-4 font-bold cursor-pointer hover:text-white text-right" onClick={() => handleSort('dividendYield')}>
                  <span className="flex items-center justify-end gap-1.5">Div. Yield% <ArrowUpDown className="w-3 h-3 text-slate-500" /></span>
                </th>
                {/* 8. Market capitalization with dropdown filter */}
                <th className="py-3.5 px-4 font-bold text-right" onClick={() => handleSort('marketCap')}>
                  <div className="flex flex-col items-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5 cursor-pointer hover:text-white" onClick={() => handleSort('marketCap')}>
                      <span>Cap Size</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                    <select
                      id="header-market-cap-filter"
                      value={capFilter}
                      onChange={(e) => setCapFilter(e.target.value)}
                      className="mt-1 bg-[#091524] border border-cyan-900/40 text-[9px] text-cyan-300 rounded font-black px-1.5 py-0.5 outline-none focus:border-cyan-500 cursor-pointer max-w-[90px]"
                    >
                      <option value="Semua">Semua</option>
                      <option value="Mega">Mega Cap</option>
                      <option value="Big">Big Cap</option>
                      <option value="MidSmall">Mid/Small</option>
                    </select>
                  </div>
                </th>
                {/* 9. Sector with dropdown filter */}
                <th className="py-3.5 px-4 font-bold text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400">Sektor</span>
                    <select
                      id="header-sector-filter"
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="mt-1 bg-[#091524] border border-cyan-900/40 text-[9px] text-cyan-300 rounded font-black px-1.5 py-0.5 outline-none focus:border-cyan-500 cursor-pointer max-w-[100px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="Semua">Semua</option>
                      {sectors.filter(s => s !== "Semua").map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </th>
                {/* 10. AI intelligent actions and Alerts triggers */}
                <th className="py-3.5 px-6 font-bold text-center">Aksi / Alerts</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStocks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    Tidak ada emiten IDX yang cocok dengan kombinasi filter Anda saat ini.
                  </td>
                </tr>
              ) : (
                paginatedStocks.map((stock) => {
                  const itemCapPct = stock.marketCap >= 500000 
                    ? "Mega Cap" 
                    : stock.marketCap > 100000 
                      ? "Big Cap" 
                      : "Mid & Small";
                  
                  const volGrowth = volumeChangeMap[stock.ticker] || 0;
                  const isVolPositive = volGrowth > 0;

                  const diffVal = stock.currentPrice - stock.previousPrice;
                  const isPriceUp = diffVal > 0;
                  const isPriceDown = diffVal < 0;

                  return (
                    <tr 
                      key={`${stock.ticker}-${filterStateKey}`} 
                      onClick={() => onSelectStock?.(stock.ticker)}
                      className="group border-b border-slate-900/40 hover:bg-gradient-to-r hover:from-cyan-950/40 hover:via-slate-950/90 hover:to-[#081829]/65 transition-all duration-300 ease-out text-xs cursor-pointer active:scale-[0.998] hover:shadow-xl hover:shadow-[#0c233c]/20 animate-fadeIn"
                    >
                      {/* 1. Ticker & Logo */}
                      <td className="py-4 px-6 font-display font-medium">
                        <div className="flex items-center space-x-3 group-hover:translate-x-1.5 transition-transform duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatchlist?.(stock.ticker);
                            }}
                            className="p-1 rounded hover:bg-slate-850 text-slate-500 hover:text-amber-400 transition-all cursor-pointer active:scale-90 shrink-0 animation-all duration-200"
                            title={watchlist?.includes(stock.ticker) ? "Hapus dari Watchlist" : "Simpan ke Watchlist"}
                          >
                            <Star className={`w-3.5 h-3.5 ${watchlist?.includes(stock.ticker) ? "text-amber-400 fill-amber-400" : ""}`} />
                          </button>
                          
                          {renderStockLogo(stock.ticker)}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-black text-xs leading-none group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.35)] transition-all duration-300">{stock.ticker}</span>
                              <span className="text-[8px] bg-slate-900 border border-slate-850 px-1 py-0.5 rounded text-slate-400 font-mono font-bold leading-none uppercase group-hover:border-cyan-950 group-hover:text-cyan-300 transition-colors duration-300">{stock.sector}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 truncate max-w-[130px] block mt-1.5 group-hover:text-slate-200 transition-colors duration-300">{stock.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Last price */}
                      <td className="py-4 px-4 text-right">
                        <PriceFlashCell price={stock.currentPrice} formatIDR={formatIDR} />
                      </td>

                      {/* 3. Percentage Shift */}
                      <td className={`py-4 px-4 text-right font-mono font-bold ${
                        stock.changePercent > 0 
                          ? "text-emerald-400" 
                          : stock.changePercent < 0 
                            ? "text-rose-400" 
                            : "text-slate-400"
                      }`}>
                        {stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                      </td>

                      {/* 3b. Yesterday close VS today price movement indicator arrow (Sinyal Arah Harian) */}
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center">
                          {stock.changePercent > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-black text-[9px] border border-emerald-500/15 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all duration-300 animate-pulse">
                              <span>▲</span>
                              <span>NAIK</span>
                            </span>
                          ) : stock.changePercent < 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-450 text-rose-400 font-black text-[9px] border border-rose-500/15 group-hover:bg-rose-500/20 group-hover:border-rose-500/30 transition-all duration-300">
                              <span>▼</span>
                              <span>TURUN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-500 font-black text-[9px] border border-slate-800 transition-all duration-300">
                              <span>■</span>
                              <span>STAGNAN</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3c. Yesterday close VS today price movement difference indicator with direct green/red animations */}
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center">
                          {isPriceUp ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 text-[10.5px] font-bold font-mono border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-300">
                              <span className="text-emerald-400 text-xs animate-bounce font-black">▲</span>
                              <span className="text-[10px] text-emerald-400">+{diffVal.toLocaleString("id-ID")}</span>
                            </span>
                          ) : isPriceDown ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/70 text-rose-400 text-[10.5px] font-bold font-mono border border-rose-500/20 group-hover:border-rose-500/40 transition-all duration-300">
                              <span className="text-rose-400 text-xs font-black">▼</span>
                              <span className="text-[10px] text-rose-400">{diffVal.toLocaleString("id-ID")}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 text-slate-400 text-[10.5px] font-semibold font-mono border border-slate-800 transition-all duration-300">
                              <span className="text-slate-500 text-[10px]">■</span>
                              <span className="text-[10px] text-slate-400">0</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. ∆ Vol % Column */}
                      <td className={`py-4 px-4 text-right font-mono font-bold ${
                        isVolPositive ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {isVolPositive ? "▲ +" : "▼ "}{volGrowth.toFixed(1)}%
                      </td>

                      {/* 5. Sparkline 5-day Trend */}
                      <td className="py-4 px-2 text-center select-none w-20">
                        <div className="w-16 h-7 mx-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stock.history ? stock.history.slice(-5).map((price, idx) => ({ id: idx, price })) : []}>
                              <Line 
                                type="monotone" 
                                dataKey="price" 
                                stroke={stock.changePercent >= 0 ? "#10b981" : "#ef4444"} 
                                strokeWidth={1.5} 
                                dot={false} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </td>

                      {/* 6. P/E Ratio */}
                      <td className={`py-4 px-4 text-right font-mono font-semibold ${
                        stock.peRatio < 0 
                          ? "text-rose-400" 
                          : stock.peRatio < 10 
                            ? "text-emerald-400" 
                            : "text-slate-300"
                      }`}>
                        {stock.peRatio.toFixed(1)}x
                      </td>

                      {/* 7. Div yield */}
                      <td className="py-4 px-4 text-right font-mono text-slate-300 font-semibold">
                        {stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(1)}%` : "-"}
                      </td>

                      {/* 8. Market Cap size */}
                      <td className="py-4 px-4 text-right font-mono text-slate-350">
                        <span className="text-slate-300 font-bold">{(stock.marketCap / 1000).toFixed(1)} T</span>
                        <div className="text-[10px] text-cyan-400 font-medium block whitespace-nowrap mt-0.5">
                          Rp {stock.marketCap.toLocaleString("id-ID")} Milyar
                        </div>
                        <span className="text-[9px] text-slate-500 block mt-0.5">{itemCapPct}</span>
                      </td>

                      {/* 9. Sektor text */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-0.8 text-[10px] bg-slate-900 border border-slate-800 text-slate-400 rounded">
                          {stock.sector}
                        </span>
                      </td>

                      {/* 10. Actions / Interactive Alerts triggers */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`screener-analyze-${stock.ticker}`}
                            className="px-2.5 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded border border-blue-500/20 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            onClick={() => onNavigateToTracer(stock.ticker)}
                            title="Analisis detail AI"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>AI Tracer</span>
                          </button>

                          {/* 🔔 Brand alert set alarm trigger */}
                          <button
                            id={`screener-alert-${stock.ticker}`}
                            onClick={() => {
                              setActiveAlertModalStock(stock);
                              setTargetPriceInput(stock.currentPrice);
                              setAlertCondition(stock.changePercent >= 0 ? "above" : "below");
                            }}
                            className={`p-1.5 rounded border transition-all cursor-pointer ${
                              alerts.some(a => a.ticker === stock.ticker && !a.triggered)
                                ? "bg-red-950/40 text-red-000 border-red-500/35 text-red-400"
                                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-cyan-400 hover:border-cyan-500/30"
                            }`}
                            title="Atur target harga & alarm notifikasi"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 📚 Pagination Controls Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs">
            <span className="text-slate-400">
              Menampilkan index {Math.min(filteredStocks.length, (currentPage - 1) * itemsPerPage + 1)} - 
              {Math.min(filteredStocks.length, currentPage * itemsPerPage)} dari {filteredStocks.length} total efek
            </span>
            <div className="flex items-center gap-1">
              <button
                id="screener-prev-page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 text-slate-300 rounded font-semibold transition-colors disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1 font-mono text-[11px] font-bold px-3 py-1 bg-slate-950 border border-slate-850 rounded">
                <span className="text-blue-400">{currentPage}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{totalPages}</span>
              </div>

              <button
                id="screener-next-page"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 text-slate-300 rounded font-semibold transition-colors disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}

      </div>
      </>
      ) : (
        /* 🤝 SCRINING PASAR NEGO (CROSSING BLOCK TRADES) */
        <div className="glass-card rounded-2xl border border-slate-850 overflow-hidden">
          <div className="px-6 py-4 bg-[#010a12]/70 border-b border-slate-900 flex justify-between items-center flex-wrap gap-2 text-xs select-none">
            <span className="text-slate-300">
              Menampilkan <strong className="text-cyan-400 font-mono font-bold">{negoItems.length}</strong> Crossing Jumbo Terdeteksi | Papan Antrean Negosiasi Real-time IDX
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-black">
              💡 KLIK BARIS TRANSAKSI UNTUK MASUK ANALISIS DETIL EMITEN
            </span>
          </div>

          <div className="overflow-x-auto w-full select-none">
            <table className="w-full text-left text-xs text-slate-300 min-w-[850px]">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-900 uppercase text-[10px] font-mono tracking-widest select-none">
                  <th className="py-3.5 px-6 font-bold">Kode</th>
                  <th className="py-3.5 px-4 font-bold text-right font-sans lowercase first-letter:uppercase">Harga Nego [Reguler]</th>
                  <th className="py-3.5 px-4 font-bold text-right">Spread (%)</th>
                  <th className="py-3.5 px-4 font-bold text-right">Crossing Vol (Lot)</th>
                  <th className="py-3.5 px-4 font-bold text-right">Nilai Transaksi</th>
                  <th className="py-3.5 px-4 font-bold text-center">Buyer → Seller</th>
                  <th className="py-3.5 px-4 font-bold text-center">Sifat Cross</th>
                  <th className="py-3.5 px-6 font-bold text-center">Aksi Pintar AI</th>
                </tr>
              </thead>
              <tbody>
                {negoItems.map((item, index) => {
                  const absoluteSpread = Math.abs(item.spreadPct);
                  const isDiscount = item.spreadPct < 0;
                  return (
                    <tr
                      key={`${item.ticker}-${index}-${filterStateKey}`}
                      onClick={() => onSelectStock?.(item.ticker)}
                      className="border-b border-slate-905 border-slate-900/40 hover:bg-[#061824]/40 hover:-translate-x-0.5 transition-all text-xs cursor-pointer lg:hover:pl-1 animate-fadeIn"
                    >
                      {/* Ticker & Name */}
                      <td className="py-4 px-6 font-display font-medium">
                        <div>
                          <span className="text-white font-black block text-[13px] tracking-wide leading-none">{item.ticker}</span>
                          <span className="text-[9.5px] text-slate-500 truncate max-w-[140px] block mt-1">{item.name}</span>
                        </div>
                      </td>

                      {/* Harga Nego [Reguler] */}
                      <td className="py-4 px-4 text-right font-mono font-bold">
                        <span className="text-white">Rp {item.negoPrice.toLocaleString("id-ID")}</span>
                        <span className="text-[9.5px] text-slate-500 block font-normal mt-0.5">Reg: Rp {item.currentPrice.toLocaleString("id-ID")}</span>
                      </td>

                      {/* Spread Pct */}
                      <td className={`py-4 px-4 text-right font-mono font-bold ${isDiscount ? "text-emerald-400" : "text-amber-500"}`}>
                        <span className="text-[11.5px]">{isDiscount ? "-" : "+"}{absoluteSpread.toFixed(2)}%</span>
                        <span className="text-[9px] text-slate-500 block font-normal mt-0.5">{isDiscount ? "Bawah Rata-Rata" : "Premium Deal"}</span>
                      </td>

                      {/* Volume block Lot */}
                      <td className="py-4 px-4 text-right font-mono font-semibold text-slate-200">
                        <span>{item.lotNego.toLocaleString("id-ID")}</span>
                        <span className="text-[9px] text-slate-500 block font-normal mt-0.5 font-sans">Lot Crossing</span>
                      </td>

                      {/* Nilai Transaksi */}
                      <td className="py-4 px-4 text-right font-mono font-black text-white">
                        <span>Rp {(item.totalValue / 1000000000).toFixed(2)} M</span>
                        <span className="text-[9.5px] text-slate-500 block font-normal mt-0.5 font-sans">Net Settlement</span>
                      </td>

                      {/* Buyers and Sellers brokers */}
                      <td className="py-4 px-4 text-center font-mono">
                        <div className="flex items-center justify-center gap-1 text-[10.5px]">
                          <span className="bg-emerald-950/60 border border-emerald-900/30 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded text-center min-w-[28px]">{item.buyer}</span>
                          <span className="text-slate-500 font-sans text-[9px] font-bold">TO</span>
                          <span className="bg-rose-950/60 border border-rose-900/30 text-rose-400 font-extrabold px-1.5 py-0.5 rounded text-center min-w-[28px]">{item.seller}</span>
                        </div>
                      </td>

                      {/* Sifat Cross */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded font-mono border ${
                          isDiscount 
                            ? "bg-emerald-950/20 border-emerald-800/20 text-emerald-400" 
                            : item.spreadPct > 3 
                              ? "bg-amber-950/20 border-amber-800/20 text-amber-500"
                              : "bg-cyan-950/20 border-cyan-800/20 text-cyan-400"
                        }`}>
                          {item.transactionType}
                        </span>
                      </td>

                      {/* AIS Consult */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToTracer(item.ticker);
                          }}
                          className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded border border-blue-500/20 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>AI Tracer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
