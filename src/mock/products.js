/** Product shells; localized fields resolved via i18n keys in views. */
export const accountProductsMeta = [
  { id: 'hqPlus', vanIcon: 'gold-coin-o', color: '#4c8dff', rate: '3.79%', key: 'products.hqPlus', asOf: '2026-10-01' },
  { id: 'hqPlusX', vanIcon: 'diamond-o', color: '#ff8a3d', rate: '3.46%', key: 'products.hqPlusX', hasTag: true, asOf: '2026-09-25' },
  { id: 'gsPlus', vanIcon: 'chart-trending-o', color: '#f25c54', rate: '4.17%', key: 'products.gsPlus', asOf: '2026-09-30' }
]

export const wealthProductMeta = [
  { id: 'w1', rate: '4.17%', key: 'products.w1', asOf: '2026-09-30' },
  { id: 'w2', rate: '15.33%', key: 'products.w2', asOf: '2026-09-30' },
  { id: 'w3', rate: '1.82%', key: 'products.w3', asOf: '2026-03-31' },
  { id: 'w4', rate: '27.65%', key: 'products.w4', asOf: '2026-09-30' }
]

/** Standardized trailing total returns. Official month-end NAV returns where available. */
export const fundMeta = [
  { id: 'f1', ticker: 'IBB', asOf: '2026-09-30', y1: '46.08%', pop: 98, sector: 'biotech', key: 'products.f1' },
  { id: 'f2', ticker: 'QQQ', asOf: '2026-09-30', y1: '15.90%', pop: 96, sector: 'tech', key: 'products.f2' },
  { id: 'f3', ticker: 'VIG', asOf: '2026-09-30', y1: '9.77%', pop: 88, sector: 'dividend', key: 'products.f3' },
  { id: 'f4', ticker: 'SPY', asOf: '2026-09-30', y1: '15.60%', pop: 95, sector: 'broad', key: 'products.f4' },
  { id: 'f5', ticker: 'XLK', asOf: '2026-09-30', y1: '39.47%', pop: 90, sector: 'tech', key: 'products.f5' },
  { id: 'f6', ticker: 'XLV', asOf: '2026-09-30', y1: '24.80%', pop: 82, sector: 'healthcare', key: 'products.f6' },
  { id: 'f7', ticker: 'GLD', asOf: '2026-09-30', y1: '8.74%', pop: 85, sector: 'gold', key: 'products.f7' },
  { id: 'f8', ticker: 'TLT', asOf: '2026-09-30', y1: '-6.90%', pop: 70, sector: 'bond', key: 'products.f8' },
  { id: 'f9', ticker: 'ARKK', asOf: '2026-09-30', y1: '3.65%', pop: 78, sector: 'tech', key: 'products.f9' },
  { id: 'f10', ticker: 'VTI', asOf: '2026-09-30', y1: '15.33%', pop: 92, sector: 'broad', key: 'products.f10' },
  { id: 'f11', ticker: 'ASEA', asOf: '2026-09-30', y1: '27.65%', pop: 91, sector: 'asean', key: 'products.f11' },
  { id: 'f12', ticker: 'EWS', asOf: '2026-09-30', y1: '26.90%', pop: 89, sector: 'asean', key: 'products.f12' },
  { id: 'f13', ticker: 'EWM', asOf: '2026-09-30', y1: '10.31%', pop: 76, sector: 'asean', key: 'products.f13' },
  { id: 'f14', ticker: 'EIDO', asOf: '2026-09-30', y1: '-31.06%', pop: 84, sector: 'asean', key: 'products.f14' },
  { id: 'f15', ticker: 'THD', asOf: '2026-09-30', y1: '9.60%', pop: 80, sector: 'asean', key: 'products.f15' },
  { id: 'f16', ticker: 'VNM', asOf: '2026-09-30', y1: '12.20%', pop: 86, sector: 'asean', key: 'products.f16' },
  { id: 'f17', ticker: 'EPHE', asOf: '2026-09-30', y1: '-5.74%', pop: 74, sector: 'asean', key: 'products.f17' }
]

