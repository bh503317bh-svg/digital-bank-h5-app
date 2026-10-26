<template>
  <div class="assistant-dock" :class="{ listening, running, expanded: panelOpen }" :style="dockStyle">
    <Transition name="assistant-panel">
      <section v-if="panelOpen" class="assistant-panel">
        <template v-if="phase === 'confirm'">
          <div class="assistant-head">
            <span class="mini-orb"><img :src="assistantIcon" alt="" /></span>
            <div><strong>{{ t('assistant.orderReady') }}</strong><small>{{ t('assistant.reviewBefore') }}</small></div>
            <button type="button" :aria-label="t('common.cancel')" @click="reset">×</button>
          </div>
          <div class="order-card">
            <div class="gold-mark">Au</div>
            <div><strong>{{ t('assistant.goldName') }}</strong><small>GLD · USD</small></div>
            <b>USD 100.00</b>
          </div>
          <label class="assistant-check"><input v-model="productTerms" type="checkbox" /><span>{{ t('assistant.productTerms') }}</span></label>
          <label class="assistant-check"><input v-model="riskTerms" type="checkbox" /><span>{{ t('assistant.riskTerms') }}</span></label>
          <p v-if="confirmError" class="assistant-error"><van-icon name="warning-o" /> {{ t('assistant.confirmBoth') }}</p>
          <button type="button" class="continue-btn" @click="continueOrder">{{ t('assistant.confirmContinue') }}</button>
        </template>

        <template v-else>
          <div v-if="listening" class="voice-state">
            <div class="voice-bars"><i v-for="n in 7" :key="n" /></div>
            <div><strong>{{ t('assistant.listening') }}</strong><small>{{ interimText || t('assistant.releaseToSend') }}</small></div>
          </div>
          <div v-else class="composer">
            <input ref="inputEl" v-model="message" :placeholder="t('assistant.placeholder')" enterkeyhint="send" @keyup.enter="submit" />
            <button type="button" :disabled="!message.trim()" :aria-label="t('assistant.send')" @click="submit"><van-icon name="guide-o" /></button>
          </div>
          <div v-if="hint" class="assistant-hint">{{ hint }}</div>
          <button v-if="!listening" type="button" class="quick-command" @click="useGoldCommand">{{ t('assistant.goldCommand') }}</button>
        </template>
      </section>
    </Transition>

    <button
      class="assistant-orb"
      type="button"
      :aria-label="t('assistant.title')"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="cancelPress"
      @contextmenu.prevent
    >
      <span v-if="listening" class="pulse p1" /><span v-if="listening" class="pulse p2" />
      <img :src="assistantIcon" alt="" />
      <span v-if="listening" class="live-dot" />
    </button>
    <span v-if="!panelOpen && !running" class="hold-tip">{{ t('assistant.holdToTalk') }}</span>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import assistantIcon from '../assets/icons/aku-assistant.png'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const panelOpen = ref(false)
const phase = ref('compose')
const message = ref('')
const hint = ref('')
const listening = ref(false)
const running = ref(false)
const interimText = ref('')
const productTerms = ref(false)
const riskTerms = ref(false)
const confirmError = ref(false)
const inputEl = ref(null)
let pressTimer
let longPressed = false
let recognition

const dockStyle = computed(() => {
  const hasBottomAction = ['/wealth/detail', '/wealth/buy'].includes(route.path)
  return { bottom: route.meta.tab || hasBottomAction ? 'calc(76px + env(safe-area-inset-bottom))' : 'calc(18px + env(safe-area-inset-bottom))' }
})

function openComposer() {
  phase.value = 'compose'
  panelOpen.value = true
  hint.value = ''
  nextTick(() => inputEl.value?.focus())
}

function onPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  longPressed = false
  pressTimer = window.setTimeout(() => {
    longPressed = true
    startListening()
  }, 420)
}

function onPointerUp() {
  window.clearTimeout(pressTimer)
  if (longPressed) {
    stopListening()
    return
  }
  panelOpen.value ? reset() : openComposer()
}

function cancelPress() {
  window.clearTimeout(pressTimer)
  if (listening.value) stopListening()
}

