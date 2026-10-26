<template>
  <span class="money-amount" :class="[`size-${size}`, tone && `tone-${tone}`]">
    <span v-if="showCode && !hide" class="currency-code">{{ currency }}</span>
    <span v-if="hide" class="hidden-value">••••</span>
    <template v-else>
      <span v-if="sign" class="sign">{{ sign }}</span>
      <span class="symbol">{{ symbol }}</span>
      <span class="integer">{{ integer }}</span><span class="decimal">{{ decimal }}</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  currency: { type: String, default: 'USD' },
  hide: Boolean,
  showCode: Boolean,
  signed: { type: String, default: '' },
  tone: { type: String, default: '' },
  size: { type: String, default: 'md' }
})

const symbols = { USD: '$', EUR: '€', HKD: 'HK$', JPY: '¥', SGD: 'S$', CNY: '¥', THB: '฿', MYR: 'RM', IDR: 'Rp', VND: '₫', PHP: '₱' }
const amount = computed(() => Number(props.value) || 0)
const sign = computed(() => props.signed || (amount.value < 0 ? '−' : ''))
const symbol = computed(() => symbols[props.currency] || props.currency)
const parts = computed(() => Math.abs(amount.value).toLocaleString('en-US', {
  minimumFractionDigits: props.currency === 'JPY' ? 0 : 2,
  maximumFractionDigits: props.currency === 'JPY' ? 0 : 2
}).split('.'))
const integer = computed(() => parts.value[0])
const decimal = computed(() => parts.value[1] ? `.${parts.value[1]}` : '')
</script>

<style scoped>
.money-amount { display: inline-flex; align-items: baseline; color: inherit; font-variant-numeric: tabular-nums; white-space: nowrap; }
.currency-code { align-self: center; margin-right: 7px; padding: 3px 6px; border-radius: 6px; background: rgba(18,59,109,.08); color: #496078; font-size: .34em; font-weight: 750; letter-spacing: .7px; }
.sign { margin-right: 2px; font-weight: 600; }
.symbol { margin-right: 3px; font-size: .56em; font-weight: 700; opacity: .76; }
.integer { font-weight: 760; letter-spacing: -.035em; }
.decimal { font-size: .58em; font-weight: 700; opacity: .72; letter-spacing: -.02em; }
.hidden-value { font-weight: 760; letter-spacing: .12em; }
.size-sm { font-size: 16px; }.size-md { font-size: 22px; }.size-lg { font-size: 34px; }.size-xl { font-size: 40px; }
.tone-positive { color: var(--wb-green); }.tone-negative { color: var(--wb-red); }.tone-primary { color: var(--wb-blue); }.tone-gold { color: #9b7432; }
</style>
