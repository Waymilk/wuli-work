<template>
  <div class="reference-upload">
    <div
      class="upload-list"
      :class="{ 'stack-mode': isStackMode, 'is-expanded': isStackExpanded }"
      :style="stackContainerStyle"
      @mouseleave="onStackListLeave"
    >
      <div
        v-for="(item, index) in items"
        :key="item.uid"
        class="upload-btn has-image stack-item"
        :class="[`is-${item.status}`, { disabled }]"
        :style="stackItemStyle(index)"
        @mouseenter="onStackItemEnter"
      >
        <video
          v-if="isVideoItem(item)"
          class="upload-preview upload-video"
          :class="{ blurred: item.status === 'uploading' }"
          :src="resolveItemDisplayUrl(item)"
          muted
          playsinline
          preload="metadata"
          @mouseenter="onVideoHoverEnter"
          @mouseleave="onVideoHoverLeave"
        />
        <img
          v-else
          class="upload-preview"
          :class="{ blurred: item.status === 'uploading' }"
          :src="resolveItemDisplayUrl(item)"
          alt="上传预览"
          @click.stop.prevent="onPreviewImage(item)"
        />

        <div v-if="item.status === 'uploading'" class="upload-overlay">
          <span class="upload-spinner"></span>
          <span class="upload-overlay-text">上传中</span>
        </div>

        <div v-else-if="item.status === 'error'" class="upload-overlay error">
          <span class="upload-overlay-text">上传失败</span>
          <button class="upload-retry-btn" type="button" @click.stop.prevent="onRetryUpload(item)">重试</button>
        </div>

        <span class="upload-tag" v-if="resolvedTagLabel">{{ resolvedTagLabel }}</span>

        <button class="upload-remove-btn" type="button" @click.stop.prevent="onRemoveImage(item.uid)">×</button>
      </div>

      <div
        class="upload-wrapper stack-item stack-add-wrapper"
        v-if="showAddSlot"
        :style="stackAddItemStyle"
        @mouseenter="cancelStackCollapse"
      >
        <AUpload
          :accept="accept"
          :show-upload-list="false"
          :before-upload="beforeUpload"
          :multiple="allowMultiple"
          :disabled="disabled"
          @change="onUploadChange"
        >
          <div class="upload-btn" :class="{ disabled }">
            <span class="upload-plus">+</span>
            <span class="upload-tag" v-if="resolvedTagLabel">{{ resolvedTagLabel }}</span>
          </div>
        </AUpload>
      </div>
    </div>

    <a-modal v-model:open="previewModalOpen" :footer="null" width="560px" class="reference-preview-modal">
      <img class="reference-preview-modal-image" :src="previewModalUrl" alt="参考图预览" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Upload as AUpload, message } from 'ant-design-vue'
import type { UploadProps, UploadFile } from 'ant-design-vue'
import { computed, onBeforeUnmount, ref, type CSSProperties } from 'vue'
import request from '@/utils/request'

type UploadItemStatus = 'uploading' | 'success' | 'error'
const IMAGE_UPLOAD_TIMEOUT_MS = 60 * 1000

interface UploadListItem {
  uid: string
  file: File | null
  localPreviewUrl: string
  imageId: number
  imageUrl: string
  datasetId: string
  datasetUrl: string
  status: UploadItemStatus
  error: string
}

interface UploadResponse {
  success?: boolean
  image?: {
    id?: number | string
    url?: string
  }
  detail?: string
  error?: unknown
}

interface FileChangeItemPayload {
  uid: string
  status: UploadItemStatus
  imageId?: number
  imageUrl?: string
  datasetId?: string
  datasetUrl?: string
  displayUrl: string
  error?: string
}

interface FileChangePayload {
  file: File | null
  files: File[]
  previewUrl: string
  displayUrls: string[]
  items: FileChangeItemPayload[]
  fileList: UploadFile[]
}

interface UploadDatasetPayload {
  uid: string
  imageId: number
  imageUrl: string
  datasetId: string
  datasetUrl: string
}

interface UploadResultPayload {
  uploading: boolean
  success: boolean
  imageId?: number
  imageUrl?: string
  datasetId?: string
  datasetUrl?: string
  datasets: UploadDatasetPayload[]
  uploadingCount: number
  successCount: number
  error?: string
}

