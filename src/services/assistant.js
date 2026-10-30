import { fundMeta } from '../mock/products.js'

export const MIN_INVESTMENT_CENTS = 10000

export const VOICE_SAMPLE_TEXTS = Object.freeze([
  'Buy USD 200 of gold.',
  'I want to buy a high-yield wealth product.'
])

export const ASSISTANT_QUICK_ACTIONS = Object.freeze([
  'Buy QQQ for USD 500',
  'Buy Gold for USD 100',
  'Buy SPY for USD 300',
  'Find high-yield investment products'
])

const PRODUCT_ALIASES = Object.freeze({
  f1: ['ibb', 'biotechnology', 'biotech', '生物科技', '生物医药'],
  f2: ['qqq', 'invesco qqq', 'nasdaq 100', '纳斯达克100', '纳指100', '纳指'],
  f4: ['spy', 's&p 500', 's&p500', 'sp 500', '标普500', '标普五百'],
  f5: ['xlk', 'technology select', '科技板块', '科技etf'],
  f7: ['gold', 'gld', 'spdr gold', 'gold shares', '黄金', '黄金基金', '金价'],
  f10: ['vti', 'total stock market', '美股全市场', '全市场'],
  f11: ['asea', 'asean', 'southeast asia', '东南亚', '东盟']
})

const ASSISTANT_PRODUCT_IDS = Object.freeze(Object.keys(PRODUCT_ALIASES))
const PRODUCTS_BY_ID = new Map(fundMeta.map((product) => [product.id, product]))
const HIGH_YIELD_PATTERN = /(high[- ]?yield|high[- ]?return|best return|top return|高收益|高回报|收益最高|回报最高|推荐.{0,8}(产品|基金|理财)|find.{0,16}(investment|fund|product))/i
const INVESTMENT_INTENT_PATTERN = /(buy|purchase|invest|subscribe|order|find|show|suggest|recommend|购买|申购|投资|买入|认购|推荐|查找|看看)/i
const PURE_AMOUNT_PATTERN = /^(?:(?:us\$|\$|usd)\s*)?([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?:\s*(?:usd|us\s+dollars?|dollars?|bucks?))?[.!]?$/i

function normalized(text) {
  return String(text || '').trim().replace(/\s+/g, ' ')
}

function parseDollarNumber(raw) {
  const value = String(raw || '').replace(/,/g, '').trim()
  if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(value)) return null
  const cents = Math.round(Number(value) * 100)
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

function aliasPattern(alias) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (/[\u3400-\u9fff]/.test(alias)) return new RegExp(escaped, 'i')
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i')
}

function matchProducts(text) {
  const source = normalized(text).toLowerCase()
  return ASSISTANT_PRODUCT_IDS.filter((id) =>
    PRODUCT_ALIASES[id].some((alias) => aliasPattern(alias).test(source))
  )
}

function toRecommendation(product) {
  return {
    id: product.id,
    ticker: product.ticker,
    y1: product.y1,
    returnPercent: Number.parseFloat(String(product.y1).replace('%', '')),
    sector: product.sector,
    nameKey: `${product.key}.name`,
    tagKey: `${product.key}.tag`,
    categoryKey: `funds.sec_${product.sector}`
  }
}

export function getAssistantProduct(productId) {
  if (!ASSISTANT_PRODUCT_IDS.includes(String(productId || ''))) return null
  return PRODUCTS_BY_ID.get(String(productId)) || null
}

export function getRecommendedProducts(limit = 3) {
  const seen = new Set()
  return fundMeta
    .filter((product) => Number.parseFloat(String(product.y1).replace('%', '')) > 0)
    .sort((left, right) =>
      Number.parseFloat(String(right.y1).replace('%', '')) -
      Number.parseFloat(String(left.y1).replace('%', ''))
    )
    .filter((product) => {
      if (seen.has(product.ticker)) return false
      seen.add(product.ticker)
      return true
    })
    .slice(0, Math.max(0, limit))
    .map(toRecommendation)
}

export function parseAmountCents(text) {
  const source = normalized(text)
  const patterns = [
    /(?:us\$|\$|usd)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:usd|us\s+dollars?|dollars?|bucks?)/i,
    /\bfor\s+([0-9][0-9,]*(?:\.[0-9]{1,2})?)\b/i
  ]
  for (const pattern of patterns) {
    const match = source.match(pattern)
    if (match) {
      const cents = parseDollarNumber(match[1])
      if (cents !== null) return cents
    }
  }
  return null
}

export function parsePureAmountCents(text) {
  const match = normalized(text).match(PURE_AMOUNT_PATTERN)
  return match ? parseDollarNumber(match[1]) : null
}

export function parseRouteAmount(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value == null || !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(String(value).trim())) return null
  const cents = parseDollarNumber(String(value).trim())
  return cents !== null && cents >= MIN_INVESTMENT_CENTS ? cents : null
}

export function isAssistantQuery(query) {
  const value = Array.isArray(query?.assistant) ? query.assistant[0] : query?.assistant
  return String(value ?? '') === '1'
}

export function formatCents(cents) {
  const safe = Math.max(0, Math.round(Number(cents) || 0))
  return `${Math.floor(safe / 100)}.${String(safe % 100).padStart(2, '0')}`
}

function statusForAmount(productId, amountCents) {
  if (amountCents == null) return 'needs_amount'
  if (amountCents < MIN_INVESTMENT_CENTS) return 'amount_below_minimum'
  return 'trade_ready'
}

export function classifyAssistantIntent(text, pendingContext = {}) {
  const message = normalized(text)
  const pendingProductId = getAssistantProduct(pendingContext?.productId)?.id || null
  const pureAmountCents = parsePureAmountCents(message)
  const amountCents = pureAmountCents ?? parseAmountCents(message)
  const matchedProductIds = matchProducts(message)
  const highYield = HIGH_YIELD_PATTERN.test(message)

  if (pendingProductId && pureAmountCents !== null) {
    return {
      status: statusForAmount(pendingProductId, pureAmountCents),
      productId: pendingProductId,
      amountCents: pureAmountCents,
      matchedProductIds: [],
      recommendations: []
    }
  }

  if (highYield && matchedProductIds.length !== 1) {
    return {
      status: 'needs_product',
      productId: null,
      amountCents,
      matchedProductIds,
      recommendations: getRecommendedProducts(3)
    }
  }

  if (matchedProductIds.length > 1) {
    const matchedRecommendations = matchedProductIds
      .map((id) => PRODUCTS_BY_ID.get(id))
      .filter(Boolean)
      .slice(0, 3)
      .map(toRecommendation)
    return {
      status: 'needs_product',
      productId: null,
      amountCents,
      matchedProductIds,
      recommendations: matchedRecommendations.length ? matchedRecommendations : getRecommendedProducts(3)
    }
  }

  const productId = matchedProductIds[0] || null
  if (productId) {
    return {
      status: statusForAmount(productId, amountCents),
      productId,
      amountCents,
      matchedProductIds,
      recommendations: []
    }
  }

  if (INVESTMENT_INTENT_PATTERN.test(message)) {
    return {
      status: 'needs_product',
      productId: null,
      amountCents,
      matchedProductIds,
      recommendations: getRecommendedProducts(3)
    }
  }

  return {
    status: 'not_investment',
    productId: null,
    amountCents,
    matchedProductIds: [],
    recommendations: []
  }
}
