<template>
  <div class="login-page">
    <div class="hero">
      <div class="logo"><van-icon name="balance-o" /></div>
      <div class="name">{{ t('common.brand') }}</div>
      <div class="sub">{{ t('login.sub') }}</div>
    </div>
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field v-model="mobile" name="mobile" :label="t('login.mobile')" placeholder="13800000001" />
        <van-field v-model="password" type="password" name="password" :label="t('login.password')" placeholder="Passw0rd!" />
        <van-field v-if="needOtp" v-model="otp" :label="t('desk.otp')" :placeholder="otpHint" />
      </van-cell-group>
      <div style="margin: 24px 16px">
        <van-button round block type="primary" native-type="submit" color="#123b6d">{{ t('login.submit') }}</van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import { login } from '../api'
import { useAuthStore } from '../stores/auth'
import { currentOtp, pushLoginAlert, twoFaOn } from '../services/desk'

const { t } = useI18n()
const mobile = ref('13800000001')
const password = ref('Passw0rd!')
const otp = ref('')
const needOtp = twoFaOn()
const otpHint = `${currentOtp()} · ${t('desk.otpHint')}`
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

async function onSubmit() {
  if (needOtp && otp.value !== currentOtp()) {
    showFailToast(t('desk.otpBad'))
    return
  }
  const res = await login(mobile.value, password.value)
  if (res.code !== 0) {
    showFailToast(res.message || t('login.fail'))
    return
  }
  auth.setSession(res.data.access_token, res.data)
  pushLoginAlert()
  showSuccessToast(t('login.ok'))
  const q = {}
  if (route.query.lan) q.lan = route.query.lan
  if (route.query.lang) q.lang = route.query.lang
  router.replace({ path: '/', query: q })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 80% 4%, rgba(200,164,93,.30), transparent 26%),
    linear-gradient(180deg, #0b3159 0, #174f87 34%, #edf2f7 34.2%, #f5f7f9 100%);
  padding: 48px 0 24px;
}
.hero { text-align: center; margin-bottom: 36px; color: #fff; }
.logo {
  width: 64px; height: 64px; margin: 0 auto 12px;
  border: 1px solid rgba(255,255,255,.35); border-radius: 50%; background: rgba(255,255,255,.12); color: #ead29d;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700;
}
.name { font-size: 26px; font-weight: 700; color: #fff; letter-spacing: .5px; }
.sub { margin-top: 8px; color: rgba(255,255,255,.72); font-size: 13px; }
:deep(.van-cell-group--inset) { box-shadow: 0 18px 45px rgba(11,49,89,.14); border-radius: 18px; overflow: hidden; }
</style>
