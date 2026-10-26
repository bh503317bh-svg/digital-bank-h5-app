<template>
  <div class="page no-tab newbie">
    <van-nav-bar :title="t('common.brand')" left-arrow @click-left="$router.back()" />
    <div class="hero">
      <div class="title">{{ t('newbie.title') }}</div>
      <div class="sub">{{ t('newbie.sub') }}</div>
    </div>

    <div class="wb-card block">
      <div class="hd">{{ t('newbie.transferGift') }}</div>
      <div class="desc" v-html="transferDescHtml" />
      <div class="muted">{{ t('newbie.transferTip') }}</div>
      <van-button size="small" color="#123b6d" round @click="$router.push('/transfer-in')">{{ t('newbie.goTransfer') }}</van-button>
    </div>

    <div class="wb-card block">
      <div class="hd">{{ t('newbie.wealthGift') }}</div>
      <div class="prod">
        <div>
          <div class="name">{{ t('newbie.hqPlusX') }} <span class="tag">{{ t('home.newbieTag') }}</span></div>
          <div class="rate big">5.20%</div>
          <div class="muted">{{ t('newbie.rateSince') }}</div>
        </div>
        <van-button size="small" color="#123b6d" round @click="goBuy('hqPlusX', t('newbie.hqPlusX'), '5.20%')">{{ t('newbie.goBuy') }}</van-button>
      </div>
      <div class="prod" style="margin-top:14px">
        <div>
          <div class="name">{{ t('newbie.hqPlus') }}</div>
          <div class="rate big">4.85%</div>
          <div class="muted">{{ t('newbie.rate7d') }}</div>
        </div>
        <van-button size="small" color="#123b6d" round @click="goBuy('hqPlus', t('newbie.hqPlus'), '4.85%')">{{ t('newbie.goBuy') }}</van-button>
      </div>
    </div>

    <div class="claim-bar">
      <span>{{ t('newbie.learnBar') }}</span>
      <van-button size="mini" color="#ff6b6b" round :disabled="claimed" @click="onClaim">
        {{ claimed ? t('newbie.claimed') : t('newbie.claim') }}
      </van-button>
    </div>

    <div class="wb-card block">
      <div class="hd">{{ t('newbie.growth') }}</div>
      <div class="desc" v-html="growthDescHtml" />
      <div class="grow-item" @click="$router.push('/transfer-in')">
        <div class="name">{{ t('newbie.gift1000') }} ›</div>
        <div class="muted">{{ t('newbie.gift1000Desc') }}</div>
      </div>
      <div class="grow-item" @click="goBuy('hqPlusX', t('newbie.hqPlusX'), '5.20%')">
        <div class="name">{{ t('newbie.giftAdvance') }} ›</div>
        <div class="muted">{{ t('newbie.giftAdvanceDesc') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { openResult } from '../utils/result'
import { getClaimed, getPoints, markClaimed, pushNotice, setPoints } from '../utils/local'

const { t } = useI18n()
const router = useRouter()
const claimed = ref(!!getClaimed().learn5)

function goBuy(id, name, rate) {
  router.push({ path: '/wealth/buy', query: { id, name, rate } })
}

function onClaim() {
  if (claimed.value) return
  markClaimed('learn5')
  claimed.value = true
  setPoints(getPoints() + 100)
  pushNotice(t('newbie.claim'), t('newbie.claimPts'))
  openResult(router, {
    kind: 'reward',
    note: t('result.note_reward'),
    title: t('newbie.claimPts'),
    amount: '+100',
    back: '/newbie',
    rows: [
      { label: t('newbie.claim'), value: '+100' },
      { label: t('points.balance'), value: String(getPoints()) }
    ]
  })
}

const transferDescHtml = computed(() =>
  t('newbie.transferDesc', { n: '<span class="rate">$5</span>' })
)
const growthDescHtml = computed(() =>
  t('newbie.growthDesc', { n: '<span class="rate">$1505</span>' })
)
</script>

<style scoped>
:deep(.van-nav-bar) { background: #eaf2ff; }
:deep(.van-nav-bar__title) { color: #1a1a1a; }
.newbie { background: linear-gradient(180deg, #eaf2ff 0%, #f3f5f9 180px); }
.hero { padding: 8px 16px 12px; }
.title { font-size: 28px; font-weight: 800; }
.sub { margin-top: 6px; color: #666; font-size: 14px; }
.block { margin: 12px; padding: 16px; }
.hd { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
.desc { font-size: 14px; margin-bottom: 8px; }
.muted { color: #8a8f99; font-size: 12px; margin: 6px 0 12px; }
.prod { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.name { font-weight: 600; }
.tag {
  margin-left: 6px; font-size: 10px; color: #ff6b00; background: #fff1e6;
  border-radius: 4px; padding: 1px 4px;
}
.big { font-size: 26px; margin-top: 4px; }
.claim-bar {
  margin: 12px; padding: 12px 14px; background: #fff; border-radius: 12px;
  display: flex; justify-content: space-between; align-items: center; font-size: 13px; gap: 8px;
}
.grow-item { padding: 10px 0; border-top: 1px solid #f0f2f5; }
:deep(.rate) { color: #00a870; font-weight: 700; }
</style>
