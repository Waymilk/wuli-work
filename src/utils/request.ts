import axios from 'axios'

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL || '/'
const useDevProxy = import.meta.env.DEV && import.meta.env.VITE_USE_DEV_PROXY !== '0'

const request = axios.create({
  baseURL: useDevProxy ? '/' : configuredBaseURL,
  timeout: 10000,
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
  (error) => Promise.reject(error),
)

export default request
