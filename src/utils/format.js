export function formatCurrencyINR(value) {
  if (!isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  } catch (_) {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }
}

export function formatNumber(value, digits = 0) {
  if (!isFinite(value)) return '—';
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