function startListening() {
  phase.value = 'compose'
  panelOpen.value = true
  listening.value = true
  hint.value = ''
  interimText.value = ''
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    listening.value = false
    hint.value = t('assistant.voiceUnsupported')
    return
  }
  recognition = new SpeechRecognition()
  recognition.lang = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  recognition.interimResults = true
  recognition.continuous = true
  recognition.onresult = (event) => {
    let text = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) text += event.results[i][0].transcript
    interimText.value = text.trim()
    message.value = interimText.value
  }
  recognition.onerror = () => {
    listening.value = false
    hint.value = t('assistant.voiceError')
  }
  recognition.onend = () => {
    listening.value = false
    if (message.value.trim()) submit()
  }
  try { recognition.start() } catch { listening.value = false }
}

function stopListening() {
  listening.value = false
  try { recognition?.stop() } catch { /* recognition already stopped */ }
}

function useGoldCommand() {
  message.value = t('assistant.goldCommand')
  submit()
}

function submit() {
  const text = message.value.trim()
  if (!text) return
  const isGold = /黄金|gold|gld/i.test(text)
  const isHundred = /100|一百|百美金|百美元/i.test(text)
  if (!isGold || !isHundred) {
    hint.value = t('assistant.onlyGold')
    return
  }
  message.value = ''
  phase.value = 'confirm'
  panelOpen.value = true
  productTerms.value = false
  riskTerms.value = false
  confirmError.value = false
  router.push({ path: '/wealth/detail', query: { id: 'f7', name: t('assistant.goldName'), rate: '31.20%', assistant: 'gold', amount: '100' } })
}

function continueOrder() {
  if (!productTerms.value || !riskTerms.value) {
    confirmError.value = true
    return
  }
  confirmError.value = false
  panelOpen.value = false
  running.value = true
  window.setTimeout(() => {
    router.push({ path: '/wealth/buy', query: { id: 'f7', name: t('assistant.goldName'), rate: '31.20%', amount: '100', assistant: 'gold', terms: 'accepted', autoReview: '1' } })
    running.value = false
    phase.value = 'compose'
  }, 420)
}

function reset() {
  panelOpen.value = false
  phase.value = 'compose'
  hint.value = ''
  confirmError.value = false
  stopListening()
}

onBeforeUnmount(() => {
  window.clearTimeout(pressTimer)
  try { recognition?.abort() } catch { /* no-op */ }
})
</script>

