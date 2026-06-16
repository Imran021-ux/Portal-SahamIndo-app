/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stock } from "../types";

export interface InventoryAnalysis {
  ticker: string;
  isPhysical: boolean;
  // Physical parameters
  inventoryTurnover?: number; // times per year
  inventoryDays?: number; // days in stock
  daysSalesOutstanding: number; // receivables collection days (DSO)
  daysPayableOutstanding: number; // payables settlement days (DPO)
  cashConversionCycle: number; // CCC (inventoryDays + DSO - DPO)
  
  // Banking/Financial parameters (if no physical inventory)
  loanToDepositRatio?: number; // LDR
  nonPerformingLoan?: number; // NPL %
  capitalAdequacyRatio?: number; // CAR %
  creditRotationDays?: number; // average days capital is locked in credits

  efficiencyRating: string;
  efficiencyColor: string;
  logisticsGrade: string;
  statusText: string;
  analysisDescription: string;
  
  // Detailed metric points for a mini table/chart
  q1Turnover: number;
  q2Turnover: number;
  q3Turnover: number;
  q4Turnover: number;
  industryAverageDays: number;
}

export function getInventoryAnalysis(stock: Stock): InventoryAnalysis {
  const hashStock = (ticker: string) => {
    return ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  };
  const hash = hashStock(stock.ticker);
  
  const isFinancial = stock.sector === "Finansial";
  
  // Let's build a deterministic analysis based on ticker
  if (isFinancial) {
    // Banking Analysis
    const ldr = 78 + (hash % 16); // 78% to 94%
    const npl = Number((1.5 + (hash % 15) * 0.1).toFixed(2)); // 1.5% to 3.0%
    const car = Number((18 + (hash % 8)).toFixed(1)); // 18% to 26%
    const rotationDays = 45 + (hash % 20); // 45 to 65 days
    
    const efficiencyRating = npl < 2.2 ? "SANGAT EFISIEN" : "OPTIMAL & SEHAT";
    const efficiencyColor = npl < 2.2 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    const logisticsGrade = npl < 2.0 ? "A+" : "A";
    
    return {
      ticker: stock.ticker,
      isPhysical: false,
      daysSalesOutstanding: 12 + (hash % 10),
      daysPayableOutstanding: 28 + (hash % 15),
      cashConversionCycle: rotationDays - 15,
      loanToDepositRatio: ldr,
      nonPerformingLoan: npl,
      capitalAdequacyRatio: car,
      creditRotationDays: rotationDays,
      efficiencyRating,
      efficiencyColor,
      logisticsGrade,
      statusText: `LDR ${ldr}% | NPL Terkendali (${npl}%)`,
      analysisDescription: `Sebagai institusi finansial, ${stock.ticker} tidak mengelola persediaan fisik. Evaluasi difokuskan pada perputaran likuiditas modal dan kualitas kredit. Rasio LDR sebesar ${ldr}% mengindikasikan penyaluran dana yang optimal dengan bantalan kecukupan modal (CAR: ${car}%) yang kuat. Risiko kredit macet (NPL) bertahan sehat pada level ${npl}%, merefleksikan manajemen risiko penjaminan yang prima.`,
      q1Turnover: Number((8.1 + (hash % 5) * 0.2).toFixed(1)),
      q2Turnover: Number((8.3 + (hash % 5) * 0.2).toFixed(1)),
      q3Turnover: Number((8.6 + (hash % 5) * 0.2).toFixed(1)),
      q4Turnover: Number((8.9 + (hash % 5) * 0.2).toFixed(1)),
      industryAverageDays: 55,
    };
  }

  // Consumer/Retail Sector (UNVR, ICBP, INDF, AMRT)
  const isConsumer = stock.sector === "Konsumer" || ["UNVR", "ICBP", "INDF", "AMRT", "KLBF"].includes(stock.ticker);
  const isProperty = stock.sector === "Properti" || ["BSDE", "PWON", "SMRA", "CTRA", "ASRI"].includes(stock.ticker);
  
  let turnover: number;
  let invDays: number;
  let dso: number;
  let dpo: number;
  let logGrade: string;
  let statusText = "";
  let analysisDescription = "";
  let industryAverage: number;
  
  if (isConsumer) {
    turnover = Number((8 + (hash % 8)).toFixed(1)); // 8x to 15x times a year
    invDays = Math.round(365 / turnover); // 24 to 45 days
    dso = 10 + (hash % 8); // 10 to 17 days
    dpo = 30 + (hash % 15); // 30 to 45 days
    logGrade = turnover > 11 ? "A+" : "A";
    statusText = `Fast Moving Consumer Goods (FMCG) - Rotasi Cepat ${invDays} Hari`;
    analysisDescription = `Siklus persediaan ${stock.ticker} sangat progresif dan berputar tinggi (${turnover}x per tahun). Ini menandakan produk manufaktur diserap cepat oleh ritel modern. Jangka penagihan piutang dagang (DSO) sangat singkat (${dso} hari) sementara pembayaran ke pemasok (DPO) bertahan longgar (${dpo} hari). Menghasilkan Siklus Konversi Kas (CCC) yang amat prima senilai ${invDays + dso - dpo} hari, menghemat modal kerja operasional.`;
    industryAverage = 35;
  } else if (isProperty) {
    turnover = Number((0.2 + (hash % 3) * 0.1).toFixed(2)); // 0.2x to 0.4x times a year
    invDays = Math.round(365 / turnover); // 900 to 1800 days
    dso = 25 + (hash % 15); // 25 to 40 days
    dpo = 45 + (hash % 20); // 45 to 65 days
    logGrade = "B";
    statusText = `Sektor Properti & Konstruksi - Siklus Inventori Panjang`;
    analysisDescription = `Model bisnis properti mengklasifikasikan aset tanah kosong (landbank) dan proyek gedung/perumahan yang belum selesai sebagai 'persediaan'. Sehingga rasio perputaran secara teknis tampak sangat lambat (${invDays} hari). Hal ini normal dalam industri ini. Fokus utama ditekankan pada ketepatan serah terima unit (bukan penumpukan inventori hampa) dan kestabilan siklus penagihan pinjaman KPR konsumen.`;
    industryAverage = 1100;
  } else {
    // Energy/Mining/Industrial
    turnover = Number((4.5 + (hash % 5)).toFixed(1)); // 4.5x to 9x per year
    invDays = Math.round(365 / turnover); // 40 to 80 days
    dso = 20 + (hash % 15); // 20 to 35 days
    dpo = 30 + (hash % 15); // 30 to 45 days
    logGrade = turnover > 6.5 ? "A" : "B";
    statusText = `Logistik Komoditi / Industri Komersial Kontinu`;
    analysisDescription = `Perputaran persediaan ${stock.ticker} stabil pada level ${turnover}x per tahun (${invDays} hari tersimpan di gudang penyimpanan tambang/pabrik). Manajemen supply-chain bekerja sinkron menyalurkan hasil produksi ke ekosistem logistik domestik dan global. Jarak pembayaran hutang usaha yang stabil memberikan ruang kas yang berdaya guna tinggi tanpa biaya simpan berlebih.`;
    industryAverage = 65;
  }

  const ccc = invDays + dso - dpo;
  const rating = ccc < 20 ? "SANGAT OPTIMAL" : ccc < 50 ? "EFISIEN" : "MODERAT";
  const ratingColor = ccc < 20 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : ccc < 50 ? "text-cyan-405 bg-cyan-500/10 border-cyan-500/20" : "text-yellow-450 bg-yellow-500/10 border-yellow-500/20";

  return {
    ticker: stock.ticker,
    isPhysical: true,
    inventoryTurnover: turnover,
    inventoryDays: invDays,
    daysSalesOutstanding: dso,
    daysPayableOutstanding: dpo,
    cashConversionCycle: ccc,
    efficiencyRating: rating,
    efficiencyColor: ratingColor,
    logisticsGrade: logGrade,
    statusText,
    analysisDescription,
    q1Turnover: Number((turnover * 0.9).toFixed(1)),
    q2Turnover: Number((turnover * 1.0).toFixed(1)),
    q3Turnover: Number((turnover * 1.05).toFixed(1)),
    q4Turnover: Number((turnover * 1.12).toFixed(1)),
    industryAverageDays: industryAverage,
  };
}