/** Demo quotes for well-known SEA-listed names. */
export const stockMeta = [
  { id: 's1', ticker: 'D05', market: 'SGX', price: '46.82', chg: '+0.64%', pop: 97, key: 'products.s1' },
  { id: 's2', ticker: 'O39', market: 'SGX', price: '16.41', chg: '+0.31%', pop: 90, key: 'products.s2' },
  { id: 's3', ticker: 'U11', market: 'SGX', price: '36.20', chg: '-0.22%', pop: 88, key: 'products.s3' },
  { id: 's4', ticker: 'SE', market: 'NYSE', price: '98.15', chg: '+1.84%', pop: 96, key: 'products.s4' },
  { id: 's5', ticker: 'GRAB', market: 'NASDAQ', price: '5.12', chg: '+0.98%', pop: 93, key: 'products.s5' },
  { id: 's6', ticker: '1155', market: 'KLSE', price: '10.28', chg: '+0.39%', pop: 87, key: 'products.s6' },
  { id: 's7', ticker: 'BBCA', market: 'IDX', price: '9,850', chg: '+0.51%', pop: 95, key: 'products.s7' },
  { id: 's8', ticker: 'BBRI', market: 'IDX', price: '4,620', chg: '-0.43%', pop: 92, key: 'products.s8' },
  { id: 's9', ticker: 'BMRI', market: 'IDX', price: '6,375', chg: '+0.27%', pop: 89, key: 'products.s9' },
  { id: 's10', ticker: 'GOTO', market: 'IDX', price: '68', chg: '+2.10%', pop: 85, key: 'products.s10' },
  { id: 's11', ticker: 'BBL', market: 'SET', price: '148.50', chg: '+0.34%', pop: 83, key: 'products.s11' },
  { id: 's12', ticker: 'KBANK', market: 'SET', price: '152.00', chg: '-0.16%', pop: 86, key: 'products.s12' },
  { id: 's13', ticker: 'CPALL', market: 'SET', price: '59.25', chg: '+0.42%', pop: 81, key: 'products.s13' },
  { id: 's14', ticker: 'VCB', market: 'HOSE', price: '92,400', chg: '+0.76%', pop: 90, key: 'products.s14' },
  { id: 's15', ticker: 'BDO', market: 'PSE', price: '148.20', chg: '+0.19%', pop: 78, key: 'products.s15' }
]

export const marketQuotes = [
  { id: 'nasdaq', nameKey: 'funds.tickerNasdaq', price: '17,246.89', chg: '-0.92%' },
  { id: 'spx', nameKey: 'funds.tickerSpx', price: '5,272.27', chg: '-0.13%' },
  { id: 'sti', nameKey: 'funds.tickerSti', price: '3,842.16', chg: '+0.41%' },
  { id: 'set', nameKey: 'funds.tickerSet', price: '1,468.52', chg: '+0.22%' },
  { id: 'jci', nameKey: 'funds.tickerJci', price: '7,612.40', chg: '-0.35%' },
  { id: 'klci', nameKey: 'funds.tickerKlci', price: '1,642.08', chg: '+0.18%' },
  { id: 'vn', nameKey: 'funds.tickerVn', price: '1,286.73', chg: '+0.67%' }
]

export const mockCardMeta = [
  {
    id: 'chase',
    nameKey: 'cards.chase',
    networkKey: 'cards.networkVisa',
    masked: '**** **** **** 4242',
    color: 'linear-gradient(135deg,#0d47a1,#1565c0)'
  },
  {
    id: 'boa',
    nameKey: 'cards.boa',
    networkKey: 'cards.networkMc',
    masked: '**** **** **** 1881',
    color: 'linear-gradient(135deg,#b71c1c,#e53935)'
  },
  {
    id: 'dbs',
    nameKey: 'cards.dbs',
    networkKey: 'cards.networkVisa',
    masked: '**** **** **** 6628',
    color: 'linear-gradient(135deg,#b00020,#e30613)'
  },
  {
    id: 'maybank',
    nameKey: 'cards.maybank',
    networkKey: 'cards.networkVisa',
    masked: '**** **** **** 5510',
    color: 'linear-gradient(135deg,#5c4300,#a67c00)'
  },
  {
    id: 'bca',
    nameKey: 'cards.bca',
    networkKey: 'cards.networkMc',
    masked: '**** **** **** 3301',
    color: 'linear-gradient(135deg,#002a5c,#0057b8)'
  }
]

