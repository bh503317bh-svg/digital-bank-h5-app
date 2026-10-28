<template>
  <div class="page no-tab detail-page">
    <van-nav-bar :title="t('wealthDetail.title')" left-arrow @click-left="$router.back()">
      <template #right><van-icon :name="watched ? 'star' : 'star-o'" :color="watched ? '#c8a45d' : '#123b6d'" size="20" @click="toggle" /></template>
    </van-nav-bar>

    <section class="hero">
      <div class="provider"><span><FeatureIcon name="wealth" /></span>{{ issuer }}</div>
      <h1>{{ productName }}</h1>
      <div class="code">{{ t('wealthBuy.productCode') }} {{ productId }} · USD</div>
      <div class="hero-grid">
        <div class="yield"><strong>{{ rate || '—' }}</strong><span>{{ rateLabel }}</span></div>
        <div><strong>{{ holding }}</strong><span>{{ t('wealthDetail.liquidity') }}</span></div>
        <div><strong>{{ risk }}</strong><span>{{ t('wealthDetail.riskLevel') }}</span></div>
      </div>
      <div class="risk-note"><van-icon name="warning-o" /> {{ t('wealthDetail.notDeposit') }}</div>
    </section>

    <section v-if="!isFund" class="chips">
      <span><van-icon name="passed" /> {{ t('wealthDetail.selected') }}</span>
      <span><van-icon name="shield-o" /> {{ t('wealthDetail.custody') }}</span>
      <span><van-icon name="clock-o" /> {{ t('wealthDetail.confirmation') }}</span>
    </section>

    <section v-if="!isFund" class="card performance">
      <div class="section-title">{{ t('wealthDetail.performance') }}<small>{{ t('wealthDetail.asOf') }}</small></div>
      <div class="periods"><button class="on">1M</button><button>3M</button><button>1Y</button><button>ALL</button></div>
      <svg viewBox="0 0 340 116" preserveAspectRatio="none" aria-label="performance chart">
        <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c679d" stop-opacity=".3"/><stop offset="1" stop-color="#1c679d" stop-opacity="0"/></linearGradient></defs>
        <path class="grid" d="M0 20H340M0 58H340M0 96H340" />
        <path class="area" d="M0 91 C24 87,35 92,58 78 S91 70,112 73 S145 58,167 61 S207 43,229 49 S270 31,292 35 S322 21,340 17 L340 116 L0 116Z" />
        <path class="line" d="M0 91 C24 87,35 92,58 78 S91 70,112 73 S145 58,167 61 S207 43,229 49 S270 31,292 35 S322 21,340 17" />
      </svg>
      <div class="chart-axis"><span>-30D</span><span>-20D</span><span>-10D</span><span>{{ t('wealthDetail.today') }}</span></div>
      <div class="benchmark"><span><i></i>{{ t('wealthDetail.productLine') }}</span><b>{{ t('wealthDetail.performanceNotice') }}</b></div>
    </section>

    <section v-if="isFund" class="card fund-data-note">
      <div class="section-title">{{ t('wealthDetail.fundDataTitle') }}</div>
      <p>{{ t('wealthDetail.fundDataNote') }}</p>
    </section>

    <section v-if="!isFund" class="card">
      <div class="section-title">{{ t('wealthDetail.keyFacts') }}</div>
      <div class="fact-grid">
        <div><span>{{ t('wealthDetail.minimum') }}</span><b>USD $100.00</b></div>
        <div><span>{{ t('wealthDetail.currency') }}</span><b>USD</b></div>
        <div><span>{{ t('wealthDetail.dealing') }}</span><b>{{ t('wealthDetail.businessDaily') }}</b></div>
        <div><span>{{ t('wealthDetail.fee') }}</span><b>0.00%</b></div>
      </div>
    </section>

    <section v-if="!isFund" class="card">
      <div class="section-title">{{ t('wealthDetail.tradeRules') }}</div>
      <div class="timeline">
        <div><i></i><strong>{{ t('wealthDetail.beforeCutoff') }}</strong><span>{{ t('wealthDetail.submitOrder') }}</span></div>
        <div><i></i><strong>T+1</strong><span>{{ t('wealthDetail.confirmShares') }}</span></div>
        <div><i></i><strong>T+2</strong><span>{{ t('wealthDetail.viewReturns') }}</span></div>
      </div>
      <div class="rule-row"><span>{{ t('wealthDetail.redemption') }}</span><b>{{ t('wealthDetail.redemptionValue') }}</b></div>
      <div class="rule-row"><span>{{ t('wealthDetail.cutoff') }}</span><b>15:00 (UTC+8)</b></div>
    </section>

    <section v-if="!isFund" class="card allocation" :class="{ gold: isGold }">
      <div class="section-title">{{ t('wealthDetail.allocation') }}</div>
      <div class="donut"></div>
      <div v-if="isGold" class="legend">
        <div><i class="a"></i><span>{{ t('wealthDetail.physicalGold') }}</span><b>99.8%</b></div>
        <div><i class="b"></i><span>{{ t('wealthDetail.goldCash') }}</span><b>0.2%</b></div>
        <div><i class="c"></i><span>{{ t('wealthDetail.goldCustody') }}</span><b>LBMA</b></div>
      </div>
      <div v-else class="legend">
        <div><i class="a"></i><span>{{ t('wealthDetail.investmentGrade') }}</span><b>72%</b></div>
        <div><i class="b"></i><span>{{ t('wealthDetail.government') }}</span><b>18%</b></div>
        <div><i class="c"></i><span>{{ t('wealthDetail.cash') }}</span><b>10%</b></div>
      </div>
    </section>

    <section v-if="!isFund" class="card">
      <div class="section-title">{{ t('wealthDetail.documents') }}</div>
      <button v-for="doc in documents" :key="doc" class="doc" @click="openDocument(doc)"><van-icon name="description" /><span>{{ doc }}</span><van-icon name="arrow" /></button>
    </section>

    <section v-if="!isFund" class="disclosure">
      <strong>{{ t('wealthDetail.disclosureTitle') }}</strong>
      <p>{{ t('wealthDetail.disclosureBody') }}</p>
    </section>

    <div class="buy-bar">
      <div><small>{{ isFund ? t('wealthDetail.demoMinimum') : t('wealthDetail.minimum') }}</small><strong>USD $100.00</strong></div>
      <van-button round type="primary" @click="buy">{{ t('wealthDetail.subscribe') }}</van-button>
    </div>
    <van-action-sheet v-model:show="showDocument" :title="activeDocument" round>
      <div class="document-sheet">
        <div class="document-seal"><van-icon name="certificate" /></div>
        <h3>{{ activeDocument }}</h3>
        <p>{{ t('wealthDetail.documentIntro') }}</p>
        <div v-for="item in documentPoints" :key="item" class="document-point"><van-icon name="passed" />{{ item }}</div>
        <p class="document-foot">{{ t('wealthDetail.documentFoot') }}</p>
        <van-button round block type="primary" @click="showDocument = false">{{ t('wealthDetail.readComplete') }}</van-button>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showSuccessToast } from 'vant'
