/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Terminal, ShieldCheck, Download, Copy, Play, Check, 
  Settings, Server, Info, AlertTriangle, Key, Code2, Cpu,
  ExternalLink, Eye, Sparkles
} from "lucide-react";
import PriceDisplay from "./PriceDisplay";
import { getStockUploader } from "../services/market/idx/getStockUploader";

export default function DeveloperCenterView() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [testApiEndpoint, setTestApiEndpoint] = useState<string>("/api/health");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loadingTest, setLoadingTest] = useState<boolean>(false);
  const [widgetCode, setWidgetCode] = useState<string>("");

  // IDX Stock Uploader test states
  const [idxTypeIndex, setIdxTypeIndex] = useState<string>("stockIndex");
  const [idxYear, setIdxYear] = useState<string>("2024");
  const [idxTableIndex, setIdxTableIndex] = useState<string>("stockIndex");
  const [idxUploaderLoading, setIdxUploaderLoading] = useState<boolean>(false);
  const [idxUploaderResult, setIdxUploaderResult] = useState<string | null>(null);
  const [idxError, setIdxError] = useState<string | null>(null);

  const handleFetchIdxUploader = async () => {
    setIdxUploaderLoading(true);
    setIdxError(null);
    setIdxUploaderResult(null);
    try {
      const result = await getStockUploader(idxTypeIndex, idxYear, idxTableIndex);
      setIdxUploaderResult(result);
    } catch (err: any) {
      setIdxError(err.message || "Gagal mengambil data IDX");
    } finally {
      setIdxUploaderLoading(false);
    }
  };

  // Custom configuration states for developer downloads
  const [customPort, setCustomPort] = useState<string>("3000");
  const [customTheme, setCustomTheme] = useState<string>("Dark - Cybermatic");

  useEffect(() => {
    fetch("/ihsg-chart.html")
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Gagal mengambil widget HTML");
      })
      .then((text) => setWidgetCode(text))
      .catch((err) => console.warn(err));
  }, []);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleTestEndpoint = async () => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const response = await fetch(testApiEndpoint);
      if (response.ok) {
        const data = await response.json();
        setTestResult(JSON.stringify(data, null, 2));
      } else {
        setTestResult(`Error: ${response.status} - ${response.statusText}`);
      }
    } catch (e: any) {
      setTestResult(`Gagal terhubung dengan endpoint lokal: ${e.message}`);
    } finally {
      setLoadingTest(false);
    }
  };

  const codeInstallCommands = `
# 1. Unduh Kode Sumber dari Menu Ekspor AI Studio (Bilah kanan atas)
# 2. Buka folder proyek di Terminal atau VS Code Anda sewaktu offline.

# 3. Instalasi paket Dependensi Proyek
npm install

# 4. Salin template .env.example menjadi .env lokal Anda
cp .env.example .env

# 5. Jalankan server pengembangan lokal (Vite + Express)
npm run dev

# 6. Jalankan build produksi sewaktu siap hosting mandiri
npm run build
`.trim();

  const envTemplateCode = `
# Parameter Konfigurasi Server Mandiri SAHAM INDO
PORT=${customPort}
NODE_ENV=development

# 🔑 Masukkan Kunci API Gemini Anda untuk mengaktifkan AI Market Tracer
GEMINI_API_KEY=AIzaSyYourOwnGeminiAPIKeyHere_GetItFromGoogleAIStudio
`.trim();

  const customServerCode = `
import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || ${customPort};

// 1. Inisialisasi Kunci AI Gemini secara aman di server (Sisi Backend)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json());

// 2. Layanan API Lokal untuk Laporan Saham AI Gemini
app.post("/api/analyze-stock", async (req, res) => {
  const { ticker, name, currentPrice, peRatio, sector, question } = req.body;
  try {
    const prompt = \`Lakukan riset pasar mendalam untuk saham \${ticker} - \${name} dengan harga saat ini Rp \${currentPrice}. Sektor: \${sector}. Rasio P/E: \${peRatio}. Pertanyaan pengguna: \${question || "Berikan ulasan fundamental lengkap"}\`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (err) {
    res.status(500).json({ error: "Layanan analitis Gemini sedang sibuk." });
  }
});

app.listen(PORT, () => {
  console.log(\`Aplikasi SAHAM INDO berjalan aman di port \${PORT}\`);
});
`.trim();

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
          <Terminal className="text-blue-500 w-5 h-5" /> Pusat Pengembangan Mandiri (Self-Developer Portal)
        </h2>
        <p className="text-xs text-slate-400">Ikuti panduan ini untuk mengunduh kode program, menjalankan di komputer lokal, dan meng-host website ini secara mandiri.</p>
      </div>

      {/* Real-time Ticker Showcase Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-850/80 space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
          <Sparkles className="text-cyan-400 w-5 h-5 animate-pulse" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            Integrasi Data Bursa Real-Time & Caching SWR
          </h3>
        </div>
        
        <p className="text-xs text-slate-400 max-w-4xl leading-relaxed">
          Uji coba fungsi <code>fetchDataSaham(kodeEmiten)</code> dan hook <code>useStockData(symbol)</code> yang terhubung langsung dengan cache SWR. Komponen di bawah akan melakukan <strong>auto-polling (request sinkronisasi otomatis) setiap 60 detik</strong>. Apabila bursa offline, sistem protektif otomatis beralih ke cache IDX lokal agar aplikasi dijamin bebas crash!
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-6 space-y-4">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
              💡 Live Demo: Komponen &lt;PriceDisplay /&gt; Aktif (Pembaruan Otomatis)
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <PriceDisplay symbol="BBCA" />
              <PriceDisplay symbol="TLKM" />
              <PriceDisplay symbol="GOTO" />
              <PriceDisplay symbol="BBRI" />
              <PriceDisplay symbol="BREN" />
              <PriceDisplay symbol="ADRO" />
            </div>

            <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-xl text-[11px] text-cyan-300 leading-normal flex gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p>
                Semua nominal mata uang dan persen di atas diformat secara otomatis mengikuti <strong>Standar Bursa Efek Indonesia (IDX)</strong>: Karakter titik sebagai pemisah ribuan dan karakter koma untuk pecahan desimal.
              </p>
            </div>
          </div>

          <div className="xl:col-span-6 space-y-2">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
              💻 Cuplikan Integrasi (Implementasi di Kode Sumber):
            </span>
            <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-900 text-[11px] font-mono text-blue-300 h-[215px] overflow-y-auto leading-relaxed">
              <pre className="whitespace-pre overflow-x-auto text-slate-300 select-all">
{`// 1. Ambil data dengan custom hook SWR di react
import { useStockData } from '../services/StockDataFetcher';

const MyWidget = () => {
  const { price, percent, isLoading } = useStockData('BBCA');

  if (isLoading && !price) return <div>Memuat...</div>;

  return (
    <div className="price-card">
      <h3 className="font-bold">BBCA</h3>
      {/* format nominal rupiah id-ID */}
      <h1 className={percent >= 0 ? "text-emerald-400" : "text-rose-450"}>
        Rp {price.toLocaleString('id-ID')}
      </h1>
      <p>{percent.toFixed(2)}%</p>
    </div>
  );
};`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* IDX Stock Uploader API Playground Section */}
      <div id="idx-uploader-playground" className="glass-card rounded-2xl p-6 border border-slate-850/80 space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
          <Terminal className="text-emerald-400 w-5 h-5" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            IDX Stock Uploader API Playground
          </h3>
        </div>

        <p className="text-xs text-slate-400 max-w-4xl leading-relaxed">
          Uji fungsi <code>getStockUploader(typeIndex, year, tableIndex)</code> langsung ke server Bursa Efek Indonesia (IDX) sekunder. Pengambilan ini menggunakan proksi server full-stack yang aman untuk menghindari pembatasan CORS browser.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900/60">
            <div className="space-y-1">
              <label id="lbl-type-index" className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-sans">Type Index (typeIndex)</label>
              <select 
                id="sel-type-index"
                value={idxTypeIndex} 
                onChange={(e) => setIdxTypeIndex(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="stockIndex">Indeks Saham (stockIndex)</option>
                <option value="marginStocks">Saham Margin (marginStocks)</option>
                <option value="preOpeningStocks">Saham Pra-Pembukaan (preOpeningStocks)</option>
                <option value="liquidityStocks">Saham Likuid (liquidityStocks)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label id="lbl-year" className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-sans">Year (year)</label>
                <input 
                  id="inp-year"
                  type="text" 
                  value={idxYear} 
                  onChange={(e) => setIdxYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label id="lbl-table" className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-sans">Table (tableIndex)</label>
                <input 
                  id="inp-table"
                  type="text" 
                  value={idxTableIndex} 
                  onChange={(e) => setIdxTableIndex(e.target.value)}
                  placeholder="e.g. stockIndex"
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <button
              id="btn-fetch-uploader"
              onClick={handleFetchIdxUploader}
              disabled={idxUploaderLoading}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                idxUploaderLoading 
                  ? 'bg-slate-900 text-slate-500 border-slate-850 cursor-not-allowed'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50'
              }`}
            >
              {idxUploaderLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent" />
                  <span>MENGHUBUNGI IDX...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>KIRIM PERMINTAAN</span>
                </>
              )}
            </button>
          </div>

          {/* Result Terminal */}
          <div className="lg:col-span-7 flex flex-col h-[230px]">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-1.5">
              <span>Hasil JSON Respons dari Server IDX</span>
              {idxUploaderResult && (
                <button 
                  id="btn-copy-idx-result"
                  onClick={() => copyToClipboard(idxUploaderResult, "idx-uploader")}
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition-all"
                >
                  {copiedSection === "idx-uploader" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-sans">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="font-sans">Salin Respons</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div id="idx-uploader-response-box" className="flex-1 bg-slate-950 rounded-xl border border-slate-900 p-4 overflow-auto font-mono text-[11px] relative">
              {idxUploaderLoading && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-400 border-t-transparent" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse font-sans">
                    Melakukan jabat tangan SSL & mengunduh berkas uploader...
                  </span>
                </div>
              )}

              {idxError && (
                <div className="text-rose-400 p-2 border border-rose-950/70 bg-rose-950/20 rounded-lg flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase tracking-wide text-[10px] font-sans">Kesalahan Penarikan</span>
                    <span className="leading-relaxed">{idxError}</span>
                  </div>
                </div>
              )}

              {!idxUploaderLoading && !idxUploaderResult && !idxError && (
                <div className="h-full flex items-center justify-center text-slate-600 text-center text-xs">
                  Sediakan parameter di panel kiri dan klik &quot;Kirim Permintaan&quot; untuk menguji real-time uploader data.
                </div>
              )}

              {idxUploaderResult && (
                <pre className="text-emerald-400 whitespace-pre overflow-x-auto selection:bg-emerald-500/20">
                  {idxUploaderResult}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Neon Chart Widget Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-855/80 space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-red-500/10 transition-all duration-700"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-400" /> WIDGET PORTABEL
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Chart.js 4.4</span>
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans mt-1">
              IHSG Real-Time Neon Terminal (Single-File HTML)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-4xl leading-normal font-sans">
              Sebuah halaman tunggal (single-file HTML) dengan desain gelap minimalis modern, bergaris merah neon bercahaya ala terminal trading Bloomberg/Reuters. Terkoneksi otomatis ke data live bursa dengan interval pembaruan 60 detik.
            </p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => window.open('/ihsg-chart.html', '_blank')}
              className="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-rose-500 border border-red-500/20 hover:border-red-500/40 rounded-xl cursor-pointer hover:shadow-glow transition-all flex items-center justify-center gap-1.5 font-sans"
            >
              <ExternalLink className="w-3.5 h-3.5" /> BUKA FULLSCREEN
            </button>
            <button 
              onClick={() => copyToClipboard(widgetCode || "<!-- Memuat kode widget... -->", "widget")}
              className="flex-1 md:flex-none px-4 py-2 text-xs font-bold bg-[#111c2e] hover:bg-[#182942] border border-slate-800 text-slate-350 hover:text-white rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 font-sans"
            >
              {copiedSection === "widget" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSection === "widget" ? "TERSLIN!" : "COPY SOURCE HTML"}
            </button>
          </div>
        </div>

        {/* Live Standalone Visualizer Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Panel: Standalone Interactive Preview inside Frame */}
          <div className="lg:col-span-7 space-y-2">
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 font-bold uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-red-500" /> Live Interactive Preview (Sandbox Frame)
            </span>
            <div className="w-full h-[400px] bg-slate-950 rounded-2xl border border-slate-900/80 overflow-hidden shadow-2xl relative">
              <iframe 
                src="/ihsg-chart.html" 
                title="IHSG Standalone Neon Widget"
                className="w-full h-full border-0 rounded-2xl"
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Right Panel: Code Quick Sniffer & Instructions */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5 text-blue-500" /> Code Quick Peek (Pratinjau Kode Pendek)
              </span>
              <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-900 overflow-hidden text-[11px] font-mono text-blue-300 max-h-[310px] overflow-y-auto leading-relaxed">
                <pre className="whitespace-pre-wrap select-all leading-relaxed my-0 overflow-x-auto pr-1">
                  {widgetCode || "<!-- Sedang memuat kode dari /public/ihsg-chart.html ... -->"}
                </pre>
              </div>
            </div>

            <div className="bg-[#111322]/40 rounded-xl p-4 border border-slate-900 text-[11px] leading-relaxed text-slate-400 space-y-1.5 font-sans">
              <span className="font-bold text-white block">💡 Keunggulan Kode Satu-Berkas ini:</span>
              <p>Desain modular portabel premium ini menawarkan:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Instalasi Nol:</strong> Cukup buka berkas HTML langsung tanpa compiler apa pun.</li>
                <li><strong>Glow Render:</strong> Visualisasi Chart.js glow-curve gradient khusus.</li>
                <li><strong>Auto-Refresh 60s:</strong> Sinkron otomatis dengan data pasar IDX dunia riil.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column (8 Columns) - Practical steps & code viewer */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main instruction steps to download & develop */}
          <div className="glass-card rounded-2xl p-6 border border-slate-850/80 space-y-4">
            
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Download className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Panduan Hosting & Run Lokal (3 Menit Selesai)</h3>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <p>
                Aplikasi <strong>SAHAM INDO</strong> dirancang modular menggunakan arsitektur modern <strong>Full-Stack Vite (React 18 + TypeScript) & Express Node.js</strong>. Anda bisa dengan mudah memindahkan semua fitur ini ke komputer pribadi Anda secara gratis.
              </p>

              {/* Install and run code block */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-slate-900/40 px-3.5 py-1.5 rounded-t-lg border-t border-x border-slate-800">
                  <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">Terminal Perintah Lokal (Mac / Windows / Linux)</span>
                  <button 
                    onClick={() => copyToClipboard(codeInstallCommands, "cli")}
                    className="p-1 text-slate-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === "cli" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-bold">{copiedSection === "cli" ? "Tersalin!" : "Salin"}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 font-mono text-[10.5px] text-blue-200 overflow-x-auto rounded-b-lg border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                  {codeInstallCommands}
                </pre>
              </div>

            </div>

          </div>

          {/* Interactive Environment Configurator */}
          <div className="glass-card rounded-2xl p-6 border border-slate-850/80 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-white">Konfigurasi .env (Kunci API Mandiri)</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Keamanan Sisi Server (Server-Side Secret)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Tentukan Port Server</label>
                <input 
                  type="number" 
                  value={customPort} 
                  onChange={(e) => setCustomPort(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 text-xs text-white rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Gaya Desain Dasar</label>
                <select 
                  value={customTheme} 
                  onChange={(e) => setCustomTheme(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 text-xs text-white rounded-lg focus:outline-none"
                >
                  <option>Dark - Cybermatic</option>
                  <option>Classic Light - Obsidian</option>
                  <option>Terminal Brutalist</option>
                </select>
              </div>
            </div>

            {/* Generated ENV File preview */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center bg-slate-900/40 px-3.5 py-1.5 rounded-t-lg border-t border-x border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">Berkas Lokal Anda: `.env`</span>
                <button 
                  onClick={() => copyToClipboard(envTemplateCode, "env")}
                  className="p-1 text-slate-505 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === "env" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-bold">{copiedSection === "env" ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 font-mono text-[10.5px] text-zinc-300 overflow-x-auto rounded-b-lg border border-slate-800/80 leading-relaxed">
                {envTemplateCode}
              </pre>
            </div>

          </div>

          {/* Core Server Template Preview */}
          <div className="glass-card rounded-2xl p-6 border border-slate-850/80 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Sisa Backend Server (`server.ts`)</h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-mono">Bebas Pajak API</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ini adalah skrip server utama Node yang menangani otentikasi portofolio simulasi Anda serta melindungi <code>GEMINI_API_KEY</code> agar tidak bocor ke browser pembeli website.
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center bg-slate-900/40 px-3.5 py-1.5 rounded-t-lg border-t border-x border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">Berkas: `server.ts`</span>
                <button 
                  onClick={() => copyToClipboard(customServerCode, "server")}
                  className="p-1 text-slate-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === "server" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-bold">{copiedSection === "server" ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 font-mono text-[10.5px] text-slate-300 overflow-x-auto rounded-b-lg border border-slate-800/80 leading-relaxed h-[240px] overflow-y-auto">
                {customServerCode}
              </pre>
            </div>

          </div>

        </div>

        {/* Right column (4 Columns) - Local API tester */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Diagnostic API Tester box */}
          <div className="glass-card rounded-2xl p-5 border border-slate-850 space-y-4">
            
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" /> Validator Koneksi API Lokal
            </h3>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Gunakan perangkat uji ini untuk memverifikasi bahwa endpoint server backend lokal merespons data sebelum Anda mendeploy ke Cloud/VPS hosting sendiri.
            </p>

            <div className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Uji Endpoint</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={testApiEndpoint} 
                    onChange={(e) => setTestApiEndpoint(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-blue-300 font-mono rounded"
                  />
                  <button 
                    onClick={handleTestEndpoint}
                    disabled={loadingTest}
                    className="px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 text-[11.5px] cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">Hasil Tanggapan Server:</span>
                  <pre className="p-3 bg-slate-950/80 border border-slate-900 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre">
                    {testResult}
                  </pre>
                </div>
              )}

            </div>

          </div>

          {/* FAQ Self-host requirements */}
          <div className="glass-card rounded-2xl p-5 border border-slate-850 space-y-3.5">
            
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" /> Kebutuhan Sistem Minimum housting
            </h3>

            <ul className="text-[11px] text-slate-400 space-y-2.5 list-disc pl-4">
              <li><strong>Node.js:</strong> Versi 18+ atau versi lebih tinggi</li>
              <li><strong>Runtime:</strong> npm v9+ atau npx package runner</li>
              <li><strong>Gemini API:</strong> Akses kunci gratis dari <a href="https://aistudio.google.com" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a></li>
              <li><strong>Hosting Provider Rekomendasi:</strong> Vercel, Netlify (untuk SPA Front-End) atau Render, Railway, Google Cloud Run (untuk Fullstack)</li>
            </ul>

          </div>

          <div className="p-4 bg-orange-950/20 border border-orange-900/40 rounded-xl text-[10px] text-amber-500 leading-relaxed flex gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            <p>
              Simpan semua berkas konfigurasi lokal Anda dengan menyematkan tanda <code>.gitignore</code> pada folder <code>node_modules</code> dan berkas kunci <code>.env</code> Anda sebelum mengunggah kode sumber ke repositori Github publik kesayangan Anda demi mencegah eksploitasi kunci API bursa.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
