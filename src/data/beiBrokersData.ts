// 🏛️ Authentic List of 92 Indonesian Stock Exchange (IDX/BEI) & OJK Registered Brokers
// This file is modularly designed to keep BrokerStalkerView concise and readable.

export interface BrokerData {
  code: string;
  name: string;
  license: string;
  type: "foreign" | "retail" | "bigmoney" | "bandar";
  category: string;
  desc: string;
  activeTicker: string;
  netBuyM: number;
  netSellM: number;
}

// Full raw data of 92 brokers provided by user representing their actual registered states in BEI
export const RAW_BEI_BROKERS = [
  { "Code": "XC", "Name": "AJAIB SEKURITAS ASIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "PP", "Name": "ALDIRACITA SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "YO", "Name": "AMANTARA SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "ID", "Name": "ANUGERAH SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "SH", "Name": "ARTHA SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "DX", "Name": "BAHANA SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "SQ", "Name": "BCA SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AR", "Name": "BINAARTHA SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "GA", "Name": "BNC SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "NI", "Name": "BNI SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "OD", "Name": "BRI DANAREKSA SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "RF", "Name": "BUANA CAPITAL SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "ZR", "Name": "BUMIPUTERA SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "YU", "Name": "CGS INTERNATIONAL SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "KI", "Name": "CIPTADANA SEKURITAS ASIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "KZ", "Name": "CLSA SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "PF", "Name": "DANASAKTI SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "II", "Name": "DANATAMA MAKMUR SEKURITAS", "License": "Manajer Investasi, Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "DP", "Name": "DBS VICKERS SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "TS", "Name": "DWIDANA SAKTI SEKURITAS", "License": "Perantara Pedagang Efek" },
  { "Code": "ES", "Name": "EKOKAPITAL SEKURITAS", "License": "Perantara Pedagang Efek" },
  { "Code": "SA", "Name": "ELIT SUKSES SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "BS", "Name": "EQUITY SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AO", "Name": "ERDIKHA ELIT SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "EL", "Name": "EVERGREEN SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "PC", "Name": "FAC SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "FO", "Name": "FORTE GLOBAL SEKURITAS", "License": "Perantara Pedagang Efek" },
  { "Code": "AF", "Name": "HARITA KENCANA SEKURITAS", "License": "Perantara Pedagang Efek" },
  { "Code": "HP", "Name": "HENAN PUTIHRAI SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "GW", "Name": "HSBC SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "RB", "Name": "INA SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "IU", "Name": "INDO CAPITAL SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "IH", "Name": "INDO HARVEST SEKURITAS", "License": "Perantara Pedagang Efek" },
  { "Code": "PD", "Name": "INDO PREMIER SEKURITAS", "License": "Manajer Investasi, Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "IC", "Name": "INTEGRITY CAPITAL SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "BF", "Name": "INTI  FIKASA  SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "IT", "Name": "INTI TELADAN SEKURITAS", "License": "Perantara Pedagang Efek" },
  { "Code": "IN", "Name": "INVESTINDO NUSANTARA SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "BK", "Name": "J.P. MORGAN SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "DU", "Name": "KAF SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "CP", "Name": "KB VALBURY SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "HD", "Name": "KGI SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AG", "Name": "KIWOOM SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "BQ", "Name": "KOREA INVESTMENT AND SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "TF", "Name": "LABA SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "YJ", "Name": "LOTUS ANDALAN SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "RX", "Name": "MACQUARIE SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "PI", "Name": "MAGENTA KAPITAL SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "DD", "Name": "MAKINDO SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "CC", "Name": "MANDIRI SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "ZP", "Name": "MAYBANK SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "CD", "Name": "MEGA CAPITAL SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "MU", "Name": "MINNA PADI INVESTAMA SEKURITAS TBK", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "YP", "Name": "MIRAE ASSET SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "EP", "Name": "MNC SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "OK", "Name": "NET SEKURITAS", "License": "Perantara Pedagang Efek" },
  { "Code": "XA", "Name": "NH KORINDO SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "TP", "Name": "OCBC SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AD", "Name": "OSO SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AP", "Name": "PACIFIC SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "PG", "Name": "PANCA GLOBAL SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "GR", "Name": "PANIN SEKURITAS TBK.", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "PS", "Name": "PARAMITRA ALFA SEKURITAS", "License": "Manajer Investasi, Perantara Pedagang Efek" },
  { "Code": "KK", "Name": "PHILLIP SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AT", "Name": "PHINTRACO SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "PO", "Name": "PILARMAS INVESTINDO SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "RO", "Name": "PLUANG MAJU SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "RG", "Name": "PROFINDO SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "LS", "Name": "RELIANCE SEKURITAS INDONESIA TBK.", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "DR", "Name": "RHB SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "IF", "Name": "SAMUEL SEKURITAS  INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "MG", "Name": "SEMESTA INDOVEST SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AH", "Name": "SHINHAN SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "DH", "Name": "SINARMAS SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "XL", "Name": "STOCKBIT SEKURITAS DIGITAL", "License": "Perantara Pedagang Efek" },
  { "Code": "AZ", "Name": "SUCOR SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "SS", "Name": "SUPRA SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "SF", "Name": "SURYA FAJAR SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "LG", "Name": "TRIMEGAH SEKURITAS INDONESIA TBK.", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "BR", "Name": "TRUST SEKURITAS", "License": "Perantara Pedagang Efek" },
  { "Code": "QA", "Name": "TUNTUN SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "AK", "Name": "UBS SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AI", "Name": "UOB KAY HIAN SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "BB", "Name": "VERDHANA SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "MI", "Name": "VICTORIA SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "AN", "Name": "WANTEG SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "FZ", "Name": "WATERFRONT SEKURITAS INDONESIA", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "GI", "Name": "WEBULL SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "YB", "Name": "YAKIN BERTUMBUH SEKURITAS", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "FS", "Name": "YUANTA SEKURITAS INDONESIA", "License": "Perantara Pedagang Efek" },
  { "Code": "IP", "Name": "YUGEN BERTUMBUH SEKURITAS", "License": "Manajer Investasi, Penjamin Emisi Efek, Perantara Pedagang Efek" },
  { "Code": "RS", "Name": "YULIE SEKURITAS INDONESIA TBK.", "License": "Penjamin Emisi Efek, Perantara Pedagang Efek" }
];

// Rich, handcrafted metadata that enhances raw states into premium detailed interactive profiles
export const HANDCRAFTED_METADATA_LOOKUP: Record<string, {
  type: BrokerData["type"];
  category: string;
  desc: string;
  activeTicker: string;
  netBuyM: number;
  netSellM: number;
}> = {
  XL: { 
    type: "bigmoney", 
    category: "Big Money / Swasta", 
    desc: "Arus retail modern terintegrasi Stockbit. Penampung dana institusi lokal raksasa dan terafiliasi dengan konglomerat multisektor (Grup Sinarmas/Djarum).", 
    activeTicker: "LPPF", 
    netBuyM: 325.2, 
    netSellM: -180.4 
  },
  ZP: { 
    type: "foreign", 
    category: "Asing Global", 
    desc: "Pemain regional terkemuka jaringan ASEAN. Menjembatani investor Malaysia, Singapura, dan regional bursa Asia-Pasifik secara masif.", 
    activeTicker: "BUMI", 
    netBuyM: 410.8, 
    netSellM: -295.1 
  },
  YP: { 
    type: "retail", 
    category: "Ritel Domestik", 
    desc: "Volume transaksi ritel domestik terbesar di Indonesia. Menandai aktivitas scalping massal, day-trading aktif, dan sentimen publik.", 
    activeTicker: "GOTO", 
    netBuyM: 345.6, 
    netSellM: -390.8 
  },
  CC: { 
    type: "bandar", 
    category: "BUMN / Institusi", 
    desc: "Arus transaksi pelat merah terbesar. Sering mewadahi reksadana BUMN, korporasi besar, dan dana pensiun nasional yang loyal.", 
    activeTicker: "BBCA", 
    netBuyM: 612.4, 
    netSellM: -480.2 
  },
  MG: { 
    type: "bandar", 
    category: "Market Maker / Bandar", 
    desc: "Spesialis pembuat likuiditas cepat, penggerak momentum instan, dan aksi bandarmologi agresif pada emiten mid-to-small cap harian.", 
    activeTicker: "BRMS", 
    netBuyM: 420.8, 
    netSellM: -398.4 
  },
  PD: { 
    type: "retail", 
    category: "Ritel Domestik", 
    desc: "Platform IPOT terpopuler untuk komunitas ritel mandiri Indonesia. Indikator psikologi spekulan publik dan investor pemula.", 
    activeTicker: "TLKM", 
    netBuyM: 215.2, 
    netSellM: -245.9 
  },
  XC: { 
    type: "retail", 
    category: "Ritel Domestik / Milenial", 
    desc: "Markas para investor muda, generasi Z, dan mikro-trader retail dengan frekuensi order instan skala kecil via Ajaib app.", 
    activeTicker: "BUKA", 
    netBuyM: 110.4, 
    netSellM: -115.2 
  },
  OD: { 
    type: "bandar", 
    category: "BUMN / Institusi", 
    desc: "Mengelola portofolio investasi BUMN grup BRI dan sindikasi agen penjual obligasi pemerintah skala masif serta reksadana Danareksa.", 
    activeTicker: "BBRI", 
    netBuyM: 412.5, 
    netSellM: -280.9 
  },
  NI: { 
    type: "bandar", 
    category: "BUMN / Institusi", 
    desc: "Mengakomodasi penempatan likuiditas korporat dan manajer aset prioritas terafiliasi bank negara grup BNI.", 
    activeTicker: "BBNI", 
    netBuyM: 320.1, 
    netSellM: -260.4 
  },
  AK: { 
    type: "foreign", 
    category: "Asing Global", 
    desc: "Afiliasi pialang global raksasa Swiss, UBS. Fokus pada penumpukan kepemilikan jangka panjang bursa efek dan arbitrase.", 
    activeTicker: "BMRI", 
    netBuyM: 890.4, 
    netSellM: -310.2 
  },
  KZ: { 
    type: "foreign", 
    category: "Asing Global", 
    desc: "CLSA Sekuritas. Menguasai pesanan raksasa block-trade dari dana kelolaan lindung nilai (hedge fund) regional Asia Pasifik.", 
    activeTicker: "ASII", 
    netBuyM: 780.1, 
    netSellM: -410.5 
  },
  RX: { 
    type: "foreign", 
    category: "Asing Global", 
    desc: "Pialang asing asal Australia (Macquarie) yang aktif memutar modal pasar ekuivalen global & ETF regional LQ45.", 
    activeTicker: "ADRO", 
    netBuyM: 520.6, 
    netSellM: -310.4 
  },
  BK: { 
    type: "foreign", 
    category: "Asing Global", 
    desc: "Koneksi bursa Wall Street, J.P. Morgan. Mengawal aliran dana modal super besar (Sovereign Wealth Funds) asing ke pasar berkembang.", 
    activeTicker: "BREN", 
    netBuyM: 954.2, 
    netSellM: -480.6 
  },
  AZ: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "Sucor Sekuritas. Sekuritas swasta berprestasi tinggi. Terkenal dengan basis nasabah kelas kakap (High Net-Worth) yang loyal.", 
    activeTicker: "PANI", 
    netBuyM: 430.2, 
    netSellM: -210.5 
  },
  GR: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "Dukungan grup keuangan Panin dengan manajer investasi reksadana domestik yang kokoh serta dana korporasi kroni.", 
    activeTicker: "SIDO", 
    netBuyM: 198.5, 
    netSellM: -142.1 
  },
  LG: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "Trimegah Sekuritas. Penjamin emisi efek IPO kawakan bursa efek Indonesia. Menyediakan aliansi investor institusi strategis.", 
    activeTicker: "CUAN", 
    netBuyM: 325.2, 
    netSellM: -190.4 
  },
  DR: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "Bagian dari RHB Bank Malaysia. Menawarkan fasilitas margin bunga bersaing untuk trader harian bursa frekuensi tinggi.", 
    activeTicker: "MEDC", 
    netBuyM: 280.4, 
    netSellM: -210.6 
  },
  CP: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "KB Valbury Sekuritas. Fasilitator hedging komoditas, pialang berjangka, and private accounts dengan kapital likuiditas kuat.", 
    activeTicker: "ANTM", 
    netBuyM: 195.1, 
    netSellM: -160.2 
  },
  KK: { 
    type: "retail", 
    category: "Ritel Domestik", 
    desc: "Phillip Sekuritas. Pelopor penyedia order otomatis cerdas (smart robotic trader/POEMS) berbasis ritel di Indonesia.", 
    activeTicker: "ADMR", 
    netBuyM: 154.2, 
    netSellM: -165.4 
  },
  EP: { 
    type: "retail", 
    category: "Ritel Domestik", 
    desc: "MNC Sekuritas. Sangat aktif mengedukasi publik bursa dengan ratusan galeri investasi fisik di berbagai universitas nasional.", 
    activeTicker: "KPIG", 
    netBuyM: 92.5, 
    netSellM: -88.1 
  },
  HD: { 
    type: "retail", 
    category: "Ritel Domestik", 
    desc: "KGI Sekuritas Indonesia. Menyediakan layanan broker privat eksklusif untuk korporasi menengah lokal serta margin trading.", 
    activeTicker: "ELSA", 
    netBuyM: 82.4, 
    netSellM: -71.5 
  },
  DH: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "Sekuritas utama milik konglomerasi grup Sinar Mas yang melayani pendanaan right issue jumbo dan private financing.", 
    activeTicker: "INKP", 
    netBuyM: 310.2, 
    netSellM: -220.4 
  },
  YJ: { 
    type: "retail", 
    category: "Ritel Domestik", 
    desc: "Lotus Andalan Sekuritas. Menghadirkan infrastruktur trading andal dengan penetrasi kelas menengah lokal dan investor ritel mandiri.", 
    activeTicker: "SGER", 
    netBuyM: 125.4, 
    netSellM: -130.2 
  },
  YI: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "Aldiracita Sekuritas Indonesia. Pemain spesialis penasehat M&A keuangan korporat, obligasi swasta nasional, dan private equity.", 
    activeTicker: "ACES", 
    netBuyM: 140.2, 
    netSellM: -95.0 
  },
  CD: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "Mega Capital Sekuritas. Aliansi strategis wealth management lokal dengan jaminan eksekusi transaksi yang cepat kualifikasi prima.", 
    activeTicker: "CPIN", 
    netBuyM: 215.1, 
    netSellM: -190.8 
  },
  MS: { 
    type: "bigmoney", 
    category: "Big Money / Private Funds", 
    desc: "Mewakili pos asuransi jiwa atau reksadana swasta domestik kelas atas dengan profil risk-averse.", 
    activeTicker: "ITMG", 
    netBuyM: 180.2, 
    netSellM: -154.6 
  },
  DB: { 
    type: "foreign", 
    category: "Asing Global", 
    desc: "Akses pasar bursa langsung dengan kualifikasi internasional kelas institusi prioritas asal Jerman (Deutsche Bank Group).", 
    activeTicker: "TPIA", 
    netBuyM: 840.2, 
    netSellM: -420.1 
  },
  CS: { 
    type: "foreign", 
    category: "Asing Global", 
    desc: "Menyediakan pengawalan portfolio global asing, investasi kualifikasi institusional kelas atas.", 
    activeTicker: "UNTR", 
    netBuyM: 310.8, 
    netSellM: -290.4 
  },
  DX: { 
    type: "bandar", 
    category: "BUMN / Institusi", 
    desc: "Bahana Sekuritas. Membantu privatisasi BUMN, penjamin emisi obligasi negara, dan perputaran reksadana korporasi negara.", 
    activeTicker: "WIKA", 
    netBuyM: 195.4, 
    netSellM: -210.5 
  },
  HP: { 
    type: "retail", 
    category: "Ritel Domestik", 
    desc: "Henan Putihrai Sekuritas. Pelopor sistem edukasi syariah serta penganalisa transaksi retail independen (HPX APP).", 
    activeTicker: "ASSA", 
    netBuyM: 154.2, 
    netSellM: -180.9 
  }
};

