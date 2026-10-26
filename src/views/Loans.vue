<template>
  <div class="page no-tab loans">
    <van-nav-bar :title="t('loans.title')" left-arrow @click-left="$router.back()" />

    <div class="wb-card summary">
      <div class="muted">{{ t('loans.outstanding') }}</div>
      <div class="num">{{ money(dash?.outstanding_principal || '0.00') }}</div>
      <div class="muted">{{ t('loans.activeCount', { n: dash?.active_loans ?? 0 }) }}</div>
    </div>

    <div class="section-hd"><span>{{ t('loans.products') }}</span></div>
    <div class="wb-card list">
      <div v-for="p in products" :key="p.product_id" class="item" @click="apply(p)">
        <div class="row1">
          <span class="name">{{ p.name }}</span>
          <span class="tag">{{ p.risk_level }}</span>
        </div>
        <div class="row2">
          <div>
            <div class="rate">{{ p.annual_rate }}</div>
            <div class="muted">{{ t('loans.rateLabel') }}</div>
          </div>
          <div class="right muted">{{ p.min_amount }} - {{ p.max_amount }}</div>
        </div>
      </div>
    </div>

    <div class="section-hd"><span>{{ t('loans.myLoans') }}</span></div>
    <div class="wb-card list">
      <div v-if="!loans.length" class="empty">{{ t('loans.empty') }}</div>
      <div v-for="l in loans" :key="l.loan_id" class="item">
        <div class="row1">
          <span class="name">{{ l.loan_id.slice(0, 14) }}…</span>
          <span class="tag">{{ l.status }}</span>
        </div>
        <div class="row2">
          <div>
            <div class="rate">{{ money(l.outstanding_principal) }}</div>
            <div class="muted">{{ t('loans.leftPrincipal') }}</div>
          </div>
          <van-button
            v-if="l.status === 'active' || l.status === 'overdue'"
            size="small"
            color="#0052d9"
            round
            @click="repay(l)"
          >{{ t('loans.repay') }}</van-button>
        </div>
        <div class="sched">
          <div v-for="(pmt, i) in schedule(l)" :key="i" class="muted">
            {{ pmt.due }} · {{ money(pmt.amount) }}
          </div>
        </div>
      </div>
    </div>
    <PayPassword ref="payPwd" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog } from 'vant'
import { fetchLoanDashboard, fetchLoanProducts, loanApply, loanRepay } from '../api'
import PayPassword from '../components/PayPassword.vue'
import { money } from '../utils'
import { openResult } from '../utils/result'

const { t } = useI18n()
const router = useRouter()
const products = ref([])
const loans = ref([])
const dash = ref(null)
const payPwd = ref(null)

async function load() {
  const [p, d] = await Promise.all([fetchLoanProducts(), fetchLoanDashboard()])
  if (p.code === 0) products.value = (p.data?.items || []).slice(0, 8)
  if (d.code === 0) {
    dash.value = d.data
    loans.value = d.data?.loans || []
  }
}

function schedule(l) {
  const left = Number(l.outstanding_principal || 0)
  const term = Number(l.term_months || l.remaining_terms || 6) || 6
  const each = left > 0 ? (left / Math.min(term, 6)).toFixed(2) : '0.00'
  return [1, 2, 3].map((n) => {
    const d = new Date()
    d.setMonth(d.getMonth() + n)
    return { due: d.toISOString().slice(0, 10), amount: each }
  })
}

async function apply(p) {
  try {
    await showConfirmDialog({
      title: t('loans.applyTitle'),
      message: t('loans.applyMsg', { name: p.name, amount: '2000' }),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    return
  }
  const pin = await payPwd.value.ask()
  if (!pin) return
  const term = (p.term_months_options || [6])[0]
  const res = await loanApply({
    product_id: p.product_id,
    amount: '2000',
    term_months: term,
    purpose: 'electronics',
    monthly_income: '15000',
    industry: 'IT',
    city_tier: 'T2',
    pay_password: pin
  })
  if (res.code !== 0) {
    openResult(router, {
      kind: 'loan',
      note: t('result.note_loan_apply'),
      ok: false,
      title: t('loans.applyFail'),
      reason: res.message || t('loans.applyFail'),
      amount: money('2000'),
      subtitle: p.name,
      back: '/loans',
      rows: [
        { label: t('result.product'), value: p.name },
        { label: t('result.term'), value: `${term}` }
      ]
    })
    return
  }
  const loanId = res.data?.loan_id || res.data?.application_id || ''
  openResult(router, {
    kind: 'loan',
    note: t('result.note_loan_apply'),
    title: t('loans.applyOk'),
    amount: money('2000'),
    subtitle: p.name,
    ref: loanId,
    back: '/loans',
    rows: [
      { label: t('result.product'), value: p.name },
      { label: t('loans.rateLabel'), value: p.annual_rate },
      { label: t('result.term'), value: `${term}` },
      { label: t('result.purpose'), value: 'electronics' },
      { label: t('result.loanId'), value: loanId || '-' }
    ]
  })
}

async function repay(l) {
  try {
    await showConfirmDialog({
      title: t('loans.repayTitle'),
      message: t('loans.repayMsg', { amount: '100' }),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    return
  }
  const pin = await payPwd.value.ask()
  if (!pin) return
  const res = await loanRepay({ loan_id: l.loan_id, amount: '100', pay_password: pin })
  if (res.code !== 0) {
    openResult(router, {
      kind: 'loan',
      note: t('result.note_loan_repay'),
      ok: false,
      title: t('loans.repayFail'),
      reason: res.message || t('loans.repayFail'),
      amount: money('100'),
      back: '/loans',
      rows: [{ label: t('result.loanId'), value: l.loan_id }]
    })
    return
  }
  openResult(router, {
    kind: 'loan',
    note: t('result.note_loan_repay'),
    title: t('loans.repayOk'),
    amount: money('100'),
    ref: res.data?.repay_id || l.loan_id,
    back: '/loans',
    rows: [
      { label: t('result.loanId'), value: l.loan_id },
      { label: t('loans.outstanding'), value: money(l.outstanding_principal || l.principal || '0') },
      { label: t('result.repayment'), value: money('100') }
    ]
  })
}

onMounted(load)
</script>

<style scoped>
:deep(.van-nav-bar) { background: #0052d9; }
:deep(.van-nav-bar__title), :deep(.van-nav-bar .van-icon) { color: #fff !important; }
.loans { padding-bottom: 24px; }
.summary { margin: 12px; padding: 16px; }
.num { font-size: 28px; font-weight: 800; margin: 6px 0; }
.list { margin: 0 12px; padding: 4px 12px; }
.item { padding: 14px 0; border-bottom: 1px solid #f0f2f5; }
.item:last-child { border-bottom: none; }
.row1 { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.name { font-weight: 600; font-size: 14px; }
.tag { font-size: 10px; color: #ff6b00; background: #fff1e6; border-radius: 4px; padding: 1px 6px; }
.row2 { margin-top: 8px; display: flex; justify-content: space-between; align-items: center; }
.rate { color: #e34d59; font-size: 18px; font-weight: 700; }
.muted { color: #8a8f99; font-size: 12px; }
.right { text-align: right; }
.empty { padding: 18px 0; text-align: center; color: #999; font-size: 13px; }
.sched { margin-top: 6px; }
</style>
