<template>
  <div class="page no-tab invite">
    <van-nav-bar :title="t('common.brand')" left-arrow @click-left="$router.back()" />
    <div class="hero">
      <div class="bubble"><van-icon name="friends-o" size="28" /></div>
      <div class="friend">{{ t('invite.friend') }}</div>
      <div class="headline">{{ t('invite.headline1') }}<br />{{ t('invite.headline2') }}</div>
    </div>

    <div class="scroll-card">
      <div v-for="f in features" :key="f.title" class="feat">
        <div class="fi"><van-icon :name="f.icon" size="20" /></div>
        <div>
          <div class="ft">{{ f.title }}</div>
          <div class="fs">{{ f.sub }}</div>
        </div>
      </div>
      <div class="brand">{{ t('invite.brand') }}</div>
      <div class="slogan">{{ t('invite.slogan') }}</div>
    </div>

    <div class="safe-bottom-btn">
      <van-button block round class="invite-btn" @click="invite">
        {{ t('invite.cta') }}
      </van-button>
      <div class="hint">{{ t('invite.copyHint') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { showSuccessToast } from 'vant'

const { t, locale } = useI18n()

const features = computed(() => {
  locale.value
  return [
    { icon: 'coupon-o', title: t('invite.f1t'), sub: t('invite.f1s') },
    { icon: 'card', title: t('invite.f2t'), sub: t('invite.f2s') },
    { icon: 'gift-o', title: t('invite.f3t'), sub: t('invite.f3s') },
    { icon: 'cash-back-record', title: t('invite.f4t'), sub: t('invite.f4s') }
  ]
})

async function invite() {
  const link = `${location.origin}/login?ref=${encodeURIComponent('aku-friend')}`
  try {
    await navigator.clipboard.writeText(link)
    showSuccessToast(t('invite.copied'))
  } catch {
    showSuccessToast(link)
  }
}
</script>

<style scoped>
.invite { background: linear-gradient(180deg, #9fd0ff 0%, #eaf6ff 40%, #f3f5f9 100%); }
:deep(.van-nav-bar) { background: transparent; }
.hero { text-align: center; padding: 8px 20px 0; }
.bubble {
  width: 56px; height: 56px; margin: 0 auto; border-radius: 50%;
  background: #fff; color: #123b6d; font-weight: 800; font-size: 24px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(0,82,217,.15);
}
.friend { margin-top: 10px; color: #4b5563; font-size: 13px; }
.headline {
  margin-top: 10px; font-size: 22px; font-weight: 800; color: #0b56e0; line-height: 1.35;
}
.scroll-card {
  margin: 18px 16px 90px; background: #fff; border-radius: 18px; padding: 18px 16px;
  box-shadow: 0 10px 28px rgba(11,86,224,.12);
}
.feat { display: flex; gap: 12px; margin-bottom: 16px; }
.fi {
  width: 36px; height: 36px; border-radius: 10px; background: #e8f1ff; color: #123b6d;
  display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;
}
.ft { font-weight: 700; font-size: 14px; }
.fs { margin-top: 4px; color: #8a8f99; font-size: 12px; }
.brand { text-align: center; margin-top: 8px; font-weight: 700; color: #123b6d; }
.slogan { text-align: center; margin-top: 4px; font-size: 12px; color: #8a8f99; }
.hint { text-align: center; margin-top: 8px; font-size: 12px; color: #666; }
.invite-btn {
  background: linear-gradient(90deg, #ff9f43, #ff6b6b) !important;
  border: none !important;
  color: #fff !important;
}
</style>
