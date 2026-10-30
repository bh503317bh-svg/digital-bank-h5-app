<template>
  <router-view />
  <AssistantWidget />
  <van-tabbar v-if="showTab" route safe-area-inset-bottom active-color="#123b6d" inactive-color="#8793a4">
    <van-tabbar-item v-for="item in tabs" :key="item.key" replace :to="item.to">
      <template #icon>
        <span class="nav-icon" :class="{ active: activeTab === item.key }">
          <img v-if="item.avatar" :src="avatarUrl" alt="" />
          <FeatureIcon v-else :name="item.art" />
        </span>
      </template>
      <span class="nav-label">{{ item.label }}</span>
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AssistantWidget from './components/AssistantWidget.vue'
import FeatureIcon from './components/FeatureIcon.vue'
import { useAuthStore } from './stores/auth'
import { avatarFor } from './profile'

const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()
const showTab = computed(() => !!route.meta.tab)
const activeTab = computed(() => route.meta.tab || '')
const avatarUrl = computed(() => avatarFor(auth.user))
const tabs = computed(() => [
  { key: 'account', to: '/', art: 'card', label: t('tab.account') },
  { key: 'wealth', to: '/wealth', art: 'wealth', label: t('tab.wealth') },
  { key: 'funds', to: '/funds', art: 'funds', label: t('tab.funds') },
  { key: 'rights', to: '/rights', art: 'benefits', label: t('tab.rights') },
  { key: 'mine', to: '/mine', avatar: true, label: t('tab.mine') }
])
</script>

<style scoped>
.nav-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 30px;
  padding: 1px 3px;
  border-radius: 11px;
  filter: grayscale(.55) saturate(.62);
  opacity: .67;
  transition: transform .18s ease, filter .18s ease, opacity .18s ease, background .18s ease;
}
.nav-icon.active {
  background: linear-gradient(135deg, rgba(18,59,109,.1), rgba(200,164,93,.15));
  filter: none;
  opacity: 1;
  transform: translateY(-2px) scale(1.08);
}
.nav-icon img { width: 25px; height: 25px; border-radius: 50%; object-fit: cover; }
.nav-icon.active img { box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(200,164,93,.72); }
.nav-label { display: block; margin-top: 2px; font-size: 11px; font-weight: 560; white-space: nowrap; }
</style>
