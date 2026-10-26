<template>
  <div class="page mine">
    <div class="wb-blue-bar head">
      <div class="top">
        <div class="avatar" @click="showProfile = true">{{ avatar }}</div>
        <div class="info" @click="showProfile = true">
          <div class="name">{{ displayName }} <van-icon name="edit" size="14" /></div>
          <div class="mobile">{{ mobile }}</div>
          <div class="kyc" @click.stop="go('/kyc')">
            <span class="badge">KYC · {{ kycLabel }}</span>
            <span v-if="customerId" class="cid">ID {{ customerId }}</span>
          </div>
        </div>
      </div>
      <div class="stats">
        <div class="stat" @click="go('/transactions')">
          <div class="v">{{ money(usdTotal, { hide }) }}</div>
          <div class="k">{{ t('mine.totalAssets') }}</div>
        </div>
        <div class="stat" @click="go('/points')">
          <div class="v">{{ points }}</div>
          <div class="k">{{ t('mine.points') }}</div>
        </div>
        <div class="stat" @click="go('/cards')">
          <div class="v">{{ accountCount }}</div>
          <div class="k">{{ t('mine.accounts') }}</div>
        </div>
        <div class="eye" @click="hide = !hide">
          <van-icon :name="hide ? 'closed-eye' : 'eye-o'" size="18" />
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="kyc-entry" @click="go('/kyc')">
        <div class="kyc-ico"><van-icon name="contact" size="22" /></div>
        <div class="kyc-copy">
          <div class="kyc-t">KYC</div>
          <div class="kyc-s">{{ kycLabel }}</div>
        </div>
        <van-icon name="arrow" color="#8a8f99" />
      </div>
      <div class="wb-card shortcuts">
        <div v-for="q in shortcuts" :key="q.to" class="sc" @click="go(q.to)">
          <div class="sci"><van-icon :name="q.icon" size="20" /></div>
          <div>{{ q.label }}</div>
        </div>
      </div>

      <div class="section-hd">
        <span>{{ t('mine.myAccounts') }}</span>
        <span class="more" @click="go('/transactions')">{{ t('home.viewTxn') }} ></span>
      </div>
      <div class="wb-card acc-list">
        <div v-if="!accounts.length" class="empty">{{ t('transfer.noAccount') }}</div>
        <div v-for="a in accounts" :key="a.account_no" class="acc" @click="goTxn(a)">
          <div>
            <div class="ano">{{ a.currency || 'USD' }} · {{ ccyName(a.currency) }}</div>
            <div class="muted">{{ maskAccount(a.account_no) }}</div>
          </div>
          <div class="abal">{{ money(a.balance, { hide, currency: a.currency || 'USD' }) }}</div>
        </div>
      </div>

      <div class="section-hd"><span>{{ t('mine.services') }}</span></div>
      <van-cell-group inset>
        <van-cell :title="t('desk.title_kyc')" :label="kycLabel" is-link @click="go('/kyc')" />
        <van-cell :title="t('desk.title_holdings')" is-link @click="go('/holdings')" />
        <van-cell :title="t('desk.title_fx')" is-link @click="go('/fx')" />
        <van-cell :title="t('desk.title_pay')" is-link @click="go('/pay')" />
        <van-cell :title="t('desk.title_bills')" is-link @click="go('/bills')" />
        <van-cell :title="t('loans.entry')" :label="t('mine.loansDesc')" is-link @click="go('/loans')" />
        <van-cell :title="t('points.title')" :label="t('mine.pointsDesc')" is-link :value="String(points)" @click="go('/points')" />
        <van-cell :title="t('cards.title')" :label="t('mine.cardsDesc')" is-link @click="go('/cards')" />
        <van-cell :title="t('rights.invite')" :label="t('mine.inviteDesc')" is-link @click="go('/invite')" />
      </van-cell-group>

      <div class="section-hd"><span>{{ t('mine.settings') }}</span></div>
      <van-cell-group inset>
        <van-cell :title="t('mine.security')" :label="t('mine.securityDesc')" is-link @click="go('/security')" />
        <van-cell :title="t('mine.notify')" :label="t('mine.notifyDesc')" is-link :value="unreadText" @click="go('/notices')" />
        <van-cell :title="t('mine.profile')" :label="t('mine.profileDesc')" is-link @click="showProfile = true" />
        <van-cell :title="t('mine.about')" is-link @click="showAbout = true" />
      </van-cell-group>

      <div style="margin:20px 4px 8px">
        <van-button round block type="danger" plain @click="logout">{{ t('mine.logout') }}</van-button>
      </div>
    </div>

    <van-dialog v-model:show="showAbout" :title="t('mine.about')" :confirm-button-text="t('common.confirm')">
      <div class="about">
        <p>{{ t('mine.aboutBody') }}</p>
        <p class="muted">{{ t('mine.version') }}: 0.2.0 · Demo</p>
      </div>
    </van-dialog>

    <van-action-sheet v-model:show="showProfile" :title="t('mine.profile')">
      <div class="profile-sheet">
        <van-field v-model="editName" :label="t('mine.displayName')" :placeholder="t('mine.namePh')" maxlength="32" />
        <van-field :model-value="mobile" :label="t('login.mobile')" readonly />
        <van-field :model-value="kycLabel" :label="t('mine.kyc')" readonly />
        <van-button block round color="#0052d9" style="margin-top:12px" @click="saveProfile">
          {{ t('mine.saveProfile') }}
        </van-button>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { fetchHome } from '../api'
