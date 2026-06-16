/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stock } from "../types";

// Real prominent Indonesian Stock Exchange (BEI / IDX) Tickers dictionary
const KNOWN_IDX_PROFILES: Record<string, { name: string; sector: string; isSyariah: boolean }> = {
  "BDMN": { name: "Bank Danamon Indonesia Tbk.", sector: "Finansial", isSyariah: false },
  "AUTO": { name: "Astra Otoparts Tbk.", sector: "Industri", isSyariah: true },
  "CPIN": { name: "Charoen Pokphand Indonesia Tbk.", sector: "Agrikultur", isSyariah: true },
  "SDPC": { name: "Millennium Pharmacon International Tbk.", sector: "Kesehatan", isSyariah: true },
  "ADRO": { name: "Adaro Energy Indonesia Tbk.", sector: "Energi", isSyariah: true },
  "ANTM": { name: "Aneka Tambang Tbk.", sector: "Pertambangan", isSyariah: true },
  "ARTO": { name: "Bank Jago Tbk.", sector: "Finansial", isSyariah: false },
  "ASII": { name: "Astra International Tbk.", sector: "Industri", isSyariah: true },
  "ASSA": { name: "Adi Sarana Armada Tbk.", sector: "Logistik", isSyariah: true },
  "BBCA": { name: "Bank Central Asia Tbk.", sector: "Finansial", isSyariah: false },
  "BBNI": { name: "Bank Negara Indonesia (Persero) Tbk.", sector: "Finansial", isSyariah: false },
  "BBRI": { name: "Bank Rakyat Indonesia (Persero) Tbk.", sector: "Finansial", isSyariah: false },
  "BBTN": { name: "Bank Tabungan Negara (Persero) Tbk.", sector: "Finansial", isSyariah: false },
  "BMRI": { name: "Bank Mandiri (Persero) Tbk.", sector: "Finansial", isSyariah: false },
  "BREN": { name: "Barito Renewables Energy Tbk.", sector: "Infrastruktur", isSyariah: true },
  "BRIS": { name: "Bank Syariah Indonesia Tbk.", sector: "Finansial", isSyariah: true },
  "BRMS": { name: "Bumi Resources Minerals Tbk.", sector: "Pertambangan", isSyariah: true },
  "BRPT": { name: "Barito Pacific Tbk.", sector: "Industri", isSyariah: true },
  "BUKA": { name: "Bukalapak.com Tbk.", sector: "Teknologi", isSyariah: true },
  "BUMI": { name: "Bumi Resources Tbk.", sector: "Energi", isSyariah: true },
  "BYAN": { name: "Bayan Resources Tbk.", sector: "Energi", isSyariah: true },
  "CUAN": { name: "Petrindo Jaya Kreasi Tbk.", sector: "Energi", isSyariah: true },
  "ELSA": { name: "Elnusa Tbk.", sector: "Energi", isSyariah: true },
  "EMTK": { name: "Elang Mahkota Teknologi Tbk.", sector: "Teknologi", isSyariah: true },
  "ERAA": { name: "Erajaya Swasembada Tbk.", sector: "Konsumer", isSyariah: true },
  "EXCL": { name: "XL Axiata Tbk.", sector: "Telekomunikasi", isSyariah: true },
  "GOTO": { name: "GoTo Gojek Tokopedia Tbk.", sector: "Teknologi", isSyariah: true },
  "HRUM": { name: "Harum Energy Tbk.", sector: "Pertambangan", isSyariah: true },
  "INDF": { name: "Indofood Sukses Makmur Tbk.", sector: "Konsumer", isSyariah: true },
  "INKP": { name: "Indah Kiat Pulp & Paper Tbk.", sector: "Industri", isSyariah: true },
  "INTP": { name: "Indocement Tunggal Prakarsa Tbk.", sector: "Industri", isSyariah: true },
  "ISAT": { name: "Indosat Ooredoo Hutchison Tbk.", sector: "Telekomunikasi", isSyariah: true },
  "ITMG": { name: "Indo Tambangraya Megah Tbk.", sector: "Energi", isSyariah: true },
  "JSMR": { name: "Jasa Marga (Persero) Tbk.", sector: "Infrastruktur", isSyariah: true },
  "KLBF": { name: "Kalbe Farma Tbk.", sector: "Kesehatan", isSyariah: true },
  "MAPI": { name: "Mitra Adiperkasa Tbk.", sector: "Konsumer", isSyariah: true },
  "MDKA": { name: "Merdeka Copper Gold Tbk.", sector: "Pertambangan", isSyariah: true },
  "MEDC": { name: "Medco Energi Internasional Tbk.", sector: "Energi", isSyariah: true },
  "MIKA": { name: "Mitra Keluarga Karyasehat Tbk.", sector: "Kesehatan", isSyariah: true },
  "MYOR": { name: "Mayora Indah Tbk.", sector: "Konsumer", isSyariah: true },
  "PANI": { name: "Pantai Indah Kapuk Dua Tbk.", sector: "Properti", isSyariah: true },
  "PGAS": { name: "Perusahaan Gas Negara Tbk.", sector: "Infrastruktur", isSyariah: true },
  "PTBA": { name: "Bukit Asam Tbk.", sector: "Energi", isSyariah: true },
  "PTPP": { name: "PP (Persero) Tbk.", sector: "Infrastruktur", isSyariah: true },
  "PTRO": { name: "Petrosea Tbk.", sector: "Pertambangan", isSyariah: true },
  "SGER": { name: "Sumber Global Energy Tbk.", sector: "Energi", isSyariah: true },
  "SIDO": { name: "Industri Jamu dan Farmasi Sido Muncul Tbk.", sector: "Kesehatan", isSyariah: true },
  "SILO": { name: "Siloam International Hospitals Tbk.", sector: "Kesehatan", isSyariah: true },
  "SMGR": { name: "Semen Indonesia (Persero) Tbk.", sector: "Industri", isSyariah: true },
  "SMRA": { name: "Summarecon Agung Tbk.", sector: "Properti", isSyariah: true },
  "TINS": { name: "Timah Tbk.", sector: "Pertambangan", isSyariah: true },
  "TLKM": { name: "Telkom Indonesia (Persero) Tbk.", sector: "Telekomunikasi", isSyariah: true },
  "TPIA": { name: "Chandra Asri Pacific Tbk.", sector: "Industri", isSyariah: true },
  "UNTR": { name: "United Tractors Tbk.", sector: "Industri", isSyariah: true },
  "UNVR": { name: "Unilever Indonesia Tbk.", sector: "Konsumer", isSyariah: true },
  "WIKA": { name: "Wijaya Karya (Persero) Tbk.", sector: "Infrastruktur", isSyariah: false },
};

