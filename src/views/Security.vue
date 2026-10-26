<template>
  <div class="page no-tab">
    <van-nav-bar :title="t('security.title')" left-arrow @click-left="$router.back()" />

    <div class="wb-card summary">
      <div class="score">{{ score }}</div>
      <div class="label">{{ t('security.score') }}</div>
      <div class="tip">{{ t('security.scoreTip') }}</div>
    </div>

    <van-cell-group inset style="margin-top:12px">
      <van-cell :title="t('security.device')" :label="device" />
      <van-cell :title="t('security.loginAt')" :value="loginAt" />
      <van-cell :title="t('security.maskMobile')" :value="maskMobile" />
      <van-cell :title="t('security.session')" :value="sessionLeft" />
    </van-cell-group>

    <div class="section-hd"><span>{{ t('security.controls') }}</span></div>
    <van-cell-group inset>
      <van-cell :title="t('desk.faceTitle')" :label="faceLabel" is-link @click="showFace = true" />
      <van-cell :title="t('security.biometric')" :label="t('security.biometricDesc')">
        <template #right-icon>
          <van-switch v-model="biometric" size="20px" active-color="#0052d9" @change="onBio" />
        </template>
      </van-cell>
      <van-cell :title="t('desk.twoFa')" :label="otpLabel">
        <template #right-icon>
          <van-switch v-model="twoFa" size="20px" active-color="#0052d9" @change="onTwoFa" />
        </template>
      </van-cell>
      <van-cell :title="t('security.loginAlert')" :label="t('security.loginAlertDesc')">
        <template #right-icon>
          <van-switch v-model="loginAlert" size="20px" active-color="#0052d9" @change="onAlert" />
        </template>
      </van-cell>
      <van-cell :title="t('security.changePwd')" is-link @click="onPwd" />
      <van-cell :title="t('payPwd.setTitle')" :label="t('payPwd.setDesc')" is-link @click="showPaySet = true" />
      <van-cell :title="t('security.devices')" :value="String(devices.length)" is-link @click="showDevices = true" />
    </van-cell-group>

    <div style="margin:24px 16px">
      <van-button round block type="primary" color="#0052d9" @click="onLock">{{ t('security.lock') }}</van-button>
    </div>

    <FaceScan v-model:show="showFace" @done="onFace" />

    <van-action-sheet v-model:show="showDevices" :title="t('security.devices')">
      <div class="dev-list">
        <div v-for="d in devices" :key="d.id" class="dev">
          <div>
            <div class="dn">{{ d.name }}</div>
            <div class="muted">{{ d.at }} · {{ d.place }}</div>
          </div>
          <van-tag v-if="d.current" type="primary">{{ t('security.current') }}</van-tag>
        </div>
      </div>
    </van-action-sheet>

    <van-action-sheet v-model:show="showPaySet" :title="t('payPwd.setTitle')">
      <div class="pay-set">
        <van-field v-model="loginPwd" type="password" :label="t('login.password')" :placeholder="t('payPwd.loginPh')" />
        <van-field v-model="newPayPwd" type="password" :label="t('payPwd.new')" :placeholder="t('payPwd.ph')" maxlength="12" />
        <van-button block round color="#0052d9" style="margin-top:12px" @click="savePayPwd">{{ t('mine.saveProfile') }}</van-button>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast, showToast } from 'vant'
import { setPayPassword } from '../api'
import { useAuthStore } from '../stores/auth'
import { loadJson, pushNotice, saveJson } from '../utils/local'
import { currentOtp, faceVerified, markFaceVerified, setTwoFa, twoFaOn } from '../services/desk'
import { openResult } from '../utils/result'
import FaceScan from '../components/FaceScan.vue'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const showDevices = ref(false)
const showPaySet = ref(false)
const loginPwd = ref('')
const newPayPwd = ref('')
const biometric = ref(!!loadJson('sec_bio', false))
const twoFa = ref(twoFaOn())
const showFace = ref(false)
const faceOk = ref(faceVerified())
const faceLabel = computed(() => faceOk.value ? t('desk.facePassed') : t('desk.faceDemo'))
const otpLabel = computed(() => twoFa.value ? `${currentOtp()} · ${t('desk.otpHint')}` : t('desk.otpHint'))
const loginAlert = ref(loadJson('sec_alert', true) !== false)

