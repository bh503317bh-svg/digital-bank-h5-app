<template>
  <div class="page wealth">
    <div class="top">
      <div class="title">{{ t('wealth.title') }}</div>
      <div class="actions">
        <div @click="openSearch"><van-icon name="search" /><div>{{ t('common.search') }}</div></div>
        <div @click="showWatch = true"><van-icon name="plus" /><div>{{ t('common.watchlist') }}</div></div>
      </div>
    </div>

    <van-search
      v-if="searchOpen"
      v-model="keyword"
      shape="round"
      :placeholder="t('wealth.searchPh')"
      show-action
      @search="searchOpen = false"
      @cancel="keyword = ''; searchOpen = false"
    />

    <div class="cats">
      <div
        v-for="c in cats"
        :key="c.name"
        :class="['cat', { on: activeCat === c.key }]"
        @click="selectCat(c)"
      >
        <div class="ci" :style="{ background: c.tone }"><van-icon :name="c.icon" size="18" color="#fff" /></div>
        <div>{{ c.name }}</div>
      </div>
    </div>

    <div class="shortcuts">
      <div @click="scrollList"><van-icon name="fire" /> {{ t('wealth.hotList') }}</div>
      <div @click="$router.push('/newbie')"><van-icon name="gift-o" /> {{ t('wealth.hotAct') }}</div>
    </div>

    <div class="wb-card promo" @click="goBuy({ id: 'hqPlusX', name: t('newbie.hqPlusX'), rate: '5.20%' })">
      <div>
        <div class="p-title">{{ t('wealth.promoTitle') }}</div>
        <div class="rate big">5.20%</div>
        <div class="muted">{{ t('wealth.promoRateLabel') }}</div>
      </div>
      <van-button size="small" color="#0052d9" round>{{ t('wealth.buyNow') }}</van-button>
    </div>

    <div class="wb-card event" @click="goBuy({ id: 'w2', name: t('products.w2.name'), rate: '18.40%' })">
      <div class="e-title">{{ t('wealth.eventTitle') }}</div>
      <div class="muted">{{ t('wealth.eventSub') }}</div>
      <div class="link">{{ t('wealth.buyNow') }} ›</div>
    </div>

    <div class="section-hd" ref="listAnchor">
      <span>{{ sectionTitle }}</span>
      <span class="more" @click="clearFilter">{{ t('wealth.all') }}</span>
    </div>
    <div class="wb-card list">
      <div v-if="!visibleProducts.length" class="empty">{{ t('wealth.noMatch') }}</div>
      <div v-for="p in visibleProducts" :key="p.id" class="item" @click="goBuy(p)">
        <div class="row1">
          <span class="org">{{ p.org }}</span>
          <span class="name">{{ p.name }}</span>
          <span class="tag">{{ p.tag }}</span>
          <van-icon
            :name="watched(p.id) ? 'star' : 'star-o'"
            :color="watched(p.id) ? '#f5c518' : '#bbb'"
            @click.stop="onWatch(p)"
          />
        </div>
        <div class="row2">
          <div>
            <div class="rate big">{{ p.rate }}</div>
            <div class="muted">{{ p.rateLabel }}</div>
          </div>
          <div class="right">
            <div>{{ p.hold }}</div>
            <div class="muted">{{ p.risk }}</div>
          </div>
        </div>
        <div class="tip"><van-icon name="volume-o" size="14" /> {{ p.tip }}</div>
      </div>
    </div>

    <van-action-sheet v-model:show="showWatch" :title="t('common.watchlist')">
      <div class="watch-sheet">
        <div v-if="!watchItems.length" class="empty">{{ t('wealth.watchEmpty') }}</div>
        <div
          v-for="w in watchItems"
          :key="w.id"
          class="watch-row"
          @click="openWatch(w)"
        >
          <span>{{ w.name }}</span>
          <van-icon name="arrow" />
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showSuccessToast } from 'vant'
import { localizeWealthProducts, wealthCategories } from '../mock/products'
import { getWatchlist, isWatched, toggleWatch } from '../utils/local'

const { t, locale } = useI18n()
const router = useRouter()
const keyword = ref('')
const searchOpen = ref(false)
const activeCat = ref('all')
const showWatch = ref(false)
const watchTick = ref(0)
const listAnchor = ref(null)

