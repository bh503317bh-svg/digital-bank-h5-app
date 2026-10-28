import axios from 'axios'
import { useAuthStore } from './stores/auth'
import { readAssistantStream } from './utils/assistantStream'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

export async function login(mobile, password) {
  const { data } = await http.post('/auth/login', { mobile, password })
  return data
}

export async function assistantChat(messages) {
  const { data } = await http.post('/assistant/chat', { messages }, { timeout: 100000 })
  return data
}

export async function streamAssistantChat(messages, handlers, signal) {
  const auth = useAuthStore()
  const response = await fetch('/api/assistant/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
    body: JSON.stringify({ messages }),
    signal
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'Could not connect. Please try again.')
  }
  if (!response.body) throw new Error('Streaming is not supported in this browser.')
  await readAssistantStream(response.body.getReader(), handlers)
}

export async function fetchHome() {
  const { data } = await http.get('/app/home')
  return data
}

export async function openDepositAccount(currency = 'USD') {
  const { data } = await http.post('/dp/accounts', { currency })
  return data
}

export async function transfer(payload) {
  const { data } = await http.post('/app/transfer', payload, {
    headers: { 'Idempotency-Key': crypto.randomUUID() }
  })
  return data
}

export async function wealthBuy(payload) {
  const { data } = await http.post('/app/wealth/buy', payload, {
    headers: { 'Idempotency-Key': crypto.randomUUID() }
  })
  return data
}

export async function setPayPassword(loginPassword, newPayPassword) {
  const { data } = await http.post('/auth/set-pay-password', {
    login_password: loginPassword,
    new_pay_password: newPayPassword
  })
  return data
}

export async function fetchLoanProducts() {
  const { data } = await http.get('/ln/products', { params: { limit: 20 } })
  return data
}

export async function fetchLoanDashboard() {
  const { data } = await http.get('/ln/me/dashboard')
  return data
}

export async function loanApply(payload) {
  const { data } = await http.post('/ln/applications', payload)
  return data
}

export async function loanRepay(payload) {
  const { data } = await http.post('/ln/repayments', payload)
  return data
}

export async function fetchLedgers(accountNo) {
  const { data } = await http.get(`/dp/accounts/${accountNo}/ledgers`)
  return data
}

export async function withdraw(accountNo, amount, payPassword) {
  const { data } = await http.post(
    '/dp/txns/withdraw',
    { account_no: accountNo, amount, pay_password: payPassword },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } }
  )
  return data
}

export async function deposit(accountNo, amount, payPassword) {
  const { data } = await http.post(
    '/dp/txns/deposit',
    { account_no: accountNo, amount, pay_password: payPassword },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } }
  )
  return data
}

export async function shopCatalog(category) {
  const { data } = await http.get('/app/shop/catalog', { params: category ? { category } : {} })
  return data
}

export async function shopOrders() {
  const { data } = await http.get('/app/shop/orders')
  return data
}

export async function shopBuy(payload) {
  const { data } = await http.post('/app/shop/buy', payload, {
    headers: { 'Idempotency-Key': crypto.randomUUID() }
  })
  return data
}

export default http
