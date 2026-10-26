import { loadJson, pushNotice, saveJson } from '../utils/local'

const SINGLE_LIMIT = 2000
const DAILY_LIMIT = 5000

export const FX = {
  USD: 1,
  EUR: 0.92,
  HKD: 7.8,
  JPY: 149,
  CNY: 7.25,
  SGD: 1.35,
  THB: 33.2,
  MYR: 4.2,
  IDR: 15600,
  VND: 25400,
  PHP: 56
}

export function sumUsd(accounts) {
  return (accounts || []).reduce((sum, account) => {
    const currency = account.currency || 'USD'
    const rate = FX[currency] || 1
    const amount = Number(account.balance || 0)
    if (!Number.isFinite(amount)) return sum
    return sum + amount / rate
  }, 0)
}

function arr(key) {
  const v = loadJson(key, [])
  return Array.isArray(v) ? v : []
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function listPayees() {
  return arr('payees')
}

export function savePayee(p) {
  const list = listPayees().filter((x) => x.account !== p.account)
  const row = {
    id: p.id || `p_${Date.now()}`,
    name: p.name.trim(),
    account: String(p.account).replace(/\s/g, ''),
    swift: (p.swift || '').trim().toUpperCase(),
    bank: p.bank || '',
    country: (p.country || 'SG').toUpperCase(),
    kind: p.kind || 'wire'
  }
  list.unshift(row)
  saveJson('payees', list.slice(0, 40))
  return row
}

export function removePayee(id) {
  saveJson('payees', listPayees().filter((x) => x.id !== id))
}

export function knownPayee(account) {
  const acct = String(account || '').replace(/\s/g, '')
  return listPayees().some((x) => x.account === acct)
}

export function validateCounterparty({ mode, name, account, swift }) {
  if (!name || name.trim().length < 2) return 'desk.needName'
  const acct = String(account || '').replace(/\s/g, '')
  if (mode === 'phone') {
    if (!/^\+?\d{8,15}$/.test(acct)) return 'desk.badPhone'
    return ''
  }
  if (mode === 'card') {
    if (!/^\d{12,19}$/.test(acct)) return 'desk.badCard'
    return ''
  }
  if (mode !== 'self' && !/^[A-Za-z0-9]{8,34}$/.test(acct)) return 'desk.badAcct'
  if (mode !== 'self') {
    const s = String(swift || '').trim().toUpperCase()
    if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s)) return 'desk.badSwift'
  }
  return ''
}

export function listOrders() {
  return arr('orders')
}

export function spentToday() {
  return listOrders()
    .filter((o) => o.day === today() && o.status !== 'failed' && o.status !== 'review')
    .reduce((s, o) => s + Number(o.amount || 0), 0)
}

export function limitError(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return 'desk.badAmt'
  if (n > SINGLE_LIMIT) return 'desk.singleLimit'
  if (spentToday() + n > DAILY_LIMIT) return 'desk.dailyLimit'
  return ''
}

export function recordOrder(order) {
  const list = listOrders()
  const row = {
    id: order.id || `o_${Date.now()}`,
    at: new Date().toISOString(),
    day: today(),
    status: order.status || 'completed',
    ...order
  }
  list.unshift(row)
  saveJson('orders', list.slice(0, 80))
  return row
}

export function patchOrder(id, patch) {
  const list = listOrders().map((o) => (o.id === id ? { ...o, ...patch } : o))
  saveJson('orders', list)
}

export function listSchedules() {
  return arr('schedules')
}

export function addSchedule(s) {
  const list = listSchedules()
  list.unshift({
    id: `s_${Date.now()}`,
    status: 'scheduled',
    at: new Date().toISOString(),
    ...s
  })
  saveJson('schedules', list.slice(0, 30))
}

export function patchSchedule(id, patch) {
  saveJson('schedules', listSchedules().map((s) => (s.id === id ? { ...s, ...patch } : s)))
}

export function cardControl(id) {
  const all = loadJson('card_controls', {})
  return all[id] || { frozen: false, lost: false, limit: 1000 }
}

export function setCardControl(id, patch) {
  const all = loadJson('card_controls', {})
  all[id] = { ...cardControl(id), ...patch }
  saveJson('card_controls', all)
  return all[id]
}

