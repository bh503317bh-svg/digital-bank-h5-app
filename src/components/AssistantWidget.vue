<template>
  <div
    v-if="visible"
    ref="widgetRef"
    class="assistant-root"
    :style="dockStyle"
  >
    <transition name="assistant-pop">
      <section
        v-if="open"
        id="assistant-panel"
        class="assistant-panel"
        role="dialog"
        :aria-label="t('assistant.title')"
        @pointerdown="onPanelPointerDown"
      >
        <header class="assistant-head">
          <div class="assistant-mark"><van-icon name="chat-o" /></div>
          <div class="assistant-heading">
            <strong>{{ t('assistant.title') }}</strong>
            <span>{{ t('assistant.subtitle') }}</span>
          </div>
          <button type="button" class="assistant-close" :aria-label="t('assistant.close')" @click="closePanel">
            <van-icon name="cross" />
          </button>
        </header>

        <div ref="scrollRef" class="assistant-scroll" aria-live="polite">
          <div v-if="!messages.length" class="assistant-welcome">
            <span class="assistant-welcome-icon"><van-icon name="bulb-o" /></span>
            <strong>{{ t('assistant.welcomeTitle') }}</strong>
            <p>{{ t('assistant.welcomeBody') }}</p>
          </div>

          <div v-for="message in messages" :key="message.id" class="assistant-message" :class="message.role">
            <div v-if="message.role === 'assistant'" class="assistant-avatar"><van-icon name="chat-o" /></div>
            <div class="assistant-bubble">{{ message.text }}</div>
          </div>

          <div v-if="recognizing" class="assistant-message assistant">
            <div class="assistant-avatar"><van-icon name="chat-o" /></div>
            <div class="assistant-bubble assistant-recognizing">
              <span class="assistant-dots"><i></i><i></i><i></i></span>
              {{ t('assistant.recognizing') }}
            </div>
          </div>

          <div v-if="recommendations.length" class="assistant-recommendations">
            <div class="assistant-recommendation-note">{{ t('assistant.recommendationNote') }}</div>
            <button
              v-for="recommendation in recommendations"
              :key="recommendation.id"
              type="button"
              class="assistant-recommendation"
              :disabled="busy"
              @click="chooseRecommendation(recommendation)"
            >
              <span class="assistant-rec-top">
                <span>
                  <strong>{{ t(recommendation.nameKey) }}</strong>
                  <small>{{ categoryLabel(recommendation) }}</small>
                </span>
                <b>{{ recommendation.y1 }}</b>
              </span>
              <span class="assistant-rec-meta">
                <span>{{ t('assistant.referenceReturn') }}</span>
                <span class="assistant-rec-action">{{ t('assistant.select') }} <van-icon name="arrow" /></span>
              </span>
            </button>
          </div>
        </div>

        <div v-if="isListening" class="assistant-voice-state listening">
          <span class="assistant-wave"><i></i><i></i><i></i><i></i><i></i></span>
          <b>{{ t('assistant.listening') }}</b>
          <small>{{ t('assistant.voiceHint') }}</small>
        </div>
        <div v-else-if="isVoiceProcessing" class="assistant-voice-state processing">
          <span class="assistant-thinking"><i></i></span>
          <b>{{ t('assistant.processing') }}</b>
        </div>
        <div v-else-if="phase === 'voice-draft'" class="assistant-voice-draft">
          <van-icon name="volume-o" />
          <span>{{ t('assistant.voiceDraftHint') }}</span>
        </div>

        <div class="assistant-quick" :aria-label="t('assistant.quickActions')">
          <button
            v-for="action in quickActions"
            :key="action"
            type="button"
            :disabled="busy"
            @click="submitText(action, 'quick')"
          >{{ action }}</button>
        </div>

        <form class="assistant-composer" @submit.prevent="submitDraft">
          <input
            ref="inputRef"
            v-model="draft"
            type="text"
            enterkeyhint="send"
            autocomplete="off"
            :placeholder="t('assistant.inputPlaceholder')"
            :aria-label="t('assistant.inputPlaceholder')"
            @focus="onInputFocus"
          />
          <button type="submit" :disabled="busy || !draft.trim()" :aria-label="t('assistant.send')">
            {{ t('assistant.send') }}
          </button>
        </form>
      </section>
    </transition>

    <button
      ref="triggerRef"
      type="button"
      class="assistant-trigger"
      :class="{ open, listening: isListening, processing: isVoiceProcessing }"
      :aria-label="open ? t('assistant.focus') : t('assistant.open')"
      :aria-expanded="open"
      aria-controls="assistant-panel"
      @pointerdown="onTriggerPointerDown"
      @pointerup="onTriggerPointerUp"
      @pointercancel="onTriggerPointerCancel"
      @contextmenu.prevent
    >
      <span class="assistant-trigger-ring"></span>
      <van-icon :name="isListening ? 'volume-o' : 'chat-o'" />
      <small>AI</small>
    </button>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import {
  ASSISTANT_QUICK_ACTIONS,
  MIN_INVESTMENT_CENTS,
  VOICE_SAMPLE_TEXTS,
  classifyAssistantIntent,
  formatCents,
  getAssistantProduct
} from '../services/assistant'

