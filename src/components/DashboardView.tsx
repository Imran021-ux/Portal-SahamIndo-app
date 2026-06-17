import React from "react";

export default function DashboardView() {
  // Daftar emiten yang ingin dipantau
  const tickers = ["BBCA:IDX", "BBRI:IDX", "TLKM:IDX", "GOTO:IDX"];

  return (
    <div className="p-4 bg-[#0a1420] min-h-screen text-white">
      <h1 className="text-xl font-bold mb-4">SahamIndo Real-Time</h1>
      
      {/* 1. Chart IHSG Utama */}
      <div className="mb-6">
        <h2 className="text-sm text-slate-400 mb-2">IHSG (COMPOSITE)</h2>
        <iframe 
          src="https://www.google.com/finance/quote/COMPOSITE:IDX" 
          className="w-full h-[250px] rounded-lg border-0"
        />
      </div>

      {/* 2. Grid Harga Emiten */}
      <div className="grid grid-cols-1 gap-4">
        {tickers.map((t) => (
          <div key={t} className="bg-slate-800 p-2 rounded-lg">
            <h3 className="text-xs text-slate-300">{t.replace(':IDX', '')}</h3>
            <iframe 
              src={`https://www.google.com/finance/quote/${t}`} 
              className="w-full h-[60px] border-0 overflow-hidden"
              scrolling="no"
            />
          </div>
        ))}
      </div>
      
      <p className="text-center text-slate-600 text-[10px] mt-4">
        Data akurat dari Google Finance
      </p>
    </div>
  );
}
