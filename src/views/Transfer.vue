<template>
  <div class="page no-tab tout">
    <van-nav-bar :title="t('transfer.outTitle')" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="orders-o" size="18" style="margin-right:12px" @click="$router.push('/transactions')" />
        <van-icon name="service-o" size="18" @click="toastHelp" />
      </template>
    </van-nav-bar>

    <div class="hero">
      <div class="hero-icon" aria-hidden="true" />
      <div class="hero-title" @click="goForm('wire')">{{ t('transfer.hubWire') }}</div>
      <div class="hero-sub">
        <button type="button" @click="goForm('phone')">{{ t('transfer.hubPhone') }}</button>
        <span class="sep" />
        <button type="button" @click="go('/schedule')">{{ t('transfer.hubSched') }}</button>
      </div>
    </div>

    <div class="menu">
      <div class="menu-item" @click="goForm('self')">
        <div class="mi-ico orange" aria-hidden="true"><van-icon name="user-o" /></div>
        <div class="mi-body">
          <div class="mi-title">{{ t('transfer.toSelf') }}</div>
          <div class="mi-sub">{{ t('transfer.toSelfSub', { n: acctCount }) }}</div>
        </div>
        <van-icon name="arrow" color="#c8c9cc" />
      </div>
      <div class="menu-item" @click="goForm('other')">
        <div class="mi-ico orange" aria-hidden="true"><van-icon name="friends-o" /></div>
        <div class="mi-body">
          <div class="mi-title">{{ t('transfer.toOther') }}</div>
          <div class="mi-sub">{{ t('transfer.toOtherSub') }}</div>
        </div>
        <van-icon name="arrow" color="#c8c9cc" />
      </div>
      <div class="menu-item" @click="go('/payees')">
        <div class="mi-ico blue" aria-hidden="true"><van-icon name="contact" /></div>
        <div class="mi-body">
          <div class="mi-title">{{ t('desk.payeesLink') }}</div>
          <div class="mi-sub">{{ t('desk.title_payees') }}</div>
        </div>
        <van-icon name="arrow" color="#c8c9cc" />
      </div>
      <div class="menu-item" @click="go('/batch')">
        <div class="mi-ico blue" aria-hidden="true"><van-icon name="cluster-o" /></div>
        <div class="mi-body">
          <div class="mi-title">{{ t('desk.batchLink') }}</div>
          <div class="mi-sub">{{ t('desk.batchHint') }}</div>
        </div>
        <van-icon name="arrow" color="#c8c9cc" />
      </div>
      <div class="menu-item" @click="go('/orders')">
        <div class="mi-ico orange" aria-hidden="true"><van-icon name="todo-list-o" /></div>
        <div class="mi-body">
          <div class="mi-title">{{ t('desk.statusLink') }}</div>
          <div class="mi-sub">{{ t('desk.limitHint') }}</div>
        </div>
        <van-icon name="arrow" color="#c8c9cc" />
      </div>
      <div class="menu-item" @click="goForm('card')">
        <div class="mi-ico blue" aria-hidden="true"><van-icon name="credit-pay" /></div>
        <div class="mi-body">
          <div class="mi-title">{{ t('transfer.toCard') }}</div>
          <div class="mi-sub">{{ t('transfer.toCardSub') }}</div>
        </div>
        <van-icon name="arrow" color="#c8c9cc" />
      </div>
    </div>

    <button type="button" class="help" @click="toastHelp">{{ t('transfer.help') }}</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchHome } from '../api'

const { t } = useI18n()
const router = useRouter()
const acctCount = ref(1)

function go(path) { router.push(path) }
function goForm(mode) {
  router.push({ path: '/transfer/form', query: { mode } })
}

function toastHelp() {
  showToast(t('transfer.helpBody'))
}

onMounted(async () => {
  const res = await fetchHome()
  if (res.code === 0) {
    acctCount.value = Math.max(1, (res.data?.accounts || []).length)
  }
})
</script>

<style scoped>
:deep(.van-nav-bar) { background: #0052d9; }
:deep(.van-nav-bar__title),
:deep(.van-nav-bar .van-icon) { color: #fff !important; }
.tout { background: #f5f6f8; min-height: 100vh; }
.hero {
  background: #fff; margin: 12px 16px; border-radius: 12px;
  padding: 28px 16px 20px; text-align: center;
}
.hero-icon {
  width: 56px; height: 40px; margin: 0 auto;
  border-radius: 6px; background: linear-gradient(135deg, #0052d9, #3d7eff);
  box-shadow: 0 6px 14px rgba(0, 82, 217, 0.28);
  position: relative;
}
.hero-icon::after {
  content: ''; position: absolute; left: 8px; right: 8px; bottom: 10px;
  height: 3px; border-radius: 2px; background: rgba(255,255,255,.55);
}
.hero-title {
  margin-top: 12px; font-size: 17px; font-weight: 700; color: #0052d9;
}
.hero-sub {
  margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 16px;
}
.hero-sub button {
  border: 0; background: transparent; color: #666; font-size: 13px;
}
.sep { width: 1px; height: 12px; background: #e5e6eb; }
.menu {
  margin: 12px 16px; background: #fff; border-radius: 12px; overflow: hidden;
}
.menu-item {
  display: flex; align-items: center; gap: 12px;
  padding: 16px; border-bottom: 1px solid #f0f1f3;
}
.menu-item:last-child { border-bottom: 0; }
.mi-ico {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.mi-ico.orange { background: #fff3e8; }
.mi-ico.blue { background: #e8f1ff; color: #0052d9; font-weight: 700; }
.mi-body { flex: 1; }
.mi-title { font-size: 15px; font-weight: 600; color: #222; }
.mi-sub { margin-top: 4px; font-size: 12px; color: #8a8f99; }
.help {
  display: block; margin: 28px auto 0; border: 0; background: transparent;
  color: #0052d9; font-size: 14px;
}
</style>
