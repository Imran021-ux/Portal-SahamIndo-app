/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stock, NewsItem } from "./types";
import fullEmitenList from "./full_emiten_list.json";

// Seeded IDX Stock database with authentic Indonesian stock metrics
const POPULAR_STOCKS_BASE: Stock[] = [
  {
    ticker: "BBCA",
    name: "Bank Central Asia Tbk.",
    currentPrice: 10250,
    previousPrice: 10200,
    change: 50,
    changePercent: 0.49,
    volume: 82400500,
    marketCap: 1263000, // Billion IDR (1,263 Trillion IDR)
    peRatio: 24.5,
    dividendYield: 2.1,
    sector: "Finansial",
    history: [10000, 10050, 10100, 10050, 10150, 10200, 10150, 10225, 10200, 10250],
    bid: 10225,
    ask: 10250,
    low: 10175,
    high: 10300
  },
  {
    ticker: "BBRI",
    name: "Bank Rakyat Indonesia (Persero) Tbk.",
    currentPrice: 4380,
    previousPrice: 4440,
    change: -60,
    changePercent: -1.35,
    volume: 124500000,
    marketCap: 663000, // Billion IDR (663 Trillion IDR)
    peRatio: 11.2,
    dividendYield: 5.8,
    sector: "Finansial",
    history: [4550, 4500, 4480, 4490, 4460, 4420, 4440, 4400, 4420, 4380],
    bid: 4370,
    ask: 4380,
    low: 4350,
    high: 4460
  },
  {
    ticker: "BMRI",
    name: "Bank Mandiri (Persero) Tbk.",
    currentPrice: 6125,
    previousPrice: 6050,
    change: 75,
    changePercent: 1.24,
    volume: 75100200,
    marketCap: 571000,
    peRatio: 10.1,
    dividendYield: 5.7,
    sector: "Finansial",
    history: [5900, 5925, 5950, 6000, 5950, 6025, 6050, 6000, 6050, 6125],
    bid: 6100,
    ask: 6125,
    low: 6000,
    high: 6150
  },
  {
    ticker: "BBNI",
    name: "Bank Negara Indonesia (Persero) Tbk.",
    currentPrice: 4890,
    previousPrice: 4890,
    change: 0,
    changePercent: 0.00,
    volume: 43250000,
    marketCap: 182000,
    peRatio: 8.8,
    dividendYield: 4.8,
    sector: "Finansial",
    history: [4800, 4820, 4850, 4825, 4860, 4890, 4875, 4890, 4890, 4890],
    bid: 4880,
    ask: 4890,
    low: 4850,
    high: 4920
  },
  {
    ticker: "TLKM",
    name: "Telkom Indonesia (Persero) Tbk.",
    currentPrice: 2780,
    previousPrice: 2750,
    change: 30,
    changePercent: 1.09,
    volume: 98120000,
    marketCap: 275000,
    peRatio: 12.1,
    dividendYield: 5.5,
    sector: "Infrastruktur",
    history: [2720, 2710, 2740, 2760, 2750, 2780, 2760, 2770, 2760, 2780],
    bid: 2770,
    ask: 2780,
    low: 2730,
    high: 2800
  },
  {
    ticker: "GOTO",
    name: "GoTo Gojek Tokopedia Tbk.",
    currentPrice: 51,
    previousPrice: 50,
    change: 1,
    changePercent: 2.00,
    volume: 1450200300,
    marketCap: 61000,
    peRatio: -2.8,
    dividendYield: 0.0,
    sector: "Teknologi",
    history: [48, 49, 50, 51, 50, 52, 51, 52, 50, 51],
    bid: 50,
    ask: 51,
    low: 49,
    high: 53
  },
  {
    ticker: "ASII",
    name: "Astra International Tbk.",
    currentPrice: 4650,
    previousPrice: 4700,
    change: -50,
    changePercent: -1.06,
    volume: 38700000,
    marketCap: 188000,
    peRatio: 7.1,
    dividendYield: 7.2,
    sector: "Konsumer",
    history: [4750, 4725, 4700, 4675, 4700, 4650, 4625, 4700, 4675, 4650],
    bid: 4640,
    ask: 4650,
    low: 4620,
    high: 4720
  },
  {
    ticker: "UNVR",
    name: "Unilever Indonesia Tbk.",
    currentPrice: 2050,
    previousPrice: 2100,
    change: -50,
    changePercent: -2.38,
    volume: 29800000,
    marketCap: 78200,
    peRatio: 15.5,
    dividendYield: 6.8,
    sector: "Konsumer",
    history: [2200, 2180, 2150, 2120, 2140, 2100, 2110, 2080, 2100, 2050],
    bid: 2040,
    ask: 2050,
    low: 2030,
    high: 2120
  },
  {
    ticker: "ADRO",
    name: "Adaro Energy Indonesia Tbk.",
    currentPrice: 3650,
    previousPrice: 3600,
    change: 50,
    changePercent: 1.39,
    volume: 53100000,
    marketCap: 116000,
    peRatio: 5.6,
    dividendYield: 9.8,
    sector: "Energi",
    history: [3500, 3520, 3550, 3530, 3560, 3590, 3580, 3610, 3590, 3650],
    bid: 3640,
    ask: 3650,
    low: 3570,
    high: 3680
  },
  {
    ticker: "ANTM",
    name: "Aneka Tambang Tbk.",
    currentPrice: 1420,
    previousPrice: 1410,
    change: 10,
    changePercent: 0.71,
    volume: 62450000,
    marketCap: 34100,
    peRatio: 11.1,
    dividendYield: 3.4,
    sector: "Pertambangan",
    history: [1380, 1390, 1420, 1400, 1410, 1420, 1430, 1410, 1420, 1420],
    bid: 1415,
    ask: 1420,
    low: 1390,
    high: 1440
  },
  {
    ticker: "BUMI",
    name: "Bumi Resources Tbk.",
    currentPrice: 135,
    previousPrice: 132,
    change: 3,
    changePercent: 2.27,
    volume: 450100000,
    marketCap: 49700,
    peRatio: 9.1,
    dividendYield: 0.0,
    sector: "Energi",
    history: [125, 128, 130, 132, 135, 134, 132, 136, 134, 135],
    bid: 134,
    ask: 135,
    low: 130,
    high: 138
  },
  {
    ticker: "KLBF",
    name: "Kalbe Farma Tbk.",
    currentPrice: 1440,
    previousPrice: 1430,
    change: 10,
    changePercent: 0.70,
    volume: 24350000,
    marketCap: 67400,
    peRatio: 19.5,
    dividendYield: 3.0,
    sector: "Kesehatan",
    history: [1410, 1420, 1435, 1420, 1425, 1430, 1435, 1425, 1430, 1440],
    bid: 1435,
    ask: 1440,
    low: 1420,
    high: 1455
  },
  {
    ticker: "ICBP",
    name: "Indofood CBP Sukses Makmur Tbk.",
    currentPrice: 11850,
    previousPrice: 11800,
    change: 50,
    changePercent: 0.42,
    volume: 18400000,
    marketCap: 138100,
    peRatio: 16.6,
    dividendYield: 2.5,
    sector: "Konsumer",
    history: [11600, 11650, 11700, 11675, 11725, 11750, 11700, 11800, 11750, 11850],
    bid: 11825,
    ask: 11850,
    low: 11650,
    high: 11900
  },
  {
    ticker: "PGAS",
    name: "Perusahaan Gas Negara Tbk.",
    currentPrice: 1475,
    previousPrice: 1450,
    change: 25,
    changePercent: 1.72,
    volume: 34100000,
    marketCap: 35850,
    peRatio: 8.1,
    dividendYield: 7.5,
    sector: "Infrastruktur",
    history: [1420, 1430, 1440, 1450, 1445, 1455, 1450, 1460, 1450, 1475],
    bid: 1470,
    ask: 1475,
    low: 1440,
    high: 1490
  },
  {
    ticker: "PTBA",
    name: "Bukit Asam Tbk.",
    currentPrice: 2560,
    previousPrice: 2540,
    change: 20,
    changePercent: 0.79,
    volume: 21200000,
    marketCap: 29500,
    peRatio: 5.8,
    dividendYield: 14.6,
    sector: "Energi",
    history: [2480, 2500, 2510, 2490, 2520, 2540, 2530, 2560, 2545, 2560],
    bid: 2550,
    ask: 2560,
    low: 2500,
    high: 2580
  },
  {
    ticker: "BRIS",
    name: "Bank Syariah Indonesia Tbk.",
    currentPrice: 2910,
    previousPrice: 2850,
    change: 60,
    changePercent: 2.11,
    volume: 58400000,
    marketCap: 134200,
    peRatio: 21.5,
    dividendYield: 1.5,
    sector: "Finansial",
    history: [2750, 2780, 2820, 2790, 2830, 2855, 2840, 2880, 2850, 2910],
    bid: 2900,
    ask: 2910,
    low: 2790,
    high: 2940
  },
  {
    ticker: "BRPT",
    name: "Barito Pacific Tbk.",
    currentPrice: 910,
    previousPrice: 930,
    change: -20,
    changePercent: -2.15,
    volume: 85200000,
    marketCap: 85300,
    peRatio: 44.5,
    dividendYield: 0.5,
    sector: "Industri",
    history: [950, 960, 955, 945, 965, 930, 935, 925, 930, 910],
    bid: 905,
    ask: 910,
    low: 895,
    high: 960
  },
  {
    ticker: "AMRT",
    name: "Sumber Alfaria Trijaya Tbk.",
    currentPrice: 2890,
    previousPrice: 2855,
    change: 35,
    changePercent: 1.23,
    volume: 17500000,
    marketCap: 120000,
    peRatio: 33.1,
    dividendYield: 2.8,
    sector: "Konsumer",
    history: [2800, 2810, 2830, 2825, 2845, 2855, 2840, 2875, 2850, 2890],
    bid: 2880,
    ask: 2890,
    low: 2830,
    high: 2910
  }
];

