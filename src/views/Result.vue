<template>
  <div class="page no-tab result">
    <div class="brand">aku-bank</div>
    <div v-if="receipt.amount" class="amount">{{ receipt.amount }}</div>
    <div class="headline">{{ receipt.title }}</div>
    <div v-if="receipt.subtitle" class="sub">{{ receipt.subtitle }}</div>

    <div class="card status">
      <div class="status-row">
        <div v-if="phase === 'query'" class="mini" aria-hidden="true">
          <i />
        </div>
        <div v-else :class="['badge', receipt.ok ? 'okb' : 'badb']">{{ receipt.ok ? '✓' : '!' }}</div>
        <div class="status-copy">
          <div :class="['status-title', phase === 'done' && !receipt.ok ? 'bad' : '', phase === 'done' && receipt.ok ? 'good' : '']">
            {{ phase === 'query' ? queryTitle : (receipt.ok ? okTitle : failTitle) }}
          </div>
          <div class="status-sub">
            {{ phase === 'query' ? t('result.queryingSub') : (receipt.ok ? doneLabel : (receipt.reason || failTitle)) }}
          </div>
        </div>
      </div>
      <div class="log">
        <div v-for="(line, i) in logs" :key="i" class="log-line">
          <span>{{ line.time }}</span>
          <b :class="{ good: line.ok === true, bad: line.ok === false }">{{ line.text }}</b>
        </div>
      </div>
    </div>

    <div v-if="phase === 'done' && !receipt.ok && receipt.reason" class="reason">{{ receipt.reason }}</div>

    <div class="card">
      <div class="line">
        <span>{{ t('result.biz') }}</span>
        <b>{{ kindLabel }}</b>
      </div>
      <div v-if="receipt.note" class="line">
        <span>{{ t('result.note') }}</span>
        <b>{{ receipt.note }}</b>
      </div>
      <div class="line">
        <span>{{ t('result.ref') }}</span>
        <b>{{ receipt.ref }}</b>
      </div>
      <div class="line">
        <span>{{ t('result.time') }}</span>
        <b>{{ when }}</b>
      </div>
      <div class="line">
        <span>{{ t('result.status') }}</span>
        <b :class="phase === 'query' ? 'waitc' : (receipt.ok ? 'good' : 'bad')">
          {{ phase === 'query' ? pendingLabel : (receipt.ok ? doneLabel : t('result.failStatus')) }}
        </b>
      </div>
      <div class="line">
        <span>{{ t('result.channel') }}</span>
        <b>aku-bank</b>
      </div>
      <div v-if="isTxn" class="line">
        <span>{{ t('result.fee') }}</span>
        <b>$0.00</b>
      </div>
      <div v-for="(row, i) in receipt.rows" :key="i" class="line">
        <span>{{ row.label }}</span>
        <b>{{ row.value }}</b>
      </div>
    </div>

    <div v-if="phase === 'done'" class="actions">
      <van-button block round :color="receipt.ok ? '#123b6d' : '#e34d59'" @click="finish">{{ t('result.done') }}</van-button>
      <van-button v-if="isTxn" block round plain color="#123b6d" style="margin-top:10px" @click="$router.replace('/transactions')">
        {{ t('result.activity') }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchHome } from '../api'
import { readResult } from '../utils/result'

