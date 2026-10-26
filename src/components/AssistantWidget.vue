<template>
  <div ref="dockEl" class="assistant-dock" :class="{ listening, running, expanded: panelOpen }" :style="dockStyle">
    <Transition name="assistant-panel">
      <section v-if="panelOpen" class="assistant-panel" :class="{ 'voice-panel': phase === 'voice', 'voice-recognized': phase === 'voice' && ['recognized', 'editing'].includes(voiceStage) }">
        <template v-if="phase === 'confirm'">
          <div class="assistant-head">
            <span class="mini-orb"><img :src="assistantIcon" alt="" /></span>
            <div><strong>{{ t('assistant.orderReady') }}</strong><small>{{ t('assistant.reviewBefore') }}</small></div>
            <button type="button" :aria-label="t('common.cancel')" @click="reset">×</button>
          </div>
          <div class="order-card">
            <div class="product-mark" :class="{ gold: selectedProduct.id === 'f7' }">{{ selectedProduct.mark }}</div>
            <div><strong>{{ selectedProductName }}</strong><small>{{ selectedProduct.ticker }} · USD</small></div>
            <b>{{ formattedAmount }}</b>
          </div>
          <label class="assistant-check"><input v-model="productTerms" type="checkbox" /><span>{{ t('assistant.productTerms') }}</span></label>
          <label class="assistant-check"><input v-model="riskTerms" type="checkbox" /><span>{{ t('assistant.riskTerms') }}</span></label>
          <p v-if="confirmError" class="assistant-error"><van-icon name="warning-o" /> {{ t('assistant.confirmBoth') }}</p>
          <button type="button" class="continue-btn" @click="continueOrder">{{ t('assistant.confirmContinue') }}</button>
        </template>

        <template v-else-if="phase === 'voice'">
          <div v-if="voiceStage === 'recognized'" class="recognized-state">
            <span class="recognized-dot" />
            <button type="button" class="recognized-text" @click="editRecognized"><strong>{{ t('assistant.recognized') }}</strong><small>{{ interimText }}</small></button>
            <button type="button" class="recognized-send" :aria-label="t('assistant.send')" @click="submit"><van-icon name="guide-o" /></button>
          </div>
          <div v-else-if="voiceStage === 'editing'" class="voice-edit">
            <input ref="inputEl" v-model="message" :aria-label="t('assistant.placeholder')" enterkeyhint="send" @keyup.enter="submit" />
            <button type="button" :disabled="!message.trim()" :aria-label="t('assistant.send')" @click="submit"><van-icon name="guide-o" /></button>
          </div>
          <div v-else-if="voiceStage === 'error'" class="recognized-state error">
            <span class="recognized-check"><van-icon name="replay" /></span>
            <div><strong>{{ t('assistant.voiceReady') }}</strong><small>{{ hint }}</small></div>
          </div>
          <div v-else class="voice-state">
            <span class="wave-dot" />
            <div class="voice-bars" :class="{ active: listening }"><i v-for="n in 15" :key="n" /></div>
            <span class="wave-dot" />
          </div>
          <small v-if="voiceStage === 'listening' && interimText" class="voice-transcript">{{ interimText }}</small>
        </template>

        <template v-else>
          <div class="compose-head">
            <span><img :src="assistantIcon" alt="" /></span>
            <div><strong>{{ t('assistant.title') }}</strong><small>{{ t('assistant.composeHelp') }}</small></div>
            <button type="button" :aria-label="t('common.cancel')" @click="reset">×</button>
          </div>
          <div class="quick-label">{{ t('assistant.quickActions') }}</div>
          <div class="quick-commands">
            <button type="button" @click="useCommand(t('assistant.qqqCommand'))"><b>QQQ</b><span>{{ t('assistant.qqqShortcut') }}</span></button>
            <button type="button" @click="useCommand(t('assistant.goldCommand'))"><b>GLD</b><span>{{ t('assistant.goldShortcut') }}</span></button>
          </div>
          <div class="composer">
            <input ref="inputEl" v-model="message" :placeholder="t('assistant.placeholder')" enterkeyhint="send" @keyup.enter="submit" />
            <button type="button" :disabled="!message.trim()" :aria-label="t('assistant.send')" @click="submit"><van-icon name="guide-o" /></button>
          </div>
          <div v-if="hint" class="assistant-hint">{{ hint }}</div>
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
      <span v-if="!listening && !running" class="idle-orbit"><i /></span>
      <span v-if="!listening && !running" class="idle-spark s1" />
      <span v-if="!listening && !running" class="idle-spark s2" />
      <img :src="assistantIcon" alt="" />
      <span v-if="listening" class="live-dot" />
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import assistantIcon from '../assets/icons/aku-assistant.png'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const PRODUCTS = [
  { id: 'f2', ticker: 'QQQ', mark: 'QQQ', nameKey: 'products.f2.name', rate: '18.20%', aliases: ['qqq', 'invesco qqq', 'nasdaq 100', 'nasdaq-100'] },
  { id: 'f7', ticker: 'GLD', mark: 'Au', nameKey: 'products.f7.name', rate: '31.20%', aliases: ['gold', 'gld', 'spdr gold'] },
  { id: 'f4', ticker: 'SPY', mark: 'SPY', nameKey: 'products.f4.name', rate: '22.10%', aliases: ['spy', 's&p 500', 's and p 500', 'sp500'] },
  { id: 'f10', ticker: 'VTI', mark: 'VTI', nameKey: 'products.f10.name', rate: '20.05%', aliases: ['vti', 'total stock market', 'total us market'] },
  { id: 'f1', ticker: 'IBB', mark: 'IBB', nameKey: 'products.f1.name', rate: '23.46%', aliases: ['ibb', 'biotech', 'biotechnology'] }
]
const DEMO_VOICE_COMMAND = 'Buy 200 US dollars worth of gold for me'
const panelOpen = ref(false)
const phase = ref('compose')
const message = ref('')
const hint = ref('')
const listening = ref(false)
const running = ref(false)
const interimText = ref('')
const voiceStage = ref('idle')
const productTerms = ref(false)
const riskTerms = ref(false)
const confirmError = ref(false)
const inputEl = ref(null)
const dockEl = ref(null)
const selectedProduct = ref(PRODUCTS[1])
const selectedAmount = ref(100)
let pressTimer
let longPressed = false
let recognition
let preserveOnNextRoute = false

