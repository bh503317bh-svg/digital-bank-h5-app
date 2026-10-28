<template>
  <div class="dock" :style="dockStyle">
    <section v-if="open" class="panel" aria-label="aku-bank Assistant">
      <header>
        <span class="badge"><van-icon name="service-o" /></span>
        <div><strong>aku-bank Assistant</strong><small>Your banking assistant · Powered by DeepSeek</small></div>
        <button class="close" type="button" aria-label="Close" @click="closePanel">×</button>
      </header>
      <div ref="thread" class="thread" aria-live="polite">
        <div class="intro">Hello! Ask me about banking, investing, or finding a feature in the app.</div>
        <div v-if="!messages.length" class="shortcuts">
          <button type="button" @click="go({ path: '/orders' })">Transfer status <span>↗</span></button>
          <button type="button" @click="go({ path: '/mine' })">Account center <span>↗</span></button>
          <button type="button" @click="go({ path: '/funds' })">Explore funds <span>↗</span></button>
        </div>
        <template v-for="(item, index) in messages" :key="index">
          <div class="bubble" :class="item.role">
            <AssistantMessage v-if="item.role === 'assistant'" :text="item.content" />
            <template v-else>{{ item.content }}</template>
          </div>
          <div v-if="item.actions?.length" class="action-group">
            <div class="action-heading">EXPLORE NEXT</div>
            <button v-for="action in item.actions" :key="action.path + (action.query?.id || '')" class="action-card" type="button" @click="go(action)">
              <span class="action-icon"><van-icon :name="action.icon || 'arrow'" /></span>
              <span class="action-copy"><strong>{{ action.label }}</strong><small>{{ action.description }}</small></span>
              <van-icon name="arrow" class="action-arrow" />
            </button>
          </div>
        </template>
        <div v-if="loading" class="thinking">Thinking…</div>
        <div v-if="error" class="error" role="alert">{{ error }} <button v-if="messages.at(-1)?.role === 'user'" type="button" @click="retry">Retry</button></div>
      </div>
      <form class="composer" @submit.prevent="send()">
        <input v-model="draft" placeholder="Ask a question…" aria-label="Your question" maxlength="4000" />
        <button class="mic" type="button" :aria-label="listening ? 'Stop recording' : 'Start voice input'" :aria-pressed="listening" @click="toggleVoice"><span aria-hidden="true">{{ listening ? '■' : '🎙' }}</span></button>
        <button class="send" type="submit" :disabled="!draft.trim() || loading || listening" aria-label="Send"><van-icon name="guide-o" /></button>
      </form>
      <div v-if="voiceError" class="voice-error" role="alert">{{ voiceError }}</div>
      <div class="foot">{{ listening ? 'Listening. Tap again to stop; review the text before sending.' : 'AI-generated responses. Do not share passwords or secrets.' }}</div>
    </section>
    <button class="orb" type="button" aria-label="Open assistant" @click="open ? closePanel() : open = true"><van-icon name="service-o" /></button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { assistantChat } from '../api'
import AssistantMessage from './AssistantMessage.vue'

const route = useRoute()
const router = useRouter()
const dockStyle = computed(() => ({ bottom: route.meta.tab || ['/wealth/detail', '/wealth/buy'].includes(route.path) ? 'calc(76px + env(safe-area-inset-bottom))' : 'calc(18px + env(safe-area-inset-bottom))' }))
const open = ref(false)
const draft = ref('')
const messages = ref([])
const loading = ref(false)
const error = ref('')
const listening = ref(false)
const voiceError = ref('')
const thread = ref(null)
let recognition = null

async function scroll() { await nextTick(); if (thread.value) thread.value.scrollTop = thread.value.scrollHeight }
async function send(text) {
  const value = (typeof text === 'string' ? text : draft.value).trim()
  if (!value || loading.value) return
  draft.value = ''
  error.value = ''
  messages.value.push({ role: 'user', content: value })
  await request()
}
async function request() {
  loading.value = true
  await scroll()
  try {
    const history = messages.value.slice(-24).map(({ role, content }) => ({ role, content }))
    const result = await assistantChat(history)
    if (!result || typeof result.reply !== 'string') throw new Error('Invalid response')
    const actions = Array.isArray(result.actions) ? result.actions : (result.action ? [result.action] : [])
    messages.value.push({ role: 'assistant', content: result.reply, actions })
  } catch (e) {
    error.value = e?.response?.data?.detail || 'Could not connect. Please try again.'
  } finally { loading.value = false; await scroll() }
}
function retry() { if (!loading.value && messages.value.at(-1)?.role === 'user') { error.value = ''; request() } }
function closePanel() { if (listening.value) recognition?.stop(); open.value = false }
function go(action) { closePanel(); router.push({ path: action.path, query: action.query || {} }) }
function toggleVoice() {
  if (listening.value) { recognition?.stop(); return }
  voiceError.value = ''
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) { voiceError.value = 'Speech recognition is unavailable here. Use Chrome or type instead.'; return }
  const originalDraft = draft.value.trim()
  let heardSpeech = false
  let failed = false
  recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.continuous = true
  recognition.onresult = event => {
    const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ').trim()
    if (transcript) heardSpeech = true
    draft.value = [originalDraft, transcript].filter(Boolean).join(' ').slice(0, 4000)
  }
  recognition.onerror = event => {
    failed = true
    const errors = {
      'not-allowed': 'Microphone or speech permission was denied. Check browser settings.',
      'audio-capture': 'No microphone was found. Check your device.',
      'network': 'Speech recognition could not connect. Check your network or type instead.',
      'no-speech': 'No speech was detected. Please try again.'
    }
    voiceError.value = errors[event.error] || 'Speech recognition failed. Please retry or type.'
  }
  recognition.onend = () => {
    listening.value = false
    recognition = null
    if (!heardSpeech && !failed) voiceError.value = 'No speech was detected. Please try again.'
  }
  try { recognition.start(); listening.value = true } catch { recognition = null; voiceError.value = 'Unable to start speech recognition.' }
}
onBeforeUnmount(() => { recognition?.abort() })
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
</style>
