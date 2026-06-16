/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Stock, UserSession } from "../types";
import { 
  User, Award, Mail, Shield, Calendar, Landmark, CreditCard, 
  TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Settings, CheckCircle2, Phone
} from "lucide-react";

interface ProfileViewProps {
  session: UserSession;
  stocks: Stock[];
  walletBalance: number;
  portfolio: Record<string, { ticker: string; shares: number; avgBuyPrice: number }>;
  onSelectStock?: (ticker: string) => void;
  onNavigateToTab?: (tab: "dashboard" | "screener" | "watchlist" | "comparison") => void;
}

export default function ProfileView({ 
  session, 
  stocks, 
  walletBalance, 
  portfolio,
  onSelectStock,
  onNavigateToTab
}: ProfileViewProps) {

  // Calculate portfolio values dynamically
  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const items = Object.entries(portfolio).map(([ticker, holding]) => {
      const stock = stocks.find(s => s.ticker.toUpperCase() === ticker.toUpperCase());
      const currentPrice = stock ? stock.currentPrice : holding.avgBuyPrice;
      const investment = holding.shares * holding.avgBuyPrice;
      const currentValue = holding.shares * currentPrice;
      const profitLoss = currentValue - investment;
      const profitLossPercent = investment > 0 ? (profitLoss / investment) * 100 : 0;

      totalInvested += investment;
      totalCurrentValue += currentValue;

      return {
        ticker,
        name: stock ? stock.name : "Emiten Saham",
        shares: holding.shares,
        avgBuyPrice: holding.avgBuyPrice,
        currentPrice,
        investment,
        currentValue,
        profitLoss,
        profitLossPercent
      };
    });

    const totalEquity = walletBalance + totalCurrentValue;
    const totalReturn = totalEquity - 100000000; // Rp 100 Million starting capital
    const totalReturnPercent = (totalReturn / 100000000) * 100;

    return {
      items,
      totalInvested,
      totalCurrentValue,
      totalEquity,
      totalReturn,
      totalReturnPercent
    };
  }, [portfolio, stocks, walletBalance]);

  return (
    <div className="space-y-6">
      {/* Immersive Header */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-gradient-to-r from-indigo-950/20 via-slate-900/10 to-transparent relative overflow-hidden select-none">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <User className="w-20 h-20 text-indigo-400" />
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest font-mono border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase">
            Sesi Akun Terverifikasi
          </span>
          <span className="text-[10px] bg-slate-950 px-2.5 py-0.5 rounded border border-indigo-950 font-mono text-indigo-400 font-bold">
            🔒 ANALYST ID: #{1000 + (session.name.charCodeAt(0) || 4)}
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white mt-2 font-display flex items-center gap-2">
          <User className="w-5.5 h-5.5 text-indigo-400" />
          Selamat Datang, {session.name}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Kendalikan analisis target saham bursa efek Indonesia (IDX), kelola preferensi charting premium Anda, dan pantau performa simulasi dana investasi secara langsung.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#01070d]/90 border border-slate-900 rounded-2xl p-5 space-y-5">
            <div className="text-center pb-4 border-b border-slate-900">
              <div className="w-20 h-20 bg-slate-900 border-2 border-indigo-500/30 rounded-full flex items-center justify-center font-black text-indigo-400 text-3xl mx-auto shadow-lg relative group">
                {session.name.charAt(0).toUpperCase()}
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-white uppercase mt-4 tracking-wider">{session.name}</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID Bursa: ID-PROTRADER</p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold leading-none">Email Terdaftar</span>
                  <span className="text-slate-205 text-white text-[11px] truncate block">{session.email || "analyst@sahamindo.com"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold leading-none">Tipe Keanggotaan</span>
                  <span className="text-amber-400 text-[11px] font-extrabold flex items-center gap-1">
                    Analis Premium Pro
                    <Award className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold leading-none">Sesi Mulai Sejak</span>
                  <span className="text-white text-[11px] font-sans">1 Juni 2026</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold leading-none">Status Autentikasi</span>
                  <span className="text-emerald-400 text-[11px] font-sans flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Google OAuth Active
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#03131f] border border-cyan-500/20 p-3.5 rounded-xl space-y-2">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest font-mono block">Status Domain Singgah</span>
              <p className="text-[10px] text-slate-455 text-slate-400 leading-normal font-sans">
                Aplikasi ini terhubung aktif ke pemetaan domain kustom beralamat <strong className="text-white font-mono">SahamIndo.com</strong> aman terenkripsi (HTTPS).
              </p>
            </div>
          </div>
        </div>

        {/* Right Columns: Sandbox Financial Performance details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#01070d]/90 border border-slate-900 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-500 font-mono text-[9.5px]">
                <span>SALDO DEPOSIT CASH</span>
                <Wallet className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[15px] font-bold text-white font-mono">
                Rp {walletBalance.toLocaleString("id-ID")}
              </p>
              <span className="text-[8px] text-slate-500 font-mono block leading-none">Tersedia untuk Swing Trading</span>
            </div>

            <div className="bg-[#01070d]/90 border border-slate-900 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-500 font-mono text-[9.5px]">
                <span>NILAI PORTOFOLIO SAHAM</span>
                <Landmark className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[15px] font-bold text-slate-100 font-mono">
                Rp {portfolioSummary.totalCurrentValue.toLocaleString("id-ID")}
              </p>
              <span className="text-[8px] text-slate-500 font-mono block leading-none">Estimasi Rata-rata Bursa</span>
            </div>

            <div className="bg-[#01070d]/90 border border-slate-900 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-500 font-mono text-[9.5px]">
                <span>TOTAL EKUITAS BERKALA</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[15px] font-bold text-emerald-400 font-mono">
                Rp {portfolioSummary.totalEquity.toLocaleString("id-ID")}
              </p>
              <span className={`text-[8.5px] font-bold font-mono flex items-center ${portfolioSummary.totalReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {portfolioSummary.totalReturn >= 0 ? "▲ +" : "▼ "}
                {portfolioSummary.totalReturnPercent.toFixed(2)}% dari modal awal
              </span>
            </div>
          </div>

          {/* Holdings List */}
          <div className="bg-[#01070d]/90 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  📁 Daftar Kepemilikan Saham Aktif (Sandbox Portofolio)
                </h3>
                <p className="text-[9.5px] text-slate-500 font-sans">Simulasi kepemilikan yang terhubung dengan live feed update tickers.</p>
              </div>
              <button
                onClick={() => onNavigateToTab?.("dashboard")}
                className="px-2.5 py-1 text-[9.5px] bg-slate-900 hover:bg-slate-850 hover:text-white rounded-lg border border-slate-800 text-slate-400 cursor-pointer font-bold font-mono uppercase"
              >
                + Beli Saham Lain
              </button>
            </div>

            {portfolioSummary.items.length > 0 ? (
              <div className="space-y-3">
                {portfolioSummary.items.map((item) => {
                  const isProfit = item.profitLoss >= 0;
                  return (
                    <div 
                      key={item.ticker}
                      className="bg-[#020b12] border border-slate-900 rounded-xl p-3.5 flex flex-col md:flex-row justify-between md:items-center gap-3.5 hover:border-slate-850 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center font-mono font-black text-white hover:text-cyan-400">
                          {item.ticker}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => {
                                if (onSelectStock) onSelectStock(item.ticker);
                              }}
                              className="text-xs font-black text-white cursor-pointer hover:underline hover:text-indigo-400"
                            >
                              {item.ticker} • {item.name}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {item.shares} Lembar
                            </span>
                          </div>
                          <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                            Beli: Rp {item.avgBuyPrice.toLocaleString()} • Sekarang: <span className="text-slate-200">Rp {item.currentPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-baseline md:items-end justify-between font-mono gap-0.5 select-none">
                        <span className="text-[9.5px] text-slate-500 md:hidden font-sans">Keuntungan Realtime:</span>
                        <div className="text-right">
                          <span className={`text-[11.5px] font-black ${isProfit ? "text-emerald-400" : "text-rose-450"}`}>
                            {isProfit ? "▲ +" : "▼ "}Rp {Math.abs(item.profitLoss).toLocaleString("id-ID")}
                          </span>
                          <span className={`text-[8.5px] block font-extrabold ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
                            ({isProfit ? "+" : ""}{item.profitLossPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center border border-dashed border-slate-900 rounded-xl">
                <p className="text-xs text-slate-500 italic">Portofolio kosong. Silakan kunjungi menu utama (Market) untuk mulai belajar membeli saham.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
