<template>
  <div class="generate-page-wrapper">
    <div class="generate-page">
      <div class="generate-container">
        <section class="history-section">
          <div ref="scrollContainerRef" class="scroll-container" @scroll="handleScroll">
            <article v-for="item in historyItems" :key="item.taskId" class="history-item">
              <div class="prompt-section">
                <div
                  v-if="item.inputImages.length"
                  class="input-image-stack"
                  :style="{ '--stack-count': String(item.inputImages.length) }"
                >
                  <div
                    v-for="(src, index) in item.inputImages"
                    :key="`${item.taskId}-input-${index}-${src}`"
                    class="input-image-stack-item"
                    :style="{ '--stack-index': String(index), zIndex: String(index + 1) }"
                  >
                    <video
                      v-if="isVideoUrl(src)"
                      class="input-image input-video"
                      :src="src"
                      muted
                      playsinline
                      preload="metadata"
                      @mouseenter="onInputVideoHoverEnter"
                      @mouseleave="onInputVideoHoverLeave"
                    />
                    <img v-else class="input-image" :src="src" :alt="`IMAGE${index + 1}`" loading="lazy" decoding="async" />
                  </div>
                </div>

                <div class="prompt-text-wrap">
                  <div class="prompt-text">
                    <template v-for="part in renderPromptParts(item)" :key="part.key">
                      <span v-if="part.type === 'dataset'" class="prompt-mention-token">
                        <video
                          v-if="part.mediaType === 'video'"
                          class="prompt-mention-video"
                          :src="part.datasetUrl"
                          muted
                          playsinline
                          preload="metadata"
                        />
                        <img v-else class="prompt-mention-thumb" :src="part.datasetUrl" :alt="part.label || '图片'" loading="lazy" decoding="async" />
                        <span class="prompt-mention-label">{{ part.label || '图片' }}</span>
                      </span>
                      <span v-else>{{ part.text }}</span>
                    </template>
                  </div>
                  <div v-if="isGeneratingHistoryItem(item)" class="prompt-estimate-tag">{{ estimateTimeText(item) }}</div>
                  <div v-if="isPlainPrompt(item)" class="prompt-tags">
                    <button type="button" class="prompt-tag" @click="applyPromptToPanel(item.prompt)">
                      <IconFont type="icon-shiyongtishici" />
                      <span>使用提示词</span>
                    </button>
                    <button type="button" class="prompt-tag" @click="copyPrompt(item.prompt)">
                      <IconFont type="icon-fuzhi" />
                      <span>复制</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="meta-info">
                <div class="meta-item">
                  <span>{{ item.modelLabel }}</span>
                </div>
                <div class="meta-item"><span>智能匹配</span></div>
                <div class="meta-item"><span>{{ item.sizeLabel }}</span></div>
                <div class="meta-item"><span>{{ displayCountLabel(item) }}</span></div>
                <div class="meta-item"><span>{{ item.ratioLabel }}</span></div>
                <div v-if="isFailedHistoryItem(item)" class="meta-item meta-status-failed">
                  <span>{{ failedTitle(item) }}</span>
                </div>
              </div>

              <div
                v-if="shouldShowResultGrid(item)"
                class="grid-wrap"
                :class="{ 'is-video-grid': item.mediaType === 'VIDEO', 'has-loading-slot': hasLoadingSlot(item) }"
                :style="{ '--result-aspect-ratio': aspectRatioCss(item.aspectRatio || item.ratioLabel) }"
              >
                <div
                  v-for="slotIndex in slotCount(item)"
                  :key="`${item.taskId}-slot-${slotIndex}`"
                  class="grid-item"
                  :class="[itemClass(slotIndex - 1, slotCount(item)), { 'is-loading-slot': !item.resultImages[slotIndex - 1] }]"
                  @click="item.resultImages[slotIndex - 1] ? openPreviewDetail(item.taskId, slotIndex - 1) : undefined"
                >
                  <div v-if="item.resultImages[slotIndex - 1]" class="grid-item-content">
                    <video
                      v-if="isVideoResult(item, item.resultImages[slotIndex - 1])"
                      class="grid-image grid-video"
                      :src="item.resultImages[slotIndex - 1]"
                      :controls="isVideoControlsVisible(item.taskId, slotIndex - 1)"
                      playsinline
                      preload="metadata"
                      @mouseenter="onVideoHoverEnter($event, item.taskId, slotIndex - 1)"
                      @mouseleave="onVideoHoverLeave($event, item.taskId, slotIndex - 1)"
                    />
                    <img
                      v-else
                      class="grid-image"
                      :src="item.resultImages[slotIndex - 1]"
                      :alt="`preview-${slotIndex}`"
                      loading="lazy"
                      decoding="async"
                    />

                    <!-- <div class="grid-image-footer-actions">
                      <button
                        type="button"
                        class="grid-image-action grid-image-action-disabled"
                        aria-label="超分"
                        @click.stop.prevent="noopAction"
                      >
                        <IconFont type="icon-Outlined-chaofenbianshuai" />
                      </button>
                      <a-tooltip title="参考生图" placement="top">
                        <button
                          type="button"
                          class="grid-image-action"
                          aria-label="作为参考图"
                          @click.stop.prevent="noopAction"
                        >
                          <IconFont type="icon-zuoweicankaotu" />
                        </button>
                      </a-tooltip>
                      <a-tooltip title="图生视频" placement="top">
                        <button
                          type="button"
                          class="grid-image-action"
                          aria-label="图生视频"
                          @click.stop.prevent="noopAction"
                        >
                          <IconFont type="icon-tushengshipin" />
                        </button>
                      </a-tooltip>
                    </div> -->
                  </div>

                  <div v-else class="grid-item-content pending-grid-content">
                  </div>
                </div>
                <div v-if="hasLoadingSlot(item)" class="pending-grid-overlay">
                  <div class="pending-title">{{ pendingTitle(item) }}</div>
                  <!-- <div class="pending-subtitle">{{ pendingSubtitle(item) }}</div> -->
                  <div v-if="pendingProgress(item)" class="pending-progress">{{ pendingProgress(item) }}</div>
                </div>
              </div>

              <div class="actions-row">
                <!-- <button type="button" class="action-button">
                  <IconFont type="icon-zhongxinbianji" />
                  <span>重新编辑</span>
                </button>
                <button type="button" class="action-button">
                  <IconFont type="icon-zaicishengcheng" />
                  <span>再次生成</span>
                </button> -->
                <button
                  v-if="item.historyId"
                  type="button"
                  class="action-button icon-only favorite-action"
                  :class="{ 'is-active': item.isFavorite }"
                  :aria-label="item.isFavorite ? '取消收藏' : '收藏'"
                  @click="toggleItemFavorite(item)"
                >
                  <span class="favorite-action-star" aria-hidden="true"></span>
                </button>
                <button
                  v-else
                  type="button"
                  class="action-button icon-only action-button-disabled favorite-action"
                  aria-label="收藏"
                  @click="notifyHistoryUnavailable"
                >
                  <span class="favorite-action-star" aria-hidden="true"></span>
                </button>
                <a-popconfirm
                  v-if="item.historyId"
                  placement="topRight"
                  title="确认删除该条历史吗？"
                  ok-text="删除"
                  cancel-text="取消"
                  @confirm="removeHistoryItem(item.taskId)"
                >
                  <button type="button" class="action-button icon-only" aria-label="删除">
                    <IconFont type="icon-shanchu" />
                  </button>
                </a-popconfirm>
                <button
                  v-else
                  type="button"
                  class="action-button icon-only action-button-disabled"
                  aria-label="删除"
                  @click="notifyHistoryUnavailable"
                >
                  <IconFont type="icon-shanchu" />
                </button>
              </div>
            </article>
            <div v-if="!historyItems.length && !historyLoading" class="history-empty">暂无历史任务，先去生成一条吧</div>
            <div v-if="historyLoadingMore" class="history-loading-more">加载更多中...</div>
            <div v-if="historyLoading && !historyItems.length" class="history-loading-more">历史记录加载中...</div>
            <!-- <div v-if="historyError && !historyItems.length" class="history-empty">{{ historyError }}</div> -->
          </div>
        </section>

        <section class="chat-section-wrapper">
          <div class="chat-section" :class="{'mini':showMini}">
            <button type="button" class="scroll-to-bottom" :class="{'mini':showMini}" @click="scrollToBottom">
              <span>回到底部</span>
              <IconFont type="icon-down" />
            </button>
            <GenerateTabPanel
              ref="generatePanelRef"
              class="generate-tab-panel"
              v-model:showMini="showMini"
              pollMode="external"
              modelsFetchMode="cache"
              @task-created="onTaskCreated"
            />
          </div>
        </section>

        <InspirationDetailModal v-model:open="detailOpen" :item="detailItem" />

        <footer class="page-footer">页面包含由AI生成的内容，其准确性和完整性无法保障，不代表我们的态度或观点</footer>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { createFromIconfontCN } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import GenerateTabPanel from '@/components/GenerateTabPanel.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import InspirationDetailModal, { type InspirationDetailItem } from '@/components/InspirationDetailModal.vue'
