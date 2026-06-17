/**
 * PriceManager Service: Memastikan integritas dan konsistensi data harga IHSG maupun Emiten Saham
 * agar tetap valid, sinkron, dan kebal dari anomaly data.
 */

// Menyimpan harga terakhir yang benar dari tiap simbol / ticker secara dinamis
const lastValidPrices: Record<string, number> = {};

/**
 * Memastikan harga yang ditampilkan valid, tidak berubah menjadi nol, negatif,
 * atau mengalami lonjakan harga yang teramat ekstrem yang mencurigakan (data error).
 * 
 * @param newPrice - Harga baru dari API atau bursa
 * @param symbol - Kode emiten atau IHSG (misal: 'IHSG', 'BBCA')
 * @param fallbackValue - Nilai cadangan opsional jika data tidak memiliki riwayat valid
 * @returns Harga tivalidasi yang aman untuk ditampilkan
 */
export const validatePrice = (newPrice: any, symbol: string, fallbackValue?: number): number => {
  const lastValid = lastValidPrices[symbol] || 0;

  // 1. Logika Validasi Ketat: menolak harga <= 0, null, undefined, NaN, atau non-numerical
  if (
    newPrice === null || 
    newPrice === undefined || 
    typeof newPrice !== "number" || 
    isNaN(newPrice) || 
    newPrice <= 0
  ) {
    const defaultFallback = fallbackValue || 100;
    const resolvedFallback = lastValid > 0 ? lastValid : defaultFallback;
    console.warn(`[PriceManager] Deteksi data harga TIDAK VALID untuk ${symbol}:`, newPrice, `. Mengembalikan harga cadangan: ${resolvedFallback}`);
    return resolvedFallback;
  }

  // 2. Logika Pencegahan "Lompatan" Drastis:
  // Jika harga berubah secara tidak masuk akal (lebih dari 50% dalam satu kali update), curigai data error bursa/API
  if (lastValid !== 0 && Math.abs((newPrice - lastValid) / lastValid) > 0.5) {
    console.warn(`[PriceManager] Deteksi perubahan harga ekstrem untuk ${symbol}: ${lastValid} -> ${newPrice}. Mengabaikan update dan memakai harga terakhir.`);
    return lastValid;
  }

  // 3. Update harga valid
  lastValidPrices[symbol] = newPrice;
  return newPrice;
};

/**
 * Fungsi untuk menjaga harga tetap sinkron dan valid di board perdagangan.
 * Jika harga dari API kosong atau bernilai 0, gunakan harga papan bursa default.
 * 
 * @param apiPrice - Harga terbaru dari API live
 * @param marketBoardPrice - Harga cadangan / board default
 */
export const normalizePrice = (apiPrice: any, marketBoardPrice: number): number => {
  if (
    apiPrice === null || 
    apiPrice === undefined || 
    typeof apiPrice !== "number" || 
    isNaN(apiPrice) || 
    apiPrice <= 0
  ) {
    return marketBoardPrice;
  }
  return apiPrice;
};
