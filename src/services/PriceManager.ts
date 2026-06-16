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
 * @returns Harga tivalidasi yang aman untuk ditampilkan
 */
export const validatePrice = (newPrice: number, symbol: string): number => {
  const lastValid = lastValidPrices[symbol] || 0;

  // 1. Logika Validasi: Harga tidak boleh 0 atau negatif
  if (!newPrice || newPrice <= 0 || isNaN(newPrice)) {
    console.warn(`Peringatan: Harga ${symbol} tidak valid (${newPrice}), menggunakan harga terakhir.`);
    return lastValid;
  }

  // 2. Logika Pencegahan "Lompatan" Drastis:
  // Jika harga berubah lebih dari 50% dalam satu kali update, curigai data error
  if (lastValid !== 0 && Math.abs((newPrice - lastValid) / lastValid) > 0.5) {
    console.warn(`Peringatan: Perubahan harga ${symbol} terlalu ekstrem! Mengabaikan update.`);
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
export const normalizePrice = (apiPrice: number, marketBoardPrice: number): number => {
  if (apiPrice === 0 || apiPrice === undefined || isNaN(apiPrice)) {
    return marketBoardPrice;
  }
  return apiPrice;
};
