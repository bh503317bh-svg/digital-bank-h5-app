const KEY = 'aku_result'

export function openResult(router, receipt) {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const serial = Math.floor(10000000 + Math.random() * 89999999)
  const ref = receipt.ref || `AKU${stamp}${serial}`
  sessionStorage.setItem(KEY, JSON.stringify({
    ok: receipt.ok !== false,
    kind: receipt.kind || 'transfer',
    note: receipt.note || '',
    title: receipt.title || '',
    reason: receipt.reason || '',
    amount: receipt.amount || '',
    subtitle: receipt.subtitle || '',
    rows: Array.isArray(receipt.rows) ? receipt.rows : [],
    ref,
    time: now.toISOString(),
    back: receipt.back || '/'
  }))
  router.push('/result')
}

export function readResult() {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
