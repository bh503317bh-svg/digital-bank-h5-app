import ethanChenAvatar from './assets/avatars/ethan-chen.png'

const PLACEHOLDER_NAMES = new Set(['', 'User', 'Aku User', 'Customer', 'Guest'])

export function displayNameFor(user) {
  const name = String(user?.display_name || user?.name || '').trim()
  if (name && !PLACEHOLDER_NAMES.has(name)) return name
  if (String(user?.mobile || '').includes('13800000001')) return 'Ethan Chen'
  return name || 'Ethan Chen'
}

export function avatarFor(user) {
  return user?.avatar_url || ethanChenAvatar
}