const { t, te } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const widgetRef = ref(null)
const scrollRef = ref(null)
const inputRef = ref(null)
const triggerRef = ref(null)
const open = ref(false)
const phase = ref('composer')
const draft = ref('')
const messages = ref([])
const recommendations = ref([])
const pendingContext = ref({ productId: null, amountCents: null })
const keyboardInset = ref(0)
const viewportHeight = ref(typeof window === 'undefined' ? 800 : window.innerHeight)

const quickActions = ASSISTANT_QUICK_ACTIONS
const visible = computed(() => !!auth.token && route.path !== '/login')
const recognizing = computed(() => phase.value === 'recognizing-intent')
const isListening = computed(() => phase.value === 'listening')
const isVoiceProcessing = computed(() => phase.value === 'voice-processing')
const busy = computed(() => isListening.value || isVoiceProcessing.value || recognizing.value)
const baseBottom = computed(() => {
  if (route.meta.tab) return 82
  if (route.path === '/wealth/detail' || route.path === '/wealth/buy') return 84
  return 22
})
const panelMaxHeight = computed(() => {
  const reserved = (keyboardInset.value > 0 ? 10 : baseBottom.value) + 78
  return Math.max(190, Math.min(520, viewportHeight.value - reserved))
})
const dockStyle = computed(() => ({
  bottom: keyboardInset.value > 0
    ? `${keyboardInset.value + 10}px`
    : `calc(${baseBottom.value}px + env(safe-area-inset-bottom))`,
  '--assistant-panel-max': `${panelMaxHeight.value}px`
}))

let longPressTimer = null
let voiceTimer = null
let recognitionTimer = null
let focusTimer = null
let longPressActive = false
let requestSequence = 0
let messageSequence = 0

function clearTransientTimers() {
  if (longPressTimer) window.clearTimeout(longPressTimer)
  if (voiceTimer) window.clearTimeout(voiceTimer)
  if (recognitionTimer) window.clearTimeout(recognitionTimer)
  if (focusTimer) window.clearTimeout(focusTimer)
  longPressTimer = null
  voiceTimer = null
  recognitionTimer = null
  focusTimer = null
}

function clearConversation() {
  requestSequence += 1
  clearTransientTimers()
  longPressActive = false
  phase.value = 'composer'
  draft.value = ''
  messages.value = []
  recommendations.value = []
  pendingContext.value = { productId: null, amountCents: null }
}

function blurInput() {
  if (inputRef.value && document.activeElement === inputRef.value) inputRef.value.blur()
}

function closePanel() {
  blurInput()
  clearConversation()
  open.value = false
}