export const REAL_PRICE_LOOKUP: Record<string, number> = {
  "GOTO": 51, "BUMI": 135, "BREN": 7150, "TPIA": 7650, "BYAN": 16200, "AMMN": 8750, "ADMR": 1320, "BRMS": 396,
  "DSSA": 78000, "PANI": 11250, "SMGR": 3810, "INTP": 7250, "INDF": 6220, "MYOR": 2640, "SIDO": 615, "ACES": 820,
  "MAPI": 1560, "MAPA": 4250, "ERAA": 405, "CPIN": 4900, "JPFA": 1490, "DEWA": 55, "MEDC": 1210, "ENRG": 222,
  "PGEO": 1100, "KEEN": 785, "ADHI": 285, "WIKA": 355, "PTPP": 395, "JSMR": 4650, "MIDI": 415, "PTRO": 6605,
  "ITMG": 25400, "INDY": 1350, "DOID": 620, "TOBA": 250, "ABMM": 3450, "ARTO": 2250, "BBTN": 1245, "BDMN": 2590,
  "PNBN": 1110, "BJBR": 1115, "BJTM": 675, "BANK": 620, "AGRO": 255, "BBYB": 248, "BNGA": 1720, "BNLI": 925,
  "PNBS": 55, "BTPS": 1090, "WOOD": 215, "BRPT": 910, "ANTM": 1420, "TINS": 1025, "INCO": 4280, "ADRO": 3650,
  "UNVR": 2050, "ASII": 4650, "BBCA": 10250, "BBRI": 4380, "BMRI": 6125, "BBNI": 4890, "TLKM": 2780, "GIAA": 55,
  "SOCI": 185, "ELSA": 450, "WINS": 380, "SMDR": 290, "TMAS": 160, "ASSA": 750, "BIRD": 1850, "BLUE": 210,
  "TAXI": 50, "COAL": 60, "BESS": 120, "TCPI": 8400, "ESSA": 850, "AKRA": 1440, "PTBA": 2560, "WSKT": 150,
  "PGAS": 1475, "ISAT": 2200, "EXCL": 2190, "BUKA": 118, "SCMA": 125, "HEAL": 1390, "MIKA": 2810, "SILO": 2650,
  "AUTO": 2040, "MAIN": 680, "MDIA": 50, "KLBF": 1440, "SRIL": 50, "KIJA": 140, "SSIA": 950
};

