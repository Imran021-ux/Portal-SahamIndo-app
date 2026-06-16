// src/dataService.ts
import { marketData } from './marketData';
import fullEmitenList from './full_emiten_list.json';

export const DataService = {
  /**
   * Data Normalizer: Ensures all input symbols are in standard format (e.g., BBCA)
   */
  normalizeSymbol(symbol: string): string {
    return symbol.replace('.JK', '').trim().toUpperCase();
  },

  /**
   * Unified Entry Point: Force Local-Only Mode. 
   * Hanya ambil data dari marketData, titik. Tidak boleh ada pengecekan atau fallback ke API publik.
   */
  /**
   * Unified Entry Point: Fetch data from our live backend proxy that fetches from Yahoo Finance
   * with fallbacks to local data.
   */
  async getUnifiedData(symbol: string, signal?: AbortSignal) {
    const cleanSymbol = this.normalizeSymbol(symbol);

    try {
      const response = await fetch(`/api/stock-live/${cleanSymbol}`, { signal });
      if (response.ok) {
        const live = await response.json();
        if (live && !live.error) {
          return {
            ticker: cleanSymbol,
            name: live.name || live.longName || `${cleanSymbol} Tbk.`,
            currentPrice: live.currentPrice,
            previousPrice: live.previousPrice,
            change: live.change,
            changePercent: live.changePercent,
            volume: live.volume || 1000000,
            marketCap: Math.round(live.marketCap / 1e9) || 10000, // in Billion IDR
            peRatio: live.peRatio || 12.5,
            dividendYield: live.dividendYield || 2.0,
            pbv: 1.5,
            der: 45.0,
            roe: 14.5,
            eps: live.eps || Math.round(live.currentPrice / 12.5),
            freeCashFlow: 8500,
            ocf: 9800,
            sector: live.sector || "Industri",
            history: live.history && live.history.length > 0 ? live.history : [live.previousPrice, live.currentPrice],
            bid: live.currentPrice - 2,
            ask: live.currentPrice + 2,
            low: live.low || live.currentPrice * 0.98,
            high: live.high || live.currentPrice * 1.02
          };
        }
      }
    } catch (err) {
      console.warn("Gagal mengambil data live dari Yahoo Finance proxy:", err);
    }

    // Fallback 1: Local marketData.emiten
    if (marketData.emiten && marketData.emiten[cleanSymbol]) {
      const match = marketData.emiten[cleanSymbol];
      return {
        ticker: cleanSymbol,
        name: match.name,
        currentPrice: match.currentPrice,
        previousPrice: match.prevClose || match.currentPrice,
        change: match.currentPrice - (match.prevClose || match.currentPrice),
        changePercent: match.prevClose ? Number(((match.currentPrice - match.prevClose) / match.prevClose * 100).toFixed(2)) : 0,
        volume: 12000000,
        marketCap: 250000,
        peRatio: 12.5,
        dividendYield: 2.5,
        pbv: 1.5,
        der: 45.0,
        roe: 14.5,
        eps: 320,
        freeCashFlow: 8500,
        ocf: 9800,
        sector: cleanSymbol === "TLKM" ? "Infrastruktur" : "Finansial",
        history: [match.prevClose, match.currentPrice],
        bid: match.currentPrice - 2,
        ask: match.currentPrice + 2,
        low: Math.min(match.prevClose, match.currentPrice),
        high: Math.max(match.prevClose, match.currentPrice)
      };
    }

    // Fallback 2: Check in full emiten list
    const found = fullEmitenList.find((s: any) => s.ticker.toUpperCase() === cleanSymbol);
    if (found) {
      const estimatedPrice = 500;
      return {
        ticker: cleanSymbol,
        name: found.company_name,
        currentPrice: estimatedPrice,
        previousPrice: estimatedPrice,
        change: 0,
        changePercent: 0,
        volume: 5000000,
        marketCap: 50000,
        peRatio: 15.0,
        dividendYield: 3.0,
        pbv: 1.5,
        der: 50.0,
        roe: 12.0,
        eps: 33,
        freeCashFlow: 1000,
        ocf: 1200,
        sector: found.sector || "Industri",
        history: [estimatedPrice, estimatedPrice],
        bid: estimatedPrice - 1,
        ask: estimatedPrice + 1,
        low: estimatedPrice,
        high: estimatedPrice
      };
    }

    return null;
  },

  /**
   * Fungsi untuk menarik banyak saham sekaligus (Batch Fetching) dari live proxy
   */
  async batchUpdateStocks(symbols: string[]) {
    try {
      const response = await fetch("/api/stocks/live-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: symbols.map(s => this.normalizeSymbol(s)) })
      });
      if (response.ok) {
        const liveData = await response.json();
        const updatedData: any = {};
        if (Array.isArray(liveData)) {
          liveData.forEach((stock: any) => {
            if (stock && stock.ticker) {
              updatedData[stock.ticker] = {
                currentPrice: stock.currentPrice,
                prevClose: stock.previousPrice,
                lastUpdated: new Date().toLocaleTimeString()
              };
            }
          });
        }
        return updatedData;
      }
    } catch (err) {
      console.warn("Gagal batch update dari live proxy:", err);
    }

    // Local-Only Fallback Batch Mode
    const updatedData: any = {};
    symbols.forEach(s => {
      const symbol = this.normalizeSymbol(s);
      if (marketData.emiten[symbol]) {
        const item = marketData.emiten[symbol];
        updatedData[symbol] = {
          currentPrice: item.currentPrice,
          prevClose: item.prevClose,
          lastUpdated: new Date().toLocaleTimeString()
        };
      } else {
        const found = fullEmitenList.find((x: any) => x.ticker.toUpperCase() === symbol);
        if (found) {
          updatedData[symbol] = {
            currentPrice: 500,
            prevClose: 500,
            lastUpdated: new Date().toLocaleTimeString()
          };
        }
      }
    });
    return updatedData;
  },

  /**
   * Batch update function as alternative name alias
   */
  async updateAllStocks(symbolList: string[]) {
    return this.batchUpdateStocks(symbolList);
  }
};