const cats = computed(() => {
  locale.value
  return wealthCategories(t).map((c, i) => ({
    ...c,
    key: ['bond', 'mm', 'etf', 'private', 'cd'][i]
  }))
})

const allProducts = computed(() => {
  locale.value
  return localizeWealthProducts(t)
})

const visibleProducts = computed(() => {
  let rows = allProducts.value
  if (activeCat.value === 'bond' || activeCat.value === 'mm' || activeCat.value === 'cd') {
    rows = rows.filter((p) => p.id === 'w1')
  } else if (activeCat.value === 'etf' || activeCat.value === 'private') {
    rows = rows.filter((p) => p.id === 'w2')
  }
  const q = keyword.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter((p) =>
      `${p.name} ${p.org} ${p.tag}`.toLowerCase().includes(q)
    )
  }
  return rows
})

const sectionTitle = computed(() => {
  if (activeCat.value === 'all') return t('wealth.stable')
  const c = cats.value.find((x) => x.key === activeCat.value)
  return c?.name || t('wealth.stable')
})

const watchItems = computed(() => {
  watchTick.value
  return getWatchlist()
})

function watched(id) {
  watchTick.value
  return isWatched(id)
}

function openSearch() {
  searchOpen.value = true
}

function selectCat(c) {
  if (c.key === 'etf') {
    router.push('/funds')
    return
  }
  activeCat.value = c.key
  scrollList()
}

function clearFilter() {
  activeCat.value = 'all'
  keyword.value = ''
}

function scrollList() {
  listAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goBuy(p) {
  router.push({
    path: '/wealth/buy',
    query: { id: p.id, name: p.name, rate: p.rate }
  })
}

function onWatch(p) {
  const { added } = toggleWatch(p.id, p.name)
  watchTick.value += 1
  showSuccessToast(added ? t('wealth.watchAdd') : t('wealth.watchRemove'))
}

function openWatch(w) {
  showWatch.value = false
  const p = allProducts.value.find((x) => x.id === w.id)
  if (p) goBuy(p)
  else router.push({ path: '/wealth/buy', query: { id: w.id, name: w.name } })
}
</script>

<style scoped>
.wealth { padding: 12px 12px 20px; }
.top { display: flex; justify-content: space-between; align-items: center; padding: 4px 4px 12px; }
.title { font-size: 22px; font-weight: 800; }
.actions { display: flex; gap: 16px; text-align: center; font-size: 11px; color: #666; }
.cats {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
  background: #fff; border-radius: 12px; padding: 14px 8px; text-align: center; font-size: 11px;
}
.cat.on .ci { box-shadow: 0 0 0 2px #0052d9; }
.ci {
  width: 40px; height: 40px; margin: 0 auto 6px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 700;
}
.shortcuts {
  margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.shortcuts > div {
  background: #fff; border-radius: 10px; padding: 10px 12px; font-size: 13px; font-weight: 600;
}
.promo, .event { margin-top: 10px; padding: 14px; }
.promo { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.p-title, .e-title { font-weight: 600; font-size: 14px; }
.link { margin-top: 8px; color: #0052d9; font-size: 13px; font-weight: 600; }
.big { font-size: 24px; margin-top: 6px; }
.muted { color: #8a8f99; font-size: 12px; margin-top: 4px; }
.list { padding: 4px 12px; }
.item { padding: 14px 0; border-bottom: 1px solid #f0f2f5; }
.item:last-child { border-bottom: none; }
.row1 { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.org { font-size: 12px; color: #666; }
.name { font-weight: 600; font-size: 14px; flex: 1; }
.tag { font-size: 10px; color: #ff6b00; background: #fff1e6; border-radius: 4px; padding: 1px 4px; }
.row2 { margin-top: 8px; display: flex; justify-content: space-between; gap: 10px; }
.right { text-align: right; font-size: 12px; color: #555; }
.tip {
  margin-top: 8px; background: #f7f8fa; border-radius: 8px; padding: 8px 10px;
  font-size: 12px; color: #666; line-height: 1.4;
}
.empty { padding: 20px; text-align: center; color: #999; font-size: 13px; }
.watch-sheet { padding: 8px 16px 24px; max-height: 50vh; overflow: auto; }
.watch-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid #f0f2f5; font-size: 14px;
}
</style>
