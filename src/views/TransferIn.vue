<template>
  <div class="page no-tab tin">
    <div class="sheet">
      <div class="sheet-hd">
        <button type="button" class="x" aria-label="close" @click="$router.back()">×</button>
        <div class="sheet-title">{{ t('transfer.inTitle') }}</div>
        <span class="x ghost" />
      </div>

      <div class="step">
        <div class="step-h">{{ t('transfer.inStep1') }}</div>
        <div class="recv">
          <div class="recv-icon">AB</div>
          <div class="recv-body">
            <div class="recv-name">{{ t('transfer.akuCard') }}</div>
            <div class="recv-no">{{ formatAcct(wire.accountNo) }}</div>
          </div>
          <button type="button" class="copy-btn" @click="copyOne(wire.accountNo, 'account')">
            {{ copiedKey === 'account' ? t('transfer.copied') : t('transfer.copyAcct') }}
          </button>
        </div>
        <div class="wire-rows">
          <div v-for="row in wireRows" :key="row.key" class="wire-row" @click="copyOne(row.value, row.key)">
            <div>
              <div class="wlab">{{ row.label }}</div>
              <div class="wval">{{ row.value || '—' }}</div>
            </div>
            <span class="wcopy">{{ copiedKey === row.key ? t('transfer.copied') : t('common.copy') }}</span>
          </div>
        </div>
        <button type="button" class="copy-all" @click="copyAll">{{ t('transfer.copyAll') }}</button>
      </div>

      <div class="step">
        <div class="step-h">{{ t('transfer.inStep2') }}</div>
        <div
          v-for="b in banks"
          :key="b.id"
          class="bank-row"
        >
          <div class="bank-logo" :style="{ background: b.color }">{{ b.short }}</div>
          <div class="bank-name">{{ b.name }}</div>
          <button type="button" class="open-btn" @click="openBank(b)">{{ t('transfer.openApp') }}</button>
        </div>
      </div>

      <div class="demo">
        <div class="demo-h" @click="showDemo = !showDemo">
          {{ t('transfer.demoIn') }}
          <span>{{ showDemo ? '▴' : '▾' }}</span>
        </div>
        <van-form v-if="showDemo" @submit="onSimulate">
          <van-field v-model="amount" :label="t('transfer.amount')" placeholder="100.00" />
          <van-button
            round
            block
            type="primary"
            color="#0052d9"
            native-type="submit"
            :loading="loading"
            style="margin-top:12px"
          >
            {{ t('transfer.confirmIn') }}
          </van-button>
        </van-form>
      </div>
    </div>
    <PayPassword ref="payPwd" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import { deposit, fetchHome } from '../api'
import { recordOrder } from '../services/desk'
import { pushNotice } from '../utils/local'
import PayPassword from '../components/PayPassword.vue'
import { openResult } from '../utils/result'

const { t } = useI18n()
const router = useRouter()
const payPwd = ref(null)
const amount = ref('100.00')
const loading = ref(false)
const showDemo = ref(false)
const copiedKey = ref('')
const beneficiary = ref('Jordan Lee')
const accountNo = ref('')

const wire = computed(() => ({
  beneficiary: beneficiary.value,
  accountNo: accountNo.value || '622212260800035218',
  swift: 'AKUBUS33',
  routing: '021000021',
  bankName: 'aku-bank N.A.',
  bankAddress: '200 Park Ave, New York, NY 10166'
}))

const wireRows = computed(() => [
  { key: 'beneficiary', label: t('transfer.beneficiary'), value: wire.value.beneficiary },
  { key: 'swift', label: t('transfer.swift'), value: wire.value.swift },
  { key: 'routing', label: t('transfer.routing'), value: wire.value.routing },
  { key: 'bankName', label: t('transfer.bankName'), value: wire.value.bankName },
  { key: 'bankAddress', label: t('transfer.bankAddress'), value: wire.value.bankAddress }
])

