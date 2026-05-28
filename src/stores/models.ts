import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/utils/request'
import type { BackendModelRecord } from '@/types/backend-model'

export interface ModelsApiResponse {
  database?: {
    image?: BackendModelRecord[]
    video?: BackendModelRecord[]
  }
}

export const useModelsStore = defineStore('models', () => {
  const modelsResponse = ref<ModelsApiResponse | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  const lastFetchedAt = ref<number | null>(null)
  const outsideExploreFallbackUsed = ref(false)

  const hasCache = computed(() => {
    const image = modelsResponse.value?.database?.image || []
    const video = modelsResponse.value?.database?.video || []
    return image.length > 0 || video.length > 0
  })

  async function fetchFromApi() {
    isLoading.value = true
    error.value = ''
    try {
      const res = await request.get<unknown, ModelsApiResponse>('/api/models')
      modelsResponse.value = res || null
      lastFetchedAt.value = Date.now()
      return true
    } catch (err) {
      error.value = '模型加载失败，请重试'
      console.error('load /api/models failed', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function ensureForExplore() {
    return fetchFromApi()
  }

  async function ensureForOtherPage() {
    if (hasCache.value) return true
    if (outsideExploreFallbackUsed.value) {
      error.value = '请先进入探索页加载模型'
      return false
    }
    outsideExploreFallbackUsed.value = true
    return fetchFromApi()
  }

  return {
    modelsResponse,
    isLoading,
    error,
    hasCache,
    lastFetchedAt,
    outsideExploreFallbackUsed,
    fetchFromApi,
    ensureForExplore,
    ensureForOtherPage,
  }
})
