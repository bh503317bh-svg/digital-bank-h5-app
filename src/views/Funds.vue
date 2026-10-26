<template>
  <div class="page funds">
    <div class="search-row">
      <van-search v-model="keyword" shape="round" :placeholder="t('funds.searchPh')" @search="onSearch" />
      <div class="watch" @click="showWatch = true">
        <span><van-icon name="star-o" /></span>
        <div>{{ t('common.watchlist') }}</div>
      </div>
    </div>

    <div class="grid">
      <div v-for="(row, ri) in entries" :key="ri" class="grid-row">
        <div
          v-for="item in row"
          :key="item.label"
          :class="['g-item', { on: activeEntry === item.key }]"
          @click="onEntry(item)"
        >
          <div class="gi"><FeatureIcon :name="item.art" /></div>
          <div class="entry-label" :title="item.label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <van-tabs v-model:active="mainTab" color="#f5c518" title-active-color="#1a1a1a">
      <van-tab :title="t('funds.bigData')">
        <!-- Popular / Performance / Hot sectors -->
        <div class="pillbar">
          <button
            v-for="s in subTabs"
            :key="s.key"
            type="button"
            :class="['pill', { on: subTab === s.key }]"
            @click="subTab = s.key"
          >{{ s.label }}</button>
        </div>

        <!-- Hot sectors: pick sector first -->
        <div v-if="subTab === 'sector'" class="sector-row">
          <span
            v-for="sec in sectors"
            :key="sec.key"
            :class="['sec', { on: sectorKey === sec.key }]"
            @click="sectorKey = sec.key"
          >{{ sec.label }}</span>
        </div>

        <div class="section-hd">
          <span>{{ sectionTitle }}</span>
          <span class="more" @click="resetFilters">{{ t('common.more') }}</span>
        </div>

        <div class="wb-card list">
          <div v-if="!displayFunds.length" class="empty">{{ t('funds.noMatch') }}</div>
          <div v-for="(f, idx) in displayFunds" :key="f.id" class="fund" @click="goBuy(f)">
            <div class="rank" :class="{ top: idx < 3 }">{{ idx + 1 }}</div>
            <div class="body">
              <div class="fname">
                <span class="sym">{{ f.ticker }}</span>
                {{ f.name }}
                <span v-if="f.tag" class="tag">{{ f.tag }}</span>
                <van-icon
                  class="star"
                  :name="watched(f.id) ? 'star' : 'star-o'"
                  :color="watched(f.id) ? '#f5c518' : '#bbb'"
                  @click.stop="onWatch(f)"
                />
              </div>
              <div class="metrics">
                <div class="date-metric">
                  <div class="as-of">{{ formatFundDate(f.asOf) }}</div>
                  <div class="muted">{{ t('funds.w1') }}</div>
                </div>
                <div>
                  <div :class="rateClass(f.y1)">{{ f.y1 }}</div>
                  <div class="muted">{{ t('funds.y1') }}</div>
                </div>
                <van-button class="invest-btn" size="small" type="primary" round @click.stop="goBuy(f)">
                  {{ t('funds.buy') }}
                </van-button>
              </div>
            </div>
          </div>
        </div>
      </van-tab>

      <van-tab :title="t('funds.hotPick')">
        <div class="wb-card list" style="margin-top:12px">
          <div v-for="f in hotFunds" :key="'h'+f.id" class="fund" @click="goBuy(f)">
            <div class="body full">
              <div class="fname">
                <span class="sym">{{ f.ticker }}</span>
                {{ f.name }}
                <span class="tag">{{ t('funds.hotTag') }}</span>
              </div>
              <div class="metrics">
                <div>
                  <div class="as-of">{{ formatFundDate(f.asOf) }}</div>
                  <div class="muted">{{ t('funds.w1') }}</div>
                </div>
                <div>
                  <div :class="rateClass(f.y1)">{{ f.y1 }}</div>
                  <div class="muted">{{ t('funds.y1') }}</div>
                </div>
                <van-button class="invest-btn" size="small" type="primary" round @click.stop="goBuy(f)">
                  {{ t('funds.buy') }}
                </van-button>
              </div>
            </div>
          </div>
        </div>
      </van-tab>

      <van-tab :title="t('funds.seaStocks')">
        <div class="section-hd">
          <span>{{ t('funds.seaStockTitle') }}</span>
        </div>
        <div class="wb-card list">
          <div v-for="(s, idx) in stocks" :key="s.id" class="fund" @click="goBuy(s)">
            <div class="rank" :class="{ top: idx < 3 }">{{ idx + 1 }}</div>
            <div class="body">
              <div class="fname">
                <span class="sym">{{ s.ticker }}</span>
                {{ s.name }}
                <span class="tag">{{ s.market }}</span>
              </div>
              <div class="metrics">
                <div>
                  <div class="pop">{{ s.price }}</div>
                  <div class="muted">{{ t('funds.last') }}</div>
                </div>
                <div>
                  <div :class="rateClass(s.chg)">{{ s.chg }}</div>
                  <div class="muted">{{ t('funds.chg') }}</div>
                </div>
                <van-button class="invest-btn" size="small" type="primary" round @click.stop="goBuy(s)">
                  {{ t('funds.buy') }}
                </van-button>
              </div>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <div class="mkt">
      <span v-for="q in quotes" :key="q.id">
        {{ t(q.nameKey) }} {{ q.price }}
        <i :class="q.chg.startsWith('-') ? 'down' : 'up'">{{ q.chg }}</i>
      </span>
    </div>

    <van-action-sheet v-model:show="showWatch" :title="t('common.watchlist')">
      <div class="watch-sheet">
        <div v-if="!watchItems.length" class="empty">{{ t('funds.watchEmpty') }}</div>
        <div v-for="w in watchItems" :key="w.id" class="watch-row" @click="openWatch(w)">
          <span>{{ w.name }}</span>
          <van-icon name="arrow" />
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import { ASEAN_INDEX_TICKERS, SECTOR_KEYS, fundEntryRows, localizeFunds, localizeStocks, marketQuotes } from '../mock/products'
import { getWatchlist, isWatched, toggleWatch } from '../utils/local'
import FeatureIcon from '../components/FeatureIcon.vue'