const props = withDefaults(defineProps<{
  isVideo?: boolean
  accept?: string
  maxCount?: number
  disabled?: boolean
  tagLabel?: string
}>(), {
  isVideo: false,
  accept: 'image/*',
  maxCount: 1,
  disabled: false,
  tagLabel: '',
})

const emit = defineEmits<{
  (e: 'file-change', payload: FileChangePayload): void
  (e: 'upload-result', payload: UploadResultPayload): void
}>()

const items = ref<UploadListItem[]>([])
const uploadSeqByUid = ref<Record<string, number>>({})
const previewModalOpen = ref(false)
const previewModalUrl = ref('')
const isStackExpanded = ref(false)
let stackCollapseTimer: ReturnType<typeof setTimeout> | null = null

const maxCountSafe = computed(() => Math.max(1, props.maxCount || 1))
const resolvedTagLabel = computed(() => props.tagLabel)
const allowMultiple = computed(() => maxCountSafe.value > 1)
const successCount = computed(() => items.value.filter((item) => item.status === 'success').length)
const uploadingCount = computed(() => items.value.filter((item) => item.status === 'uploading').length)
const isStackMode = computed(() => items.value.length > 0)
const stackCount = computed(() => items.value.length + (showAddSlot.value ? 1 : 0))
const showAddSlot = computed(() => {
  if (props.disabled) return false
  return successCount.value < maxCountSafe.value && items.value.length < maxCountSafe.value
})
const stackContainerStyle = computed<CSSProperties | undefined>(() => {
  if (!isStackMode.value) return undefined
  return { '--stack-count': String(Math.max(1, stackCount.value)) } as CSSProperties
})
const stackAddItemStyle = computed<CSSProperties | undefined>(() => {
  if (!isStackMode.value) return undefined
  return {
    '--stack-index': String(items.value.length),
    zIndex: String(1000),
  } as CSSProperties
})

function stackItemStyle(index: number): CSSProperties | undefined {
  if (!isStackMode.value) return undefined
  return {
    '--stack-index': String(Math.max(0, index)),
    zIndex: String(Math.max(1, index + 1)),
  } as CSSProperties
}

function onStackItemEnter() {
  cancelStackCollapse()
  if (isStackMode.value) isStackExpanded.value = true
}

function onStackListLeave() {
  if (stackCollapseTimer) window.clearTimeout(stackCollapseTimer)
  stackCollapseTimer = window.setTimeout(() => {
    isStackExpanded.value = false
    stackCollapseTimer = null
  }, 160)
}

function cancelStackCollapse() {
  if (!stackCollapseTimer) return
  window.clearTimeout(stackCollapseTimer)
  stackCollapseTimer = null
}

const beforeUpload: UploadProps['beforeUpload'] = () => false
const IMAGE_MAX_SIZE = 20 * 1024 * 1024
const VIDEO_MAX_SIZE = 50 * 1024 * 1024

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object') {
    const errObj = error as { message?: unknown; detail?: unknown; error?: unknown; response?: { data?: { detail?: unknown; message?: unknown; error?: unknown } } }
    const nested = errObj.response?.data
    const candidate = errObj.detail ?? nested?.detail ?? errObj.error ?? nested?.error ?? errObj.message ?? nested?.message
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return fallback
}

function isValidItem(item: UploadListItem | undefined): item is UploadListItem {
  return Boolean(item)
}

function revokeItemPreview(item: UploadListItem) {
  if (!item.localPreviewUrl) return
  URL.revokeObjectURL(item.localPreviewUrl)
}

function resolveItemDisplayUrl(item: UploadListItem) {
  return item.imageUrl || item.datasetUrl || item.localPreviewUrl
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v|m3u8)(\?|#|$)/i.test(String(url || ''))
}

function isVideoFile(file: File) {
  return file.type?.startsWith('video/') || isVideoUrl(file.name)
}

function getUploadSizeLimit(file: File) {
  return isVideoFile(file)
    ? { maxSize: VIDEO_MAX_SIZE, message: '视频大小不能超过50M' }
    : { maxSize: IMAGE_MAX_SIZE, message: '图片大小不能超过20M' }
}

