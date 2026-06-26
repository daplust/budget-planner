/**
 * Format number as IDR currency
 * @param amount - Amount in IDR
 * @returns Formatted string like "Rp 1.000.000"
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number as compact IDR (e.g., "Rp 1,5jt", "Rp 10jt")
 * @param amount - Amount in IDR
 * @returns Compact formatted string
 */
export function formatCompactIDR(amount: number): string {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}jt`;
  } else if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}rb`;
  }
  return `Rp ${amount}`;
}

/**
 * Parse IDR string to number
 * @param value - String like "1.000.000" or "1000000"
 * @returns Parsed number
 */
export function parseIDR(value: string): number {
  // Remove non-numeric characters except decimal separator
  const cleaned = value.replace(/[^0-9,-]/g, '');
  // Replace comma with dot if needed
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
}

/**
 * Format IDR input while typing (add thousand separators)
 * @param value - Input value
 * @returns Formatted value with dots as thousand separators
 */
export function formatIDRInput(value: string): string {
  // Remove all non-numeric characters
  const numeric = value.replace(/\D/g, '');
  
  if (!numeric) return '';
  
  // Add thousand separators
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
