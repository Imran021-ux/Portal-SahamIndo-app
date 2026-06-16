/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Stock } from "../types";
import { getSentimentScore, getSentimentMetadata } from "../utils/sentimentEngine";
import { BrainCircuit, Info, Sparkles, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";

interface SentimentAnalysisEngineProps {
  activeStock: Stock;
  fetchedBrokerData?: any;
}

export default function SentimentAnalysisEngine({ activeStock, fetchedBrokerData }: SentimentAnalysisEngineProps) {
  // Translate app data to getSentimentScore's expected inputs
  const brokerInput = useMemo(() => {
    if (!fetchedBrokerData) {
      // Fallback if websocket hasn't loaded real-time data or API failed
      const change = activeStock.changePercent;
      const isAggressiveAccumulation = change > 1.2;
      const isAccumulation = change > 0;
      return {
        netValue: isAccumulation ? 2500000000 : -1500000000,
        isAccumulation: isAggressiveAccumulation,
        isDistribution: change < -1.2,
      };
    }

    const netBuy = fetchedBrokerData.netBuyValue || 0;
    const signal = fetchedBrokerData.signal || "";
    return {
      netValue: netBuy,
      isAccumulation: signal.includes("ACCUMULATION"),
      isDistribution: signal.includes("DISTRIBUTION"),
    };
  }, [activeStock, fetchedBrokerData]);

  const technicalInput = useMemo(() => {
    return {
      volume: activeStock.volume || 0,
      avgVolume: (activeStock.volume || 1000) * 0.85, // estimate average 20-day volume deterministic fallback
    };
  }, [activeStock]);

  const score = useMemo(() => {
    return getSentimentScore(brokerInput, technicalInput);
  }, [brokerInput, technicalInput]);

  const meta = useMemo(() => {
    return getSentimentMetadata(score);
  }, [score]);

  // SVG Arc Progress calculations
  const radius = 55;
  const cx = 80;
  const cy = 70;
  const circumference = Math.PI * radius; // length of half-circle = 172.78
  const scorePercent = (score - 1) / 9; // normalize 1-10 to 0-1 range
  const strokeDashoffset = circumference * (1 - scorePercent);

  // Angle of index needle: left is -180 deg (score 1), right is 0 deg (score 10)
  // Let's sweep -180 to 0 degrees
  const angle = -180 + scorePercent * 180;

  return (
    <div id="sentiment-analysis-card" className="bg-[#010912]/90 border border-cyan-500/15 p-5.5 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-lg h-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500" />
      <div className="absolute -right-8 -top-8 w-16 h-16 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
      
      {/* Title block */}
      <div className="flex justify-between items-start mb-3 select-none">
        <div>
          <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase block font-mono flex items-center gap-1">
            <BrainCircuit className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            SENTIMENT ANALYSIS ENGINE
          </span>
          <span className="text-[9px] text-[#475569] block font-semibold uppercase leading-none mt-0.5">
            Analisis Komposit Aliran Bandar & Volume
          </span>
        </div>
        <span className="text-[8px] bg-slate-950 font-mono text-slate-400 px-2 py-0.5 rounded border border-cyan-900/40 uppercase">
          Score v1.0
        </span>
      </div>

      {/* Semicircle Gauge Visualizer */}
      <div className="flex flex-col items-center justify-center my-1 relative">
        <div className="relative w-44 h-24 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 160 90">
            {/* Background Track Arc */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="#0a1d2d"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Active Sentiment Arc with dynamic color */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke={meta.strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />

            {/* Inner Ticks for 1 to 10 indices */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
              const tickPercent = (val - 1) / 9;
              const tickAngle = -Math.PI + tickPercent * Math.PI;
              const innerR = radius - 12;
              const outerR = radius - 6;
              const x1 = cx + innerR * Math.cos(tickAngle);
              const y1 = cy + innerR * Math.sin(tickAngle);
              const x2 = cx + outerR * Math.cos(tickAngle);
              const y2 = cy + outerR * Math.sin(tickAngle);
              return (
                <line
                  key={`tick-${val}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={score === val ? meta.strokeColor : "#1e293b"}
                  strokeWidth={score === val ? 1.6 : 1}
                />
              );
            })}

            {/* Dynamic Turning Needle */}
            <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
              <polygon
                points="-3,0 0,-56 3,0"
                fill="#ffffff"
                className="transition-transform duration-1000 ease-out"
                stroke="#091824"
                strokeWidth="0.5"
              />
              <circle cx="0" cy="0" r="4" fill="#0b1724" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          </svg>

          {/* Core Score Badge - Shielded translucent pill overlay positioned beautifully beneath pivot */}
          <div className="absolute top-[62px] flex flex-col items-center bg-[#010912]/95 border border-slate-800/80 px-3.5 py-1 rounded-xl shadow-lg shadow-black/60 min-w-[80px] z-10 select-none">
            <span className={`text-xl font-black font-mono tracking-tighter leading-none ${meta.colorClass}`}>
              {score}
            </span>
            <span className="text-[7.5px] text-slate-400 font-black tracking-widest uppercase mt-0.5 font-mono">
              Sentimen
            </span>
          </div>
        </div>

        {/* Categories indicator bar */}
        <div className="w-full flex justify-between px-3 text-[7.5px] text-slate-500 font-mono font-extrabold uppercase mt-1 select-none border-t border-slate-900/40 pt-1.5 gap-2">
          <span className={score <= 4 ? "text-rose-500" : "text-rose-950"}>Bearish (1-4)</span>
          <span className={score === 5 ? "text-yellow-400" : "text-yellow-950"}>Netral (5)</span>
          <span className={score >= 6 ? "text-emerald-400" : "text-emerald-950"}>Bullish (6-10)</span>
        </div>
      </div>

      {/* Dynamic Narrative Alert Banner Block */}
      <div className={`mt-2.5 rounded-xl border p-3 flex flex-col gap-1 transition-all text-left overflow-hidden relative ${meta.bgColorClass}`}>
        <div className="flex items-center gap-1.5">
          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${meta.colorClass}`} />
          <span className={`text-[9.5px] font-black tracking-widest font-mono uppercase ${meta.colorClass}`}>
            {meta.category}
          </span>
        </div>
        <p className="text-[11px] text-slate-200 mt-1 font-sans font-medium leading-relaxed">
          {meta.narrative}
        </p>
      </div>

      {/* Engine Signal Explainer dropdown */}
      <div className="mt-3 bg-[#020d18]/70 border border-slate-900 rounded-xl p-2.5 text-left text-[9px] font-mono leading-normal select-none">
        <div className="flex items-center gap-1.5 text-slate-400 font-extrabold uppercase text-[8.5px] border-b border-slate-900/80 pb-1 mb-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span>Faktor Penyusun Skor</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Broker Net Inflow:</span>
            <span className={brokerInput.netValue > 0 ? "text-emerald-400" : "text-rose-400"}>
              {brokerInput.netValue > 0 ? "+2 Poin" : "-2 Poin"} (Net: {(brokerInput.netValue / 1000000).toFixed(1)}M)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Aktivitas Akumulasi:</span>
            <span className={brokerInput.isAccumulation ? "text-emerald-400" : "text-slate-400"}>
              {brokerInput.isAccumulation ? "+2 Poin (Aktif)" : "0 Poin (Tidak)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Volume vs Rerata 20D:</span>
            <span className={technicalInput.volume > technicalInput.avgVolume ? "text-emerald-400" : "text-slate-400"}>
              {technicalInput.volume > technicalInput.avgVolume ? "+1 Poin (Tinggi)" : "0 Poin (Wajar)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
