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
            <div class="product-mark" :class="{ gold: selectedProduct.id === 'f7' }">{{ selectedProduct.mark }}</div>
            <div><strong>{{ selectedProductName }}</strong><small>{{ selectedProduct.ticker }} · USD</small></div>
            <b>{{ formattedAmount }}</b>
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
          <div v-if="!listening" class="quick-commands">
            <button type="button" @click="useCommand(t('assistant.qqqCommand'))">{{ t('assistant.qqqCommand') }}</button>
            <button type="button" @click="useCommand(t('assistant.goldCommand'))">{{ t('assistant.goldCommand') }}</button>
          </div>
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
const { t } = useI18n()
const PRODUCTS = [
  { id: 'f2', ticker: 'QQQ', mark: 'QQQ', nameKey: 'products.f2.name', rate: '18.20%', aliases: ['qqq', 'invesco qqq', 'nasdaq 100', 'nasdaq-100'] },
  { id: 'f7', ticker: 'GLD', mark: 'Au', nameKey: 'products.f7.name', rate: '31.20%', aliases: ['gold', 'gld', 'spdr gold'] },
  { id: 'f4', ticker: 'SPY', mark: 'SPY', nameKey: 'products.f4.name', rate: '22.10%', aliases: ['spy', 's&p 500', 's and p 500', 'sp500'] },
  { id: 'f10', ticker: 'VTI', mark: 'VTI', nameKey: 'products.f10.name', rate: '20.05%', aliases: ['vti', 'total stock market', 'total us market'] },
  { id: 'f1', ticker: 'IBB', mark: 'IBB', nameKey: 'products.f1.name', rate: '23.46%', aliases: ['ibb', 'biotech', 'biotechnology'] }
]
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
const selectedProduct = ref(PRODUCTS[1])
const selectedAmount = ref(100)
let pressTimer
let longPressed = false
let recognition

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
.quick-commands { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 9px; }.quick-commands button { min-width: 0; border: 0; border-radius: 10px; padding: 9px 8px; overflow: hidden; background: #edf3f8; color: #174574; font-size: 9px; font-weight: 700; text-align: left; text-overflow: ellipsis; white-space: nowrap; }.assistant-hint,.assistant-error { margin: 8px 2px 0; color: #a64141; font-size: 10px; line-height: 1.4; }
.assistant-head { display: grid; grid-template-columns: 34px 1fr 24px; gap: 8px; align-items: center; }.assistant-head strong,.assistant-head small { display: block; }.assistant-head strong { color: #142033; font-size: 13px; }.assistant-head small { margin-top: 3px; color: #7f8b9a; font-size: 9px; }.assistant-head button { border: 0; background: transparent; color: #8994a1; font-size: 20px; }.mini-orb { width: 32px; height: 32px; }.mini-orb img { width: 100%; height: 100%; border-radius: 50%; }
.order-card { display: grid; grid-template-columns: 38px 1fr auto; gap: 9px; align-items: center; margin: 12px 0 9px; padding: 10px; border-radius: 12px; background: linear-gradient(135deg,#f4f7fa,#fbf7ed); }.product-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 11px; background: linear-gradient(145deg,#306ca5,#123b6d); color: #fff; font-size: 10px; font-weight: 800; }.product-mark.gold { background: linear-gradient(145deg,#e5c26f,#a97a2d); font-size: 13px; }.order-card strong,.order-card small { display: block; }.order-card strong { font-size: 11px; }.order-card small { margin-top: 3px; color: #85909f; font-size: 9px; }.order-card>b { color: #123b6d; font-size: 11px; white-space: nowrap; }
.assistant-check { display: flex; align-items: flex-start; gap: 8px; padding: 7px 3px; color: #536174; font-size: 10px; line-height: 1.35; }.assistant-check input { width: 15px; height: 15px; flex: 0 0 auto; accent-color: #123b6d; }.continue-btn { width: 100%; margin-top: 8px; border: 0; border-radius: 12px; padding: 11px; background: #123b6d; color: #fff; font-size: 11px; font-weight: 750; }
.voice-state { display: flex; align-items: center; gap: 12px; min-height: 46px; }.voice-state strong,.voice-state small { display: block; }.voice-state strong { color: #123b6d; font-size: 12px; }.voice-state small { max-width: 175px; margin-top: 4px; overflow: hidden; color: #7c8998; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }.voice-bars { display: flex; align-items: center; gap: 2px; height: 34px; }.voice-bars i { width: 3px; height: 10px; border-radius: 4px; background: linear-gradient(#2b81c2,#c69e51); animation: voice-bar .8s ease-in-out infinite alternate; }.voice-bars i:nth-child(2),.voice-bars i:nth-child(6){animation-delay:.15s}.voice-bars i:nth-child(3),.voice-bars i:nth-child(5){animation-delay:.3s}.voice-bars i:nth-child(4){animation-delay:.45s}
.assistant-panel-enter-active,.assistant-panel-leave-active { transition: opacity .2s ease,transform .24s cubic-bezier(.2,.8,.2,1); }.assistant-panel-enter-from,.assistant-panel-leave-to { opacity: 0; transform: translateX(18px) scale(.94); }
@keyframes voice-pulse { from{opacity:.8;transform:scale(.9)} to{opacity:0;transform:scale(1.45)} } @keyframes voice-bar { from{height:8px} to{height:30px} } @keyframes assistant-run { 0%,100%{transform:scale(.92);opacity:.72} 50%{transform:scale(1);opacity:1} }
@media (max-width:360px){.assistant-panel{width:calc(100vw - 86px);padding:11px}.order-card>b{font-size:10px}}
</style>
