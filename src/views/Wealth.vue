<template>
  <div class="page wealth">
    <div class="top">
      <div>
        <div class="eyebrow">AKU PRIVATE WEALTH</div>
        <div class="title">{{ t('wealth.title') }}</div>
      </div>
      <div class="actions">
        <div @click="openSearch"><span><van-icon name="search" /></span><div>{{ t('common.search') }}</div></div>
        <div @click="showWatch = true"><span><van-icon name="star-o" /></span><div>{{ t('common.watchlist') }}</div></div>
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
        <div class="ci"><FeatureIcon :name="c.art" /></div>
        <div class="cat-name" :title="c.name">{{ c.name }}</div>
      </div>
    </div>

    <div class="shortcuts">
      <div @click="scrollList"><span class="shortcut-icon"><FeatureIcon name="wealth" /></span><span>{{ t('wealth.hotList') }}</span></div>
      <div @click="$router.push('/newbie')"><span class="shortcut-icon"><FeatureIcon name="benefits" /></span><span>{{ t('wealth.hotAct') }}</span></div>
    </div>

    <div class="wb-card promo" @click="goBuy({ id: 'hqPlusX', name: t('newbie.hqPlusX'), rate: '5.20%' })">
      <div>
        <div class="curated">{{ t('wealth.curated') }}</div>
        <div class="p-title">{{ t('wealth.promoTitle') }}</div>
        <div class="rate big">5.20%</div>
        <div class="muted">{{ t('wealth.promoRateLabel') }}</div>
      </div>
      <van-button size="small" round>{{ t('wealth.viewProduct') }}</van-button>
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
          <div class="issuer-mark"><FeatureIcon name="wealth" /></div>
          <div class="product-copy"><span class="org">{{ p.org }}</span><span class="name">{{ p.name }}</span></div>
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
        <div class="product-meta"><span>USD</span><span>{{ t('wealth.professionalCustody') }}</span><span>{{ p.risk }}</span></div>
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
import FeatureIcon from '../components/FeatureIcon.vue'

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
  const arts = ['loans', 'transactions', 'funds', 'wealth', 'points']
  return wealthCategories(t).map((c, i) => ({
    ...c,
    key: ['bond', 'mm', 'etf', 'private', 'cd'][i],
    art: arts[i]
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
    path: '/wealth/detail',
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
  else router.push({ path: '/wealth/detail', query: { id: w.id, name: w.name } })
}
</script>

<style scoped>
.wealth { padding: 0 12px 24px; background: linear-gradient(180deg,#0b3159 0,#174f87 148px,#f4f6f8 148px); }
.top { display: flex; justify-content: space-between; align-items: center; padding: 19px 4px 18px; color: #fff; }
.eyebrow { margin-bottom: 4px; color: #d9be83; font-size: 9px; font-weight: 700; letter-spacing: 1.4px; }
.title { font-size: 25px; font-weight: 750; letter-spacing: .3px; }
.actions { display: flex; gap: 13px; text-align: center; font-size: 9px; color: rgba(255,255,255,.75); }
.actions span { display: grid; place-items: center; width: 32px; height: 32px; margin: 0 auto 3px; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; background: rgba(255,255,255,.09); color: #fff; font-size: 15px; }
.actions > div > div { max-width: 58px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cats {
  display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 3px;
  background: #fff; border: 1px solid rgba(8,40,73,.06); border-radius: 16px; padding: 15px 5px; text-align: center; font-size: 9px; box-shadow: 0 10px 28px rgba(8,40,73,.1);
}
.cat { min-width: 0; padding: 2px 0 4px; border-radius: 12px; }
.cat.on { color: #123b6d; font-weight: 750; background: linear-gradient(180deg,rgba(18,59,109,.04),rgba(200,164,93,.1)); }.cat.on .ci { transform: translateY(-1px) scale(1.07); }
.ci {
  width: 46px; height: 46px; margin: 0 auto 5px; padding: 2px;
  display: flex; align-items: center; justify-content: center; font-weight: 700;
  transition: transform .18s ease;
}
.cat-name { width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 16px; }
.shortcuts {
  margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.shortcuts > div {
  display: flex; align-items: center; min-width: 0; gap: 7px; background: #fff; border-radius: 10px; padding: 8px 11px; font-size: 12px; font-weight: 650;
}
.shortcuts > div > span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shortcut-icon { width: 28px; height: 28px; flex: 0 0 28px; }
.promo, .event { margin-top: 11px; padding: 16px; }
.promo { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.promo { color: #fff; border: 0; background: radial-gradient(circle at 90% 10%,rgba(224,194,132,.34),transparent 35%),linear-gradient(145deg,#174f87,#082849); }
.promo .muted { color: rgba(255,255,255,.58); }.promo .rate { color: #ead098; }
.promo :deep(.van-button) { border-color: #d8ba78; background: #d8ba78; color: #102d4d; font-weight: 700; }
.curated { margin-bottom: 8px; color: #dfc282; font-size: 9px; font-weight: 700; letter-spacing: 1px; }
.p-title, .e-title { font-weight: 600; font-size: 14px; }
.link { margin-top: 8px; color: #123b6d; font-size: 13px; font-weight: 600; }
.big { font-size: 24px; margin-top: 6px; }
.muted { color: #8a8f99; font-size: 12px; margin-top: 4px; }
.list { padding: 2px 14px; }
.item { padding: 14px 0; border-bottom: 1px solid #f0f2f5; }
.item:last-child { border-bottom: none; }
.row1 { display: flex; align-items: center; gap: 9px; }
.issuer-mark { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; padding: 2px; }
.product-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
.org { font-size: 12px; color: #666; }
.name { font-weight: 700; font-size: 14px; }
.tag { font-size: 10px; color: #ff6b00; background: #fff1e6; border-radius: 4px; padding: 1px 4px; }
.row2 { margin-top: 8px; display: flex; justify-content: space-between; gap: 10px; }
.right { text-align: right; font-size: 12px; color: #555; }
.product-meta { display: flex; gap: 6px; margin-top: 9px; }.product-meta span { padding: 3px 6px; border-radius: 5px; background: #f1f4f7; color: #637083; font-size: 9px; }
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
