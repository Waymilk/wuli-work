import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export type GenerateTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'ERROR'

export interface GenerateTaskDisplayMeta {
  prompt: string
  modelLabel: string
  ratioLabel: string
  sizeLabel: string
  countLabel: string
}

export interface GeneratePromptDataset {
  datasetId: string
  datasetUrl: string
  label: string
  mediaType?: 'image' | 'video'
}

export interface GenerateTaskCreatedPayload {
  taskId: string
  displayMeta: GenerateTaskDisplayMeta
  inputImages?: string[]
  promptDatasets?: GeneratePromptDataset[]
  expectedCount?: number
  mediaType?: 'IMAGE' | 'VIDEO'
}

interface TaskArtifact {
  id?: string
  url?: string
  preview_urls?: string[]
  metadata?: Record<string, unknown>
}

interface TaskStatusResponse {
  success?: boolean
  status?: string
  progress?: number
  progress_text?: string
  artifacts?: TaskArtifact[]
  options?: {
    numImages?: number
    num_images?: number
    aspectRatio?: string
    aspect_ratio?: string
  }
  error?: unknown
  detail?: string
}

interface TaskStatusEnvelope {
  data?: TaskStatusResponse
  result?: TaskStatusResponse
}

interface HistoryParameters {
  aspect_ratio?: string
  image_size?: string
  num_images?: number | string
  resolution?: string
  duration?: number | string
  model_name?: string
  reference_dataset_id?: unknown
  reference_dataset_ids?: unknown
  reference_dataset_url?: unknown
  reference_dataset_urls?: unknown
  reference_datasets?: unknown
}

interface HistoryItemResponse {
  id?: number | string
  prompt?: string
  model_id?: number | string
  model_name?: string
  media_type?: 'IMAGE' | 'VIDEO' | 'MUSIC'
  status?: string
  result_urls?: string[]
  parameters?: HistoryParameters
  error_message?: string | null
  is_favorite?: boolean
  replicate_id?: string | null
  created_at?: string
  reference_images?: unknown
}

interface HistoryListResponse {
  total?: number
  page?: number
  page_size?: number
  items?: HistoryItemResponse[]
}

export interface GenerateHistoryItem {
  taskId: string
  historyId?: number | string
  mediaType: 'IMAGE' | 'VIDEO'
  status: GenerateTaskStatus
  createdAt: string
  prompt: string
  modelLabel: string
  ratioLabel: string
  aspectRatio: string
  sizeLabel: string
  countLabel: string
  expectedCount: number
  inputImages: string[]
  promptDatasets: GeneratePromptDataset[]
  resultImages: string[]
  isFavorite: boolean
  progress?: number
  progressText?: string
  errorMessage?: string
}

const POLL_INTERVAL_MS = 5000

function formatDateTime(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function getErrorMessage(err: unknown, fallback: string) {
  const maybe = err as {
    response?: { data?: { detail?: string; error?: string; message?: string } }
    detail?: string
    error?: string
    message?: string
  }
  return (
    maybe?.response?.data?.detail
    || maybe?.response?.data?.error
    || maybe?.response?.data?.message
    || maybe?.detail
    || maybe?.error
    || maybe?.message
    || fallback
  )
}

function mapArtifactsToImages(artifacts: TaskArtifact[] | undefined) {
  if (!Array.isArray(artifacts)) return []
  return artifacts
    .map((artifact) => artifact.url || artifact.preview_urls?.[0] || '')
    .filter((url): url is string => Boolean(url))
}

function parseExpectedCount(countLabel: string) {
  const parsed = Number(String(countLabel || '').replace(/\D+/g, ''))
  if (Number.isNaN(parsed) || parsed < 1) return 1
  return parsed
}

function parseNumImagesFromOptions(options: TaskStatusResponse['options']) {
  const raw = options?.numImages ?? options?.num_images
  const parsed = Number(raw)
  if (Number.isNaN(parsed) || parsed < 1) return undefined
  return Math.floor(parsed)
}

function parseAspectRatioFromOptions(options: TaskStatusResponse['options']) {
  const raw = String(options?.aspectRatio || options?.aspect_ratio || '').trim()
  if (!raw) return undefined
  return raw
}

function normalizeTaskStatusResponse(payload: TaskStatusResponse | TaskStatusEnvelope | undefined) {
  if (!payload) return {} as TaskStatusResponse
  if ('status' in payload || 'options' in payload || 'artifacts' in payload) {
    return payload as TaskStatusResponse
  }
  const envelope = payload as TaskStatusEnvelope
  if (envelope.data) return envelope.data
  if (envelope.result) return envelope.result
  return {} as TaskStatusResponse
}

function normalizeHistoryStatus(statusRaw: unknown): GenerateTaskStatus {
  const status = String(statusRaw || '').toLowerCase()
  if (status === 'pending') return 'PENDING'
  if (status === 'processing') return 'RUNNING'
  if (status === 'completed') return 'SUCCEEDED'
  if (status === 'failed') return 'FAILED'
  if (status === 'cancelled') return 'CANCELLED'
  return 'RUNNING'
}

function toPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return Math.floor(parsed)
}

function normalizeResultUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function normalizeReferenceImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((rawItem) => {
      if (!rawItem || typeof rawItem !== 'object') return ''
      const item = rawItem as { url?: unknown }
      return typeof item.url === 'string' ? item.url.trim() : ''
    })
    .filter((url): url is string => Boolean(url))
}

function normalizeReferenceImageDatasets(value: unknown): GeneratePromptDataset[] {
  if (!Array.isArray(value)) return []
  const datasets: GeneratePromptDataset[] = []
  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== 'object') continue
    const item = rawItem as { id?: unknown; url?: unknown; label?: unknown; mediaType?: unknown; media_type?: unknown; type?: unknown }
    const datasetId = String(item.id ?? '').trim()
    const datasetUrl = typeof item.url === 'string' ? item.url.trim() : ''
    if (!datasetId || !datasetUrl) continue
    const rawMediaType = String(item.mediaType ?? item.media_type ?? item.type ?? '').trim().toLowerCase()
    const mediaType = rawMediaType === 'video' ? 'video' : 'image'
    datasets.push({
      datasetId,
      datasetUrl,
      label: String(item.label || '').trim() || (mediaType === 'video' ? '视频' : '图片'),
      mediaType,
    })
  }
  return datasets
}

function normalizeUnknownStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
  }
  const normalized = String(value ?? '').trim()
  return normalized ? [normalized] : []
}

function normalizeLegacyReferenceDatasets(params: HistoryParameters): GeneratePromptDataset[] {
  const datasets: GeneratePromptDataset[] = []
  if (Array.isArray(params.reference_datasets)) {
    for (const rawItem of params.reference_datasets) {
      if (!rawItem || typeof rawItem !== 'object') continue
      const item = rawItem as {
        dataset_id?: unknown
        datasetId?: unknown
        id?: unknown
        dataset_url?: unknown
        datasetUrl?: unknown
        url?: unknown
        label?: unknown
        mediaType?: unknown
        media_type?: unknown
        type?: unknown
      }
      const datasetId = String(item.dataset_id ?? item.datasetId ?? item.id ?? '').trim()
      const datasetUrl = String(item.dataset_url ?? item.datasetUrl ?? item.url ?? '').trim()
      if (!datasetId || !datasetUrl) continue
      const rawMediaType = String(item.mediaType ?? item.media_type ?? item.type ?? '').trim().toLowerCase()
      const mediaType = rawMediaType === 'video' ? 'video' : 'image'
      datasets.push({
        datasetId,
        datasetUrl,
        label: String(item.label || '').trim() || (mediaType === 'video' ? '视频' : '图片'),
        mediaType,
      })
    }
  }

  const ids = normalizeUnknownStringList(params.reference_dataset_ids ?? params.reference_dataset_id)
  const urls = normalizeUnknownStringList(params.reference_dataset_urls ?? params.reference_dataset_url)
  const count = Math.min(ids.length, urls.length)
  for (let index = 0; index < count; index += 1) {
    datasets.push({
      datasetId: ids[index],
      datasetUrl: urls[index],
      label: '图片',
      mediaType: 'image',
    })
  }
  return datasets
}

