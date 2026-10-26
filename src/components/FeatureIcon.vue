<template>
  <img class="feature-icon" :src="icons[name] || icons.wealth" alt="" aria-hidden="true" />
</template>

<script setup>
import benefits from '../assets/icons/benefits.png'
import card from '../assets/icons/card.png'
import funds from '../assets/icons/funds.png'
import invite from '../assets/icons/invite.png'
import loans from '../assets/icons/loans.png'
import points from '../assets/icons/points.png'
import security from '../assets/icons/security.png'
import transactions from '../assets/icons/transactions.png'
import transfer from '../assets/icons/transfer.png'
import wealth from '../assets/icons/wealth.png'

defineProps({
  name: { type: String, default: 'wealth' }
})

const icons = { benefits, card, funds, invite, loans, points, security, transactions, transfer, wealth }
</script>

<style scoped>
.feature-icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}
</style>
