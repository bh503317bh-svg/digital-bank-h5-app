<template>
  <div class="page no-tab cards-page">
    <van-nav-bar :title="t('cards.title')" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="service-o" size="18" @click="showService = true" />
      </template>
    </van-nav-bar>

    <div class="tip-box">
      <div class="tip-title">{{ t('cards.tipTitle') }} <van-icon name="info-o" /></div>
      <div class="tip-sub">{{ t('cards.tipSub') }}</div>
    </div>

    <div class="card-list">
      <div class="bank-card wecode">
        <div class="bc-top">
          <div>
            <div class="bc-name">{{ t('cards.wecodeName') }}</div>
            <div class="bc-type">{{ t('cards.debit') }}</div>
          </div>
          <div class="union">{{ t('cards.networkVisa') }}</div>
        </div>
        <div class="bc-no">{{ maskedMain }}</div>
        <div class="bc-action" @click="copyMain">{{ t('cards.copy') }}</div>
        <div class="bc-ctl">{{ controlText('wecode') }}</div>
      </div>

      <div v-for="c in allCards" :key="c.id" class="bank-card" :style="{ background: c.color }">
        <div class="bc-top">
          <div>
            <div class="bc-name">{{ c.name }}</div>
            <div class="bc-type">{{ t('cards.debit') }}</div>
          </div>
          <div class="union">{{ c.network }}</div>
        </div>
        <div class="bc-no">{{ c.masked }}</div>
        <div class="bc-ctl">{{ controlText(c.id) }}</div>
      </div>
      <div v-for="c in allCards" :key="'ctl'+c.id" class="ctl-row">
        <span>{{ c.name }}</span>
        <button type="button" @click="toggleFreeze(c.id)">{{ cardControl(c.id).frozen ? t('desk.unfreeze') : t('desk.freeze') }}</button>
        <button type="button" @click="toggleLost(c.id)">{{ cardControl(c.id).lost ? t('desk.found') : t('desk.lost') }}</button>
        <button type="button" @click="editLimit(c.id)">{{ t('desk.limit') }} {{ cardControl(c.id).limit }}</button>
      </div>
      <div class="ctl-row">
        <span>{{ t('cards.wecodeName') }}</span>
        <button type="button" @click="toggleFreeze('wecode')">{{ cardControl('wecode').frozen ? t('desk.unfreeze') : t('desk.freeze') }}</button>
        <button type="button" @click="toggleLost('wecode')">{{ cardControl('wecode').lost ? t('desk.found') : t('desk.lost') }}</button>
        <button type="button" @click="editLimit('wecode')">{{ t('desk.limit') }} {{ cardControl('wecode').limit }}</button>
      </div>
    </div>

    <div class="safe-bottom-btn">
      <van-button block round plain type="primary" color="#123b6d" @click="showAdd = true">
        {{ t('cards.add') }}
      </van-button>
    </div>

    <van-dialog v-model:show="showAdd" :title="t('cards.add')" show-cancel-button @confirm="onAdd">
      <van-field
        :model-value="form.bank"
        is-link
        readonly
        :label="t('cards.bankName')"
        :placeholder="t('cards.pickBank')"
        @click="showBank = true"
      />
      <van-field v-model="form.number" type="digit" maxlength="16" :label="t('cards.cardNo')" :placeholder="t('cards.cardPh')" />
    </van-dialog>

    <van-popup v-model:show="showBank" position="bottom" round :style="{ height: '72%' }">
      <div class="pick-hd">{{ t('cards.pickBank') }}</div>
      <van-search v-model="bankQ" :placeholder="t('cards.bankPh')" />
      <div class="pick-list">
        <button
          v-for="b in filteredBanks"
          :key="b.id"
          type="button"
          :class="['pick-row', { on: form.bankId === b.id }]"
          @click="chooseBank(b)"
        >
          <span class="dot" :style="{ background: b.color }" />
          <span class="bname">{{ b.name }}</span>
          <span class="cty">{{ t(`cards.cty_${b.country}`) }}</span>
        </button>
        <div v-if="!filteredBanks.length" class="pick-empty">{{ t('cards.noBank') }}</div>
      </div>
    </van-popup>

    <van-dialog v-model:show="showService" :title="t('common.service')" :confirm-button-text="t('common.confirm')">
      <div class="svc">{{ t('cards.serviceBody') }}</div>
    </van-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import { fetchHome } from '../api'