function dedupePromptDatasets(datasets: GeneratePromptDataset[]): GeneratePromptDataset[] {
  const seen = new Set<string>()
  const result: GeneratePromptDataset[] = []
  for (const item of datasets) {
    const key = `${item.datasetId}::${item.datasetUrl}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      ...item,
      label: item.mediaType === 'video' || item.label === '视频' ? '视频' : '图片',
      mediaType: item.mediaType === 'video' || item.label === '视频' ? 'video' : 'image',
    })
  }
  return result
}

function mapHistoryItemToStoreItem(item: HistoryItemResponse): GenerateHistoryItem {
  const params = item.parameters || {}
  const ratio = String(params.aspect_ratio || '').trim() || '智能匹配'
  const imageSize = String(params.image_size || '').trim()
  const resolution = String(params.resolution || '').trim()
  const duration = toPositiveInt(params.duration)
  const numImages = toPositiveInt(params.num_images)
  const hasVideoHints = Boolean(resolution || duration)
  const mediaType: 'IMAGE' | 'VIDEO' = item.media_type === 'VIDEO' || hasVideoHints ? 'VIDEO' : 'IMAGE'
  const sizeLabel = hasVideoHints ? (resolution || '-') : (imageSize || '-')
  const countLabel = hasVideoHints
    ? (duration ? `${duration}s` : '-')
    : (numImages ? `${numImages}张` : '-')
  const taskId = String(item.replicate_id || '').trim() || `history-${item.id}`
  const resultImages = normalizeResultUrls(item.result_urls)
  const promptDatasets = dedupePromptDatasets([
    ...normalizeReferenceImageDatasets(item.reference_images),
    ...normalizeLegacyReferenceDatasets(params),
  ])
  const inputImages = promptDatasets.length
    ? promptDatasets.map((dataset) => dataset.datasetUrl)
    : normalizeReferenceImageUrls(item.reference_images)
  return {
    taskId,
    historyId: item.id,
    mediaType,
    status: normalizeHistoryStatus(item.status),
    createdAt: item.created_at || formatDateTime(new Date()),
    prompt: String(item.prompt || ''),
    modelLabel: String(params.model_name || item.model_name || '').trim() || `模型#${item.model_id || '-'}`,
    ratioLabel: ratio,
    aspectRatio: ratio,
    sizeLabel,
    countLabel,
    expectedCount: Math.max(1, numImages || resultImages.length || 1),
    inputImages,
    promptDatasets,
    resultImages,
    isFavorite: Boolean(item.is_favorite),
    progress: undefined,
    progressText: undefined,
    errorMessage: item.error_message || undefined,
  }
}