const { t, locale, tm } = useI18n()
const router = useRouter()
const keyword = ref('')
const mainTab = ref(0)
const subTab = ref('hot')
const sectorKey = ref('all')
const activeEntry = ref('all')
const showWatch = ref(false)
const watchTick = ref(0)

const ENTRY_KEYS = [
  'rank', 'index', 'global', 'gold', 'fixed',
  'bond', 'treasury', 'qqq', 'smart', 'more'
]
const ENTRY_ART = [
  'funds', 'wealth', 'invite', 'points', 'loans',
  'transactions', 'security', 'transfer', 'benefits', 'card'
]

const entries = computed(() => {
  locale.value
  const labels = tm('funds.entries')
  const items = (Array.isArray(labels) ? labels : []).map((label, i) => ({
    label,
    key: ENTRY_KEYS[i] || `e${i}`,
    art: ENTRY_ART[i] || 'funds'
  }))
  return fundEntryRows(items)
})

const funds = computed(() => { locale.value; return localizeFunds(t) })
const stocks = computed(() => { locale.value; return localizeStocks(t) })
const quotes = marketQuotes

const subTabs = computed(() => {
  locale.value
  return [
    { key: 'hot', label: t('funds.subHot') },
    { key: 'perf', label: t('funds.subPerf') },
    { key: 'sector', label: t('funds.subSector') }
  ]
})

const sectors = computed(() => {
  locale.value
  return [
    { key: 'all', label: t('funds.secAll') },
    ...SECTOR_KEYS.map((k) => ({ key: k, label: t(`funds.sec_${k}`) }))
  ]
})

const sectionTitle = computed(() => {
  if (subTab.value === 'perf') return t('funds.highPerf')
  if (subTab.value === 'sector') return t('funds.highSector')
  return t('funds.highPop')
})

watch(subTabs, (tabs) => {
  if (!tabs.find((x) => x.key === subTab.value)) subTab.value = tabs[0].key
}, { immediate: true })