async function focusInput() {
  await nextTick()
  if (!open.value || !inputRef.value) return
  inputRef.value.focus({ preventScroll: true })
  if (focusTimer) window.clearTimeout(focusTimer)
  focusTimer = window.setTimeout(() => {
    if (!open.value || !inputRef.value) return
    inputRef.value.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    scrollToBottom()
  }, 180)
}

function openPanel(shouldFocus = true) {
  if (!visible.value) return
  open.value = true
  if (shouldFocus) focusInput()
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  })
}

function addMessage(role, text) {
  messages.value.push({ id: ++messageSequence, role, text })
  scrollToBottom()
}

function productLabel(productId) {
  const product = getAssistantProduct(productId)
  return product ? t(`${product.key}.name`) : String(productId || '')
}

function categoryLabel(recommendation) {
  return te(recommendation.categoryKey)
    ? t(recommendation.categoryKey)
    : t(recommendation.tagKey)
}

function navigateToProduct(productId, amountCents) {
  const product = getAssistantProduct(productId)
  if (!product || !Number.isInteger(amountCents) || amountCents < MIN_INVESTMENT_CENTS) return
  const query = {
    id: product.id,
    name: t(`${product.key}.name`),
    rate: product.y1 || '',
    amount: formatCents(amountCents),
    assistant: '1'
  }
  closePanel()
  router.push({ path: '/wealth/detail', query })
}

function applyClassification(result) {
  pendingContext.value = {
    productId: result.productId,
    amountCents: result.amountCents
  }

  if (result.status === 'trade_ready') {
    phase.value = 'navigating'
    navigateToProduct(result.productId, result.amountCents)
    return
  }

  phase.value = 'conversation'
  recommendations.value = result.status === 'needs_product' ? result.recommendations : []

  if (result.status === 'needs_amount') {
    addMessage('assistant', t('assistant.askAmount', {
      name: productLabel(result.productId),
      amount: 'USD 100.00'
    }))
    return
  }
  if (result.status === 'amount_below_minimum') {
    addMessage('assistant', t('assistant.belowMinimum', {
      name: productLabel(result.productId),
      amount: 'USD 100.00'
    }))
    return
  }
  if (result.status === 'needs_product') {
    addMessage('assistant', result.matchedProductIds.length > 1
      ? t('assistant.ambiguousIntro')
      : t('assistant.recommendIntro'))
    return
  }
  addMessage('assistant', t('assistant.notInvestment'))
}

function submitText(text, source = 'text') {
  const value = String(text || '').trim()
  if (!open.value || !value || busy.value) return
  blurInput()
  addMessage('user', value)
  messages.value[messages.value.length - 1].source = source
  draft.value = ''
  recommendations.value = []
  phase.value = 'recognizing-intent'
  scrollToBottom()

  const currentRequest = ++requestSequence
  recognitionTimer = window.setTimeout(() => {
    recognitionTimer = null
    if (!open.value || currentRequest !== requestSequence) return
    applyClassification(classifyAssistantIntent(value, pendingContext.value))
  }, 760)
}

function submitDraft() {
  submitText(draft.value, phase.value === 'voice-draft' ? 'voice' : 'text')
}

function chooseRecommendation(recommendation) {
  if (busy.value) return
  const name = t(recommendation.nameKey)
  addMessage('user', t('assistant.chooseProduct', { name }))
  recommendations.value = []

  const amountCents = pendingContext.value.amountCents
  if (Number.isInteger(amountCents) && amountCents >= MIN_INVESTMENT_CENTS) {
    navigateToProduct(recommendation.id, amountCents)
    return
  }

  pendingContext.value = { productId: recommendation.id, amountCents }
  phase.value = 'conversation'
  addMessage('assistant', amountCents == null
    ? t('assistant.askAmount', { name, amount: 'USD 100.00' })
    : t('assistant.belowMinimum', { name, amount: 'USD 100.00' }))
}

function beginListening() {
  longPressTimer = null
  longPressActive = true
  openPanel(false)
  if (!open.value) return
  clearTransientTimers()
  recognitionTimer = null
  phase.value = 'listening'
  draft.value = ''
  recommendations.value = []
  blurInput()
}

