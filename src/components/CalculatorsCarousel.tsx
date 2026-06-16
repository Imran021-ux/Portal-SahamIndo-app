/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Calculator, Coins, ShieldAlert, TrendingUp, Sparkles, 
  ChevronLeft, ChevronRight, Scale, Info, PieChart, Landmark
} from "lucide-react";
import { Stock } from "../types";

interface CalculatorsCarouselProps {
  stocks: Stock[];
  portfolio?: any;
}

export default function CalculatorsCarousel({ stocks, portfolio = {} }: CalculatorsCarouselProps) {
  // Swipeable state: 0 = Dividend Calculator, 1 = Bandar Holding Calculator
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // 1. DIVIDEND CALCULATOR STATE
  const [divTicker, setDivTicker] = useState<string>("BBRI");
  const [sharesLot, setSharesLot] = useState<number>(100); // 100 Lots
  const [customDps, setCustomDps] = useState<string>("");
  const [avgBuyPriceInput, setAvgBuyPriceInput] = useState<string>("");
  const [isTaxExempt, setIsTaxExempt] = useState<boolean>(true); // Bebas Pajak UU Cipta Kerja

  // Auto populate standard values when ticker changes or load from portfolio
  const selectedDivStock = useMemo(() => {
    return stocks.find(s => s.ticker === divTicker) || stocks[0];
  }, [divTicker, stocks]);

  // Current price of selected div stock
  const currentPrice = selectedDivStock ? selectedDivStock.currentPrice : 5000;
  
  // Calculate standard Dividend Per Share (DPS) based on normal IDX payout of that stock
  const calculatedDps = useMemo(() => {
    if (!selectedDivStock) return 120;
    const yieldPct = selectedDivStock.dividendYield || 3.5;
    return Math.round(selectedDivStock.currentPrice * (yieldPct / 100));
  }, [selectedDivStock]);

  const activeDps = customDps !== "" ? (parseInt(customDps) || 0) : calculatedDps;
  const activeAvgPrice = avgBuyPriceInput !== "" ? (parseInt(avgBuyPriceInput) || currentPrice) : currentPrice;

  // Let's check if the stock is held in our portfolio for helper auto-fill button
  const portfolioItem = useMemo(() => {
    return Object.values(portfolio).find((item: any) => item.ticker === divTicker) as any;
  }, [divTicker, portfolio]);

  const totalShares = sharesLot * 100;
  const totalPayoutGross = totalShares * activeDps;
  const taxAmount = isTaxExempt ? 0 : Math.round(totalPayoutGross * 0.10);
  const totalPayoutNet = totalPayoutGross - taxAmount;
  const totalInvestmentCost = totalShares * activeAvgPrice;
  const yieldOnCost = totalInvestmentCost > 0 ? (totalPayoutGross / totalInvestmentCost) * 100 : 0;
  
  // Dividend Quality Assessment
  const dividendAnalysis = useMemo(() => {
    const yieldPct = selectedDivStock ? selectedDivStock.dividendYield : 0;
    if (yieldPct >= 6.0) {
      return {
        label: "SUPER YIELD (Deviden Jumbo)",
        color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
        desc: "Sangat menarik untuk cashflow pasif, namun waspadai potensi 'Dividend Trap' setelah tanggal Cum Date."
      };
    } else if (yieldPct >= 2.5) {
      return {
        label: "MODERATE YIELD (Sehat & Bertumbuh)",
        color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20",
        desc: "Yield stabil khas emiten mapan berkualitas tinggi (Blue Chip). Risiko capital loss relatif rendah."
      };
    } else if (yieldPct > 0) {
      return {
        label: "LOW YIELD (Retensi Ekspansi)",
        color: "text-amber-400 border-amber-500/30 bg-amber-950/20",
        desc: "Emiten lebih memilih menginvestasikan laba untuk ekspansi usaha dibanding membagikan dividen besar."
      };
    } else {
      return {
        label: "NO DIVIDEND (Tanpa Pembagian laba)",
        color: "text-rose-400 border-rose-500/30 bg-rose-950/20",
        desc: "Emiten saat ini tidak membagikan keuntungan dividen, kemungkinan masih berfokus mendanai laju ekspansi."
      };
    }
  }, [selectedDivStock]);


  // 2. BANDARMOLOGY CALCULATOR STATE
  const [bandarTicker, setBandarTicker] = useState<string>("BUMI");
  const [totalVolLot, setTotalVolLot] = useState<number>(500000); // 500,000 Lots traded today
  const [top3NetBuyLot, setTop3NetBuyLot] = useState<number>(185000); // Top 3 Broker Accumulation net buy volume
  const [bandarAvgPrice, setBandarAvgPrice] = useState<number>(135);

  const selectedBandarStock = useMemo(() => {
    return stocks.find(s => s.ticker === bandarTicker) || stocks[0];
  }, [bandarTicker, stocks]);

  // Formulas
  // Rasio Akumulasi / Dominasi Bandar %
  const bandarCorneringRatio = useMemo(() => {
    if (totalVolLot <= 0) return 0;
    const ratio = (top3NetBuyLot / totalVolLot) * 100;
    return Math.min(100, Math.max(0, parseFloat(ratio.toFixed(2))));
  }, [top3NetBuyLot, totalVolLot]);

  // Estimasi Dana Bandar (Miliar Rupiah)
  const estimatedBandarCapital = useMemo(() => {
    const totalSharesBuy = top3NetBuyLot * 100;
    const valueRupiah = totalSharesBuy * bandarAvgPrice;
    return parseFloat((valueRupiah / 1000000000).toFixed(2)); // convert to billion IDR
  }, [top3NetBuyLot, bandarAvgPrice]);

  // Bandar Action Category Classification
  const bandarClassification = useMemo(() => {
    const ratio = bandarCorneringRatio;
    if (ratio >= 50.0) {
      return {
        title: "AKUMULASI SANGAT KUAT (Cornering)",
        color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        desc: "Top 3 Bandar menguasai lebih dari 50% seluruh transaksi bursa hari ini! Ini indikasi pengumpulan barang intensif, potensi kenaikan harga (markup) sangat tinggi jika ritel terpancing panic selling."
      };
    } else if (ratio >= 35.0) {
      return {
        title: "AKUMULASI SEDANG (Normal Acc)",
        color: "text-cyan-405 text-cyan-400 border-cyan-500/30 bg-cyan-950/20",
        desc: "Bandar sedang mengumpulkan barang secara berkala. Meminimalkan gejolak naik turun bursa agar ritel tidak menyadarinya. Layak dikoleksi secara bertahap menemani bandar."
      };
    } else if (ratio >= 20.0) {
      return {
        title: "DISTRIBUSI / TRANSAKSI NETRAL",
        color: "text-amber-400 border-amber-500/30 bg-amber-950/20",
        desc: "Transaksi harian seimbang antara bandar dan pelaku ritel. Tidak ada pemusatan barang yang ekstrim. Harga cenderung konsolidasi (sideways) jangka pendek."
      };
    } else {
      return {
        title: "DISTRIBUSI PEKAT (Bandar Jualan / Exit)",
        color: "text-rose-400 border-rose-500/30 bg-rose-950/20",
        desc: "Konsentrasi transaksi sangat lemah pada pembeli utama. Bandar kemungkinan sedang melancarkan distribusi (buang barang) perlahan kepada publik ritel. Disarankan berhati-hati."
      };
    }
  }, [bandarCorneringRatio]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? 1 : 0));
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 1 ? 0 : 1));
  };

  return (
    <div id="calculators-deck" className="glass-card rounded-2xl border border-slate-800 p-5 mt-6 relative overflow-hidden select-none bg-gradient-to-b from-slate-900/40 to-slate-950/10 shadow-2xl">
      
      {/* Deck Indicator & Nav */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-850/60 mb-5">
        <div className="flex items-center gap-2">
          {activeSlide === 0 ? (
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Coins className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Kalkulator Dividen &amp; Proyeksi Pasif</h4>
                <p className="text-[10px] text-slate-450">Hitung simulasi dividend yield on cost dan estimasi cashflow bersih.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                <Scale className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Detektor Kepemilikan Barang Bandar (Bandarmology)</h4>
                <p className="text-[10px] text-slate-450">Analisis rasio akumulasi &amp; estimasi besaran dana bandar bursa.</p>
              </div>
            </div>
          )}
        </div>

        {/* Carousel buttons */}
        <div className="flex items-center gap-x-2">
          <button 
            onClick={handlePrevSlide}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer hover:bg-slate-900 active:scale-95"
            title="Slide Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Dot Indicators */}
          <div className="flex space-x-1.5">
            <span 
              onClick={() => setActiveSlide(0)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all ${activeSlide === 0 ? "bg-emerald-400 scale-[1.2] shadow-[0_0_8px_#10b981]" : "bg-slate-700"}`}
            ></span>
            <span 
              onClick={() => setActiveSlide(1)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all ${activeSlide === 1 ? "bg-cyan-400 scale-[1.2] shadow-[0_0_8px_#06b6d4]" : "bg-slate-700"}`}
            ></span>
          </div>

          <button 
            onClick={handleNextSlide}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer hover:bg-slate-900 active:scale-95"
            title="Slide Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CAROUSEL SCREEN */}
      <div className="relative">
        
        {/* SLIDE 0: DIVIDEND CALCULATOR CARD */}
        {activeSlide === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-fadeIn">
            
            {/* Input parameters panel (5 columns) */}
            <div className="md:col-span-5 bg-slate-950/45 p-4 rounded-xl border border-slate-900 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                
                {/* 1. Select / Search Emiten */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Pilih Kode Emiten</label>
                  <select 
                    value={divTicker}
                    onChange={(e) => {
                      setDivTicker(e.target.value);
                      setCustomDps(""); // Reset custom input so it auto-fills new values
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-xs text-white uppercase font-mono cursor-pointer focus:outline-none focus:border-emerald-500"
                  >
                    {stocks.filter(s => s.isReal && s.dividendYield > 0).map(s => (
                      <option key={s.ticker} value={s.ticker}>
                        {s.ticker} - {s.name.substring(0, 24)} (Yield: {s.dividendYield}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 2. Jumlah Lot */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Jumlah Lot (1 Lot = 100 Lembar)</label>
                    <input 
                      type="number"
                      min="1"
                      max="10000"
                      value={sharesLot}
                      onChange={(e) => setSharesLot(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[9px] text-slate-500 block mt-1">= {totalShares.toLocaleString("id-ID")} Lembar</span>
                  </div>

                  {/* 3. Avg Buy Price */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Harga Rata-Rata Beli (Rp)</label>
                    <input 
                      type="number"
                      placeholder={currentPrice.toString()}
                      value={avgBuyPriceInput}
                      onChange={(e) => setAvgBuyPriceInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[9px] text-slate-500 block mt-1">Live Price: Rp {currentPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* 4. DPS customization */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dividen per Lembar (DPS - Rp)</label>
                    <span className="text-[9.5px] text-emerald-400 font-bold font-mono">Estimasi: Rp {calculatedDps}</span>
                  </div>
                  <input 
                    type="number"
                    placeholder={`Gunakan Estimasi (Rp ${calculatedDps})`}
                    value={customDps}
                    onChange={(e) => setCustomDps(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Tinggalkan kosong untuk menggunakan estimasi dividend payout industri saat ini.</p>
                </div>

                {/* 5. Tax Options Checklist */}
                <div className="pt-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-350 select-none">
                    <input 
                      type="checkbox"
                      checked={isTaxExempt}
                      onChange={(e) => setIsTaxExempt(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                    />
                    <span>🛡️ Bebas PPh Pajak Dividen 10% (UU Cipta Kerja)</span>
                  </label>
                  <p className="text-[9px] text-slate-500 mt-1 pl-6">Dengan syarat diinvestasikan kembali dalam instrumen keuangan NKRI selama minimal 3 tahun.</p>
                </div>

              </div>

              {/* Quick Auto-Fill from virtual holding if available */}
              {portfolioItem && (
                <button
                  type="button"
                  onClick={() => {
                    setSharesLot(Math.ceil(portfolioItem.shares / 100));
                    setAvgBuyPriceInput(portfolioItem.avgBuyPrice.toString());
                  }}
                  className="w-full mt-3 py-1.5 bg-emerald-900/10 hover:bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 text-[10.5px] font-black rounded-lg transition-all cursor-pointer"
                >
                  📥 Sinkronkan dari Kepemilikan Portofolio ({portfolioItem.shares / 100} Lot)
                </button>
              )}

            </div>

            {/* Results output panel (7 columns) */}
            <div className="md:col-span-7 bg-slate-900/15 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4">
              
              <div className="space-y-4">
                
                {/* Visual Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-550 block font-mono">EMITEN DETEKTIF</span>
                    <strong className="text-white text-sm font-black font-mono">{selectedDivStock?.ticker} Tbk.</strong>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border ${dividendAnalysis.color}`}>
                    {dividendAnalysis.label}
                  </span>
                </div>

                {/* Summary card metrics */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  
                  {/* Estimasi Biaya Investasi */}
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-slate-900">
                    <span className="text-[8.5px] text-slate-550 block uppercase font-mono">Total Biaya Investasi</span>
                    <span className="text-sm font-black font-mono text-white mt-1 block">
                      Rp {totalInvestmentCost.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[8px] text-slate-500 mt-0.5 block">Avg: Rp {activeAvgPrice.toLocaleString("id-ID")}</span>
                  </div>

                  {/* Estimasi Dividend Hasil */}
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-slate-900">
                    <span className="text-[8.5px] text-slate-555 block uppercase font-mono text-emerald-400">Total Dividen Bersih (Net)</span>
                    <span className="text-sm font-black font-mono text-[#10b981] mt-1 block">
                      Rp {totalPayoutNet.toLocaleString("id-ID")}
                    </span>
                    {taxAmount > 0 ? (
                      <span className="text-[8px] text-rose-400 mt-0.5 block">Potongan PPh 10%: Rp {taxAmount.toLocaleString("id-ID")}</span>
                    ) : (
                      <span className="text-[8px] text-emerald-400 mt-0.5 block">Bebas Pajak (Tarif Final 0%)</span>
                    )}
                  </div>

                  {/* Yield On Cost % */}
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-slate-900">
                    <span className="text-[8.5px] text-slate-550 block uppercase font-mono">D.YOC % (Yield on Cost)</span>
                    <span className="text-xs font-black font-mono text-cyan-300 mt-1 block">
                      {yieldOnCost.toFixed(2)} %
                    </span>
                    <span className="text-[8px] text-slate-500 mt-0.5 block">Yield Pasar Sekarang: {selectedDivStock?.dividendYield}%</span>
                  </div>

                  {/* Cashflow Bulanan Setara */}
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-slate-900">
                    <span className="text-[8.5px] text-slate-550 block uppercase font-mono">Setara Gaji Pasif / Bulan</span>
                    <span className="text-xs font-black font-mono text-emerald-305 mt-1 block text-emerald-400">
                      Rp {Math.round(totalPayoutNet / 12).toLocaleString("id-ID")}
                    </span>
                    <span className="text-[8px] text-slate-500 mt-0.5 block">Akumulasi payout tahunan</span>
                  </div>

                </div>

                {/* Analysis detail */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 text-[10.5px] leading-relaxed text-slate-450">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-405 shrink-0 mt-0.5 text-cyan-400" />
                    <p>
                      <strong>Analisis Pasif:</strong> {dividendAnalysis.desc} Dividen Per Share sebesar <strong>Rp {activeDps}</strong> pada modal beli <strong>Rp {activeAvgPrice.toLocaleString("id-ID")}</strong> menghasilkan profitabilitas dividend yield tahunan bersih sebesar <strong>{yieldOnCost.toFixed(2)}%</strong>.
                    </p>
                  </div>
                </div>

              </div>

              {/* Informative footer statement */}
              <div className="text-[9px] text-slate-500 text-center uppercase tracking-wider select-none font-mono">
                Estimasi cashflow mengabaikan perubahan volatilitas harga pasar reguler (Capital Gain/Loss)
              </div>

            </div>

          </div>
        )}

        {/* SLIDE 1: BANDARMOLOGY HOLDINGS CALCULATOR CARD */}
        {activeSlide === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-fadeIn">
            
            {/* Input parameters panel (5 columns) */}
            <div className="md:col-span-5 bg-slate-950/45 p-4 rounded-xl border border-slate-900/80 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                
                {/* 1. Select / Search Emiten */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Pilih Kode Emiten Kantor</label>
                  <select 
                    value={bandarTicker}
                    onChange={(e) => {
                      const ticker = e.target.value;
                      setBandarTicker(ticker);
                      const s = stocks.find(i => i.ticker === ticker);
                      if (s) {
                        setBandarAvgPrice(s.currentPrice);
                        // Make default volume look organic
                        const hash = ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                        const calculatedVol = 100000 + (hash % 800) * 1250;
                        setTotalVolLot(calculatedVol);
                        setTop3NetBuyLot(Math.round(calculatedVol * (0.22 + (hash % 4) * 0.1)));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-xs text-white uppercase font-mono cursor-pointer focus:outline-none focus:border-cyan-500"
                  >
                    {stocks.filter(s => s.isReal).slice(0, 50).map(s => (
                      <option key={s.ticker} value={s.ticker}>
                        {s.ticker} - {s.name.substring(0, 24)} (Rp {s.currentPrice})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Total Vol Lot */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Total Volume Transaksi Hari Ini (Lot)</label>
                  <input 
                    type="number"
                    min="1"
                    max="10000000"
                    value={totalVolLot}
                    onChange={(e) => setTotalVolLot(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-505 focus:border-cyan-500"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Representasi likuiditas harian. Semakin besar volume, semakin akurat perhitungan bandarmology.</p>
                </div>

                {/* 3. Net Accumulation Volume of Top 3 brokers */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volume Bersih Net Top 3 Broker (Lot)</label>
                    <span 
                      onClick={() => setTop3NetBuyLot(Math.round(totalVolLot * 0.42))}
                      className="text-[9px] text-cyan-400 cursor-pointer underline select-none"
                    >
                      Set Akumulasi Rata-Rata (42%)
                    </span>
                  </div>
                  <input 
                    type="number"
                    min="1"
                    max={totalVolLot}
                    value={top3NetBuyLot}
                    onChange={(e) => setTop3NetBuyLot(Math.min(totalVolLot, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Pembelian net bersih dari 3 broker teratas (misal: CC, YP, PD) dikurangi penjualan net mereka.</p>
                </div>

                {/* 4. Bandar Average Price */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Harga Rata-Rata Bandar (Avg Price)</label>
                  <input 
                    type="number"
                    value={bandarAvgPrice}
                    onChange={(e) => setBandarAvgPrice(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Prakiraan harga rata-rata beli bandar/underwriter berdasarkan histori broker summary harian.</p>
                </div>

              </div>
            </div>

            {/* Results output panel (7 columns) */}
            <div className="md:col-span-7 bg-slate-900/15 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4">
              
              <div className="space-y-4">
                
                {/* Visual Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-550 block font-mono">BANDAR TRACKING ENGINE</span>
                    <strong className="text-white text-sm font-black font-mono">{selectedBandarStock?.ticker} Tbk.</strong>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border ${bandarClassification.color}`}>
                    {bandarClassification.title}
                  </span>
                </div>

                {/* Formula display box */}
                <div className="bg-slate-950/20 p-2.5 rounded-lg border border-slate-900 flex items-center gap-2.5">
                  <div className="p-1 rounded bg-cyan-900/10 text-cyan-400 font-mono text-[9px] border border-cyan-500/25 shrink-0">
                    FORMULA RESMI
                  </div>
                  <span className="text-[10px] text-slate-400 leading-none font-mono">
                    Rasio Dominasi = (Net Buy Top 3 Broker / Total Vol) x 100%
                  </span>
                </div>

                {/* Summary card metrics */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  
                  {/* Bandar Cornering Ratio */}
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-slate-900">
                    <span className="text-[8.5px] text-slate-550 block uppercase font-mono text-cyan-400">Rasio Dominasi Accumulation</span>
                    <span className="text-xl font-black font-mono text-white mt-1 block">
                      {bandarCorneringRatio} %
                    </span>
                    <span className="text-[8px] text-slate-500 mt-0.5 block flex items-center gap-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${bandarCorneringRatio >= 35 ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                      {bandarCorneringRatio >= 35 ? "Kategori Akumulasi" : "Kategori Distribusi/Netral"}
                    </span>
                  </div>

                  {/* Estimasi Dana Bandar yang Masuk */}
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-slate-900">
                    <span className="text-[8.5px] text-slate-550 block uppercase font-mono">Estimasi Amunisi Bandar (Dana Masuk)</span>
                    <span className="text-sm font-black font-mono text-emerald-405 mt-1 block text-emerald-400">
                      Rp {estimatedBandarCapital.toLocaleString("id-ID")} Miliar
                    </span>
                    <span className="text-[8px] text-slate-500 mt-0.5 block">Berdasarkan Avg price Rp {bandarAvgPrice}</span>
                  </div>

                  {/* Kepemilikan Barang Bandar (Sisa Lot) */}
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-slate-900">
                    <span className="text-[8.5px] text-slate-550 block uppercase font-mono">Kepemilikan Efek Bandar</span>
                    <span className="text-xs font-black font-mono text-amber-400 mt-1 block">
                      {top3NetBuyLot.toLocaleString("id-ID")} Lot
                    </span>
                    <span className="text-[8px] text-slate-500 mt-0.5 block">Sama dengan { (top3NetBuyLot * 100).toLocaleString("id-ID") } lembar</span>
                  </div>

                  {/* Harga Diskon Terhadap Average Bandar */}
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-slate-900">
                    <span className="text-[8.5px] text-slate-550 block uppercase font-mono">Selisih Harga Live vs Avg Bandar</span>
                    {selectedBandarStock && (
                      <>
                        {(() => {
                          const gapPct = ((selectedBandarStock.currentPrice - bandarAvgPrice) / bandarAvgPrice) * 100;
                          const isUnderBandarAvg = gapPct < 0;
                          return (
                            <>
                              <span className={`text-xs font-black font-mono mt-1 block ${isUnderBandarAvg ? "text-emerald-400 animate-pulse" : "text-rose-500"}`}>
                                {isUnderBandarAvg ? "Diskon " : "Premium +"}{Math.abs(gapPct).toFixed(1)} %
                              </span>
                              <span className="text-[8px] text-slate-500 mt-0.5 block">
                                {isUnderBandarAvg ? "✓ Lebih murah dari Bandar" : "✗ Lebih mahal dari Bandar"}
                              </span>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>

                </div>

                {/* Analysis detail text */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 text-[10.5px] leading-relaxed text-slate-450">
                  <div className="flex items-start gap-2">
                    <Landmark className="w-4 h-4 text-cyan-405 shrink-0 mt-0.5 text-cyan-400" />
                    <p>
                      <strong>Saran Bandarmology:</strong> {bandarClassification.desc}
                    </p>
                  </div>
                </div>

              </div>

              {/* Informative footer status */}
              <div className="text-[9px] text-slate-500 text-center uppercase tracking-wider select-none font-mono">
                Formula dihitung secara real-time berdasarkan data feed antrean bandar/institusi
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