const banks = [
  { id: 'chase', name: 'Chase', short: 'CH', color: '#117ACA', url: 'https://www.chase.com/' },
  { id: 'boa', name: 'Bank of America', short: 'BA', color: '#E31837', url: 'https://www.bankofamerica.com/' },
  { id: 'citi', name: 'Citi', short: 'CI', color: '#003B70', url: 'https://www.citi.com/' },
  { id: 'wf', name: 'Wells Fargo', short: 'WF', color: '#D71E28', url: 'https://www.wellsfargo.com/' },
  { id: 'hsbc', name: 'HSBC', short: 'HS', color: '#DB0011', url: 'https://www.hsbc.com/' },
  { id: 'dbs', name: 'DBS', short: 'DB', color: '#E30613', url: 'https://www.dbs.com/' },
  { id: 'ocbc', name: 'OCBC', short: 'OC', color: '#ED1C24', url: 'https://www.ocbc.com/' },
  { id: 'uob', name: 'UOB', short: 'UO', color: '#003DA5', url: 'https://www.uob.com.sg/' },
  { id: 'maybank', name: 'Maybank', short: 'MB', color: '#8A6D00', url: 'https://www.maybank.com/' },
  { id: 'cimb', name: 'CIMB', short: 'CM', color: '#7A0019', url: 'https://www.cimb.com/' },
  { id: 'bca', name: 'BCA', short: 'BC', color: '#003D79', url: 'https://www.bca.co.id/' },
  { id: 'bri', name: 'BRI', short: 'BR', color: '#00529C', url: 'https://www.bri.co.id/' },
  { id: 'mandiri', name: 'Bank Mandiri', short: 'MD', color: '#003B70', url: 'https://www.bankmandiri.co.id/' },
  { id: 'bbl', name: 'Bangkok Bank', short: 'BB', color: '#1B3A6B', url: 'https://www.bangkokbank.com/' },
  { id: 'kbank', name: 'Kasikornbank', short: 'KB', color: '#138F2D', url: 'https://www.kasikornbank.com/' },
  { id: 'scb', name: 'SCB', short: 'SC', color: '#4B2884', url: 'https://www.scb.co.th/' },
  { id: 'vcb', name: 'Vietcombank', short: 'VC', color: '#006B3F', url: 'https://www.vietcombank.com.vn/' },
  { id: 'bdo', name: 'BDO', short: 'BD', color: '#0033A0', url: 'https://www.bdo.com.ph/' },
  { id: 'bpi', name: 'BPI', short: 'BP', color: '#A6192E', url: 'https://www.bpi.com.ph/' }
]

function formatAcct(no) {
  const s = String(no || '').replace(/\s/g, '')
  return s.replace(/(.{4})/g, '$1 ').trim()
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

async function copyOne(val, key) {
  if (!val) return
  await copyText(String(val))
  copiedKey.value = key
  showSuccessToast(t('common.copyOk'))
  setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = ''
  }, 1500)
}

async function copyAll() {
  const w = wire.value
  const block = [
    `Beneficiary: ${w.beneficiary}`,
    `Account: ${w.accountNo}`,
    `SWIFT/BIC: ${w.swift}`,
    `ABA Routing: ${w.routing}`,
    `Bank: ${w.bankName}`,
    `Bank address: ${w.bankAddress}`
  ].join('\n')
  await copyText(block)
  copiedKey.value = 'all'
  showSuccessToast(t('transfer.copyAllOk'))
}

function openBank(b) {
  window.open(b.url, '_blank', 'noopener,noreferrer')
}

