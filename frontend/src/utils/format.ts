/**
 * Shared formatting utilities — India locale
 * Currency: INR (₹), Date: dd/mm/yyyy, DateTime: dd/mm/yyyy hh:mm:ss
 */

/**
 * Format a number as Indian Rupees
 * e.g. 58999 → "₹58,999.00"
 */
export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

/**
 * Format a date string/Date as dd/mm/yyyy
 * e.g. "2024-09-17T13:45:00Z" → "17/09/2024"
 */
export function formatDate(value: string | Date): string {
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Format a date string/Date as dd/mm/yyyy hh:mm:ss (24hr)
 * e.g. "2024-09-17T13:45:00Z" → "17/09/2024 19:15:00"
 */
export function formatDateTime(value: string | Date): string {
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}