function validateUploadFileSize(file: File) {
  const { maxSize, message: warningText } = getUploadSizeLimit(file)
  if (file.size <= maxSize) return true
  message.warning(warningText)
  return false
}

function filterFilesBySize(files: File[]) {
  return files.filter((file) => validateUploadFileSize(file))
}

function isVideoItem(item: UploadListItem) {
  return (item.file ? isVideoFile(item.file) : false) || isVideoUrl(resolveItemDisplayUrl(item))
}

const onVideoHoverEnter = async (event: Event) => {
  const target = event.currentTarget as HTMLVideoElement | null
  if (!target) return
  try {
    await target.play()
  } catch {
    // noop
  }
}

const onVideoHoverLeave = (event: Event) => {
  const target = event.currentTarget as HTMLVideoElement | null
  if (!target) return
  target.pause()
  try {
    target.currentTime = 0
  } catch {
    // noop
  }
}

function clearAll() {
  for (const item of items.value) revokeItemPreview(item)
  items.value = []
  uploadSeqByUid.value = {}
  previewModalOpen.value = false
  previewModalUrl.value = ''
  emitAllStates(false)
}

function emitAllStates(lastSuccess: boolean, error?: string) {
  const files = items.value.map((item) => item.file).filter((file): file is File => Boolean(file))
  const displayUrls = items.value.map((item) => item.imageUrl || item.datasetUrl || item.localPreviewUrl)
  const payloadItems: FileChangeItemPayload[] = items.value.map((item) => ({
    uid: item.uid,
    status: item.status,
    imageId: item.imageId || undefined,
    imageUrl: item.imageUrl || undefined,
    datasetId: item.datasetId || undefined,
    datasetUrl: item.datasetUrl || undefined,
    displayUrl: item.imageUrl || item.datasetUrl || item.localPreviewUrl,
    error: item.error || undefined,
  }))
  const datasets: UploadDatasetPayload[] = items.value
    .filter((item) => item.status === 'success' && item.imageId && item.imageUrl)
    .map((item) => ({
      uid: item.uid,
      imageId: item.imageId,
      imageUrl: item.imageUrl,
      datasetId: item.datasetId,
      datasetUrl: item.datasetUrl,
    }))

  emit('file-change', {
    file: files[0] || null,
    files,
    previewUrl: displayUrls[0] || '',
    displayUrls,
    items: payloadItems,
    fileList: [],
  })

  emit('upload-result', {
    uploading: uploadingCount.value > 0,
    success: lastSuccess,
    imageId: datasets[0]?.imageId,
    imageUrl: datasets[0]?.imageUrl,
    datasetId: datasets[0]?.datasetId,
    datasetUrl: datasets[0]?.datasetUrl,
    datasets,
    uploadingCount: uploadingCount.value,
    successCount: successCount.value,
    error,
  })
}

function addLocalItem(file: File, uid: string) {
  const localPreviewUrl = URL.createObjectURL(file)
  const item: UploadListItem = {
    uid,
    file,
    localPreviewUrl,
    imageId: 0,
    imageUrl: '',
    datasetId: '',
    datasetUrl: '',
    status: 'uploading',
    error: '',
  }
  items.value.push(item)
  emitAllStates(false)
}

