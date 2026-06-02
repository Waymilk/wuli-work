<template>
  <a-modal
    :open="open"
    :footer="null"
    width="100vw"
    :mask="false"
    :closable="false"
    :style="{ top: '0', bottom: '0', height: '100vh', maxWidth: '100vw', paddingBottom: 0 }"
    wrapClassName="wuli-gallery-detail-modal"
    :bodyStyle="{ padding: '0' }"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="item" class="detail-shell">
      <div class="topSection">
        <div class="detail-media-panel">
          <video
            v-if="currentMedia.type === 'VIDEO'"
            ref="detailVideoRef"
            class="detail-media"
            :src="currentMedia.src"
            :controls="showVideoControls"
            autoplay
            muted
            playsinline
            preload="metadata"
            @mouseenter="onVideoMouseEnter"
            @mouseleave="onVideoMouseLeave"
          />
          <img v-else class="detail-media" :src="currentMedia.src" alt="detail" />
        </div>

        <div class="detail-rail">
          <button class="rail-btn rail-close" type="button" aria-label="关闭" @click="emit('update:open', false)">
            <CloseOutlined />
          </button>

          <div class="rail-nav">
            <button class="rail-btn rail-nav-btn" type="button" aria-label="上一条" @click="handlePrevClick">
              <IconFont type="icon-up" />
            </button>
            <button class="rail-btn rail-nav-btn" type="button" aria-label="下一条" @click="handleNextClick">
              <IconFont type="icon-down" />
            </button>
          </div>
        </div>

        <div class="detail-info-panel">
          <div class="detail-head">
            <span class="detail-time">{{ item.createdAt }}</span>
            <button class="info-btn detail-download" type="button" aria-label="下载" @click="item.onDownload?.()">
              <IconFont type="icon-xiazai" />
            </button>
          </div>

          <div v-if="item.type !== 'VIDEO' && thumbnailList.length" class="thumbnailList">
            <button
              v-for="(thumb, index) in thumbnailList"
              :key="thumb.id || `${thumb.src}-${index}`"
              class="thumbnailItem"
              :class="{ active: index === activeThumbIndex }"
              type="button"
              @click="selectThumbnail(index)"
            >
              <img class="thumbnailImage" :src="thumb.src" alt="thumbnail" />
              <span v-if="thumb.type === 'VIDEO'" class="thumbnailVideoIcon">
                <IconFont type="icon-Filled-bofang" />
              </span>
            </button>
          </div>

          <div class="detail-content">
            <div class="detail-title">提示词</div>
            <div class="detail-prompt">
              <button v-if="!hasPromptReference" class="detail-prompt-copy" type="button" aria-label="复制提示词" @click="copyPrompt">
                <IconFont type="icon-fuzhi" />
              </button>
              <span class="detail-prompt-text">
                <template v-for="part in promptParts" :key="part.key">
                  <span v-if="part.type === 'dataset'" class="prompt-mention-token">
                    <img class="prompt-mention-thumb" :src="part.datasetUrl" :alt="part.label || '图片'" />
                    <span class="prompt-mention-label">{{ part.label || '图片' }}</span>
                  </span>
                  <span v-else>{{ part.text }}</span>
                </template>
              </span>
            </div>

            <div class="detail-tags">
              <span v-for="tag in detailTags" :key="tag.key" class="detail-tag">
                <img v-if="tag.avatar" class="tag-avatar" :src="tag.avatar" alt="" />
                {{ tag.label }}
              </span>
              <span class="detail-tag">{{ sizeLabel }}</span>
            </div>
          </div>

          <div class="detail-actions" :class="{ single: detailActions.length === 1 }">
            <button
              v-for="action in detailActions"
              :key="action.key"
              class="detail-action-btn"
              :class="{ primary: action.primary }"
              type="button"
              @click="notifyFeatureUnavailable"
            >
              <IconFont :type="resolveActionIcon(action)" />
              <span>{{ action.label }}</span>
            </button>
          </div>

          <div v-if="bottomActions.length" class="bottomActionBar">
            <button
              v-for="action in bottomActions"
              :key="action.key"
              class="bottomActionBtn"
              type="button"
              @click="notifyFeatureUnavailable"
            >
              <IconFont :type="action.icon" />
              <span>{{ action.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { createFromIconfontCN } from '@ant-design/icons-vue'
import { CloseOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

export type InspirationDetailAction = {
  key: 'reference' | 'clone' | string
  label: string
  icon?: string
  primary?: boolean
  onClick?: () => void
}

export type InspirationDetailBottomAction = {
  key: 'img2video' | 'reedit' | 'regenerate' | string
  label: string
  icon: string
  onClick?: () => void
}

export type InspirationDetailThumbnail = {
  id?: string | number
  src: string
  type?: 'IMAGE' | 'VIDEO'
}

export type InspirationDetailPromptDataset = {
  datasetId: string
  datasetUrl: string
  label?: string
}

export type InspirationDetailItem = {
  type: 'IMAGE' | 'VIDEO'
  src: string
  prompt: string
  createdAt: string
  avatar?: string
  model?: string
  primaryTag?: string
  ratioOrRes?: string
  durationOrCount?: string
  sizeLabel?: string
  promptDatasets?: InspirationDetailPromptDataset[]
  thumbnails?: InspirationDetailThumbnail[]
  thumbnailList?: InspirationDetailThumbnail[]
  actions?: InspirationDetailAction[]
  bottomActions?: InspirationDetailBottomAction[]
  onPrev?: () => void
  onNext?: () => void
  onDownload?: () => void
  onImageToVideo?: () => void
  onReEdit?: () => void
  onRegenerate?: () => void
}

type DetailTag = {
  key: string
  label: string
  avatar?: string
}

type PromptRenderPart = {
  key: string
  type: 'text' | 'dataset'
  text: string
  datasetUrl?: string
  label?: string
}

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/c/font_5079523_nb5cyl1zajc.js',
})

const props = defineProps<{
  open: boolean
  item: InspirationDetailItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const activeThumbIndex = ref(0)
const detailVideoRef = ref<HTMLVideoElement | null>(null)
const showVideoControls = ref(false)

const thumbnailList = computed<InspirationDetailThumbnail[]>(() => {
  if (!props.item) return []
  const sourceList = props.item.thumbnails?.length ? props.item.thumbnails : props.item.thumbnailList
  if (sourceList?.length) {
    return sourceList.map((thumb) => ({
      ...thumb,
      type: thumb.type || props.item!.type,
    }))
  }
  return [{ src: props.item.src, type: props.item.type }]
})

const currentMedia = computed<InspirationDetailThumbnail>(() => {
  const list = thumbnailList.value
  if (!list.length) return { src: '', type: 'IMAGE' }
  return list[Math.min(activeThumbIndex.value, list.length - 1)]
})

const promptParts = computed<PromptRenderPart[]>(() => {
  const text = String(props.item?.prompt || '')
  if (!text) return []

  const datasetsById = new Map((props.item?.promptDatasets || []).map((dataset) => [dataset.datasetId, dataset]))
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
      parts.push({
        key: `dataset-${match.index}-${datasetId}`,
        type: 'dataset',
        text: match[0],
        datasetUrl: dataset.datasetUrl,
        label: dataset.label,
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

  return parts
})

const hasPromptReference = computed(() => promptParts.value.some((part) => part.type === 'dataset'))

watch(
  () => props.item,
  (next) => {
    if (!next) {
      activeThumbIndex.value = 0
      return
    }

    const idx = thumbnailList.value.findIndex((thumb) => thumb.src === next.src)
    activeThumbIndex.value = idx >= 0 ? idx : 0
  },
  { immediate: true },
)

const selectThumbnail = (index: number) => {
  activeThumbIndex.value = index
}

const handlePrevClick = () => {
  props.item?.onPrev?.()
}

const handleNextClick = () => {
  props.item?.onNext?.()
}

const onVideoMouseEnter = () => {
  showVideoControls.value = true
}

const onVideoMouseLeave = () => {
  showVideoControls.value = false
}

const copyPrompt = async () => {
  const text = String(props.item?.prompt || '').trim()
  if (!text) {
    message.warning('当前提示词为空')
    return
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
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

const notifyFeatureUnavailable = () => {
  message.info('功能暂未开放')
}

watch(
  [() => props.open, () => currentMedia.value.src, () => currentMedia.value.type],
  async ([open, src, type]) => {
    void src
    if (!open || type !== 'VIDEO') {
      showVideoControls.value = false
      return
    }
    showVideoControls.value = false
    await nextTick()
    const video = detailVideoRef.value
    if (!video) return
    try {
      video.currentTime = 0
      await video.play()
    } catch {
      // autoplay may be blocked
    }
  },
  { immediate: true },
)

const primaryTag = computed(() => {
  if (!props.item) return ''
  return props.item.primaryTag || (props.item.type === 'VIDEO' ? '首帧' : '文生图')
})

const detailTags = computed<DetailTag[]>(() => {
  if (!props.item) return []

  return [
    { key: 'primary', label: primaryTag.value, avatar: props.item.avatar },
    { key: 'model', label: props.item.model || 'Happy Horse 1.0' },
    { key: 'ratio', label: props.item.ratioOrRes || (props.item.type === 'VIDEO' ? '3:4' : '2K') },
    { key: 'duration', label: props.item.durationOrCount || (props.item.type === 'VIDEO' ? '5s' : '4张') },
  ]
})

const sizeLabel = computed(() => {
  if (!props.item) return ''
  return props.item.sizeLabel || '720 x 1280'
})

const detailActions = computed<InspirationDetailAction[]>(() => {
  if (!props.item) return []
  if (props.item.actions?.length) return props.item.actions

  if (props.item.type === 'VIDEO' || primaryTag.value.includes('首帧')) {
    return [{ key: 'clone', label: '一键同款', icon: 'icon-fuzhi' }]
  }

  return [
    { key: 'reference', label: '参考生图', icon: 'icon-zuoweicankaotu' },
    { key: 'clone', label: '一键同款', icon: 'icon-fuzhi' },
  ]
})

const bottomActions = computed<InspirationDetailBottomAction[]>(() => {
  if (!props.item) return []
  if (props.item.bottomActions?.length) return props.item.bottomActions

  const defaults: InspirationDetailBottomAction[] = [
    { key: 'reedit', label: '重新编辑', icon: 'icon-zhongxinbianji', onClick: props.item.onReEdit },
    { key: 'regenerate', label: '再次生成', icon: 'icon-zaicishengcheng', onClick: props.item.onRegenerate },
  ]

  if (props.item.type === 'IMAGE') {
    defaults.unshift({ key: 'img2video', label: '图生视频', icon: 'icon-tushengshipin', onClick: props.item.onImageToVideo })
  }

  return defaults
})

const resolveActionIcon = (action: InspirationDetailAction) => {
  if (action.icon) return action.icon
  if (action.key === 'reference') return 'icon-zuoweicankaotu'
  return 'icon-fuzhi'
}
</script>

<style scoped lang="scss">
:global(.wuli-gallery-detail-modal) {
  z-index: 998;
}

:global(.wuli-gallery-detail-modal .ant-modal) {
  margin: 0;
  max-width: 100vw;
  padding-bottom: 0;
}

:global(.wuli-gallery-detail-modal .ant-modal-content) {
  border-radius: 0;
  box-shadow: none;
  height: 100vh;
  margin-left: 88px;
  overflow: hidden;
  padding: 0;
}

:global(.wuli-gallery-detail-modal .ant-modal-body) {
  height: 100vh;
  padding: 0;
}

:deep(.ant-modal-wrap) {
  z-index: 998;
}

.detail-shell {
  background: #fff;
  height: 100vh;
  width: calc(100vw - 88px);
}

.topSection {
  display: grid;
  grid-template-columns: minmax(560px, 1fr) 64px 448px;
  height: 100vh;
}

.detail-media-panel {
  align-items: center;
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 26px 20px;
  position: relative;
}

.detail-media {
  border-radius: 12px;
  display: block;
  // height: calc(100vh - 180px);
  max-height: 860px;
  max-width: 100%;
  object-fit: contain;
  width: auto;
}

.thumbnailList {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 20px;
  max-height: 168px;
  overflow: auto;
}

.thumbnailItem {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  flex: 0 0 auto;
  height: 72px;
  overflow: hidden;
  padding: 0;
  position: relative;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 72px;

  &:hover {
    border-color: rgba(113, 90, 255, 0.45);
  }

  &.active {
    border-color: #715aff;
    box-shadow: 0 0 0 1px rgba(113, 90, 255, 0.16);
  }
}

.thumbnailImage {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.thumbnailVideoIcon {
  align-items: center;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 999px;
  color: #fff;
  display: flex;
  font-size: 11px;
  height: 20px;
  justify-content: center;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
}

.detail-rail {
  border-right: 1px solid #efefef;
  position: relative;
}

.rail-btn,
.info-btn {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.56);
  cursor: pointer;
  display: inline-flex;
  font-size: 18px;
  height: 28px;
  justify-content: center;
  line-height: 1;
  transition: background-color 0.2s ease, color 0.2s ease;
  width: 28px;

  &:hover {
    background: #f5f5f5;
    color: rgba(0, 0, 0, 0.88);
  }

  :deep(.anticon) {
    font-size: 16px;
    line-height: 1;
  }
}

.rail-close {
  left: 50%;
  position: absolute;
  top: 20px;
  transform: translateX(-50%);
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 22px;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.detail-info-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 24px;
}

.detail-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}

.detail-time {
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  line-height: 24px;
  white-space: nowrap;
}

.detail-content {
  min-height: 0;
}

.detail-title {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 22px;
  margin-bottom: 8px;
}

.detail-prompt {
  color: rgba(0, 0, 0, 0.88);
  display: flex;
  font-size: 16px;
  gap: 6px;
  align-items: center;
  line-height: 28px;
  margin: 0 0 16px;
  word-break: break-word;

}

.detail-prompt-copy {
  align-items: center;
  background: transparent;
  border: 0;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 28px;
  justify-content: center;
  margin: 0;
  padding: 0;
  width: 18px;

  :deep(.anticon),
  :deep(svg) {
    color: currentColor;
    font-size: 14px;
  }

  &:hover {
    color: #8b52ff;
  }
}

.detail-prompt-text {
  flex: 1;
  min-width: 0;
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

.prompt-mention-thumb {
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

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-size-row {
  display: flex;
}

.detail-tag {
  align-items: center;
  background: #f5f5f7;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.65);
  display: inline-flex;
  font-size: 12px;
  gap: 6px;
  line-height: 20px;
  min-height: 28px;
  padding: 4px 10px;
  white-space: nowrap;
}

.tag-avatar {
  border-radius: 50%;
  height: 20px;
  object-fit: cover;
  width: 20px;
}

.detail-actions {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: auto;
  padding-top: 14px;

  &.single {
    grid-template-columns: 1fr;
  }
}

.detail-action-btn,
.bottomActionBtn {
  align-items: center;
  background: #fff;
  border: 1px solid #d9d9dd;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  font-weight: 500;
  gap: 6px;
  height: 38px;
  justify-content: center;
  line-height: 22px;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;

  &:hover {
    background: #fff;
    border-color: #aeb4ff;
    box-shadow: 0 0 0 2px rgba(113, 90, 255, 0.08);
  }

  :deep(.anticon),
  :deep(svg) {
    color: rgba(0, 0, 0, 0.65);
    font-size: 16px;
    line-height: 1;
  }
}

.bottomActionBar {
  border-top: 1px solid #f0f0f2;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 14px;
  padding-top: 14px;
}

@media (max-width: 1680px) {
  .topSection {
    grid-template-columns: minmax(500px, 1fr) 64px 400px;
  }
}
</style>