function finishListening() {
  if (phase.value !== 'listening') return
  phase.value = 'voice-processing'
  voiceTimer = window.setTimeout(() => {
    voiceTimer = null
    if (!open.value || phase.value !== 'voice-processing') return
    draft.value = VOICE_SAMPLE_TEXTS[Math.floor(Math.random() * VOICE_SAMPLE_TEXTS.length)]
    phase.value = 'voice-draft'
    focusInput()
  }, 350)
}

function onTriggerPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  event.preventDefault()
  if (triggerRef.value?.setPointerCapture) {
    try { triggerRef.value.setPointerCapture(event.pointerId) } catch { /* ignore */ }
  }
  if (longPressTimer) window.clearTimeout(longPressTimer)
  longPressActive = false
  longPressTimer = window.setTimeout(beginListening, 420)
}

function onTriggerPointerUp(event) {
  if (longPressTimer) window.clearTimeout(longPressTimer)
  longPressTimer = null
  if (triggerRef.value?.releasePointerCapture) {
    try { triggerRef.value.releasePointerCapture(event.pointerId) } catch { /* ignore */ }
  }
  if (longPressActive && phase.value === 'listening') {
    longPressActive = false
    finishListening()
    return
  }
  longPressActive = false
  openPanel(true)
}

function onTriggerPointerCancel() {
  const wasVoice = longPressActive || phase.value === 'listening' || phase.value === 'voice-processing'
  if (longPressTimer) window.clearTimeout(longPressTimer)
  longPressTimer = null
  longPressActive = false
  if (wasVoice) closePanel()
}

function onPanelPointerDown(event) {
  const target = event.target
  if (!target?.closest?.('input, textarea')) blurInput()
}

function onInputFocus() {
  updateViewport()
  if (focusTimer) window.clearTimeout(focusTimer)
  focusTimer = window.setTimeout(() => {
    if (!open.value || !inputRef.value) return
    inputRef.value.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    scrollToBottom()
  }, 180)
}

function updateViewport() {
  const viewport = window.visualViewport
  if (!viewport) {
    keyboardInset.value = 0
    viewportHeight.value = window.innerHeight
    return
  }
  const inset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
  keyboardInset.value = inset > 60 ? inset : 0
  viewportHeight.value = viewport.height
}

function onDocumentPointerDown(event) {
  if (!open.value) return
  if (widgetRef.value?.contains(event.target)) return
  closePanel()
}

watch(() => route.fullPath, () => {
  if (open.value || messages.value.length || recommendations.value.length) closePanel()
}, { flush: 'post' })

watch(visible, (isVisible) => {
  if (!isVisible && open.value) closePanel()
})

onMounted(() => {
  updateViewport()
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  window.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('scroll', updateViewport)
})

onBeforeUnmount(() => {
  clearTransientTimers()
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  window.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('scroll', updateViewport)
})
</script>

