import React from 'react';
import { useStockData } from '../services/StockDataFetcher';

interface PriceDisplayProps {
  symbol: string;
}

export default function PriceDisplay({ symbol }: PriceDisplayProps) {
  // Gunakan hook SWR kita yang terintegrasi dengan bursa live & offline/error handling otomatis
  const { price, percent, isLoading } = useStockData(symbol);

  // Jika data sedang loading dan belum ada harga terakhir di cache, tampilkan skeleton loading yang cantik
  if (price === undefined || percent === undefined) {
    return (
      <div id={`price-loading-${symbol}`} className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 animate-pulse flex flex-col gap-2 min-w-[140px] font-sans">
        <div className="h-3 w-12 bg-slate-800 rounded" />
        <div className="h-6 w-24 bg-slate-800 rounded mt-1" />
        <div className="h-3.5 w-16 bg-slate-800 rounded" />
      </div>
    );
  }

  const isPositive = percent >= 0;

  return (
    <div 
      id={`price-card-${symbol}`} 
      className="p-4 rounded-xl border border-slate-900 bg-[#010912]/80 backdrop-blur-sm hover:border-slate-800 transition-all shadow-md flex flex-col gap-1.5 relative overflow-hidden group min-w-[145px] font-sans"
    >
      {/* Accent bar indicating Market status (Bullish vs Bearish) */}
      <div 
        className="absolute top-0 left-0 w-1 h-full transition-all duration-300" 
        style={{ backgroundColor: isPositive ? '#10B981' : '#EF4444' }} 
      />
      
      <div className="flex justify-between items-center pl-1.5">
        <h3 className="text-xs font-black text-slate-400 font-mono tracking-wider transition-all group-hover:text-cyan-400 uppercase">
          {symbol}
        </h3>
        {isLoading && (
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" title="Sinkronisasi Bursa..." />
        )}
      </div>

      <div className="pl-1.5 flex flex-col gap-0.5">
        {/* Format standard IDX: Titik untuk ribuan, Koma untuk desimal */}
        <h1 
          className="text-xl font-black font-mono tracking-tight transition-all duration-300"
          style={{ color: isPositive ? '#10B981' : '#EF4444' }}
        >
          {price.toLocaleString('id-ID')}
        </h1>
        
        <p 
          className="text-[11px] font-black font-mono flex items-center gap-1"
          style={{ color: isPositive ? '#10B981' : '#EF4444' }}
        >
          <span>{isPositive ? '▲' : '▼'}</span>
          <span>{Math.abs(percent).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
        </p>
      </div>
    </div>
  );
}
