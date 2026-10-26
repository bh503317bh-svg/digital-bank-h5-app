<template>
  <router-view />
  <van-tabbar v-if="showTab" route safe-area-inset-bottom active-color="#0052d9" inactive-color="#8a8f99">
    <van-tabbar-item replace to="/" icon="balance-list-o">{{ t('tab.account') }}</van-tabbar-item>
    <van-tabbar-item replace to="/wealth" icon="gold-coin-o">{{ t('tab.wealth') }}</van-tabbar-item>
    <van-tabbar-item replace to="/funds" icon="chart-trending-o">{{ t('tab.funds') }}</van-tabbar-item>
    <van-tabbar-item replace to="/rights" icon="gift-o">{{ t('tab.rights') }}</van-tabbar-item>
    <van-tabbar-item replace to="/mine" icon="user-o">{{ t('tab.mine') }}</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()
const showTab = computed(() => !!route.meta.tab)
</script>
