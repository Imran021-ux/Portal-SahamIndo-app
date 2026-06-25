/**
 * Utility to get current date, day of week, and year in Indonesian locale
 */
export function getFormattedDateIndo(): string {
  const date = new Date();
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const dayName = dayNames[date.getDay()];
  const dayNum = date.getDate();
  const monthName = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  
  return `${dayName}, ${dayNum} ${monthName} ${year} | ${hours}:${mins} WIB`;
}

export function getFormattedShortDateIndo(): string {
  const date = new Date();
  const dayNum = String(date.getDate()).padStart(2, "0");
  const monthNum = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  
  return `${dayNum}-${monthNum}-${year} ${hours}:${mins} WIB`;
}

export function getFormattedUltraShortDateIndo(): string {
  const date = new Date();
  const dayNum = date.getDate();
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];
  const monthName = monthNames[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  
  return `${dayNum} ${monthName} | ${hours}:${mins} WIB`;
}

