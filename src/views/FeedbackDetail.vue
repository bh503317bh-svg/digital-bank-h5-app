<template>
  <div class="page no-tab feedback-detail">
    <van-nav-bar :title="t('feedback.detailTitle')" left-arrow @click-left="$router.back()" />

    <div v-if="!loading && item" class="detail-wrap">
      <div class="wb-card block">
        <div class="row">
          <span>{{ t('feedback.subject') }}</span>
          <b>{{ item.subject }}</b>
        </div>
        <div class="row">
          <span>{{ t('feedback.category') }}</span>
          <b>{{ catLabel(item.case_type) }}</b>
        </div>
        <div class="row">
          <span>{{ t('feedback.statusField') }}</span>
          <b class="status">{{ statusLabel(item.status) }}</b>
        </div>
        <div class="row">
          <span>{{ t('feedback.caseId') }}</span>
          <b>{{ item.case_id }}</b>
        </div>
        <div class="row">
          <span>{{ t('feedback.createdAt') }}</span>
          <b>{{ dateText(item.created_at) }}</b>
        </div>
        <div class="row" v-if="item.updated_at && item.updated_at !== item.created_at">
          <span>{{ t('feedback.updatedAt') }}</span>
          <b>{{ dateText(item.updated_at) }}</b>
        </div>
      </div>

      <div class="wb-card block">
        <div class="h">{{ t('feedback.description') }}</div>
        <div class="desc">{{ item.description || '-' }}</div>
      </div>

      <div class="wb-card block">
        <div class="h">{{ t('feedback.notes') }}</div>
        <div v-if="!item.notes || !item.notes.length" class="empty">{{ t('feedback.noNotes') }}</div>
        <div v-else>
          <div v-for="n in item.notes" :key="n.note_id" class="note">
            <div class="n-body">{{ n.body }}</div>
            <div class="n-time">{{ dateText(n.created_at) }} · #{{ n.author_user_id }}</div>
          </div>
        </div>
      </div>

      <van-button block round color="#123b6d" style="margin:20px 0" @click="router.push('/feedback/list')">
        {{ t('feedback.backToList') }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { fetchFeedback } from '../api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const item = ref(null)
const loading = ref(true)

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
    const res = await fetchFeedback(route.params.id)
    if (res.code !== 0 || !res.data) {
      showFailToast(res.message || t('feedback.failText'))
      return
    }
    item.value = res.data
  } catch {
    showFailToast(t('feedback.failText'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.feedback-detail { min-height: 100vh; background: #f4f6fa; }
.detail-wrap { padding: 12px; }
.block { padding: 6px 14px; }
.row { display: flex; justify-content: space-between; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f2f4f7; font-size: 13px; }
.row:last-child { border-bottom: 0; }
.row span { color: #8a8f99; flex-shrink: 0; }
.row b { font-weight: 600; text-align: right; word-break: break-all; }
.status { color: #123b6d; }
.h { padding: 10px 0 4px; font-weight: 700; font-size: 14px; }
.desc { padding: 4px 0 12px; color: #333; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.empty { padding: 10px 0 14px; color: #999; font-size: 13px; }
.note { padding: 10px 0; border-bottom: 1px solid #f2f4f7; }
.note:last-child { border-bottom: 0; }
.n-body { font-size: 13px; color: #333; line-height: 1.6; white-space: pre-wrap; }
.n-time { margin-top: 5px; color: #999; font-size: 11px; }
</style>