const dockStyle = computed(() => {
  const hasBottomAction = ['/wealth/detail', '/wealth/buy'].includes(route.path)
  return { bottom: route.meta.tab || hasBottomAction ? 'calc(76px + env(safe-area-inset-bottom))' : 'calc(18px + env(safe-area-inset-bottom))' }
})
const selectedProductName = computed(() => t(selectedProduct.value.nameKey))
const formattedAmount = computed(() => `USD ${selectedAmount.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

function openComposer() {
  phase.value = 'compose'
  panelOpen.value = true
  hint.value = ''
  nextTick(() => inputEl.value?.focus())
}

function onPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  event.currentTarget?.setPointerCapture?.(event.pointerId)
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
    longPressed = false
    return
  }
  openComposer()
}

function cancelPress() {
  window.clearTimeout(pressTimer)
  if (listening.value) reset()
}

function startListening() {
  phase.value = 'voice'
  panelOpen.value = true
  listening.value = true
  voiceStage.value = 'listening'
  hint.value = ''
  interimText.value = ''
  message.value = ''
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    recognition = null
    return
  }
  recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.continuous = true
  recognition.onresult = (event) => {
    let text = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) text += event.results[i][0].transcript
    interimText.value = text.trim()
    message.value = interimText.value
  }
  recognition.onerror = () => {
    finishVoiceRecognition()
  }
  recognition.onend = () => {
    finishVoiceRecognition(message.value.trim() || DEMO_VOICE_COMMAND)
  }
  try { recognition.start() } catch { recognition = null }
}

function stopListening() {
  if (!recognition) {
    finishVoiceRecognition()
    return
  }
  try { recognition.stop() } catch { finishVoiceRecognition() }
}

function finishVoiceRecognition(text = DEMO_VOICE_COMMAND) {
  if (voiceStage.value === 'recognized') return
  listening.value = false
  recognition = null
  const recognizedText = text.trim() || DEMO_VOICE_COMMAND
  interimText.value = recognizedText
  message.value = recognizedText
  voiceStage.value = 'recognized'
}

function editRecognized() {
  voiceStage.value = 'editing'
  nextTick(() => inputEl.value?.focus())
}

function useCommand(command) {
  message.value = command
  submit()
}

function parseAmount(text) {
  const normalized = text.toLowerCase().replace(/,/g, '')
  const numeric = normalized.match(/(?:usd\s*|\$\s*)(\d+(?:\.\d+)?)/)
    || normalized.match(/(\d+(?:\.\d+)?)\s*(?:usd|us dollars?|dollars?|bucks?)/)
    || normalized.match(/(?:for|worth|amount)\s*(?:usd\s*|\$\s*)?(\d+(?:\.\d+)?)/)
  if (numeric) return Number(numeric[1])
  const words = [
    ['one hundred', 100], ['two hundred', 200], ['three hundred', 300], ['five hundred', 500],
    ['one thousand', 1000], ['two thousand', 2000], ['five thousand', 5000], ['ten thousand', 10000]
  ]
  return words.find(([label]) => normalized.includes(label))?.[1] || 0
}

function matchProduct(text) {
  const normalized = text.toLowerCase()
  return PRODUCTS.find((product) => product.aliases.some((alias) => normalized.includes(alias)))
}

function submit() {
  const text = message.value.trim()
  if (!text) return
  if (!/\b(buy|purchase|invest|subscribe|get)\b/i.test(text)) {
    hint.value = t('assistant.needBuyIntent')
    return
  }
  const product = matchProduct(text)
  if (!product) {
    hint.value = t('assistant.unsupportedProduct')
    return
  }
  const amount = parseAmount(text)
  if (!amount) {
    hint.value = t('assistant.needAmount')
    return
  }
  if (amount < 100) {
    hint.value = t('assistant.minimumAmount')
    return
  }
  selectedProduct.value = product
  selectedAmount.value = amount
  message.value = ''
  hint.value = ''
  phase.value = 'confirm'
  panelOpen.value = true
  productTerms.value = false
  riskTerms.value = false
  confirmError.value = false
  preserveOnNextRoute = true
  router.push({ path: '/wealth/detail', query: { id: product.id, name: t(product.nameKey), rate: product.rate, assistant: 'trade', amount: String(amount) } })
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
    const product = selectedProduct.value
    router.push({ path: '/wealth/buy', query: { id: product.id, name: t(product.nameKey), rate: product.rate, amount: String(selectedAmount.value), assistant: 'trade', terms: 'accepted', autoReview: '1' } })
    running.value = false
    phase.value = 'compose'
  }, 420)
}

function reset() {
  panelOpen.value = false
  phase.value = 'compose'
  hint.value = ''
  confirmError.value = false
  try { recognition?.abort() } catch { /* recognition already stopped */ }
  recognition = null
  listening.value = false
  message.value = ''
  interimText.value = ''
  voiceStage.value = 'idle'
}

function closeOnOutsidePress(event) {
  if (panelOpen.value && !dockEl.value?.contains(event.target)) reset()
}

watch(() => route.fullPath, () => {
  if (preserveOnNextRoute) {
    preserveOnNextRoute = false
    return
  }
  if (panelOpen.value || listening.value) reset()
})

onMounted(() => document.addEventListener('pointerdown', closeOnOutsidePress, true))

onBeforeUnmount(() => {
  window.clearTimeout(pressTimer)
  document.removeEventListener('pointerdown', closeOnOutsidePress, true)
  try { recognition?.abort() } catch { /* no-op */ }
})
</script>

<style scoped>
.assistant-dock { position: fixed; z-index: 50; right: max(14px,calc((100vw - 480px)/2 + 14px)); display: flex; align-items: flex-end; gap: 10px; pointer-events: none; }
.assistant-orb { position: relative; width: 58px; height: 58px; flex: 0 0 58px; border: 0; border-radius: 50%; padding: 0; overflow: visible; appearance: none; background: transparent!important; box-shadow: none!important; pointer-events: auto; touch-action: none; transition: transform .22s ease,filter .22s ease; }
.assistant-orb:active { transform: scale(.88)!important; }.assistant-orb img { position: relative; z-index: 2; display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: contain; filter: drop-shadow(0 9px 12px rgba(8,39,75,.3)); animation: orb-breathe 2.4s ease-in-out infinite; }.assistant-dock.running .assistant-orb { animation: assistant-run 1.2s ease-in-out infinite; filter: saturate(.7); }
.assistant-dock:not(.listening):not(.running) .assistant-orb { animation: orb-roam 4.2s cubic-bezier(.45,0,.55,1) infinite; }
.idle-orbit { position: absolute; z-index: 3; inset: -5px; border: 1px solid rgba(40,112,176,.24); border-radius: 50%; animation: orbit-spin 2.8s linear infinite; pointer-events: none; }.idle-orbit i { position: absolute; top: 3px; left: 7px; width: 6px; height: 6px; border-radius: 50%; background: #efd184; box-shadow: 0 0 8px #d6a84c; }.idle-spark { position: absolute; z-index: 4; width: 4px; height: 4px; border-radius: 50%; background: #72b7e8; box-shadow: 0 0 7px rgba(64,152,218,.9); pointer-events: none; }.idle-spark.s1 { top: -2px; right: 5px; animation: spark-pop 2.6s ease-in-out infinite; }.idle-spark.s2 { right: -2px; bottom: 10px; animation: spark-pop 2.6s .9s ease-in-out infinite; }
.pulse { position: absolute; z-index: -1; inset: -5px; border: 2px solid rgba(56,142,222,.55); border-radius: 50%; animation: voice-pulse 1.35s ease-out infinite; }.pulse.p2 { animation-delay: .55s; }.live-dot { position: absolute; right: 2px; bottom: 3px; width: 10px; height: 10px; border: 2px solid #fff; border-radius: 50%; background: #23b679; }
.assistant-panel { width: min(330px,calc(100vw - 92px)); border: 1px solid rgba(196,211,224,.9); border-radius: 20px; padding: 14px; background: rgba(255,255,255,.985); box-shadow: 0 20px 52px rgba(9,39,72,.22); backdrop-filter: blur(18px); pointer-events: auto; }
.compose-head { display: grid; grid-template-columns: 34px 1fr 24px; align-items: center; gap: 9px; margin-bottom: 12px; }.compose-head>span { width: 32px; height: 32px; }.compose-head img { width: 100%; height: 100%; border-radius: 50%; }.compose-head strong,.compose-head small { display: block; }.compose-head strong { color: #102f54; font-size: 12px; }.compose-head small { margin-top: 2px; color: #8290a0; font-size: 8px; }.compose-head button { border: 0; background: transparent; color: #8b97a5; font-size: 20px; }
.quick-label { margin: 0 2px 7px; color: #8a7350; font-size: 8px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }.quick-commands { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 11px; }.quick-commands button { display: grid; grid-template-columns: 31px 1fr; align-items: center; gap: 7px; min-width: 0; border: 1px solid #e3e9ef; border-radius: 12px; padding: 8px; overflow: hidden; background: linear-gradient(145deg,#f8fafc,#eef4f8); color: #174574; text-align: left; }.quick-commands b { display: grid; place-items: center; height: 28px; border-radius: 9px; background: #123b6d; color: #fff; font-size: 8px; letter-spacing: .03em; }.quick-commands button:last-child b { background: linear-gradient(145deg,#d5b15d,#9b6d25); }.quick-commands span { overflow: hidden; font-size: 8px; font-weight: 700; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.composer { display: flex; align-items: center; gap: 8px; padding: 4px; border: 1px solid #d8e2eb; border-radius: 15px; background: #f7f9fb; }.composer:focus-within { border-color: #2c659b; box-shadow: 0 0 0 3px rgba(44,101,155,.1); }.composer input { min-width: 0; height: 38px; flex: 1; border: 0; outline: 0; padding: 0 9px; background: transparent; color: #142033; font: inherit; font-size: 11px; }.composer button { display: grid; place-items: center; width: 38px; height: 38px; border: 0; border-radius: 11px; background: linear-gradient(145deg,#21598e,#103863); color: #fff; font-size: 18px; }.composer button:disabled { opacity: .38; }.assistant-hint,.assistant-error { margin: 8px 2px 0; color: #a64141; font-size: 10px; line-height: 1.4; }
.assistant-head { display: grid; grid-template-columns: 34px 1fr 24px; gap: 8px; align-items: center; }.assistant-head strong,.assistant-head small { display: block; }.assistant-head strong { color: #142033; font-size: 13px; }.assistant-head small { margin-top: 3px; color: #7f8b9a; font-size: 9px; }.assistant-head button { border: 0; background: transparent; color: #8994a1; font-size: 20px; }.mini-orb { width: 32px; height: 32px; }.mini-orb img { width: 100%; height: 100%; border-radius: 50%; }
.order-card { display: grid; grid-template-columns: 38px 1fr auto; gap: 9px; align-items: center; margin: 12px 0 9px; padding: 10px; border-radius: 12px; background: linear-gradient(135deg,#f4f7fa,#fbf7ed); }.product-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 11px; background: linear-gradient(145deg,#306ca5,#123b6d); color: #fff; font-size: 10px; font-weight: 800; }.product-mark.gold { background: linear-gradient(145deg,#e5c26f,#a97a2d); font-size: 13px; }.order-card strong,.order-card small { display: block; }.order-card strong { font-size: 11px; }.order-card small { margin-top: 3px; color: #85909f; font-size: 9px; }.order-card>b { color: #123b6d; font-size: 11px; white-space: nowrap; }
.assistant-check { display: flex; align-items: flex-start; gap: 8px; padding: 7px 3px; color: #536174; font-size: 10px; line-height: 1.35; }.assistant-check input { width: 15px; height: 15px; flex: 0 0 auto; accent-color: #123b6d; }.continue-btn { width: 100%; margin-top: 8px; border: 0; border-radius: 12px; padding: 11px; background: #123b6d; color: #fff; font-size: 11px; font-weight: 750; }
.assistant-panel.voice-panel { position: absolute; right: 72px; bottom: 5px; width: 172px; border: 0; border-radius: 14px; padding: 8px 12px; background: linear-gradient(145deg,rgba(10,50,89,.96),rgba(21,76,124,.96)); box-shadow: 0 9px 22px rgba(7,37,69,.2); }.assistant-panel.voice-panel.voice-recognized { width: 238px; padding: 8px 12px; border-radius: 12px; }
.voice-state { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 30px; }.wave-dot { width: 3px; height: 3px; flex: 0 0 3px; border-radius: 50%; background: #f0ca75; box-shadow: 0 0 6px rgba(240,202,117,.7); }.voice-bars { display: flex; align-items: center; justify-content: center; gap: 2px; height: 28px; }.voice-bars i { width: 2px; height: 4px; border-radius: 4px; background: #fff; opacity: .8; }.voice-bars.active i { animation: voice-bar .72s ease-in-out infinite alternate; }.voice-bars i:nth-child(2),.voice-bars i:nth-child(8),.voice-bars i:nth-child(14){animation-delay:.08s}.voice-bars i:nth-child(3),.voice-bars i:nth-child(7),.voice-bars i:nth-child(13){animation-delay:.16s}.voice-bars i:nth-child(4),.voice-bars i:nth-child(6),.voice-bars i:nth-child(10),.voice-bars i:nth-child(12){animation-delay:.24s}.voice-bars i:nth-child(5),.voice-bars i:nth-child(9),.voice-bars i:nth-child(11){animation-delay:.32s}.voice-transcript { display: block; margin: 1px auto 2px; overflow: hidden; color: rgba(255,255,255,.72); font-size: 8px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.recognized-state { display: grid; grid-template-columns: 7px 1fr 30px; align-items: center; gap: 8px; min-height: 32px; }.recognized-dot { width: 6px; height: 6px; border-radius: 50%; background: #5ed5a2; box-shadow: 0 0 8px rgba(94,213,162,.75); }.recognized-text { min-width:0;border:0;padding:0;background:transparent;text-align:left; }.recognized-state strong,.recognized-state small { display: block; }.recognized-state strong { color: #9fb9d2; font-size: 7px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }.recognized-state small { margin-top: 3px; color: #fff; font-size: 9px; line-height: 1.25; white-space: normal; }.recognized-send,.voice-edit button { display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:9px;background:#f0ca75;color:#103c69;font-size:14px; }.recognized-state.error { grid-template-columns: 26px 1fr; }.recognized-state.error .recognized-check { display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.16);color:#fff; }
.voice-edit { display:flex;align-items:center;gap:7px; }.voice-edit input { min-width:0;height:32px;flex:1;border:1px solid rgba(255,255,255,.2);border-radius:9px;outline:0;padding:0 9px;background:rgba(255,255,255,.1);color:#fff;font-size:9px; }.voice-edit input:focus { border-color:#f0ca75;background:rgba(255,255,255,.14); }.voice-edit button:disabled { opacity:.45; }
.assistant-panel-enter-active,.assistant-panel-leave-active { transition: opacity .2s ease,transform .24s cubic-bezier(.2,.8,.2,1); }.assistant-panel-enter-from,.assistant-panel-leave-to { opacity: 0; transform: translateX(18px) scale(.94); }
@keyframes voice-pulse { from{opacity:.8;transform:scale(.9)} to{opacity:0;transform:scale(1.45)} } @keyframes voice-bar { from{height:8px} to{height:30px} } @keyframes assistant-run { 0%,100%{transform:scale(.92);opacity:.72} 50%{transform:scale(1);opacity:1} } @keyframes orb-roam { 0%,100%{transform:translate(0,0) rotate(-2deg)} 24%{transform:translate(-4px,-8px) rotate(4deg)} 52%{transform:translate(2px,-4px) rotate(-3deg)} 76%{transform:translate(-3px,-10px) rotate(3deg)} } @keyframes orb-breathe { 0%,100%{transform:scale(.96);filter:drop-shadow(0 8px 10px rgba(8,39,75,.28))} 50%{transform:scale(1.06);filter:drop-shadow(0 12px 16px rgba(20,83,140,.42))} } @keyframes orbit-spin { to{transform:rotate(360deg)} } @keyframes spark-pop { 0%,35%,100%{opacity:0;transform:scale(.2) translate(0,4px)} 48%{opacity:1;transform:scale(1.3) translate(2px,-3px)} 65%{opacity:.25;transform:scale(.7) translate(5px,-8px)} }
@media (prefers-reduced-motion:reduce){.assistant-orb,.assistant-orb img,.idle-orbit,.idle-spark,.pulse,.voice-bars i{animation-duration:8s!important}}
@media (max-width:360px){.assistant-panel{width:calc(100vw - 86px);padding:11px}.order-card>b{font-size:10px}}
</style>
