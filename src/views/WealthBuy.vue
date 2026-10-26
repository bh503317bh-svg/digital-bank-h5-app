<template>
  <div class="page no-tab purchase-page">
    <van-nav-bar :title="t('wealthBuy.title')" left-arrow @click-left="$router.back()" />
    <div class="progress-wrap">
      <div v-for="(label, index) in steps" :key="label" class="step" :class="{ active: index <= currentStep }">
        <span>{{ index + 1 }}</span><small>{{ label }}</small>
      </div>
    </div>

    <section class="product-card">
      <div class="product-brand"><span class="brand-icon"><FeatureIcon name="wealth" /></span>aku-bank Wealth</div>
      <div class="product-top">
        <div><div class="product-name">{{ productName }}</div><div class="product-id">{{ t('wealthBuy.productCode') }} {{ productId }}</div></div>
        <div class="risk-badge">{{ productRisk }}</div>
      </div>
      <div class="metrics">
        <div><strong>{{ rate || '—' }}</strong><span>{{ t('wealthBuy.rateHint') }}</span></div>
        <div><strong>{{ productHold }}</strong><span>{{ t('wealthBuy.liquidity') }}</span></div>
        <div><strong>USD</strong><span>{{ t('wealthBuy.currency') }}</span></div>
      </div>
      <div class="disclaimer"><van-icon name="info-o" /> {{ t('wealthBuy.returnNotice') }}</div>
    </section>

    <van-form @submit="reviewOrder">
      <section class="form-card">
        <div class="card-title"><span>01</span>{{ t('wealthBuy.orderInfo') }}</div>
        <van-field :model-value="selectedAccountLabel" is-link readonly :label="t('wealthBuy.account')" :placeholder="t('wealthBuy.pickAccount')" @click="openAccountPicker" />
        <div v-if="accountNo" class="balance-line"><span>{{ t('wealthBuy.balance') }}</span><strong>{{ money(balance, { currency: 'USD', showCode: true }) }}</strong></div>
        <div v-if="accountNo && Number(balance) <= 0" class="funding-notice"><span>{{ t('wealthBuy.fundingNeeded') }}</span><button type="button" @click="router.push('/transfer-in')">{{ t('wealthBuy.addFunds') }}</button></div>
        <div class="amount-label">{{ t('wealthBuy.amount') }}</div>
        <div class="amount-input" :class="{ error: amountError }"><span>USD</span><b>$</b><input v-model="amount" inputmode="decimal" :placeholder="t('wealthBuy.amountPh')" /></div>
        <div class="amount-help" :class="{ error: amountError }">{{ amountError || t('wealthBuy.minAmount', { amount: '$100.00' }) }}</div>
        <div class="quick-amounts">
          <button v-for="n in presets" :key="n" type="button" :class="{ selected: validAmount === n }" :disabled="n > Number(balance)" @click="amount = String(n)">{{ money(n, { currency: 'USD' }) }}</button>
        </div>
      </section>

      <section class="form-card terms-card">
        <div class="card-title"><span>02</span>{{ t('wealthBuy.suitability') }}</div>
        <div class="profile-match">
          <div><small>{{ t('wealthBuy.myRiskProfile') }}</small><strong>{{ t('wealthBuy.profileR2') }}</strong></div>
          <van-icon name="exchange" />
          <div><small>{{ t('wealthBuy.productRisk') }}</small><strong>{{ productRisk }}</strong></div>
          <b><van-icon name="passed" /> {{ t('wealthBuy.matched') }}</b>
        </div>
        <div class="term-row">
          <div><strong>{{ t('wealthBuy.riskConfirm') }}</strong><small>{{ t('wealthBuy.riskConfirmHint') }}</small><small v-if="riskError" class="field-error"><van-icon name="warning-o" /> {{ t('desk.riskNeed') }}</small></div>
          <van-switch v-model="riskAck" size="22px" active-color="#123b6d" @update:model-value="riskError = false" />
        </div>
        <div class="term-row static"><van-icon name="shield-o" /><div><strong>{{ t('wealthBuy.protected') }}</strong><small>{{ t('wealthBuy.protectedHint') }}</small></div></div>
        <label class="agreement-check" :class="{ error: documentError }">
          <input v-model="documentAck" type="checkbox" @change="documentError = false" />
          <span>{{ t('wealthBuy.documentAck') }} <b>{{ t('wealthBuy.documentLinks') }}</b></span>
        </label>
        <div v-if="documentError" class="agreement-error"><van-icon name="warning-o" /> {{ t('wealthBuy.needDocumentAck') }}</div>
      </section>

      <div class="sticky-submit">
        <div><small>{{ t('wealthBuy.orderAmount') }}</small><strong>{{ money(validAmount, { currency: 'USD', showCode: true }) }}</strong></div>
        <van-button round type="primary" native-type="submit" :disabled="!canReview">{{ t('wealthBuy.review') }}</van-button>
      </div>
    </van-form>

    <van-action-sheet v-model:show="showPicker" :title="t('wealthBuy.pickAccount')" round>
      <div v-if="accountActions.length" class="account-picker">
        <button v-for="action in accountActions" :key="action.account_no" type="button" @click="onPickAccount(action)">
          <span><b>USD</b><small>{{ maskAccount(action.account_no) }}</small></span>
          <strong>{{ money(action.balance, { currency: 'USD' }) }}</strong>
          <van-icon name="arrow" />
        </button>
      </div>
      <div v-else class="no-account">
        <div class="no-account-icon"><FeatureIcon name="card" /></div>
        <h3>{{ t('wealthBuy.noUsdAccount') }}</h3>
        <p>{{ t('wealthBuy.noUsdAccountHint') }}</p>
        <van-button block round type="primary" :loading="openingAccount" @click="createAccount">{{ t('wealthBuy.openUsdAccount') }}</van-button>
      </div>
    </van-action-sheet>
    <van-action-sheet v-model:show="showReview" :title="t('wealthBuy.reviewTitle')" round>
      <div class="review-sheet">
        <div class="review-product">{{ productName }}</div>
        <div class="review-amount"><MoneyAmount :value="validAmount" currency="USD" show-code size="lg" tone="primary" /></div>
        <div class="review-row"><span>{{ t('wealthBuy.account') }}</span><b>{{ maskAccount(accountNo) }}</b></div>
        <div class="review-row"><span>{{ t('wealthBuy.orderType') }}</span><b>{{ t('wealthBuy.subscription') }}</b></div>
        <div class="review-row"><span>{{ t('wealthBuy.fee') }}</span><b>{{ money(0, { currency: 'USD', showCode: true }) }}</b></div>
        <div class="review-row"><span>{{ t('wealthBuy.settlement') }}</span><b>{{ t('wealthBuy.settlementValue') }}</b></div>
        <div class="review-note"><van-icon name="warning-o" /> {{ t('wealthBuy.finalNotice') }}</div>
        <van-button round block type="primary" :loading="loading" @click="confirmPurchase">{{ t('wealthBuy.authorize') }}</van-button>
        <button class="cancel-review" @click="showReview = false">{{ t('common.cancel') }}</button>
      </div>
    </van-action-sheet>
    <PayPassword ref="payPwd" />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import { fetchHome, openDepositAccount, wealthBuy } from '../api'
