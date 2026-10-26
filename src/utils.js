/** Display symbols. Rates live in services/desk.js. */
export const CURRENCY = '$'

const SYMBOL = {
  USD: '$',
  EUR: '€',
  HKD: 'HK$',
  JPY: 'JP¥',
  SGD: 'S$',
  CNY: 'CN¥',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  VND: '₫',
  PHP: '₱'
}

export function maskAccount(no = '') {
  const s = String(no)
  if (s.length < 8) return s
  return `**** **** **** ${s.slice(-4)}`
}

export function money(amount, { hide = false, currency = 'USD', showCode = false } = {}) {
  const code = currency || 'USD'
  const sym = SYMBOL[code] || `${code} `
  if (hide) return '****'
  const n = Number(amount)
  const prefix = showCode ? `${code} ` : ''
  if (!Number.isFinite(n)) return code === 'JPY' ? `${prefix}${sym}0` : `${prefix}${sym}0.00`
  if (code === 'JPY') return `${prefix}${sym}${Math.round(n).toLocaleString('en-US')}`
  return `${prefix}${sym}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatSignedAmount(item) {
  const sign = item.direction === 'in' ? '+' : '-'
  return `${sign}${money(item.amount, { currency: item.currency || 'USD' })}`
}
