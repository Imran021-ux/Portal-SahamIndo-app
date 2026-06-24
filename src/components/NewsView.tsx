/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { INITIAL_NEWS } from "../data";
import { 
  Newspaper, Landmark, Compass, Eye, TrendingUp, 
  TrendingDown, Globe, Send, DollarSign, Calendar
} from "lucide-react";

interface NewsViewProps {
  onNavigateToTracer: (ticker: string) => void;
}

export default function NewsView({ onNavigateToTracer }: NewsViewProps) {
  const [activeSentimentFilter, setActiveSentimentFilter] = useState<string>("Semua");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => [
    { id: "all", label: "Semua Kategori" },
    { id: "msci", label: "MSCI Index" },
    { id: "akumulasi", label: "Akumulasi Bandar" },
    { id: "ipo", label: "IPO Perdana" },
    { id: "merger", label: "Merger & Akuisisi (Mager)" },
    { id: "makro", label: "Makro Global" }
  ], []);

  const filteredNews = useMemo(() => {
    let result = INITIAL_NEWS;
    
    // Category Filter
    if (activeCategoryFilter !== "all") {
      result = result.filter(news => news.category === activeCategoryFilter);
    }

    // Sentiment Filter
    if (activeSentimentFilter !== "Semua") {
      result = result.filter(news => news.sentiment === activeSentimentFilter.toLowerCase());
    }

    return result;
  }, [activeCategoryFilter, activeSentimentFilter]);

  // Overall market impact computation based on all news
  const stats = useMemo(() => {
    const total = INITIAL_NEWS.length;
    const bullish = INITIAL_NEWS.filter(n => n.sentiment === "bullish").length;
    const bearish = INITIAL_NEWS.filter(n => n.sentiment === "bearish").length;
    const neutral = INITIAL_NEWS.filter(n => n.sentiment === "neutral").length;
    return {
      total,
      bullishPercent: Math.round((bullish / total) * 100),
      bearishPercent: Math.round((bearish / total) * 100),
      neutralPercent: Math.round((neutral / total) * 100)
    };
  }, []);

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case "msci":
        return <span className="px-2 py-0.5 bg-purple-950 text-purple-400 border border-purple-500/20 text-[9px] font-black uppercase rounded tracking-wider font-mono">MSCI</span>;
      case "akumulasi":
        return <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded tracking-wider font-mono font-sans">AKUMULASI</span>;
      case "ipo":
        return <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase rounded tracking-wider font-mono">IPO</span>;
      case "merger":
        return <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/20 text-[9px] font-black uppercase rounded tracking-wider font-mono">MERGER</span>;
      case "makro":
        return <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase rounded tracking-wider font-mono">MAKRO GLOBAL</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase rounded tracking-wider font-mono">UMUM</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2 animate-fade-in">
          <Newspaper className="w-5 h-5 text-emerald-400 animate-pulse" /> Berita Sentimen & Aliran Informasi IDX
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mt-1">
          Asimilasi informasi bursa Indonesia mulai dari pergerakan indeks **MSCI**, deteksi **Akumulasi Bandar Agung**, prospek saham **IPO**, aksi korporasi **Merger & Akuisisi (Mager)**, hingga sentimen **Makro Global** dunia.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* News Feed Grid (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-3.5">
            {/* Filtering Category controls */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block font-sans">KATEGORI TOPIK BEI</span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isActive = activeCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 border border-emerald-400/30 font-extrabold shadow-md shadow-emerald-500/10"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtering Sentiment controls */}
            <div className="space-y-1.5 pt-2 border-t border-slate-900/60">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block font-sans">FILTER KECENDERUNGAN SENTIMEN</span>
              <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-900/80 self-start max-w-sm text-[10px]">
                {["Semua", "Bullish", "Bearish", "Neutral"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveSentimentFilter(tag)}
                    className={`flex-1 py-1 px-3 rounded-lg font-bold transition-all cursor-pointer uppercase ${
                      activeSentimentFilter === tag 
                        ? "bg-slate-800 text-white shadow-sm font-extrabold" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredNews.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 space-y-3">
                <p className="text-slate-400 text-xs font-medium font-sans">
                  Tidak ada berita yang cocok untuk kombinasi kategori & sentimen saat ini.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryFilter("all");
                    setActiveSentimentFilter("Semua");
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-bold text-white hover:bg-slate-850 animate-pulse transition-colors"
                >
                  Reset Filter Berita
                </button>
              </div>
            ) : (
              filteredNews.map((news) => {
                const impactTagBg = news.sentiment === "bullish" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : news.sentiment === "bearish"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-slate-500/10 text-slate-400 border-slate-800";

                return (
                  <div 
                    key={news.id} 
                    className="glass-card rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 hover:translate-x-0.5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header line */}
                      <div className="flex flex-wrap gap-2 items-center justify-between text-[10px] mb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded uppercase font-mono">{news.source}</span>
                          <span className="text-slate-500 font-medium">{news.time}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1.5">
                          {getCategoryBadge(news.category)}
                          <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-sm ${impactTagBg}`}>
                            {news.sentiment} Impact
                          </span>
                        </div>
                      </div>

                      {/* Main Title */}
                      <h4 className="text-sm font-bold text-white leading-snug tracking-tight my-2 block">
                        {news.title}
                      </h4>
                    </div>

                    {/* Foot actions */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-900 text-xs mt-3">
                      <div>
                        {news.ticker ? (
                          <span className="text-[10px] bg-blue-600/10 text-blue-400 font-extrabold border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                            #{news.ticker}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">IHSG Regional</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {news.ticker && (
                          <button
                            id={`news-analyze-${news.ticker}`}
                            onClick={() => onNavigateToTracer(news.ticker!)}
                            className="px-2.5 py-1.5 rounded bg-blue-600/10 text-blue-400 text-[10px] hover:bg-blue-600/20 border border-blue-500/15 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Minta Analisis AI</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Sentiment Index Box (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Index summary layout card */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-emerald-400" /> Sensor Sentimen Makro IDX
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                  <span>Kecenderungan Bullish (Hijau)</span>
                  <span className="font-mono text-emerald-400 font-bold">{stats.bullishPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.bullishPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                  <span>Tingkat Netral (Abu-abu)</span>
                  <span className="font-mono text-slate-400 font-bold">{stats.neutralPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: `${stats.neutralPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                  <span>Sinyal Bearish (Merah)</span>
                  <span className="font-mono text-rose-400 font-bold">{stats.bearishPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${stats.bearishPercent}%` }}></div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-850 text-[10px] text-slate-500 leading-normal">
              Penaksiran persentase sentimen harian dihitung berdasarkan asimilasi data berita dari 7 media bursa terbesar Indonesia di penutupan perdagangan sesi terakhir.
            </div>
          </div>

          {/* Rapat Anggota & Calendar major events */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" /> Kalender Aksi Korporasi & Dividen
            </h3>

            <div className="space-y-3 text-xs">
              
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>BBCA Cum-Dividen</span>
                  <span className="text-[10px] text-blue-400 font-mono">15 Juni 2026</span>
                </div>
                <p className="text-[10px] text-slate-500">Estimasi pembagian tunai dividen interim Rp 175 per lembar.</p>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>TLKM RUPS-Tahunan</span>
                  <span className="text-[10px] text-blue-400 font-mono">22 Juni 2026</span>
                </div>
                <p className="text-[10px] text-slate-500">Rapat penentuan pembagian laba ditahan dan persetujuan direksi.</p>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>GOTO Public Expose</span>
                  <span className="text-[10px] text-blue-400 font-mono">08 Juli 2026</span>
                </div>
                <p className="text-[10px] text-slate-500">Penyampaian prospek lini bisnis finansial inovatif terbaru.</p>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