const device = computed(() => {
  const ua = navigator.userAgent
  if (/iPhone|iPad/i.test(ua)) return 'iOS Safari'
  if (/Android/i.test(ua)) return 'Android Chrome'
  return (ua.slice(0, 36) || 'Web') + (ua.length > 36 ? '…' : '')
})
const loginAt = computed(() => new Date().toLocaleString())
const maskMobile = computed(() => {
  const m = auth.user?.mobile || ''
  return m ? m.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '-'
})
const sessionLeft = computed(() => t('security.sessionVal'))
const score = computed(() => {
  let s = 60
  if (auth.user?.mobile) s += 15
  if (biometric.value) s += 15
  if (loginAlert.value) s += 10
  if (faceOk.value) s += 10
  return Math.min(100, s)
})

const devices = computed(() => [
  { id: '1', name: device.value, at: loginAt.value, place: 'US-East', current: true },
  { id: '2', name: 'MacBook Chrome', at: '2026-10-18 21:10', place: 'US-West', current: false },
  { id: '3', name: 'iPhone App', at: '2026-10-15 09:02', place: 'US-East', current: false }
])

function onFace() {
  markFaceVerified()
  faceOk.value = true
  pushNotice(t('desk.faceTitle'), t('desk.facePassed'))
  openResult(router, {
    kind: 'security',
    note: t('desk.faceLocal'),
    title: t('desk.facePassed'),
    back: '/security',
    rows: [
      { label: t('desk.faceTitle'), value: t('result.bizDone') },
      { label: t('security.score'), value: String(Math.min(100, score.value)) }
    ]
  })
}
function onTwoFa(v) {
  setTwoFa(!!v)
  showToast(v ? t('security.bioOn') : t('security.bioOff'))
}
function onBio(v) {
  saveJson('sec_bio', !!v)
  showToast(v ? t('security.bioOn') : t('security.bioOff'))
}
function onAlert(v) {
  saveJson('sec_alert', !!v)
  showToast(v ? t('security.alertOn') : t('security.alertOff'))
}
async function onPwd() {
  try {
    await showConfirmDialog({
      title: t('security.changePwd'),
      message: t('security.changePwdMsg'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    return
  }
  pushNotice(t('security.changePwd'), t('security.changePwdOk'))
  openResult(router, {
    kind: 'security',
    note: t('result.note_security'),
    title: t('security.changePwdOk'),
    back: '/security',
    rows: [
      { label: t('security.changePwd'), value: t('result.bizDone') },
      { label: t('security.device'), value: device.value }
    ]
  })
}

async function savePayPwd() {
  if (!loginPwd.value || (newPayPwd.value || '').length < 4) {
    showFailToast(t('payPwd.need'))
    return
  }
  const res = await setPayPassword(loginPwd.value, newPayPwd.value)
  if (res.code !== 0) {
    openResult(router, {
      kind: 'security',
      note: t('result.note_security'),
      ok: false,
      title: t('payPwd.setFail'),
      reason: res.message || t('payPwd.setFail'),
      back: '/security',
      rows: [{ label: t('payPwd.setTitle'), value: t('result.failStatus') }]
    })
    return
  }
  showPaySet.value = false
  openResult(router, {
    kind: 'security',
    note: t('result.note_security'),
    title: t('payPwd.setOk'),
    back: '/security',
    rows: [
      { label: t('payPwd.setTitle'), value: t('result.bizDone') },
      { label: t('security.maskMobile'), value: maskMobile.value }
    ]
  })
  loginPwd.value = ''
  newPayPwd.value = ''
  pushNotice(t('payPwd.setTitle'), t('payPwd.setOk'))
}

async function onLock() {
  try {
    await showConfirmDialog({
      title: t('security.lock'),
      message: t('security.lockMsg'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    return
  }
  pushNotice(t('security.lock'), t('security.lockDone'))
  showSuccessToast(t('security.lockDone'))
  auth.logout()
  router.replace('/login')
}
</script>

<style scoped>
:deep(.van-nav-bar) { background: #0052d9; }
:deep(.van-nav-bar__title), :deep(.van-nav-bar .van-icon) { color: #fff !important; }
.summary {
  margin: 12px; padding: 20px; text-align: center;
}
.score { font-size: 40px; font-weight: 800; color: #0052d9; }
.label { margin-top: 4px; font-weight: 700; }
.tip { margin-top: 6px; font-size: 12px; color: #8a8f99; }
.section-hd { padding: 16px 20px 8px; font-weight: 700; }
.pay-set { padding: 8px 16px 28px; }
.dev-list { padding: 8px 16px 28px; max-height: 50vh; overflow: auto; }
.dev {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid #f0f2f5;
}
.dn { font-weight: 700; }
.muted { margin-top: 4px; font-size: 12px; color: #8a8f99; }
</style>