import { useGenerateTasksStore, type GenerateHistoryItem, type GenerateTaskCreatedPayload } from '@/stores/generateTasks'

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/c/font_5079523_nb5cyl1zajc.js',
})
type GenerateTabPanelExpose = {
  setPrompt: (value: string) => void
}

type PromptRenderPart = {
  key: string
  type: 'text' | 'dataset'
  text: string
  datasetUrl?: string
  label?: string
  mediaType?: 'image' | 'video'
}

const scrollContainerRef = ref<HTMLElement | null>(null)
const generatePanelRef = ref<GenerateTabPanelExpose | null>(null)
const showMini = ref(false)
const detailOpen = ref(false)
const detailItem = ref<InspirationDetailItem | null>(null)
const detailHistoryIndex = ref(-1)
const hoveredVideoSlotKey = ref<string | null>(null)
const generateTasksStore = useGenerateTasksStore()
const historyItems = computed(() => generateTasksStore.items)
const historyLoading = computed(() => generateTasksStore.historyLoading)
const historyLoadingMore = computed(() => generateTasksStore.historyLoadingMore)
// const historyError = computed(() => generateTasksStore.historyError)
let scrollRafId = 0

const updateScrollState = () => {
  scrollRafId = 0
  if (!scrollContainerRef.value) return
  const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.value
  showMini.value = scrollTop + clientHeight < scrollHeight - 1
  const remain = scrollHeight - (scrollTop + clientHeight)
  if (remain < 180) {
    void generateTasksStore.loadHistoryPage(false)
  }
}

