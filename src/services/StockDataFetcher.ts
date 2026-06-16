// src/services/StockDataFetcher.ts
import useSWR from 'swr';
import { marketData } from '../marketData';
import { REAL_PRICE_LOOKUP } from '../data';
import { validatePrice, normalizePrice } from './PriceManager';

export interface StockDataResult {
  lastPrice: number;
  change: number;
  percentChange: number;
  formattedPrice: string;
  formattedChange: string;
  formattedPercentChange: string;
}

/**
 * Memformat angka menggunakan format standar IDX (id-ID)
 * - Titik untuk pembatas desimal ribuan (misal: 12.500)
 * - Koma untuk desimal pecahan (misal: 1,25)
 */
export function formatNomorIDX(num: number | null | undefined, decimalPlaces: number = 0): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

/**
 * Mengambil data harga terkini emiten dari API bursa yang andal (Yahoo Finance proxy di server)
 * Dilengkapi error-handling tangguh & offline support (fallback otomatis ke model emiten lokal) mencegah crash!
 * 
 * @param kodeEmiten - Simbol emiten saham (misalnya: 'BBCA', 'TLKM', 'GOTO')
 */
export async function fetchDataSaham(kodeEmiten: string): Promise<StockDataResult> {
  const cleanTicker = kodeEmiten ? kodeEmiten.trim().toUpperCase() : '';
  
  if (!cleanTicker) {
    return {
      lastPrice: 0,
      change: 0,
      percentChange: 0,
      formattedPrice: '0',
      formattedChange: '0,00',
      formattedPercentChange: '0,00%',
    };
  }

  try {
    // Menggunakan API internal bursa yang memproksikan penarikan data ke Yahoo Finance
    const url = `/api/stock-live/${encodeURIComponent(cleanTicker)}?t=${Date.now()}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Koneksi ke bursa offline (HTTP ${response.status})`);
    }

    const data = await response.json();
    if (data && !data.error && data.currentPrice !== undefined && data.currentPrice > 0) {
      const parsedPrice = data.currentPrice;
      const validated = validatePrice(parsedPrice, cleanTicker);
      const lastPrice = normalizePrice(validated, parsedPrice);
      
      const change = data.change !== undefined ? data.change : 0;
      const percentChange = data.changePercent !== undefined ? data.changePercent : 0;

      return {
        lastPrice,
        change,
        percentChange,
        formattedPrice: formatNomorIDX(lastPrice, 0),
        formattedChange: (change >= 0 ? '+' : '') + formatNomorIDX(change, 2),
        formattedPercentChange: (percentChange >= 0 ? '+' : '') + formatNomorIDX(percentChange, 2) + '%',
      };
    }

    throw new Error('Struktur data bursa tidak lengkap');
  } catch (error) {
    console.warn(`[StockDataFetcher] Gagal menarik data real-time untuk ${cleanTicker}. Menggunakan offline fallback:`, error);

    // OFFLINE & SERVICE FAILURE FALLBACK (Mencegah any crash di browser client)
    let defaultPrice = 100;
    let prevPrice = 100;

    // Cara 1: Ambil dari marketData global static emiten
    if (marketData.emiten && marketData.emiten[cleanTicker]) {
      const match = marketData.emiten[cleanTicker];
      defaultPrice = match.currentPrice;
      prevPrice = match.prevClose || defaultPrice;
    } 
    // Cara 2: Ambil dari lookup real_price_lookup yang tersimpan di data.ts
    else if (REAL_PRICE_LOOKUP && REAL_PRICE_LOOKUP[cleanTicker]) {
      defaultPrice = REAL_PRICE_LOOKUP[cleanTicker];
      prevPrice = Math.round(defaultPrice * 0.98); // Estimasi penutupan kemarin
    }

    const validated = validatePrice(defaultPrice, cleanTicker);
    const lastPrice = normalizePrice(validated, defaultPrice);

    const change = lastPrice - prevPrice;
    const percentChange = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;


    return {
      lastPrice,
      change,
      percentChange,
      formattedPrice: formatNomorIDX(lastPrice, 0),
      formattedChange: (change >= 0 ? '+' : '') + formatNomorIDX(change, 2),
      formattedPercentChange: (percentChange >= 0 ? '+' : '') + formatNomorIDX(percentChange, 2) + '%',
    };
  }
}

/**
 * Custom React Hook yang terintegrasi dengan caching SWR dan automatic polling update setiap 60 detik.
 */
export const useStockData = (symbol: string) => {
  const cleanSymbol = symbol ? symbol.trim().toUpperCase() : '';

  const { data, error, mutate, isValidating } = useSWR(
    cleanSymbol ? `stock-data-${cleanSymbol}` : null,
    () => fetchDataSaham(cleanSymbol),
    {
      refreshInterval: 60000, // Otomatis perbarui data setiap 60 detik
      revalidateOnFocus: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  return {
    price: data?.lastPrice,
    change: data?.change,
    percent: data?.percentChange,
    formattedPrice: data?.formattedPrice,
    formattedChange: data?.formattedChange,
    formattedPercent: data?.formattedPercentChange,
    isLoading: !error && !data,
    isError: !!error,
    isValidating,
    mutate
  };
};
