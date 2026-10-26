<template>
  <div class="page no-tab desk">
    <van-nav-bar :title="title" left-arrow @click-left="$router.back()" />

    <template v-if="kind === 'payees'">
      <van-cell-group inset style="margin-top:12px">
        <van-field v-model="form.name" :label="t('transfer.beneficiary')" :placeholder="t('transfer.beneficiaryPh')" />
        <van-field v-model="form.account" :label="t('transfer.to')" :placeholder="t('transfer.toPh')" />
        <van-field v-model="form.swift" :label="t('transfer.swift')" placeholder="DBSSSGSG" />
        <van-field v-model="form.bank" :label="t('transfer.bankName')" placeholder="DBS" />
        <van-field v-model="form.country" :label="t('transfer.bankCountry')" placeholder="SG" />
      </van-cell-group>
      <div class="pad"><van-button block round color="#0052d9" @click="onSavePayee">{{ t('desk.savePayee') }}</van-button></div>
      <div class="wb-card list">
        <div v-if="!payees.length" class="empty">{{ t('desk.emptyPayee') }}</div>
        <div v-for="p in payees" :key="p.id" class="row">
          <div>
            <div class="name">{{ p.name }}</div>
            <div class="muted">{{ p.account }} · {{ p.swift || p.country }}</div>
          </div>
          <van-button size="small" plain type="danger" @click="onRemovePayee(p.id)">{{ t('desk.remove') }}</van-button>
        </div>
      </div>
    </template>

    <template v-else-if="kind === 'orders'">
      <div class="hint">{{ t('desk.limitHint') }}</div>
      <div class="wb-card list">
        <div v-if="!orders.length" class="empty">{{ t('desk.emptyOrder') }}</div>
        <div v-for="o in orders" :key="o.id" class="row">
          <div>
            <div class="name">{{ o.name || o.account }} · {{ o.amount }}</div>
            <div class="muted">{{ o.kind }} · {{ o.status }} · {{ o.at?.slice(0, 16).replace('T', ' ') }}</div>
          </div>
          <van-button v-if="o.status === 'review'" size="small" color="#0052d9" @click="release(o)">{{ t('desk.release') }}</van-button>
        </div>
      </div>
    </template>

    <template v-else-if="kind === 'schedule'">
      <van-cell-group inset style="margin-top:12px">
        <van-field v-model="sched.date" type="date" :label="t('desk.when')" />
        <van-field v-model="sched.amount" :label="t('transfer.amount')" placeholder="50.00" />
        <van-field v-model="sched.name" :label="t('transfer.beneficiary')" />
        <van-field v-model="sched.account" :label="t('transfer.to')" />
        <van-field v-model="sched.swift" :label="t('transfer.swift')" placeholder="SCBLSGSG" />
      </van-cell-group>
      <div class="pad"><van-button block round color="#0052d9" @click="onSchedule">{{ t('desk.saveSched') }}</van-button></div>
      <div class="wb-card list">
        <div v-if="!schedules.length" class="empty">{{ t('desk.emptySched') }}</div>
        <div v-for="s in schedules" :key="s.id" class="row">
          <div>
            <div class="name">{{ s.date }} · {{ s.amount }}</div>
            <div class="muted">{{ s.name }} · {{ s.status }}</div>
          </div>
          <van-button v-if="s.status === 'scheduled'" size="small" color="#0052d9" @click="runSchedule(s)">{{ t('desk.runNow') }}</van-button>
        </div>
      </div>
    </template>

    <template v-else-if="kind === 'batch'">
      <div class="hint">{{ t('desk.batchHint') }}</div>
      <van-cell-group inset>
        <van-field v-for="(line, i) in batch" :key="i" v-model="line.amount" :label="line.name || t('desk.line', { n: i + 1 })" placeholder="10.00" />
      </van-cell-group>
      <div class="pad"><van-button block round color="#0052d9" :loading="busy" @click="runBatch">{{ t('desk.runBatch') }}</van-button></div>
    </template>

    <template v-else-if="kind === 'fx'">
      <div class="wb-card summary">
        <div class="muted">{{ t('home.usdEq') }}</div>
        <div class="num">{{ money(usdEq) }}</div>
        <div class="pockets">
          <span v-for="a in accounts" :key="a.account_no">{{ a.currency || 'USD' }} {{ money(a.balance, { currency: a.currency || 'USD' }) }}</span>
          <span v-for="c in pocketCodes" :key="c">{{ c }} {{ pocketBalance(c).toFixed(2) }}</span>
        </div>
      </div>
      <van-cell-group inset>
        <van-field v-model="fx.from" :label="t('desk.fromCcy')" placeholder="USD / EUR / CNY" />
        <van-field v-model="fx.to" :label="t('desk.toCcy')" placeholder="EUR / HKD / JPY / SGD" />
        <van-field v-model="fx.amount" :label="t('transfer.amount')" placeholder="100" />
      </van-cell-group>
      <div class="hint" v-if="fxQuote">1 {{ fx.from }} = {{ fxQuote.rate }} {{ fx.to }} → {{ fxQuote.out }}</div>
      <div class="pad"><van-button block round color="#0052d9" :loading="busy" @click="runFx">{{ t('desk.convert') }}</van-button></div>
    </template>

    <template v-else-if="kind === 'kyc'">
      <div class="hint">{{ t('desk.kycStatus') }}: {{ kyc.status }}</div>
      <van-cell-group inset>
        <van-field v-model="kyc.name" :label="t('desk.legalName')" />
        <van-field v-model="kyc.idNo" :label="t('desk.idNo')" />
        <van-field v-model="kyc.country" :label="t('desk.region')" placeholder="SG / TH / MY / ID / VN / PH" />
        <van-field v-model="kyc.address" :label="t('desk.address')" />
        <van-field v-model="kyc.taxId" :label="t('desk.taxId')" />
      </van-cell-group>
      <van-cell-group inset style="margin-top:12px">
        <van-cell :title="t('desk.faceTitle')" :value="faceOk ? t('desk.facePassed') : t('desk.faceStart')" is-link @click="showFace = true" />
      </van-cell-group>
      <div class="pad"><van-button block round color="#0052d9" @click="onKyc">{{ t('desk.submitKyc') }}</van-button></div>
      <FaceScan v-model:show="showFace" @done="onFaceDone" />
    </template>

    <template v-else-if="kind === 'pay'">
      <div class="rails">
        <button v-for="r in rails" :key="r" type="button" :class="{ on: pay.rail === r }" @click="pay.rail = r">{{ r }}</button>
      </div>
      <van-cell-group inset>
        <van-field v-model="pay.merchant" :label="t('desk.merchant')" placeholder="7-Eleven" />
        <van-field v-model="pay.amount" :label="t('transfer.amount')" placeholder="12.00" />
      </van-cell-group>
      <div class="hint">{{ t('desk.payHint') }}</div>
      <div class="pad"><van-button block round color="#0052d9" :loading="busy" @click="runPay">{{ t('desk.payNow') }}</van-button></div>
    </template>

    <template v-else-if="kind === 'bills'">
      <div class="wb-card list">
        <div v-for="b in bills" :key="b.id" class="row">
          <div>
            <div class="name">{{ t(b.nameKey) }}</div>
            <div class="muted">{{ b.payee }} · {{ b.amount }} {{ b.ccy }} · {{ b.status }}</div>
          </div>
          <van-button v-if="b.status !== 'paid'" size="small" color="#0052d9" @click="payBill(b)">{{ t('desk.payNow') }}</van-button>
        </div>
      </div>
      <div class="section-hd"><span>{{ t('desk.disputes') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="dispute.ref" :label="t('desk.ref')" placeholder="TXN / card" />
        <van-field v-model="dispute.reason" :label="t('desk.reason')" :placeholder="t('desk.reasonPh')" />
      </van-cell-group>
      <div class="pad"><van-button block round plain color="#0052d9" @click="onDispute">{{ t('desk.openDispute') }}</van-button></div>
      <div class="wb-card list">
        <div v-for="d in disputes" :key="d.id" class="row">
          <div>
            <div class="name">{{ d.ref }}</div>
            <div class="muted">{{ d.reason }} · {{ d.status }}</div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="kind === 'holdings'">
      <div class="wb-card list">
        <div v-if="!holdings.length" class="empty">{{ t('desk.emptyHold') }}</div>
        <div v-for="h in holdings" :key="h.id" class="row">
          <div>
            <div class="name">{{ h.name }}</div>
            <div class="muted">{{ money(h.amount) }} · {{ h.rate }}</div>
          </div>
          <van-button size="small" color="#0052d9" @click="onRedeem(h)">{{ t('desk.redeem') }}</van-button>
        </div>
      </div>
    </template>

    <PayPassword ref="payPwd" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { deposit, fetchHome, transfer, withdraw } from '../api'
import PayPassword from '../components/PayPassword.vue'
import FaceScan from '../components/FaceScan.vue'
import { money } from '../utils'
import { pushNotice } from '../utils/local'
import { openResult } from '../utils/result'
import {
  addSchedule,
  cardControl,
  faceVerified,
  getKyc,
  markFaceVerified,
  limitError,
  listBills,
  listDisputes,
  listHoldings,
  listOrders,
  listPayees,
  listSchedules,
  markBillPaid,
  openDispute,
  patchOrder,
  patchSchedule,
  pocketBalance,
  quoteFx,
  sumUsd,
  recordOrder,
  redeemHolding,
  removePayee,
  saveKyc,
  savePayee,
  setPocket,
  validateCounterparty
} from '../services/desk'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const kind = computed(() => route.meta.desk || 'payees')
const title = computed(() => t(`desk.title_${kind.value}`))
const payPwd = ref(null)
const showFace = ref(false)
const faceOk = ref(faceVerified())
const faceAfterSubmit = ref(false)
const busy = ref(false)
const accountNo = ref('')
const usdBalance = ref('0.00')
const accounts = ref([])
const payees = ref([])
const orders = ref([])
const schedules = ref([])
const bills = ref([])
const disputes = ref([])
const holdings = ref([])
const kyc = reactive(getKyc())
const fxCodes = ['SGD', 'THB', 'MYR', 'IDR', 'VND', 'PHP']

const form = reactive({ name: '', account: '', swift: '', bank: '', country: 'SG' })
const sched = reactive({ date: '', amount: '50.00', name: '', account: '', swift: 'DBSSSGSG' })
const batch = reactive([
  { name: 'DBS', account: '0123456789', swift: 'DBSSSGSG', amount: '10.00' },
  { name: 'SCB', account: '1234567890', swift: 'SICOTHBK', amount: '20.00' },
  { name: 'Maybank', account: '1122334455', swift: 'MBBEMYKL', amount: '15.00' }
])
const fx = reactive({ from: 'USD', to: 'SGD', amount: '100' })
const pay = reactive({ rail: 'PayNow', merchant: '7-Eleven', amount: '12.00' })
const dispute = reactive({ ref: '', reason: '' })
const rails = ['PayNow', 'PromptPay', 'DuitNow', 'QRIS']

const fxQuote = computed(() => quoteFx(fx.from.trim().toUpperCase(), fx.to.trim().toUpperCase(), fx.amount))
const usdEq = computed(() => sumUsd(accounts.value).toFixed(2))
const pocketCodes = computed(() => fxCodes.filter((code) => !accounts.value.some((a) => (a.currency || 'USD') === code)))

function acctOf(ccy) {
  return accounts.value.find((a) => (a.currency || 'USD') === ccy)
}

function reload() {
  payees.value = listPayees()
  orders.value = listOrders()
  schedules.value = listSchedules()
  bills.value = listBills()
  disputes.value = listDisputes()
  holdings.value = listHoldings()
  Object.assign(kyc, getKyc())
}

async function loadAccount() {
  const res = await fetchHome()
  if (res.code !== 0) return
  accounts.value = res.data.accounts || []
  const usd = acctOf('USD') || accounts.value[0]
  if (usd) {
    accountNo.value = usd.account_no
    usdBalance.value = usd.balance || '0.00'
  }
}

function onSavePayee() {
  const err = validateCounterparty({ mode: 'wire', name: form.name, account: form.account, swift: form.swift })
  if (err) {
    showFailToast(t(err))
    return
  }
  savePayee(form)
  reload()
  openResult(router, {
    kind: 'payee',
    note: t('result.note_payee'),
    title: t('desk.saved'),
    back: '/payees',
    rows: [
      { label: t('transfer.beneficiary'), value: form.name },
      { label: t('transfer.to'), value: form.account },
      { label: t('transfer.swift'), value: form.swift || '-' },
      { label: t('transfer.bankName'), value: form.bank || '-' },
      { label: t('transfer.bankCountry'), value: form.country || '-' }
    ]
  })
}

function onRemovePayee(id) {
  removePayee(id)
  reload()
}

async function sendWire(payload, pin) {
  const lim = limitError(payload.amount)
  if (lim) {
    showFailToast(t(lim))
    return false
  }
  const res = await transfer({
    from_account_no: accountNo.value,
    to_account_no: payload.account,
    amount: String(payload.amount),
    pay_password: pin,
    beneficiary_name: payload.name,
    swift_code: payload.swift,
    bank_name: payload.bank || payload.name,
    bank_country: payload.country || 'SG',
    bank_address: '',
    remittance_info: payload.memo || '',
    transfer_type: 'wire'
  })
  if (res.code !== 0) {
    openResult(router, {
      kind: 'transfer',
      note: t('result.note_transfer'),
      ok: false,
      title: t('transfer.outFail'),
      reason: res.message || t('transfer.outFail'),
      amount: `$${Number(payload.amount).toFixed(2)}`,
      back: '/orders',
      rows: [
        { label: t('transfer.beneficiary'), value: payload.name || '-' },
        { label: t('transfer.to'), value: payload.account || '-' }
      ]
    })
    return false
  }
  recordOrder({ ...payload, kind: payload.kind || 'wire', status: 'completed' })
  return true
}

async function release(o) {
  const pin = await payPwd.value.ask()
  if (!pin) return
  busy.value = true
  try {
    const ok = await sendWire(o, pin)
    if (!ok) return
    patchOrder(o.id, { status: 'completed' })
    reload()
    openResult(router, {
      kind: 'transfer',
      note: t('result.note_transfer'),
      title: t('desk.released'),
      amount: `$${Number(o.amount).toFixed(2)}`,
      back: '/orders',
      rows: [
        { label: t('transfer.beneficiary'), value: o.name },
        { label: t('transfer.to'), value: o.account },
        { label: t('transfer.swift'), value: o.swift || '-' }
      ]
    })
  } finally {
    busy.value = false
  }
}

function onSchedule() {
  if (!sched.date || !sched.name || !sched.account) {
    showFailToast(t('desk.needSched'))
    return
  }
  addSchedule({ ...sched })
  reload()
  openResult(router, {
    kind: 'schedule',
    note: t('result.note_schedule'),
    title: t('desk.saved'),
    amount: `$${Number(sched.amount || 0).toFixed(2)}`,
    back: '/schedule',
    rows: [
      { label: t('transfer.beneficiary'), value: sched.name },
      { label: t('transfer.to'), value: sched.account },
      { label: t('result.time'), value: sched.date }
    ]
  })
}

async function runSchedule(s) {
  const pin = await payPwd.value.ask()
  if (!pin) return
  const ok = await sendWire({ ...s, kind: 'scheduled', memo: `scheduled ${s.date}` }, pin)
  if (!ok) return
  patchSchedule(s.id, { status: 'completed' })
  reload()
  openResult(router, {
    kind: 'transfer',
    note: t('result.note_transfer'),
    title: t('transfer.outOk'),
    amount: `$${Number(s.amount).toFixed(2)}`,
    back: '/schedule',
    rows: [
      { label: t('transfer.beneficiary'), value: s.name },
      { label: t('transfer.to'), value: s.account },
      { label: t('result.time'), value: s.date }
    ]
  })
}

async function runBatch() {
  const pin = await payPwd.value.ask()
  if (!pin) return
  busy.value = true
  try {
    for (const line of batch) {
      if (!Number(line.amount)) continue
      const ok = await sendWire({ ...line, kind: 'batch', memo: 'batch' }, pin)
      if (!ok) return
    }
    const total = batch.reduce((n, line) => n + (Number(line.amount) || 0), 0)
    reload()
    openResult(router, {
      kind: 'transfer',
      note: t('result.note_batch'),
      title: t('desk.batchOk'),
      amount: `$${total.toFixed(2)}`,
      back: '/batch',
      rows: batch.filter((line) => Number(line.amount)).map((line) => ({
        label: line.name,
        value: `$${Number(line.amount).toFixed(2)}`
      }))
    })
  } finally {
    busy.value = false
  }
}

async function settleFx(from, to, amount, out, pin) {
  const src = acctOf(from)
  const dst = acctOf(to)
  const need = Number(amount)
  if (src) {
    if (Number(src.balance) < need) return { ok: false, reason: t('desk.fxShort') }
    const res = await withdraw(src.account_no, String(amount), pin)
    if (res.code !== 0) return { ok: false, reason: res.message || t('desk.fxFail') }
  } else if (pocketBalance(from) < need) {
    return { ok: false, reason: t('desk.fxShort') }
  } else {
    setPocket(from, pocketBalance(from) - need)
  }
  if (dst) {
    const res = await deposit(dst.account_no, String(out), pin)
    if (res.code !== 0) {
      if (src) await deposit(src.account_no, String(amount), pin)
      else setPocket(from, pocketBalance(from) + need)
      return { ok: false, reason: res.message || t('desk.fxFail') }
    }
  } else {
    setPocket(to, pocketBalance(to) + Number(out))
  }
  return { ok: true }
}

async function runFx() {
  const from = fx.from.trim().toUpperCase()
  const to = fx.to.trim().toUpperCase()
  const q = quoteFx(from, to, fx.amount)
  if (!q) {
    showFailToast(t('desk.badAmt'))
    return
  }
  const pin = await payPwd.value.ask()
  if (!pin) return
  busy.value = true
  try {
    const moved = await settleFx(from, to, fx.amount, q.out, pin)
    if (!moved.ok) {
      openResult(router, {
        kind: 'fx',
        note: t('result.note_fx'),
        ok: false,
        title: t('desk.fxFail'),
        reason: moved.reason || t('desk.fxFail'),
        amount: `${Number(fx.amount).toFixed(2)} ${from}`,
        back: '/fx',
        rows: [{ label: t('result.pair'), value: `${from} → ${to}` }]
      })
      return
    }
    recordOrder({ kind: 'fx', name: `${from}->${to}`, account: to, amount: fx.amount, status: 'completed' })
    await loadAccount()
    openResult(router, {
      kind: 'fx',
      note: t('result.note_fx'),
      title: t('desk.fxOk'),
      amount: `${Number(fx.amount).toFixed(2)} ${from}`,
      back: '/fx',
      rows: [
        { label: t('result.pair'), value: `${from} → ${to}` },
        { label: t('result.rate'), value: String(q.rate) },
        { label: t('result.received'), value: `${Number(q.out).toFixed(2)} ${to}` }
      ]
    })
  } finally {
    busy.value = false
  }
}

function onKyc() {
  const next = saveKyc({ ...kyc })
  Object.assign(kyc, next)
  if (next.status !== 'verified') {
    showFailToast(t('desk.kycIncomplete'))
    return
  }
  if (!faceVerified()) {
    faceAfterSubmit.value = true
    showFace.value = true
    return
  }
  finishKyc()
}

function onFaceDone() {
  markFaceVerified()
  faceOk.value = true
  if (!faceAfterSubmit.value) return
  faceAfterSubmit.value = false
  finishKyc()
}

function finishKyc() {
  markFaceVerified()
  pushNotice(t('desk.kycOk'), kyc.country)
  openResult(router, {
    kind: 'kyc',
    note: t('desk.kycNote'),
    title: t('desk.kycOk'),
    back: '/mine',
    rows: [
      { label: t('transfer.beneficiary'), value: kyc.name || '-' },
      { label: t('transfer.bankCountry'), value: kyc.country || '-' },
      { label: t('desk.faceTitle'), value: t('desk.facePassed') }
    ]
  })
}

async function runPay() {
  const ctrl = cardControl('wecode')
  if (ctrl.frozen || ctrl.lost) {
    showFailToast(t('desk.cardBlocked'))
    return
  }
  if (Number(pay.amount) > Number(ctrl.limit || 1000)) {
    showFailToast(t('desk.cardLimit'))
    return
  }
  const pin = await payPwd.value.ask()
  if (!pin) return
  busy.value = true
  try {
    const res = await withdraw(accountNo.value, String(pay.amount), pin)
    if (res.code !== 0) {
      openResult(router, {
        kind: 'pay',
        note: t('result.note_pay'),
        ok: false,
        title: t('desk.payFail'),
        reason: res.message || t('desk.payFail'),
        amount: `$${Number(pay.amount).toFixed(2)}`,
        back: '/pay',
        rows: [
          { label: t('result.merchant'), value: pay.merchant },
          { label: t('result.rail'), value: pay.rail }
        ]
      })
      return
    }
    recordOrder({
      kind: pay.rail,
      name: pay.merchant,
      account: pay.rail,
      amount: pay.amount,
      status: 'completed'
    })
    pushNotice(pay.rail, `${pay.merchant} ${pay.amount}`)
    openResult(router, {
      kind: 'pay',
      note: t('result.note_pay'),
      title: t('desk.payOk'),
      amount: `$${Number(pay.amount).toFixed(2)}`,
      back: '/pay',
      rows: [
        { label: t('result.merchant'), value: pay.merchant },
        { label: t('result.rail'), value: pay.rail },
        { label: t('transfer.from'), value: accountNo.value }
      ]
    })
  } finally {
    busy.value = false
  }
}

async function payBill(b) {
  const pin = await payPwd.value.ask()
  if (!pin) return
  const usd = quoteFx(b.ccy, 'USD', b.amount)
  const res = await withdraw(accountNo.value, String(usd.out), pin)
  if (res.code !== 0) {
    openResult(router, {
      kind: 'bill',
      note: t('result.note_bill'),
      ok: false,
      title: t('desk.payFail'),
      reason: res.message || t('desk.payFail'),
      amount: `${b.amount} ${b.ccy}`,
      back: '/bills',
      rows: [{ label: t('result.merchant'), value: b.payee }]
    })
    return
  }
  markBillPaid(b.id)
  recordOrder({ kind: 'bill', name: b.payee, account: b.ccy, amount: usd.out, status: 'completed' })
  reload()
  openResult(router, {
    kind: 'bill',
    note: t('result.note_bill'),
    title: t('desk.payOk'),
    amount: `${b.amount} ${b.ccy}`,
    back: '/bills',
    rows: [
      { label: t('result.merchant'), value: b.payee },
      { label: t('result.received'), value: `$${Number(usd.out).toFixed(2)}` },
      { label: t('result.rate'), value: String(usd.rate) }
    ]
  })
}

function onDispute() {
  if (!dispute.ref || !dispute.reason) {
    showFailToast(t('desk.needDispute'))
    return
  }
  const filed = { ...dispute }
  openDispute(filed)
  dispute.ref = ''
  dispute.reason = ''
  reload()
  openResult(router, {
    kind: 'dispute',
    note: t('result.note_dispute'),
    title: t('desk.disputeOk'),
    back: '/bills',
    rows: [
      { label: t('result.ref'), value: filed.ref },
      { label: t('desk.reason'), value: filed.reason }
    ]
  })
}

async function onRedeem(h) {
  const pin = await payPwd.value.ask()
  if (!pin) return
  const res = await deposit(accountNo.value, String(h.amount), pin)
  if (res.code !== 0) {
    openResult(router, {
      kind: 'wealth',
      note: t('result.note_wealth'),
      ok: false,
      title: t('desk.fxFail'),
      reason: res.message || t('desk.fxFail'),
      amount: `$${Number(h.amount).toFixed(2)}`,
      back: '/holdings',
      rows: [{ label: t('result.product'), value: h.name }]
    })
    return
  }
  redeemHolding(h.id, h.amount)
  reload()
  openResult(router, {
    kind: 'wealth',
    note: t('result.note_wealth'),
    title: t('desk.redeemOk'),
    amount: `$${Number(h.amount).toFixed(2)}`,
    ref: res.data?.txn_id,
    back: '/holdings',
    rows: [
      { label: t('result.product'), value: h.name },
      { label: t('transfer.to'), value: accountNo.value }
    ]
  })
}

onMounted(async () => {
  reload()
  await loadAccount()
  if (payees.value[0] && !sched.name) {
    sched.name = payees.value[0].name
    sched.account = payees.value[0].account
    sched.swift = payees.value[0].swift
  }
})
</script>

<style scoped>
:deep(.van-nav-bar) { background: #0052d9; }
:deep(.van-nav-bar__title), :deep(.van-nav-bar .van-icon) { color: #fff !important; }
.desk { padding-bottom: 28px; }
.pad { margin: 16px; }
.hint { margin: 12px 16px; color: #666; font-size: 13px; }
.list { margin: 12px; padding: 4px 12px; }
.row { display: flex; justify-content: space-between; gap: 8px; align-items: center; padding: 12px 0; border-bottom: 1px solid #f2f3f5; }
.row:last-child { border-bottom: 0; }
.name { font-weight: 600; font-size: 14px; }
.muted { color: #8a8f99; font-size: 12px; margin-top: 4px; }
.empty { padding: 16px; text-align: center; color: #999; }
.summary { margin: 12px; padding: 16px; }
.num { font-size: 28px; font-weight: 800; margin: 4px 0; }
.pockets { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #555; }
.rails { display: flex; gap: 8px; padding: 12px 16px 0; flex-wrap: wrap; }
.rails button { border: 0; background: #fff; border-radius: 16px; padding: 6px 12px; }
.rails button.on { background: #0052d9; color: #fff; }
.lang { display: flex; gap: 8px; }
</style>