import { openResult } from '../utils/result'
import { useAuthStore } from '../stores/auth'
import { money, maskAccount } from '../utils'
import { getNotices, getPoints, pushNotice } from '../utils/local'
import { getKyc, sumUsd } from '../services/desk'

const { t, locale } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const showAbout = ref(false)
const showProfile = ref(false)
const hide = ref(false)
const points = ref(0)
const unread = ref(0)
const totalBalance = ref('0.00')
const accounts = ref([])
const customer = ref(null)
const editName = ref('')

const displayName = computed(() => auth.user?.display_name || t('mine.guest'))
const mobile = computed(() => auth.user?.mobile || '-')
const avatar = computed(() => String(displayName.value || 'U').slice(0, 1).toUpperCase())
const unreadText = computed(() => (unread.value > 0 ? String(unread.value) : ''))
const accountCount = computed(() => accounts.value.length)
const usdTotal = computed(() => sumUsd(accounts.value).toFixed(2))

function ccyName(code) {
  const key = `home.ccy_${code || 'USD'}`
  const text = t(key)
  return text === key ? (code || 'USD') : text
}
function goTxn(account) {
  router.push({ path: '/transactions', query: { no: account.account_no } })
}
const customerId = computed(() => customer.value?.customer_id || customer.value?.id || '')
const kycLabel = computed(() => {
  if (getKyc().status === 'verified') return t('desk.kycOk')
  if (getKyc().status === 'pending') return t('mine.kycPending')
  const s = (customer.value?.kyc_status || customer.value?.status || 'verified').toString().toLowerCase()
  if (s.includes('pend')) return t('mine.kycPending')
  if (s.includes('reject')) return t('mine.kycReject')
  return t('mine.kycOk')
})

const shortcuts = computed(() => {
  locale.value
  return [
    { icon: 'orders-o', label: t('home.quickTxn'), to: '/transactions' },
    { icon: 'credit-pay', label: t('home.quickCards'), to: '/cards' },
    { icon: 'gift-o', label: t('tab.rights'), to: '/rights' },
    { icon: 'points', label: t('points.title'), to: '/points' },
    { icon: 'fire-o', label: t('home.quickNewbie'), to: '/newbie' },
    { icon: 'friends-o', label: t('home.quickInvite'), to: '/invite' },
    { icon: 'balance-list-o', label: t('loans.entry'), to: '/loans' },
    { icon: 'shield-o', label: t('mine.security'), to: '/security' }
  ]
})

