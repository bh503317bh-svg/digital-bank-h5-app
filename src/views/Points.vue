<template>
  <div class="page no-tab shop">
    <van-nav-bar :title="t('points.title')" left-arrow @click-left="$router.back()">
      <template #right>
        <span class="nav-link" @click="tab = 1">{{ t('points.orders') }}</span>
      </template>
    </van-nav-bar>

    <div class="wb-card head">
      <div class="cols">
        <div>
          <div class="muted">{{ t('points.balance') }}</div>
          <div class="num">{{ points }}</div>
        </div>
        <div class="right">
          <div class="muted">{{ t('points.cashBal') }}</div>
          <div class="cash">{{ money(cashBalance) }}</div>
        </div>
      </div>
      <div class="tip">{{ t('points.rule') }}</div>
    </div>

    <van-tabs v-model:active="tab" color="#0052d9" sticky>
      <van-tab :title="t('points.mall')">
        <div class="cats">
          <span
            v-for="c in categories"
            :key="c.key"
            :class="['chip', { on: cat === c.key }]"
            @click="cat = c.key"
          >{{ c.label }}</span>
        </div>
        <div class="grid">
          <div v-for="p in filtered" :key="p.product_id" class="wb-card card" @click="openBuy(p)">
            <div class="cover">{{ p.cover }}</div>
            <div class="name">{{ p.name }}</div>
            <div class="price">
              <span>{{ money(p.price_yuan) }}</span>
              <span class="or">{{ t('points.or') }}</span>
              <span>{{ p.price_points }}{{ t('points.unit') }}</span>
            </div>
            <van-button size="mini" color="#0052d9" round>{{ t('points.buy') }}</van-button>
          </div>
        </div>
      </van-tab>
      <van-tab :title="t('points.orders')">
        <div v-if="!orders.length" class="empty">{{ t('points.noOrders') }}</div>
        <div v-else class="wb-card list">
          <div v-for="o in orders" :key="o.order_id" class="order">
            <div class="oname">{{ o.product_name }} ×{{ o.qty }}</div>
            <div class="ometa">
              {{ t('points.payCash') }} {{ money(o.pay_cash) }} · {{ t('points.payPts') }} {{ o.pay_points }}
            </div>
            <div class="ometa">{{ o.created_at }} · {{ o.status }}</div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <van-action-sheet v-model:show="showBuy" :title="selected?.name || ''">
      <div class="sheet" v-if="selected">
        <div class="muted">{{ selected.desc }}</div>
        <div class="need">{{ t('points.need') }}: {{ money(lineYuan) }} / {{ linePoints }}{{ t('points.unit') }}</div>

        <div class="modes">
          <span :class="['chip', { on: mode === 'points' }]" @click="setMode('points')">{{ t('points.modePts') }}</span>
          <span :class="['chip', { on: mode === 'cash' }]" @click="setMode('cash')">{{ t('points.modeCash') }}</span>
          <span :class="['chip', { on: mode === 'split' }]" @click="setMode('split')">{{ t('points.modeSplit') }}</span>
        </div>

        <van-field v-model="qty" type="digit" :label="t('points.qty')" />
        <van-field
          v-if="mode !== 'points'"
          v-model="accountNo"
          is-link
          readonly
          :label="t('points.account')"
          @click="showAcc = true"
        />
        <van-field
          v-if="mode === 'split'"
          v-model="splitPoints"
          type="digit"
          :label="t('points.usePts')"
          :placeholder="t('points.splitPh')"
        />
        <div class="summary">
          {{ t('points.willPay') }}：{{ payPoints }}{{ t('points.unit') }} + {{ money(payCash) }}
        </div>
        <van-button block round color="#0052d9" :loading="loading" @click="confirmBuy">
          {{ t('points.confirm') }}
        </van-button>
      </div>
    </van-action-sheet>

    <van-action-sheet v-model:show="showAcc" :actions="accActions" @select="onPickAcc" />
    <PayPassword ref="payPwd" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { fetchHome, shopBuy, shopCatalog, shopOrders } from '../api'
import PayPassword from '../components/PayPassword.vue'
import { money } from '../utils'
import { getPoints, pushNotice, setPoints } from '../utils/local'
import { openResult } from '../utils/result'

const { t, locale } = useI18n()
const router = useRouter()
const tab = ref(0)
const cat = ref('all')
const catalog = ref([])
const orders = ref([])
const points = ref(getPoints())
const cashBalance = ref('0.00')
const accounts = ref([])
const accountNo = ref('')
const showBuy = ref(false)
const showAcc = ref(false)
const selected = ref(null)
const mode = ref('points')
const qty = ref('1')
const splitPoints = ref('')
const loading = ref(false)
const payPwd = ref(null)

const categories = computed(() => {
  locale.value
  return [
    { key: 'all', label: t('points.catAll') },
    { key: 'gift_card', label: t('points.catGift') },
    { key: 'subscription', label: t('points.catSub') },
    { key: 'banking', label: t('points.catBank') }
  ]
})

const filtered = computed(() => {
  if (cat.value === 'all') return catalog.value
  return catalog.value.filter((p) => p.category === cat.value)
})

const accActions = computed(() =>
  accounts.value.map((a) => ({
    name: `${a.currency || 'USD'}  ${a.account_no}  ${money(a.balance, { currency: a.currency || 'USD' })}`,
    account_no: a.account_no,
    balance: a.balance
  }))
)

