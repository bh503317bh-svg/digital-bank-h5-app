<template>
  <van-popup v-model:show="open" position="bottom" round :style="{ height: '82%' }" @closed="stop">
    <div class="face">
      <div class="title">{{ t('desk.faceTitle') }}</div>
      <div class="sub">{{ t('desk.faceLocal') }}</div>
      <div class="stage">
        <div class="oval">
          <video v-show="ready" ref="videoRef" autoplay playsinline muted />
          <div v-if="!ready" class="wait">{{ camText }}</div>
          <div v-if="ready && !done" class="scan" />
        </div>
      </div>
      <div class="step">{{ stepText }}</div>
      <van-button v-if="done" block round color="#123b6d" @click="finish">{{ t('desk.faceDone') }}</van-button>
      <van-button v-else-if="denied" block round color="#123b6d" @click="askCamera">{{ t('desk.faceRetry') }}</van-button>
      <van-button v-else block round plain color="#123b6d" @click="open = false">{{ t('common.cancel') }}</van-button>
    </div>
  </van-popup>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const open = defineModel('show', { type: Boolean, default: false })
const emit = defineEmits(['done'])
const { t } = useI18n()

const STEPS = ['desk.faceLook', 'desk.faceBlink', 'desk.faceTurn', 'desk.facePass']
const idx = ref(0)
const done = ref(false)
const ready = ref(false)
const denied = ref(false)
const videoRef = ref(null)
let timer = 0
let stream = null

const stepText = computed(() => {
  if (denied.value) return t('desk.faceDenied')
  if (!ready.value) return t('desk.faceAsking')
  return t(STEPS[idx.value] || STEPS[0])
})
const camText = computed(() => (denied.value ? t('desk.faceDenied') : t('desk.faceAsking')))

function stopSteps() {
  if (timer) clearInterval(timer)
  timer = 0
}

function stopCamera() {
  stopSteps()
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
    stream = null
  }
  if (videoRef.value) videoRef.value.srcObject = null
  ready.value = false
}

function startSteps() {
  stopSteps()
  idx.value = 0
  done.value = false
  timer = setInterval(() => {
    if (idx.value >= STEPS.length - 1) {
      done.value = true
      stopSteps()
      return
    }
    idx.value += 1
  }, 900)
}

async function askCamera() {
  denied.value = false
  done.value = false
  idx.value = 0
  if (!navigator.mediaDevices?.getUserMedia) {
    denied.value = true
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user' }
    })
    ready.value = true
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play().catch(() => {})
    }
    startSteps()
  } catch {
    denied.value = true
    ready.value = false
  }
}

function stop() {
  stopCamera()
}

function finish() {
  stopCamera()
  open.value = false
  emit('done')
}

watch(open, (v) => {
  if (v) askCamera()
  else stopCamera()
})

onBeforeUnmount(stopCamera)
</script>

<style scoped>
.face { padding: 20px 20px 28px; text-align: center; }
.title { font-size: 18px; font-weight: 700; }
.sub { margin-top: 6px; color: #8a8f99; font-size: 12px; }
.stage { display: flex; justify-content: center; margin: 22px 0; }
.oval {
  width: 180px; height: 230px; border-radius: 90px;
  border: 3px solid #123b6d; position: relative; overflow: hidden;
  background: #111820;
}
.oval video {
  width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);
}
.scan {
  position: absolute; left: 0; right: 0; height: 28px; pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(0, 82, 217, .55), transparent);
  animation: sweep 1.4s linear infinite;
}
.wait {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  padding: 16px; color: #d6e4ff; font-size: 13px;
}
.step { min-height: 24px; margin-bottom: 16px; font-weight: 600; color: #123b6d; }
@keyframes sweep {
  0% { top: -20px; }
  100% { top: 220px; }
}
</style>
