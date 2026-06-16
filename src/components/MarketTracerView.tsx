/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Stock } from "../types";
import { Compass, Sparkles, HelpCircle, Loader2, RefreshCcw, BookOpen, MessageSquareCode } from "lucide-react";

interface MarketTracerViewProps {
  stocks: Stock[];
  preselectedTicker?: string | null;
  onClearPreselection?: () => void;
}

// Custom Markdown interpreter component to style text safely without external library collisions
function CustomMarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;

  // Split lines
  const lines = text.split("\n");

  return (
    <div className="space-y-4 font-sans text-sm text-slate-200 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 1. Heading 3: ### Title
        if (trimmed.startsWith("###")) {
          return (
            <h4 key={idx} className="text-base font-bold text-white uppercase tracking-tight font-display mt-6 mb-2 border-b border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-sm"></span>
              {trimmed.replace("###", "").trim()}
            </h4>
          );
        }

        // 2. Heading 4: #### Title
        if (trimmed.startsWith("####")) {
          return (
            <h5 key={idx} className="text-sm font-bold text-slate-100 uppercase tracking-wider font-display mt-4 mb-2">
              {trimmed.replace("####", "").trim()}
            </h5>
          );
        }

        // 3. Blockquotes: > Note
        if (trimmed.startsWith(">")) {
          return (
            <div key={idx} className="p-4 bg-slate-900/80 border-l-[3.5px] border-amber-500/80 rounded-r-xl my-4 text-xs text-amber-300 italic">
              {trimmed.replace(">", "").replace("⚠️", "").trim()}
            </div>
          );
        }

        // 4. Bullet Points: - Bullet or * Bullet
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const content = trimmed.substring(1).trim();
          // Parse nested bold elements inside bullet: **Word**
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5">
              <li className="text-slate-300">
                <span dangerouslySetInnerHTML={{ __html: parseBold(content) }} />
              </li>
            </ul>
          );
        }

        // 5. Normal text with possible bold parse
        if (trimmed === "") {
          return <div key={idx} className="h-1" />;
        }

        return (
          <p key={idx} className="text-slate-300" dangerouslySetInnerHTML={{ __html: parseBold(trimmed) }} />
        );
      })}
    </div>
  );
}

// Regex to swap **text** into <strong>text</strong> safely
function parseBold(str: string): string {
  // Replace double star bold
  let temp = str.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-bold'>$1</strong>");
  // Replace tick boxes wrap e.g. `ticker`
  temp = temp.replace(/`(.*?)`/g, "<code class='bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-blue-300'>$1</code>");
  return temp;
}

