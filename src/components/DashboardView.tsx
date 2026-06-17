// /src/dataService.ts
import { marketData } from './marketData';
import fullEmitenList from './full_emiten_list.json';

// Konfigurasi Cache untuk menghindari batas limit NeaByte API
interface CacheEntry {
  data: any[];
  timestamp: number;
}

const CACHE_TTL_MS = 30000; // Cache valid selama 30 detik (bisa diatur)
let globalStocksCache: CacheEntry | null = null;
let isFetchingPromise: Promise<any[]> | null = null;

export const DataService = {
  /**
   * Data Normalizer: Memastikan format ticker seragam (misal: BBCA)
   */
  normalizeSymbol(symbol: string): string {
    return symbol.replace('.JK', '').trim().toUpperCase();
  },

  /**
   * Sanitizer harga untuk mengabaikan nilai korup (0, negatif, NaN)
   */
  sanitizePrice(price: any, fallback: number): number {
    const val = parseFloat(price);
    if (isNaN(val) || val <= 0) return fallback;
    return val;
  },

  /**
   * Mengambil seluruh saham IDX dari NeaByte API dengan Caching Terpusat.
   * Menggunakan Promise Coalescing untuk menyatukan request paralel yang redundan.
   */
  async fetchNeabyteStocks(): Promise<any[]> {
    const now = Date.now();
    
    // 1. Ambil dari Cache jika masa berlaku belum habis (Warm Cache)
    if (globalStocksCache && (now - globalStocksCache.timestamp < CACHE_TTL_MS)) {
      return globalStocksCache.data;
    }

    // 2. Gabungkan request paralel yang datang bersamaan agar tidak melakukan duplikasi fetch
    if (isFetchingPromise) {
      return isFetchingPromise;
    }

    isFetchingPromise = (async () => {
      try {
        console.log("[DataService] Mengambil data IDX real-time terpusat dari NeaByte API...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 detik timeout

        const response = await fetch('https://api.neabyte.com/idx/stocks', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();
        // Tangani jika response langsung berupa array atau bertingkat
        const mappedData = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        
        console.log(`[DataService] Berhasil mengambil ${mappedData.length} emiten dari NeaByte. Mengaktifkan cache.`);
        
        globalStocksCache = {
          data: mappedData,
          timestamp: Date.now()
        };
        return mappedData;
      } catch (error) {
        console.warn("[DataService] Gagal menghubungi NeaByte API. Menggunakan backup local data:", error);
        
        // Backup otomatis jika API NeaByte down
        const localBackupList: any[] = [];
        Object.keys(marketData.emiten).forEach(ticker => {
          const item = marketData.emiten[ticker];
          localBackupList.push({
            ticker: ticker.toUpperCase(),
            name: item.name,
            currentPrice: item.currentPrice,
            prevClose: item.prevClose || item.currentPrice,
            price: item.currentPrice,
            volume: 12000000,
            sector: "Keuangan"
          });
        });

        // Tetapkan cache darurat singkat (TTL 5 detik saja untuk kegagalan) agar tidak spamming fetch gagal
        globalStocksCache = {
          data: localBackupList,
          timestamp: Date.now() - CACHE_TTL_MS + 5000 
        };
        return localBackupList;
      } finally {
        isFetchingPromise = null;
      }
    })();

    return isFetchingPromise;
  },

  /**
   * Mengambil data spesperifik satu emiten lengkap dengan rasio fundamental
   */
  async getUnifiedData(symbol: string, signal?: AbortSignal) {
    const cleanSymbol = this.normalizeSymbol(symbol);
    const apiStocks = await this.fetchNeabyteStocks();
    
    const foundApi = apiStocks.find(
      (s: any) => (s.ticker?.toUpperCase() === cleanSymbol) || (s.symbol?.toUpperCase() === cleanSymbol)
    );

    // Pemetaan penamaan properti fleksibel dari NeaByte API
    const name = foundApi?.name || foundApi?.companyName || foundApi?.company_name || `${cleanSymbol} Tbk.`;
    const currentPrice = this.sanitizePrice(foundApi?.price ?? foundApi?.currentPrice ?? foundApi?.current_price ?? foundApi?.close, 500);
    const previousPrice = this.sanitizePrice(foundApi?.prevClose ?? foundApi?.previousPrice ?? foundApi?.prev_close ?? foundApi?.open, currentPrice);
    
    const change = foundApi?.change ?? (currentPrice - previousPrice);
    const changePercent = foundApi?.changePercent ?? Number((previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice * 1050) / 10 : 0).toFixed(2));
    const volume = foundApi?.volume ?? foundApi?.vol ?? 12500000;
    const sector = foundApi?.sector || "Finansial";

    return {
      ticker: cleanSymbol,
      name,
      currentPrice,
      previousPrice,
      change,
      changePercent,
      volume,
      marketCap: foundApi?.marketCap || Math.round((currentPrice * volume) / 1e9) || 15000,
      peRatio: foundApi?.peRatio || 14.2,
      dividendYield: foundApi?.dividendYield || 3.1,
      pbv: foundApi?.pbv || 1.8,
      der: foundApi?.der || 42.5,
      roe: foundApi?.roe || 12.8,
      eps: foundApi?.eps || Math.round(currentPrice / 14.2),
      freeCashFlow: foundApi?.freeCashFlow || 7400,
      ocf: foundApi?.ocf || 9200,
      sector,
      history: foundApi?.history || [previousPrice, Math.round((previousPrice + currentPrice) / 2), currentPrice],
      bid: foundApi?.bid || (currentPrice - 2 > 0 ? currentPrice - 2 : currentPrice),
      ask: foundApi?.ask || currentPrice + 2,
      low: foundApi?.low || Math.min(previousPrice, currentPrice),
      high: foundApi?.high || Math.max(previousPrice, currentPrice)
    };
  },

  /**
   * Batch update harga (Batch Mode) untuk mengembalikan record harga instan
   */
  async batchUpdateStocks(symbols: string[]) {
    try {
      const apiStocks = await this.fetchNeabyteStocks();
      const updatedData: any = {};

      symbols.forEach(s => {
        const symbol = this.normalizeSymbol(s);
        const match = apiStocks.find(
          (item: any) => (item.ticker?.toUpperCase() === symbol) || (item.symbol?.toUpperCase() === symbol)
        );

        if (match) {
          const currentPrice = this.sanitizePrice(match.price ?? match.currentPrice ?? match.current_price ?? match.close, 500);
          const prevClose = this.sanitizePrice(match.prevClose ?? match.previousPrice ?? match.prev_close ?? match.open, currentPrice);

          updatedData[symbol] = {
            currentPrice,
            prevClose,
            lastUpdated: new Date().toLocaleTimeString("id-ID")
          };
        } else {
          if (marketData.emiten[symbol]) {
            const item = marketData.emiten[symbol];
            updatedData[symbol] = {
              currentPrice: item.currentPrice,
              prevClose: item.prevClose,
              lastUpdated: new Date().toLocaleTimeString("id-ID")
            };
          }
        }
      });

      return updatedData;
    } catch (err) {
      console.warn("[DataService] Gagal melakukan batch update:", err);
      return {};
    }
  }
};