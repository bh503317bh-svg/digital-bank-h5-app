<template>
  <div class="page rights">
    <div class="wb-blue-bar head">
      <div class="title-row">
        <div>
          <div class="title">{{ t('rights.title') }}</div>
          <div class="sub">{{ t('rights.sub') }}</div>
        </div>
      </div>
    </div>
    <div class="grid">
      <div v-for="item in items" :key="item.title" class="wb-card item" @click="$router.push(item.to)">
        <div class="icon"><FeatureIcon :name="item.art" /></div>
        <div class="t">{{ item.title }}</div>
        <div class="d">{{ item.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FeatureIcon from '../components/FeatureIcon.vue'

const { t, locale } = useI18n()

const items = computed(() => {
  locale.value
  return [
    { art: 'benefits', title: t('rights.benefit'), desc: t('rights.benefitDesc'), to: '/newbie' },
    { art: 'wealth', title: t('rights.newbie'), desc: t('rights.newbieDesc'), to: '/newbie' },
    { art: 'invite', title: t('rights.invite'), desc: t('rights.inviteDesc'), to: '/invite' },
    { art: 'points', title: t('rights.points'), desc: t('rights.pointsDesc'), to: '/points' }
  ]
})
</script>

<style scoped>
.head { padding: 20px 16px 28px; }
.title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.title { font-size: 24px; font-weight: 800; }
.sub { margin-top: 6px; opacity: .9; font-size: 13px; }
.grid {
  margin-top: -12px; padding: 0 12px 20px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.item { padding: 16px; min-height: 120px; }
.icon {
  width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center; font-weight: 700;
}
.t { margin-top: 8px; font-weight: 700; }
.d { margin-top: 4px; font-size: 12px; color: #8a8f99; }
</style>