/** Banks offered when linking a debit card. */
export const linkBanks = [
  { id: 'scb', name: 'SCB', country: 'TH', color: 'linear-gradient(135deg,#2d1466,#4b2884)' },
  { id: 'kbank', name: 'Kasikornbank', country: 'TH', color: 'linear-gradient(135deg,#0d6b22,#138f2d)' },
  { id: 'bbl', name: 'Bangkok Bank', country: 'TH', color: 'linear-gradient(135deg,#102445,#1b3a6b)' },
  { id: 'ktb', name: 'Krungthai', country: 'TH', color: 'linear-gradient(135deg,#0b3d91,#1a73e8)' },
  { id: 'bay', name: 'Krungsri', country: 'TH', color: 'linear-gradient(135deg,#8a3e00,#c45c00)' },
  { id: 'ttb', name: 'ttb', country: 'TH', color: 'linear-gradient(135deg,#0a3d62,#1277b8)' },
  { id: 'dbs', name: 'DBS', country: 'SG', color: 'linear-gradient(135deg,#8e0018,#e30613)' },
  { id: 'ocbc', name: 'OCBC', country: 'SG', color: 'linear-gradient(135deg,#9a0014,#ed1c24)' },
  { id: 'uob', name: 'UOB', country: 'SG', color: 'linear-gradient(135deg,#00266e,#003da5)' },
  { id: 'maybank', name: 'Maybank', country: 'MY', color: 'linear-gradient(135deg,#5c4300,#a67c00)' },
  { id: 'cimb', name: 'CIMB', country: 'MY', color: 'linear-gradient(135deg,#4a0010,#7a0019)' },
  { id: 'pbb', name: 'Public Bank', country: 'MY', color: 'linear-gradient(135deg,#8a0000,#c8102e)' },
  { id: 'rhb', name: 'RHB', country: 'MY', color: 'linear-gradient(135deg,#003366,#0055a5)' },
  { id: 'hlb', name: 'Hong Leong Bank', country: 'MY', color: 'linear-gradient(135deg,#002855,#004a99)' },
  { id: 'ambank', name: 'AmBank', country: 'MY', color: 'linear-gradient(135deg,#c8102e,#e10600)' },
  { id: 'bca', name: 'BCA', country: 'ID', color: 'linear-gradient(135deg,#002a5c,#0057b8)' },
  { id: 'bri', name: 'BRI', country: 'ID', color: 'linear-gradient(135deg,#003366,#00529c)' },
  { id: 'mandiri', name: 'Bank Mandiri', country: 'ID', color: 'linear-gradient(135deg,#0a2a4a,#003b70)' },
  { id: 'bni', name: 'BNI', country: 'ID', color: 'linear-gradient(135deg,#c2410c,#f36f21)' },
  { id: 'danamon', name: 'Danamon', country: 'ID', color: 'linear-gradient(135deg,#c2410c,#e87722)' },
  { id: 'permata', name: 'Permata', country: 'ID', color: 'linear-gradient(135deg,#006747,#00a86b)' },
  { id: 'vcb', name: 'Vietcombank', country: 'VN', color: 'linear-gradient(135deg,#004d2c,#006b3f)' },
  { id: 'ctg', name: 'VietinBank', country: 'VN', color: 'linear-gradient(135deg,#003366,#0057a8)' },
  { id: 'bidv', name: 'BIDV', country: 'VN', color: 'linear-gradient(135deg,#b86e00,#e87722)' },
  { id: 'tcb', name: 'Techcombank', country: 'VN', color: 'linear-gradient(135deg,#c8102e,#e10600)' },
  { id: 'mbb', name: 'MB Bank', country: 'VN', color: 'linear-gradient(135deg,#003366,#1a4f8b)' },
  { id: 'acb', name: 'ACB', country: 'VN', color: 'linear-gradient(135deg,#003da5,#1e88e5)' },
  { id: 'bdo', name: 'BDO', country: 'PH', color: 'linear-gradient(135deg,#001f5b,#0033a0)' },
  { id: 'bpi', name: 'BPI', country: 'PH', color: 'linear-gradient(135deg,#7a1022,#a6192e)' },
  { id: 'mbt', name: 'Metrobank', country: 'PH', color: 'linear-gradient(135deg,#003366,#0055a4)' },
  { id: 'ubp', name: 'UnionBank', country: 'PH', color: 'linear-gradient(135deg,#f36f21,#ff8a00)' },
  { id: 'sebc', name: 'Security Bank', country: 'PH', color: 'linear-gradient(135deg,#003366,#1565c0)' }
]

export function localizeAccountProducts(t) {
  return accountProductsMeta.map((p) => ({
    ...p,
    name: t(`${p.key}.name`),
    desc: t(`${p.key}.desc`),
    rateLabel: t(`${p.key}.rateLabel`),
    tag: p.hasTag ? t(`${p.key}.tag`) : ''
  }))
}

export function localizeWealthProducts(t) {
  return wealthProductMeta.map((p) => ({
    ...p,
    org: t(`${p.key}.org`),
    name: t(`${p.key}.name`),
    tag: t(`${p.key}.tag`),
    rateLabel: `${t(`${p.key}.rateLabel`)} · ${p.asOf}`,
    hold: t(`${p.key}.hold`),
    risk: t(`${p.key}.risk`),
    tip: t(`${p.key}.tip`)
  }))
}

export function localizeFunds(t) {
  return fundMeta.map((p) => ({
    ...p,
    name: t(`${p.key}.name`),
    tag: t(`${p.key}.tag`)
  }))
}

export function localizeStocks(t) {
  return stockMeta.map((p) => ({
    ...p,
    name: t(`${p.key}.name`),
    tag: t(`${p.key}.tag`)
  }))
}

export function wealthCategories(t) {
  return [
    { name: t('wealth.catGs'), tone: '#ff8a3d', icon: 'coupon-o' },
    { name: t('wealth.catStable'), tone: '#4c8dff', icon: 'shield-o' },
    { name: t('wealth.catFund'), tone: '#00a870', icon: 'chart-trending-o' },
    { name: t('wealth.catHigh'), tone: '#8b5cf6', icon: 'fire' },
    { name: t('wealth.catDeposit'), tone: '#2563eb', icon: 'balance-o' }
  ]
}

export function fundEntryRows(entries) {
  const e = Array.isArray(entries) ? entries : []
  return [e.slice(0, 5), e.slice(5, 10)]
}

export const SECTOR_KEYS = ['asean', 'tech', 'biotech', 'healthcare', 'gold', 'bond', 'dividend', 'broad']
export const ASEAN_INDEX_TICKERS = ['ASEA', 'EWS', 'EWM', 'EIDO', 'THD', 'VNM', 'EPHE']
