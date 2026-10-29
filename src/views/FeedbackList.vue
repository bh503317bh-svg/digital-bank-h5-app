<template>
  <div class="page no-tab feedback-list">
    <van-nav-bar :title="t('feedback.listTitle')" left-arrow @click-left="$router.back()" />

    <div class="list-wrap">
      <div v-if="!loading && !items.length" class="empty">{{ t('feedback.empty') }}</div>
      <van-cell-group v-else inset>
        <van-cell
          v-for="item in items"
          :key="item.case_id"
          :title="item.subject"
          :label="`${catLabel(item.case_type)} · ${statusLabel(item.status)}`"
          :value="dateText(item.created_at)"
          is-link
          @click="router.push(`/feedback/${item.case_id}`)"
        />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { listMyFeedback } from '../api'

const { t } = useI18n()
const router = useRouter()
const items = ref([])
const loading = ref(true)

const list = computed(() => items.value.filter((x) => x && String(x.case_type).startsWith('FEEDBACK_')))

function catLabel(caseType) {
  const sub = String(caseType || '').slice(-2)
  return t(`feedback.cat_${sub}`)
}

function statusLabel(status) {
  return t(`feedback.status_${status}`)
}

function dateText(iso) {
  if (!iso) return ''
  return String(iso).replace('T', ' ').slice(0, 16)
}

onMounted(async () => {
  try {
    const res = await listMyFeedback()
    if (res.code !== 0) { showFailToast(res.message || t('feedback.failText')) }
    else items.value = res.data || []
  } catch {
    showFailToast(t('feedback.failText'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.feedback-list { min-height: 100vh; background: #f4f6fa; }
.list-wrap { padding: 12px; }
.empty { padding: 60px 0; text-align: center; color: #999; font-size: 14px; }
:deep(.van-cell-group--inset) { margin: 0; }
</style>
