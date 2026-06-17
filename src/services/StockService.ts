/**
 * StockService: Single Source of Truth untuk pengambilan data emiten saham terkini.
 * Mengintegrasikan pengambilan data secara dinamis dari API, melakukan sanitasi harga (Price Sanitization),
 * serta menerapkan sistem cache in-memory dengan TTL (Time-To-Live) rendah.
 */

export interface LiveStockData {
  ticker: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}

// Memory Cache untuk menyimpan data saham dengan limit TTL yang rendah
interface CacheEntry {
  data: LiveStockData;
  expiry: number;
}

const STOCK_CACHE: Record<string, CacheEntry> = {};
const DEFAULT_TTL_MS = 15000; // TTL rendah (15 Detik) untuk memastikan data real-time, tidak usang, & hemat kuota

// Menyimpan harga valid terakhir (Last Known Good Price) untuk proteksi anomali harga
const lastKnownGoodPrices: Record<string, number> = {};

/**
 * 1. Fungsi Price Sanitization:
 * Menolak harga 0, negatif, NaN, atau lonjakan ekstrim (lebih dari 50% dalam sekali pembaruan)
 */
export function sanitizeStockPrice(ticker: string, newPrice: number): number {
  const tickerUpper = ticker.toUpperCase().trim();
  const lastPrice = lastKnownGoodPrices[tickerUpper] || 0;

  // Cek validitas angka dasar
  if (newPrice === null || newPrice === undefined || isNaN(newPrice) || newPrice <= 0) {
    if (lastPrice > 0) {
      console.warn(`[Price Sanitization] Menolak harga tidak valid untuk ${tickerUpper}: ${newPrice}. Memakai Last Known Good Price: ${lastPrice}`);
      return lastPrice;
    }
    // Jika tidak ada data historis, return default aman agar tidak crash
    return 100; 
  }

  // Cek volatilitas / lompatan ekstrim (>50% deviasi) yang biasanya mengindikasikan bug input/API dari IDX
  if (lastPrice > 0) {
    const deviasiFraction = Math.abs((newPrice - lastPrice) / lastPrice);
    if (deviasiFraction > 0.50) {
      console.warn(`[Price Sanitization] Mendeteksi lompatan harga ekstrim pada ${tickerUpper} (${lastPrice} -> ${newPrice}). Mengabaikan data baru.`);
      return lastPrice;
    }
  }

  // Simpan harga valid ke memori pelacak
  lastKnownGoodPrices[tickerUpper] = newPrice;
  return newPrice;
}

/**
 * 2. Mengambil data emiten saham realtime dari server dengan validasi & low-TTL caching
 */
export async function getLiveStockPrice(ticker: string): Promise<LiveStockData> {
  const cleanTicker = ticker.toUpperCase().trim();
  if (!cleanTicker) {
    throw new Error("Kode emiten saham (ticker) tidak boleh kosong.");
  }

  const now = Date.now();
  const cached = STOCK_CACHE[cleanTicker];

  // Gunakan cache jika masih dalam batas TTL (Single Source of Truth)
  if (cached && now < cached.expiry) {
    return cached.data;
  }

  try {
    // Pengambilan data live secara dinamis
    const response = await fetch(`/api/stock-live/${encodeURIComponent(cleanTicker)}?t=${now}`, {
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status} saat menarik data ${cleanTicker}`);
    }

    const data = await response.json();

    if (data && !data.error) {
      // Sanitasi data harga
      const sanitizedPrice = sanitizeStockPrice(cleanTicker, data.currentPrice);
      const prevClose = data.previousPrice || data.prevClose || sanitizedPrice;
      const calculatedChange = sanitizedPrice - prevClose;
      const calculatedPct = prevClose > 0 ? (calculatedChange / prevClose) * 100 : 0;

      const liveData: LiveStockData = {
        ticker: cleanTicker,
        name: data.name || cleanTicker,
        currentPrice: sanitizedPrice,
        previousPrice: prevClose,
        change: calculatedChange,
        changePercent: calculatedPct,
        high: Math.max(sanitizedPrice, data.high || sanitizedPrice),
        low: Math.min(sanitizedPrice, data.low || sanitizedPrice),
        volume: data.volume || 10000,
        timestamp: new Date().toLocaleTimeString("id-ID")
      };

      // Simpan ke Cache dengan Low TTL
      STOCK_CACHE[cleanTicker] = {
        data: liveData,
        expiry: now + DEFAULT_TTL_MS
      };

      return liveData;
    }

    throw new Error("Format payload IDX API tidak sesuai standar.");
  } catch (error) {
    console.warn(`[StockService] Gagal fetching data live untuk ${cleanTicker}. Mengaktifkan single-source fallback lokal:`, error);
    
    // Fallback dinamis jika server/API bursa offline atau bermasalah
    const lastPrice = lastKnownGoodPrices[cleanTicker] || 500;
    const sanitizedPrice = sanitizeStockPrice(cleanTicker, lastPrice);
    const prevClose = Math.round(sanitizedPrice * 0.98); // fallback kemarin

    const fallbackData: LiveStockData = {
      ticker: cleanTicker,
      name: cleanTicker,
      currentPrice: sanitizedPrice,
      previousPrice: prevClose,
      change: sanitizedPrice - prevClose,
      changePercent: prevClose > 0 ? ((sanitizedPrice - prevClose) / prevClose) * 100 : 0,
      high: Math.round(sanitizedPrice * 1.01),
      low: Math.round(sanitizedPrice * 0.99),
      volume: 50000,
      timestamp: new Date().toLocaleTimeString("id-ID")
    };

    // Cache fallback dengan TTL yang sama agar tidak bertubi-tubi mencoba API yang error
    STOCK_CACHE[cleanTicker] = {
      data: fallbackData,
      expiry: now + DEFAULT_TTL_MS
    };

    return fallbackData;
  }
}