function generate989Stocks(): Stock[] {
  // Hash function helper to get deterministic values for each stock
  const getHash = (ticker: string) => {
    let h = 0;
    for (let i = 0; i < ticker.length; i++) {
      h = ticker.charCodeAt(i) + ((h << 5) - h);
    }
    return Math.abs(h);
  };

  const normalizeSector = (sec: string): string => {
    if (!sec) return "Industri";
    const s = sec.toLowerCase();
    if (s.includes("keuangan") || s.includes("finansial")) return "Finansial";
    if (s.includes("infra")) return "Infrastruktur";
    if (s.includes("tekno")) return "Teknologi";
    if (s.includes("konsum") || s.includes("consumer") || s.includes("primer")) return "Konsumer";
    if (s.includes("energi") || s.includes("energy")) return "Energi";
    if (s.includes("tambang") || s.includes("mineral") || s.includes("baku") || s.includes("metal")) return "Pertambangan";
    if (s.includes("sehat") || s.includes("health")) return "Kesehatan";
    if (s.includes("industri") || s.includes("perind")) return "Industri";
    if (s.includes("prop") || s.includes("estate") || s.includes("gedung")) return "Properti";
    if (s.includes("trans") || s.includes("logis") || s.includes("kapal")) return "Logistik";
    if (s.includes("telek") || s.includes("komunikasi")) return "Telekomunikasi";
    if (s.includes("tani") || s.includes("agri") || s.includes("perkebunan")) return "Agrikultur";
    return "Industri";
  };

  const result: Stock[] = [];
  const tickersSet = new Set<string>();

  // Use POPULAR_STOCKS_BASE as pre-seeded stocks to retain high fidelity values
  const popularBaseMap = new Map<string, Stock>();
  POPULAR_STOCKS_BASE.forEach(s => {
    popularBaseMap.set(s.ticker.toUpperCase().trim(), s);
  });

  // Filter fullEmitenList to preserve real-world IDX active stocks only
  fullEmitenList.forEach((e: any) => {
    const rawTicker = e.ticker?.toUpperCase().trim();
    if (!rawTicker) return;

    // Reject non-standard/anomalous stock codes (e.g. rights "-R", warrants, or non-alphabetics)
    if (!/^[A-Z]{4}$/.test(rawTicker)) return;

    if (tickersSet.has(rawTicker)) return;
    tickersSet.add(rawTicker);

    const name = e.company_name || `${rawTicker} Tbk.`;
    const sector = normalizeSector(e.sector);
    
    // Check if we have a pre-seeded popular stock for this ticker
    const seed = popularBaseMap.get(rawTicker);
    if (seed) {
      // Retain highly hand-crafted POPULAR_STOCKS_BASE metrics but align company name and sector with the official listing
      result.push({
        ...seed,
        name,
        sector,
        isSyariah: seed.isSyariah ?? (sector === "Finansial" ? (name.toLowerCase().includes("syariah") || name.toLowerCase().includes("sharia") || rawTicker === "PNBS" || rawTicker === "BTPS" || rawTicker === "BRIS" || rawTicker === "BANK") : (rawTicker !== "DLTA" && rawTicker !== "MLBI")),
        isReal: true
      });
      return;
    }

    // Otherwise, generate high-fidelity realistic parameters deterministically
    const hash = getHash(rawTicker);
    const lookupPrice = e.price || REAL_PRICE_LOOKUP[rawTicker];
    
    let currentPrice = 500;
    if (lookupPrice) {
      currentPrice = lookupPrice;
    } else {
      const tier = hash % 3;
      if (tier === 0) {
        currentPrice = 50 + (hash % 9) * 50; // 50 - 450
      } else if (tier === 1) {
        currentPrice = 500 + (hash % 15) * 300; // 500 - 4700
      } else {
        currentPrice = 5000 + (hash % 20) * 1500; // 5000 - 33500
      }
    }

    const changePercentRaw = e.changePercent !== undefined ? e.changePercent : (((hash % 11) - 5) * 0.4); // -2.0% to +2.0%
    const change = e.change !== undefined ? e.change : Math.round(currentPrice * (changePercentRaw / 100));
    const previousPrice = e.previousPrice !== undefined ? e.previousPrice : Math.max(50, currentPrice - change);
    const changePercent = e.changePercent !== undefined ? e.changePercent : Number(((change / previousPrice) * 100).toFixed(2));
    
    const volume = e.volume !== undefined ? e.volume : Math.floor(100000 + (hash % 99) * 500000);
    const marketCap = e.marketCap !== undefined ? e.marketCap : (Math.max(10, Math.round((currentPrice * 100000000) / 1000000000)) || 500); // in Billion IDR
    const peRatio = e.peRatio !== undefined ? e.peRatio : Number((5 + (hash % 40) * 0.6).toFixed(1));
    const dividendYield = e.dividendYield !== undefined ? e.dividendYield : Number(((hash % 8) === 0 ? (hash % 10) * 0.7 : 0).toFixed(1));

    // Determine 10-day price history
    let history: number[] = [];
    if (e.history && Array.isArray(e.history) && e.history.length > 0) {
      history = [...e.history];
    } else {
      let basePrice = previousPrice;
      for (let k = 0; k < 10; k++) {
        const factor = 1 + (((hash + k) % 9) - 4) * 0.005; // -2.0% to +2.0% variation
        basePrice = Math.round(basePrice * factor);
        history.push(Math.max(50, basePrice));
      }
      history[9] = currentPrice;
    }

    const bid = e.bid !== undefined ? e.bid : (currentPrice - Math.max(1, Math.round(currentPrice * 0.002)));
    const ask = e.ask !== undefined ? e.ask : (currentPrice + Math.max(1, Math.round(currentPrice * 0.002)));
    const low = e.low !== undefined ? e.low : Math.round(currentPrice * 0.96);
    const high = e.high !== undefined ? e.high : Math.round(currentPrice * 1.04);

    let isSyariah = true;
    if (sector === "Finansial") {
      const nameLower = name.toLowerCase();
      if (
        nameLower.includes("syariah") || 
        nameLower.includes("sharia") || 
        rawTicker === "PNBS" || 
        rawTicker === "BTPS" || 
        rawTicker === "BANK" ||
        rawTicker === "BRIS"
      ) {
        isSyariah = true;
      } else {
        isSyariah = false;
      }
    } else if (rawTicker === "DLTA" || rawTicker === "MLBI") {
      isSyariah = false;
    }

    result.push({
      ticker: rawTicker,
      name,
      currentPrice,
      previousPrice,
      change,
      changePercent,
      volume,
      marketCap,
      peRatio,
      dividendYield,
      sector,
      history,
      bid,
      ask,
      low,
      high,
      isSyariah,
      isReal: true
    });
  });

  return result;
}