<style scoped>
.assistant-root {
  position: fixed;
  z-index: 40;
  right: max(14px, calc((100vw - 480px) / 2 + 14px));
  display: flex;
  width: min(330px, calc(100vw - 24px));
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
  transition: bottom .2s ease;
}
.assistant-trigger,
.assistant-panel { pointer-events: auto; }
.assistant-trigger {
  position: relative;
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(232, 208, 157, .75);
  border-radius: 50%;
  background: radial-gradient(circle at 32% 24%, #245d95, #0b3159 68%);
  color: #fff;
  box-shadow: 0 12px 28px rgba(8, 40, 73, .3), 0 0 0 5px rgba(200, 164, 93, .12);
  animation: assistant-float 3.8s ease-in-out infinite;
}
.assistant-trigger .van-icon { position: relative; z-index: 1; font-size: 25px; }
.assistant-trigger small {
  position: absolute;
  right: 10px;
  bottom: 8px;
  z-index: 2;
  border-radius: 5px;
  padding: 1px 3px;
  background: #c8a45d;
  color: #fff;
  font-size: 7px;
  font-weight: 800;
  letter-spacing: .4px;
}
.assistant-trigger-ring {
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(255, 255, 255, .22);
  border-radius: 50%;
}
.assistant-trigger.listening { animation: assistant-listening 1.2s ease-in-out infinite; }
.assistant-trigger.processing .van-icon { animation: assistant-spin 1s linear infinite; }

.assistant-panel {
  display: flex;
  width: 100%;
  max-height: var(--assistant-panel-max, 520px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(18, 59, 109, .12);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 22px 55px rgba(8, 30, 55, .25), 0 3px 12px rgba(8, 30, 55, .08);
}
.assistant-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 62px;
  padding: 11px 12px 10px 14px;
  background: radial-gradient(circle at 84% 0, rgba(217, 187, 119, .3), transparent 38%), linear-gradient(145deg, #174f87, #082849);
  color: #fff;
}
.assistant-mark {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(232, 209, 160, .55);
  border-radius: 50%;
  background: rgba(255, 255, 255, .08);
  color: #efd7a2;
}
.assistant-heading { min-width: 0; flex: 1; }
.assistant-heading strong,
.assistant-heading span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.assistant-heading strong { font-size: 13px; letter-spacing: .2px; }
.assistant-heading span { margin-top: 2px; color: rgba(255, 255, 255, .62); font-size: 9px; }
.assistant-close {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .1);
  color: #fff;
  font-size: 17px;
}
.assistant-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 14px 12px 8px;
  background: linear-gradient(180deg, #f7f9fb, #fff);
  -webkit-overflow-scrolling: touch;
}
.assistant-welcome { padding: 8px 7px 14px; color: #526175; text-align: center; }
.assistant-welcome-icon {
  display: grid;
  width: 42px;
  height: 42px;
  margin: 0 auto 9px;
  place-items: center;
  border-radius: 50%;
  background: #edf3f8;
  color: #b38c43;
  font-size: 20px;
}
.assistant-welcome strong { display: block; color: #142033; font-size: 13px; }
.assistant-welcome p { margin: 5px 0 0; font-size: 10px; line-height: 1.5; }
.assistant-message { display: flex; align-items: flex-end; gap: 7px; margin-bottom: 10px; }
.assistant-message.user { justify-content: flex-end; }
.assistant-avatar {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #123b6d;
  color: #efd7a2;
  font-size: 13px;
}
.assistant-bubble {
  max-width: 78%;
  border-radius: 14px;
  padding: 9px 11px;
  font-size: 11px;
  line-height: 1.5;
  word-break: break-word;
}
.assistant-message.assistant .assistant-bubble { border-bottom-left-radius: 4px; background: #fff; color: #334255; box-shadow: 0 3px 12px rgba(15, 39, 68, .07); }
.assistant-message.user .assistant-bubble { border-bottom-right-radius: 4px; background: #123b6d; color: #fff; }
.assistant-recognizing { display: inline-flex; align-items: center; gap: 7px; }
.assistant-dots { display: inline-flex; gap: 2px; }
.assistant-dots i { width: 4px; height: 4px; border-radius: 50%; background: #c8a45d; animation: assistant-dot 1s ease-in-out infinite; }
.assistant-dots i:nth-child(2) { animation-delay: .15s; }
.assistant-dots i:nth-child(3) { animation-delay: .3s; }
.assistant-recommendations { display: grid; gap: 8px; margin: 3px 0 8px 32px; }
.assistant-recommendation-note { color: #8792a1; font-size: 9px; line-height: 1.45; }
.assistant-recommendation {
  width: 100%;
  border: 1px solid #e3e9ef;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  color: #142033;
  text-align: left;
  box-shadow: 0 4px 14px rgba(15, 39, 68, .05);
}
.assistant-rec-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.assistant-rec-top > span { min-width: 0; }
.assistant-rec-top strong,
.assistant-rec-top small { display: block; }
.assistant-rec-top strong { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.assistant-rec-top small { margin-top: 3px; color: #8490a0; font-size: 9px; }
.assistant-rec-top b { flex: 0 0 auto; color: #16805c; font-size: 14px; }
.assistant-rec-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; color: #8a95a4; font-size: 8px; }
.assistant-rec-action { display: inline-flex; align-items: center; gap: 2px; color: #123b6d; font-size: 9px; font-weight: 700; }
.assistant-voice-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 12px;
  background: #f2f6f9;
  color: #123b6d;
  font-size: 10px;
}
.assistant-voice-state small { color: #8490a0; font-size: 8px; }
.assistant-wave { display: inline-flex; height: 19px; align-items: center; gap: 2px; }
.assistant-wave i { width: 2px; height: 7px; border-radius: 2px; background: #c8a45d; animation: assistant-wave .8s ease-in-out infinite; }
.assistant-wave i:nth-child(2) { animation-delay: .1s; }
.assistant-wave i:nth-child(3) { animation-delay: .2s; }
.assistant-wave i:nth-child(4) { animation-delay: .3s; }
.assistant-wave i:nth-child(5) { animation-delay: .4s; }
.assistant-thinking { display: grid; width: 18px; height: 18px; place-items: center; }
.assistant-thinking i { width: 14px; height: 14px; border: 2px solid #cfdae5; border-top-color: #123b6d; border-radius: 50%; animation: assistant-spin .8s linear infinite; }
.assistant-voice-draft { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #f8f3e9; color: #796137; font-size: 9px; }
.assistant-quick {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 8px 10px;
  border-top: 1px solid #edf1f4;
  background: #fff;
  scrollbar-width: none;
}
.assistant-quick::-webkit-scrollbar { display: none; }
.assistant-quick button {
  flex: 0 0 auto;
  border: 1px solid #dce4eb;
  border-radius: 999px;
  padding: 6px 9px;
  background: #f7f9fb;
  color: #39506a;
  font-size: 8px;
  white-space: nowrap;
}
.assistant-quick button:disabled { opacity: .45; }
.assistant-composer { display: flex; gap: 7px; padding: 9px 10px calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid #edf1f4; background: #fff; }
.assistant-composer input {
  width: 100%;
  min-width: 0;
  flex: 1;
  border: 1px solid #dce4eb;
  border-radius: 10px;
  outline: 0;
  padding: 10px 11px;
  background: #f7f9fb;
  color: #142033;
  font: inherit;
  font-size: 11px;
}
.assistant-composer input:focus { border-color: #9bb3c9; background: #fff; box-shadow: 0 0 0 3px rgba(18, 59, 109, .07); }
.assistant-composer button {
  min-width: 58px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #174f87, #0b3159);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
.assistant-composer button:disabled { opacity: .42; }
.assistant-pop-enter-active,
.assistant-pop-leave-active { transition: opacity .16s ease, transform .16s ease; transform-origin: bottom right; }
.assistant-pop-enter-from,
.assistant-pop-leave-to { opacity: 0; transform: translateY(8px) scale(.97); }
@keyframes assistant-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes assistant-listening { 0%,100% { box-shadow: 0 12px 28px rgba(8,40,73,.3), 0 0 0 5px rgba(200,164,93,.14); } 50% { box-shadow: 0 12px 28px rgba(8,40,73,.3), 0 0 0 13px rgba(200,164,93,.04); } }
@keyframes assistant-spin { to { transform: rotate(360deg); } }
@keyframes assistant-dot { 0%,100% { opacity: .35; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }
@keyframes assistant-wave { 0%,100% { height: 5px; } 50% { height: 18px; } }
@media (prefers-reduced-motion: reduce) {
  .assistant-root,
  .assistant-pop-enter-active,
  .assistant-pop-leave-active { transition: none; }
  .assistant-trigger,
  .assistant-trigger.listening,
  .assistant-trigger.processing .van-icon,
  .assistant-dots i,
  .assistant-wave i,
  .assistant-thinking i { animation: none; }
}
</style>
