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

export interface GenerateTaskCreatedPayload {
  taskId: string
  displayMeta: GenerateTaskDisplayMeta
  inputImages?: string[]
  expectedCount?: number
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

export interface GenerateHistoryItem {
  taskId: string
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
  resultImages: string[]
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

export const useGenerateTasksStore = defineStore('generateTasks', () => {
  const items = ref<GenerateHistoryItem[]>([])

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
      resultImages: [],
      progress: 0,
      progressText: '生成中...',
    }

    items.value.unshift(item)
    taskIds.add(item.taskId)
    void pollTask(item.taskId)
  }

  function removeTask(taskId: string) {
    stopPolling(taskId)
    taskIds.delete(taskId)
    items.value = items.value.filter((item) => item.taskId !== taskId)
  }

  function cleanup() {
    for (const taskId of pollTimers.keys()) {
      stopPolling(taskId)
    }
    taskIds.clear()
    items.value = []
  }

  return {
    items,
    enqueueTask,
    pollTask,
    applySuccess,
    applyFailure,
    stopPolling,
    removeTask,
    cleanup,
  }
})