const q = computed(() => Math.max(1, Math.min(10, parseInt(qty.value || '1', 10) || 1)))
const lineYuan = computed(() => {
  if (!selected.value) return '0.00'
  return (Number(selected.value.price_yuan) * q.value).toFixed(2)
})
const linePoints = computed(() => (selected.value ? selected.value.price_points * q.value : 0))

const payPoints = computed(() => {
  const total = linePoints.value
  if (mode.value === 'points') return total
  if (mode.value === 'cash') return 0
  const sp = Math.max(0, Math.min(total, parseInt(splitPoints.value || '0', 10) || 0))
  return sp
})

const payCash = computed(() => {
  const totalCents = linePoints.value
  const pts = payPoints.value
  return ((totalCents - pts) / 100).toFixed(2)
})

function setMode(m) {
  mode.value = m
  if (m === 'split' && !splitPoints.value) {
    splitPoints.value = String(Math.floor(linePoints.value / 2))
  }
}

watch(q, () => {
  if (mode.value === 'split') splitPoints.value = String(Math.floor(linePoints.value / 2))
})

function openBuy(p) {
  selected.value = p
  mode.value = 'points'
  qty.value = '1'
  splitPoints.value = ''
  showBuy.value = true
}

function onPickAcc(action) {
  accountNo.value = action.account_no
  showAcc.value = false
}

async function load() {
  points.value = getPoints()
  const [home, catRes, ordRes] = await Promise.all([
    fetchHome(),
    shopCatalog(),
    shopOrders()
  ])
  if (home.code === 0) {
    accounts.value = home.data.accounts || []
    const usd = accounts.value.find((a) => (a.currency || 'USD') === 'USD') || accounts.value[0]
    cashBalance.value = usd?.balance || '0.00'
    if (!accountNo.value && usd) accountNo.value = usd.account_no
  }
  if (catRes.code === 0) catalog.value = catRes.data?.items || []
  if (ordRes.code === 0) orders.value = ordRes.data || []
}

async function confirmBuy() {
  if (!selected.value) return
  const pts = payPoints.value
  const cash = payCash.value
  if (pts > points.value) {
    showFailToast(t('points.notEnough'))
    return
  }
  if (Number(cash) > 0 && !accountNo.value) {
    showFailToast(t('points.needAccount'))
    return
  }
  const pin = await payPwd.value.ask()
  if (!pin) return
  loading.value = true
  try {
    const res = await shopBuy({
      account_no: accountNo.value,
      product_id: selected.value.product_id,
      qty: q.value,
      pay_cash: cash,
      pay_points: pts,
      pay_password: pin
    })
    if (res.code !== 0) {
      openResult(router, {
        kind: 'points',
        note: t('result.note_points'),
        ok: false,
        title: t('points.fail'),
        reason: res.message || t('points.fail'),
        subtitle: selected.value.name,
        back: '/points',
        rows: [
          { label: t('result.product'), value: selected.value.name },
          { label: t('result.qty'), value: String(q.value) }
        ]
      })
      return
    }
    if (pts > 0) {
      points.value -= pts
      setPoints(points.value)
    }
    pushNotice(t('points.ok'), selected.value.name)
    openResult(router, {
      kind: 'points',
      note: t('result.note_points'),
      title: t('points.ok'),
      amount: Number(cash) > 0 ? money(cash) : `${pts} pts`,
      subtitle: selected.value.name,
      ref: res.data?.order_id,
      back: '/points',
      rows: [
        { label: t('result.product'), value: selected.value.name },
        { label: t('result.qty'), value: String(q.value) },
        { label: t('points.balance'), value: String(points.value) },
        { label: t('result.cash'), value: money(cash) }
      ]
    })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
:deep(.van-nav-bar) { background: #0052d9; }
:deep(.van-nav-bar__title), :deep(.van-nav-bar .van-icon) { color: #fff !important; }
.nav-link { color: #fff; font-size: 13px; padding-right: 4px; }
.head { margin: 12px; padding: 16px; }
.cols { display: flex; justify-content: space-between; gap: 12px; }
.num { font-size: 32px; font-weight: 800; color: #0052d9; margin-top: 4px; }
.cash { font-size: 22px; font-weight: 700; margin-top: 4px; }
.right { text-align: right; }
.tip { margin-top: 10px; font-size: 12px; color: #8a8f99; line-height: 1.4; }
.cats { display: flex; gap: 8px; padding: 12px; flex-wrap: wrap; }
.chip {
  padding: 6px 12px; border-radius: 14px; background: #f3f5f9; font-size: 12px; color: #666;
}
.chip.on { background: #e8f1ff; color: #0052d9; font-weight: 600; }
.grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 12px 24px;
}
.card { padding: 14px; }
.cover { font-size: 28px; }
.name { margin-top: 8px; font-weight: 700; font-size: 13px; min-height: 36px; line-height: 1.3; }
.price { margin: 8px 0; font-size: 12px; color: #e34d59; font-weight: 600; }
.or { color: #999; margin: 0 4px; font-weight: 400; }
.muted { color: #8a8f99; font-size: 12px; }
.sheet { padding: 12px 16px 28px; }
.need { margin: 10px 0; font-weight: 600; }
.modes { display: flex; gap: 8px; margin: 10px 0 6px; flex-wrap: wrap; }
.summary { margin: 12px 0; font-size: 14px; font-weight: 600; color: #0052d9; }
.list { margin: 12px; padding: 4px 14px; }
.order { padding: 14px 0; border-bottom: 1px solid #f0f2f5; }
.oname { font-weight: 700; }
.ometa { margin-top: 4px; font-size: 12px; color: #8a8f99; }
.empty { padding: 40px; text-align: center; color: #999; }
</style>
