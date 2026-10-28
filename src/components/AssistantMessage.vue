<template>
  <!-- The renderer escapes raw HTML and filters dangerous link protocols. -->
  <div class="message-content" v-html="html"></div>
</template>

<script setup>
import { computed } from 'vue'
import { renderAssistantMarkdown } from '../utils/assistantMessage'
const props = defineProps({ text: { type: String, required: true } })
const html = computed(() => renderAssistantMarkdown(props.text))
</script>

<style scoped>
.message-content { min-width: 0; overflow-x: auto; }
.message-content :deep(> :first-child) { margin-top: 0; }
.message-content :deep(> :last-child) { margin-bottom: 0; }
.message-content :deep(p) { margin: 0 0 9px; }
.message-content :deep(h1), .message-content :deep(h2), .message-content :deep(h3),
.message-content :deep(h4), .message-content :deep(h5), .message-content :deep(h6) { margin: 12px 0 6px; color: #173d65; font-size: 1.08em; line-height: 1.4; font-weight: 700; }
.message-content :deep(strong) { color: #173d65; font-weight: 700; }
.message-content :deep(ul), .message-content :deep(ol) { margin: 0 0 9px; padding-left: 20px; }
.message-content :deep(ul) { list-style: disc outside; }
.message-content :deep(ol) { list-style: decimal outside; }
.message-content :deep(li) { display: list-item; margin: 4px 0; padding-left: 2px; }
.message-content :deep(li::marker) { color: #7c9cba; }
.message-content :deep(li p) { margin: 0 0 5px; }
.message-content :deep(li ul), .message-content :deep(li ol) { margin: 4px 0; }
.message-content :deep(a) { color: #1b5b93; text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; }
.message-content :deep(blockquote) { margin: 9px 0; padding: 2px 0 2px 10px; border-left: 3px solid #abc3d8; color: #63788c; }
.message-content :deep(code) { padding: 2px 4px; border-radius: 4px; background: #e5edf4; color: #244969; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .92em; }
.message-content :deep(pre) { max-width: 100%; margin: 9px 0; padding: 10px; overflow-x: auto; border-radius: 9px; background: #e7eef5; line-height: 1.5; }
.message-content :deep(pre code) { padding: 0; background: none; white-space: pre; }
.message-content :deep(table) { border-collapse: collapse; margin: 9px 0; font-size: .95em; }
.message-content :deep(th), .message-content :deep(td) { min-width: 75px; padding: 5px 8px; border: 1px solid #d8e2eb; text-align: left; }
.message-content :deep(th) { background: #eaf1f7; color: #173d65; }
.message-content :deep(hr) { margin: 12px 0; border: 0; border-top: 1px solid #d8e2eb; }
.message-content :deep(img) { display: block; max-width: 100%; height: auto; border-radius: 8px; }
</style>