function createdAtMs(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const useGenerateTasksStore = defineStore('generateTasks', () => {
  const items = ref<GenerateHistoryItem[]>([])
  const historyPage = ref(0)
  const historyPageSize = ref(20)
  const historyTotal = ref(0)
  const historyLoading = ref(false)
  const historyLoadingMore = ref(false)
  const historyError = ref('')
  const historyInitialized = ref(false)
  const historyHasMore = ref(true)

  const taskIds = new Set<string>()
  const pollTimers = new Map<string, ReturnType<typeof setTimeout>>()

  function stopPolling(taskId: string) {
    const timer = pollTimers.get(taskId)
    if (timer) {
      clearTimeout(timer)
      pollTimers.delete(taskId)
    }
  }

  function scheduleNext(taskId: string) {
    stopPolling(taskId)
    const timer = setTimeout(() => {
      void pollTask(taskId)
    }, POLL_INTERVAL_MS)
    pollTimers.set(taskId, timer)
  }

  function patchTask(taskId: string, patch: Partial<GenerateHistoryItem>) {
    const item = items.value.find((row) => row.taskId === taskId)
    if (!item) return
    Object.assign(item, patch)
  }

  function applySuccess(taskId: string, artifacts: TaskArtifact[] = []) {
    const resultImages = mapArtifactsToImages(artifacts)
    patchTask(taskId, {
      status: 'SUCCEEDED',
      progress: 100,
      progressText: resultImages.length ? '生成完成' : '生成完成，无可展示结果',
      resultImages,
      errorMessage: undefined,
    })
    stopPolling(taskId)
  }

  function applyFailure(taskId: string, status: GenerateTaskStatus, error: string) {
    patchTask(taskId, {
      status,
      errorMessage: error,
      progressText: error,
    })
    stopPolling(taskId)
  }

  async function pollTask(taskId: string) {
    const item = items.value.find((row) => row.taskId === taskId)
    if (!item) {
      stopPolling(taskId)
      return
    }

    try {
      const resRaw = await request.get<unknown, TaskStatusResponse | TaskStatusEnvelope>(`/api/tasks/${taskId}`)
      const res = normalizeTaskStatusResponse(resRaw)
      const status = String(res?.status || '').toUpperCase() as GenerateTaskStatus
      const progress = typeof res?.progress === 'number' ? res.progress : item.progress
      const progressText = res?.progress_text || item.progressText
      const expectedCountFromOptions = parseNumImagesFromOptions(res?.options)
      const aspectRatioFromOptions = parseAspectRatioFromOptions(res?.options)
      const partialImages = mapArtifactsToImages(Array.isArray(res?.artifacts) ? res.artifacts : [])
      if (import.meta.env.DEV) {
        console.debug('[generateTasks.pollTask]', {
          taskId,
          status,
          numImages: expectedCountFromOptions,
          aspectRatio: aspectRatioFromOptions,
          artifactsLength: partialImages.length,
        })
      }
      patchTask(taskId, {
        ...(partialImages.length ? { resultImages: partialImages } : {}),
        ...(expectedCountFromOptions ? { expectedCount: expectedCountFromOptions } : {}),
        ...(aspectRatioFromOptions ? { aspectRatio: aspectRatioFromOptions, ratioLabel: aspectRatioFromOptions } : {}),
      })

      if (status === 'SUCCEEDED') {
        applySuccess(taskId, Array.isArray(res?.artifacts) ? res.artifacts : [])
        return
      }

      if (status === 'FAILED' || status === 'CANCELLED') {
        applyFailure(taskId, status, getErrorMessage(res?.error || res, '任务执行失败'))
        return
      }

      patchTask(taskId, {
        status: status || 'RUNNING',
        progress,
        progressText: progressText || '生成中...',
      })
      scheduleNext(taskId)
    } catch {
      patchTask(taskId, {
        status: item.status === 'PENDING' ? 'PENDING' : 'RUNNING',
        progressText: '状态更新中...',
      })
      scheduleNext(taskId)
    }
  }

  function enqueueTask(payload: GenerateTaskCreatedPayload) {
    if (!payload.taskId || taskIds.has(payload.taskId)) return

    const item: GenerateHistoryItem = {
      taskId: payload.taskId,
      historyId: undefined,
      mediaType: payload.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      status: 'PENDING',
      createdAt: formatDateTime(new Date()),
      prompt: payload.displayMeta.prompt,
      modelLabel: payload.displayMeta.modelLabel,
      ratioLabel: payload.displayMeta.ratioLabel,
      aspectRatio: payload.displayMeta.ratioLabel,
      sizeLabel: payload.displayMeta.sizeLabel,
      countLabel: payload.displayMeta.countLabel,
      expectedCount: Math.max(1, payload.expectedCount || parseExpectedCount(payload.displayMeta.countLabel)),
      inputImages: payload.inputImages || [],
      promptDatasets: payload.promptDatasets || [],
      resultImages: [],
      isFavorite: false,
      progress: 0,
      progressText: '生成中...',
    }

    items.value.unshift(item)
    taskIds.add(item.taskId)
    void pollTask(item.taskId)
  }

  function upsertHistoryItems(mappedItems: GenerateHistoryItem[], fromReset: boolean) {
    if (fromReset) {
      const historyTaskIds = new Set(mappedItems.map((item) => item.taskId))
      const localTasks = items.value.filter((item) => !String(item.taskId).startsWith('history-') && !historyTaskIds.has(item.taskId))
      items.value = [...localTasks]
    }

    for (const mapped of mappedItems) {
      const existing = items.value.find((row) => row.taskId === mapped.taskId)
      if (existing) {
        Object.assign(existing, mapped)
      } else {
        items.value.push(mapped)
      }
      taskIds.add(mapped.taskId)

      if ((mapped.status === 'PENDING' || mapped.status === 'RUNNING') && !String(mapped.taskId).startsWith('history-')) {
        scheduleNext(mapped.taskId)
      } else if (mapped.status === 'SUCCEEDED' || mapped.status === 'FAILED' || mapped.status === 'CANCELLED') {
        stopPolling(mapped.taskId)
      }
    }

    items.value.sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt))
  }

  async function loadHistoryPage(reset = false) {
    if (reset) {
      if (historyLoading.value) return
      historyLoading.value = true
      historyError.value = ''
    } else {
      if (historyLoadingMore.value || historyLoading.value || !historyHasMore.value) return
      historyLoadingMore.value = true
    }

    try {
      const targetPage = reset ? 1 : historyPage.value + 1
      const response = await request.get<unknown, HistoryListResponse>('/api/history', {
        params: {
          page: targetPage,
          page_size: historyPageSize.value,
        },
      })
      const rawItems = Array.isArray(response?.items) ? response.items : []
      const mappedItems = rawItems.map(mapHistoryItemToStoreItem)
      upsertHistoryItems(mappedItems, reset)

      historyPage.value = Number(response?.page || targetPage)
      historyPageSize.value = Number(response?.page_size || historyPageSize.value)
      historyTotal.value = Number(response?.total || 0)
      historyHasMore.value = historyPage.value * historyPageSize.value < historyTotal.value
      historyInitialized.value = true
    } catch (error) {
      historyError.value = getErrorMessage(error, '历史记录加载失败')
      historyInitialized.value = true
    } finally {
      if (reset) historyLoading.value = false
      else historyLoadingMore.value = false
    }
  }

  function removeTask(taskId: string) {
    stopPolling(taskId)
    taskIds.delete(taskId)
    items.value = items.value.filter((item) => item.taskId !== taskId)
  }

  async function deleteHistoryById(taskId: string) {
    const item = items.value.find((row) => row.taskId === taskId)
    if (!item?.historyId) {
      throw new Error('任务未入历史，暂不可操作')
    }
    await request.delete(`/api/history/${item.historyId}`)
    removeTask(taskId)
  }

  async function toggleHistoryFavorite(taskId: string) {
    const item = items.value.find((row) => row.taskId === taskId)
    if (!item?.historyId) {
      throw new Error('任务未入历史，暂不可操作')
    }
    const nextFavorite = !item.isFavorite
    const res = await request.post<unknown, { success?: boolean; is_favorite?: boolean }>(
      `/api/history/${item.historyId}/favorite`,
      { favorite: nextFavorite },
    )
    item.isFavorite = typeof res?.is_favorite === 'boolean' ? res.is_favorite : nextFavorite
  }

  function cleanup() {
    for (const taskId of pollTimers.keys()) {
      stopPolling(taskId)
    }
    taskIds.clear()
    items.value = []
    historyPage.value = 0
    historyTotal.value = 0
    historyLoading.value = false
    historyLoadingMore.value = false
    historyError.value = ''
    historyInitialized.value = false
    historyHasMore.value = true
  }

  return {
    items,
    historyPage,
    historyPageSize,
    historyTotal,
    historyLoading,
    historyLoadingMore,
    historyError,
    historyInitialized,
    historyHasMore,
    loadHistoryPage,
    enqueueTask,
    pollTask,
    applySuccess,
    applyFailure,
    stopPolling,
    removeTask,
    deleteHistoryById,
    toggleHistoryFavorite,
    cleanup,
  }
})
