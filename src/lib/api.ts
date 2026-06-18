/**
 * src/lib/api.ts
 * High-performance, real-time stock price API for SahamIndo.com
 * Powered by yahoo-finance2 with server-side proxy fallback & memory caching
 */

export interface StockPriceData {
  ticker: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  low: number;
  high: number;
  volume: number;
  longName: string;
  timestamp: number;
}

// Memory caching system (TTL: 15 seconds) to prevent API rate-limits and optimize rendering speed
const memoryCache: Record<string, { data: StockPriceData; timestamp: number }> = {};
const CACHE_TTL_MS = 15000; // 15 seconds

/**
 * Fetches accurate real-time stock price from BEI (format TICKER.JK)
 * Utilizes server-side proxy backed by yahoo-finance2 Node library for secure, CORS-friendly requests
 */
export async function getStockPrice(ticker: string): Promise<StockPriceData> {
  // Normalize ticker format (e.g., BBCA.JK or BBCA -> BBCA)
  let cleanTicker = ticker.toUpperCase().trim();
  if (cleanTicker.endsWith(".JK")) {
    cleanTicker = cleanTicker.replace(".JK", "");
  }

  const cacheKey = cleanTicker;
  const now = Date.now();

  // 1. Check in-memory cache to prevent redundant API queries
  if (memoryCache[cacheKey] && (now - memoryCache[cacheKey].timestamp < CACHE_TTL_MS)) {
    console.log(`[Cache Hit] Serving ${cleanTicker} from memory cache.`);
    return memoryCache[cacheKey].data;
  }

  try {
    // 2. Query our secure proxy backend which implements yahoo-finance2 query on the server side
    // We append a timestamp to ensure fresh data and bypass intermediate network caching
    const response = await fetch(`/api/stock-live/${cleanTicker}?t=${now}`, {
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const rawData = await response.json();

    const result: StockPriceData = {
      ticker: cleanTicker,
      currentPrice: rawData.currentPrice || 0,
      previousPrice: rawData.previousPrice || 0,
      change: rawData.change !== undefined ? rawData.change : ((rawData.currentPrice || 0) - (rawData.previousPrice || 0)),
      changePercent: rawData.changePercent !== undefined ? rawData.changePercent : 0,
      low: rawData.low || (rawData.currentPrice * 0.98),
      high: rawData.high || (rawData.currentPrice * 1.02),
      volume: rawData.volume || 0,
      longName: rawData.name || rawData.longName || `${cleanTicker} Tbk.`,
      timestamp: now
    };

    // 3. Store valid price data back to the cache
    memoryCache[cacheKey] = {
      data: result,
      timestamp: now
    };

    return result;
  } catch (err: any) {
    console.warn(`[API Client Error] Failed to fetch live price for TICKER: ${cleanTicker}. Error:`, err.message);
    throw err;
  }
}

export interface StockHistoryPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface StockHistoricalData {
  points: StockHistoryPoint[];
  isFallback?: boolean;
}

/**
 * Fetches 1-month historical stock price data for trends chart
 */
export async function getStockHistory(ticker: string): Promise<StockHistoricalData> {
  let cleanTicker = ticker.toUpperCase().trim();
  if (cleanTicker.endsWith(".JK")) {
    cleanTicker = cleanTicker.replace(".JK", "");
  }

  try {
    const response = await fetch(`/api/stock-history/${cleanTicker}`);
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    return await response.json();
  } catch (err: any) {
    console.warn(`[API Client Error] Failed to fetch historical data for ${cleanTicker}:`, err.message);
    throw err;
  }
}
