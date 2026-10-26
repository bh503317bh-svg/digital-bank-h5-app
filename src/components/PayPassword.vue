<template>
  <van-dialog
    v-model:show="visible"
    :title="t('payPwd.title')"
    show-cancel-button
    :confirm-button-text="t('common.confirm')"
    :cancel-button-text="t('common.cancel')"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <div class="box">
      <div class="tip">{{ t('payPwd.tip') }}</div>
      <van-field
        v-model="pin"
        type="password"
        maxlength="12"
        :placeholder="t('payPwd.ph')"
        autofocus
      />
    </div>
  </van-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'

const { t } = useI18n()
const visible = ref(false)
const pin = ref('')
let resolver = null

function ask() {
  pin.value = ''
  visible.value = true
  return new Promise((resolve) => {
    resolver = resolve
  })
}

function finish(value) {
  const r = resolver
  resolver = null
  visible.value = false
  if (r) r(value)
}

function onConfirm() {
  const v = (pin.value || '').trim()
  if (v.length < 4) {
    showFailToast(t('payPwd.need'))
    // keep dialog open by re-asking
    setTimeout(() => {
      visible.value = true
    }, 50)
    return
  }
  finish(v)
}

function onCancel() {
  finish(null)
}

defineExpose({ ask })
</script>

<style scoped>
.box { padding: 12px 16px 8px; }
.tip { font-size: 13px; color: #8a8f99; margin-bottom: 8px; line-height: 1.4; }
</style>
