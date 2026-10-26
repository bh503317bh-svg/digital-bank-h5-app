<template>
  <div class="page account-page">
    <div class="wb-blue-bar top">
      <div class="user-row">
        <div class="avatar"><img :src="avatarUrl" :alt="displayName" /></div>
        <div class="identity">
          <div class="welcome">{{ t('home.welcomeBack') }}</div>
          <div class="uname">{{ displayName }} <span>Premier</span></div>
        </div>
        <van-icon name="search" size="20" style="margin-left:auto" @click="go('/funds')" />
        <van-icon name="plus" size="20" style="margin-left:10px" @click="go('/cards')" />
      </div>
      <div class="quick">
        <div v-for="q in quicks" :key="q.label" class="q-item" @click="go(q.to)">
          <div class="q-icon"><FeatureIcon :name="q.art" /></div>
          <div>{{ q.label }}</div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div v-if="loadingHome && !home" class="asset-card wb-card asset-loading">
        <div class="skeleton label" />
        <div class="skeleton amount" />
        <div class="skeleton line" />
        <div class="skeleton-ccy-strip">
          <div v-for="n in 3" :key="n" class="skeleton-ccy-card">
            <div class="skeleton ccy-title" />
            <div class="skeleton ccy-amount" />
            <div class="skeleton ccy-number" />
          </div>
        </div>
      </div>
      <div v-else-if="!home" class="asset-card wb-card asset-error">
        <div class="error-icon"><van-icon name="replay" /></div>
        <div><strong>{{ t('home.loadFail') }}</strong><span>{{ t('home.retryHint') }}</span></div>
        <button type="button" @click="loadHome()">{{ t('home.retry') }}</button>
      </div>
      <div v-else class="asset-card wb-card">
        <div class="asset-hd">
          <span>{{ t('home.totalAssets') }}</span>
          <van-icon :name="hide ? 'closed-eye' : 'eye-o'" @click="hide = !hide" />
        </div>
        <div class="asset-num"><MoneyAmount :value="usdTotal" :hide="hide" currency="USD" show-code size="xl" /></div>
        <div class="asset-sub" @click="go('/transactions')">
          <span>{{ t('home.usdEq') }} · {{ t('home.accCount') }} {{ hide ? '****' : accountCount }}</span>
          <span>{{ t('home.viewTxn') }} ›</span>
        </div>
        <div v-if="accounts.length" class="ccy-strip">
          <div v-for="a in accounts" :key="a.account_no" class="ccy-card" @click="goTxn(a)">
            <div class="ccy-card-top"><strong>{{ a.currency || 'USD' }}</strong><span>{{ ccyName(a.currency) }}</span></div>
            <div class="ccy-bal"><MoneyAmount :value="a.balance" :hide="hide" :currency="a.currency || 'USD'" size="sm" /></div>
            <div class="ccy-no">•••• {{ String(a.account_no || '').slice(-4) }}</div>
          </div>
        </div>
      </div>

      <div class="banner wb-card" @click="go('/newbie')">
        <div class="banner-tag">{{ t('home.bannerTag') }}</div>
        <div class="banner-title">{{ t('home.bannerTitle') }}</div>
        <div class="banner-sub">{{ t('home.bannerSub') }}</div>
        <button class="pill-btn solid">{{ t('home.claim') }}</button>
      </div>

      <div v-if="loadingHome && !home" class="product-list product-skeleton wb-card" aria-hidden="true">
        <div v-for="n in 3" :key="n" class="prod-row skeleton-prod-row">
          <div class="skeleton skeleton-icon" />
          <div class="skeleton-copy">
            <div class="skeleton skeleton-name" />
            <div class="skeleton skeleton-sub" />
          </div>
          <div class="skeleton skeleton-action" />
        </div>
      </div>
      <div v-else-if="home" class="product-list wb-card">
        <div class="prod-row account-row">
          <div class="prod-left">
            <div class="prod-icon"><FeatureIcon name="card" /></div>
            <div>
              <div class="prod-name">{{ t('home.wecodeCard') }}</div>
              <div class="muted">{{ money(primary?.balance || '0.00', { hide, currency: primary?.currency || 'USD' }) }}</div>
            </div>
          </div>
          <div class="prod-actions">
            <button class="pill-btn" @click="go('/transfer')">{{ t('home.transferOut') }}</button>
            <button class="pill-btn solid" @click="go('/transfer-in')">{{ t('home.transferIn') }}</button>
          </div>
        </div>

        <div v-for="p in products" :key="p.id" class="prod-row" @click="goBuy(p)">
          <div class="prod-left">
            <div class="prod-icon"><FeatureIcon :name="p.id === 'gsPlus' ? 'funds' : 'wealth'" /></div>
            <div>
              <div class="prod-name">
                {{ p.name }}
                <span v-if="p.tag" class="mini-tag">{{ p.tag }}</span>
              </div>
              <div class="muted">{{ p.desc }}</div>
            </div>
          </div>
          <div class="prod-rate">
            <div class="rate">{{ p.rate }}</div>
            <div class="muted tiny">{{ p.rateLabel }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { fetchHome } from '../api'
import { localizeAccountProducts } from '../mock/products'
import { useAuthStore } from '../stores/auth'
import { money } from '../utils'
import { sumUsd } from '../services/desk'
import { avatarFor, displayNameFor } from '../profile'
import FeatureIcon from '../components/FeatureIcon.vue'
import MoneyAmount from '../components/MoneyAmount.vue'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const home = ref(null)
const hide = ref(false)
const loadingHome = ref(false)

const products = computed(() => {
  locale.value
  return localizeAccountProducts(t)
})

const quicks = computed(() => {
  locale.value
  return [
    { label: t('home.quickTxn'), art: 'transactions', to: '/transactions' },
    { label: t('home.quickCards'), art: 'card', to: '/cards' },
    { label: t('home.quickBenefits'), art: 'benefits', to: '/rights' },
    { label: t('home.quickNewbie'), art: 'wealth', to: '/newbie' },
    { label: t('home.quickInvite'), art: 'invite', to: '/invite' }
  ]
})

const accounts = computed(() => home.value?.accounts || [])
const primary = computed(() => accounts.value.find((a) => (a.currency || 'USD') === 'USD') || accounts.value[0])
const accountCount = computed(() => accounts.value.length)
const usdTotal = computed(() => sumUsd(accounts.value).toFixed(2))

function ccyName(code) {
  const key = `home.ccy_${code || 'USD'}`
  const text = t(key)
  return text === key ? (code || 'USD') : text
}
const currentUser = computed(() => home.value?.user || auth.user || {})
const displayName = computed(() => displayNameFor(currentUser.value))
const avatarUrl = computed(() => avatarFor(currentUser.value))

function go(path) { router.push(path) }
function goTxn(account) {
  router.push({ path: '/transactions', query: { no: account.account_no } })
}
function goBuy(p) {
  router.push({
    path: '/wealth/detail',
    query: { id: p.id, name: p.name, rate: p.rate }
  })
}

async function loadHome(retries = 2) {
  loadingHome.value = true
  try {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetchHome()
        if (res.code === 0) {
          home.value = res.data
          if (res.data?.user) {
            auth.setSession(auth.token, {
              user_id: res.data.user.id || res.data.user.user_id,
              mobile: res.data.user.mobile,
              display_name: res.data.user.display_name,
              role: res.data.user.role
            })
          }
          return
        }
        if (i === retries) showToast(t('home.loadFail'))
      } catch (e) {
        if (i === retries) showToast(t('home.loadFail'))
      }
    }
  } finally {
    loadingHome.value = false
  }
}