import PayPassword from '../components/PayPassword.vue'
import MoneyAmount from '../components/MoneyAmount.vue'
import FeatureIcon from '../components/FeatureIcon.vue'
import { maskAccount, money } from '../utils'
import { pushNotice } from '../utils/local'
import { addHolding, getKyc, saveKyc } from '../services/desk'
import { localizeWealthProducts } from '../mock/products'
import { openResult } from '../utils/result'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const productId = computed(() => String(route.query.id || 'hqPlusX'))
const productName = computed(() => String(route.query.name || t('newbie.hqPlusX')))
const rate = computed(() => String(route.query.rate || ''))
const product = computed(() => { locale.value; return localizeWealthProducts(t).find((item) => item.id === productId.value) })
const productRisk = computed(() => (assistantOrder.value || productId.value.startsWith('f')) ? t('wealthDetail.r4') : product.value?.risk || t('wealthBuy.riskMedium'))
const productHold = computed(() => product.value?.hold || t('wealthBuy.flexible'))
const assistantOrder = computed(() => route.query.assistant === 'trade' && route.query.terms === 'accepted')
const steps = computed(() => [t('wealthBuy.stepProduct'), t('wealthBuy.stepDetails'), t('wealthBuy.stepReview'), t('wealthBuy.stepComplete')])
const currentStep = computed(() => showReview.value ? 2 : 1)
const accounts = ref([])
const accountNo = ref('')
const balance = ref('0')
const amount = ref(String(route.query.amount || '100'))
const presets = [100, 500, 1000]
const loading = ref(false)
const openingAccount = ref(false)
const showPicker = ref(false)
const showReview = ref(false)
const payPwd = ref(null)
const riskAck = ref(assistantOrder.value || !!getKyc().riskAck)
const documentAck = ref(assistantOrder.value)
const riskError = ref(false)
const documentError = ref(false)
const validAmount = computed(() => Number(amount.value) || 0)
const amountError = computed(() => {
  if (!amount.value || validAmount.value === 0) return ''
  if (validAmount.value < 100) return t('wealthBuy.minAmountError')
  if (accountNo.value && validAmount.value > Number(balance.value)) return t('wealthBuy.insufficient')
  return ''
})
const canReview = computed(() => !!accountNo.value && validAmount.value >= 100 && validAmount.value <= Number(balance.value))
const selectedAccount = computed(() => accounts.value.find((a) => a.account_no === accountNo.value))
const selectedAccountLabel = computed(() => selectedAccount.value ? `USD · ${maskAccount(selectedAccount.value.account_no)}` : '')
const accountActions = computed(() => accounts.value.map((a) => ({
  name: `USD  ${maskAccount(a.account_no)}  ·  ${money(a.balance, { currency: 'USD' })}`,
  account_no: a.account_no, balance: a.balance
})))

