<template>
  <div class="login-page">
    <div class="hero">
      <div class="logo">A</div>
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
        <van-button round block type="primary" native-type="submit" color="#0052d9">{{ t('login.submit') }}</van-button>
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
  background: linear-gradient(180deg, #dce9ff 0%, #f3f5f9 45%);
  padding: 48px 0 24px;
}
.hero { text-align: center; margin-bottom: 36px; }
.logo {
  width: 64px; height: 64px; margin: 0 auto 12px;
  border-radius: 20px; background: #0052d9; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700;
}
.name { font-size: 26px; font-weight: 700; color: #0052d9; }
.sub { margin-top: 8px; color: #8a8f99; font-size: 13px; }
</style>
