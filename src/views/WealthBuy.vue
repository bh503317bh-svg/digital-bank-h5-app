<template>
  <div class="page no-tab">
    <van-nav-bar :title="t('wealthBuy.title')" left-arrow @click-left="$router.back()" />
    <div class="prod wb-card">
      <div class="name">{{ productName }}</div>
      <div class="rate-row" v-if="rate">
        <span class="rate">{{ rate }}</span>
        <span class="muted">{{ t('wealthBuy.rateHint') }}</span>
      </div>
      <div class="muted id">ID: {{ productId }}</div>
    </div>
    <van-form @submit="onSubmit" style="margin-top:12px">
      <van-cell-group inset>
        <van-field
          v-model="accountNo"
          is-link
          readonly
          :label="t('wealthBuy.account')"
          :placeholder="t('wealthBuy.pickAccount')"
          @click="showPicker = true"
        />
        <van-field
          v-if="balance"
          :model-value="money(balance)"
          :label="t('wealthBuy.balance')"
          readonly
        />
        <van-field
          v-model="amount"
          type="number"
          :label="t('wealthBuy.amount')"
          :placeholder="t('wealthBuy.amountPh')"
        />
        <van-cell :title="t('desk.riskNeed')">
          <template #right-icon>
            <van-switch v-model="riskAck" size="20px" active-color="#0052d9" />
          </template>
        </van-cell>
      </van-cell-group>
      <div style="margin:24px 16px">
        <van-button
          round
          block
          type="primary"
          color="#0052d9"
          native-type="submit"
          :loading="loading"
        >{{ t('wealthBuy.confirm') }}</van-button>
      </div>
    </van-form>

    <van-action-sheet v-model:show="showPicker" :actions="accountActions" @select="onPickAccount" />
    <PayPassword ref="payPwd" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { fetchHome, wealthBuy } from '../api'
import PayPassword from '../components/PayPassword.vue'
import { money } from '../utils'
import { pushNotice } from '../utils/local'
import { addHolding, getKyc, saveKyc } from '../services/desk'
import { openResult } from '../utils/result'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const productId = computed(() => String(route.query.id || 'hqPlusX'))
const productName = computed(() => String(route.query.name || t('newbie.hqPlusX')))
const rate = computed(() => String(route.query.rate || ''))

const accounts = ref([])
const accountNo = ref('')
const balance = ref('')
const amount = ref('100.00')
const loading = ref(false)
const showPicker = ref(false)
const payPwd = ref(null)
const riskAck = ref(!!getKyc().riskAck)

const accountActions = computed(() =>
  accounts.value.map((a) => ({
    name: `${a.currency || 'USD'}  ${a.account_no}  ${money(a.balance, { currency: a.currency || 'USD' })}`,
    account_no: a.account_no,
    balance: a.balance
  }))
)

function applyAccount(a) {
  if (!a) return
  accountNo.value = a.account_no
  balance.value = a.balance
}

function onPickAccount(action) {
  accountNo.value = action.account_no
  balance.value = action.balance
  showPicker.value = false
}

onMounted(async () => {
  const res = await fetchHome()
  if (res.code === 0 && res.data.accounts?.length) {
    accounts.value = res.data.accounts
    applyAccount(res.data.accounts.find((a) => (a.currency || 'USD') === 'USD') || res.data.accounts[0])
  }
})

async function onSubmit() {
  if (!accountNo.value) {
    showFailToast(t('wealthBuy.needAccount'))
    return
  }
  if (!amount.value || Number(amount.value) <= 0) {
    showFailToast(t('wealthBuy.needAmount'))
    return
  }
  if (getKyc().status !== 'verified') {
    showFailToast(t('desk.kycIncomplete'))
    router.push('/kyc')
    return
  }
  if (!riskAck.value) {
    showFailToast(t('desk.riskNeed'))
    return
  }
  saveKyc({ riskAck: true })
  const pin = await payPwd.value.ask()
  if (!pin) return
  loading.value = true
  try {
    const res = await wealthBuy({
      account_no: accountNo.value,
      amount: String(amount.value),
      product_id: productId.value,
      product_name: productName.value,
      pay_password: pin
    })
    if (res.code !== 0) {
      openResult(router, {
        kind: 'wealth',
        note: t('result.note_wealth'),
        ok: false,
        title: t('wealthBuy.fail'),
        reason: res.message || t('wealthBuy.fail'),
        amount: money(amount.value),
        subtitle: productName.value,
        back: '/wealth',
        rows: [
          { label: t('result.product'), value: productName.value },
          { label: t('wealthBuy.account'), value: accountNo.value }
        ]
      })
      return
    }
    addHolding({
      productId: productId.value,
      name: productName.value,
      amount: amount.value,
      rate: rate.value
    })
    pushNotice(t('wealthBuy.ok'), productName.value)
    openResult(router, {
      kind: 'wealth',
      note: t('result.note_wealth'),
      title: t('wealthBuy.ok'),
      amount: money(amount.value),
      subtitle: productName.value,
      ref: res.data?.txn_id,
      back: '/wealth',
      rows: [
        { label: t('result.product'), value: productName.value },
        { label: t('wealthBuy.account'), value: accountNo.value },
        { label: t('wealthBuy.rateHint'), value: rate.value || '-' }
      ]
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.van-nav-bar) { background: #0052d9; }
:deep(.van-nav-bar__title), :deep(.van-nav-bar .van-icon) { color: #fff !important; }
.prod { margin: 12px 12px 0; padding: 16px; }
.name { font-weight: 700; font-size: 16px; }
.rate-row { margin-top: 8px; display: flex; align-items: baseline; gap: 8px; }
.rate { color: #00a870; font-size: 26px; font-weight: 800; }
.muted { color: #8a8f99; font-size: 12px; }
.id { margin-top: 6px; }
</style>
