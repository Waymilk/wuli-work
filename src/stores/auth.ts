import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_KEY = 'wuli_auth_token'
const USER_KEY = 'wuli_auth_user'
const LEGACY_LOGIN_KEY = 'wuli_logged_in'

interface AuthUser {
  id: number
  username: string
  email?: string
  avatar_url?: string
  credits?: string | number | null
  credit?: string | number | null
  balance?: string | number | null
  points?: string | number | null
}

function safeParseUser(value: string | null) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as AuthUser
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.id !== 'number' || typeof parsed.username !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const user = ref<AuthUser | null>(null)
  const authModalOpen = ref(false)
  const pageRefreshKey = ref(0)

  const isLoggedIn = computed(() => token.value.length > 0)

  function setAuth(nextToken: string, nextUser: AuthUser) {
    token.value = nextToken
    user.value = nextUser
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, nextToken)
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      window.localStorage.setItem(LEGACY_LOGIN_KEY, '1')
    }
  }

  function clearAuth() {
    token.value = ''
    user.value = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(USER_KEY)
      window.localStorage.removeItem(LEGACY_LOGIN_KEY)
    }
  }

  function updateUser(nextUser: Partial<AuthUser>) {
    if (!user.value) return
    user.value = {
      ...user.value,
      ...nextUser,
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    }
  }

  function restoreFromStorage() {
    if (typeof window === 'undefined') return
    const storageToken = window.localStorage.getItem(TOKEN_KEY) || ''
    const storageUser = safeParseUser(window.localStorage.getItem(USER_KEY))
    if (!storageToken || !storageUser) {
      clearAuth()
      return
    }
    token.value = storageToken
    user.value = storageUser
    window.localStorage.setItem(LEGACY_LOGIN_KEY, '1')
  }

  function openAuthModal() {
    authModalOpen.value = true
  }

  function closeAuthModal() {
    authModalOpen.value = false
  }

  function refreshCurrentPage() {
    pageRefreshKey.value += 1
  }

  return {
    token,
    user,
    isLoggedIn,
    authModalOpen,
    pageRefreshKey,
    setAuth,
    updateUser,
    clearAuth,
    restoreFromStorage,
    openAuthModal,
    closeAuthModal,
    refreshCurrentPage,
  }
})

export type { AuthUser }
