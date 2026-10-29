<template>
  <div class="page no-tab feedback">
    <van-nav-bar :title="t('feedback.title')" left-arrow @click-left="$router.back()" />

    <div class="wb-card intro">
      <div class="i-title">{{ t('feedback.subtitle') }}</div>
    </div>

    <van-cell-group inset style="margin-top:12px">
      <van-field
        :model-value="category ? t(`feedback.cat_${category.slice(-2)}`) : ''"
        is-link
        readonly
        :label="t('feedback.category')"
        :placeholder="t('feedback.categoryPh')"
        @click="showCategory = true"
      />
      <van-field
        v-model="subject"
        maxlength="60"
        :label="t('feedback.subject')"
        :placeholder="t('feedback.subjectPh')"
      />
      <van-field
        v-model="description"
        type="textarea"
        rows="5"
        maxlength="1000"
        autosize
        show-word-limit
        :label="t('feedback.description')"
        :placeholder="t('feedback.descriptionPh')"
      />
    </van-cell-group>

    <div style="margin:26px 16px">
      <van-button round block type="primary" color="#123b6d" :loading="loading" :disabled="loading" @click="onSubmit">
        {{ t('feedback.submit') }}
      </van-button>
    </div>

    <van-action-sheet v-model:show="showCategory" :title="t('feedback.category')">
      <div class="cat-list">
        <button
          v-for="opt in categories"
          :key="opt.value"
          type="button"
          :class="['cat-row', { on: category === opt.value }]"
          @click="chooseCategory(opt.value)"
        >
          <span>{{ t(opt.labelKey) }}</span>
          <van-icon v-if="category === opt.value" name="success" color="#123b6d" />
        </button>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { submitFeedback } from '../api'
import { openResult } from '../utils/result'

const { t } = useI18n()
const router = useRouter()
const showCategory = ref(false)
const category = ref('')
const subject = ref('')
const description = ref('')
const loading = ref(false)

const categories = [
  { value: 'FEEDBACK_SUB_01', labelKey: 'feedback.cat_01' },
  { value: 'FEEDBACK_SUB_02', labelKey: 'feedback.cat_02' },
  { value: 'FEEDBACK_SUB_03', labelKey: 'feedback.cat_03' },
  { value: 'FEEDBACK_SUB_04', labelKey: 'feedback.cat_04' },
  { value: 'FEEDBACK_SUB_05', labelKey: 'feedback.cat_05' },
  { value: 'FEEDBACK_SUB_06', labelKey: 'feedback.cat_06' }
]

function chooseCategory(value) {
  category.value = value
  showCategory.value = false
}

async function onSubmit() {
  const subj = subject.value.trim()
  const desc = description.value.trim()
  if (!category.value) { showFailToast(t('feedback.needCategory')); return }
  if (!subj) { showFailToast(t('feedback.needSubject')); return }
  if (subj.length > 60) { showFailToast(t('feedback.lengthSubject')); return }
  if (!desc) { showFailToast(t('feedback.needDescription')); return }
  if (desc.length > 1000) { showFailToast(t('feedback.lengthDescription')); return }

  loading.value = true
  try {
    const res = await submitFeedback({
      case_type: category.value,
      subject: subj,
      description: desc
    })
    if (res.code !== 0 || !res.data) {
      showFailToast(res.message || t('feedback.failText'))
      return
    }
    openResult(router, {
      ok: true,
      kind: 'feedback',
      note: t('result.note_feedback'),
      title: t('feedback.ok'),
      subtitle: t('feedback.okSub'),
      ref: res.data.case_id,
      back: '/feedback/list',
      rows: [
        { label: t('feedback.category'), value: t(`feedback.cat_${category.value.slice(-2)}`) },
        { label: t('feedback.subject'), value: subj }
      ]
    })
  } catch {
    showFailToast(t('feedback.failText'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.feedback { min-height: 100vh; background: #f4f6fa; padding-bottom: 40px; }
.intro { margin: 12px 12px 0; }
.i-title { color: #5a6572; font-size: 13px; }
:deep(.van-cell-group--inset) { margin: 0; }
.cat-list { padding: 8px 16px 24px; }
.cat-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: 14px 4px; border-bottom: 1px solid #f0f2f5;
  background: transparent; color: #142033; font-size: 14px; text-align: left;
}
</style>
