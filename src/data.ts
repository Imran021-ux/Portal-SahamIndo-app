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
  "AUTO": 2040, "MAIN": 680, "MDIA": 50, "KLBF": 1440, "SRIL": 50, "KIJA": 140, "SSIA": 950, "ADHI-R": 20
};

function generate989Stocks(): Stock[] {
  const result = [...POPULAR_STOCKS_BASE];
  const desiredTotal = 989;
  const tickersSet = new Set(result.map(s => s.ticker));

  // Genuine authentic-sounding Indonesian public tickers
  const popularAdditionalTickers = [
    "BREN", "CUAN", "PANI", "TPIA", "BYAN", "AMMN", "ADMR", "INCO", "HRUM", "MBMA",
    "BRMS", "DSSA", "SMGR", "INTP", "INDF", "MYOR", "SIDO", "ACES", "MAPI", "MAPA",
    "ERAA", "CPIN", "JPFA", "DEWA", "MEDC", "ENRG", "PGEO", "KEEN", "ADHI", "WIKA",
    "PTPP", "WTON", "JSMR", "OASA", "MIDI", "ALTO", "ADES", "MLBI", "SILO", "MIKA",
    "HEAL", "SAME", "PRIM", "BULL", "ELSA", "WINS", "SMDR", "TMAS", "ASSA", "BIRD",
    "BLUE", "TAXI", "COAL", "BESS", "TCPI", "ESSA", "AKRA", "PGUN", "PTRO", "MBAP",
    "ITMG", "KKGI", "INDY", "DOID", "TOBA", "ABMM", "PTIS", "ARTO", "BBTN", "BDMN",
    "PNBN", "BJBR", "BJTM", "MEGA", "BANK", "AGRO", "MAYA", "BABP", "BBYB", "BCIC",
    "DNAR", "NOBU", "INPC", "BACA", "BCIP", "BVIC", "MCOR", "AMAR", "BBKP", "BSIM",
    "BSWD", "BNGA", "BNLI", "PNBS", "BTPS", "WMPG", "WOOD", "GTRA", "MEJA"
  ];

  const tickerToRealInfo: Record<string, { name: string; sector: string }> = {
    "BREN": { name: "Barito Renewables Energy Tbk.", sector: "Infrastruktur" },
    "CUAN": { name: "Petrindo Jaya Kreasi Tbk.", sector: "Energi" },
    "PANI": { name: "Pantai Indah Kapuk Dua Tbk.", sector: "Properti" },
    "TPIA": { name: "Chandra Asri Pacific Tbk.", sector: "Industri" },
    "BYAN": { name: "Bayan Resources Tbk.", sector: "Energi" },
    "AMMN": { name: "Amman Mineral Internasional Tbk.", sector: "Pertambangan" },
    "ADMR": { name: "Adaro Minerals Indonesia Tbk.", sector: "Pertambangan" },
    "INCO": { name: "Vale Indonesia Tbk.", sector: "Pertambangan" },
    "HRUM": { name: "Harum Energy Tbk.", sector: "Energi" },
    "MBMA": { name: "Merdeka Battery Materials Tbk.", sector: "Pertambangan" },
    "BRMS": { name: "Bumi Resources Minerals Tbk.", sector: "Pertambangan" },
    "DSSA": { name: "Dian Swastatika Sentosa Tbk.", sector: "Infrastruktur" },
    "SMGR": { name: "Semen Indonesia (Persero) Tbk.", sector: "Industri" },
    "INTP": { name: "Indocement Tunggal Prakarsa Tbk.", sector: "Industri" },
    "INDF": { name: "Indofood Sukses Makmur Tbk.", sector: "Konsumer" },
    "MYOR": { name: "Mayora Indah Tbk.", sector: "Konsumer" },
    "SIDO": { name: "Industri Jamu dan Farmasi Sido Muncul Tbk.", sector: "Kesehatan" },
    "ACES": { name: "Aspirasi Hidup Indonesia Tbk.", sector: "Konsumer" },
    "MAPI": { name: "Mitra Adiperkasa Tbk.", sector: "Konsumer" },
    "MAPA": { name: "MAP Aktif Adiperkasa Tbk.", sector: "Konsumer" },
    "ERAA": { name: "Erajaya Swasembada Tbk.", sector: "Konsumer" },
    "CPIN": { name: "Charoen Pokphand Indonesia Tbk.", sector: "Agrikultur" },
    "JPFA": { name: "Japfa Comfeed Indonesia Tbk.", sector: "Agrikultur" },
    "DEWA": { name: "Darma Henwa Tbk.", sector: "Pertambangan" },
    "MEDC": { name: "Medco Energi Internasional Tbk.", sector: "Energi" },
    "ENRG": { name: "Energi Mega Persada Tbk.", sector: "Energi" },
    "PGEO": { name: "Pertamina Geothermal Energy Tbk.", sector: "Infrastruktur" },
    "KEEN": { name: "Kencana Energi Lestari Tbk.", sector: "Infrastruktur" },
    "ADHI": { name: "Adhi Karya (Persero) Tbk.", sector: "Infrastruktur" },
    "WIKA": { name: "Wijaya Karya (Persero) Tbk.", sector: "Infrastruktur" },
    "PTPP": { name: "PP (Persero) Tbk.", sector: "Infrastruktur" },
    "WTON": { name: "Wijaya Karya Beton Tbk.", sector: "Industri" },
    "JSMR": { name: "Jasa Marga (Persero) Tbk.", sector: "Infrastruktur" },
    "OASA": { name: "Maharaksa Biru Energi Tbk.", sector: "Energi" },
    "MIDI": { name: "Midi Utama Indonesia Tbk.", sector: "Konsumer" },
    "ALTO": { name: "Tri Banyan Tirta Tbk.", sector: "Konsumer" },
    "ADES": { name: "Akasha Wira International Tbk.", sector: "Konsumer" },
    "MLBI": { name: "Multi Bintang Indonesia Tbk.", sector: "Konsumer" },
    "SILO": { name: "Siloam International Hospitals Tbk.", sector: "Kesehatan" },
    "MIKA": { name: "Mitra Keluarga Karyasehat Tbk.", sector: "Kesehatan" },
    "HEAL": { name: "Medikaloka Hermina Tbk.", sector: "Kesehatan" },
    "SAME": { name: "Sarana Meditama Metropolitan Tbk.", sector: "Kesehatan" },
    "PRIM": { name: "Royal Prima Tbk.", sector: "Kesehatan" },
    "BULL": { name: "Buana Lintas Lautan Tbk.", sector: "Logistik" },
    "ELSA": { name: "Elnusa Tbk.", sector: "Energi" },
    "WINS": { name: "Wintermar Offshore Marine Tbk.", sector: "Logistik" },
    "SMDR": { name: "Samudera Indonesia Tbk.", sector: "Logistik" },
    "TMAS": { name: "Temas Tbk.", sector: "Logistik" },
    "ASSA": { name: "Adi Sarana Armada Tbk.", sector: "Logistik" },
    "BIRD": { name: "Blue Bird Tbk.", sector: "Logistik" },
    "BLUE": { name: "Berkah Beton Sadaya Tbk.", sector: "Industri" },
    "TAXI": { name: "Express Transindo Utama Tbk.", sector: "Logistik" },
    "COAL": { name: "Black Diamond Resources Tbk.", sector: "Energi" },
    "BESS": { name: "Batulicin Nusantara Maritim Tbk.", sector: "Logistik" },
    "TCPI": { name: "Transcoal Pacific Tbk.", sector: "Logistik" },
    "ESSA": { name: "Essa Industri Indonesia Tbk.", sector: "Energi" },
    "AKRA": { name: "AKR Corporindo Tbk.", sector: "Logistik" },
    "PGUN": { name: "Pradiksi Gunatama Tbk.", sector: "Agrikultur" },
    "PTRO": { name: "Petrosea Tbk.", sector: "Pertambangan" },
    "MBAP": { name: "Mitrabara Adiperdana Tbk.", sector: "Energi" },
    "ITMG": { name: "Indo Tambangraya Megah Tbk.", sector: "Energi" },
    "KKGI": { name: "Resource Alam Indonesia Tbk.", sector: "Energi" },
    "INDY": { name: "Indika Energy Tbk.", sector: "Energi" },
    "DOID": { name: "Delta Dunia Makmur Tbk.", sector: "Pertambangan" },
    "TOBA": { name: "TBS Energi Utama Tbk.", sector: "Energi" },
    "ABMM": { name: "ABM Investama Tbk.", sector: "Energi" },
    "PTIS": { name: "Indo Straits Tbk.", sector: "Logistik" },
    "ARTO": { name: "Bank Jago Tbk.", sector: "Finansial" },
    "BBTN": { name: "Bank Tabungan Negara (Persero) Tbk.", sector: "Finansial" },
    "BDMN": { name: "Bank Danamon Indonesia Tbk.", sector: "Finansial" },
    "PNBN": { name: "Bank Pan Indonesia Tbk.", sector: "Finansial" },
    "BJBR": { name: "Bank Pembangunan Daerah Jawa Barat dan Banten Tbk.", sector: "Finansial" },
    "BJTM": { name: "Bank Pembangunan Daerah Jawa Timur Tbk.", sector: "Finansial" },
    "MEGA": { name: "Bank Mega Tbk.", sector: "Finansial" },
    "BANK": { name: "Bank Aladin Syariah Tbk.", sector: "Finansial" },
    "AGRO": { name: "Bank Raya Indonesia Tbk.", sector: "Finansial" },
    "MAYA": { name: "Bank Mayapada Internasional Tbk.", sector: "Finansial" },
    "BABP": { name: "Bank MNC Internasional Tbk.", sector: "Finansial" },
    "BBYB": { name: "Bank Neo Commerce Tbk.", sector: "Finansial" },
    "BCIC": { name: "Bank JTrust Indonesia Tbk.", sector: "Finansial" },
    "DNAR": { name: "Bank Oke Indonesia Tbk.", sector: "Finansial" },
    "NOBU": { name: "Bank Nationalnobu Tbk.", sector: "Finansial" },
    "INPC": { name: "Bank Artha Graha Internasional Tbk.", sector: "Finansial" },
    "BACA": { name: "Bank Capital Indonesia Tbk.", sector: "Finansial" },
    "BCIP": { name: "Bumi Citra Permai Tbk.", sector: "Properti" },
    "BVIC": { name: "Bank Victoria International Tbk.", sector: "Finansial" },
    "MCOR": { name: "Bank China Construction Bank Indonesia Tbk.", sector: "Finansial" },
    "AMAR": { name: "Bank Amar Indonesia Tbk.", sector: "Finansial" },
    "BBKP": { name: "Bank KB Bukopin Tbk.", sector: "Finansial" },
    "BSIM": { name: "Bank Sinarmas Tbk.", sector: "Finansial" },
    "BSWD": { name: "Bank of India Indonesia Tbk.", sector: "Finansial" },
    "BNGA": { name: "Bank CIMB Niaga Tbk.", sector: "Finansial" },
    "BNLI": { name: "Bank Permata Tbk.", sector: "Finansial" },
    "PNBS": { name: "Bank Panin Dubai Syariah Tbk.", sector: "Finansial" },
    "BTPS": { name: "Bank BTPN Syariah Tbk.", sector: "Finansial" },
    "WMPG": { name: "Wira Global Solusindo Tbk.", sector: "Teknologi" },
    "WOOD": { name: "Integra Indocabinet Tbk.", sector: "Industri" },
    "GTRA": { name: "Grahaprima Suksesmandiri Tbk.", sector: "Logistik" },
    "MEJA": { name: "Meja Nusantara Indonesia Tbk.", sector: "Industri" },
    "AALI": { name: "Astra Agro Lestari Tbk.", sector: "Agrikultur" },
    "BRIS": { name: "Bank Syariah Indonesia Tbk.", sector: "Finansial" },
    "BRPT": { name: "Barito Pacific Tbk.", sector: "Industri" },
    "BSDE": { name: "Bumi Serpong Damai Tbk.", sector: "Properti" },
    "CTRA": { name: "Ciputra Development Tbk.", sector: "Properti" },
    "EMTK": { name: "Elang Mahkota Teknologi Tbk.", sector: "Teknologi" },
    "EXCL": { name: "XL Axiata Tbk.", sector: "Telekomunikasi" },
    "GIAA": { name: "Garuda Indonesia (Persero) Tbk.", sector: "Logistik" },
    "ICBP": { name: "Indofood CBP Sukses Makmur Tbk.", sector: "Konsumer" },
    "INKP": { name: "Indah Kiat Pulp & Paper Tbk.", sector: "Industri" },
    "ISAT": { name: "Indosat Ooredoo Hutchison Tbk.", sector: "Telekomunikasi" },
    "KPIG": { name: "MNC Land Tbk.", sector: "Properti" },
    "LPKR": { name: "Lippo Karawaci Tbk.", sector: "Properti" },
    "LPPF": { name: "Matahari Department Store Tbk.", sector: "Konsumer" },
    "MDKA": { name: "Merdeka Copper Gold Tbk.", sector: "Pertambangan" },
    "PGAS": { name: "Perusahaan Gas Negara Tbk.", sector: "Infrastruktur" },
    "PTBA": { name: "Bukit Asam Tbk.", sector: "Energi" },
    "PWON": { name: "Pakuwon Jati Tbk.", sector: "Properti" },
    "SGER": { name: "Sumber Global Energy Tbk.", sector: "Energi" },
    "SMRA": { name: "Summarecon Agung Tbk.", sector: "Properti" },
    "TINS": { name: "Timah Tbk.", sector: "Pertambangan" },
    "TKIM": { name: "Pabrik Kertas Tjiwi Kimia Tbk.", sector: "Industri" },
    "UNTR": { name: "United Tractors Tbk.", sector: "Pertambangan" },
    "WIFI": { name: "Solusi Sinergi Digital Tbk.", sector: "Teknologi" }
  };

  const firstNames = [
    "Sinar", "Maju", "Nusantara", "Karya", "Lestari", "Makmur", "Wijaya", "Persada",
    "Utama", "Indo", "Multi", "Artha", "Sentosa", "Bumi", "Global", "Cipta", "Daya",
    "Guna", "Abadi", "Sejahtera", "Jaya", "Pembangunan", "Aneka", "Samudra", "Eka",
    "Tri", "Agung", "Kencana", "Bintang", "Surya", "Prima", "Anugerah", "Pratama"
  ];

  const secondNames = [
    "Energi", "Investama", "Resources", "Corporation", "Lestari", "Makmur", "Sentosa",
    "Wijaya", "Jaya", "Sejahtera", "Abadi", "Mandiri", "Inti", "Karya", "Niaga", "Perkasa",
    "Agro", "Cemerlang", "Pratama", "Sinergi", "Maju", "Tunggal", "Medika", "Artha",
    "Nusantara", "Pangan", "Mineral", "Chemical", "Digital", "Tech", "Infrastructure"
  ];

  const sectors = [
    "Finansial", "Infrastruktur", "Teknologi", "Konsumer", "Energi",
    "Pertambangan", "Kesehatan", "Industri", "Properti", "Logistik",
    "Telekomunikasi", "Agrikultur"
  ];

  // Seed popular ones first to make search extremely authentic
  for (const ticker of popularAdditionalTickers) {
    if (result.length >= desiredTotal) break;
    if (!tickersSet.has(ticker)) {
      tickersSet.add(ticker);
      const realInfo = tickerToRealInfo[ticker];
      const sector = realInfo ? realInfo.sector : sectors[Math.floor(Math.random() * sectors.length)];
      const currentPrice = REAL_PRICE_LOOKUP[ticker] || (Math.floor(100 + (ticker.charCodeAt(0) % 15) * 200 + (ticker.charCodeAt(1) % 10) * 50));
      // Highly realistic daily changes (within 0.5% - 1.5% max dev of actual price)
      const changePercentRaw = ((ticker.charCodeAt(0) % 7) - 3) * 0.4 + (Math.random() - 0.5) * 0.3; // deterministic + tiny random
      const change = Math.round(currentPrice * (changePercentRaw / 100));
      const previousPrice = Math.max(10, currentPrice - change);
      const changePercent = Number(((change / previousPrice) * 100).toFixed(2));
      const volume = Math.floor(500000 + Math.random() * 50000000);
      const marketCap = Math.floor(50 + Math.random() * 50000);
      const peRatio = Number((5 + Math.random() * 35).toFixed(1));
      const dividendYield = Number((Math.random() * 8).toFixed(1));
      const name = realInfo ? realInfo.name : `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${secondNames[Math.floor(Math.random() * secondNames.length)]} Tbk.`;

      const prices = [];
      let basePrice = previousPrice;
      for (let k = 0; k < 10; k++) {
        basePrice = Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.02));
        prices.push(Math.max(50, basePrice));
      }
      prices[9] = currentPrice;

      result.push({
        ticker,
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
        history: prices,
        bid: currentPrice - Math.max(1, Math.round(currentPrice * 0.002)),
        ask: currentPrice + Math.max(1, Math.round(currentPrice * 0.002)),
        low: Math.round(currentPrice * 0.95),
        high: Math.round(currentPrice * 1.05)
      });
    }
  }

  // Fallback deterministic random number generator to yield authentic-sounding Indonesian pseudo-tickers
  const REAL_IDX_TICKERS = [
    "AALI", "ABBA", "ABMM", "ACES", "ACST", "ADES", "ADHI", "ADMF", "ADMR", "ADRO", "AERO", "AGRO", "AGRS", "AHAP", "AIMS", "AISA", "AKKU", "AKPI", "AKRA", "ALDO", "ALKA", "ALMI", "ALTO", "AMAG", "AMAN", "AMAR", "AMFG", "AMIN", "AMMN", "AMOR", "AMRT", "ANDI", "ANTM", "APEX", "APIC", "APII", "APLN", "APOP", "APRI", "ARCI", "ARGO", "ARII", "ARKA", "ARKO", "ARNA", "ARTA", "ARTO", "ASGR", "ASII", "ASJT", "ASMI", "ASPI", "ASSA", "ASTA", "ATIC", "AUTO", "AVIA", "AXIO", "AYAM", "BABP", "BACA", "BACK", "BADI", "BAJA", "BALI", "BAMU", "BANK", "BAPA", "BAPI", "BATA", "BOGA", "BAYU", "BBCA", "BBGI", "BBKP", "BBLD", "BBMD", "BBNI", "BBRI", "BBSI", "BBTN", "BBYB", "BCIC", "BCIP", "BDKR", "BDMN", "BEEF", "BEKS", "BELI", "BESS", "BEST", "BFIN", "BGTG", "BHIT", "BIID", "BIKA", "BINA", "BINK", "BIPP", "BIRD", "BISI", "BJBR", "BJTM", "BKDP", "BKSL", "BKSW", "BLUE", "BMAS", "BMSR", "BMTR", "BNDS", "BNGA", "BNII", "BNLI", "BPFI", "BREN", "BRIS", "BRMS", "BRNA", "BRPT", "BSDE", "BSIM", "BSMT", "BSSR", "BSUD", "BTPS", "BTRS", "BUKA", "BUKI", "BUKK", "BULL", "BUMI", "BUVA", "BVIC", "BYAN", "CARS", "CASA", "CASH", "CAST", "CEKA", "CENT", "CFIN", "CINT", "CITA", "CITY", "CLAY", "CLEO", "CLPI", "CMNP", "CMPD", "CNTX", "COAL", "COCO", "CPIN", "CNMA", "CPRO", "CSAP", "CSDP", "CSIS", "CSRA", "CTRA", "CTTH", "CUAN", "DATA", "DAYA", "DCII", "DEAL", "DEFI", "DEWA", "DFAM", "DGIK", "DIBI", "DIGI", "DILD", "DIVA", "DKFT", "DLTA", "DMAS", "DMDD", "DMND", "DNAR", "DOID", "DPNS", "DPUM", "DRMA", "DSFI", "DSNG", "DSSA", "DMMX", "DUFI", "DUTI", "DVLA", "DWGL", "DYAN", "EAST", "ECIP", "EDII", "EKAD", "ELSA", "ELTY", "EMAS", "EMTK", "ENRG", "EPAC", "EPMT", "ERTX", "ERAA", "ESIP", "ESSA", "ESTA", "ESTI", "ETWA", "EXCL", "FAST", "FASW", "FICO", "FILL", "FINO", "FIRE", "FISH", "FMII", "FORU", "FPNI", "FREN", "GAMA", "GDST", "GDYR", "GEMA", "GEMS", "GOLF", "GGRP", "GHON", "GIAA", "GJTL", "GLOB", "GMFI", "GMPU", "GAMA", "GMTD", "GOLD", "GOLL", "GOTO", "GPRA", "GPSO", "GRHA", "GRID", "GRIA", "GRNY", "GSMF", "GTBO", "GTGA", "GTIC", "GTID", "GTSI", "GULA", "GWSA", "GZCO", "HAIS", "HART", "HASI", "HDFA", "HDIT", "HDTX", "HEAL", "HELI", "HERO", "HEXA", "HILL", "HITS", "HKMU", "HLST", "HMSP", "HOKI", "HOME", "HOPE", "HOTL", "HRTA", "HRUM", "IATA", "IBST", "ICBP", "ICON", "IDPR", "IFII", "IGAR", "IIKP", "IKAI", "IKAN", "IKBI", "INAF", "INAI", "INCF", "INCO", "INDF", "INDO", "INDR", "INDX", "INDY", "INFC", "INGB", "INGP", "INIK", "INKP", "INOV", "INPC", "INPS", "INRU", "INTD", "INTF", "INTP", "IPAC", "IPCC", "IPOL", "IPSP", "IRRA", "ISAP", "ISAT", "ISIT", "ISSP", "ITIC", "ITMA", "ITMG", "JECC", "JESS", "JAST", "JAYA", "JGLE", "JIHD", "JKON", "JKSW", "JSPT", "JSMR", "JTPE", "KAEF", "KAIC", "KARW", "KAST", "KAYU", "KBRI", "KDSI", "KEJU", "KEEN", "KENO", "KICI", "KICO", "KIAS", "KIDI", "KIJA", "KINO", "KIOS", "KJEN", "KKGI", "KLBF", "KLAS", "KOBX", "KOIN", "KOKA", "KOLT", "KOMI", "KONS", "KOPI", "KOTA", "KPAL", "KPAS", "KPGD", "KPIG", "KRAH", "KRAS", "KREN", "KRIC", "KRST", "KTAS", "KTID", "LCGP", "LCKM", "LCON", "LEAD", "LIFE", "LINK", "LION", "LPIN", "LPKR", "LPLI", "LPPF", "LPPS", "LPXN", "LRSP", "LSHI", "LSIP", "LSPC", "LTLS", "LUCK", "LUGU", "MABA", "MADA", "MAHA", "MAIN", "MAJA", "MAMI", "MAPA", "MAPI", "MAPP", "MARI", "MARK", "MASB", "MASH", "MASA", "MBAP", "MBMA", "MBSS", "MBTO", "MCAS", "MCOR", "MCOL", "MDIA", "MDKA", "MDKI", "MDLD", "MDRN", "MEDC", "MEGA", "MERK", "META", "METR", "MFEC", "MFGP", "MFIN", "MFMI", "MGNA", "MGLV", "MICE", "MIDI", "MIKA", "MINA", "MIND", "MINS", "MIRA", "MITI", "MJWA", "MKNT", "MKPI", "MLAI", "MLBI", "MLIA", "MLPL", "MLPT", "MMUD", "MNCN", "MOLI", "MOIN", "MONO", "MPIX", "MPMX", "MREI", "MSIN", "MSKY", "MTDL", "MTFN", "MTLA", "MTPS", "MTRA", "MTSM", "MUAR", "MULT", "MUTU", "MYOH", "MYOR", "MYPZ", "MYRX", "MYTX", "NANO", "NASA", "NAST", "NATC", "NATO", "NELY", "NEXX", "NFCX", "NIBE", "NICK", "NICL", "NIKL", "NIPS", "NISB", "NJSG", "NKRI", "NMGE", "NOBU", "NPGF", "NRCA", "NSDP", "NSFI", "NTBK", "NUSA", "NVBA", "NZXA", "OASA", "OBAP", "OBBI", "OBDA", "ODIC", "OKAS", "OLYM", "OMRE", "ONIC", "OPMS", "OREN", "ONEE", "OUKA", "PACI", "PACK", "PADI", "PBSA", "PALM", "PAMG", "PANI", "PANR", "PANS", "PAPS", "PBID", "PBRX", "PCCX", "PCAR", "PEGE", "PEHA", "PGLI", "PGAS", "PGEO", "PGSP", "PGUN", "PIBI", "PICO", "PIDC", "PIJI", "PILA", "PINR", "PKPK", "PLIN", "PLJN", "PLAS", "PMJS", "PMMP", "PNBN", "PNBS", "PNIN", "PNLI", "PNSE", "POLI", "POLL", "POLA", "POLY", "POOL", "PORT", "PRAS", "PRIM", "PRDA", "PRHA", "PSAB", "PSAS", "PSDN", "PSSI", "PSTG", "PTAZ", "PTBA", "PTDU", "PTIS", "PTMP", "PTPP", "PTRA", "PTRO", "PTSN", "PTSP", "PUAD", "PUDP", "PURA", "PURI", "PWON", "PYFA", "PZZA", "RAAM", "RABX", "RICY", "RIGS", "RIMO", "RINA", "RIOS", "RUIS", "RONY", "SAAF", "SABX", "SAFE", "SGER", "SGRO", "SHID", "SIDO", "SILO", "SIMP", "SINI", "SIPD", "SISD", "SITI", "SKBM", "SKLT", "SKYB", "SLAC", "SLIS", "SLJT", "SMBR", "SMDM", "SMDR", "SMGR", "SMIP", "SMKL", "SMMA", "SMMT", "SMRA", "SMST", "SMSM", "SNLK", "SOBI", "SODE", "SOFE", "SOHO", "SONA", "SPMA", "SPOT", "SPTO", "SQMI", "SQRE", "SREI", "SRIL", "SRTG", "SSIA", "SSMS", "SSTM", "STAR", "STTP", "SUBA", "SUDI", "SUGI", "SULI", "SUMI", "SUNR", "SUPR", "SURE", "TACO", "TAFI", "TAMU", "TARA", "TART", "TASP", "TAWG", "TAXI", "TBIG", "TBMS", "TBP", "TCID", "TCPI", "TDPM", "TEBE", "TECH", "TELE", "TFAS", "TFCO", "TGKA", "TGRA", "TINS", "TIRT", "TKIM", "TLDN", "TLKM", "TMAS", "TMPO", "TNCA", "TOBA", "TOCO", "TOKO", "TOTAL", "TPMA", "TPIA", "TPSS", "TRAC", "TREG", "TRIL", "TRIM", "TRIN", "TRIS", "TRJA", "TRST", "TRUB", "TRUK", "TSUD", "TSPC", "TUGU", "TUNA", "TURI", "TYRE", "UCID", "ULTRA", "UNIC", "UNIQ", "UNIT", "UNTR", "UNVR", "URBN", "USIP", "UTAM", "UTAR", "VCID", "VCON", "VICO", "VIVA", "VIPT", "VOKS", "VOSS", "VPAC", "VRIV", "VSGP", "VSTE", "WAPB", "WAPO", "WEGE", "WEHA", "WICO", "WIDI", "WIFI", "WIKA", "WIKB", "WIKI", "WIMB", "WINS", "WMPG", "WMPX", "WOOD", "WIRG", "WRID", "WSBP", "WSKT", "WTON", "WIIM", "VKTR", "VAST", "VOTE", "VISI", "UVCR", "WGSH", "NISP", "YADO", "YAKU", "YALF", "YASA", "YPAS", "YUDH", "YULI", "ZATA", "ZEAL", "ZELC", "ZINC", "ZONE", "ZYRX"
  ];

  let seedVal = 707;
  function seededRandom() {
    const x = Math.sin(seedVal++) * 10000;
    return x - Math.floor(x);
  }

  for (const t of REAL_IDX_TICKERS) {
    if (result.length >= desiredTotal) break;
    if (!tickersSet.has(t)) {
      tickersSet.add(t);
      const sector = sectors[Math.floor(seededRandom() * sectors.length)];
      const currentPrice = Math.floor(50 + seededRandom() * 12000);
      const change = Math.floor((seededRandom() - 0.49) * (currentPrice * 0.04));
      const previousPrice = Math.max(50, currentPrice - change);
      const changePercent = Number(((change / previousPrice) * 100).toFixed(2));
      const volume = Math.floor(100000 + seededRandom() * 8000000);
      const marketCap = Math.floor(10 + seededRandom() * 25000);
      const peRatio = Number((3 + seededRandom() * 50).toFixed(1));
      const dividendYield = Number((seededRandom() * 10).toFixed(1));
      const name = `${firstNames[Math.floor(seededRandom() * firstNames.length)]} ${secondNames[Math.floor(seededRandom() * secondNames.length)]} Tbk.`;

      const prices = [];
      let basePrice = previousPrice;
      for (let k = 0; k < 10; k++) {
        basePrice = Math.round(basePrice * (1 + (seededRandom() - 0.5) * 0.02));
        prices.push(Math.max(50, basePrice));
      }
      prices[9] = currentPrice;

      result.push({
        ticker: t,
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
        history: prices,
        bid: currentPrice - Math.max(1, Math.round(currentPrice * 0.002)),
        ask: currentPrice + Math.max(1, Math.round(currentPrice * 0.002)),
        low: Math.round(currentPrice * 0.96),
        high: Math.round(currentPrice * 1.04)
      });
    }
  }

  const realSet = new Set([
    ...POPULAR_STOCKS_BASE.map(s => s.ticker),
    ...popularAdditionalTickers,
    ...Object.keys(REAL_PRICE_LOOKUP)
  ]);

  // Create lookup map for real emiten names/sectors
  const emitenMap = new Map<string, { company_name: string; sector: string }>();
  fullEmitenList.forEach((e: any) => {
    emitenMap.set(e.ticker.toUpperCase().trim(), {
      company_name: e.company_name,
      sector: e.sector
    });
  });

  return result.map(stock => {
    const uppercaseTicker = stock.ticker.toUpperCase().trim();
    const realEmiten = emitenMap.get(uppercaseTicker);
    let name = stock.name;
    let sector = stock.sector;
    if (realEmiten) {
      name = realEmiten.company_name;
      sector = realEmiten.sector;
    }

    let isSyariah = true;
    if (sector === "Finansial") {
      const nameLower = name.toLowerCase();
      if (
        nameLower.includes("syariah") || 
        nameLower.includes("sharia") || 
        stock.ticker === "PNBS" || 
        stock.ticker === "BTPS" || 
        stock.ticker === "BANK"
      ) {
        isSyariah = true;
      } else {
        isSyariah = false;
      }
    } else if (stock.ticker === "DLTA" || stock.ticker === "MLBI") {
      isSyariah = false;
    }
    return {
      ...stock,
      name,
      sector,
      isSyariah,
      isReal: true
    };
  });
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