export const INITIAL_STOCKS: Stock[] = generate989Stocks();


// Seedeed IDX News updates
export const INITIAL_NEWS: NewsItem[] = [
  {
    id: "news_1",
    title: "IHSG Ditutup Menguat Terkerek Saham Perbankan dan Masuknya Dana Asing",
    time: "15 Menit Lalu",
    source: "CNBC Indonesia",
    sentiment: "bullish"
  },
  {
    id: "news_2",
    title: "BI-Rate Diproyeksikan Stabil untuk Menjaga Resiliensi Nilai Tukar Rupiah",
    time: "1 Jam Lalu",
    source: "IDX Channel",
    sentiment: "neutral"
  },
  {
    id: "news_3",
    title: "Laba Bersih BBCA Kuartal I Meroket Sesuai Ekspektasi Konsensus Analis",
    ticker: "BBCA",
    time: "2 Jam Lalu",
    source: "Bisnis Indonesia",
    sentiment: "bullish"
  },
  {
    id: "news_4",
    title: "GOTO Perkuat Sinergi Fintek, Targetkan Profitabilitas EBITDA yang Lebih Cepat",
    ticker: "GOTO",
    time: "3 Jam Lalu",
    source: "Kontan",
    sentiment: "bullish"
  },
  {
    id: "news_5",
    title: "Harga Komoditas Batubara Global Melemah, Berpotensi Menekan Kinerja ADRO & BUMI",
    ticker: "ADRO",
    time: "4 Jam Lalu",
    source: "Bloomberg Technoz",
    sentiment: "bearish"
  },
  {
    id: "news_6",
    title: "TLKM Alokasikan Capex Jumbo untuk Penetrasi Data Center dan Layanan Cloud",
    ticker: "TLKM",
    time: "5 Jam Lalu",
    source: "Dunia Investasi",
    sentiment: "bullish"
  },
  {
    id: "news_7",
    title: "ASII Catat Kenaikan Penjualan Mobil Listrik (EV) di Tengah Tekanan Brand Global",
    ticker: "ASII",
    time: "Yesterday",
    source: "Investor Daily",
    sentiment: "neutral"
  }
];