const filteredByEntry = computed(() => {
  let rows = funds.value
  const k = activeEntry.value
  if (k === 'qqq') rows = rows.filter((f) => f.ticker === 'QQQ')
  else if (k === 'index') rows = rows.filter((f) => ['SPY', 'QQQ', 'VTI', ...ASEAN_INDEX_TICKERS].includes(f.ticker))
  else if (k === 'gold') rows = rows.filter((f) => f.sector === 'gold')
  else if (k === 'bond' || k === 'fixed' || k === 'treasury') rows = rows.filter((f) => f.sector === 'bond')
  else if (k === 'global') rows = rows.filter((f) => f.sector !== 'gold')
  else if (k === 'rank' || k === 'smart') {
    /* keep all — ranking driven by subTab */
  }
  return rows
})

const displayFunds = computed(() => {
  let rows = [...filteredByEntry.value]
  const q = keyword.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter((f) =>
      `${f.name} ${f.ticker || ''} ${f.tag}`.toLowerCase().includes(q)
    )
  }
  if (subTab.value === 'hot') {
    rows.sort((a, b) => b.pop - a.pop)
  } else if (subTab.value === 'perf') {
    rows.sort((a, b) => parseFloat(b.y1) - parseFloat(a.y1))
  } else if (subTab.value === 'sector') {
    if (sectorKey.value !== 'all') {
      rows = rows.filter((f) => f.sector === sectorKey.value)
    }
    rows.sort((a, b) => parseFloat(b.y1) - parseFloat(a.y1))
  }
  return rows
})

const hotFunds = computed(() =>
  [...funds.value].sort((a, b) => b.pop - a.pop).slice(0, 6)
)

const watchItems = computed(() => {
  watchTick.value
  return getWatchlist()
})

function watched(id) {
  watchTick.value
  return isWatched(id)
}

function onSearch() {
  if (!keyword.value.trim()) {
    showFailToast(t('funds.needKeyword'))
    return
  }
  showSuccessToast(t('funds.searchOk', { n: displayFunds.value.length }))
}

function onEntry(item) {
  if (item.key === 'more') {
    resetFilters()
    return
  }
  mainTab.value = 0
  if (item.key === 'smart' || item.key === 'rank') {
    subTab.value = 'hot'
  } else if (item.key === 'qqq' || item.key === 'index') {
    subTab.value = 'perf'
  } else if (item.key === 'gold') {
    subTab.value = 'sector'
    sectorKey.value = 'gold'
  }
  activeEntry.value = item.key
}

function resetFilters() {
  activeEntry.value = 'all'
  keyword.value = ''
  subTab.value = 'hot'
  sectorKey.value = 'all'
}

function rateClass(v) {
  return String(v).startsWith('-') ? 'down' : 'up'
}

function formatFundDate(value) {
  if (!value) return ''
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '2026-09-30'
  return new Intl.DateTimeFormat(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(`${normalized}T00:00:00`))
}

function goBuy(f) {
  router.push({
    path: '/wealth/detail',
    query: { id: f.id, name: f.name, rate: f.y1 || f.chg || '' }
  })
}

function onWatch(f) {
  const { added } = toggleWatch(f.id, f.name)
  watchTick.value += 1
  showSuccessToast(added ? t('funds.watchAdd') : t('funds.watchRemove'))
}

function openWatch(w) {
  showWatch.value = false
  const f = funds.value.find((x) => x.id === w.id)
  if (f) goBuy(f)
  else router.push({ path: '/wealth/detail', query: { id: w.id, name: w.name } })
}
</script>

