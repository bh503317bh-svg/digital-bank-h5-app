<template>
  <div class="dock" :style="dockStyle">
    <section v-if="open" class="panel" aria-label="aku-bank Assistant">
      <header>
        <span class="badge"><van-icon name="service-o" /></span>
        <div><strong>aku-bank Assistant</strong><small>Your banking assistant · Powered by DeepSeek</small></div>
        <button class="close" type="button" aria-label="Close" @click="closePanel">×</button>
      </header>
      <div ref="thread" class="thread" aria-live="polite" @load.capture="scroll">
        <div class="intro">Hello! Ask me about banking, investing, or finding a feature in the app.</div>
        <div v-if="!messages.length" class="shortcuts">
          <button type="button" @click="go({ path: '/orders' })">Transfer status <span>↗</span></button>
          <button type="button" @click="go({ path: '/mine' })">Account center <span>↗</span></button>
          <button type="button" @click="go({ path: '/funds' })">Explore funds <span>↗</span></button>
        </div>
        <template v-for="(item, index) in messages" :key="index">
          <div v-if="item.content" class="bubble" :class="item.role">
            <AssistantMessage v-if="item.role === 'assistant'" :text="item.content" />
            <template v-else>{{ item.content }}</template>
          </div>
          <div v-if="item.actions?.length" class="action-group">
            <div class="action-heading">EXPLORE NEXT</div>
            <button v-for="action in item.actions" :key="action.path + (action.query?.id || '')" class="action-card" type="button" @click="go(action)">
              <span v-if="productFor(action)" class="product-mark" :class="`sector-${productFor(action).sector}`" :aria-label="productFor(action).ticker">{{ productFor(action).ticker }}</span>
              <span v-else class="action-icon"><van-icon :name="action.icon || 'arrow'" /></span>
              <span class="action-copy"><strong>{{ action.label }}</strong><small>{{ action.description }}</small></span>
              <van-icon name="arrow" class="action-arrow" />
            </button>
          </div>
        </template>
        <div v-if="loading && !messages.at(-1)?.content" class="thinking">Thinking…</div>
        <div v-if="error" class="error" role="alert">{{ error }} <button v-if="canRetry" type="button" @click="retry">Retry</button></div>
      </div>
      <div v-if="listening" class="voice-demo" role="status"><span class="voice-demo-label">Preparing your request</span><span class="voice-bars" aria-hidden="true"><i v-for="n in 15" :key="n" :style="{ height: `${5 + (n * 7) % 12}px`, animationDelay: `${n * -0.07}s` }"></i></span></div>
      <form class="composer" @submit.prevent="send()">
        <textarea v-model="draft" :rows="draft.length > 50 ? 3 : 1" placeholder="Ask a question…" aria-label="Your question" maxlength="4000" @keydown.enter.exact.prevent="send()"></textarea>
        <button class="mic" :class="{ active: listening }" type="button" :aria-label="listening ? 'Cancel suggested request' : 'Insert suggested request'" :aria-pressed="listening" @click="toggleVoice"><span v-if="listening" class="mic-ripple" aria-hidden="true"></span><svg v-if="!listening" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-3 0h6"/></svg><svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg></button>
        <button class="send" type="submit" :disabled="!draft.trim() || loading || listening" aria-label="Send"><van-icon name="guide-o" /></button>
      </form>
      <div class="foot">{{ listening ? 'Suggested text will appear shortly.' : 'AI-generated responses. Do not share passwords or secrets.' }}</div>
    </section>
    <button class="orb" type="button" aria-label="Open assistant" @click="open ? closePanel() : openPanel()"><van-icon name="service-o" /></button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { streamAssistantChat } from '../api'
import AssistantMessage from './AssistantMessage.vue'
import { fundMeta } from '../mock/products'

const route = useRoute()
const router = useRouter()
const dockStyle = computed(() => ({ bottom: route.meta.tab || ['/wealth/detail', '/wealth/buy'].includes(route.path) ? 'calc(76px + env(safe-area-inset-bottom))' : 'calc(18px + env(safe-area-inset-bottom))' }))
const open = ref(false)
const draft = ref('')
const messages = ref([])
const loading = ref(false)
const error = ref('')
const listening = ref(false)
const thread = ref(null)
const canRetry = computed(() => messages.value.at(-1)?.role === 'user' || !!messages.value.at(-1)?.failed)
const demoVoiceText = "I'd like to invest $100,000 in wealth management. Please recommend a suitable investment portfolio for me."
let voiceTimer = null
let activeRequest = null
let destroyed = false
const productFor = action => fundMeta.find(product => product.id === action.query?.id)