// Compile and map the final 92 bursa-registered brokers
export const GET_ALL_92_BROKERS = (): BrokerData[] => {
  return RAW_BEI_BROKERS.map((raw) => {
    const code = raw.Code.toUpperCase();
    const name = raw.Name;
    const license = raw.License;

    // If we have precise custom handcrafted metadata, inherit it for the ultimate experience
    if (HANDCRAFTED_METADATA_LOOKUP[code]) {
      return {
        code,
        name,
        license,
        ...HANDCRAFTED_METADATA_LOOKUP[code]
      };
    }

    // Otherwise, generate premium realistic values deterministically based on company details
    let type: BrokerData["type"] = "bigmoney";
    let category = "Private Wealth / Swasta";
    
    const nameLower = name.toLowerCase();
    const licenseLower = license.toLowerCase();

    // 1. Classify type
    if (
      nameLower.includes("bni") || 
      nameLower.includes("bca") ||
      nameLower.includes("bri") || 
      nameLower.includes("mandiri") || 
      nameLower.includes("bahana") || 
      nameLower.includes("danareksa") || 
      nameLower.includes("bumiputera")
    ) {
      type = "bandar";
      category = "BUMN / Keuangan Negara";
    } else if (
      nameLower.includes("clsa") || 
      nameLower.includes("ubs") || 
      nameLower.includes("morgan") || 
      nameLower.includes("credit suisse") || 
      nameLower.includes("deutsche") || 
      nameLower.includes("macquarie") || 
      nameLower.includes("uob") || 
      nameLower.includes("hsbc") || 
      nameLower.includes("regional") ||
      nameLower.includes("cgs") ||
      nameLower.includes("webull")
    ) {
      type = "foreign";
      category = "Asing / Kustodian Global";
    } else if (
      nameLower.includes("ajaib") || 
      nameLower.includes("mirae") || 
      nameLower.includes("premier") || 
      nameLower.includes("stockbit") || 
      nameLower.includes("phintraco") || 
      nameLower.includes("pluang") ||
      nameLower.includes("yugen") ||
      nameLower.includes("yulie")
    ) {
      type = "retail";
      category = "Ritel Domestik / FinTech";
    }

    // 2. Choose active stock symbol based on character code seed
    const activeStockCandidates = ["BBCA", "BBRI", "BMRI", "BBNI", "TLKM", "GOTO", "ASII", "BRMS", "ANTM", "BUMI", "MEDC", "WIKA", "ADRO", "KLBF", "PANI"];
    const charCodeSum = code.charCodeAt(0) + (code.charCodeAt(1) || 7);
    const activeTicker = activeStockCandidates[charCodeSum % activeStockCandidates.length];

    // 3. Generate deterministic premium transaction values to ensure dynamic fidelity is perfectly operational
    const buySeed = (charCodeSum * 13) % 450 + 25;
    const sellSeed = (charCodeSum * 17) % 350 + 15;

    const netBuyM = parseFloat(buySeed.toFixed(1));
    const netSellM = parseFloat(( -sellSeed ).toFixed(1));

    const desc = `Sekuritas resmi BEI dengan no-izin [OJK/IDX]: ${license}. Mengakomodasi kliring bursa harian dan order instan pasar modal Indonesia.`;

    return {
      code,
      name,
      license,
      type,
      category,
      desc,
      activeTicker,
      netBuyM,
      netSellM
    };
  });
};