<style scoped>
.funds { padding-bottom: 74px; background: #f4f6f8; }
.search-row { display: flex; align-items: center; gap: 7px; padding: 8px 12px; background: linear-gradient(145deg,#174f87,#082849); }
.search-row :deep(.van-search) { flex: 1; min-width: 0; padding: 0; background: transparent; }
.search-row :deep(.van-search__content) { height: 42px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.96); }
.watch { width: 53px; flex: 0 0 53px; overflow: hidden; color: rgba(255,255,255,.82); text-align: center; font-size: 9px; white-space: nowrap; }
.watch span { display: grid; place-items: center; width: 30px; height: 30px; margin: 0 auto 2px; border: 1px solid rgba(255,255,255,.3); border-radius: 50%; background: rgba(255,255,255,.1); color: #fff; font-size: 15px; }
.grid { background: #fff; margin: 10px 12px 12px; border: 1px solid rgba(8,40,73,.06); border-radius: 16px; padding: 10px 4px; box-shadow: 0 9px 25px rgba(15,39,68,.07); }
.grid-row { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); }
.g-item { min-width: 0; border-radius: 11px; text-align: center; font-size: 9px; padding: 7px 1px; }
.g-item.on { color: #123b6d; font-weight: 750; background: linear-gradient(180deg,rgba(18,59,109,.04),rgba(200,164,93,.1)); }
.g-item.on .gi { transform: translateY(-1px) scale(1.07); }
.gi {
  width: 43px; height: 43px; margin: 0 auto 4px; padding: 2px;
  display: flex; align-items: center; justify-content: center; transition: transform .18s ease;
}
.entry-label { width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 15px; }

.pillbar {
  display: flex; gap: 7px; padding: 12px 12px 4px; background: #f4f6f8;
  margin: 0; flex-wrap: nowrap; overflow-x: auto;
}
.pill {
  border: none; background: transparent; color: #5a6070;
  font-size: 14px; padding: 8px 16px; border-radius: 20px; font-weight: 500;
}
.pill.on {
  background: linear-gradient(135deg,#e7eef8,#f7f0e2); color: #123b6d; font-weight: 700;
}

.sector-row {
  display: flex; gap: 8px; padding: 10px 12px 0; overflow-x: auto; background: #f4f6f8;
}
.sec {
  flex: 0 0 auto; padding: 4px 12px; border-radius: 12px;
  background: #fff; font-size: 12px; color: #666;
}
.sec.on { color: #123b6d; font-weight: 600; background: #e8f1ff; }

.section-hd {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px 8px; font-weight: 700; font-size: 15px; background: #f4f6f8;
}
.more { font-size: 12px; color: #8a8f99; font-weight: 400; }

.list { margin: 0 8px; padding: 4px 12px; }
.fund {
  display: flex; gap: 10px; padding: 14px 0; border-bottom: 1px solid #f0f2f5;
}
.fund:last-child { border-bottom: none; }
.rank {
  width: 22px; align-self: stretch; flex-shrink: 0;
  display: grid; place-items: center; text-align: center;
  font-size: 15px; font-weight: 700; color: #bbb; line-height: 1;
}
.rank.top { color: #ff6b00; }
.body { flex: 1; min-width: 0; }
.body.full { width: 100%; }
.fname {
  font-weight: 600; font-size: 13px; line-height: 1.4;
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
}
.sym {
  font-size: 11px; color: #123b6d; background: #eef4ff;
  border-radius: 4px; padding: 1px 5px; font-weight: 700;
}
.star { margin-left: auto; }
.tag {
  font-size: 10px; color: #ff6b00; background: #fff1e6;
  border-radius: 4px; padding: 1px 4px; font-weight: 500;
}
.metrics {
  margin-top: 10px; display: grid;
  grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center;
}
.date-metric { min-width: 92px; }
.as-of { color: #637083; font-size: 10px; font-weight: 600; line-height: 1.2; white-space: nowrap; }
.invest-btn { min-width: 64px; padding: 0 12px; }
.up { color: #00a870; font-size: 18px; font-weight: 700; }
.down { color: #e34d59; font-size: 18px; font-weight: 700; }
.muted { color: #8a8f99; font-size: 11px; margin-top: 2px; }
.mkt {
  position: sticky; bottom: 56px; background: #fff; border-top: 1px solid #eef0f4;
  display: flex; gap: 14px; padding: 8px 12px; font-size: 11px; color: #555;
  overflow-x: auto; white-space: nowrap;
}
.mkt span { flex: 0 0 auto; }
.mkt .down, .mkt .up { font-size: 11px; font-style: normal; }
.empty { padding: 20px; text-align: center; color: #999; font-size: 13px; }
.watch-sheet { padding: 8px 16px 24px; max-height: 50vh; overflow: auto; }
.watch-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid #f0f2f5;
}
</style>
