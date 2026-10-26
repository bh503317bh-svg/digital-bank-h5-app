import { defineStore } from 'pinia'

function readUser() {
  try {
    const raw = localStorage.getItem('wb_user')
    if (!raw) return null
    const u = JSON.parse(raw)
    return u && typeof u === 'object' ? u : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('wb_token') || '',
    user: readUser()
  }),
  actions: {
    setSession(token, payload) {
      const src = payload?.user && typeof payload.user === 'object' ? payload.user : payload || {}
      const user = {
        user_id: src.user_id || src.id || payload?.user_id || payload?.uid,
        mobile: src.mobile || payload?.mobile || '',
        display_name: src.display_name || src.name || payload?.display_name || src.mobile || 'User',
        role: src.role || payload?.role || 'customer'
      }
      this.token = token
      this.user = user
      localStorage.setItem('wb_token', token)
      localStorage.setItem('wb_user', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('wb_token')
      localStorage.removeItem('wb_user')
    }
  }
})
