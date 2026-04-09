/**
 * Number and value formatters for the DS/Eng UI.
 */

export function fmtOrders(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function fmtOrdersFull(n) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function fmtPct(n, decimals = 1) {
  if (n == null) return '—'
  return `${(n * 100).toFixed(decimals)}%`
}

export function fmtPctRaw(n, decimals = 1) {
  // n is already a percentage (e.g. 27.5 for 27.5%)
  if (n == null) return '—'
  return `${n.toFixed(decimals)}%`
}

export function fmtMoney(n, currency = '$') {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000) return `${currency}${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}k`
  return `${currency}${n.toFixed(2)}`
}

export function fmtFactor(n, decimals = 3) {
  if (n == null) return '—'
  return n.toFixed(decimals)
}

export function fmtWow(pct) {
  if (pct == null) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

export function fmtWeek(w) {
  return `W${w + 1}`
}

export function fmtDelta(n) {
  if (n == null) return '—'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${fmtOrders(n)}`
}

export function deltaClass(n) {
  if (n == null) return 'text-gray-400'
  return n >= 0 ? 'text-emerald-400' : 'text-red-400'
}

export function benchmarkClass(value, benchmarks) {
  // Returns tailwind class based on value vs benchmarks {low, mid, high}
  if (!benchmarks) return 'text-gray-400'
  if (value < benchmarks.low) return 'text-red-400'
  if (value > benchmarks.high) return 'text-emerald-400'
  return 'text-amber-400'
}

export function formatDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
