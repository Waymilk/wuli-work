import axios from 'axios'
import { pinia } from '@/stores/pinia'
import { useAuthStore } from '@/stores/auth'

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL || '/'
const useDevProxy = import.meta.env.DEV && import.meta.env.VITE_USE_DEV_PROXY !== '0'

const request = axios.create({
  baseURL: useDevProxy ? '/' : configuredBaseURL,
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config
  const token = window.localStorage.getItem('wuli_auth_token')
  if (!token) return config
  config.headers = config.headers || {}
  config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      const authStore = useAuthStore(pinia)
      authStore.clearAuth()
      authStore.openAuthModal()
    }
    return Promise.reject(error)
  },
)

export default request