import { localizeFunds, localizeWealthProducts } from '../mock/products'
import { isWatched, toggleWatch } from '../utils/local'
import FeatureIcon from '../components/FeatureIcon.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const productId = computed(() => String(route.query.id || 'w1'))
const isFund = computed(() => /^f\d+$/.test(productId.value))
const isGold = computed(() => productId.value === 'f7')
const suppliedName = computed(() => String(route.query.name || ''))
const suppliedRate = computed(() => String(route.query.rate || ''))
const product = computed(() => {
  locale.value
  return localizeWealthProducts(t).find((x) => x.id === productId.value)
    || localizeFunds(t).find((x) => x.id === productId.value)
    || null
})
const productName = computed(() => suppliedName.value || product.value?.name || t('wealthDetail.defaultName'))
const rate = computed(() => suppliedRate.value || product.value?.rate || product.value?.y1 || '')
const issuer = computed(() => isFund.value ? t('wealthDetail.fundDataTitle') : product.value?.org || t('wealthDetail.issuer'))
const rateLabel = computed(() => isFund.value && product.value?.asOf ? `${t('wealthDetail.annualReturn')} · ${product.value.asOf}` : product.value?.rateLabel || t('wealthDetail.annualReturn'))
const holding = computed(() => isFund.value ? '—' : product.value?.hold || t('wealthDetail.flexible'))
const risk = computed(() => isFund.value ? '—' : product.value?.risk?.split('|')[0]?.trim() || t('wealthDetail.r2'))
const watchTick = ref(0)
const showDocument = ref(false)
const activeDocument = ref('')
const watched = computed(() => { watchTick.value; return isWatched(productId.value) })
const documents = computed(() => [t('wealthDetail.productDocument'), t('wealthDetail.riskDisclosure'), t('wealthDetail.investorNotice')])
const documentPoints = computed(() => [t('wealthDetail.docPoint1'), t('wealthDetail.docPoint2'), t('wealthDetail.docPoint3')])