async function scroll() { await nextTick(); if (thread.value) thread.value.scrollTop = thread.value.scrollHeight }
async function send(text) {
  const value = (typeof text === 'string' ? text : draft.value).trim()
  if (!value || loading.value || listening.value) return
  draft.value = ''
  error.value = ''
  messages.value.push({ role: 'user', content: value })
  await request()
}
async function request() {
  loading.value = true
  await scroll()
  const history = messages.value.filter(item => !item.failed && item.content.trim()).slice(-24).map(({ role, content }) => ({ role, content: content.slice(0, 4000) }))
  messages.value.push({ role: 'assistant', content: '', actions: [] })
  const reply = messages.value[messages.value.length - 1]
  const queue = []
  let actions = []
  const pump = window.setInterval(() => {
    if (!queue.length || destroyed) return
    const count = queue.length > 400 ? 8 : queue.length > 150 ? 5 : 3
    reply.content += queue.splice(0, count).join('')
    scroll()
  }, 40)
  const controller = new AbortController()
  activeRequest = controller
  const timeout = window.setTimeout(() => controller.abort(), 100000)
  try {
    await streamAssistantChat(history, {
      onDelta: text => queue.push(...Array.from(text)),
      onActions: nextActions => { actions = nextActions }
    }, controller.signal)
    while (queue.length && !destroyed) await new Promise(resolve => window.setTimeout(resolve, 40))
    if (!destroyed) {
      reply.actions = actions
      await scroll()
    }
  } catch (e) {
    while (queue.length && !destroyed) await new Promise(resolve => window.setTimeout(resolve, 40))
    if (!destroyed) {
      if (reply.content.trim()) reply.failed = true
      else messages.value.pop()
      error.value = e?.name === 'AbortError' ? 'The response timed out. Please try again.' : (e?.message || 'Could not connect. Please try again.')
    }
  } finally {
    window.clearInterval(pump)
    window.clearTimeout(timeout)
    if (activeRequest === controller) activeRequest = null
    loading.value = false
    if (!destroyed) await scroll()
  }
}
function retry() { if (!loading.value && canRetry.value) { if (messages.value.at(-1)?.failed) messages.value.pop(); error.value = ''; request() } }
function openPanel() { open.value = true; scroll() }
function closePanel() { window.clearTimeout(voiceTimer); listening.value = false; open.value = false }
function go(action) { closePanel(); router.push({ path: action.path, query: action.query || {} }) }
function toggleVoice() {
  if (listening.value) { window.clearTimeout(voiceTimer); listening.value = false; return }
  listening.value = true
  voiceTimer = window.setTimeout(() => {
    draft.value = [draft.value.trim(), demoVoiceText].filter(Boolean).join(' ').slice(0, 4000)
    listening.value = false
    voiceTimer = null
  }, 1700)
}
onBeforeUnmount(() => { destroyed = true; window.clearTimeout(voiceTimer); activeRequest?.abort() })
</script>

