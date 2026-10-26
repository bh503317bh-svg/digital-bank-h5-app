import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

/** Default English; `?lan=ch` (or zh/cn) switches to Chinese. */
export function localeFromLan(raw) {
  const lan = String(raw || '').trim().toLowerCase()
  if (lan === 'ch' || lan === 'zh' || lan === 'zh-cn' || lan === 'cn') return 'zh-CN'
  if (lan === 'en' || lan === 'en-us') return 'en-US'
  return null
}

function initialLocale() {
  try {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = localeFromLan(params.get('lan') || params.get('lang'))
    if (fromQuery) return fromQuery
  } catch {
    /* ignore */
  }
  return 'en-US'
}

const locale = initialLocale()

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export function setLocale(next) {
  if (next !== 'zh-CN' && next !== 'en-US') return
  i18n.global.locale.value = next
  document.documentElement.lang = next === 'en-US' ? 'en' : 'zh-CN'
}

export function applyLanQuery(query) {
  const q = query || {}
  const next = localeFromLan(q.lan ?? q.lang)
  if (next) setLocale(next)
}

document.documentElement.lang = locale === 'en-US' ? 'en' : 'zh-CN'