async function onSimulate() {
  if (!wire.value.accountNo) {
    showFailToast(t('transfer.noAccount'))
    return
  }
  const pin = await payPwd.value.ask()
  if (!pin) return
  loading.value = true
  try {
    const res = await deposit(wire.value.accountNo, amount.value, pin)
    if (res.code !== 0) {
      openResult(router, {
        kind: 'transfer',
        note: t('result.note_transfer'),
        ok: false,
        title: t('transfer.inFail'),
        reason: res.message || t('transfer.inFail'),
        amount: `$${Number(amount.value).toFixed(2)}`,
        back: '/transfer-in',
        rows: [{ label: t('transfer.to'), value: wire.value.accountNo }]
      })
      return
    }
    recordOrder({
      kind: 'inbound',
      name: wire.value.beneficiary,
      account: wire.value.accountNo,
      amount: amount.value,
      status: 'completed'
    })
    pushNotice(t('transfer.inOk'), amount.value)
    openResult(router, {
      kind: 'transfer',
      note: t('result.note_transfer'),
      title: t('transfer.inOk'),
      amount: `$${Number(amount.value).toFixed(2)}`,
      ref: res.data?.txn_id,
      back: '/',
      rows: [
        { label: t('transfer.beneficiary'), value: wire.value.beneficiary },
        { label: t('transfer.to'), value: wire.value.accountNo },
        { label: t('transfer.bankName'), value: wire.value.bankName || 'aku-bank' },
        { label: t('transfer.swift'), value: wire.value.swift || '-' }
      ]
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const res = await fetchHome()
  if (res.code === 0) {
    accountNo.value = res.data?.accounts?.[0]?.account_no || ''
    beneficiary.value =
      res.data?.user?.display_name || res.data?.customer?.name || beneficiary.value
  }
})
</script>

<style scoped>
.tin {
  background: rgba(0, 0, 0, 0.35);
  min-height: 100vh;
  padding: 12vh 0 0;
}
.sheet {
  background: #f5f6f8;
  border-radius: 16px 16px 0 0;
  min-height: 88vh;
  padding-bottom: 32px;
}
.sheet-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  background: #fff;
  border-radius: 16px 16px 0 0;
}
.sheet-title { font-size: 17px; font-weight: 600; color: #1a1a1a; }
.x {
  width: 36px; height: 36px; border: 0; background: transparent;
  font-size: 28px; line-height: 1; color: #333;
}
.x.ghost { visibility: hidden; }
.step { margin-top: 10px; background: #fff; padding: 14px 16px 16px; }
.step-h { font-size: 15px; font-weight: 600; color: #222; margin-bottom: 12px; }
.recv {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; background: #f7f8fa; border-radius: 10px;
}
.recv-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: linear-gradient(135deg, #0052d9, #2f7bff);
  color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.recv-body { flex: 1; min-width: 0; }
.recv-name { font-size: 14px; font-weight: 600; }
.recv-no { margin-top: 4px; font-size: 13px; color: #555; letter-spacing: 0.5px; }
.copy-btn, .open-btn {
  border: 0; background: transparent; color: #0052d9;
  font-size: 13px; font-weight: 600; white-space: nowrap; padding: 0;
}
.wire-rows { margin-top: 8px; }
.wire-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid #f0f1f3;
}
.wire-row:last-child { border-bottom: 0; }
.wlab { font-size: 12px; color: #8a8f99; }
.wval { margin-top: 2px; font-size: 14px; color: #222; word-break: break-all; }
.wcopy { font-size: 12px; color: #0052d9; margin-left: 12px; flex-shrink: 0; }
.copy-all {
  margin-top: 12px; width: 100%; height: 40px; border-radius: 20px;
  border: 1px solid #0052d9; background: #fff; color: #0052d9;
  font-size: 14px; font-weight: 600;
}
.bank-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid #f0f1f3;
}
.bank-row:last-child { border-bottom: 0; }
.bank-logo {
  width: 36px; height: 36px; border-radius: 8px; color: #fff;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.bank-name { flex: 1; font-size: 15px; color: #222; }
.demo { margin: 12px 16px 0; background: #fff; border-radius: 12px; padding: 12px 14px; }
.demo-h {
  display: flex; justify-content: space-between; font-size: 13px; color: #666;
}
</style>