export function getKyc() {
  const verifiedProfile = {
    status: 'verified',
    name: 'Ethan Chen',
    idNo: 'S9012345A',
    country: 'SG',
    address: '8 Marina Boulevard, Singapore 018981',
    taxId: 'SG-TIN-9012345A',
    riskAck: false
  }
  const saved = loadJson('kyc', null)
  if (!saved || saved.status === 'none') {
    saveJson('kyc', verifiedProfile)
    saveJson('face_ok', true)
    return verifiedProfile
  }
  return { ...verifiedProfile, ...saved }
}

export function saveKyc(patch) {
  const next = { ...getKyc(), ...patch }
  const ready = next.name && next.idNo && next.address && next.taxId && next.country
  next.status = ready ? 'verified' : 'pending'
  saveJson('kyc', next)
  return next
}

export function faceVerified() {
  return !!loadJson('face_ok', true)
}

export function markFaceVerified() {
  saveJson('face_ok', true)
  pushNotice('Identity verified', 'Facial verification completed')
}

export function twoFaOn() {
  return !!loadJson('twofa', false)
}

export function setTwoFa(on) {
  saveJson('twofa', !!on)
  if (on) pushNotice('2FA', currentOtp())
}

export function pushLoginAlert() {
  const on = loadJson('sec_alert', true) !== false
  if (!on) return
  pushNotice('Login', `${new Date().toLocaleString()} · ${navigator.platform || 'Web'}`)
}

export function currentOtp() {
  const bucket = Math.floor(Date.now() / 30000)
  return String((bucket * 7919) % 1000000).padStart(6, '0')
}

export function listHoldings() {
  return arr('holdings')
}

export function addHolding(h) {
  const list = listHoldings()
  const hit = list.find((x) => x.productId === h.productId)
  if (hit) {
    hit.amount = Number((Number(hit.amount) + Number(h.amount)).toFixed(2))
    hit.at = new Date().toISOString()
  } else {
    list.unshift({
      id: `h_${Date.now()}`,
      productId: h.productId,
      name: h.name,
      amount: Number(h.amount),
      rate: h.rate || '',
      at: new Date().toISOString()
    })
  }
  saveJson('holdings', list)
}

export function redeemHolding(id, amount) {
  const n = Number(amount)
  const list = listHoldings()
  const hit = list.find((x) => x.id === id)
  if (!hit || n <= 0 || n > Number(hit.amount)) return null
  hit.amount = Number((Number(hit.amount) - n).toFixed(2))
  saveJson('holdings', list.filter((x) => Number(x.amount) > 0))
  return n
}

const SEED_BILLS = [
  { id: 'b_elec', nameKey: 'desk.billElec', payee: 'SP Group', amount: 86.4, ccy: 'SGD', status: 'due' },
  { id: 'b_mobile', nameKey: 'desk.billMobile', payee: 'AIS', amount: 599, ccy: 'THB', status: 'due' },
  { id: 'b_net', nameKey: 'desk.billNet', payee: 'IndiHome', amount: 350000, ccy: 'IDR', status: 'due' }
]

export function listBills() {
  const saved = loadJson('bills', null)
  if (!saved) {
    saveJson('bills', SEED_BILLS)
    return SEED_BILLS
  }
  return saved
}

export function markBillPaid(id) {
  saveJson('bills', listBills().map((b) => (b.id === id ? { ...b, status: 'paid' } : b)))
}

export function listDisputes() {
  return arr('disputes')
}

export function openDispute(d) {
  const list = listDisputes()
  list.unshift({
    id: `d_${Date.now()}`,
    status: 'open',
    at: new Date().toISOString(),
    ...d
  })
  saveJson('disputes', list.slice(0, 30))
  pushNotice('Dispute', d.reason || d.ref)
}

export function fxPockets() {
  const v = loadJson('fx', {})
  return v && typeof v === 'object' ? v : {}
}

export function pocketBalance(ccy) {
  return Number(fxPockets()[ccy] || 0)
}

export function setPocket(ccy, amount) {
  const all = fxPockets()
  all[ccy] = Number(Number(amount).toFixed(2))
  saveJson('fx', all)
}

export function quoteFx(from, to, amount) {
  const n = Number(amount)
  if (!FX[from] || !FX[to] || !Number.isFinite(n) || n <= 0) return null
  const usd = n / FX[from]
  const out = usd * FX[to]
  return { usd, out: Number(out.toFixed(2)), rate: Number((FX[to] / FX[from]).toFixed(6)) }
}