const { t } = useI18n()
const router = useRouter()
const phase = ref('query')
const logs = ref([])
const receipt = ref(readResult() || {
  ok: false,
  kind: 'transfer',
  note: '',
  title: '',
  reason: '',
  amount: '',
  subtitle: '',
  rows: [],
  ref: '-',
  time: new Date().toISOString(),
  back: '/'
})
const TXN = new Set(['transfer', 'loan', 'wealth', 'fx', 'pay', 'bill', 'points', 'redeem'])
const isTxn = computed(() => TXN.has(receipt.value.kind || 'transfer'))
const isKyc = computed(() => receipt.value.kind === 'kyc')
const queryTitle = computed(() => (isKyc.value ? t('result.kycQuery') : isTxn.value ? t('result.querying') : t('result.bizQuery')))
const okTitle = computed(() => (isKyc.value ? t('result.kycOk') : isTxn.value ? t('result.success') : t('result.bizOk')))
const failTitle = computed(() => (isKyc.value ? t('result.kycFail') : isTxn.value ? t('result.failed') : t('result.bizFail')))
const doneLabel = computed(() => (isKyc.value ? t('result.kycDone') : isTxn.value ? t('result.posted') : t('result.bizDone')))
const pendingLabel = computed(() => (isKyc.value ? t('result.kycPending') : isTxn.value ? t('result.pending') : t('result.bizPending')))
const submittedLabel = computed(() => (isKyc.value ? t('result.submittedKyc') : isTxn.value ? t('result.submittedTxn') : t('result.submittedBiz')))
const kindLabel = computed(() => {
  const key = `result.kind_${receipt.value.kind || 'transfer'}`
  const label = t(key)
  return label === key ? (receipt.value.kind || '') : label
})

const when = computed(() => {
  const d = new Date(receipt.value.time || Date.now())
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
})

function clock() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function pushLog(text, ok) {
  logs.value.push({ time: clock(), text, ok })
}

function finish() {
  router.replace(receipt.value.back || '/')
}

let alive = true
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

onMounted(async () => {
  if (!readResult()) {
    router.replace('/')
    return
  }
  pushLog(submittedLabel.value)
  for (let n = 1; n <= 3; n++) {
    await wait(1000)
    if (!alive) return
    let note = pendingLabel.value
    let flag
    try {
      if (isTxn.value) await fetchHome()
    } catch {
      note = pendingLabel.value
    }
    if (n === 3) {
      flag = !!receipt.value.ok
      note = flag ? okTitle.value : (receipt.value.reason || failTitle.value)
    }
    pushLog(`${t('result.round', { n })} · ${note}`, flag)
  }
  if (alive) phase.value = 'done'
})
onBeforeUnmount(() => { alive = false })
</script>

<style scoped>
.result { min-height: 100vh; background: #f4f6fa; padding: 28px 16px 32px; text-align: center; }
.brand { color: #123b6d; font-weight: 800; letter-spacing: 0.6px; }
.amount { margin-top: 14px; font-size: 34px; font-weight: 800; }
.headline { margin-top: 6px; font-size: 18px; font-weight: 800; }
.sub { margin-top: 4px; color: #8a8f99; font-size: 13px; }
.card {
  margin-top: 16px; background: #fff; border-radius: 14px; padding: 6px 14px; text-align: left;
  box-shadow: 0 6px 18px rgba(16, 24, 40, .04);
}
.status { padding: 14px; }
.status-row { display: flex; align-items: center; gap: 12px; }
.status-copy { min-width: 0; }
.status-title { font-size: 16px; font-weight: 800; }
.status-sub { margin-top: 4px; color: #8a8f99; font-size: 12px; }
.mini {
  width: 36px; height: 36px; flex-shrink: 0; position: relative;
}
.mini i {
  position: absolute; inset: 0; border-radius: 50%;
  border: 3px solid #d6e4ff; border-top-color: #123b6d; border-right-color: #123b6d;
  animation: spin 0.7s linear infinite;
}
.badge {
  width: 36px; height: 36px; border-radius: 50%; color: #fff; font-weight: 800;
  line-height: 36px; text-align: center; flex-shrink: 0;
}
.okb { background: #00a870; }
.badb { background: #e34d59; }
.log { margin-top: 12px; border-top: 1px solid #f2f4f7; padding-top: 8px; }
.log-line { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; font-size: 13px; }
.log-line span { color: #8a8f99; }
.log-line b { font-weight: 600; text-align: right; }
.reason {
  margin-top: 12px; padding: 10px 12px; border-radius: 10px;
  background: #fff1f0; color: #e34d59; font-size: 13px; text-align: left;
}
.line { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f2f4f7; font-size: 13px; }
.line:last-child { border-bottom: 0; }
.line span { color: #8a8f99; flex-shrink: 0; }
.line b { font-weight: 600; text-align: right; word-break: break-all; }
.good { color: #00a870; }
.bad { color: #e34d59; }
.waitc { color: #123b6d; }
.actions { margin-top: 22px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
