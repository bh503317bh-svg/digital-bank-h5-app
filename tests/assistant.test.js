import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MIN_INVESTMENT_CENTS,
  VOICE_SAMPLE_TEXTS,
  classifyAssistantIntent,
  formatCents,
  getRecommendedProducts,
  parseRouteAmount
} from '../src/services/assistant.js'

test('clear QQQ request is ready for the detail handoff', () => {
  const result = classifyAssistantIntent('Buy QQQ for USD 500')
  assert.equal(result.status, 'trade_ready')
  assert.equal(result.productId, 'f2')
  assert.equal(result.amountCents, 50000)
})

test('gold voice sample parses product, punctuation and amount', () => {
  const result = classifyAssistantIntent(VOICE_SAMPLE_TEXTS[0])
  assert.equal(result.status, 'trade_ready')
  assert.equal(result.productId, 'f7')
  assert.equal(result.amountCents, 20000)
})

test('missing and low amounts keep product context for a follow-up amount', () => {
  const missing = classifyAssistantIntent('Buy QQQ')
  assert.equal(missing.status, 'needs_amount')
  assert.equal(missing.productId, 'f2')

  const low = classifyAssistantIntent('Buy SPY for USD 50')
  assert.equal(low.status, 'amount_below_minimum')
  assert.equal(low.productId, 'f4')
  assert.equal(low.amountCents, 5000)

  const corrected = classifyAssistantIntent('100', {
    productId: low.productId,
    amountCents: low.amountCents
  })
  assert.equal(corrected.status, 'trade_ready')
  assert.equal(corrected.productId, 'f4')
  assert.equal(corrected.amountCents, MIN_INVESTMENT_CENTS)
})

test('high-yield request returns the current top three funds', () => {
  const result = classifyAssistantIntent('Find high-yield investment products')
  assert.equal(result.status, 'needs_product')
  assert.deepEqual(
    result.recommendations.map((product) => product.ticker),
    ['IBB', 'XLK', 'ASEA']
  )
  assert.deepEqual(
    getRecommendedProducts().map((product) => product.y1),
    ['46.08%', '39.47%', '27.65%']
  )

  const voiceResult = classifyAssistantIntent(VOICE_SAMPLE_TEXTS[1])
  assert.equal(voiceResult.status, 'needs_product')
  assert.deepEqual(
    voiceResult.recommendations.map((product) => product.ticker),
    ['IBB', 'XLK', 'ASEA']
  )
})

test('non-investment messages do not produce product recommendations', () => {
  const result = classifyAssistantIntent('What is my account balance?')
  assert.equal(result.status, 'not_investment')
  assert.equal(result.productId, null)
  assert.deepEqual(result.recommendations, [])
})

test('high-yield request with an amount preserves it for recommendation selection', () => {
  const result = classifyAssistantIntent('Buy a high-yield wealth product for USD 500')
  assert.equal(result.status, 'needs_product')
  assert.equal(result.amountCents, 50000)
  assert.equal(result.recommendations.length, 3)
})

test('multiple product mentions do not guess a product', () => {
  const result = classifyAssistantIntent('Buy QQQ and SPY for USD 500')
  assert.equal(result.status, 'needs_product')
  assert.equal(result.productId, null)
  assert.deepEqual(result.matchedProductIds, ['f2', 'f4'])
  assert.equal(result.amountCents, 50000)
})

test('amount formats and Chinese aliases use integer cents', () => {
  for (const text of [
    'Buy QQQ for $1,000.50',
    'Buy QQQ for 1000.50 USD',
    'Buy QQQ for 1000.50 dollars',
    'Buy QQQ for 1000.50'
  ]) {
    const result = classifyAssistantIntent(text)
    assert.equal(result.status, 'trade_ready')
    assert.equal(result.amountCents, 100050)
  }

  const chinese = classifyAssistantIntent('购买黄金 USD 200')
  assert.equal(chinese.status, 'trade_ready')
  assert.equal(chinese.productId, 'f7')
  assert.equal(chinese.amountCents, 20000)
})

test('route amounts require a valid USD amount of at least one hundred dollars', () => {
  assert.equal(parseRouteAmount('500.25'), 50025)
  assert.equal(parseRouteAmount('100'), MIN_INVESTMENT_CENTS)
  assert.equal(parseRouteAmount('99.99'), null)
  assert.equal(parseRouteAmount('1.234'), null)
  assert.equal(formatCents(50025), '500.25')
})
