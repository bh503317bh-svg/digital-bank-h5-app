<template>
  <div class="page account-page">
    <div class="wb-blue-bar top">
      <div class="user-row">
        <div class="avatar">{{ avatarText }}</div>
        <div class="uname">{{ displayName }}</div>
        <van-icon name="search" size="20" style="margin-left:auto" @click="go('/funds')" />
        <van-icon name="plus" size="20" style="margin-left:10px" @click="go('/cards')" />
      </div>
      <div class="quick">
        <div v-for="q in quicks" :key="q.label" class="q-item" @click="go(q.to)">
          <div class="q-icon"><van-icon :name="q.icon" size="22" /></div>
          <div>{{ q.label }}</div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="asset-card wb-card">
        <div class="asset-hd">
          <span>{{ t('home.totalAssets') }}</span>
          <van-icon :name="hide ? 'closed-eye' : 'eye-o'" @click="hide = !hide" />
        </div>
        <div class="asset-num">{{ money(usdTotal, { hide }) }}</div>
        <div class="asset-sub" @click="go('/transactions')">
          <span>{{ t('home.usdEq') }} · {{ t('home.accCount') }} {{ hide ? '****' : accountCount }}</span>
          <span>{{ t('home.viewTxn') }} ›</span>
        </div>
        <div v-if="accounts.length" class="ccy-list">
          <div v-for="a in accounts" :key="a.account_no" class="ccy-row" @click="goTxn(a)">
            <div>
              <div class="ccy-code">{{ a.currency || 'USD' }} · {{ ccyName(a.currency) }}</div>
              <div class="muted">{{ maskAccount(a.account_no) }}</div>
            </div>
            <div class="ccy-bal">{{ money(a.balance, { hide, currency: a.currency || 'USD' }) }}</div>
          </div>
        </div>
      </div>

      <div class="banner wb-card" @click="go('/newbie')">
        <div class="banner-tag">{{ t('home.bannerTag') }}</div>
        <div class="banner-title">{{ t('home.bannerTitle') }}</div>
        <div class="banner-sub">{{ t('home.bannerSub') }}</div>
        <button class="pill-btn solid">{{ t('home.claim') }}</button>
      </div>

      <div class="product-list wb-card">
        <div class="prod-row">
          <div class="prod-left">
            <div class="prod-icon blue"><van-icon name="credit-pay" size="20" /></div>
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
            <div class="prod-icon" :style="{ background: p.color }">
              <van-icon :name="p.vanIcon || 'gold-coin-o'" size="20" />
            </div>
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
import { maskAccount, money } from '../utils'
import { sumUsd } from '../services/desk'

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
    { label: t('home.quickTxn'), icon: 'orders-o', to: '/transactions' },
    { label: t('home.quickCards'), icon: 'credit-pay', to: '/cards' },
    { label: t('home.quickBenefits'), icon: 'gift-o', to: '/rights' },
    { label: t('home.quickNewbie'), icon: 'fire-o', to: '/newbie' },
    { label: t('home.quickInvite'), icon: 'friends-o', to: '/invite' }
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
const displayName = computed(
  () => home.value?.user?.display_name || auth.user?.display_name || auth.user?.mobile || 'User'
)
const avatarText = computed(() => String(displayName.value || 'U').slice(0, 1))

function go(path) { router.push(path) }
function goTxn(account) {
  router.push({ path: '/transactions', query: { no: account.account_no } })
}
function goBuy(p) {
  router.push({
    path: '/wealth/buy',
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
        if (i === retries) showToast(res.message || t('home.loadFail'))
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
.top { padding: 12px 16px 56px; }
.user-row { display: flex; align-items: center; gap: 8px; }
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center;
  font-weight: 700;
}
.uname { flex: 1; font-size: 16px; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.quick {
  margin-top: 18px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;
  text-align: center; font-size: 11px;
}
.q-icon {
  width: 44px; height: 44px; margin: 0 auto 6px; border-radius: 14px;
  background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.panel { margin-top: -36px; padding: 0 12px 20px; }
.asset-card { padding: 16px; }
.asset-hd { display: flex; justify-content: space-between; color: #666; font-size: 13px; }
.asset-num { margin-top: 8px; font-size: 32px; font-weight: 700; letter-spacing: .5px; }
.asset-sub {
  margin-top: 12px; display: flex; justify-content: space-between;
  color: #8a8f99; font-size: 12px;
}
.ccy-list { margin-top: 12px; border-top: 1px solid #f0f2f5; }
.ccy-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid #f6f7f9;
}
.ccy-row:last-child { border-bottom: none; }
.ccy-code { font-size: 14px; font-weight: 700; color: #1f2329; }
.ccy-bal { font-weight: 700; color: #0052d9; font-size: 14px; }
.banner { margin-top: 12px; padding: 16px; position: relative; }
.banner-tag {
  position: absolute; right: 12px; top: 12px; font-size: 11px; color: #999;
  background: #f3f5f9; border-radius: 10px; padding: 2px 8px;
}
.banner-title { font-size: 15px; font-weight: 600; padding-right: 70px; }
.banner-sub { margin: 6px 0 12px; color: #8a8f99; font-size: 12px; }
.product-list { margin-top: 12px; padding: 4px 12px; }
.prod-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid #f0f2f5;
}
.prod-row:last-child { border-bottom: none; }
.prod-left { display: flex; gap: 10px; align-items: center; flex: 1; min-width: 0; }
.prod-icon {
  width: 40px; height: 40px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;
}
.prod-icon.blue { background: #0052d9; }
.prod-name { font-size: 15px; font-weight: 600; }
.prod-actions { display: flex; gap: 8px; }
.prod-rate { text-align: right; margin-left: 8px; }
.prod-rate .rate { font-size: 20px; color: #00a870; }
.tiny { font-size: 11px; }
.mini-tag {
  margin-left: 6px; font-size: 10px; color: #00a870; background: #e8f8f0;
  border-radius: 4px; padding: 1px 4px; font-weight: 500;
}
.muted { color: #8a8f99; font-size: 12px; margin-top: 2px; }
</style>
