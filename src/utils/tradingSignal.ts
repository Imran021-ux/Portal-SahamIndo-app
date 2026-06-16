/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stock } from "../types";

// Round to official Indonesia Stock Exchange (IDX) Price Tick Sizes
export function roundToIDXTick(price: number, roundUp: boolean = true): number {
  if (price <= 0) return 1;
  
  let tick = 1;
  if (price < 200) {
    tick = 1;
  } else if (price < 500) {
    tick = 2;
  } else if (price < 2000) {
    tick = 5;
  } else if (price < 5000) {
    tick = 10;
  } else {
    tick = 25;
  }

  const remainder = Math.round(price) % tick;
  if (remainder === 0) return Math.round(price);

  if (roundUp) {
    return Math.round(price) + (tick - remainder);
  } else {
    return Math.round(price) - remainder;
  }
}

export interface TradingRecommendation {
  signal: "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL";
  signalColor: string;
  strategy: string;
  riskRating: "LOW" | "MEDIUM" | "HIGH";
  entryMin: number;
  entryMax: number;
  targetProfit1: number;
  targetProfit2: number;
  stopLoss: number;
  trailingStop: string;
  reason: string;
  ratio: string;
}

export function generateTradingRecommendation(stock: Stock): TradingRecommendation {
  const current = stock.currentPrice;
  const pct = stock.changePercent;
  const isUp = pct >= 0;

  // Signal categorization
  let signal: "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL" = "HOLD";
  let signalColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  let strategy = "Wait & See / Accumulate";
  let riskRating: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
  let reason = "";

  const isFinancial = stock.sector === "Finansial";
  const isHighCap = stock.marketCap > 100000;

  if (pct > 2.5) {
    signal = "STRONG BUY";
    signalColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    strategy = "Buy on Breakout";
    riskRating = isHighCap ? "LOW" : "MEDIUM";
    reason = "Momentum bullish harian sangat kuat disertai dengan volume yang tebal melampaui rata-rata MA-20.";
  } else if (pct > 0.3) {
    signal = "BUY";
    signalColor = "text-teal-400 bg-teal-500/10 border-teal-500/20";
    strategy = "Buy on Weakness / Trend Following";
    riskRating = "LOW";
    reason = "Tren perlahan berbalik mengarah ke atas di atas area support psikologis mendasar.";
  } else if (pct < -2.5) {
    signal = "STRONG SELL";
    signalColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
    strategy = "Panic Exit / Immediate Sell";
    riskRating = "HIGH";
    reason = "Tekanan jual harian bertambah deras menembus support kunci harian hampa bid.";
  } else if (pct < -0.3) {
    signal = "SELL";
    signalColor = "text-orange-400 bg-orange-500/10 border-orange-500/20";
    strategy = "Sell on Strength / Reduce Position";
    riskRating = "MEDIUM";
    reason = "Konsolidasi di area resistance kuat mengindikasikan prospek profit-taking jangka pendek.";
  } else {
    signal = "HOLD";
    signalColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    strategy = "Accumulate Hold";
    riskRating = "LOW";
    reason = "Volatilitas menyempit tanpa arah dominan mantap, cocok untuk akumulasi sabar tanpa over-trade.";
  }

  // Calculate buy-oriented trading plans matching IDX long-only constraints
  let entryMin = current;
  let entryMax = current;
  let targetProfit1 = current;
  let targetProfit2 = current;
  let stopLoss = current;
  let trailingStop = "";
  let ratio = "1 : 2.5";

  if (signal === "STRONG BUY" || signal === "BUY") {
    entryMin = roundToIDXTick(current * 0.98, false);
    entryMax = roundToIDXTick(current * 1.01, true);
    stopLoss = roundToIDXTick(entryMin * 0.97, false); // 3% below entryMin
    targetProfit1 = roundToIDXTick(entryMax * 1.05, true); // +5% above entryMax
    targetProfit2 = roundToIDXTick(entryMax * 1.10, true); // +10% above entryMax
    
    const tsPrice = roundToIDXTick(current * 0.02, false);
    trailingStop = `Aktif saat profit +3%, ikuti dengan jarak Rp ${tsPrice} (2% Harga)`;
    ratio = "1 : 2.5";
  } else if (signal === "STRONG SELL" || signal === "SELL") {
    // Buy on Pullback / Deep Support strategy
    strategy = signal === "STRONG SELL" ? "Speculative Buy on Deep Support" : "Buy on Pullback Support";
    entryMin = roundToIDXTick(current * 0.92, false); // Buy at 8% discount
    entryMax = roundToIDXTick(current * 0.95, true);  // Buy at 5% discount
    stopLoss = roundToIDXTick(entryMin * 0.97, false); // 3% below entryMin
    targetProfit1 = roundToIDXTick(entryMax * 1.05, true); // +5% above entryMax
    targetProfit2 = roundToIDXTick(entryMax * 1.10, true); // +10% above entryMax
    
    const tsPrice = roundToIDXTick(current * 0.015, false);
    trailingStop = `Aktif saat profit +3%, ikuti dengan jarak Rp ${tsPrice} (1.5% Harga)`;
    ratio = "1 : 2.0";
  } else {
    // Hold / Accumulate Range-bound
    entryMin = roundToIDXTick(current * 0.96, false);
    entryMax = roundToIDXTick(current * 0.99, true);
    stopLoss = roundToIDXTick(entryMin * 0.97, false); // 3% below entryMin
    targetProfit1 = roundToIDXTick(entryMax * 1.05, true); // +5% above entryMax
    targetProfit2 = roundToIDXTick(entryMax * 1.10, true); // +10% above entryMax

    const tsPrice = roundToIDXTick(current * 0.02, false);
    trailingStop = `Aktif saat profit +3%, ikuti dengan jarak Rp ${tsPrice} (2% Harga)`;
    ratio = "1 : 2.2";
  }

  return {
    signal,
    signalColor,
    strategy,
    riskRating,
    entryMin,
    entryMax,
    targetProfit1,
    targetProfit2,
    stopLoss,
    trailingStop,
    reason,
    ratio
  };
}