onMounted(() => {
  loadHome()
})
</script>

<style scoped>
.top { padding: 16px 16px 64px; }
.user-row { display: flex; align-items: center; gap: 8px; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(226,201,142,.55);
  background: rgba(255,255,255,.1); color: #ead29d; display: flex; align-items: center; justify-content: center;
  overflow: hidden; font-size: 19px; font-weight: 700;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.identity { flex: 1; min-width: 0; }.welcome { color: rgba(255,255,255,.65); font-size: 10px; }.uname { margin-top: 2px; font-size: 16px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.uname span { margin-left: 5px; border: 1px solid rgba(225,197,134,.55); border-radius: 8px; padding: 1px 5px; color: #e7ce94; font-size: 8px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; }
.quick {
  margin-top: 18px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;
  text-align: center; font-size: 11px;
}
.q-icon {
  width: 48px; height: 48px; margin: 0 auto 5px; padding: 2px;
  display: flex; align-items: center; justify-content: center;
}
.panel { margin-top: -42px; padding: 0 12px 20px; }
.asset-card { padding: 18px; border-top: 3px solid #c8a45d; }
.asset-loading { min-height: 252px; }.skeleton { overflow: hidden; position: relative; border-radius: 8px; background: #edf1f4; }.skeleton::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg,transparent,rgba(255,255,255,.72),transparent); animation: shimmer 1.25s infinite; }.skeleton.label { width: 90px; height: 14px; }.skeleton.amount { width: 210px; height: 38px; margin-top: 18px; }.skeleton.line { width: 100%; height: 12px; margin-top: 22px; }.skeleton-ccy-strip { display:flex;gap:9px;margin:18px -18px -18px;padding:13px 18px 16px;overflow:hidden;border-top:1px solid #edf0f3; }.skeleton-ccy-card { width:142px;min-width:142px;height:82px;padding:11px;border:1px solid #edf0f3;border-radius:12px;background:#fafbfd; }.skeleton.ccy-title { width:62px;height:9px; }.skeleton.ccy-amount { width:96px;height:17px;margin-top:10px; }.skeleton.ccy-number { width:54px;height:7px;margin-top:9px; }@keyframes shimmer{to{transform:translateX(100%)}}
.asset-error { min-height: 142px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; }.error-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: #eef3f8; color: #123b6d; font-size: 20px; }.asset-error strong,.asset-error span { display: block; }.asset-error strong { font-size: 13px; }.asset-error span { margin-top: 4px; color: #8a95a4; font-size: 10px; }.asset-error button { border: 1px solid rgba(18,59,109,.22); border-radius: 9px; padding: 8px 10px; background: #fff; color: #123b6d; font-size: 11px; font-weight: 650; }
.asset-hd { display: flex; justify-content: space-between; color: #666; font-size: 13px; }
.asset-num { margin-top: 9px; color: #102f52; line-height: 1; }:deep(.asset-num .size-xl) { font-size: 36px; }:deep(.asset-num .currency-code) { font-size: 11px; }
.asset-sub {
  margin-top: 12px; display: flex; justify-content: space-between;
  color: #8a8f99; font-size: 12px;
}
.ccy-strip { display: flex; gap: 9px; margin: 15px -18px -18px; padding: 13px 18px 16px; overflow-x: auto; border-top: 1px solid #edf0f3; scrollbar-width: none; scroll-snap-type: x proximity; }.ccy-strip::-webkit-scrollbar { display: none; }
.ccy-card { width: 142px; min-width: 142px; padding: 11px 11px 10px; border: 1px solid #e6ebf0; border-radius: 12px; background: linear-gradient(145deg,#fff,#f7f9fb); box-shadow: 0 3px 10px rgba(15,39,68,.04); scroll-snap-align: start; }
.ccy-card-top { display: flex; align-items: baseline; min-width: 0; gap: 5px; }.ccy-card-top strong { color: #123b6d; font-size: 11px; letter-spacing: .4px; }.ccy-card-top span { min-width: 0; overflow: hidden; color: #8a95a4; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.ccy-bal { margin-top: 8px; overflow: hidden; color: #153f70; }:deep(.ccy-bal .size-sm) { max-width: 100%; font-size: 16px; }:deep(.ccy-bal .decimal) { font-size: 10px; }
.ccy-no { margin-top: 6px; color: #98a2af; font-size: 9px; letter-spacing: .4px; }
.banner { margin-top: 12px; padding: 17px; position: relative; overflow: hidden; background: linear-gradient(135deg,#fff 0,#f9f4e8 100%); }
.banner::after { content: ''; position: absolute; right: -25px; bottom: -40px; width: 105px; height: 105px; border: 18px solid rgba(200,164,93,.12); border-radius: 50%; }
.banner-tag {
  position: absolute; right: 12px; top: 12px; font-size: 11px; color: #999;
  background: #f3f5f9; border-radius: 10px; padding: 2px 8px;
}
.banner-title { font-size: 15px; font-weight: 600; padding-right: 70px; }
.banner-sub { margin: 6px 0 12px; color: #8a8f99; font-size: 12px; }
.product-list { margin-top: 12px; padding: 4px 12px; }
.product-skeleton { min-height:224px; }.skeleton-prod-row { justify-content:flex-start;min-height:72px; }.skeleton-icon { width:38px;height:38px;flex:0 0 38px;border-radius:12px; }.skeleton-copy { flex:1;min-width:0;margin-left:10px; }.skeleton-name { width:58%;height:12px; }.skeleton-sub { width:78%;height:8px;margin-top:8px; }.skeleton-action { width:70px;height:30px;flex:0 0 70px;margin-left:10px;border-radius:10px; }
.prod-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid #f0f2f5;
}
.prod-row:last-child { border-bottom: none; }
.prod-left { display: flex; gap: 10px; align-items: center; flex: 1; min-width: 0; }
.prod-icon {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;
}
.prod-name { font-size: 15px; font-weight: 600; }
.prod-actions { display: flex; flex: 0 0 auto; gap: 7px; }.prod-actions .pill-btn { max-width: 92px; overflow: hidden; text-overflow: ellipsis; }
.account-row .prod-left { gap: 8px; }.account-row .prod-icon { width: 38px; height: 38px; }.account-row .prod-name { font-size: 14px; white-space: nowrap; }.account-row .prod-actions { gap: 6px; }.account-row .prod-actions .pill-btn { height: 33px; padding: 0 10px; font-size: 10px; }
.prod-rate { text-align: right; margin-left: 8px; }
.prod-rate .rate { font-size: 20px; color: #00a870; }
.tiny { font-size: 11px; }
.mini-tag {
  margin-left: 6px; font-size: 10px; color: #00a870; background: #e8f8f0;
  border-radius: 4px; padding: 1px 4px; font-weight: 500;
}
.muted { color: #8a8f99; font-size: 12px; margin-top: 2px; }
</style>