function go(path) {
  router.push(path)
}

function logout() {
  auth.logout()
  router.replace('/login')
}

function saveProfile() {
  const name = (editName.value || '').trim()
  if (!name) {
    showToast(t('mine.namePh'))
    return
  }
  auth.setSession(auth.token, {
    ...(auth.user || {}),
    display_name: name,
    mobile: auth.user?.mobile,
    user_id: auth.user?.user_id,
    role: auth.user?.role
  })
  pushNotice(t('mine.profile'), t('mine.profileSaved'))
  showProfile.value = false
  openResult(router, {
    kind: 'profile',
    note: t('result.note_profile'),
    title: t('mine.profileSaved'),
    back: '/mine',
    rows: [
      { label: t('mine.profile'), value: name },
      { label: t('security.maskMobile'), value: auth.user?.mobile || '-' }
    ]
  })
}

async function load() {
  points.value = getPoints()
  unread.value = getNotices().filter((n) => n && !n.read).length
  editName.value = auth.user?.display_name || ''
  const res = await fetchHome()
  if (res.code !== 0) return
  totalBalance.value = res.data?.total_balance || '0.00'
  accounts.value = res.data?.accounts || []
  customer.value = res.data?.customer || null
  if (res.data?.user?.display_name && !auth.user?.display_name) {
    auth.setSession(auth.token, { ...auth.user, ...res.data.user })
  }
}

onMounted(load)
</script>

<style scoped>
.mine { padding-bottom: 70px; }
.head { padding: 20px 16px 28px; }
.top { display: flex; align-items: flex-start; gap: 12px; }
.avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(255,255,255,.22); display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 700; flex-shrink: 0;
}
.info { flex: 1; min-width: 0; }
.name { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.mobile { margin-top: 4px; opacity: .9; font-size: 13px; }
.kyc { margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.badge {
  font-size: 11px; background: rgba(255,255,255,.2); border-radius: 10px; padding: 2px 8px;
}
.cid { font-size: 11px; opacity: .8; }
.stats {
  margin-top: 18px; display: grid; grid-template-columns: 1.4fr 1fr 1fr auto;
  gap: 8px; align-items: end; position: relative;
}
.stat .v { font-size: 18px; font-weight: 800; }
.stat .k { margin-top: 4px; font-size: 11px; opacity: .85; }
.eye { padding: 4px 0 0 4px; opacity: .9; }

.panel { margin-top: -16px; padding: 0 12px 20px; }
.kyc-entry {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 12px; padding: 14px;
  margin-bottom: 12px; box-shadow: 0 6px 16px rgba(16, 24, 40, .06);
}
.kyc-ico {
  width: 40px; height: 40px; border-radius: 12px; background: #e8f1ff; color: #0052d9;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kyc-copy { flex: 1; min-width: 0; text-align: left; }
.kyc-t { font-weight: 800; font-size: 16px; }
.kyc-s { margin-top: 2px; color: #8a8f99; font-size: 12px; }
.shortcuts {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 0;
  padding: 14px 6px; text-align: center; font-size: 11px; color: #555;
}
.sc { padding: 8px 0; }
.sci {
  width: 40px; height: 40px; margin: 0 auto 6px; border-radius: 12px;
  background: #e8f1ff; color: #0052d9; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px;
}
.section-hd { padding: 16px 4px 8px; }
.acc-list { padding: 4px 14px; }
.acc {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid #f0f2f5;
}
.acc:last-child { border-bottom: none; }
.ano { font-weight: 700; font-size: 14px; }
.abal { font-weight: 700; color: #0052d9; }
.muted { color: #8a8f99; font-size: 12px; margin-top: 2px; }
.empty { padding: 20px; text-align: center; color: #999; font-size: 13px; }
.about { padding: 16px; font-size: 14px; line-height: 1.6; color: #333; }
.profile-sheet { padding: 8px 16px 28px; }
:deep(.van-cell-group--inset) { margin: 0; }
</style>