// Helper to generate standard normal random variables (Box-Muller transform) for realistic bell-curve walks
function boxMullerRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Convert [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Helper to simulate stock movement for real-time vibe using Geometric Brownian Motion (GBM)
// Implements strict BEI Auto-Rejection limits where price cannot fluctuate more than +/- 7% per tick.
// Accepts configurable volatility parameter defaults (e.g., 0.01 for low volatility).
export function tickStockPrices(stocks: Stock[], customVolatility?: number): Stock[] {
  return stocks.map(stock => {
    // 1. Determine local volatility. Use provided customVolatility, or default based on asset class
    let vol = customVolatility;
    if (vol === undefined) {
      vol = stock.ticker === "GOTO" || stock.ticker === "BUMI" ? 0.012 : 0.003;
    }
    
    // Slight drift (drift coefficient) of 0.0001 per tick representing slow growth
    const drift = 0.0001; 
    const epsilon = boxMullerRandom();
    
    // GBM formula: S_new = S_old * exp((drift - vol^2 / 2) + vol * epsilon)
    const factor = Math.exp((drift - (vol * vol) / 2) + vol * epsilon);
    let tentativePrice = stock.currentPrice * factor;
    
    // 2. Strict BEI Auto-Rejection rule: Limit tick movement to max -7% / +7% from the last known price
    const maxAllowed = stock.currentPrice * 1.07;
    const minAllowed = stock.currentPrice * 0.93;
    tentativePrice = Math.max(minAllowed, Math.min(maxAllowed, tentativePrice));
    
    // Ensure we respect Indonesian stock boards minimum fractions (minimum Rp 50 fraction)
    const newPrice = Math.max(50, Math.round(tentativePrice));
    
    const originalRefPrice = stock.previousPrice || stock.currentPrice;
    const change = newPrice - originalRefPrice;
    const changePercent = Number(((change / originalRefPrice) * 100).toFixed(2));
    
    // Add new price to history queue
    const newHistory = [...stock.history.slice(1), newPrice];

    // Compute updated BID/ASK dynamic spread
    const spread = Math.max(1, Math.round(newPrice * 0.002));
    const bid = newPrice - spread;
    const ask = newPrice + spread;
    
    let low = stock.low;
    if (!low || newPrice < low) {
      low = Math.max(50, Math.round(newPrice * 0.995));
    }
    
    let high = stock.high;
    if (!high || newPrice > high) {
      high = Math.round(newPrice * 1.005);
    }
    
    // Safety clamp
    if (low > newPrice) low = Math.max(50, newPrice - 1);
    if (high < newPrice) high = newPrice + 1;

    return {
      ...stock,
      currentPrice: newPrice,
      change,
      changePercent,
      history: newHistory,
      bid,
      ask,
      low,
      high,
      volume: stock.volume + Math.round(Math.random() * 800)
    };
  });
}

// Generate technical indicators dynamically based on price position in history
export function getTechnicalIndicators(stock: Stock) {
  const prices = stock.history;
  const curr = stock.currentPrice;
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = sum / prices.length;
  
  // Custom RSI simulation
  const rsi = Math.round(45 + (stock.changePercent * 8) + (Math.random() * 5 - 2.5));
  const rsiClamped = Math.max(10, Math.min(90, rsi));
  
  const macdValue = stock.changePercent > 0 ? "BULLISH CROSSOVER" : "BEARISH WAVE";
  
  return {
    sma20: `Rp ${avg.toFixed(0)}`,
    rsi: rsiClamped,
    macd: macdValue,
    signal: rsiClamped > 70 ? "OVERBOUGHT (SELL)" : rsiClamped < 30 ? "OVERSOLD (BUY)" : "NEUTRAL"
  };
}
