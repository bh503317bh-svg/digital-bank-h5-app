const PREFIX = 'aku_bank_'

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveJson(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

function asArray(v) {
  return Array.isArray(v) ? v : []
}

export function getWatchlist() {
  return asArray(loadJson('watchlist', []))
}

export function toggleWatch(id, name) {
  const list = getWatchlist()
  const idx = list.findIndex((x) => x.id === id)
  if (idx >= 0) {
    list.splice(idx, 1)
    saveJson('watchlist', list)
    return { added: false, list }
  }
  list.unshift({ id, name, at: Date.now() })
  saveJson('watchlist', list)
  return { added: true, list }
}

export function isWatched(id) {
  return getWatchlist().some((x) => x.id === id)
}

export function getExtraCards() {
  return asArray(loadJson('extra_cards', []))
}

export function addExtraCard(card) {
  const list = getExtraCards()
  list.unshift(card)
  saveJson('extra_cards', list)
  return list
}

export function getPoints() {
  const n = loadJson('points', 1280)
  return typeof n === 'number' && Number.isFinite(n) ? n : 1280
}

export function setPoints(n) {
  const v = Number(n)
  saveJson('points', Number.isFinite(v) ? v : 0)
}

export function getClaimed() {
  const v = loadJson('claimed_gifts', {})
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}

export function markClaimed(key) {
  const m = getClaimed()
  m[key] = Date.now()
  saveJson('claimed_gifts', m)
  return m
}

export function getNotices() {
  return asArray(loadJson('notices', []))
}

export function pushNotice(title, body) {
  const list = getNotices()
  list.unshift({ id: String(Date.now()), title, body, at: new Date().toISOString(), read: false })
  saveJson('notices', list.slice(0, 50))
  return list
}

export function markNoticesRead() {
  const list = getNotices().map((n) => ({ ...n, read: true }))
  saveJson('notices', list)
  return list
}