import { linkBanks, mockCardMeta } from '../mock/products'
import { addExtraCard, getExtraCards, pushNotice } from '../utils/local'
import { cardControl, setCardControl } from '../services/desk'
import { maskAccount } from '../utils'
import { openResult } from '../utils/result'

const { t } = useI18n()
const router = useRouter()
const mainNo = ref('')
const showAdd = ref(false)
const showBank = ref(false)
const showService = ref(false)
const extra = ref([])
const cardTick = ref(0)
const bankQ = ref('')
const defaultBank = linkBanks.find((b) => b.id === 'scb') || linkBanks[0]
const form = reactive({
  bankId: defaultBank.id,
  bank: defaultBank.name,
  color: defaultBank.color,
  number: ''
})

const filteredBanks = computed(() => {
  const q = bankQ.value.trim().toLowerCase()
  if (!q) return linkBanks
  return linkBanks.filter((b) => `${b.name} ${b.country}`.toLowerCase().includes(q))
})

function chooseBank(b) {
  form.bankId = b.id
  form.bank = b.name
  form.color = b.color
  showBank.value = false
}

const maskedMain = computed(() => maskAccount(mainNo.value || '0000'))

const allCards = computed(() => {
  const seeded = mockCardMeta.map((c) => ({
    id: c.id,
    name: t(c.nameKey),
    network: t(c.networkKey),
    masked: c.masked,
    color: c.color
  }))
  return [...extra.value, ...seeded]
})

async function copyMain() {
  try {
    await navigator.clipboard.writeText(mainNo.value)
    showSuccessToast(t('common.copyOk'))
  } catch {
    showSuccessToast(mainNo.value || '-')
  }
}

function controlText(id) {
  cardTick.value
  const c = cardControl(id)
  if (c.lost) return t('desk.lost')
  if (c.frozen) return t('desk.freeze')
  return ''
}

function toggleFreeze(id) {
  const next = !cardControl(id).frozen
  setCardControl(id, { frozen: next })
  cardTick.value += 1
  pushNotice(next ? t('desk.freeze') : t('desk.unfreeze'), id)
  openResult(router, {
    kind: 'card',
    note: t('result.note_card'),
    title: next ? t('desk.freeze') : t('desk.unfreeze'),
    back: '/cards',
    rows: [
      { label: t('cards.title'), value: id },
      { label: t('result.status'), value: next ? t('desk.freeze') : t('desk.unfreeze') }
    ]
  })
}

function toggleLost(id) {
  const next = !cardControl(id).lost
  setCardControl(id, { lost: next, frozen: next ? true : cardControl(id).frozen })
  cardTick.value += 1
  pushNotice(next ? t('desk.lost') : t('desk.found'), id)
  openResult(router, {
    kind: 'card',
    note: t('result.note_card'),
    title: next ? t('desk.lost') : t('desk.found'),
    back: '/cards',
    rows: [
      { label: t('cards.title'), value: id },
      { label: t('result.status'), value: next ? t('desk.lost') : t('desk.found') }
    ]
  })
}

function editLimit(id) {
  const raw = window.prompt(t('desk.limit'), String(cardControl(id).limit))
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return
  setCardControl(id, { limit: n })
  cardTick.value += 1
  openResult(router, {
    kind: 'card',
    note: t('result.note_card'),
    title: t('desk.limit'),
    amount: `$${n.toFixed(2)}`,
    back: '/cards',
    rows: [
      { label: t('cards.title'), value: id },
      { label: t('desk.limit'), value: `$${n.toFixed(2)}` }
    ]
  })
}