export default function MarketTracerView({ stocks, preselectedTicker, onClearPreselection }: MarketTracerViewProps) {
  const [selectedTicker, setSelectedTicker] = useState("BBCA");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set selected ticker when preselected from other tabs
  useEffect(() => {
    if (preselectedTicker) {
      setSelectedTicker(preselectedTicker);
      // Automatically trigger standard analysis if no current analysis is loaded
      handleGenerateAnalysis(preselectedTicker);
      if (onClearPreselection) onClearPreselection();
    }
  }, [preselectedTicker]);

  // Loading indicator messages to create premium user experience while waiting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 1800);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const activeStock = stocks.find(s => s.ticker === selectedTicker) || stocks[0];

  const quickPrompts = [
    { label: "Analisis Fundamental", text: "Berikan laporan analisis fundamental emiten ini secara mendalam termasuk posisi P/E ratio dan Dividend Yield." },
    { label: "Lintasan Teknikal", text: "Jelaskan lintasan teknikal, level support dan resistance harian, serta indikasi sensor RSI saham ini." },
    { label: "Prospek Sentimen", text: "Bagaimana korelasi emiten ini terhadap gejolak inflasi dalam negeri, pergerakan Rupiah, dan laju dana modal asing?" },
    { label: "Rekomendasi Ritel", text: "Apakah saham ini lebih cocok diakumulasi untuk jangka panjang (investasi dividen) atau trading swing harian? Berikan target harga konkret." }
  ];

  const handleGenerateAnalysis = async (tickerToUse = selectedTicker, customQuestion = question) => {
    setLoading(true);
    setAnalysisResult(null);
    setError(null);

    const stockDetails = stocks.find(s => s.ticker === tickerToUse) || activeStock;

    try {
      const response = await fetch("/api/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: stockDetails.ticker,
          name: stockDetails.name,
          currentPrice: stockDetails.currentPrice,
          peRatio: stockDetails.peRatio,
          dividendYield: stockDetails.dividendYield,
          sector: stockDetails.sector,
          question: customQuestion
        })
      });

      if (!response.ok) {
        throw new Error("Koneksi API server-side mengalami kendala harian bursa.");
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }

      setAnalysisResult(resData.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menghubungkan analisis pintar.");
    } finally {
      setLoading(false);
    }
  };

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 0: return "Menghubungi server analytical IDX bursa...";
      case 1: return "Mengunduh histori harga penutupan & papan bid-ask...";
      case 2: return "Menghitung rasio keuangan & korelasi sentimen IDX...";
      case 3: return "Merangkum riset terintegrasi dari AI Gemini...";
      default: return "Menyusun laporan pasar saham...";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
          <Sparkles className="text-amber-400 w-5 h-5" /> AI Market Tracer & Analyst
        </h2>
        <p className="text-xs text-slate-400">Hubungkan data live saham Indonesia dengan kecerdasan buatan Gemini untuk mengulas potensi keuntungan emiten.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form Setting (5 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            
            {/* Ticker selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">Pilih Emiten IDX</label>
              <select
                id="tracer-ticker-selector"
                value={selectedTicker}
                onChange={(e) => {
                  setSelectedTicker(e.target.value);
                  setAnalysisResult(null);
                }}
                disabled={loading}
                className="w-full h-11 px-3.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {stocks.map(s => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker} - {s.name}</option>
                ))}
              </select>
            </div>

            {/* Quick stats reminder box */}
            <div className="bg-slate-950/65 p-3.5 rounded-xl border border-slate-900/80 text-xs text-slate-400 space-y-2">
              <span className="font-semibold text-white block">Metrik Live Sebelum Analisis:</span>
              <div className="flex justify-between">
                <span>Harga Saat Ini:</span>
                <strong className="text-slate-200 font-mono">Rp {activeStock.currentPrice.toLocaleString("id-ID")}</strong>
              </div>
              <div className="flex justify-between">
                <span>Rasio P/E:</span>
                <strong className="text-slate-200 font-mono">{activeStock.peRatio}x</strong>
              </div>
              <div className="flex justify-between">
                <span>Imbal Hasil Dev:</span>
                <strong className="text-slate-200 font-mono">{activeStock.dividendYield}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Sektor:</span>
                <strong className="text-blue-400">{activeStock.sector}</strong>
              </div>
            </div>

            {/* Prompt text area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide flex items-center justify-between">
                <span>Pertanyaan Spesifik</span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">(opsional)</span>
              </label>
              <textarea
                id="tracer-custom-question"
                rows={3}
                placeholder="Tulis pertanyaan khusus, biarkan kosong untuk mendapatkan laporan analisis menyeluruh otomatis..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading}
                className="w-full p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 resize-none leading-relaxed"
              />
            </div>

            {/* Summit Trigger */}
            <button
              id="submit-tracer-btn"
              onClick={() => handleGenerateAnalysis()}
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 disabled:from-slate-800 disabled:to-slate-850 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sedang Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Jalankan Analisis AI Gemini</span>
                </>
              )}
            </button>

          </div>

          {/* Quick Pre-scripted expert questions */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
              <HelpCircle className="w-4 h-4 text-blue-400" /> Draft Pertanyaan Pakar
            </span>
            <div className="grid grid-cols-1 gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(p.text);
                    handleGenerateAnalysis(selectedTicker, p.text);
                  }}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-900 bg-slate-900/30 hover:bg-slate-900 text-[11px] text-slate-400 hover:text-slate-100 transition-all flex justify-between items-center group cursor-pointer"
                >
                  <span className="truncate pr-2 font-medium">{p.label}: "{p.text.substring(0, 39)}..."</span>
                  <span className="text-blue-500 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">&rarr;</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Output Area (8 cols) */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-2xl p-7 border border-slate-805 min-h-[420px] bg-slate-950/25 flex flex-col justify-between relative overflow-hidden">
            
            {/* Ambient indicator in BG */}
            {loading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-sm font-semibold text-white tracking-tight">{getLoadingMessage()}</p>
                <p className="text-xs text-slate-400 mt-2 font-mono italic animate-pulse">Menghubungkan kecerdasan IDX & Gemini 3.5-Flash</p>
              </div>
            )}

            <div>
              {/* Header inside report */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4.5 h-4.5 text-blue-400" /> Laporan Analisis Konsultasi Saham
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">
                    Emiten: {activeStock.ticker} | status: real-time
                  </p>
                </div>
                {analysisResult && (
                  <button
                    id="trigger-rerun-analysis"
                    onClick={() => handleGenerateAnalysis()}
                    className="p-1.5 border border-slate-800 rounded bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Jalankan ulang analisis"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Error boundary details */}
              {error && (
                <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs space-y-2 mt-4">
                  <span className="font-bold flex items-center gap-1">❌ Kegagalan Koneksi Pasar Saham:</span>
                  <p>{error}</p>
                  <p className="text-[10px] text-rose-450 italic">Harap periksa Settings &gt; Secrets Anda untuk memastikan GEMINI_API_KEY valid atau diset.</p>
                </div>
              )}

              {/* Renders Result */}
              {analysisResult ? (
                <div className="bg-slate-900/10 p-4 rounded-xl border border-slate-900/60">
                  <CustomMarkdownRenderer text={analysisResult} />
                </div>
              ) : (
                !loading && !error && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-4 rounded-full bg-slate-900 text-blue-500 ring-1 ring-slate-800">
                      <MessageSquareCode className="w-8 h-8" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-300">Terminal Analisis Menunggu Instruksi</h5>
                      <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                        Pilih kode emiten saham Indonesia Anda di bilah kiri, klik tombol AI Gemini, atau pilih dari draf pertanyaan pakar kami untuk merumuskan hasil riset pasar.
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Disclaimer at core footer */}
            <div className="mt-8 pt-4 border-t border-slate-900 text-[10px] text-slate-550 leading-relaxed bg-slate-900/20 p-3 rounded-lg flex items-center gap-2">
              <span className="font-extrabold uppercase shrink-0 text-amber-500/80 border border-amber-500/30 px-1 py-0.5 rounded-sm text-[8px] tracking-wide">IDX DISKLAIMER</span>
              <p>Rekomendasi AI ini diproses berdasarkan pemodelan probabilitas generatif AI Gemini. Keputusan eksekusi investasi di pasar riil sepenuhnya milik trader. DYOR (Do Your Own Research).</p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
