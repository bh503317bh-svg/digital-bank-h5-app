<template>
  <div class="page no-tab">
    <van-nav-bar :title="t('notices.title')" left-arrow @click-left="$router.back()">
      <template #right>
        <span class="nav-act" @click="seed">{{ t('notices.refresh') }}</span>
      </template>
    </van-nav-bar>

    <div class="tabs">
      <span :class="['tab', { on: filter === 'all' }]" @click="filter = 'all'">{{ t('notices.all') }}</span>
      <span :class="['tab', { on: filter === 'unread' }]" @click="filter = 'unread'">{{ t('notices.unread') }}</span>
      <span :class="['tab', { on: filter === 'sys' }]" @click="filter = 'sys'">{{ t('notices.sys') }}</span>
    </div>

    <div v-if="!filtered.length" class="empty">
      <div>{{ t('notices.empty') }}</div>
      <van-button size="small" round color="#0052d9" style="margin-top:12px" @click="seed">
        {{ t('notices.loadDemo') }}
      </van-button>
    </div>
    <div v-else class="wb-card list">
      <div v-for="n in filtered" :key="n.id" class="row" @click="open(n)">
        <div class="dot" :class="{ on: !n.read }" />
        <div class="body">
          <div class="title">{{ n.title }}</div>
          <div class="text">{{ n.body }}</div>
          <div class="time">{{ n.at }} · {{ n.kind === 'sys' ? t('notices.sys') : t('notices.biz') }}</div>
        </div>
      </div>
    </div>

    <div v-if="list.length" class="footer">
      <van-button size="small" round plain type="primary" @click="markAll">{{ t('notices.markAll') }}</van-button>
      <van-button size="small" round plain type="danger" @click="clearAll">{{ t('notices.clear') }}</van-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { getNotices, markNoticesRead, saveJson } from '../utils/local'

const { t } = useI18n()
const list = ref([])
const filter = ref('all')

const filtered = computed(() => {
  let rows = list.value
  if (filter.value === 'unread') rows = rows.filter((n) => !n.read)
  if (filter.value === 'sys') rows = rows.filter((n) => n.kind === 'sys')
  return rows
})

function reload() {
  list.value = getNotices()
}

function open(n) {
  showToast(n.title)
  const next = getNotices().map((x) => (x.id === n.id ? { ...x, read: true } : x))
  saveJson('notices', next)
  reload()
}

function markAll() {
  list.value = markNoticesRead()
  showSuccessToast(t('notices.marked'))
}

async function clearAll() {
  try {
    await showConfirmDialog({
      title: t('notices.clear'),
      message: t('notices.clearMsg'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    return
  }
  saveJson('notices', [])
  reload()
  showSuccessToast(t('notices.cleared'))
}

function seed() {
  const samples = [
    { title: t('notices.s1t'), body: t('notices.s1b'), kind: 'biz' },
    { title: t('notices.s2t'), body: t('notices.s2b'), kind: 'sys' },
    { title: t('notices.s3t'), body: t('notices.s3b'), kind: 'biz' }
  ]
  samples.forEach((s) => {
    const rows = getNotices()
    rows.unshift({
      id: String(Date.now() + Math.random()),
      title: s.title,
      body: s.body,
      kind: s.kind,
      at: new Date().toISOString(),
      read: false
    })
    saveJson('notices', rows.slice(0, 50))
  })
  reload()
  showSuccessToast(t('notices.loaded'))
}

onMounted(() => {
  reload()
  if (!list.value.length) {
    const rows = [{
      id: String(Date.now()),
      title: t('notices.s2t'),
      body: t('notices.s2b'),
      kind: 'sys',
      at: new Date().toISOString(),
      read: false
    }]
    saveJson('notices', rows)
    reload()
  }
})
</script>

<style scoped>
:deep(.van-nav-bar) { background: #0052d9; }
:deep(.van-nav-bar__title), :deep(.van-nav-bar .van-icon) { color: #fff !important; }
.nav-act { color: #fff; font-size: 13px; padding-right: 4px; }
.tabs { display: flex; gap: 8px; padding: 12px; }
.tab {
  padding: 6px 14px; border-radius: 14px; background: #fff; font-size: 12px; color: #666;
}
.tab.on { background: #e8f1ff; color: #0052d9; font-weight: 700; }
.list { margin: 0 12px 12px; padding: 4px 10px; }
.row { display: flex; gap: 10px; padding: 14px 4px; border-bottom: 1px solid #f0f2f5; }
.dot {
  width: 8px; height: 8px; border-radius: 50%; background: transparent; margin-top: 6px; flex-shrink: 0;
}
.dot.on { background: #e34d59; }
.body { flex: 1; min-width: 0; }
.title { font-weight: 700; font-size: 14px; }
.text { margin-top: 4px; font-size: 13px; color: #555; line-height: 1.4; }
.time { margin-top: 6px; font-size: 11px; color: #999; }
.empty { padding: 48px 20px; text-align: center; color: #999; }
.footer {
  display: flex; justify-content: center; gap: 12px; padding: 8px 16px 24px;
}
</style>