function onAdd() {
  const num = form.number.replace(/\D/g, '')
  if (num.length < 12) {
    showFailToast(t('cards.cardInvalid'))
    return false
  }
  const id = 'u_' + Date.now()
  const masked = `**** **** **** ${num.slice(-4)}`
  addExtraCard({
    id,
    name: form.bank,
    network: t('cards.networkVisa'),
    masked,
    full: num.replace(/(\d{4})(?=\d)/g, '$1 ').trim(),
    color: form.color
  })
  extra.value = getExtraCards()
  pushNotice(t('cards.addOk'), form.bank)
  const bank = form.bank
  form.number = ''
  openResult(router, {
    kind: 'card',
    note: t('result.note_card'),
    title: t('cards.addOk'),
    subtitle: masked,
    back: '/cards',
    rows: [
      { label: t('transfer.bankName'), value: bank },
      { label: t('cards.title'), value: masked },
      { label: t('cards.networkVisa'), value: t('cards.networkVisa') }
    ]
  })
}

onMounted(async () => {
  extra.value = getExtraCards()
  const res = await fetchHome()
  if (res.code === 0) mainNo.value = res.data?.accounts?.[0]?.account_no || ''
})
</script>

<style scoped>
:deep(.van-nav-bar) { background: #123b6d; }
:deep(.van-nav-bar__title),
:deep(.van-nav-bar .van-icon) { color: #fff !important; }
.tip-box { background: #fff; padding: 14px 16px; }
.tip-title { font-size: 14px; font-weight: 600; }
.tip-sub { margin-top: 6px; font-size: 12px; color: #8a8f99; line-height: 1.5; }
.card-list { padding: 12px 16px 80px; }
.bank-card {
  border-radius: 14px; color: #fff; padding: 16px; margin-bottom: 12px;
  min-height: 140px; position: relative;
  box-shadow: 0 8px 20px rgba(0,0,0,.12);
}
.bank-card.wecode { background: linear-gradient(135deg, #123b6d, #2f7bff); }
.bc-top { display: flex; justify-content: space-between; }
.bc-name { font-size: 15px; font-weight: 600; }
.bc-type { margin-top: 4px; font-size: 12px; opacity: .85; }
.union { opacity: .55; font-size: 12px; }
.bc-no { margin-top: 28px; font-size: 20px; letter-spacing: 2px; font-weight: 600; }
.bc-ctl { margin-top: 8px; font-size: 12px; }
.ctl-row {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  background: #fff; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; font-size: 12px;
}
.ctl-row span { font-weight: 600; margin-right: auto; }
.ctl-row button { border: 0; background: #eef4ff; color: #123b6d; border-radius: 12px; padding: 4px 8px; }
.bc-action {
  position: absolute; right: 16px; bottom: 16px;
  font-size: 12px; opacity: .95; border: 1px solid rgba(255,255,255,.5);
  border-radius: 12px; padding: 2px 8px;
}
.svc { padding: 16px; font-size: 14px; color: #333; line-height: 1.6; }
.pick-hd { padding: 16px 16px 0; font-size: 16px; font-weight: 700; text-align: center; }
.pick-list { height: calc(100% - 96px); overflow: auto; padding: 0 8px 16px; }
.pick-row {
  width: 100%; display: flex; align-items: center; gap: 10px;
  border: 0; background: #fff; padding: 12px 8px; border-bottom: 1px solid #f2f3f5;
  text-align: left;
}
.pick-row.on { background: #eef4ff; }
.dot { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; }
.bname { flex: 1; font-size: 15px; color: #222; font-weight: 600; }
.cty { font-size: 12px; color: #8a8f99; }
.pick-empty { padding: 24px; text-align: center; color: #999; font-size: 13px; }
</style>