<style scoped>
.assistant-dock { position: fixed; z-index: 50; right: max(14px,calc((100vw - 480px)/2 + 14px)); display: flex; align-items: flex-end; gap: 10px; pointer-events: none; }
.assistant-orb { position: relative; width: 58px; height: 58px; flex: 0 0 58px; border: 0; border-radius: 50%; padding: 2px; background: linear-gradient(145deg,#f2d28e,#9f7332); box-shadow: 0 10px 26px rgba(10,44,81,.28),0 0 0 4px rgba(255,255,255,.88); pointer-events: auto; touch-action: none; transition: transform .22s ease,filter .22s ease; }
.assistant-orb:active { transform: scale(.92); }.assistant-orb img { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }.assistant-dock.running .assistant-orb { animation: assistant-run 1.2s ease-in-out infinite; filter: saturate(.7); }
.pulse { position: absolute; z-index: -1; inset: -5px; border: 2px solid rgba(56,142,222,.55); border-radius: 50%; animation: voice-pulse 1.35s ease-out infinite; }.pulse.p2 { animation-delay: .55s; }.live-dot { position: absolute; right: 2px; bottom: 3px; width: 10px; height: 10px; border: 2px solid #fff; border-radius: 50%; background: #23b679; }
.hold-tip { position: absolute; right: 3px; bottom: -18px; width: max-content; color: #6f7d8e; font-size: 8px; font-weight: 650; text-shadow: 0 1px 2px #fff; pointer-events: none; }
.assistant-panel { width: min(316px,calc(100vw - 92px)); border: 1px solid rgba(203,215,227,.92); border-radius: 18px; padding: 13px; background: rgba(255,255,255,.98); box-shadow: 0 18px 45px rgba(9,39,72,.2); backdrop-filter: blur(16px); pointer-events: auto; }
.composer { display: flex; align-items: center; gap: 8px; }.composer input { min-width: 0; height: 42px; flex: 1; border: 1px solid #dfe6ed; border-radius: 12px; outline: 0; padding: 0 12px; background: #f7f9fb; color: #142033; font: inherit; font-size: 12px; }.composer input:focus { border-color: #2c659b; box-shadow: 0 0 0 3px rgba(44,101,155,.1); }.composer button { display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 12px; background: #123b6d; color: #fff; font-size: 19px; }.composer button:disabled { opacity: .4; }
.quick-command { width: 100%; margin-top: 9px; border: 0; border-radius: 10px; padding: 9px 10px; background: #edf3f8; color: #174574; font-size: 10px; font-weight: 700; text-align: left; }.assistant-hint,.assistant-error { margin: 8px 2px 0; color: #a64141; font-size: 10px; line-height: 1.4; }
.assistant-head { display: grid; grid-template-columns: 34px 1fr 24px; gap: 8px; align-items: center; }.assistant-head strong,.assistant-head small { display: block; }.assistant-head strong { color: #142033; font-size: 13px; }.assistant-head small { margin-top: 3px; color: #7f8b9a; font-size: 9px; }.assistant-head button { border: 0; background: transparent; color: #8994a1; font-size: 20px; }.mini-orb { width: 32px; height: 32px; }.mini-orb img { width: 100%; height: 100%; border-radius: 50%; }
.order-card { display: grid; grid-template-columns: 38px 1fr auto; gap: 9px; align-items: center; margin: 12px 0 9px; padding: 10px; border-radius: 12px; background: linear-gradient(135deg,#f4f7fa,#fbf7ed); }.gold-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 11px; background: linear-gradient(145deg,#e5c26f,#a97a2d); color: #fff; font-size: 13px; font-weight: 800; }.order-card strong,.order-card small { display: block; }.order-card strong { font-size: 11px; }.order-card small { margin-top: 3px; color: #85909f; font-size: 9px; }.order-card>b { color: #123b6d; font-size: 11px; }
.assistant-check { display: flex; align-items: flex-start; gap: 8px; padding: 7px 3px; color: #536174; font-size: 10px; line-height: 1.35; }.assistant-check input { width: 15px; height: 15px; flex: 0 0 auto; accent-color: #123b6d; }.continue-btn { width: 100%; margin-top: 8px; border: 0; border-radius: 12px; padding: 11px; background: #123b6d; color: #fff; font-size: 11px; font-weight: 750; }
.voice-state { display: flex; align-items: center; gap: 12px; min-height: 46px; }.voice-state strong,.voice-state small { display: block; }.voice-state strong { color: #123b6d; font-size: 12px; }.voice-state small { max-width: 175px; margin-top: 4px; overflow: hidden; color: #7c8998; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }.voice-bars { display: flex; align-items: center; gap: 2px; height: 34px; }.voice-bars i { width: 3px; height: 10px; border-radius: 4px; background: linear-gradient(#2b81c2,#c69e51); animation: voice-bar .8s ease-in-out infinite alternate; }.voice-bars i:nth-child(2),.voice-bars i:nth-child(6){animation-delay:.15s}.voice-bars i:nth-child(3),.voice-bars i:nth-child(5){animation-delay:.3s}.voice-bars i:nth-child(4){animation-delay:.45s}
.assistant-panel-enter-active,.assistant-panel-leave-active { transition: opacity .2s ease,transform .24s cubic-bezier(.2,.8,.2,1); }.assistant-panel-enter-from,.assistant-panel-leave-to { opacity: 0; transform: translateX(18px) scale(.94); }
@keyframes voice-pulse { from{opacity:.8;transform:scale(.9)} to{opacity:0;transform:scale(1.45)} } @keyframes voice-bar { from{height:8px} to{height:30px} } @keyframes assistant-run { 0%,100%{transform:scale(.92);opacity:.72} 50%{transform:scale(1);opacity:1} }
@media (max-width:360px){.assistant-panel{width:calc(100vw - 86px);padding:11px}.order-card>b{font-size:10px}}
</style>