// Words for dynamic assembly of any searched ticker code not in profiles
const IDX_PREFIXES = [
  "Sinar", "Maju", "Nusantara", "Karya", "Lestari", "Makmur", "Wijaya", "Persada",
  "Utama", "Indo", "Multi", "Artha", "Sentosa", "Bumi", "Global", "Cipta", "Daya",
  "Guna", "Abadi", "Sejahtera", "Jaya", "Pembangunan", "Aneka", "Samudra", "Eka"
];

const IDX_SUFFIXES = [
  "Energi", "Investama", "Resources", "Corporation", "Sutera", "Pratama", "Sinergi",
  "Pangan", "Mineral", "Medika", "Tunggal", "Agro", "Perkasa", "Niaga", "Digital"
];

const IDX_SECTORS = [
  "Finansial", "Infrastruktur", "Teknologi", "Konsumer", "Energi",
  "Pertambangan", "Kesehatan", "Industri", "Properti", "Logistik",
  "Telekomunikasi", "Agrikultur"
];

export function generateDynamicIdxStock(ticker: string): Stock {
  const code = ticker.trim().toUpperCase();
  
  // 1. If known real IDX ticker, resolve immediately
  if (KNOWN_IDX_PROFILES[code]) {
    const profile = KNOWN_IDX_PROFILES[code];
    // Deterministic prices based on ticker character hash
    const charSum = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const mockPrice = 110 + (charSum % 8) * 1350 + (charSum % 3) * 110;
    const change = Math.round(mockPrice * (0.01 + (charSum % 4) * 0.012)) * (charSum % 2 === 0 ? 1 : -1);
    const prev = Math.max(50, mockPrice - change);
    const pct = parseFloat(((change / prev) * 100).toFixed(2));
    
    const hist = [];
    let bp = prev;
    for (let k = 0; k < 10; k++) {
      bp = Math.round(bp * (1 + (Math.sin(charSum + k) * 0.015)));
      hist.push(Math.max(50, bp));
    }
    hist[9] = mockPrice;

    return {
      ticker: code,
      name: profile.name,
      currentPrice: mockPrice,
      previousPrice: prev,
      change,
      changePercent: pct,
      volume: 12500000 + (charSum % 11) * 3200000,
      marketCap: 15400 + (charSum % 17) * 4500,
      peRatio: parseFloat((7.8 + (charSum % 5) * 2.4).toFixed(1)),
      dividendYield: parseFloat(((charSum % 4) * 1.5).toFixed(1)),
      sector: profile.sector,
      history: hist,
      bid: mockPrice - 5,
      ask: mockPrice + 5,
      low: Math.round(mockPrice * 0.94),
      high: Math.round(mockPrice * 1.05),
      pbv: parseFloat((0.85 + (charSum % 5) * 0.4).toFixed(2)),
      der: parseFloat((30 + (charSum % 9) * 15).toFixed(2)),
      roe: parseFloat((5.5 + (charSum % 7) * 3.2).toFixed(2)),
      eps: Math.round(mockPrice / (8 + (charSum % 5) * 3)),
      freeCashFlow: 350 + (charSum % 5) * 110,
      ocf: 420 + (charSum % 5) * 130,
      isSyariah: profile.isSyariah,
      isReal: true
    };
  }

  // 2. Synthesize authentic Indonesian corporate profile for unknown inputs (AVOIDING "Saham Pilihan")
  const hash = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  // Pick deterministic but varied index
  const pref = IDX_PREFIXES[hash % IDX_PREFIXES.length];
  const suff = IDX_SUFFIXES[(hash + 3) % IDX_SUFFIXES.length];
  const name = `${pref} ${suff} Tbk.`;
  
  // Decide sector based on first letter or suffix
  let sector = IDX_SECTORS[hash % IDX_SECTORS.length];
  if (code.startsWith("B") || code.startsWith("P")) {
    sector = "Finansial";
  } else if (code.startsWith("T")) {
    sector = "Telekomunikasi";
  } else if (code.startsWith("E") || code.startsWith("A")) {
    sector = "Energi";
  }

  const isSyariah = sector !== "Finansial" || code.endsWith("S") || code.includes("Y");
  
  // Price synthesis
  const mockPrice = 120 + (hash % 15) * 190 + (hash % 4) * 45;
  const change = Math.round(mockPrice * (0.005 + (hash % 3) * 0.008)) * (hash % 2 === 0 ? 1 : -1);
  const prev = Math.max(50, mockPrice - change);
  const pct = parseFloat(((change / prev) * 100).toFixed(2));
  
  const hist = [];
  let bp = prev;
  for (let k = 0; k < 10; k++) {
    bp = Math.round(bp * (1 + (Math.sin(hash + k) * 0.01)));
    hist.push(Math.max(50, bp));
  }
  hist[9] = mockPrice;

  return {
    ticker: code,
    name,
    currentPrice: mockPrice,
    previousPrice: prev,
    change,
    changePercent: pct,
    volume: 5300000 + (hash % 10) * 1200000,
    marketCap: 1200 + (hash % 25) * 320,
    peRatio: parseFloat((6.2 + (hash % 12) * 1.5).toFixed(1)),
    dividendYield: parseFloat(((hash % 3) * 1.1).toFixed(1)),
    sector,
    history: hist,
    bid: mockPrice - 2,
    ask: mockPrice + 2,
    low: Math.round(mockPrice * 0.95),
    high: Math.round(mockPrice * 1.04),
    pbv: parseFloat((0.65 + (hash % 4) * 0.35).toFixed(2)),
    der: parseFloat((45 + (hash % 7) * 18).toFixed(2)),
    roe: parseFloat((4.2 + (hash % 6) * 2.8).toFixed(2)),
    eps: Math.round(mockPrice / (10 + (hash % 4) * 2)),
    freeCashFlow: 120 + (hash % 4) * 45,
    ocf: 155 + (hash % 4) * 55,
    isSyariah,
    isReal: false
  };
}