<style scoped>
.dock{position:fixed;z-index:50;right:max(14px,calc((100vw - 480px)/2 + 14px));display:flex;align-items:flex-end;gap:10px;pointer-events:none}.orb{width:56px;height:56px;flex:0 0 56px;display:grid;place-items:center;border:3px solid #d4b36c;border-radius:50%;background:linear-gradient(145deg,#174f87,#082849);box-shadow:0 9px 20px #08284947;color:white;font-size:27px;pointer-events:auto}.panel{width:min(350px,calc(100vw - 92px));max-height:min(570px,75vh);display:flex;flex-direction:column;border:1px solid #c4d3e0;border-radius:20px;background:#fff;box-shadow:0 20px 52px #09274838;pointer-events:auto;overflow:hidden}header{display:grid;grid-template-columns:36px 1fr 28px;gap:8px;align-items:center;padding:14px;border-bottom:1px solid #edf1f5}.badge{display:grid;place-items:center;width:32px;height:32px;border:2px solid #d4b36c;border-radius:50%;background:#123b6d;color:white;font-size:17px}header strong,header small{display:block}header strong{font-size:13px;color:#142033}header small{margin-top:3px;color:#7f8b9a;font-size:10px}.close{border:0;background:none;color:#8994a1;font-size:23px}.thread{min-height:160px;max-height:390px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.intro,.bubble{width:fit-content;max-width:90%;padding:10px 12px;border-radius:4px 13px 13px 13px;background:#edf3f8;color:#243b55;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}.bubble.user{align-self:flex-end;border-radius:13px 4px 13px 13px;background:#123b6d;color:white}.shortcuts{display:flex;flex-wrap:wrap;gap:6px}.shortcuts button,.action{border:1px solid #d6e1eb;border-radius:10px;background:#fff;color:#174f87;padding:7px 9px;font-size:11px;text-align:left}.action{align-self:flex-start}.thinking{color:#71869a;font-size:11px}.error{font-size:11px;color:#b13c3c}.error button{border:0;background:none;color:#123b6d;text-decoration:underline}.composer{display:flex;align-items:center;gap:5px;margin:0 12px;padding:4px;border:1px solid #d8e2eb;border-radius:13px;background:#f7f9fb}.composer input{min-width:0;flex:1;height:36px;padding:0 8px;border:0;outline:0;background:transparent;color:#142033;font-size:12px}.composer button{width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:9px;font-size:17px}.mic{background:transparent;color:#526b83}.send{background:#123b6d;color:white}.send:disabled{opacity:.4}.foot{padding:7px 14px 11px;font-size:9px;line-height:1.4;color:#82909f}
.voice-error{padding:6px 14px 0;color:#b13c3c;font-size:11px}.mic[aria-pressed="true"]{color:#b13c3c;background:#fbecec}
.bubble.assistant { width: fit-content; max-width: 100%; padding: 12px 14px; border: 1px solid #e4ebf1; border-radius: 5px 15px 15px 15px; background: #f4f7fa; color: #30465c; font-size: 12px; line-height: 1.6; white-space: normal; }
.bubble.user { max-width: 86%; padding: 9px 12px; line-height: 1.5; }
.shortcuts { gap: 7px; }
.shortcuts button { padding: 7px 10px; border-radius: 99px; background: #f8fafc; font-weight: 600; }
.shortcuts button span { margin-left: 3px; color: #b5965b; }
.action-group { display: grid; gap: 6px; width: 100%; margin-top: 1px; }
.action-heading { padding: 1px 2px; color: #8a9aad; font-size: 9px; font-weight: 700; letter-spacing: .08em; }
.action-card { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border: 1px solid #e2eaf1; border-radius: 12px; background: #fff; color: #1a3f65; text-align: left; white-space: normal; transition: background .18s, border-color .18s; }
.action-card:active { border-color: #a9c0d5; background: #f3f7fb; }
.action-icon { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 32px; border-radius: 10px; background: #edf3f8; color: #245b88; font-size: 16px; }
.action-copy { min-width: 0; flex: 1; }
.action-copy strong, .action-copy small { display: block; }
.action-copy strong { font-size: 11px; line-height: 1.3; font-weight: 700; }
.action-copy small { margin-top: 2px; color: #8190a1; font-size: 10px; line-height: 1.3; }
.action-arrow { color: #a8b7c5; font-size: 12px; }
.composer textarea { min-width: 0; min-height: 36px; max-height: 86px; flex: 1; padding: 8px; border: 0; outline: 0; resize: none; background: transparent; color: #142033; font: inherit; font-size: 12px; line-height: 1.4; }
.product-mark { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; border-radius: 11px; background: #e8eff9; color: #27517e; font-size: 9px; font-weight: 800; letter-spacing: -.02em; }
.sector-gold { background: #f9f0d9; color: #9b6d1f; }
.sector-bond, .sector-dividend { background: #e6f4ed; color: #39745a; }
.sector-biotech, .sector-healthcare { background: #f1e9f7; color: #765295; }
.sector-broad, .sector-asean { background: #e8f0fa; color: #365c8b; }
.voice-demo { display: flex; align-items: center; gap: 12px; margin: 0 12px 8px; padding: 9px 12px; border: 1px solid #d6e5f1; border-radius: 12px; background: #f2f7fb; }
.voice-demo-label { color: #325778; font-size: 10px; font-weight: 650; white-space: nowrap; }
.voice-bars { display: flex; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 20px; }
.voice-bars i { display: block; width: 3px; min-height: 5px; border-radius: 3px; background: #3577aa; animation: voice-wave .56s ease-in-out infinite alternate; }
.composer .mic { position: relative; overflow: visible; }
.mic svg { position: relative; z-index: 1; width: 19px; height: 19px; }
.mic.active { background: #e6f1fa; color: #1a5b8e; }
.mic-ripple { position: absolute; inset: 2px; border: 1px solid #6d9ec0; border-radius: 50%; animation: mic-ripple 1s ease-out infinite; }
@keyframes voice-wave { from { transform: scaleY(.4); opacity: .55; } to { transform: scaleY(1.45); opacity: 1; } }
@keyframes mic-ripple { from { transform: scale(.8); opacity: .7; } to { transform: scale(1.75); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .voice-bars i, .mic-ripple { animation: none; } }
</style>