function toggle() {
  const result = toggleWatch(productId.value, productName.value)
  watchTick.value += 1
  showSuccessToast(result.added ? t('wealth.watchAdd') : t('wealth.watchRemove'))
}

function buy() {
  router.push({ path: '/wealth/buy', query: { id: productId.value, name: productName.value, rate: rate.value, ...(route.query.amount ? { amount: route.query.amount } : {}) } })
}

function openDocument(doc) {
  activeDocument.value = doc
  showDocument.value = true
}
</script>

<style scoped>
.detail-page { padding-bottom: 96px; }.hero { padding: 22px 18px 18px; color: #fff; background: radial-gradient(circle at 90% 0,rgba(217,187,119,.3),transparent 34%),linear-gradient(145deg,#174f87,#082849); }.provider { display: flex; align-items: center; gap: 8px; color: #e3c98e; font-size: 11px; font-weight: 700; letter-spacing: .6px; }.provider span { display: grid; place-items: center; width: 26px; height: 26px; border: 1px solid rgba(227,201,142,.5); border-radius: 50%; }.hero h1 { margin: 15px 0 5px; font-size: 20px; line-height: 1.35; }.code { color: rgba(255,255,255,.53); font-size: 10px; }.hero-grid { display: grid; grid-template-columns: 1.2fr 1fr .8fr; margin-top: 23px; }.hero-grid>div { display: flex; flex-direction: column; gap: 5px; }.hero-grid strong { font-size: 16px; }.hero-grid .yield strong { color: #efd49a; font-size: 27px; }.hero-grid span { color: rgba(255,255,255,.56); font-size: 9px; }.risk-note { margin-top: 17px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.6); font-size: 10px; }.chips { display: grid; grid-template-columns: repeat(3,1fr); padding: 13px 8px; background: #fff; color: #506075; text-align: center; font-size: 10px; }.chips span+span { border-left: 1px solid #e8edf2; }.chips .van-icon { color: #b38c43; }.card { margin: 12px; padding: 17px; border: 1px solid #e7ecf1; border-radius: 16px; background: #fff; box-shadow: 0 5px 20px rgba(15,39,68,.05); }.section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; color: #142033; font-size: 15px; font-weight: 750; }.section-title small { color: #909aa8; font-size: 9px; font-weight: 400; }.periods { display: flex; gap: 7px; }.periods button { border: 0; border-radius: 12px; padding: 4px 10px; background: #f1f4f7; color: #7e8998; font-size: 9px; }.periods .on { background: #123b6d; color: #fff; }.performance svg { width: 100%; height: 116px; margin-top: 9px; overflow: visible; }.performance .grid { fill: none; stroke: #edf1f4; stroke-width: 1; }.performance .area { fill: url(#area); }.performance .line { fill: none; stroke: #1c679d; stroke-width: 2.2; }.chart-axis { display: flex; justify-content: space-between; color: #98a1ad; font-size: 8px; }.benchmark { display: flex; justify-content: space-between; margin-top: 13px; font-size: 9px; }.benchmark i { display: inline-block; width: 12px; height: 2px; margin-right: 5px; background: #1c679d; vertical-align: middle; }.benchmark b { color: #98a1ad; font-weight: 400; }.fact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }.fact-grid div { display: flex; flex-direction: column; gap: 6px; padding: 13px 4px; border-bottom: 1px solid #edf0f3; }.fact-grid div:nth-child(odd) { border-right: 1px solid #edf0f3; }.fact-grid div:nth-last-child(-n+2) { border-bottom: 0; }.fact-grid span,.rule-row span { color: #8490a0; font-size: 10px; }.fact-grid b,.rule-row b { color: #243246; font-size: 12px; }.timeline { display: grid; grid-template-columns: repeat(3,1fr); margin: 5px 0 18px; }.timeline div { position: relative; text-align: center; }.timeline div:not(:last-child)::after { content: ''; position: absolute; top: 5px; left: 56%; width: 88%; height: 1px; background: #cfd9e2; }.timeline i { position: relative; z-index: 1; display: block; width: 11px; height: 11px; margin: 0 auto 8px; border: 3px solid #d7e2eb; border-radius: 50%; background: #123b6d; }.timeline strong,.timeline span { display: block; }.timeline strong { font-size: 11px; }.timeline span { margin-top: 4px; color: #8994a2; font-size: 9px; }.rule-row { display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #edf0f3; }.allocation { position: relative; min-height: 190px; }.donut { position: absolute; top: 66px; left: 28px; width: 92px; height: 92px; border-radius: 50%; background: conic-gradient(#123b6d 0 72%,#c8a45d 72% 90%,#dfe6ec 90%); }.donut::after { content: 'USD'; position: absolute; inset: 21px; display: grid; place-items: center; border-radius: 50%; background: #fff; color: #123b6d; font-size: 11px; font-weight: 700; }.legend { margin-left: 130px; }.legend div { display: grid; grid-template-columns: 9px 1fr auto; gap: 7px; align-items: center; padding: 9px 0; font-size: 10px; }.legend i { width: 8px; height: 8px; border-radius: 2px; }.legend .a { background: #123b6d; }.legend .b { background: #c8a45d; }.legend .c { background: #dfe6ec; }.doc { display: flex; align-items: center; width: 100%; gap: 10px; border: 0; border-top: 1px solid #edf0f3; padding: 13px 0; background: #fff; color: #334155; text-align: left; }.doc span { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.doc .van-icon:first-child { color: #123b6d; font-size: 18px; }.disclosure { margin: 15px 18px; color: #778394; font-size: 10px; line-height: 1.6; }.disclosure strong { color: #4d5a6b; }.disclosure p { margin: 5px 0; }.buy-bar { position: fixed; z-index: 8; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 16px calc(11px + env(safe-area-inset-bottom)); border-top: 1px solid #e4eaf0; background: rgba(255,255,255,.97); backdrop-filter: blur(12px); }.buy-bar>div { min-width: 0; }.buy-bar small,.buy-bar strong { display: block; }.buy-bar small { color: #8994a2; font-size: 9px; }.buy-bar strong { margin-top: 3px; overflow: hidden; color: #123b6d; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }.buy-bar .van-button { width: min(176px,48vw); flex: 0 0 auto; padding: 0 12px; } @media(min-width:600px){.buy-bar{right:auto;left:50%;width:480px;transform:translateX(-50%)}}
.document-sheet { padding: 5px 20px calc(22px + env(safe-area-inset-bottom)); }.document-seal { display: grid; place-items: center; width: 48px; height: 48px; margin: 4px auto 10px; border-radius: 50%; background: #edf3f8; color: #123b6d; font-size: 24px; }.document-sheet h3 { margin: 0; text-align: center; }.document-sheet p { color: #748194; font-size: 11px; line-height: 1.6; }.document-point { display: flex; gap: 8px; padding: 10px 0; border-top: 1px solid #edf0f3; color: #344256; font-size: 12px; }.document-point .van-icon { color: #16805c; }.document-foot { padding: 10px; border-radius: 8px; background: #f8f3e9; color: #796137 !important; }
.allocation.gold .donut { background: conic-gradient(#c79b43 0 99.8%,#e8dcc4 99.8%); box-shadow: inset 0 0 0 1px rgba(169,122,45,.12); }.allocation.gold .donut::after { content: 'Au'; color: #9a6c22; }.allocation.gold .legend .a { background: #c79b43; }.allocation.gold .legend .b { background: #e8dcc4; }.allocation.gold .legend .c { background: #173f6d; }
.fund-data-note p { margin: 0; color: #62758a; font-size: 12px; line-height: 1.6; }
</style>