function applyAccount(a) { if (a) { accountNo.value = a.account_no; balance.value = a.balance } }
function onPickAccount(action) { applyAccount(action); showPicker.value = false }
function openAccountPicker() { showPicker.value = true }

async function createAccount() {
  openingAccount.value = true
  try {
    const res = await openDepositAccount('USD')
    if (res.code !== 0 || !res.data) { showFailToast(res.message || t('wealthBuy.openAccountFail')); return }
    accounts.value = [res.data]
    applyAccount(res.data)
    showPicker.value = false
    showSuccessToast(t('wealthBuy.accountOpened'))
  } catch {
    showFailToast(t('wealthBuy.openAccountFail'))
  } finally { openingAccount.value = false }
}

onMounted(async () => {
  const res = await fetchHome()
  if (res.code === 0 && res.data.accounts?.length) {
    accounts.value = res.data.accounts.filter((a) => (a.currency || 'USD') === 'USD')
    applyAccount(accounts.value[0])
    if (assistantOrder.value && route.query.autoReview === '1' && canReview.value && getKyc().status === 'verified') {
      await nextTick()
      saveKyc({ riskAck: true })
      showReview.value = true
    }
  }
})

function validateOrder() {
  if (!accountNo.value) { showFailToast(t('wealthBuy.needAccount')); return false }
  if (validAmount.value < 100) { showFailToast(t('wealthBuy.minAmountError')); return false }
  if (validAmount.value > Number(balance.value)) return false
  if (getKyc().status !== 'verified') { showFailToast(t('desk.kycIncomplete')); router.push('/kyc'); return false }
  riskError.value = !riskAck.value
  documentError.value = !documentAck.value
  if (riskError.value || documentError.value) {
    requestAnimationFrame(() => document.querySelector('.terms-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    return false
  }
  return true
}

function reviewOrder() {
  if (!validateOrder()) return
  saveKyc({ riskAck: true })
  showReview.value = true
}

async function confirmPurchase() {
  showReview.value = false
  const pin = await payPwd.value.ask()
  if (!pin) return
  loading.value = true
  try {
    const res = await wealthBuy({ account_no: accountNo.value, amount: String(validAmount.value.toFixed(2)), product_id: productId.value, product_name: productName.value, pay_password: pin })
    if (res.code !== 0) {
      openResult(router, { kind: 'wealth', note: t('result.note_wealth'), ok: false, title: t('wealthBuy.fail'), reason: res.message || t('wealthBuy.fail'), amount: money(validAmount.value, { currency: 'USD', showCode: true }), subtitle: productName.value, back: '/wealth', rows: [{ label: t('result.product'), value: productName.value }, { label: t('wealthBuy.account'), value: maskAccount(accountNo.value) }] })
      return
    }
    addHolding({ productId: productId.value, name: productName.value, amount: validAmount.value, rate: rate.value })
    pushNotice(t('wealthBuy.ok'), productName.value)
    openResult(router, { kind: 'wealth', note: t('result.note_wealth'), title: t('wealthBuy.ok'), amount: money(validAmount.value, { currency: 'USD', showCode: true }), subtitle: productName.value, ref: res.data?.txn_id, back: '/wealth', rows: [{ label: t('result.product'), value: productName.value }, { label: t('wealthBuy.account'), value: maskAccount(accountNo.value) }, { label: t('wealthBuy.settlement'), value: t('wealthBuy.settlementValue') }] })
  } finally { loading.value = false }
}
</script>

<style scoped>
.purchase-page { background: #f4f6f8; padding-bottom: 98px; }
.progress-wrap { display: flex; padding: 18px 30px 16px; background: #fff; }
.step { flex: 1; position: relative; text-align: center; color: #a1aab7; }
.step:not(:last-child)::after { content: ''; position: absolute; top: 11px; left: 62%; width: 76%; height: 1px; background: #dce2e9; }
.step span { position: relative; z-index: 1; display: grid; place-items: center; width: 23px; height: 23px; margin: 0 auto 5px; border-radius: 50%; background: #e8edf2; font-size: 11px; }
.step small { font-size: 10px; }.step.active { color: #123b6d; font-weight: 700; }.step.active span { background: #123b6d; color: white; }
.product-card { margin: 12px; padding: 18px; border-radius: 18px; color: #fff; background: radial-gradient(circle at 90% 0,rgba(218,188,124,.34),transparent 36%),linear-gradient(145deg,#174f87,#082849); box-shadow: 0 14px 32px rgba(8,40,73,.2); }
.product-brand { display: flex; align-items: center; gap: 6px; color: #e2c98e; font-size: 11px; letter-spacing: .7px; text-transform: uppercase; }.brand-icon { display: inline-block; width: 24px; height: 24px; }
.product-top { display: flex; justify-content: space-between; gap: 14px; margin-top: 14px; }.product-name { font-size: 18px; font-weight: 700; }.product-id { margin-top: 5px; color: rgba(255,255,255,.58); font-size: 10px; }
.risk-badge { align-self: flex-start; border: 1px solid rgba(255,255,255,.28); border-radius: 12px; padding: 4px 8px; font-size: 10px; }
.metrics { display: grid; grid-template-columns: 1.25fr 1fr .7fr; margin-top: 21px; }.metrics>div { display: flex; flex-direction: column; gap: 5px; }.metrics strong { color: #f0d59c; font-size: 21px; }.metrics span { color: rgba(255,255,255,.6); font-size: 10px; }
.disclaimer { margin-top: 16px; padding-top: 11px; border-top: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.58); font-size: 10px; }
.form-card { margin: 12px; padding: 16px; background: #fff; border: 1px solid #e8edf2; border-radius: 16px; box-shadow: 0 6px 22px rgba(15,39,68,.05); }
.card-title { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; font-size: 15px; font-weight: 700; }.card-title span { color: #c8a45d; font-size: 11px; letter-spacing: 1px; }.form-card :deep(.van-cell) { padding-left: 0; padding-right: 0; }
.balance-line { display: flex; justify-content: space-between; padding: 0 0 15px; color: #738094; font-size: 12px; }.balance-line strong { color: #142033; }
.funding-notice { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: -5px 0 13px; padding: 9px 10px; border-radius: 9px; background: #fff7e8; color: #796137; font-size: 10px; }.funding-notice button { border: 0; border-radius: 8px; padding: 6px 9px; background: #123b6d; color: #fff; font-size: 10px; }
.amount-label { margin-top: 8px; color: #4c596b; font-size: 12px; }.amount-input { display: flex; align-items: center; padding: 9px 0 7px; border-bottom: 1.5px solid #123b6d; transition: border-color .2s; }.amount-input.error { border-color: #c74848; }.amount-input span { padding: 3px 7px; border-radius: 5px; background: #eaf1f8; color: #123b6d; font-size: 10px; font-weight: 700; }.amount-input b { margin-left: 12px; color: #123b6d; font-size: 22px; }.amount-input input { min-width: 0; flex: 1; border: 0; outline: 0; padding-left: 5px; color: #142033; font-family: inherit; font-size: 30px; font-weight: 700; line-height: 1.2; }.amount-input input::placeholder { color: #c7cdd5; font-size: 16px; font-weight: 400; }
.amount-help { min-height: 15px; margin-top: 7px; color: #8a95a4; font-size: 10px; }.amount-help.error { color: #c74848; font-weight: 600; }.quick-amounts { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 13px; }.quick-amounts button { border: 1px solid #dfe5eb; border-radius: 8px; padding: 8px 3px; background: #f8fafb; color: #334255; font-size: 11px; transition: .2s; }.quick-amounts button.selected { border-color: #123b6d; background: #eaf1f8; color: #123b6d; font-weight: 700; }.quick-amounts button:disabled { border-color: #edf0f3; background: #f5f6f7; color: #b7bec7; cursor: not-allowed; text-decoration: line-through; }
.term-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 0; border-top: 1px solid #edf0f3; }.term-row>div { min-width: 0; }.term-row strong,.term-row small { display: block; }.term-row strong { font-size: 13px; }.term-row small { margin-top: 4px; color: #8792a1; font-size: 10px; line-height: 1.4; }.term-row .field-error { display: flex; align-items: center; gap: 4px; margin-top: 7px; color: #b74646; font-weight: 650; }.term-row.static { justify-content: flex-start; color: #123b6d; }.term-row.static .van-icon { font-size: 23px; }
.profile-match { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; margin: 4px 0 13px; padding: 12px; border-radius: 10px; background: #f2f6f9; }.profile-match div { text-align: center; }.profile-match small,.profile-match strong { display: block; }.profile-match small { color: #8490a0; font-size: 9px; }.profile-match strong { margin-top: 4px; color: #123b6d; font-size: 12px; }.profile-match>b { grid-column: 1/-1; padding-top: 8px; border-top: 1px solid #dfe7ed; color: #16805c; text-align: center; font-size: 10px; }
.agreement-check { display: flex; gap: 9px; align-items: flex-start; margin-top: 6px; padding: 12px; border: 1px solid transparent; border-radius: 9px; background: #fbfaf7; color: #687588; font-size: 10px; line-height: 1.5; transition: .2s; }.agreement-check.error { border-color: #dfaaaa; background: #fff7f7; }.agreement-check input { width: 16px; height: 16px; flex: 0 0 auto; accent-color: #123b6d; }.agreement-check b { color: #123b6d; }.agreement-error { display: flex; align-items: center; gap: 4px; margin: 7px 2px 0; color: #b74646; font-size: 10px; font-weight: 650; }
.sticky-submit { position: fixed; z-index: 5; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 16px calc(11px + env(safe-area-inset-bottom)); background: rgba(255,255,255,.96); border-top: 1px solid #e6ebf0; backdrop-filter: blur(12px); }.sticky-submit>div { min-width: 0; }.sticky-submit small,.sticky-submit strong { display: block; }.sticky-submit small { color: #7b8796; font-size: 10px; }.sticky-submit strong { margin-top: 2px; overflow: hidden; color: #123b6d; font-size: 15px; text-overflow: ellipsis; white-space: nowrap; }.sticky-submit .van-button { width: min(190px,52vw); flex: 0 0 auto; padding: 0 12px; font-size: 13px; }
.review-sheet { padding: 8px 20px calc(20px + env(safe-area-inset-bottom)); }.review-product { color: #738094; text-align: center; font-size: 12px; }.review-amount { margin: 7px 0 22px; color: #123b6d; text-align: center; font-size: 30px; font-weight: 800; }.review-row { display: flex; justify-content: space-between; gap: 15px; padding: 11px 0; border-bottom: 1px solid #edf0f3; font-size: 13px; }.review-row span { color: #7b8796; }.review-row b { text-align: right; font-weight: 600; }.review-note { margin: 16px 0; padding: 11px; border-radius: 9px; background: #f8f3e9; color: #796137; font-size: 11px; line-height: 1.5; }.cancel-review { width: 100%; border: 0; padding: 13px; background: transparent; color: #738094; }
.account-picker { padding: 4px 18px calc(18px + env(safe-area-inset-bottom)); }.account-picker button { display: grid; grid-template-columns: 1fr auto auto; align-items: center; width: 100%; gap: 12px; border: 0; border-bottom: 1px solid #edf0f3; padding: 15px 2px; background: #fff; color: #142033; text-align: left; }.account-picker span b,.account-picker span small { display: block; }.account-picker span b { color: #123b6d; font-size: 12px; }.account-picker span small { margin-top: 4px; color: #8490a0; font-size: 10px; }.account-picker strong { font-size: 14px; }.account-picker .van-icon { color: #8b96a4; }
.no-account { padding: 4px 24px calc(24px + env(safe-area-inset-bottom)); text-align: center; }.no-account-icon { width: 76px; height: 76px; margin: 0 auto; }.no-account h3 { margin: 4px 0 7px; color: #142033; font-size: 17px; }.no-account p { margin: 0 0 18px; color: #7b8796; font-size: 12px; line-height: 1.55; }
</style>