function addRemoteUrl(url: string, options?: { imageId?: number; mediaType?: 'image' | 'video' }) {
  const src = String(url || '').trim()
  if (!src || props.disabled) return false
  if (items.value.length >= maxCountSafe.value) return false
  const imageId = Number(options?.imageId || 0)
  const validImageId = Number.isFinite(imageId) && imageId > 0 ? imageId : 0
  const item: UploadListItem = {
    uid: `remote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file: null,
    localPreviewUrl: src,
    imageId: validImageId,
    imageUrl: validImageId ? src : '',
    datasetId: validImageId ? String(validImageId) : '',
    datasetUrl: validImageId ? src : '',
    status: 'success',
    error: '',
  }
  items.value.push(item)
  emitAllStates(true)
  return true
}

async function uploadFileByUid(uid: string) {
  const target = items.value.find((item) => item.uid === uid)
  if (!isValidItem(target)) return
  if (!target.file) return

  const nextSeq = (uploadSeqByUid.value[uid] || 0) + 1
  uploadSeqByUid.value[uid] = nextSeq

  target.status = 'uploading'
  target.error = ''
  target.imageId = 0
  target.imageUrl = ''
  target.datasetId = ''
  target.datasetUrl = ''
  emitAllStates(false)

  const formData = new FormData()
  formData.append('image', target.file)

  try {
    const res = await request.post<unknown, UploadResponse>('/api/user/images/upload', formData, { timeout: IMAGE_UPLOAD_TIMEOUT_MS })
    if (uploadSeqByUid.value[uid] !== nextSeq) return

    const imageId = Number(res?.image?.id)
    const imageUrl = String(res?.image?.url || '').trim()
    if (!res?.success || !Number.isFinite(imageId) || imageId <= 0 || !imageUrl) {
      throw new Error(getErrorMessage(res, '参考图上传失败'))
    }

    const current = items.value.find((item) => item.uid === uid)
    if (!isValidItem(current)) return
    current.status = 'success'
    current.imageId = imageId
    current.imageUrl = imageUrl
    current.datasetId = String(imageId)
    current.datasetUrl = imageUrl
    current.error = ''
    emitAllStates(true)
  } catch (error) {
    if (uploadSeqByUid.value[uid] !== nextSeq) return
    const current = items.value.find((item) => item.uid === uid)
    if (!isValidItem(current)) return
    const errorMsg = getErrorMessage(error, '参考图上传失败')
    current.status = 'error'
    current.error = errorMsg
    current.imageId = 0
    current.imageUrl = ''
    current.datasetId = ''
    current.datasetUrl = ''
    message.error(errorMsg)
    emitAllStates(false, errorMsg)
  }
}

function asNativeFile(value: unknown): File | null {
  if (!value || typeof value !== 'object') return null
  if (value instanceof File) return value
  if (value instanceof Blob) {
    const blob = value as Blob
    const name = (value as { name?: unknown }).name
    return new File([blob], typeof name === 'string' && name.trim() ? name : `upload-${Date.now()}.png`, {
      type: blob.type || 'application/octet-stream',
    })
  }
  return null
}

function resolveUploadFile(info: Parameters<NonNullable<UploadProps['onChange']>>[0]): File | null {
  const direct = asNativeFile((info.file as { originFileObj?: unknown })?.originFileObj)
  if (direct) return direct

  const fromCurrent = asNativeFile(info.file)
  if (fromCurrent) return fromCurrent

  const latest = info.fileList[info.fileList.length - 1]
  const fromListOrigin = asNativeFile((latest as { originFileObj?: unknown })?.originFileObj)
  if (fromListOrigin) return fromListOrigin

  return asNativeFile(latest)
}

const onUploadChange: UploadProps['onChange'] = (info) => {
  const fileObj = resolveUploadFile(info)
  if (!fileObj) return
  if (items.value.length >= maxCountSafe.value) return
  if (!validateUploadFileSize(fileObj)) return

  const uid = String(info.file?.uid || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  addLocalItem(fileObj, uid)
  void uploadFileByUid(uid)
}

function uploadFiles(files: File[]) {
  if (props.disabled || !files.length) return 0
  const remaining = Math.max(0, maxCountSafe.value - items.value.length)
  const acceptedFiles = filterFilesBySize(files).slice(0, remaining)
  acceptedFiles.forEach((file) => {
    const uid = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    addLocalItem(file, uid)
    void uploadFileByUid(uid)
  })
  return acceptedFiles.length
}

function onRemoveImage(uid: string) {
  const index = items.value.findIndex((item) => item.uid === uid)
  if (index === -1) return
  const [removed] = items.value.splice(index, 1)
  if (removed) revokeItemPreview(removed)
  delete uploadSeqByUid.value[uid]
  emitAllStates(false)
}

function onRetryUpload(item: UploadListItem) {
  if (item.status !== 'error') return
  void uploadFileByUid(item.uid)
}

function onPreviewImage(item: UploadListItem) {
  if (isVideoItem(item)) return
  const src = resolveItemDisplayUrl(item)
  if (!src) return
  previewModalUrl.value = src
  previewModalOpen.value = true
}

onBeforeUnmount(() => {
  cancelStackCollapse()
  clearAll()
})

defineExpose({
  clearAll,
  addRemoteUrl,
  uploadFiles,
})
</script>

<style scoped lang="scss">
.upload-list {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  &.stack-mode {
    --card-width: 60px;
    --card-height: 80px;
    --stack-offset: 16px;
    --stack-gap: 2px;
    position: relative;
    min-height: var(--card-height);
    width: calc(var(--card-width) + (var(--stack-count) - 1) * var(--stack-offset));
    overflow: visible;
    z-index: 2;
    transition: z-index 0.18s ease;

    .stack-item {
      position: absolute;
      inset: 0 auto auto 0;
      width: var(--card-width);
      height: var(--card-height);
      transform: translateX(calc(var(--stack-index) * var(--stack-offset)));
      transition: transform 0.2s ease;
    }

    .upload-wrapper,
    .upload-wrapper :deep(.ant-upload),
    .upload-wrapper :deep(.ant-upload-select) {
      width: var(--card-width);
      height: var(--card-height);
      display: block;
    }

    &:not(.is-expanded) .upload-wrapper.stack-add-wrapper {
      top: auto;
      left: auto;
      right: -2px;
      bottom: -2px;
      width: 28px;
      height: 28px;
      transform: none;
    }

    &:not(.is-expanded) .upload-wrapper.stack-add-wrapper :deep(.ant-upload),
    &:not(.is-expanded) .upload-wrapper.stack-add-wrapper :deep(.ant-upload-select) {
      width: 28px;
      height: 28px;
    }

    &:not(.is-expanded) .upload-wrapper.stack-add-wrapper .upload-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border-style: solid;
      border-color: #e3e4e8;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      padding: 0;
      .upload-tag {
        display: none;
      }
    }

    &:not(.is-expanded) .upload-wrapper.stack-add-wrapper .upload-plus {
      font-size: 18px;
      color: rgba(0, 0, 0, 0.7);
    }

    &.is-expanded {
      z-index: 30;
    }

    &.is-expanded .stack-item {
      transform: translateX(calc(var(--stack-index) * (var(--card-width) + var(--stack-gap))));
    }
  }
}

.upload-wrapper {
  display: block;

  :deep(.ant-upload) {
    display: block;
  }
}

.upload-btn {
  width: 60px;
  height: 80px;
  border-radius: 16px;
  border: 1px dashed #e8e7ea;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  overflow: hidden;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .upload-tag {
    color: rgb(105, 40, 254);
    font-family: "PingFang SC";
    font-size: 9px;
    font-weight: 400;
    height: 13px;
    left: 4px;
    line-height: 13px;
    position: absolute;
    text-align: center;
    top: 4px;
    z-index: 8;
    background: #e2ccff;
    border-radius: 8px;
    padding: 0 3px;
  }

  &:hover {
    background: #f3f3f5;
  }

  .upload-plus {
    font-size: 26px;
    line-height: 1;
    color: rgba(0, 0, 0, 0.65);
  }

  .upload-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: zoom-in;

    &.blurred {
      filter: blur(2px);
      transform: scale(1.04);
    }
  }

  .upload-video {
    background: #000;
  }

  .upload-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.32);
    z-index: 4;

    &.error {
      background: rgba(0, 0, 0, 0.48);
    }
  }

  .upload-overlay-text {
    color: #fff;
    font-size: 11px;
    line-height: 1;
    font-weight: 500;
  }

  .upload-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.45);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.85s linear infinite;
  }

  .upload-retry-btn {
    border: 1px solid rgba(255, 255, 255, 0.72);
    color: #fff;
    background: rgba(0, 0, 0, 0.22);
    border-radius: 10px;
    font-size: 10px;
    line-height: 16px;
    height: 18px;
    padding: 0 7px;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.4);
    }
  }

  .upload-remove-btn {
    position: absolute;
    right: 4px;
    top: 4px;
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.66);
    color: #fff;
    font-size: 14px;
    line-height: 16px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, background 0.2s ease;
    z-index: 6;

    &:hover {
      background: rgba(0, 0, 0, 0.82);
    }
  }

  &.has-image:hover .upload-remove-btn {
    opacity: 1;
    pointer-events: auto;
  }
}

:deep(.reference-preview-modal .ant-modal-body) {
  padding: 12px;
}

.reference-preview-modal-image {
  width: 100%;
  display: block;
  border-radius: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
