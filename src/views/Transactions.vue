<template>
  <div class="page no-tab">
    <van-nav-bar :title="t('txn.title')" left-arrow @click-left="$router.back()">
      <template #right><van-icon name="service-o" size="18" color="#fff" @click="showService = true" /></template>
    </van-nav-bar>

    <div class="filter-bar">
      <div class="f-item" @click="cycleSort">{{ sortLabel }} <van-icon name="arrow-down" /></div>
      <div class="divider" />
      <div class="f-item" @click="cycleDir">{{ dirLabel }} <van-icon name="arrow-down" /></div>
    </div>

    <div v-if="loading" class="empty-box">{{ t('common.loading') }}</div>
    <div v-else-if="!filtered.length" class="empty-box">
      <div class="icon">☰</div>
      <div>{{ t('txn.empty') }}</div>
      <van-button size="small" color="#123b6d" round style="margin-top:12px" @click="$router.push('/transfer-in')">
        {{ t('txn.goTransfer') }}
      </van-button>
    </div>
    <div v-else class="list">
      <div v-for="item in filtered" :key="item.id" class="row">
        <div>
          <div class="title">{{ item.remark || (item.direction === 'in' ? t('txn.in') : t('txn.out')) }}</div>
          <div class="time">{{ item.created_at }}</div>
        </div>
        <MoneyAmount class="amt" :value="item.amount" :currency="currency" :signed="item.direction === 'in' ? '+' : '−'" :tone="item.direction === 'in' ? 'positive' : 'negative'" size="sm" />
      </div>
    </div>

    <van-dialog v-model:show="showService" :title="t('common.service')" :confirm-button-text="t('common.confirm')">
      <div class="svc">{{ t('txn.serviceBody') }}</div>
    </van-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchHome, fetchLedgers } from '../api'
import MoneyAmount from '../components/MoneyAmount.vue'

const { t } = useI18n()
const route = useRoute()
const rows = ref([])
const currency = ref('USD')
const loading = ref(true)
const sortMode = ref(0) // 0 time desc, 1 amt desc, 2 amt asc
const dirMode = ref(0) // 0 all, 1 in, 2 out
const showService = ref(false)

const sortLabel = computed(() => {
  if (sortMode.value === 1) return t('txn.sortDesc')
  if (sortMode.value === 2) return t('txn.sortAsc')
  return t('txn.amount')
})

const dirLabel = computed(() => {
  if (dirMode.value === 1) return t('txn.in')
  if (dirMode.value === 2) return t('txn.out')
  return t('txn.filter')
})

const filtered = computed(() => {
  let list = [...rows.value]
  if (dirMode.value === 1) list = list.filter((x) => x.direction === 'in')
  if (dirMode.value === 2) list = list.filter((x) => x.direction === 'out')
  if (sortMode.value === 1) list.sort((a, b) => Number(b.amount_cents || b.amount) - Number(a.amount_cents || a.amount))
  else if (sortMode.value === 2) list.sort((a, b) => Number(a.amount_cents || a.amount) - Number(b.amount_cents || b.amount))
  else list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  return list
})

function cycleSort() {
  sortMode.value = (sortMode.value + 1) % 3
}

function cycleDir() {
  dirMode.value = (dirMode.value + 1) % 3
}

onMounted(async () => {
  try {
    const home = await fetchHome()
    const list = home.code === 0 ? (home.data?.accounts || []) : []
    const picked = list.find((a) => a.account_no === route.query.no)
      || list.find((a) => (a.currency || 'USD') === 'USD')
      || list[0]
    if (!picked) {
      rows.value = []
      return
    }
    currency.value = picked.currency || 'USD'
    const res = await fetchLedgers(picked.account_no)
    rows.value = res.code === 0 ? (res.data || []) : []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
:deep(.van-nav-bar) { background: #123b6d; }
:deep(.van-nav-bar__title), :deep(.van-nav-bar .van-icon) { color: #fff !important; }
.filter-bar {
  display: flex; background: #fff; height: 44px; align-items: center;
  border-bottom: 1px solid #eef0f4;
}
.f-item { flex: 1; text-align: center; font-size: 14px; color: #333; }
.divider { width: 1px; height: 16px; background: #e5e7eb; }
.list { background: #fff; margin-top: 8px; }
.row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid #f3f5f9;
}
.title { font-size: 15px; }
.time { margin-top: 4px; font-size: 12px; color: #8a8f99; }
.amt { flex: 0 0 auto; margin-left: 12px; }
.svc { padding: 16px; font-size: 14px; line-height: 1.6; }
</style>