const handleScroll = () => {
  if (scrollRafId) return
  scrollRafId = window.requestAnimationFrame(updateScrollState)
}

const scrollToBottom = () => {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTo({
      top: scrollContainerRef.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

function onTaskCreated(payload: GenerateTaskCreatedPayload) {
  generateTasksStore.enqueueTask(payload)
}

const itemClass = (idx: number, total: number) => ({
  'first-grid-item': idx === 0,
  'last-grid-item': idx === total - 1,
})

const slotCount = (item: GenerateHistoryItem) => {
  const expected = Number(item.expectedCount || 0)
  const actual = item.resultImages.length
  return Math.max(1, expected, actual)
}

const isFailedHistoryItem = (item: GenerateHistoryItem) => item.status === 'FAILED' || item.status === 'CANCELLED'

const failedTitle = (item: GenerateHistoryItem) => (item.status === 'CANCELLED' ? '生成已取消' : '生成失败')

const shouldShowResultGrid = (item: GenerateHistoryItem) => !isFailedHistoryItem(item) || item.resultImages.length > 0

const hasLoadingSlot = (item: GenerateHistoryItem) => shouldShowResultGrid(item) && slotCount(item) > item.resultImages.length

const isGeneratingHistoryItem = (item: GenerateHistoryItem) => item.status === 'PENDING' || item.status === 'RUNNING'

const estimateTimeText = (item: GenerateHistoryItem) => (item.mediaType === 'VIDEO' ? '预估 15-50 分钟' : '预估 5-20 分钟')

const pendingTitle = (item: GenerateHistoryItem) => {
  return item.mediaType === 'VIDEO' ? '生成视频中...' : '生成图片中...'
}

const pendingProgress = (item: GenerateHistoryItem) => {
  if (typeof item.progress !== 'number' || !Number.isFinite(item.progress)) return ''
  const value = Math.max(0, Math.min(100, item.progress))
  return `${Math.round(value * 100)}%`
}

const displayCountLabel = (item: GenerateHistoryItem) => {
  if (item.mediaType !== 'VIDEO') return item.countLabel
  const digits = String(item.countLabel || '').replace(/[^\d]/g, '')
  if (!digits) return item.countLabel || '-'
  return `${digits}秒`
}

const promptPartsCache = new Map<string, { signature: string; parts: PromptRenderPart[] }>()

const getPromptPartsSignature = (item: GenerateHistoryItem) => [
  item.prompt,
  item.promptDatasets.map((dataset) => `${dataset.datasetId}:${dataset.datasetUrl}:${dataset.label}:${dataset.mediaType || ''}`).join('|'),
].join('::')

const isVideoPromptDataset = (dataset: { datasetUrl?: string; label?: string; mediaType?: string } | undefined) => {
  if (!dataset) return false
  return dataset.mediaType === 'video' || dataset.label === '视频' || isVideoUrl(dataset.datasetUrl || '')
}

const renderPromptParts = (item: GenerateHistoryItem): PromptRenderPart[] => {
  const signature = getPromptPartsSignature(item)
  const cached = promptPartsCache.get(item.taskId)
  if (cached?.signature === signature) return cached.parts

  const text = String(item.prompt || '')
  if (!text) {
    promptPartsCache.set(item.taskId, { signature, parts: [] })
    return []
  }

  const datasetsById = new Map((item.promptDatasets || []).map((dataset) => [dataset.datasetId, dataset]))
  const parts: PromptRenderPart[] = []
  const tokenPattern = /@?\{([^{}]+)\}/g
  let cursor = 0
  let match = tokenPattern.exec(text)

  while (match) {
    if (match.index > cursor) {
      parts.push({
        key: `text-${cursor}`,
        type: 'text',
        text: text.slice(cursor, match.index),
      })
    }

    const datasetId = String(match[1] || '').trim()
    const dataset = datasetsById.get(datasetId)
    if (dataset?.datasetUrl) {
      const mediaType = isVideoPromptDataset(dataset) ? 'video' : 'image'
      parts.push({
        key: `dataset-${match.index}-${datasetId}`,
        type: 'dataset',
        text: match[0],
        datasetUrl: dataset.datasetUrl,
        label: mediaType === 'video' ? '视频' : '图片',
        mediaType,
      })
    } else {
      parts.push({
        key: `text-${match.index}`,
        type: 'text',
        text: match[0],
      })
    }

    cursor = match.index + match[0].length
    match = tokenPattern.exec(text)
  }

  if (cursor < text.length) {
    parts.push({
      key: `text-${cursor}`,
      type: 'text',
      text: text.slice(cursor),
    })
  }

  const result: PromptRenderPart[] = parts.length ? parts : [{ key: 'text-0', type: 'text', text }]
  promptPartsCache.set(item.taskId, { signature, parts: result })
  return result
}

const isPlainPrompt = (item: GenerateHistoryItem) => !renderPromptParts(item).some((part) => part.type === 'dataset')

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v|m3u8)(\?|#|$)/i.test(String(url || ''))

const isVideoResult = (item: GenerateHistoryItem, url: string) => item.mediaType === 'VIDEO' || isVideoUrl(url)

const onInputVideoHoverEnter = async (event: Event) => {
  const target = event.currentTarget as HTMLVideoElement | null
  if (!target) return
  try {
    await target.play()
  } catch {
    // noop
  }
}

const onInputVideoHoverLeave = (event: Event) => {
  const target = event.currentTarget as HTMLVideoElement | null
  if (!target) return
  target.pause()
  try {
    target.currentTime = 0
  } catch {
    // noop
  }
}

const videoSlotKey = (taskId: string, idx: number) => `${taskId}-${idx}`

const isVideoControlsVisible = (taskId: string, idx: number) => hoveredVideoSlotKey.value === videoSlotKey(taskId, idx)

const onVideoHoverEnter = async (event: Event, taskId: string, idx: number) => {
  const target = event.currentTarget as HTMLVideoElement | null
  if (!target) return
  hoveredVideoSlotKey.value = videoSlotKey(taskId, idx)
  try {
    target.currentTime = 0
    await target.play()
  } catch {
    // noop
  }
}

const onVideoHoverLeave = (event: Event, taskId: string, idx: number) => {
  const target = event.currentTarget as HTMLVideoElement | null
  if (!target) return
  if (hoveredVideoSlotKey.value === videoSlotKey(taskId, idx)) {
    hoveredVideoSlotKey.value = null
  }
  target.pause()
  target.currentTime = 0
}

const aspectRatioCss = (ratioLabel: string) => {
  const match = String(ratioLabel || '').match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/)
  if (!match) return '1/1'
  return `${match[1]}/${match[2]}`
}

const toDetailThumbnails = (item: GenerateHistoryItem) =>
  item.resultImages.map((src, imageIndex) => {
    const thumbType: 'VIDEO' | 'IMAGE' = isVideoResult(item, src) ? 'VIDEO' : 'IMAGE'
    return {
      id: `preview-${item.taskId}-${imageIndex}`,
      src,
      type: thumbType,
    }
  })

const switchDetailHistory = (step: -1 | 1) => {
  const list = historyItems.value
  if (!list.length) return
  let cursor = detailHistoryIndex.value
  for (let tries = 0; tries < list.length; tries += 1) {
    cursor = (cursor + step + list.length) % list.length
    if (list[cursor]?.resultImages?.length) {
      openDetailByHistoryIndex(cursor, 0)
      return
    }
  }
}

const openDetailByHistoryIndex = (historyIndex: number, mediaIndex = 0) => {
  const item = historyItems.value[historyIndex]
  if (!item || !item.resultImages.length) return
  const thumbnails = toDetailThumbnails(item)
  const safeIndex = Math.min(Math.max(mediaIndex, 0), item.resultImages.length - 1)
  const currentSrc = item.resultImages[safeIndex] || item.resultImages[0]
  const currentType = isVideoResult(item, currentSrc) ? 'VIDEO' : 'IMAGE'

  detailHistoryIndex.value = historyIndex
  detailItem.value = {
    type: currentType,
    src: currentSrc,
    thumbnails,
    avatar: item.inputImages[0],
    createdAt: item.createdAt,
    prompt: item.prompt,
    promptDatasets: item.promptDatasets,
    model: item.modelLabel,
    primaryTag: item.mediaType === 'VIDEO' ? '文生视频' : '文生图',
    ratioOrRes: item.ratioLabel,
    durationOrCount: displayCountLabel(item),
    sizeLabel: item.sizeLabel,
    onPrev: () => switchDetailHistory(-1),
    onNext: () => switchDetailHistory(1),
  }
  detailOpen.value = true
}

const openPreviewDetail = (taskId: string, idx: number) => {
  const historyIndex = historyItems.value.findIndex((row) => row.taskId === taskId)
  if (historyIndex < 0) return
  openDetailByHistoryIndex(historyIndex, idx)
}

const removeHistoryItem = (taskId: string) => {
  void (async () => {
    try {
      await generateTasksStore.deleteHistoryById(taskId)
      message.success('删除成功')
    } catch (error) {
      message.error(resolveErrorMessage(error, '删除失败'))
    }
  })()
}

const noopAction = () => {}
void noopAction

const notifyHistoryUnavailable = () => {
  message.warning('任务未入历史，暂不可操作')
}

const toggleItemFavorite = async (item: GenerateHistoryItem) => {
  if (!item.historyId) {
    notifyHistoryUnavailable()
    return
  }
  try {
    await generateTasksStore.toggleHistoryFavorite(item.taskId)
  } catch (error) {
    message.error(resolveErrorMessage(error, '收藏操作失败'))
  }
}

const resolveErrorMessage = (error: unknown, fallback: string) => {
  const maybe = error as { response?: { data?: { detail?: string; message?: string } }; message?: string; detail?: string }
  return maybe?.response?.data?.detail || maybe?.response?.data?.message || maybe?.detail || maybe?.message || fallback
}

const applyPromptToPanel = (text: string) => {
  const nextPrompt = String(text || '').trim()
  if (!nextPrompt) {
    message.warning('当前提示词为空')
    return
  }
  generatePanelRef.value?.setPrompt(nextPrompt)
}

const copyPrompt = async (text: string) => {
  const nextPrompt = String(text || '').trim()
  if (!nextPrompt) {
    message.warning('当前提示词为空')
    return
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(nextPrompt)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = nextPrompt
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    message.success('复制成功')
  } catch {
    message.error('复制失败，请重试')
  }
}

onMounted(() => {
  void generateTasksStore.loadHistoryPage(true)
})

onBeforeUnmount(() => {
  if (scrollRafId) {
    window.cancelAnimationFrame(scrollRafId)
    scrollRafId = 0
  }
})
</script>

<style scoped lang="scss">
.generate-page-wrapper {
  background: #fff;
  height: 100%;
  overflow: hidden;
  width: 100%;
}

.generate-page {
  background: #fff;
  height: 100%;
  margin: 0;
  max-width: none;
  min-width: 0;
  padding: 0;
  width: 100%;
}

.generate-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: visible;
  position: relative;
  width: 100%;
}

.history-section {
  flex: 1;
  height: 100%;
  overflow: visible;
  padding: 16px 0 24px;
}

.scroll-container {
  height: 100%;
  height: calc(100dvh - var(--sticky-banner-height, 0px));
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: 240px;
  transform: translateZ(0);
}

.history-item {
  margin: 0 180px;
  padding-bottom: 40px;
}

.prompt-section {
  display: flex;
  margin-bottom: 8px;
  z-index: 1;
}

.input-image-stack {
  --card-width: 48px;
  --card-height: 48px;
  --stack-offset: 10px;
  --stack-gap: 2px;
  flex-shrink: 0;
  height: var(--card-height);
  margin-right: 16px;
  position: relative;
  transition: z-index 0.18s ease;
  width: calc(var(--card-width) + (var(--stack-count) - 1) * var(--stack-offset));
  z-index: 2;

  &:hover {
    z-index: 30;
  }

  &:hover .input-image-stack-item {
    transform: translateX(calc(var(--stack-index) * (var(--card-width) + var(--stack-gap))));
  }
}

.input-image-stack-item {
  height: var(--card-height);
  inset: 0 auto auto 0;
  position: absolute;
  transform: translateX(calc(var(--stack-index) * var(--stack-offset)));
  transition: transform 0.2s ease;
  width: var(--card-width);
}

.input-image {
  border: 1px solid #fff;
  border-radius: 12px;
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.input-video {
  background: #000;
}

.input-image-check-icon {
  bottom: 0;
  height: 20px;
  position: absolute;
  right: -6px;
  width: 20px;
  z-index: 20;
}

.prompt-text-wrap {
  color: rgba(0, 0, 0, 0.88);
  flex: 1;
  font-size: 14px;
  line-height: 22px;
  min-width: 0;
  overflow-wrap: break-word;
  position: relative;
  word-break: break-word;
  display: flex;
  align-items: center;
}

.prompt-text {
  max-width: 80%;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  box-sizing: content-box;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.prompt-mention-token {
  align-items: center;
  background: #f5efff;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  gap: 6px;
  height: 28px;
  margin: 0 4px 0 0;
  padding: 0 8px 0 4px;
  vertical-align: middle;
}

.prompt-mention-thumb,
.prompt-mention-video {
  border-radius: 4px;
  flex-shrink: 0;
  height: 18px;
  object-fit: cover;
  width: 18px;
}

.prompt-mention-label {
  color: #8b52ff;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
}

.prompt-estimate-tag {
  align-items: center;
  background: #f5f5f7;
  border: 1px solid #ececf1;
  border-radius: 4px;
  color: rgba(0, 0, 0, 0.45);
  display: inline-flex;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 400;
  height: 22px;
  line-height: 18px;
  margin-left: 8px;
  padding: 0 8px;
  white-space: nowrap;
}

.prompt-tags {
  display: inline-flex;
  gap: 8px;
  margin-left: 8px;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.prompt-text-wrap:hover .prompt-tags {
  opacity: 1;
  pointer-events: auto;
}

.prompt-tag {
  align-items: center;
  background: #ececf1;
  border: 0;
  border-radius: 4px;
  color: #6b3cff;
  cursor: pointer;
  display: inline-flex;
  font-size: 11px;
  font-weight: 400;
  gap: 2px;
  height: 18px;
  justify-content: center;
  line-height: 18px;
  padding: 0 6px;
}

.prompt-tag:hover {
  background: #e2e3e8;
}

.meta-info {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-item {
  align-items: center;
  background: #f3f3f5;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.65);
  display: flex;
  font-size: 12px;
  gap: 4px;
  height: 28px;
  line-height: 20px;
  padding: 0 12px;
}

.meta-icon {
  height: 16px;
  width: 16px;
}

.meta-status-failed {
  background: rgba(245, 63, 63, 0.1);
  border: 1px solid rgba(245, 63, 63, 0.24);
  color: #f53f3f;
  font-weight: 600;
}

.grid-wrap {
  border-radius: 8px;
  display: grid;
  gap: 2px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 12px;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.grid-wrap.is-video-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-wrap.has-loading-slot {
  background: url('/wuli-generate-assets/pending-loading.webp') center / cover no-repeat;
}

.grid-item {
  aspect-ratio: var(--result-aspect-ratio);
  border-radius: 8px;
  min-width: 0;
  position: relative;
  user-select: none;
  width: 100%;
}

.grid-wrap.has-loading-slot .grid-item:not(.last-grid-item)::after {
  background: rgba(255, 255, 255, 0.72);
  bottom: 0;
  content: '';
  pointer-events: none;
  position: absolute;
  right: -1px;
  top: 0;
  width: 1px;
  z-index: 4;
}

.pending-grid-content {
  cursor: default;
  position: relative;
}

.pending-grid-overlay {
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 5;
}

.pending-title {
  background: rgba(23, 27, 31, 0.48);
  border-radius: 6px;
  color: #fff;
  display: inline-flex;
  font-size: 13px;
  font-weight: 600;
  left: 12px;
  line-height: 18px;
  max-width: calc(100% - 24px);
  padding: 6px 8px;
  position: absolute;
  top: 12px;
  white-space: nowrap;
}

.pending-subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  line-height: 20px;
  margin-top: -2px;
  max-width: 80%;
}

.pending-progress {
  background: rgba(255, 255, 255, 0.72);
  border-radius: 6px;
  bottom: 12px;
  color: rgba(0, 0, 0, 0.58);
  display: -webkit-box;
  font-size: 12px;
  font-weight: 500;
  left: 12px;
  line-height: 17px;
  max-width: calc(100% - 24px);
  overflow: hidden;
  padding: 5px 8px;
  position: absolute;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.is-loading-slot {
  cursor: default;
}

.grid-item-content {
  height: 100%;
  overflow: hidden;
  width: 100%;
}

.first-grid-item {
  .grid-item-content {
    border-bottom-left-radius: 8px;
    border-top-left-radius: 8px;
  }
}

.last-grid-item {
  .grid-item-content {
    border-bottom-right-radius: 8px;
    border-top-right-radius: 8px;
  }
}

.grid-image {
  cursor: pointer;
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.grid-video {
  background: #000;
}

.grid-item :deep(.anticon) {
  color: #fff;
  font-size: 16px;
}

.grid-image-footer-actions {
  align-items: center;
  backdrop-filter: blur(30px);
  background: rgba(52, 50, 58, 0.5);
  border-radius: 8px;
  color: #fff;
  display: flex;
  height: 0;
  overflow: hidden;
  position: absolute;
  right: 6px;
  transition: all 0.3s ease;
}

.grid-image-footer-actions {
  bottom: 8px;
}

.grid-item:hover .grid-image-footer-actions {
  height: 28px;
  padding: 2px;
}

.grid-image-action {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  height: 24px;
  justify-content: center;
  padding: 0;
  width: 24px;
}

.grid-image-action:hover {
  background: rgba(52, 50, 58, 0.4);
}

.grid-image-action-disabled,
.grid-image-action-disabled :deep(.anticon) {
  cursor: not-allowed !important;
}

.actions-row {
  align-items: center;
  display: flex;
  gap: 4px;
}

.action-button {
  align-items: center;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  gap: 4px;
  height: 32px;
  justify-content: center;
  line-height: 22px;
  padding: 0 12px;
}

.action-button.icon-only {
  padding: 0 8px;
  width: 32px;
}

.favorite-action-star {
  align-items: center;
  display: inline-flex;
  font-size: 15px;
  height: 16px;
  justify-content: center;
  line-height: 1;
  width: 16px;
}

.favorite-action-star::before {
  color: rgba(0, 0, 0, 0.65);
  content: '☆';
  transition: transform 0.2s ease, color 0.2s ease;
}

.favorite-action:hover .favorite-action-star::before {
  transform: scale(1.06);
}

.favorite-action.is-active .favorite-action-star::before {
  color: rgba(0, 0, 0, 0.88);
  content: '★';
}

.action-button-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.chat-section-wrapper {
  bottom: 20px;
  margin: 0 auto;
  overflow-anchor: none;
  position: sticky;
}

.chat-section {
  margin: 0 auto;
  min-width: 300px;
  position: relative;
  width: 792px;
  transition: width 0.3s ease;
  &.mini{
    width: 600px;
  }
}

.scroll-to-bottom {
  align-items: center;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 20px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  display: inline-flex;
  font-size: 12px;
  gap: 2px;
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 55;
  &.mini{
    top: -40px;
  }
}

.scroll-to-bottom:hover {
  color: rgba(0, 0, 0, 0.88);
}

.generate-tab-panel {
  margin: 0;
}

.page-footer {
  background-color: #fff;
  bottom: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 10px;
  left: 0;
  line-height: 20px;
  position: fixed;
  right: 0;
  text-align: center;
}

.history-loading-more {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 36px;
  padding: 12px 0 20px;
  text-align: center;
}

.history-empty {
  align-items: center;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  font-size: 14px;
  height: 200px;
  justify-content: center;
}
</style>
