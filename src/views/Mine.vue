<template>
  <div class="page mine">
    <div class="wb-blue-bar head">
      <div class="top">
        <div class="avatar" @click="showProfile = true"><img :src="avatarUrl" :alt="displayName" /></div>
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
          <div class="v"><MoneyAmount :value="usdTotal" :hide="hide" currency="USD" size="md" /></div>
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
        <div class="kyc-ico"><FeatureIcon name="security" /></div>
        <div class="kyc-copy">
          <div class="kyc-title-row">
            <div class="kyc-t">{{ t('mine.kyc') }}</div>
            <span class="kyc-status"><i />{{ kycLabel }}</span>
          </div>
          <div class="kyc-s">KYC · {{ customerId ? `ID ${customerId}` : t('mine.premierMember') }}</div>
        </div>
        <span class="kyc-arrow"><van-icon name="arrow" /></span>
      </div>
      <div class="wb-card shortcuts">
        <div v-for="q in shortcuts" :key="q.to" class="sc" @click="go(q.to)">
          <div class="sci"><FeatureIcon :name="q.art" /></div>
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
          <div class="abal"><MoneyAmount :value="a.balance" :hide="hide" :currency="a.currency || 'USD'" size="sm" /></div>
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
        <p class="muted">{{ t('mine.version') }}: 0.2.0</p>
      </div>
    </van-dialog>

    <van-action-sheet v-model:show="showProfile" :title="t('mine.profile')">
      <div class="profile-sheet">
        <div class="profile-avatar"><img :src="avatarUrl" :alt="displayName" /><div><strong>{{ displayName }}</strong><span>{{ t('mine.premierMember') }}</span></div></div>
        <van-field v-model="editName" :label="t('mine.displayName')" :placeholder="t('mine.namePh')" maxlength="32" />
        <van-field :model-value="mobile" :label="t('login.mobile')" readonly />
        <van-field :model-value="kycLabel" :label="t('mine.kyc')" readonly />
        <van-button block round color="#123b6d" style="margin-top:12px" @click="saveProfile">
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
import { avatarFor, displayNameFor } from '../profile'
import FeatureIcon from '../components/FeatureIcon.vue'
import MoneyAmount from '../components/MoneyAmount.vue'

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

const displayName = computed(() => displayNameFor(auth.user))
const mobile = computed(() => auth.user?.mobile || '-')
const avatarUrl = computed(() => avatarFor(auth.user))
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
    { art: 'transactions', label: t('home.quickTxn'), to: '/transactions' },
    { art: 'card', label: t('home.quickCards'), to: '/cards' },
    { art: 'benefits', label: t('tab.rights'), to: '/rights' },
    { art: 'points', label: t('points.title'), to: '/points' },
    { art: 'wealth', label: t('home.quickNewbie'), to: '/newbie' },
    { art: 'invite', label: t('home.quickInvite'), to: '/invite' },
    { art: 'loans', label: t('loans.entry'), to: '/loans' },
    { art: 'security', label: t('mine.security'), to: '/security' }
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
  editName.value = displayNameFor(auth.user)
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
  overflow: hidden; font-size: 22px; font-weight: 700; flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.info { flex: 1; min-width: 0; }
.name { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.mobile { margin-top: 4px; opacity: .9; font-size: 13px; }
.kyc { margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.badge {
  font-size: 11px; background: rgba(255,255,255,.2); border-radius: 10px; padding: 2px 8px;
}
.cid { font-size: 11px; opacity: .8; }
.profile-avatar { display: flex; align-items: center; gap: 12px; margin: 0 16px 10px; padding: 13px; border-radius: 13px; background: #f2f6f9; }.profile-avatar img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; }.profile-avatar strong,.profile-avatar span { display: block; }.profile-avatar strong { color: #142033; }.profile-avatar span { margin-top: 4px; color: #9b7a3f; font-size: 10px; }
.stats {
  margin-top: 18px; display: grid; grid-template-columns: 1.4fr 1fr 1fr auto;
  gap: 8px; align-items: end; position: relative;
}
.stat .v { font-size: 18px; font-weight: 800; }
.stat .k { margin-top: 4px; font-size: 11px; opacity: .85; }
.eye { padding: 4px 0 0 4px; opacity: .9; }

.panel { margin-top: -16px; padding: 0 12px 20px; }
.kyc-entry {
  position: relative; display: flex; align-items: center; gap: 12px; overflow: hidden;
  background: linear-gradient(120deg,#fff 0,#fff 62%,#f8f3e9 100%); border: 1px solid rgba(18,59,109,.07); border-radius: 16px; padding: 13px 14px;
  margin-bottom: 12px; box-shadow: 0 8px 24px rgba(15,39,68,.08);
}
.kyc-entry::after { content: ''; position: absolute; right: -22px; bottom: -34px; width: 80px; height: 80px; border: 13px solid rgba(200,164,93,.08); border-radius: 50%; pointer-events: none; }
.kyc-ico {
  width: 52px; height: 52px; padding: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kyc-copy { flex: 1; min-width: 0; text-align: left; }
.kyc-title-row { display: flex; align-items: center; min-width: 0; gap: 8px; }
.kyc-t { min-width: 0; overflow: hidden; color: #142033; font-weight: 750; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.kyc-status { display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto; padding: 3px 7px; border-radius: 10px; background: #e9f7f1; color: #16805c; font-size: 9px; font-weight: 700; }
.kyc-status i { width: 5px; height: 5px; border-radius: 50%; background: #20a875; box-shadow: 0 0 0 3px rgba(32,168,117,.12); }
.kyc-s { margin-top: 5px; overflow: hidden; color: #7c8998; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.kyc-arrow { position: relative; z-index: 1; display: grid; place-items: center; width: 27px; height: 27px; flex: 0 0 27px; border: 1px solid #e2e8ee; border-radius: 50%; background: rgba(255,255,255,.8); color: #7b8796; }
.shortcuts {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 0;
  padding: 14px 6px; text-align: center; font-size: 11px; color: #555;
}
.sc { padding: 8px 0; }
.sci {
  width: 46px; height: 46px; margin: 0 auto 5px; padding: 2px;
  display: flex; align-items: center; justify-content: center;
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
.abal { font-weight: 700; color: #123b6d; }
.muted { color: #8a8f99; font-size: 12px; margin-top: 2px; }
.empty { padding: 20px; text-align: center; color: #999; font-size: 13px; }
.about { padding: 16px; font-size: 14px; line-height: 1.6; color: #333; }
.profile-sheet { padding: 8px 16px 28px; }
:deep(.van-cell-group--inset) { margin: 0; }
</style>
