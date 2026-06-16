/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { Gauge, Zap, TrendingUp, AlertTriangle, Award, Flame, Activity, Coins, Sparkles } from "lucide-react";

interface TradingViewGaugeProps {
  symbol: string;
}

export default function TradingViewGauge({ symbol }: TradingViewGaugeProps) {
  const [activeInterval, setActiveInterval] = useState<"1m" | "5m" | "15m" | "1H" | "1D" | "1W">("1D");
  const [tick, setTick] = useState(0);

  // Micro fluctuation for real-time feel
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const signalDetails = useMemo(() => {
    // Generate deterministic values based on symbol and active interval
    const hashStock = (ticker: string) => {
      return ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    };

    const h = hashStock(symbol);
    const intervalOffsets: Record<string, number> = {
      "1m": 3,
      "5m": -2,
      "15m": 7,
      "1H": 12,
      "1D": 17,
      "1W": 22
    };

    const offset = intervalOffsets[activeInterval] || 0;
    const baseValue = (h + offset) % 100; // Value between 0 and 100

    // Map 0-100 to: 0-15 (Strong Sell), 16-35 (Sell), 36-65 (Neutral), 66-85 (Buy), 86-100 (Strong Buy)
    let summaryText = "NETRAL";
    let colorClass = "text-yellow-400";
    let bgPulseColor = "bg-yellow-400";
    let gaugeAngle = 0; // mapped to -90 to 90 degrees
    let buyCount = 5;
    let sellCount = 5;
    let neutralCount = 6;

    if (baseValue <= 20) {
      summaryText = "SANGAT JUAL (STRONG SELL)";
      colorClass = "text-rose-500";
      bgPulseColor = "bg-rose-500";
      buyCount = 1 + (h % 3);
      sellCount = 13 + (h % 3);
      neutralCount = 2 + (h % 2);
    } else if (baseValue <= 40) {
      summaryText = "JUAL (SELL)";
      colorClass = "text-orange-400";
      bgPulseColor = "bg-orange-400";
      buyCount = 3 + (h % 3);
      sellCount = 9 + (h % 3);
      neutralCount = 4 + (h % 2);
    } else if (baseValue <= 60) {
      summaryText = "NETRAL (NEUTRAL)";
      colorClass = "text-slate-350";
      bgPulseColor = "bg-slate-400";
      buyCount = 5 + (h % 3);
      sellCount = 5 + (h % 2);
      neutralCount = 8 + (h % 3);
    } else if (baseValue <= 80) {
      summaryText = "BELI (BUY)";
      colorClass = "text-emerald-400";
      bgPulseColor = "bg-emerald-400";
      buyCount = 11 + (h % 3);
      sellCount = 2 + (h % 2);
      neutralCount = 3 + (h % 2);
    } else {
      summaryText = "SANGAT BELI (STRONG BUY)";
      colorClass = "text-cyan-400";
      bgPulseColor = "bg-cyan-400";
      buyCount = 15 + (h % 3);
      sellCount = 0 + (h % 2);
      neutralCount = 1 + (h % 2);
    }

    // Gauge needle angle from -90 to +90 degrees representing baseValue (0 to 100)
    // Add minor dynamic swing based on tick for true organic modern animation
    const swingFactor = Math.sin(tick * 0.8) * 1.5;
    gaugeAngle = -90 + (baseValue * 1.8) + swingFactor;

    // Technical indicator values
    const rsi = Math.round(20 + (baseValue * 0.6) + (h % 8));
    const stochK = Math.round(15 + (baseValue * 0.7) + (h % 5));
    const macd = (baseValue - 50) / 10 + (h % 4) * 0.2;
    const adx = Math.round(15 + (h % 30));
    const cci = Math.round((baseValue - 50) * 3);

    // Moving averages statuses
    const ema10 = baseValue > 45 ? "BUY" : "SELL";
    const ema30 = baseValue > 42 ? "BUY" : "SELL";
    const sma20 = baseValue > 50 ? "BUY" : "SELL";
    const sma50 = baseValue > 48 ? "BUY" : "SELL";

    const stochKStatus = stochK > 50 ? "BUY" : "SELL";
    const cciStatus = cci > 0 ? "BUY" : "SELL";
    const macdStatus = macd > 0 ? "BUY" : "SELL";
    const rsiStatus = rsi > 55 ? "BUY" : rsi < 45 ? "SELL" : "NEUTRAL";

    return {
      summaryText,
      colorClass,
      bgPulseColor,
      gaugeAngle,
      buyCount,
      sellCount,
      neutralCount,
      rsi,
      stochK,
      macd,
      adx,
      cci,
      ema10,
      ema30,
      sma20,
      sma50,
      stochKStatus,
      cciStatus,
      macdStatus,
      rsiStatus,
      totalIndicators: buyCount + sellCount + neutralCount
    };
  }, [symbol, activeInterval, tick]);

  return (
    <div className="w-full bg-[#020b12] rounded-2xl overflow-hidden border border-slate-850 p-5 space-y-4 shadow-xl select-none relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-950/40 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/25">
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white hover:text-cyan-300 font-mono tracking-wider">
              TEKNIKAL MODERN MULTI-OSILATOR
            </h4>
            <span className="text-[9px] text-slate-500 font-bold block leading-none font-mono mt-0.5">
              IDX:{symbol.toUpperCase()} • REAL-TIME METER
            </span>
          </div>
        </div>

        {/* Dynamic Interval tab buttons */}
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-900 select-none">
          {(["1m", "5m", "15m", "1H", "1D", "1W"] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setActiveInterval(interval)}
              className={`px-2 py-1 text-[9px] font-black tracking-tighter rounded-md transition-all cursor-pointer ${
                activeInterval === interval
                  ? "bg-[#0b293c] text-cyan-300 border border-cyan-500/10 font-bold"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Animated Speedometer / Gauge - Centered with stunning neon aura design */}
        <div className="md:col-span-4 flex flex-col items-center justify-center py-4 bg-[#010a12]/85 border border-cyan-500/15 rounded-xl relative overflow-hidden shadow-lg select-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full pointer-events-none" />
          
          <div className="relative w-40 h-22 overflow-hidden mb-1 flex items-end justify-center">
            {/* SVG Speedometer Semi-circle with glowing aura */}
            <svg className="w-40 h-40 absolute top-0" viewBox="0 0 100 100">
              {/* Strong Sell (Rose) */}
              <path
                d="M 12 50 A 38 38 0 0 1 25 22"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.3"
              />
              {/* Sell (Orange) */}
              <path
                d="M 27 20 A 38 38 0 0 1 43 13"
                fill="none"
                stroke="#fb923c"
                strokeWidth="5"
                opacity="0.3"
              />
              {/* Neutral (Slate) */}
              <path
                d="M 45 12 A 38 38 0 0 1 55 12"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="5"
                opacity="0.4"
              />
              {/* Buy (Emerald) */}
              <path
                d="M 57 13 A 38 38 0 0 1 73 20"
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                opacity="0.3"
              />
              {/* Strong Buy (Cyan) */}
              <path
                d="M 75 22 A 38 38 0 0 1 88 50"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* Needle Center Pivot */}
              <circle cx="50" cy="50" r="4" fill="#ffffff" />
              <circle cx="50" cy="50" r="1.5" fill="#020b12" />
            </svg>

            {/* Custom moving needle via standard CSS Transform */}
            <div 
              className="absolute w-0.5 h-16 bg-gradient-to-t from-white via-cyan-400 to-cyan-500 origin-[bottom_center] transition-transform duration-1000 ease-out"
              style={{ 
                transform: `rotate(${signalDetails.gaugeAngle}deg)`,
                bottom: "0px"
              }}
            >
              {/* Tip of Needle indicator */}
              <div className="w-2 h-2 bg-cyan-300 rounded-full -ml-0.75 -mt-0.75 shadow-lg border border-slate-950 animate-pulse"></div>
            </div>

            {/* Scale numbers */}
            <span className="text-[8px] font-black text-rose-500 absolute bottom-0.5 left-2 font-mono">SELL</span>
            <span className="text-[8px] font-black text-slate-400 absolute top-1.5 left-1/2 -ml-3.5 font-mono">NEUTRAL</span>
            <span className="text-[8px] font-black text-cyan-400 absolute bottom-0.5 right-2 font-mono">BUY</span>
          </div>

          <div className="text-center mt-2">
            <span className={`text-sm font-black tracking-widest block font-mono ${signalDetails.colorClass} drop-shadow-[0_0_8px_currentColor]`}>
              {signalDetails.summaryText}
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-900">
              <span className={`w-1.5 h-1.5 rounded-full ${signalDetails.bgPulseColor} animate-pulse shrink-0`}></span>
              <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wide">Sinyal Teknikal</span>
            </div>
          </div>
        </div>

        {/* Horizontal bar summary breakdown - Styled as Premium Grid Cards */}
        <div className="md:col-span-8 space-y-3 font-mono">
          <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
            <div className="bg-[#1c080d]/60 p-2 rounded-xl border border-rose-500/20">
              <span className="text-[#f43f5e] block font-black text-[8px] tracking-wide">JUAL</span>
              <span className="text-base text-rose-400 font-black tracking-tight">{signalDetails.sellCount}</span>
              <span className="text-[7.5px] text-slate-500 block mt-0.5">Indikator</span>
            </div>
            <div className="bg-[#111822]/60 p-2 rounded-xl border border-slate-700/30">
              <span className="text-slate-455 block font-black text-[8px] tracking-wide">NETRAL</span>
              <span className="text-base text-slate-300 font-black tracking-tight">{signalDetails.neutralCount}</span>
              <span className="text-[7.5px] text-slate-500 block mt-0.5">Indikator</span>
            </div>
            <div className="bg-[#051c1e]/60 p-2 rounded-xl border border-emerald-500/20">
              <span className="text-[#10b981] block font-black text-[8px] tracking-wide">BELI</span>
              <span className="text-base text-emerald-400 font-black tracking-tight">{signalDetails.buyCount}</span>
              <span className="text-[7.5px] text-slate-500 block mt-0.5">Indikator</span>
            </div>
          </div>

          {/* Quick lists with modern progress bars */}
          <div className="space-y-1 bg-slate-950/30 p-2 rounded-xl border border-slate-900">
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-slate-300 font-extrabold font-sans">Relative Strength Index (RSI-14)</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-black font-mono text-[9px] bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                  RSI: {signalDetails.rsi}
                </span>
                <span className={`px-1 py-0.5 rounded text-[8px] font-mono font-black ${
                  signalDetails.rsiStatus === "BUY" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/20" : signalDetails.rsiStatus === "SELL" ? "bg-rose-950/60 text-rose-400 border border-rose-500/20" : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}>
                  {signalDetails.rsiStatus}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900 p-[1px]">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  signalDetails.rsi > 70 ? "bg-amber-500" : signalDetails.rsi < 30 ? "bg-rose-500" : "bg-cyan-400"
                }`} 
                style={{ width: `${signalDetails.rsi}%` }}
              ></div>
            </div>
          </div>

          {/* Grid of technical oscillator lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div className="space-y-1.5 bg-[#020b12]/40 rounded-xl p-2.5 border border-slate-900">
              <span className="text-[8px] font-black text-cyan-400 tracking-wider block uppercase border-b border-cyan-950/40 pb-0.5 font-sans">
                🎛️ Oscillators
              </span>
              
              <div className="space-y-1 text-[9.5px]">
                <div className="flex justify-between text-slate-400 items-center gap-2">
                  <span className="font-sans">Stochastic %K</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-white font-bold">{signalDetails.stochK}</span>
                    <span className={`px-1 py-0.25 rounded text-[7.5px] font-black ${
                      signalDetails.stochKStatus === "BUY" ? "text-emerald-400 bg-emerald-950/50" : "text-rose-400 bg-rose-950/50"
                    }`}>{signalDetails.stochKStatus}</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-slate-400 items-center gap-1">
                  <span className="font-sans">CCI (20 Oscil)</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-white font-bold">{signalDetails.cci}</span>
                    <span className={`px-1 py-0.25 rounded text-[7.5px] font-black ${
                      signalDetails.cciStatus === "BUY" ? "text-emerald-400 bg-emerald-950/50" : "text-rose-400 bg-rose-950/50"
                    }`}>{signalDetails.cciStatus}</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-slate-400 items-center gap-1">
                  <span className="font-sans">MACD Level</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold">
                    <span className="text-white mr-1">{signalDetails.macd.toFixed(1)}</span>
                    <span className={`px-1 py-0.25 rounded text-[7.5px] font-black ${
                      signalDetails.macdStatus === "BUY" ? "text-emerald-400 bg-emerald-950/50" : "text-rose-400 bg-rose-950/50"
                    }`}>{signalDetails.macdStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 bg-[#020b12]/40 rounded-xl p-2.5 border border-slate-900">
              <span className="text-[8px] font-black text-cyan-400 tracking-wider block uppercase border-b border-cyan-950/40 pb-0.5 font-sans">
                📈 Moving Averages
              </span>
              
              <div className="space-y-1 text-[9.5px]">
                <div className="flex justify-between text-slate-400 items-center gap-2">
                  <span className="font-sans">EMA (10 Trend)</span>
                  <span className={`px-1 rounded font-mono text-[7.5px] font-black ${
                    signalDetails.ema10 === "BUY" ? "text-emerald-400 bg-emerald-950/50" : "text-rose-400 bg-rose-950/50"
                  }`}>{signalDetails.ema10}</span>
                </div>
                
                <div className="flex justify-between text-slate-400 items-center gap-2">
                  <span className="font-sans">EMA (30 Trend)</span>
                  <span className={`px-1 rounded font-mono text-[7.5px] font-black ${
                    signalDetails.ema30 === "BUY" ? "text-emerald-400 bg-emerald-950/50" : "text-rose-400 bg-rose-950/50"
                  }`}>{signalDetails.ema30}</span>
                </div>
                
                <div className="flex justify-between text-slate-400 items-center gap-2">
                  <span className="font-sans">SMA (50 Trend)</span>
                  <span className={`px-1 rounded font-mono text-[7.5px] font-black ${
                    signalDetails.sma50 === "BUY" ? "text-emerald-400 bg-emerald-950/50" : "text-rose-400 bg-rose-950/50"
                  }`}>{signalDetails.sma50}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
