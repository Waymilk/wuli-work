<template>
  <section
    class="generate-panel"
    @dragenter="onPanelDragEnter"
    @dragover="onPanelDragOver"
    @dragleave="onPanelDragLeave"
    @drop="onPanelDrop"
  >
    <a-tabs :activeKey="mode" type="card" class="gen-tabs" @change="onModeChange" :class="{ 'mini': showMini }">
      <a-tab-pane key="IMAGE">
        <template #tab>
          <span class="tab-label" :class="{ active: mode === 'IMAGE' }">
            <img class="tab-icon-image" :src="mode === 'IMAGE' ? IMAGE_SELECTED_ICON : IMAGE_ICON" alt="图片" />
            <span>图片生成</span>
          </span>
        </template>
      </a-tab-pane>
      <a-tab-pane key="VIDEO">
        <template #tab>
          <span class="tab-label" :class="{ active: mode === 'VIDEO' }">
            <img class="tab-icon-image" :src="mode === 'VIDEO' ? VIDEO_SELECTED_ICON : VIDEO_ICON" alt="视频" />
            <span>视频生成</span>
          </span>
        </template>
      </a-tab-pane>
    </a-tabs>

    <div class="panel-body" :class="{'mini':showMini}">
      <div class="input-row">
        <ReferenceImageUpload
          v-for="slot in uploadSlots"
          :key="`${slot.key}-${referenceUploadRenderKey}`"
          :ref="(instance) => setUploadRef(slot.key, instance)"
          :is-video="slot.isVideo"
          :accept="slot.accept"
          :max-count="slot.maxCount"
          :disabled="isSubmitting"
          :tag-label="slot.tagLabel"
          @file-change="onReferenceFileChange(slot.key, $event)"
          @upload-result="onReferenceUploadResult(slot.key, $event)"
        />

        <div class="editor-wrap">
          <div
            ref="promptEditorRef"
            class="prompt-editor"
            :data-placeholder="placeholder"
            contenteditable="true"
            @input="onEditorInput"
            @focus="onTextareaFocus"
            @click="cacheEditorSelection"
            @keyup="cacheEditorSelection"
            @mouseup="cacheEditorSelection"
            @keydown="onEditorKeydown"
          ></div>
        </div>
      </div>

      <div class="control-row">
        <div class="left-controls" style="position: relative">
          <a-popover
            v-model:open="modelOpen"
            trigger="click"
            placement="bottomLeft"
            :autoAdjustOverflow="true"
            overlayClassName="wuli-ant-popover wuli-model-popover"
            :arrow="false"
            @openChange="onPopoverChange('model', $event)"
            :getPopupContainer="getPopupContainer"
          >
            <template #content>
              <div class="model-popover-inner" :class="{ 'is-image': !isVideo, 'is-video': isVideo }">
                <div class="model-pane-tabs">
                  <button
                    v-for="tab in mode === 'IMAGE' ? imageModelTabs : videoModelTabs"
                    :key="tab.key"
                    class="pane-tab"
                    :class="{ active: tab.key === activeModelTab }"
                    @click="setModelTab(tab.key)"
                  >
                    <IconFont :type="tab.icon" class="pane-icon" />
                    <span>{{ tab.label }}</span>
                  </button>
                </div>

                <div class="model-list">
                  <div v-if="isModelsLoading" class="model-empty">
                    <span>模型加载中...</span>
                  </div>
                  <div v-else-if="modelsLoadError || !visibleModels.length" class="model-empty">
                    <span>{{ modelsLoadError || '暂无可用模型' }}</span>
                    <button class="retry-btn" @click="onRetryLoadModels">重试</button>
                  </div>
                  <button
                    v-else
                    v-for="modelItem in visibleModels"
                    :key="modelItem.id"
                    class="model-card"
                    :class="{ active: modelItem.id === currentModel?.id }"
                    @click="selectModel(modelItem)"
                  >
                    <img class="model-card-icon" :src="modelItem.icon" :alt="modelItem.name" />
                    <div class="meta">
                      <div class="title-row">
                        <span class="title">{{ modelItem.name }}</span>
                        <span class="tag">{{ modelItem.vendor }}</span>
                      </div>
                      <div v-if="modelItem.desc" class="desc">{{ modelItem.desc }}</div>
                      <div v-if="modelCapTags(modelItem).length" class="cap-tags">
                        <span
                          v-for="tag in modelCapTags(modelItem)"
                          :key="tag.key"
                          class="cap-tag"
                          :class="{ selected: isCapTagSelected(tag) }"
                        >
                          <img
                            v-if="tag.iconSrc"
                            class="cap-tag-svg"
                            :src="tag.iconSrc"
                            :alt="tag.label"
                          />
                          <IconFont v-else :type="capTagIcon(tag.label)" class="cap-tag-icon" />
                          <span>{{ tag.label }}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </template>

            <button class="control model" :class="{ open: modelOpen }" :disabled="!hasModeModels || isModelsLoading">
              <span class="model-selected-label">
                <img :src="selectedModelIcon" :alt="selectedModelName" />
                <span class="name">{{ selectedModelName }}</span>
              </span>
              <IconFont type="icon-down" class="arrow" />
            </button>
          </a-popover>

          <a-select
            v-if="isVideo"
            v-model:value="selectedVideoSettingFeature"
            class="setting"
            popupClassName="video-setting-dropdown"
            @change="onVideoSettingChange"
          >
            <a-select-option
              v-for="option in videoSettingOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
              :class="{ 'video-setting-disabled-option': option.disabled }"
            >
              <a-tooltip
                v-if="option.disabled"
                title="请切换支持该功能的模型后使用"
                placement="right"
              >
                <span class="video-setting-option disabled">
                  <img class="video-setting-icon" :src="option.icon" :alt="option.label" />
                  <span>{{ option.label }}</span>
                </span>
              </a-tooltip>
              <span v-else class="video-setting-option">
                <img class="video-setting-icon" :src="option.icon" :alt="option.label" />
                <span>{{ option.label }}</span>
              </span>
            </a-select-option>
            <template #optionLabel="{ label, value }">
              <span class="video-setting-option selected">
                <img class="video-setting-icon" :src="videoSettingIconByValue(String(value))" :alt="String(label)" />
                <span>{{ label }}</span>
              </span>
            </template>
            <template #suffixIcon><IconFont type="icon-down" class="arrow" /></template>
          </a-select>

          <a-popover
            v-model:open="smartOpen"
            trigger="click"
            placement="bottomLeft"
            overlayClassName="wuli-ant-popover wuli-smart-popover"
            :arrow="false"
            @openChange="onPopoverChange('smart', $event)"
            :getPopupContainer="getPopupContainer"
          >
            <template #content>
              <div class="smart-popover-inner" :class="{ 'is-image': !isVideo, 'is-video': isVideo }">
                <div v-if="ratioOptions.length" class="block">
                  <div class="label">{{ isVideo ? '视频比例' : '图片比例' }}</div>
                  <div class="options ratio" :class="{ image: !isVideo }">
                    <button
                      v-for="ratio in ratioOptions"
                      :key="ratio"
                      class="opt ratio-opt"
                      :class="{ active: ratio === selectedRatio }"
                      @click="selectedRatio = ratio"
                    >
                      <span class="ratio-icon">
                        <IconFont :type="ratioIconType(ratio)" class="ratio-smart-icon" />
                      </span>
                      <span>{{ ratioDisplayText(ratio) }}</span>
                    </button>
                  </div>
                </div>

                <div v-if="sizeOptions.length" class="block">
                  <div class="label">分辨率</div>
                  <div class="options">
                    <button
                      v-for="size in sizeOptions"
                      :key="size"
                      class="opt size-opt"
                      :class="{ active: size === selectedSize }"
                      @click="selectedSize = size"
                    >
                      {{ size }}
                    </button>
                  </div>
                </div>

                <div v-if="countOptions.length" class="block">
                  <div class="label">{{ isVideo ? '视频时长' : '生成数量' }}</div>
                  <div class="options split3" :class="{ image: !isVideo }">
                    <button
                      v-for="qty in countOptions"
                      :key="qty"
                      class="opt"
                      :class="{ active: qty === selectedCount }"
                      @click="selectedCount = qty"
                    >
                      {{ countDisplayText(qty) }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <button class="control smart" :class="{ open: smartOpen }" :disabled="!hasSmartOptions">
              <span class="pill-text">
                <span class="smart-label">
                  <IconFont :type="ratioIconType(smartLabelText)" class="pill-icon" />
                  <span>{{ smartLabelText }}</span>
                </span>
                <template v-for="(value, index) in smartPillValues" :key="`pill-${index}-${value}`">
                  <span class="pill-divider"></span>
                  <span>{{ value }}</span>
                </template>
              </span>
              <IconFont type="icon-down" class="arrow" />
            </button>
          </a-popover>

          <a-popover
            v-model:open="atOpen"
            trigger="click"
            placement="bottomLeft"
            overlayClassName="wuli-ant-popover wuli-at-popover"
            :arrow="false"
            @openChange="onPopoverChange('at', $event)"
            :getPopupContainer="getPopupContainer"
          >
            <template #content>
              <div class="at-popover-inner">
                <div v-if="mentionDatasets.length" class="at-list">
                  <button
                    v-for="item in mentionDatasets"
                    :key="item.uid"
                    type="button"
                    class="at-list-item"
                    @click="onSelectMention(item)"
                  >
                    <video
                      v-if="item.mediaType === 'video'"
                      class="at-list-thumb"
                      :src="item.datasetUrl"
                      muted
                      playsinline
                      preload="metadata"
                    />
                    <img v-else class="at-list-thumb" :src="item.datasetUrl" :alt="item.label" />
                    <span class="at-list-text">{{ item.mediaType === 'video' ? '视频' : '图片' }}</span>
                  </button>
                </div>
                <a-empty v-else description="暂无图片或视频" />
              </div>
            </template>

            <button class="control at-btn" :class="{ open: atOpen }">
              <IconFont type="icon-a-Outlined-" class="at-icon" />
            </button>
          </a-popover>
        </div>

        <div class="right-controls">
          <!-- <a-button type="text" class="translate" @click="onTranslate">
            <IconFont type="icon-fanyi" class="translate-icon" />
            <span>翻译</span>
          </a-button> -->

          <a-tooltip :title="generateTooltipTitle" placement="top">
            <span class="generate-tooltip-wrap">
              <a-button
                type="primary"
                class="generate"
                :class="{ 'has-cost': showGenerateCost }"
                :loading="isSubmitting"
                :disabled="isGenerateButtonDisabled"
                @click="onGenerate"
              >
                <transition name="generate-label" mode="out-in">
                  <span :key="generateButtonLabelKey" class="generate-label-wrap">
                    <span v-if="isSubmitting">提交中</span>
                    <span v-else-if="showGenerateCost" class="generate-cost">
                      <img :src="creditsIcon" alt="积分" class="credits-icon" />
                      <span>{{ generateCostText }}</span>
                    </span>
                    <span v-else>生成</span>
                  </span>
                </transition>
              </a-button>
            </span>
          </a-tooltip>
        </div>
      </div>
    </div>

    <div v-if="isSubmitting" class="submit-loading-mask">
      <div class="submit-loading-card">
        <a-spin size="large" />
        <div class="submit-loading-title">正在提交生成任务</div>
        <div class="submit-loading-desc">后端处理可能需要约 1 分钟，请稍候</div>
      </div>
    </div>

    <div v-if="isPanelDraggingFile && !isSubmitting" class="panel-drag-mask">
      <div class="panel-drag-card">拖拽到此处上传</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createFromIconfontCN } from '@ant-design/icons-vue'
import request from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import creditsIcon from '@/assets/credits.svg'
import { useModelsStore } from '@/stores/models'
import ReferenceImageUpload from './ReferenceImageUpload.vue'

import type {
  BackendModelConfig,
  BackendModelRecord,
  BackendModelOptions,
  BackendModelPricingRule,
  ModelOptionPrimitive,
  ModelOptionValue,
} from '@/types/backend-model'

type ModeKey = 'IMAGE' | 'VIDEO'
type PopoverName = 'model' | 'smart' | 'at'
type ImgModelTab = 'txt2img' | 'ref2img'
type VidModelTab = 'txt2video' | 'img2video' | 'vid2video'
type ModelTabKey = ImgModelTab | VidModelTab
type PollMode = 'internal' | 'external'
type ModelsFetchMode = 'explore' | 'cache'
type UploadSlotKey = 'reference' | 'videoReference' | 'firstFrame' | 'lastFrame'
type VideoSettingFeature = 'first_frame' | 'first_last_frame' | 'multimodal_ref'
type UploadSlotConfig = { key: UploadSlotKey; isVideo: boolean; maxCount: number; tagLabel: string; accept: string }
type CapTagItem = { key: string; label: string; feature?: VideoSettingFeature; iconSrc?: string }
type PrefillReferenceAsset = { imageId: number; url: string; mediaType: 'image' | 'video' }
type PricingUnit = 'per_image' | 'per_second' | 'per_generation'
type PrefillVideoPathPayload = {
  prompt?: string
  modelId?: number
  modelName?: string
  taskType?: string
  runwayModel?: string
  aspectRatio?: string
  resolution?: string
  duration?: string
  referenceAssets?: PrefillReferenceAsset[]
}
type PrefillImagePathPayload = {
  prompt?: string
  modelId?: number
  modelName?: string
  taskType?: string
  runwayModel?: string
  aspectRatio?: string
  imageSize?: string
  numImages?: string
  referenceAssets?: PrefillReferenceAsset[]
}
type ReferenceUploadExpose = {
  clearAll: () => void
  addRemoteUrl: (url: string, options?: { imageId?: number; mediaType?: 'image' | 'video' }) => boolean
  uploadFiles: (files: File[]) => number
}

interface ModelPricingRule {
  resolution: string
  unit: PricingUnit
  unitCost: number
  minQuantity?: number
  maxQuantity?: number
}

const props = withDefaults(defineProps<{
  showMini?: boolean
  pollMode?: PollMode
  modelsFetchMode?: ModelsFetchMode
}>(), {
  pollMode: 'internal',
  modelsFetchMode: 'cache',
})

const emit = defineEmits<{
  (e: 'update:showMini', value: boolean): void
  (e: 'task-created', payload: TaskCreatedEventPayload): void
  (e: 'task-progress', payload: { taskId: string; status: string; progress?: number; progressText?: string }): void
  (e: 'task-succeeded', payload: { taskId: string; artifacts: TaskArtifact[] }): void
  (e: 'task-failed', payload: { taskId: string; status: string; error: string }): void
}>()

const TASK_REQUEST_TIMEOUT_MS = 5 * 60 * 1000
const authStore = useAuthStore()

interface ModelItem {
  id: string
  modelId: number
  taskType?: string
  runwayModel?: string
  costPerGeneration?: number
  pricingRules: ModelPricingRule[]
  isActive: boolean
  name: string
  vendor: string
  desc?: string
  icon: string
  caps: Array<'text' | 'ref' | 'video'>
  tags?: string[]
  options: {
    ratios: string[]
    imageSizes: string[]
    numImages: string[]
    resolutions: string[]
    durations: string[]
    specialFeatures: string[]
    refImageFormats: string[]
    maxRefImages?: number
  }
}

interface ImageTaskPayload {
  prompt: string
  model_id: number
  task_type: string
  model_name: string
  aspect_ratio: string
  num_images: number
  image_size: string
  image_ids?: number[]
}

interface VideoTaskPayload {
  prompt: string
  model_id: number
  task_type: string
  model_name: string
  aspect_ratio?: string
  resolution?: string
  duration?: string
  image_ids?: number[]
  first_frame_image_id?: number
  last_frame_image_id?: number
}

type TaskCreatePayload = ImageTaskPayload | VideoTaskPayload

interface TaskCreatedEventPayload {
  taskId: string
  payload: TaskCreatePayload
  mediaType: 'IMAGE' | 'VIDEO'
  displayMeta: {
    prompt: string
    modelLabel: string
    ratioLabel: string
    sizeLabel: string
    countLabel: string
  }
  inputImages?: string[]
  promptDatasets?: Array<{ datasetId: string; datasetUrl: string; label: string; mediaType?: 'image' | 'video' }>
  expectedCount: number
}

interface TaskCreateResponse {
  success?: boolean
  task_id?: string | number
  job_id?: string | number
  status?: string
  error?: unknown
  detail?: string
}

interface UploadResultEventPayload {
  uploading: boolean
  success: boolean
  imageId?: number
  imageUrl?: string
  datasetId?: string
  datasetUrl?: string
  datasets?: Array<{ uid: string; imageId?: number; imageUrl?: string; datasetId: string; datasetUrl: string }>
  uploadingCount?: number
  successCount?: number
  error?: string
}

interface UploadFileChangeEventPayload {
  file: File | null
  files?: File[]
  previewUrl?: string
  displayUrls?: string[]
  items?: Array<{ uid: string; status: 'uploading' | 'success' | 'error'; imageId?: number; imageUrl?: string; datasetId?: string; datasetUrl?: string; displayUrl: string; error?: string }>
}

interface MentionDatasetItem {
  uid: string
  imageId: number
  imageUrl: string
  datasetId: string
  datasetUrl: string
  label: string
  mediaType: 'image' | 'video'
}

interface TaskArtifact {
  id?: string
  url?: string
  preview_urls?: string[]
  filename?: string
  file_size?: number
  metadata?: Record<string, unknown>
}

interface TaskStatusResponse {
  success?: boolean
  status?: string
  progress?: number
  progress_text?: string
  artifacts?: TaskArtifact[]
  error?: unknown
  detail?: string
}

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/c/font_5079523_nb5cyl1zajc.js',
})
const IMAGE_ICON = 'https://img.alicdn.com/imgextra/i3/O1CN01jlGaAx1HPYBGQadnN_!!6000000000750-55-tps-16-16.svg'
const IMAGE_SELECTED_ICON = 'https://img.alicdn.com/imgextra/i2/O1CN01rrNjSw28BVfxvHmCO_!!6000000007894-55-tps-16-16.svg'
const VIDEO_ICON  = 'https://img.alicdn.com/imgextra/i4/O1CN01ynewsn217CdigVvUG_!!6000000006937-55-tps-16-16.svg'
const VIDEO_SELECTED_ICON = 'https://img.alicdn.com/imgextra/i1/O1CN01ADDbzu1mKk75ZHjet_!!6000000004936-55-tps-16-16.svg'
const QWEN_ICON = 'https://img.alicdn.com/imgextra/i1/O1CN019kduFV1WbCTG2RP8P_!!6000000002806-55-tps-16-16.svg'
const VIDEO_MODEL_ICON = 'https://img.alicdn.com/imgextra/i2/O1CN01CHQQzM1otcX7xR6gM_!!6000000005278-55-tps-16-16.svg'
const VIDEO_SETTING_FEATURES: Array<{ value: VideoSettingFeature; label: string; icon: string }> = [
  { value: 'first_frame', label: '首帧', icon: '/wuli-icons/model-settings/first-frame.svg' },
  { value: 'first_last_frame', label: '首尾帧', icon: '/wuli-icons/model-settings/first-last-frame.svg' },
  { value: 'multimodal_ref', label: '全能参考', icon: '/wuli-icons/model-settings/omni-reference.svg' },
]

const mode = ref<ModeKey>('IMAGE')
const prompt = ref('')
const promptEditorRef = ref<HTMLDivElement | null>(null)
const mentionDatasets = ref<MentionDatasetItem[]>([])
const selectedMentionIds = ref<string[]>([])
let cachedSelection: Range | null = null

const modelOpen = ref(false)
const smartOpen = ref(false)
const atOpen = ref(false)

const imageModelTab = ref<ImgModelTab>('txt2img')
const videoModelTab = ref<VidModelTab>('txt2video')
const selectedVideoSettingFeature = ref<VideoSettingFeature>('first_frame')
const lastEnabledVideoSettingFeature = ref<VideoSettingFeature>('first_frame')

const selectedRatio = ref('auto')
const selectedSize = ref('')
const selectedCount = ref('4')

const imageModelTabs: Array<{ key: ImgModelTab; label: string; icon: string }> = [
  { key: 'txt2img', label: '文生图', icon: 'icon-Outlined-wensheng' },
  { key: 'ref2img', label: '参考生图', icon: 'icon-zuoweicankaotu' },
]
const videoModelTabs: Array<{ key: VidModelTab; label: string; icon: string }> = [
  { key: 'txt2video', label: '文生视频', icon: 'icon-Outlined-wensheng' },
  { key: 'img2video', label: '图生视频', icon: 'icon-a-Outlined-' },
  { key: 'vid2video', label: '视频生视频', icon: 'icon-down' },
]

const modelsStore = useModelsStore()
const imageModels = ref<ModelItem[]>([])
const videoModels = ref<ModelItem[]>([])
const currentModel = ref<ModelItem | null>(null)
const isModelsLoading = computed(() => modelsStore.isLoading)
const modelsLoadError = computed(() => modelsStore.error)

const isVideo = computed(() => mode.value === 'VIDEO')
const placeholder = computed(() => isVideo.value
  ? '试试描述一段简短的故事情节（按 Enter 发送，Shift+Enter 换行）'
  : '请输入你的创意（按 Enter 发送，Shift+Enter 换行）')

const activeModelTab = computed<ModelTabKey>(() => (mode.value === 'IMAGE' ? imageModelTab.value : videoModelTab.value))
const modeModels = computed(() => (mode.value === 'IMAGE' ? imageModels.value : videoModels.value))
const hasModeModels = computed(() => modeModels.value.length > 0)
const selectedModelName = computed(() => currentModel.value?.name || (isModelsLoading.value ? '加载中...' : '请选择模型'))
const selectedModelIcon = computed(() => currentModel.value?.icon || (mode.value === 'IMAGE' ? QWEN_ICON : VIDEO_MODEL_ICON))

const visibleModels = computed(() => {
  if (mode.value === 'IMAGE') {
    return imageModels.value.filter((item) => (imageModelTab.value === 'txt2img' ? item.caps.includes('text') : item.caps.includes('ref')))
  }
  if (videoModelTab.value === 'txt2video') return videoModels.value.filter((item) => item.caps.includes('text'))
  if (videoModelTab.value === 'img2video') return videoModels.value.filter((item) => item.caps.includes('ref'))
  return videoModels.value.filter((item) => item.caps.includes('video'))
})

const ratioOptions = computed(() => currentModel.value?.options.ratios || [])
const sizeOptions = computed(() => (isVideo.value
  ? (currentModel.value?.options.resolutions || [])
  : (currentModel.value?.options.resolutions || [])))
const countOptions = computed(() => (isVideo.value
  ? (currentModel.value?.options.durations || [])
  : (currentModel.value?.options.numImages || [])))
const hasSmartOptions = computed(() => ratioOptions.value.length > 0 || sizeOptions.value.length > 0 || countOptions.value.length > 0)
const smartLabelText = computed(() => ratioDisplayText(selectedRatio.value || 'auto'))
const smartPillValues = computed(() => [selectedSize.value, countDisplayText(selectedCount.value)].filter((item) => Boolean(item)))
const hasPrompt = computed(() => hasDescriptionText(prompt.value))
const uploadStates = ref<Record<UploadSlotKey, {
  files: File[]
  uploading: boolean
  error: string
  imageIds: number[]
  datasets: UploadResultEventPayload['datasets']
}>>({
  reference: { files: [], uploading: false, error: '', imageIds: [], datasets: [] },
  videoReference: { files: [], uploading: false, error: '', imageIds: [], datasets: [] },
  firstFrame: { files: [], uploading: false, error: '', imageIds: [], datasets: [] },
  lastFrame: { files: [], uploading: false, error: '', imageIds: [], datasets: [] },
})
const generateCost = computed(() => resolveSelectedGenerateCost())
const hasGenerateCost = computed(() => typeof generateCost.value === 'number')
const showGenerateCost = computed(() => !isSubmitting.value && hasPrompt.value && Boolean(currentModel.value))
const generateButtonLabelKey = computed(() => {
  if (isSubmitting.value) return 'submitting'
  if (showGenerateCost.value) return `cost-${generateCost.value}`
  return 'default'
})
const generateCostText = computed(() => {
  if (!hasGenerateCost.value) return '--'
  return String(generateCost.value)
})
const currentUserCredits = computed(() => parseUserCredits(authStore.user))
const referenceImageFile = ref<File | null>(null)
const referenceUploadRenderKey = ref(0)
const uploadRefs = ref<Partial<Record<UploadSlotKey, ReferenceUploadExpose>>>({})
const isPanelDraggingFile = ref(false)
const panelDragDepth = ref(0)
const baseReferenceState = computed(() => uploadStates.value.reference)
const videoReferenceState = computed(() => uploadStates.value.videoReference)
const firstFrameState = computed(() => uploadStates.value.firstFrame)
const lastFrameState = computed(() => uploadStates.value.lastFrame)
const modelSpecialFeatures = computed(() => currentModel.value?.options.specialFeatures || [])
const normalizedModelSpecialFeatures = computed(() => new Set(
  modelSpecialFeatures.value.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean),
))
const videoSettingOptions = computed(() => VIDEO_SETTING_FEATURES.map((option) => ({
  ...option,
  disabled: !normalizedModelSpecialFeatures.value.has(option.value),
})))
const firstEnabledVideoSettingOption = computed(() => videoSettingOptions.value.find((option) => !option.disabled))
const shouldShowVideoUploads = computed(() => isVideo.value && Boolean(currentModel.value) && videoSettingOptions.value.some((option) => !option.disabled))
const imageReferenceUploadAccept = computed(() => formatAcceptFromModelFormats(currentModel.value?.options.refImageFormats || [], 'image'))
const videoReferenceUploadAccept = computed(() => formatAcceptFromModelFormats(currentModel.value?.options.refImageFormats || [], 'video'))
const imageReferenceMaxCount = computed(() => Math.max(1, currentModel.value?.options.maxRefImages || 3))
const uploadSlots = computed<UploadSlotConfig[]>(() => {
  if (!isVideo.value) {
    return [{ key: 'reference', isVideo: false, maxCount: imageReferenceMaxCount.value, tagLabel: '', accept: imageReferenceUploadAccept.value }]
  }
  if (!shouldShowVideoUploads.value) return []
  if (selectedVideoSettingFeature.value === 'first_frame') {
    return [{ key: 'firstFrame', isVideo: true, maxCount: 1, tagLabel: '首帧', accept: imageReferenceUploadAccept.value }]
  }
  if (selectedVideoSettingFeature.value === 'first_last_frame') {
    return [
      { key: 'firstFrame', isVideo: true, maxCount: 1, tagLabel: '首帧', accept: imageReferenceUploadAccept.value },
      { key: 'lastFrame', isVideo: true, maxCount: 1, tagLabel: '尾帧', accept: imageReferenceUploadAccept.value },
    ]
  }
  if (selectedVideoSettingFeature.value === 'multimodal_ref') {
    return [
      { key: 'reference', isVideo: false, maxCount: imageReferenceMaxCount.value, tagLabel: '图片', accept: imageReferenceUploadAccept.value },
      { key: 'videoReference', isVideo: true, maxCount: 1, tagLabel: '视频', accept: videoReferenceUploadAccept.value },
    ]
  }
  return []
})
const canGenerate = computed(() => (
  hasPrompt.value
  && Boolean(currentModel.value)
  && !isModelsLoading.value
))
const isInsufficientCredits = computed(() => {
  if (!authStore.isLoggedIn) return false
  if (!hasGenerateCost.value) return false
  if (currentUserCredits.value === undefined) return false
  return currentUserCredits.value < Number(generateCost.value)
})
const isGenerateButtonDisabled = computed(() => !canGenerate.value || isSubmitting.value || isInsufficientCredits.value)
const generateTooltipTitle = computed(() => {
  if (!hasPrompt.value) return '请输入描述内容'
  if (isInsufficientCredits.value) return '积分不足'
  return ''
})
const isSubmitting = ref(false)
const isPolling = ref(false)
const currentTaskId = ref<string | null>(null)
const pollTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const pollAbortFlag = ref(false)

function getPopupContainer(trigger: HTMLElement): HTMLElement {
  return trigger.parentElement || document.body
}

function hasDescriptionText(value: string) {
  return value.replace(/@?\{[^{}]+\}/g, '').trim().length > 0
}

function parseFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function parseUserCredits(user: unknown): number | undefined {
  if (!user || typeof user !== 'object') return undefined
  const record = user as Record<string, unknown>
  const keys = ['credits', 'credit', 'balance', 'points']
  for (const key of keys) {
    const parsed = parseFiniteNumber(record[key])
    if (parsed !== undefined) return parsed
  }
  return undefined
}

function setUploadRef(slotKey: UploadSlotKey, instance: unknown) {
  if (instance) {
    uploadRefs.value[slotKey] = instance as ReferenceUploadExpose
    return
  }
  delete uploadRefs.value[slotKey]
}

function clearUploadedImages() {
  uploadStates.value = {
    reference: { files: [], uploading: false, error: '', imageIds: [], datasets: [] },
    videoReference: { files: [], uploading: false, error: '', imageIds: [], datasets: [] },
    firstFrame: { files: [], uploading: false, error: '', imageIds: [], datasets: [] },
    lastFrame: { files: [], uploading: false, error: '', imageIds: [], datasets: [] },
  }
}

function resetUploadStateBySlot(slotKey: UploadSlotKey) {
  uploadStates.value[slotKey] = { files: [], uploading: false, error: '', imageIds: [], datasets: [] }
  if (slotKey === 'reference') referenceImageFile.value = null
}

function clearUploadSlot(slotKey: UploadSlotKey) {
  uploadRefs.value[slotKey]?.clearAll()
  resetUploadStateBySlot(slotKey)
}

function currentSupportedUploadSlotKeys() {
  return new Set(uploadSlots.value.map((slot) => slot.key))
}

function pruneUploadsForCurrentModel() {
  const supportedKeys = currentSupportedUploadSlotKeys()
  ;(['reference', 'videoReference', 'firstFrame', 'lastFrame'] as UploadSlotKey[]).forEach((slotKey) => {
    if (!supportedKeys.has(slotKey)) {
      clearUploadSlot(slotKey)
    }
  })
  syncMentionDatasetsFromUploads()
}

function collectMentionDatasets() {
  const mentionSlotKeys: Array<{ key: UploadSlotKey; mediaType: 'image' | 'video' }> = [
    { key: 'reference', mediaType: 'image' },
    { key: 'videoReference', mediaType: 'video' },
  ]
  const visibleSlotKeys = currentSupportedUploadSlotKeys()
  return mentionSlotKeys.flatMap(({ key, mediaType }) => {
    if (!visibleSlotKeys.has(key)) return []
    return (uploadStates.value[key].datasets || []).map((item) => ({ ...item, mediaType }))
  })
}

function syncMentionDatasetsFromUploads() {
  const nextMentionList: MentionDatasetItem[] = collectMentionDatasets()
    .filter((item) => item.imageId && item.imageUrl)
    .map((item) => ({
      uid: item.uid,
      imageId: item.imageId || 0,
      imageUrl: item.imageUrl || '',
      datasetId: item.datasetId,
      datasetUrl: item.datasetUrl,
      label: item.mediaType === 'video' ? '视频' : '图片',
      mediaType: item.mediaType,
    }))
  mentionDatasets.value = nextMentionList
  pruneMissingMentionTokens(new Set(nextMentionList.map((item) => item.datasetId)))
  syncPromptFromEditor()
}

function updateSelectedMentionIds() {
  const root = promptEditorRef.value
  if (!root) {
    selectedMentionIds.value = []
    return
  }
  const ids = Array.from(root.querySelectorAll<HTMLElement>('.prompt-mention-token[data-dataset-id]'))
    .map((node) => node.dataset.datasetId || '')
    .filter(Boolean)
  selectedMentionIds.value = Array.from(new Set(ids))
}

function serializePromptFromEditor() {
  const root = promptEditorRef.value
  if (!root) return prompt.value.trim()
  const clone = root.cloneNode(true) as HTMLDivElement
  clone.querySelectorAll<HTMLElement>('.prompt-mention-token').forEach((token) => {
    const datasetId = token.dataset.datasetId || ''
    const textNode = document.createTextNode(datasetId ? ` @{${datasetId}} ` : '')
    token.replaceWith(textNode)
  })
  const raw = clone.innerText || clone.textContent || ''
  return raw
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function syncPromptFromEditor() {
  const root = promptEditorRef.value
  if (root) {
    const hasToken = root.querySelector('.prompt-mention-token')
    if (!hasToken && !root.textContent?.trim()) {
      root.innerHTML = ''
    }
  }
  prompt.value = serializePromptFromEditor()
  updateSelectedMentionIds()
}

function cacheEditorSelection() {
  const root = promptEditorRef.value
  if (!root) return
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return
  cachedSelection = range.cloneRange()
}

function restoreSelectionOrMoveToEnd() {
  const root = promptEditorRef.value
  if (!root) return
  const selection = window.getSelection()
  if (!selection) return

  if (cachedSelection) {
    try {
      selection.removeAllRanges()
      selection.addRange(cachedSelection)
      return
    } catch {
      cachedSelection = null
    }
  }

  const range = document.createRange()
  range.selectNodeContents(root)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
  cachedSelection = range.cloneRange()
}

function createMentionTokenNode(item: MentionDatasetItem) {
  const token = document.createElement('span')
  token.className = 'prompt-mention-token'
  token.contentEditable = 'false'
  token.dataset.datasetId = item.datasetId
  token.dataset.uid = item.uid

  if (item.mediaType === 'video') {
    const video = document.createElement('video')
    video.className = 'prompt-mention-video'
    video.src = item.datasetUrl
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    token.appendChild(video)
  } else {
    const img = document.createElement('img')
    img.className = 'prompt-mention-thumb'
    img.src = item.datasetUrl
    img.alt = item.label
    token.appendChild(img)
  }

  const text = document.createElement('span')
  text.className = 'prompt-mention-label'
  text.textContent = item.label
  token.appendChild(text)
  return token
}

function pruneMissingMentionTokens(validDatasetIds: Set<string>) {
  const root = promptEditorRef.value
  if (!root) return
  root.querySelectorAll<HTMLElement>('.prompt-mention-token').forEach((token) => {
    const datasetId = token.dataset.datasetId || ''
    if (datasetId && !validDatasetIds.has(datasetId)) {
      token.remove()
    }
  })
}

function onEditorInput() {
  syncPromptFromEditor()
  cacheEditorSelection()
}

function onEditorKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void onGenerate()
    return
  }
  requestAnimationFrame(() => {
    syncPromptFromEditor()
    cacheEditorSelection()
  })
}

function onReferenceFileChange(slotKey: UploadSlotKey, payload: UploadFileChangeEventPayload) {
  const firstFile = payload.files?.[0] || payload.file
  uploadStates.value[slotKey].files = payload.files || (firstFile ? [firstFile] : [])
  if (slotKey === 'reference') referenceImageFile.value = firstFile || null
  if (!firstFile) {
    uploadStates.value[slotKey].uploading = false
    uploadStates.value[slotKey].error = ''
    uploadStates.value[slotKey].imageIds = []
    uploadStates.value[slotKey].datasets = []
    syncMentionDatasetsFromUploads()
  }
}

function onReferenceUploadResult(slotKey: UploadSlotKey, payload: UploadResultEventPayload) {
  const uploadedImages = (payload.datasets || []).filter((item) => item.imageId && item.imageUrl)
  uploadStates.value[slotKey].uploading = payload.uploading
  uploadStates.value[slotKey].datasets = uploadedImages
  uploadStates.value[slotKey].imageIds = uploadedImages
    .map((item) => Number(item.imageId))
    .filter((imageId) => Number.isFinite(imageId) && imageId > 0)
  syncMentionDatasetsFromUploads()
  if (payload.uploading) {
    uploadStates.value[slotKey].error = ''
    return
  }
  if (uploadedImages.length) {
    uploadStates.value[slotKey].error = ''
    return
  }
  uploadStates.value[slotKey].error = payload.error || ''
  uploadStates.value[slotKey].imageIds = []
  uploadStates.value[slotKey].datasets = []
  syncMentionDatasetsFromUploads()
}

function hasDraggedFiles(event: DragEvent) {
  const types = Array.from(event.dataTransfer?.types || [])
  return types.includes('Files')
}

function getPanelDropTargetSlot(file?: File): UploadSlotKey | null {
  if (isSubmitting.value) return null
  if (!uploadSlots.value.length) return null
  if (!isVideo.value) return uploadSlots.value.some((slot) => slot.key === 'reference') ? 'reference' : null
  if (selectedVideoSettingFeature.value === 'multimodal_ref') {
    if (file && fileMatchesAccept(file, videoReferenceUploadAccept.value) && uploadSlots.value.some((slot) => slot.key === 'videoReference')) {
      return 'videoReference'
    }
    if (uploadSlots.value.some((slot) => slot.key === 'reference')) return 'reference'
  }
  if (uploadSlots.value.some((slot) => slot.key === 'firstFrame')) return 'firstFrame'
  return null
}

function parseAcceptValues(accept: string) {
  return String(accept || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function fileMatchesAccept(file: File, accept: string) {
  const values = parseAcceptValues(accept)
  if (!values.length) return true
  const fileType = String(file.type || '').toLowerCase()
  const fileName = String(file.name || '').toLowerCase()
  return values.some((item) => {
    if (item === '*/*') return true
    if (item.endsWith('/*')) return fileType.startsWith(item.slice(0, -1))
    if (item.startsWith('.')) return fileName.endsWith(item)
    return fileType === item
  })
}

function remainingUploadCount(slotKey: UploadSlotKey) {
  const slot = uploadSlots.value.find((item) => item.key === slotKey)
  if (!slot) return 0
  const state = uploadStates.value[slotKey]
  return Math.max(0, slot.maxCount - (state.files?.length || 0))
}

function onPanelDragEnter(event: DragEvent) {
  if (!hasDraggedFiles(event)) return
  event.preventDefault()
  panelDragDepth.value += 1
  isPanelDraggingFile.value = true
}

function onPanelDragOver(event: DragEvent) {
  if (!hasDraggedFiles(event)) return
  event.preventDefault()
  const firstFile = event.dataTransfer?.files?.[0]
  if (event.dataTransfer) event.dataTransfer.dropEffect = getPanelDropTargetSlot(firstFile) ? 'copy' : 'none'
  isPanelDraggingFile.value = true
}

function onPanelDragLeave(event: DragEvent) {
  if (!hasDraggedFiles(event)) return
  event.preventDefault()
  panelDragDepth.value = Math.max(0, panelDragDepth.value - 1)
  if (panelDragDepth.value === 0) {
    isPanelDraggingFile.value = false
  }
}

function onPanelDrop(event: DragEvent) {
  if (!hasDraggedFiles(event)) return
  event.preventDefault()
  panelDragDepth.value = 0
  isPanelDraggingFile.value = false

  const files = Array.from(event.dataTransfer?.files || []).filter((file) => file instanceof File)
  if (!files.length) return

  if (isVideo.value && selectedVideoSettingFeature.value === 'multimodal_ref') {
    const imageTarget = uploadSlots.value.find((slot) => slot.key === 'reference')
    const videoTarget = uploadSlots.value.find((slot) => slot.key === 'videoReference')
    if (!imageTarget && !videoTarget) {
      message.warning('当前模型不支持上传参考素材')
      return
    }

    const imageFiles = imageTarget ? files.filter((file) => fileMatchesAccept(file, imageTarget.accept)) : []
    const videoFiles = videoTarget ? files.filter((file) => fileMatchesAccept(file, videoTarget.accept)) : []
    const acceptedFileSet = new Set([...imageFiles, ...videoFiles])
    if (!acceptedFileSet.size) {
      message.warning('文件格式不支持')
      return
    }
    if (acceptedFileSet.size < files.length) {
      message.warning('部分文件格式不支持，已忽略')
    }

    let uploadedTotal = 0
    const uploadToSlot = (slotKey: UploadSlotKey, slotFiles: File[]) => {
      if (!slotFiles.length) return
      const remaining = remainingUploadCount(slotKey)
      if (remaining <= 0) {
        message.warning(`最多上传${uploadSlots.value.find((slot) => slot.key === slotKey)?.maxCount || 1}个文件`)
        return
      }
      const accepted = slotFiles.slice(0, remaining)
      if (slotFiles.length > remaining) {
        message.warning(`最多上传${uploadSlots.value.find((slot) => slot.key === slotKey)?.maxCount || remaining}个文件，已忽略多余文件`)
      }
      uploadedTotal += uploadRefs.value[slotKey]?.uploadFiles(accepted) || 0
    }

    uploadToSlot('reference', imageFiles)
    uploadToSlot('videoReference', videoFiles)
    if (!uploadedTotal) {
      message.warning('当前上传入口不可用')
    }
    return
  }

  const targetSlot = getPanelDropTargetSlot(files[0])
  if (!targetSlot) {
    message.warning('当前模型不支持上传参考素材')
    return
  }

  const targetConfig = uploadSlots.value.find((slot) => slot.key === targetSlot)
  const targetAccept = targetConfig?.accept || imageReferenceUploadAccept.value
  const matchedFiles = files.filter((file) => fileMatchesAccept(file, targetAccept))
  if (!matchedFiles.length) {
    message.warning('文件格式不支持')
    return
  }
  if (matchedFiles.length < files.length) {
    message.warning('部分文件格式不支持，已忽略')
  }

  const remaining = remainingUploadCount(targetSlot)
  if (remaining <= 0) {
    message.warning(`最多上传${uploadSlots.value.find((slot) => slot.key === targetSlot)?.maxCount || 1}个文件`)
    return
  }
  const uploadFiles = matchedFiles.slice(0, remaining)
  if (matchedFiles.length > remaining) {
    message.warning(`最多上传${uploadSlots.value.find((slot) => slot.key === targetSlot)?.maxCount || remaining}个文件，已忽略多余文件`)
  }

  const uploadedCount = uploadRefs.value[targetSlot]?.uploadFiles(uploadFiles) || 0
  if (!uploadedCount) {
    message.warning('当前上传入口不可用')
  }
}

function onSelectMention(item: MentionDatasetItem) {
  const root = promptEditorRef.value
  if (!root) return
  root.focus()
  restoreSelectionOrMoveToEnd()

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  const token = createMentionTokenNode(item)
  const leadingSpace = document.createTextNode(' ')
  const trailingSpace = document.createTextNode(' ')

  range.deleteContents()
  range.insertNode(trailingSpace)
  range.insertNode(token)
  range.insertNode(leadingSpace)

  const nextRange = document.createRange()
  nextRange.setStartAfter(trailingSpace)
  nextRange.collapse(true)
  selection.removeAllRanges()
  selection.addRange(nextRange)
  cachedSelection = nextRange.cloneRange()
  atOpen.value = false
  syncPromptFromEditor()
}

function resetComposerInputs() {
  prompt.value = ''
  referenceImageFile.value = null
  referenceUploadRenderKey.value += 1
  mentionDatasets.value = []
  selectedMentionIds.value = []
  cachedSelection = null
  const root = promptEditorRef.value
  if (root) root.innerHTML = ''
  clearUploadedImages()
}

function resetReferenceUploads() {
  referenceImageFile.value = null
  referenceUploadRenderKey.value += 1
  mentionDatasets.value = []
  selectedMentionIds.value = []
  pruneMissingMentionTokens(new Set())
  syncPromptFromEditor()
  clearUploadedImages()
}

async function buildInputImagesForEmit() {
  return mentionDatasets.value.map((item) => item.datasetUrl).filter(Boolean)
}

function buildPromptDatasetsForEmit() {
  return mentionDatasets.value.map((item) => ({
    datasetId: item.datasetId,
    datasetUrl: item.datasetUrl,
    label: item.label,
    mediaType: item.mediaType,
  }))
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}

function resolveIcon(icon: string | undefined, kind: 'image' | 'video') {
  if (icon && /^https?:\/\//.test(icon)) return icon
  if (kind === 'video') return VIDEO_MODEL_ICON
  return QWEN_ICON
}

function normalizeOptionPrimitive(raw: unknown) {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw).trim()
  }
  if (typeof raw === 'object') {
    const entry = raw as Record<string, unknown>
    const candidate = entry.value ?? entry.label ?? entry.name ?? entry.id
    return candidate === null || candidate === undefined ? '' : String(candidate).trim()
  }
  return ''
}

function toStringList(value: ModelOptionValue): string[] {
  if (value === null || value === undefined) return []

  if (Array.isArray(value)) {
    if (
      value.length === 2
      && value.every((item) => typeof item === 'number' && Number.isFinite(item))
    ) {
      const [start, end] = value as [number, number]
      return [String(start), String(end)]
    }
    return value
      .map((item) => normalizeOptionPrimitive(item as ModelOptionPrimitive))
      .filter((item) => item.length > 0)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (/[,|/，]/.test(trimmed)) {
      return trimmed.split(/[,|/，]/).map((item) => item.trim()).filter(Boolean)
    }
    return [trimmed]
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value).trim()]
  }

  const entry = value as Record<string, unknown>
  const minRaw = entry.min
  const maxRaw = entry.max
  const min = Number(minRaw)
  const max = Number(maxRaw)
  if (Number.isFinite(min) && Number.isFinite(max)) {
    return [String(min), String(max)]
  }

  const candidate = normalizeOptionPrimitive(entry)
  return candidate ? [candidate] : []
}

function readOption(config: BackendModelConfig, keys: Array<keyof BackendModelOptions>): string[] {
  const options = config.options || {}
  for (const key of keys) {
    const topLevel = toStringList(config[key] as ModelOptionValue)
    if (topLevel.length) return topLevel
    const nested = toStringList(options[key] as ModelOptionValue)
    if (nested.length) return nested
  }
  return []
}

function readRawOption(config: BackendModelConfig, keys: Array<keyof BackendModelOptions>): ModelOptionValue {
  const options = config.options || {}
  for (const key of keys) {
    const topLevel = config[key] as ModelOptionValue
    if (topLevel !== null && topLevel !== undefined && toStringList(topLevel).length) return topLevel
    const nested = options[key] as ModelOptionValue
    if (nested !== null && nested !== undefined && toStringList(nested).length) return nested
  }
  return undefined
}

function dedupeList(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.length > 0)))
}

function expandNumImageOptions(items: string[]) {
  if (!items.length) return []
  const cleaned = items.map((item) => item.replace(/[\]()\s[]/g, ''))

  if (cleaned.length === 2) {
    const min = Number(cleaned[0])
    const max = Number(cleaned[1])
    if (Number.isInteger(min) && Number.isInteger(max) && min <= max && max - min <= 20) {
      return Array.from({ length: max - min + 1 }, (_, index) => String(min + index))
    }
  }

  if (cleaned.length === 1) {
    const rangeMatch = cleaned[0].match(/^(\d+)\s*[-~]\s*(\d+)$/)
    if (rangeMatch) {
      const min = Number(rangeMatch[1])
      const max = Number(rangeMatch[2])
      if (Number.isInteger(min) && Number.isInteger(max) && min <= max && max - min <= 20) {
        return Array.from({ length: max - min + 1 }, (_, index) => String(min + index))
      }
    }
  }

  return cleaned.filter((item) => item.length > 0)
}

function normalizeNumImageOptions(value: ModelOptionValue) {
  if (Array.isArray(value)) {
    return dedupeList(
      value
        .map((item) => normalizeOptionPrimitive(item))
        .filter((item) => item.length > 0),
    )
  }
  return dedupeList(expandNumImageOptions(dedupeList(toStringList(value))))
}

function normalizeModelOptions(config: BackendModelConfig) {
  const numImagesRaw = readRawOption(config, ['num_images'])
  const maxRefImagesRaw = readRawOption(config, ['max_ref_images'])
  return {
    ratios: dedupeList(readOption(config, ['aspect_ratios', 'aspect_ratio', 'ratios'])),
    imageSizes: dedupeList(readOption(config, ['image_sizes', 'image_size'])),
    numImages: normalizeNumImageOptions(numImagesRaw),
    resolutions: dedupeList(readOption(config, ['resolutions'])),
    durations: dedupeList(readOption(config, ['duration_options', 'durations'])),
    specialFeatures: dedupeList(readOption(config, ['special_features'])),
    refImageFormats: dedupeList(readOption(config, ['ref_image_formats'])),
    maxRefImages: normalizePositiveInteger(maxRefImagesRaw),
  }
}

function mapPredictTypesToCaps(predictTypes: string[] | undefined, kind: 'image' | 'video'): Array<'text' | 'ref' | 'video'> {
  const caps = new Set<'text' | 'ref' | 'video'>()
  const list = Array.isArray(predictTypes) ? predictTypes : []

  for (const raw of list) {
    const value = String(raw || '')
    if (!value) continue
    if (value.includes('视频生视频')) caps.add('video')
    if (value.includes('文本') || value.includes('文生')) caps.add('text')
    if (value.includes('首帧') || value.includes('图生') || value.includes('全能参考')) caps.add('ref')
  }

  if (!caps.size) {
    caps.add('text')
    if (kind === 'image') caps.add('ref')
  }
  return Array.from(caps)
}

function normalizeStringArray(input: string[] | string | null | undefined): string[] {
  if (Array.isArray(input)) return input.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof input === 'string') {
    const trimmed = input.trim()
    return trimmed ? [trimmed] : []
  }
  return []
}

function normalizeBackendConfig(raw: BackendModelRecord['config']): BackendModelConfig {
  if (raw && typeof raw === 'object') return raw as BackendModelConfig
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed as BackendModelConfig
    } catch {
      return {}
    }
  }
  return {}
}

function normalizeCostPerGeneration(raw: unknown): number | undefined {
  if (raw === null || raw === undefined) return undefined
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) return undefined
    return raw
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const parsed = normalizeCostPerGeneration(item)
      if (parsed !== undefined) return parsed
    }
    return undefined
  }
  const cleaned = String(raw).trim()
  if (cleaned && typeof raw !== 'object') {
    const match = cleaned.match(/-?\d+(?:\.\d+)?/)
    if (!match) return undefined
    const parsed = Number(match[0])
    if (!Number.isFinite(parsed) || parsed < 0) return undefined
    return parsed
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const keys = [
      'cost_per_generation',
      'costPerGeneration',
      'cost',
      'value',
      'amount',
      'points',
      'score',
    ]
    for (const key of keys) {
      const parsed = normalizeCostPerGeneration(obj[key])
      if (parsed !== undefined) return parsed
    }
  }
  return undefined
}

function normalizeNonNegativeNumber(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  const parsed = typeof raw === 'number' ? raw : Number(String(raw).trim())
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return parsed
}

function normalizePricingUnit(raw: unknown): PricingUnit | undefined {
  const value = String(raw || '').trim()
  if (value === 'per_image' || value === 'per_second' || value === 'per_generation') return value
  return undefined
}

function normalizePricingRule(raw: BackendModelPricingRule): ModelPricingRule | null {
  if (!raw || raw.is_active === false) return null
  const resolution = String(raw.resolution ?? '').trim()
  const unit = normalizePricingUnit(raw.unit)
  const unitCost = normalizeNonNegativeNumber(raw.unit_cost)
  if (!resolution || !unit || unitCost === undefined) return null

  return {
    resolution,
    unit,
    unitCost,
    minQuantity: normalizeNonNegativeNumber(raw.min_quantity),
    maxQuantity: normalizeNonNegativeNumber(raw.max_quantity),
  }
}

function normalizePricingRules(record: BackendModelRecord): ModelPricingRule[] {
  const rawRules = Array.isArray(record.pricing)
    ? record.pricing
    : record.pricing?.rules
  if (!Array.isArray(rawRules)) return []
  return rawRules
    .map((rule) => normalizePricingRule(rule))
    .filter((rule): rule is ModelPricingRule => Boolean(rule))
}

function normalizeResolutionKey(raw: string) {
  return String(raw || '').trim().toLowerCase()
}

function findPricingRule(model: ModelItem, resolution: string) {
  const resolutionKey = normalizeResolutionKey(resolution)
  if (!resolutionKey) return undefined
  return model.pricingRules.find((rule) => normalizeResolutionKey(rule.resolution) === resolutionKey)
}

function resolveSelectedGenerateCost(): number | undefined {
  const model = currentModel.value
  if (!model) return undefined

  const selectedRule = findPricingRule(model, selectedSize.value)
  if (!selectedRule) return model.costPerGeneration

  if (selectedRule.unit === 'per_generation') return selectedRule.unitCost

  if (!isVideo.value && selectedRule.unit === 'per_image') {
    return selectedRule.unitCost * normalizeNumImages(selectedCount.value)
  }

  if (isVideo.value && selectedRule.unit === 'per_second') {
    const duration = Number(normalizeDuration(selectedCount.value))
    if (Number.isFinite(duration) && duration > 0) return selectedRule.unitCost * duration
  }

  return model.costPerGeneration
}

function findValueByKeys(source: unknown, keys: string[]): unknown {
  if (!source || typeof source !== 'object') return undefined
  const queue: unknown[] = [source]
  const visited = new Set<object>()

  while (queue.length) {
    const current = queue.shift()
    if (!current || typeof current !== 'object') continue
    if (visited.has(current)) continue
    visited.add(current)

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item)
      continue
    }

    const obj = current as Record<string, unknown>
    for (const key of keys) {
      if (key in obj) {
        const value = obj[key]
        if (value !== undefined && value !== null && value !== '') return value
      }
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') queue.push(value)
    }
  }
  return undefined
}

function resolveModelCost(record: BackendModelRecord, config: BackendModelConfig): number | undefined {
  const costKeys = ['cost_per_generation', 'costPerGeneration']
  const topLevel = normalizeCostPerGeneration(record.cost_per_generation ?? record.costPerGeneration)
  if (topLevel !== undefined) return topLevel
  const direct = normalizeCostPerGeneration(
    config.cost_per_generation
    ?? config.costPerGeneration
    ?? config.options?.cost_per_generation
    ?? config.options?.costPerGeneration,
  )
  if (direct !== undefined) return direct
  const deepRaw = findValueByKeys(record, costKeys)
  return normalizeCostPerGeneration(deepRaw)
}

function mapBackendModel(record: BackendModelRecord, kind: 'image' | 'video'): ModelItem {
  const config = normalizeBackendConfig(record.config)
  const taskType = config.task_type || ''
  const runwayModel = config.runway_model || ''
  const modelName = record.name || (record.id ? `Model-${record.id}` : 'Unknown Model')
  const modelId = Number(record.id || 0)
  const id = taskType || runwayModel || slugifyName(modelName) || String(modelId)
  const modelTags = normalizeStringArray(config.predictTypes || config.predict_types)
  const caps = mapPredictTypesToCaps(modelTags, kind)
  const options = normalizeModelOptions(config)
  const vendorTags = normalizeStringArray(config.tags)
  const vendor = vendorTags[0] || String(record.provider || '').trim()
  return {
    id,
    modelId,
    taskType: taskType || undefined,
    runwayModel: runwayModel || undefined,
    costPerGeneration: resolveModelCost(record, config),
    pricingRules: normalizePricingRules(record),
    isActive: Boolean(record.is_active),
    name: modelName,
    vendor,
    desc: config.description || undefined,
    icon: resolveIcon(config.icon, kind),
    caps,
    tags: modelTags,
    options,
  }
}

function ensureCurrentModelAvailable() {
  const list = modeModels.value
  if (!list.length) {
    currentModel.value = null
    selectedRatio.value = ''
    selectedSize.value = ''
    selectedCount.value = ''
    return
  }
  const matched = list.find((item) => item.id === currentModel.value?.id)
  if (!matched) {
    currentModel.value = list[0]
  }
  const visibleMatched = visibleModels.value.find((item) => item.id === currentModel.value?.id)
  if (!visibleMatched && visibleModels.value.length) {
    currentModel.value = visibleModels.value[0]
  }
  applySelectionDefaults()
}

function choosePreferredValue(options: string[], preferred: string) {
  if (!options.length) return ''
  const lowerPreferred = preferred.toLowerCase()
  const exact = options.find((item) => item.toLowerCase() === lowerPreferred)
  if (exact) return exact
  return options[0]
}

function choosePreferredCount(options: string[], preferred: number) {
  if (!options.length) return ''
  const matched = options.find((item) => Number((item || '').replace(/[^\d]/g, '')) === preferred)
  return matched || options[0]
}

function applySelectionDefaults() {
  selectedRatio.value = choosePreferredValue(ratioOptions.value, 'auto')
  selectedSize.value = sizeOptions.value[0] || ''
  selectedCount.value = isVideo.value ? (countOptions.value[0] || '') : choosePreferredCount(countOptions.value, 4)
}

async function loadModelsFromApi() {
  const ok = props.modelsFetchMode === 'explore'
    ? await modelsStore.ensureForExplore()
    : await modelsStore.ensureForOtherPage()

  const db = modelsStore.modelsResponse?.database
  const mappedImage = (db?.image || [])
    .filter((item) => Boolean(item?.is_active))
    .map((item) => mapBackendModel(item, 'image'))
  const mappedVideo = (db?.video || [])
    .filter((item) => Boolean(item?.is_active))
    .map((item) => mapBackendModel(item, 'video'))

  imageModels.value = mappedImage
  videoModels.value = mappedVideo
  if (!mappedImage.length && !mappedVideo.length) {
    currentModel.value = null
  }
  ensureCurrentModelAvailable()

  if (!ok && modelsStore.error) {
    closeAll()
    message.warning(modelsStore.error)
  }
}

function normalizeAspectRatio(raw: string) {
  const trimmed = (raw || '').trim()
  if (!trimmed) return 'auto'
  return trimmed.toLowerCase() === 'auto' ? 'auto' : trimmed
}

function normalizeNumImages(raw: string) {
  const parsed = Number((raw || '').replace(/[^\d]/g, ''))
  if (!Number.isFinite(parsed) || parsed <= 0) return 4
  return parsed
}

function normalizePositiveInteger(raw: unknown): number | undefined {
  const parsed = Number(String(raw ?? '').replace(/[^\d]/g, ''))
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined
  return parsed
}

function isVideoFormatValue(value: string) {
  return /video|mp4|mov|webm|m4v|m3u8|avi|mkv/i.test(value)
}

function isImageFormatValue(value: string) {
  return /image|jpg|jpeg|png|webp|gif|bmp|heic|heif/i.test(value)
}

function formatAcceptFromModelFormats(formats: string[], mediaKind: 'image' | 'video' = 'image') {
  const normalized = formats
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(Boolean)
    .filter((item) => mediaKind === 'video' ? isVideoFormatValue(item) : isImageFormatValue(item))
    .map((item) => {
      if (item.includes('/')) return item
      const clean = item.replace(/^\./, '')
      if (clean === 'video') return 'video/*'
      if (clean === 'image') return 'image/*'
      return clean ? `.${clean}` : ''
    })
    .filter(Boolean)
  return normalized.length ? Array.from(new Set(normalized)).join(',') : `${mediaKind}/*`
}

function activeUploadingSlotKeys(): UploadSlotKey[] {
  return uploadSlots.value
    .map((slot) => slot.key)
    .filter((key) => uploadStates.value[key].uploading)
}

function uploadSlotLabel(key: UploadSlotKey) {
  if (key === 'firstFrame') return '首帧'
  if (key === 'lastFrame') return '尾帧'
  if (key === 'videoReference') return '视频参考'
  return '参考图'
}

function normalizeImageSize(raw: string) {
  const trimmed = (raw || '').trim()
  return trimmed || '2K'
}

function normalizeResolution(raw: string) {
  return String(raw || '').trim()
}

function normalizeDuration(raw: string) {
  const digits = String(raw || '').replace(/[^\d]/g, '')
  return digits || ''
}

function durationDisplayText(raw: string) {
  const duration = normalizeDuration(raw)
  return duration ? `${duration}s` : '-'
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

function isTaskStatusNotFoundError(err: unknown) {
  const msg = getErrorMessage(err, '')
  return msg.includes('404 Not Found') || msg.includes('HTTP 404')
}

function clearPollingTask() {
  pollAbortFlag.value = true
  if (pollTimer.value) {
    clearTimeout(pollTimer.value)
    pollTimer.value = null
  }
  isPolling.value = false
  currentTaskId.value = null
}

async function pollTaskStatus(taskId: string) {
  clearPollingTask()
  pollAbortFlag.value = false
  isPolling.value = true
  currentTaskId.value = taskId

  const pollOnce = async () => {
    if (pollAbortFlag.value) return
    try {
      const res = await request.get<unknown, TaskStatusResponse>(`/api/tasks/${taskId}`)
      const status = String(res?.status || '').toUpperCase()
      const progress = typeof res?.progress === 'number' ? res.progress : undefined
      emit('task-progress', {
        taskId,
        status,
        progress,
        progressText: res?.progress_text,
      })

      if (status === 'SUCCEEDED') {
        const artifacts = Array.isArray(res?.artifacts) ? res.artifacts : []
        clearPollingTask()
        message.success('图片生成完成')
        emit('task-succeeded', { taskId, artifacts })
        return
      }

      if (status === 'FAILED' || status === 'CANCELLED') {
        const errMsg = getErrorMessage(res?.error || res, '生成失败，请稍后重试')
        clearPollingTask()
        message.error(errMsg)
        emit('task-failed', { taskId, status, error: errMsg })
        return
      }
    } catch (error) {
      if (isTaskStatusNotFoundError(error)) {
        clearPollingTask()
        message.info('任务已创建，状态查询接口暂不可用，请稍后在生成页查看结果')
        emit('task-progress', {
          taskId,
          status: 'PENDING',
          progressText: 'status endpoint not available',
        })
        return
      }

      const errMsg = getErrorMessage(error, '轮询任务状态失败')
      clearPollingTask()
      message.error(errMsg)
      emit('task-failed', { taskId, status: 'ERROR', error: errMsg })
      return
    }

    if (!pollAbortFlag.value) {
      pollTimer.value = setTimeout(() => {
        void pollOnce()
      }, 5000)
    }
  }

  await pollOnce()
}

function resolveCreatedTaskId(response: TaskCreateResponse | undefined) {
  const raw = response?.task_id ?? response?.job_id
  return String(raw || '').trim()
}

function buildImageTaskPayload(): ImageTaskPayload | null {
  if (!currentModel.value) return null
  const taskType = currentModel.value.taskType || currentModel.value.runwayModel || ''
  if (!taskType || !currentModel.value.modelId) return null
  const modelName = currentModel.value.name?.trim() || taskType
  return {
    prompt: prompt.value.trim(),
    model_id: currentModel.value.modelId,
    task_type: taskType,
    model_name: modelName,
    aspect_ratio: normalizeAspectRatio(selectedRatio.value),
    num_images: normalizeNumImages(selectedCount.value),
    image_size: normalizeImageSize(selectedSize.value),
  }
}

function buildVideoTaskPayload(): VideoTaskPayload | null {
  if (!currentModel.value) return null
  const taskType = currentModel.value.taskType || currentModel.value.runwayModel || ''
  if (!taskType || !currentModel.value.modelId) return null
  const modelName = currentModel.value.name?.trim() || taskType
  const payload: VideoTaskPayload = {
    prompt: prompt.value.trim(),
    model_id: currentModel.value.modelId,
    task_type: taskType,
    model_name: modelName,
  }
  const aspectRatio = normalizeAspectRatio(selectedRatio.value)
  if (aspectRatio) payload.aspect_ratio = aspectRatio
  const resolution = normalizeResolution(selectedSize.value)
  if (resolution) payload.resolution = resolution
  const duration = normalizeDuration(selectedCount.value)
  if (duration) payload.duration = duration
  return payload
}

function ratioIconType(ratio: string) {
  const imageMap: Record<string, string> = {
    auto: 'icon-zhinengbili',
    智能: 'icon-zhinengbili',
    '9:21': 'icon-a-921',
    '9:16': 'icon-a-916',
    '2:3': 'icon-a-23',
    '3:4': 'icon-a-34',
    '1:1': 'icon-a-11',
    '4:3': 'icon-a-43',
    '3:2': 'icon-a-32',
    '16:9': 'icon-a-169',
    '21:9': 'icon-a-219',
  }
  const videoMap: Record<string, string> = {
    auto: 'icon-zhinengbili',
    智能: 'icon-zhinengbili',
    '9:16': 'icon-a-916',
    '3:4': 'icon-a-34',
    '1:1': 'icon-a-11',
    '4:3': 'icon-a-43',
    '16:9': 'icon-a-169',
  }
  return (isVideo.value ? videoMap : imageMap)[ratio] || 'icon-zhinengbili'
}

function ratioDisplayText(ratio: string) {
  return ratio.toLowerCase() === 'auto' ? '智能' : ratio
}

function isVideoSettingFeature(value: string): value is VideoSettingFeature {
  return VIDEO_SETTING_FEATURES.some((option) => option.value === value)
}

function specialFeatureCapTags(modelItem: ModelItem): CapTagItem[] {
  if (mode.value !== 'VIDEO') return []
  return modelItem.options.specialFeatures
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(isVideoSettingFeature)
    .flatMap((feature) => {
      const option = VIDEO_SETTING_FEATURES.find((item) => item.value === feature)
      return option
        ? [{ key: `feature-${feature}`, label: option.label, feature, iconSrc: option.icon }]
        : []
    })
}

function modelCapTags(modelItem: ModelItem): CapTagItem[] {
  const tags: CapTagItem[] = []
  const seenLabels = new Set<string>()
  const pushTag = (tag: CapTagItem) => {
    const labelKey = tag.label.trim()
    if (!labelKey || seenLabels.has(labelKey)) return
    seenLabels.add(labelKey)
    tags.push(tag)
  }

  ;(modelItem.tags || []).forEach((label) => {
    pushTag({ key: `tag-${label}`, label })
  })
  specialFeatureCapTags(modelItem).forEach(pushTag)
  return tags
}

function capTagIcon(tag: string) {
  if (tag.includes('参考')) return 'icon-zuoweicankaotu'
  if (tag.includes('图生')) return 'icon-a-Outlined-'
  if (tag.includes('视频生视频')) return 'icon-down'
  return 'icon-Outlined-wensheng'
}

function isCapTagSelected(tag: CapTagItem) {
  if (tag.feature) return tag.feature === selectedVideoSettingFeature.value
  const label = tag.label
  if (mode.value === 'IMAGE') {
    return imageModelTab.value === 'txt2img'
      ? label.includes('文生图') || label.includes('文本') || label.includes('文生')
      : label.includes('参考生图') || label.includes('图生') || label.includes('首帧') || label.includes('全能参考')
  }
  if (videoModelTab.value === 'txt2video') return label.includes('文生视频') || label.includes('文本') || label.includes('文生')
  if (videoModelTab.value === 'img2video') return label.includes('图生视频') || label.includes('图生') || label.includes('首帧') || label.includes('全能参考')
  return label.includes('视频生视频')
}

function countDisplayText(value: string) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return raw
  return isVideo.value ? `${digits}秒` : `${digits}张`
}

function videoSettingIconByValue(value: string) {
  return VIDEO_SETTING_FEATURES.find((option) => option.value === value)?.icon || VIDEO_SETTING_FEATURES[0].icon
}

function coerceVideoSettingFeature(value: unknown): VideoSettingFeature {
  const matched = VIDEO_SETTING_FEATURES.find((option) => option.value === value)
  return matched?.value || VIDEO_SETTING_FEATURES[0].value
}

function normalizeVideoSettingSelection() {
  if (!isVideo.value) return
  const selectedOption = videoSettingOptions.value.find((option) => option.value === selectedVideoSettingFeature.value)
  if (selectedOption && !selectedOption.disabled) {
    lastEnabledVideoSettingFeature.value = selectedOption.value
    return
  }
  const lastEnabledOption = videoSettingOptions.value.find((option) => option.value === lastEnabledVideoSettingFeature.value && !option.disabled)
  selectedVideoSettingFeature.value = lastEnabledOption?.value || firstEnabledVideoSettingOption.value?.value || VIDEO_SETTING_FEATURES[0].value
  lastEnabledVideoSettingFeature.value = selectedVideoSettingFeature.value
}

function onVideoSettingChange(value: unknown) {
  const nextValue = coerceVideoSettingFeature(value)
  const option = videoSettingOptions.value.find((item) => item.value === nextValue)
  if (option?.disabled) {
    normalizeVideoSettingSelection()
    message.warning('请切换支持该功能的模型后使用')
    return
  }
  selectedVideoSettingFeature.value = nextValue
  lastEnabledVideoSettingFeature.value = nextValue
  pruneUploadsForCurrentModel()
}

function closeAll(except?: PopoverName) {
  if (except !== 'model') modelOpen.value = false
  if (except !== 'smart') smartOpen.value = false
  if (except !== 'at') atOpen.value = false
}

function onPopoverChange(name: PopoverName, open: boolean) {
  if (name === 'model' && open && (!hasModeModels.value || isModelsLoading.value)) {
    modelOpen.value = false
    return
  }
  if (name === 'smart' && open && !hasSmartOptions.value) {
    smartOpen.value = false
    return
  }
  if (open) closeAll(name)
  if (name === 'model') modelOpen.value = open
  if (name === 'smart') smartOpen.value = open
  if (name === 'at') atOpen.value = open
}

function onModeChange(next: string | number) {
  clearPollingTask()
  const resolved = next === 'VIDEO' ? 'VIDEO' : 'IMAGE'
  if (mode.value === resolved) return

  mode.value = resolved
  closeAll()
  ensureCurrentModelAvailable()
  normalizeVideoSettingSelection()
  resetReferenceUploads()
}

function onRetryLoadModels() {
  void loadModelsFromApi()
}

function setModelTab(key: ModelTabKey) {
  if (mode.value === 'IMAGE') {
    imageModelTab.value = key as ImgModelTab
  } else {
    videoModelTab.value = key as VidModelTab
  }
  const firstVisible = visibleModels.value[0]
  if (firstVisible && currentModel.value?.id !== firstVisible.id && !visibleModels.value.some((item) => item.id === currentModel.value?.id)) {
    currentModel.value = firstVisible
  }
  applySelectionDefaults()
  normalizeVideoSettingSelection()
  pruneUploadsForCurrentModel()
}

function selectModel(modelItem: ModelItem) {
  currentModel.value = modelItem
  applySelectionDefaults()
  normalizeVideoSettingSelection()
  pruneUploadsForCurrentModel()
  modelOpen.value = false
}

async function onGenerate() {
  syncPromptFromEditor()
  if (!authStore.isLoggedIn) {
    authStore.openAuthModal()
    return
  }
  if (!canGenerate.value || isSubmitting.value) return
  if (isInsufficientCredits.value) {
    message.warning('积分不足')
    return
  }

  const isVideoTask = isVideo.value
  if (isVideoTask && videoModelTab.value === 'vid2video') {
    message.info('视频生视频接口暂未接入')
    return
  }

  const payload = isVideoTask ? buildVideoTaskPayload() : buildImageTaskPayload()
  if (!payload) {
    message.error(currentModel.value ? '该模型缺少任务类型配置，无法创建任务' : '暂无可用模型，请稍后重试')
    return
  }
  if (!payload.prompt) {
    message.warning('请输入提示词')
    return
  }

  isSubmitting.value = true
  let createdTaskId = ''

  try {
    clearPollingTask()
    let createRes: TaskCreateResponse
    const uploadingSlots = activeUploadingSlotKeys()

    for (const key of uploadingSlots) {
      const label = uploadSlotLabel(key)
      throw new Error(`${label}上传中，请稍候再试`)
    }

    if (!isVideoTask && baseReferenceState.value.imageIds.length) {
      payload.image_ids = [...baseReferenceState.value.imageIds]
    }

    if (isVideoTask && shouldShowVideoUploads.value) {
      const videoPayload = payload as VideoTaskPayload
      if (selectedVideoSettingFeature.value === 'first_frame' || selectedVideoSettingFeature.value === 'first_last_frame') {
        const firstFrameImageId = firstFrameState.value.imageIds[0]
        if (firstFrameImageId) {
          videoPayload.first_frame_image_id = firstFrameImageId
        }
        const lastFrameImageId = lastFrameState.value.imageIds[0]
        if (selectedVideoSettingFeature.value === 'first_last_frame' && lastFrameImageId) {
          videoPayload.last_frame_image_id = lastFrameImageId
        }
      }
      if (selectedVideoSettingFeature.value === 'multimodal_ref') {
        const imageIds = [
          ...baseReferenceState.value.imageIds,
          ...videoReferenceState.value.imageIds,
        ]
        if (imageIds.length) {
          videoPayload.image_ids = imageIds
        }
      }
    }
    createRes = await request.post<unknown, TaskCreateResponse>('/api/tasks', payload, { timeout: TASK_REQUEST_TIMEOUT_MS })

    const taskId = resolveCreatedTaskId(createRes)
    if (!createRes?.success || !taskId) {
      throw new Error(getErrorMessage(createRes, '创建任务失败'))
    }

    createdTaskId = taskId
    const ratioLabel = normalizeAspectRatio(selectedRatio.value)
    const sizeLabel = isVideoTask ? (normalizeResolution(selectedSize.value) || '-') : selectedSize.value
    const countLabel = isVideoTask ? durationDisplayText(selectedCount.value) : countDisplayText(selectedCount.value)
    const taskCreatedPayload: TaskCreatedEventPayload = {
      taskId,
      payload,
      mediaType: isVideoTask ? 'VIDEO' : 'IMAGE',
      displayMeta: {
        prompt: payload.prompt,
        modelLabel: currentModel.value?.name || '未知模型',
        ratioLabel,
        sizeLabel,
        countLabel,
      },
      inputImages: await buildInputImagesForEmit(),
      promptDatasets: buildPromptDatasetsForEmit(),
      expectedCount: isVideoTask ? 1 : normalizeNumImages(selectedCount.value),
    }
    emit('task-created', taskCreatedPayload)
    message.success(`任务创建成功，正在生成中...`)
    resetComposerInputs()
    if (props.pollMode === 'internal') {
      await pollTaskStatus(taskId)
    }
  } catch (error) {
    const errMsg = getErrorMessage(error, '提交生成任务失败')
    message.error(errMsg)
    emit('task-failed', {
      taskId: currentTaskId.value || createdTaskId || '',
      status: 'CREATE_FAILED',
      error: errMsg,
    })
  } finally {
    isSubmitting.value = false
  }
}

function onTextareaFocus() {
  if (props.showMini) emit('update:showMini', false)
}

function setPrompt(value: string) {
  const text = String(value || '')
  prompt.value = text
  onTextareaFocus()
  requestAnimationFrame(() => {
    const root = promptEditorRef.value
    if (!root) return
    root.textContent = text
    root.focus()
    const range = document.createRange()
    range.selectNodeContents(root)
    range.collapse(false)
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
      cachedSelection = range.cloneRange()
    }
    syncPromptFromEditor()
  })
}

function pickOptionByText(options: string[], value?: string) {
  const target = String(value || '').trim()
  if (!target) return ''
  const normalizedTarget = target.toLowerCase()
  return options.find((item) => String(item || '').trim().toLowerCase() === normalizedTarget) || target
}

function findVideoModelForPrefill(payload: PrefillVideoPathPayload) {
  const modelId = Number(payload.modelId || 0)
  const modelName = String(payload.modelName || '').trim().toLowerCase()
  const taskType = String(payload.taskType || '').trim().toLowerCase()
  const runwayModel = String(payload.runwayModel || '').trim().toLowerCase()
  return videoModels.value.find((model) => (
    (modelId > 0 && model.modelId === modelId)
    || (modelName && model.name.trim().toLowerCase() === modelName)
    || (taskType && String(model.taskType || '').trim().toLowerCase() === taskType)
    || (runwayModel && String(model.runwayModel || '').trim().toLowerCase() === runwayModel)
  )) || null
}

function findImageModelForPrefill(payload: PrefillImagePathPayload) {
  const modelId = Number(payload.modelId || 0)
  const modelName = String(payload.modelName || '').trim().toLowerCase()
  const taskType = String(payload.taskType || '').trim().toLowerCase()
  const runwayModel = String(payload.runwayModel || '').trim().toLowerCase()
  return imageModels.value.find((model) => (
    (modelId > 0 && model.modelId === modelId)
    || (modelName && model.name.trim().toLowerCase() === modelName)
    || (taskType && String(model.taskType || '').trim().toLowerCase() === taskType)
    || (runwayModel && String(model.runwayModel || '').trim().toLowerCase() === runwayModel)
  )) || null
}

function chooseVideoSettingForAssets(assets: PrefillReferenceAsset[]) {
  if (assets.some((asset) => asset.mediaType === 'video')) return 'multimodal_ref'
  if (normalizedModelSpecialFeatures.value.has('first_frame')) return 'first_frame'
  return firstEnabledVideoSettingOption.value?.value || selectedVideoSettingFeature.value
}

function addPrefillAssetToSlot(slotKey: UploadSlotKey, asset: PrefillReferenceAsset) {
  uploadRefs.value[slotKey]?.addRemoteUrl(asset.url, {
    imageId: asset.imageId,
    mediaType: asset.mediaType,
  })
}

function videoImageReferenceTargetSlot(): UploadSlotKey | null {
  if (normalizedModelSpecialFeatures.value.has('first_frame')) {
    selectedVideoSettingFeature.value = 'first_frame'
    return 'firstFrame'
  }
  if (normalizedModelSpecialFeatures.value.has('first_last_frame')) {
    selectedVideoSettingFeature.value = 'first_last_frame'
    return 'firstFrame'
  }
  if (normalizedModelSpecialFeatures.value.has('multimodal_ref')) {
    selectedVideoSettingFeature.value = 'multimodal_ref'
    return 'reference'
  }
  return null
}

function ensureVideoModeModelForImageReference() {
  const isCurrentVideoModel = currentModel.value
    ? videoModels.value.some((model) => model.id === currentModel.value?.id)
    : false
  if (!isCurrentVideoModel) {
    currentModel.value = visibleModels.value[0] || videoModels.value.find((model) => model.caps.includes('ref')) || videoModels.value[0] || null
  }
}

function prefillVideoPathFromHistory(payload: PrefillVideoPathPayload) {
  mode.value = 'VIDEO'
  closeAll()

  const matchedModel = findVideoModelForPrefill(payload)
  if (matchedModel) currentModel.value = matchedModel

  const refs = payload.referenceAssets || []
  const hasVideoRef = refs.some((asset) => asset.mediaType === 'video')
  const hasImageRef = refs.some((asset) => asset.mediaType !== 'video')
  videoModelTab.value = hasVideoRef ? 'vid2video' : (hasImageRef ? 'img2video' : 'txt2video')

  ensureCurrentModelAvailable()
  selectedVideoSettingFeature.value = chooseVideoSettingForAssets(refs)
  normalizeVideoSettingSelection()
  applySelectionDefaults()
  selectedRatio.value = pickOptionByText(ratioOptions.value, payload.aspectRatio) || selectedRatio.value
  selectedSize.value = pickOptionByText(sizeOptions.value, payload.resolution) || selectedSize.value
  selectedCount.value = pickOptionByText(countOptions.value, payload.duration) || selectedCount.value
  setPrompt(payload.prompt || '')
  resetReferenceUploads()

  nextTick(() => {
    refs.forEach((asset) => {
      if (!asset.url || !asset.imageId) return
      if (selectedVideoSettingFeature.value === 'multimodal_ref') {
        addPrefillAssetToSlot(asset.mediaType === 'video' ? 'videoReference' : 'reference', asset)
        return
      }
      if (asset.mediaType === 'image') {
        addPrefillAssetToSlot('firstFrame', asset)
      }
    })
  })
}

function prefillImagePathFromHistory(payload: PrefillImagePathPayload) {
  mode.value = 'IMAGE'
  closeAll()

  const matchedModel = findImageModelForPrefill(payload)
  if (matchedModel) currentModel.value = matchedModel

  const refs = (payload.referenceAssets || []).filter((asset) => asset.mediaType === 'image')
  imageModelTab.value = refs.length ? 'ref2img' : 'txt2img'
  ensureCurrentModelAvailable()
  applySelectionDefaults()
  selectedRatio.value = pickOptionByText(ratioOptions.value, payload.aspectRatio) || selectedRatio.value
  selectedSize.value = pickOptionByText(sizeOptions.value, payload.imageSize) || selectedSize.value
  selectedCount.value = pickOptionByText(countOptions.value, payload.numImages) || selectedCount.value
  setPrompt(payload.prompt || '')
  resetReferenceUploads()

  nextTick(() => {
    refs.forEach((asset) => {
      if (!asset.url || !asset.imageId) return
      addPrefillAssetToSlot('reference', asset)
    })
  })
}

function setImageReferenceFromUrl(url: string) {
  const src = String(url || '').trim()
  if (!src) {
    message.warning('暂无可参考图片')
    return
  }
  if (mode.value !== 'IMAGE') {
    mode.value = 'IMAGE'
    closeAll()
    ensureCurrentModelAvailable()
    normalizeVideoSettingSelection()
    resetReferenceUploads()
  }
  onTextareaFocus()
  nextTick(() => {
    const uploaded = uploadRefs.value.reference?.addRemoteUrl(src)
    if (!uploaded) {
      message.warning('参考图添加失败')
    }
  })
}

function setVideoImageReferenceFromUrl(url: string) {
  const src = String(url || '').trim()
  if (!src) {
    message.warning('暂无可参考图片')
    return
  }
  if (mode.value !== 'VIDEO') {
    mode.value = 'VIDEO'
    closeAll()
  }
  videoModelTab.value = 'img2video'
  ensureVideoModeModelForImageReference()

  const targetSlot = videoImageReferenceTargetSlot()
  if (!targetSlot) {
    message.warning('当前模型不支持图生视频')
    return
  }

  normalizeVideoSettingSelection()
  clearUploadSlot(targetSlot)
  syncMentionDatasetsFromUploads()
  onTextareaFocus()
  nextTick(() => {
    const uploaded = uploadRefs.value[targetSlot]?.addRemoteUrl(src, { mediaType: 'image' })
    if (!uploaded) {
      message.warning('图生视频参考图添加失败')
    }
  })
}

defineExpose({
  prefillImagePathFromHistory,
  prefillVideoPathFromHistory,
  setImageReferenceFromUrl,
  setVideoImageReferenceFromUrl,
  setPrompt,
})

onMounted(() => {
  void loadModelsFromApi()
  nextTick(() => {
    const root = promptEditorRef.value
    if (!root) return
    root.textContent = prompt.value
    syncPromptFromEditor()
  })
})

watch(
  videoSettingOptions,
  () => {
    normalizeVideoSettingSelection()
  },
  { immediate: true },
)

watch(
  selectedVideoSettingFeature,
  () => {
    if (!isVideo.value) return
    pruneUploadsForCurrentModel()
  },
)

onBeforeUnmount(() => {
  clearPollingTask()
})
</script>

<style scoped lang="scss">
.generate-panel {
  // position: sticky;
  // top: 18px;
  // z-index: 30;
  position: relative;
  margin-bottom: 18px;
  // background: #fff;
}

.submit-loading-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(6px);
  cursor: wait;
}

.submit-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 220px;
  padding: 22px 24px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
}

.submit-loading-title {
  margin-top: 14px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.submit-loading-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: rgba(0, 0, 0, 0.48);
}

.panel-drag-mask {
  position: absolute;
  inset: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  border: 2px dashed rgba(105, 40, 254, 0.42);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
  pointer-events: none;
}

.panel-drag-card {
  min-width: 220px;
  padding: 18px 24px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(105, 40, 254, 0.18);
  box-shadow: 0 18px 50px rgba(105, 40, 254, 0.14);
  color: #6928fe;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  text-align: center;
}

:deep(.ant-tabs) {
  position: relative;
  z-index: 1;
}

.gen-tabs {
  &.mini{
    display:none;
  }
  :deep(.ant-tabs-nav-wrap) {
    overflow: visible;
  }

  
  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
    transform: translateY(1px);
    z-index: 3;
  }

  :deep(.ant-tabs-nav::before) {
    border-bottom: 0;
  }

  :deep(.ant-tabs-tab) {
    align-items: flex-start;
    background-color: transparent !important;
    border: none !important;
    display: inline-flex;
    height: 64px;
    margin: 0 !important;
    padding-top: 10px !important;
    transition: all 0.3s ease;
    width: 180px;
    box-shadow: none !important;
  }

  :deep(.ant-tabs-ink-bar) {
    display: none;
  }

  :deep(.ant-tabs-nav-list .ant-tabs-tab:first-child) {
    background-image: url('https://img.alicdn.com/imgextra/i1/O1CN01y0RyZw1ioHAYVewl4_!!6000000004459-2-tps-540-192.png');
    background-size: 100% 100%;
    padding-left: 32px !important;
  }

  :deep(.ant-tabs-nav-list .ant-tabs-tab.ant-tabs-tab-active:first-child) {
    background-image: url('https://img.alicdn.com/imgextra/i1/O1CN01rmkHqx1JQ7tIwEY1U_!!6000000001022-2-tps-540-192.png');
    background-size: 100% 100%;
  }

  :deep(.ant-tabs-nav-list .ant-tabs-tab:not(:first-child)) {
    background-image: url('https://img.alicdn.com/imgextra/i1/O1CN01EI3M9M1XASyBiwJtp_!!6000000002883-2-tps-540-192.png');
    background-size: 100% 100%;
    justify-content: center;
    left: -30px;
    position: relative;
  }

  :deep(.ant-tabs-nav-list .ant-tabs-tab.ant-tabs-tab-active:not(:first-child)) {
    background-image: url('https://img.alicdn.com/imgextra/i2/O1CN01vA9Aph1XDDLWMz5Ql_!!6000000002889-2-tps-540-192.png');
    background-size: 100% 100%;
  }

  :deep(.ant-tabs-tab.ant-tabs-tab-active) {
    font-family: 'PingFang SC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    letter-spacing: normal;
    z-index: 20;
  }

  :deep(.ant-tabs-tab.ant-tabs-tab-active .tab-label) {
    color: #6928fe;
  }

  :deep(.ant-tabs-content-holder) {
    display: none;
  }

  .tab-label {
    align-items: center;
    color: rgba(0, 0, 0, 0.45);
    display: flex;
    font-family: 'PingFang SC', sans-serif;
    font-size: 14px;
    gap: 8px;
    line-height: 22px;
  }

  .tab-icon-image {
    width: 16px;
    height: 16px;
    display: block;
    transition: all 0.2s ease;
  }
}

.panel-body {
  background: #fff;
  border: 1px solid #dddee3;
  border-radius: 24px;
  padding: 12px 12px 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: -24px;
  position: relative;
  z-index: 12;
  display: flex;
  flex-direction: column;
  &.mini{
    flex-direction: row;
    :deep(.stack-mode){
      --stack-gap:-5px;
    }
    .input-row{
      flex:1;
      :deep(.upload-btn){
        width: 50px;
        height: 50px;
        border:none;
      }
      :deep(.upload-list){
        min-height: 0 !important;
      }
      :deep(.upload-wrapper){
        bottom: -56px !important;
        right: 16px !important;
      }
      .editor-wrap{
        flex:1;
        padding:0;
        .prompt-editor{
          min-height: 50px;
          max-height: 50px;
          line-height: 50px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          width: 360px;
        }
      }
    }
    .left-controls{
      display: none;
    }
    .right-controls .translate{
      display: none;
    }
    
  }
}

.panel-focused {
  border-color: #6928fe;
}

.input-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;

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
    .upload-tag{
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
      z-index: 2;
      background: #e2ccff;
      border-radius: 8px;
      padding: 0px 3px;
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
      border-radius: 16px;
      object-fit: cover;
      display: block;
      cursor: zoom-in;
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
      z-index: 3;

      &:hover {
        background: rgba(0, 0, 0, 0.82);
      }
    }

    &.has-image:hover .upload-remove-btn {
      opacity: 1;
      pointer-events: auto;
    }
  }

  .editor-wrap {
    flex: 1;
    min-width: 0;
    max-height: 140px;
    padding: 4px 0 12px;

    .prompt-editor {
      width: 100%;
      min-height: 92px;
      max-height: 126px;
      padding: 0;
      border: none;
      outline: none;
      background: transparent;
      color: rgba(0, 0, 0, 0.88);
      font-family: 'PingFang SC', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;

      &:empty::before {
        content: attr(data-placeholder);
        color: rgba(0, 0, 0, 0.25);
        pointer-events: none;
      }

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background: #e8e7ea;
      }

      :deep(.prompt-mention-token) {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 28px;
        border-radius: 8px;
        background: #f5efff;
        padding: 0 8px 0 4px;
        margin: 0 4px 0 0;
        vertical-align: middle;
        cursor: pointer;
      }

      :deep(.prompt-mention-thumb),
      :deep(.prompt-mention-video) {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
      }

      :deep(.prompt-mention-label) {
        font-size: 13px;
        color: #8b52ff;
        line-height: 18px;
        font-weight: 500;
      }
    }
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

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex-wrap: nowrap;
}

.control {
  align-items: center;
  border: 1px solid #e8e7ea;
  border-radius: 18px;
  background: #fff;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  padding: 8px 8px 8px 11px;
  gap: 4px;
  transition: all 0.16s ease;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    pointer-events: none;
  }

  &:hover,
  &.open {
    background: #f3f3f5;
    border-color: #e3e4e8;
  }

  .arrow {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
    transition: transform 0.16s ease;
  }

  &.open .arrow {
    transform: rotate(180deg);
  }

  .model-selected-label {
    align-items: center;
    display: inline-flex;
    gap: 4px;
    min-width: 0;

    img {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .name {
      font-size: 12px;
      line-height: 20px;
      font-weight: 500;
      max-width: 128px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &.smart {
    .pill-text {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      font-size: 12px;
      line-height: 20px;
      font-weight: 500;
    }

    .smart-label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .pill-icon {
      color: rgba(0, 0, 0, 0.45);
      font-size: 14px;
    }

    .pill-divider {
      width: 1px;
      height: 14px;
      background: #e0e0e0;
      margin: 0 7px;
    }
  }

  &.at-btn {
    width: 36px;
    min-width: 36px;
    justify-content: center;
    padding: 0;

    .at-icon {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.65);
    }
  }
}

.setting{
  :deep(.ant-select-selector){
    height: 36px;
    font-size: 12px;
    border: 1px solid #e8e7ea !important;
    border-radius: 18px;
    box-shadow:none !important;
    padding: 0 24px 0 12px;
  }

  :deep(.ant-select-selection-item) {
    display: inline-flex;
    align-items: center;
    line-height: 34px;
    padding: 0;
  }

  :deep(.ant-select-arrow) {
    right: 10px;
  }
}

.video-setting-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: rgba(0, 0, 0, 0.88);

  &.selected {
    max-width: 78px;
  }

  &.disabled {
    color: rgba(0, 0, 0, 0.28);
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .video-setting-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
}

:global(.video-setting-dropdown) {
  width: 108px !important;
}

:global(.video-setting-dropdown .ant-select-item-option-content) {
  display: flex;
  align-items: center;
}

:global(.video-setting-dropdown .video-setting-disabled-option .video-setting-option) {
  color: rgba(0, 0, 0, 0.28);
}

:global(.video-setting-dropdown .video-setting-disabled-option .video-setting-icon) {
  opacity: 0.35;
}

:global(.video-setting-dropdown .video-setting-option) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  line-height: 22px;
}

:global(.video-setting-dropdown .video-setting-icon) {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

:global(.video-setting-dropdown .video-setting-disabled-option) {
  cursor: not-allowed;
}

:global(.video-setting-dropdown .video-setting-disabled-option .ant-select-item-option-content) {
  cursor: not-allowed;
}

:global(.video-setting-dropdown .video-setting-disabled-option .ant-select-item-option-content > span) {
  width: 100%;
}

:global(.video-setting-dropdown .ant-select-item-option) {
  min-height: 34px;
}

:global(.video-setting-dropdown .ant-select-item-option-selected:not(.video-setting-disabled-option)) {
  background: #f5f5f6;
}

:global(.video-setting-dropdown .ant-select-item-option-active:not(.video-setting-disabled-option)) {
  background: #f5f5f6;
}

:global(.video-setting-dropdown .ant-select-item-option-state) {
  display: none;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;

  .translate {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 14px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.45);
    padding: 2px 4px;
    border-radius: 4px;

    &:hover {
      background: #f3f3f5;
    }

    .translate-icon {
      font-size: 14px;
    }
  }

  .generate-tooltip-wrap {
    display: inline-flex;
  }

  .generate {
    width: auto;
    min-width: 60px;
    height: 36px;
    border-radius: 20px;
    padding: 0 12px;
    font-size: 14px;
    font-weight: 500;
    background: #000;
    border: none;
    transition: min-width 0.26s ease, padding 0.26s ease, background-color 0.2s ease;

    &.has-cost {
      
    }

    &:hover:not(:disabled) {
      background: #000;
    }

    &:disabled {
      background: #f2f2f2;
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.generate-label-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
}

.generate-cost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.credits-icon {
  width: 14px;
  height: 14px;
  display: block;
}

.generate-label-enter-active,
.generate-label-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.generate-label-enter-from,
.generate-label-leave-to {
  opacity: 0;
  transform: translateY(2px);
}

:global(.wuli-ant-popover) {
  --ant-color-bg-elevated: #fff;

  .ant-popover-inner {
    background: #fff !important;
    border-radius: 16px;
    border: 1px solid #ececf1;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    padding: 0;
  }

  .ant-popover-inner-content {
    background: #fff !important;
    padding: 0;
  }
}
.model-popover-inner {
  background: #fff;
  width: 616px;
  display: flex;
  gap: 8px;
  padding: 12px;

  &.is-video {
    width: 616px;
  }

  .model-pane-tabs {
    width: 144px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .pane-tab {
      width: 100%;
      height: 122px;
      border: none;
      border-radius: 12px;
      background: #f3f3f5;
      color: rgba(0, 0, 0, 0.45);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      line-height: 22px;

      .pane-icon {
        font-size: 24px;
        color: rgba(0, 0, 0, 0.45);
      }

      &.active {
        background: #e8e5ff;
        color: #6928fe;

        .pane-icon {
          color: #6928fe;
        }
      }
    }
  }

  &.is-video .model-pane-tabs .pane-tab {
    height: 95px;
  }

  .model-list {
    flex: 1;
    max-height: 520px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .model-empty {
    min-height: 94px;
    border: 1px dashed #e4e4ea;
    border-radius: 12px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    line-height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }

  .retry-btn {
    border: 1px solid #d7d7df;
    border-radius: 14px;
    background: #fff;
    color: rgba(0, 0, 0, 0.88);
    font-size: 12px;
    line-height: 18px;
    padding: 2px 10px;
    cursor: pointer;

    &:hover {
      background: #f7f7fa;
    }
  }

  .model-card {
    width: 100%;
    border: 1px solid #ececef;
    border-radius: 12px;
    background: #fff;
    min-height: 94px;
    padding: 11px 12px 10px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    text-align: left;
    transition: all 0.3s ease;

    &:hover {
      border-color: #8f6dff;
      background: #fcfbff;
    }

    &.active {
      background: linear-gradient(96deg, #f8ecff 3%, #ece9ff 99%);
      border-color: #8f6dff;
    }

    .model-card-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .meta {
      flex: 1;
      min-width: 0;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .title {
      font-size: 14px;
      line-height: 22px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.88);
    }
    .tag {
      background: #f5efff;
      border-radius: 8px;
      box-sizing: border-box;
      color: #8b52ff;
      display: flex;
      font-size: 11px;
      justify-content: center;
      line-height: 18px;
      padding: 2px 6px;
      font-weight: 500;
    }

    .desc {
      margin-top: 1px;
      font-size: 14px;
      line-height: 20px;
      color: #8382a4;
    }

    .cap-tags {
      margin-top: 6px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .cap-tag {
      height: 22px;
      line-height: 20px;
      border-radius: 6px;
      border: 1px solid #d4d3ec;
      padding: 0 7px 0 5px;
      font-size: 12px;
      color: #6b65a3;
      background: #f7f7ff;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .cap-tag-icon {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.45);
    }

    .cap-tag-svg {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
      opacity: 0.7;
    }

    .cap-tag.selected {
      color: #4f49d8;
      border-color: #a9a8d8;
      background: #f3f3ff;
    }

    .cap-tag.selected .cap-tag-icon {
      color: #6a63db;
    }

    .cap-tag.selected .cap-tag-svg {
      opacity: 1;
    }
  }
}

.smart-popover-inner {
  background: #fff;
  width: 334px;

  &.is-image {
    // width: 438px;
    // padding: 16px;
  }

  .block + .block {
    margin-top: 8px;
  }

  .label {
    color: rgba(26, 15, 52, 0.5);
    font-size: 14px;
    line-height: 20px;
    margin: 0 0 4px;
  }

  .options {
    background: #f3f3f5;
    border-radius: 8px;
    padding: 2px;
    display: flex;
    flex-wrap: wrap;
    gap: 2px;

    &.ratio {
      display: flex;
      justify-content: space-around;
      align-items: center;
      &.image {
        max-width: 100%;
      }
    }
    .opt{
      flex: 1;
      height: 42px;
      font-size: 12px;
      &.size-opt{
        height: 24px;
      }
    }
  }

  .opt {
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgba(0, 0, 0, 0.65);
    font-size: 14px;
    line-height: 18px;
    cursor: pointer;

    &.active {
      background: #fff;
      color: rgba(0, 0, 0, 0.88);
      box-shadow: 0 0 0 1px #ededf1 inset;
    }
  }

  .ratio-opt {
    height: 46px;
    width: 36px;
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2px;

    .ratio-icon {
      align-items: center;
      display: inline-flex;
      height: 20px;
      justify-content: center;
      width: 20px;
    }

    .ratio-smart-icon {
      font-size: 16px;
      color: rgba(0, 0, 0, 0.45);
    }

    &.active .ratio-smart-icon {
      color: rgba(0, 0, 0, 0.88);
    }
  }

  .split2 .opt,
  .split3 .opt {
    height: 24px;
  }

  &.is-image .split3 .opt {
    height: 26px;
  }
}
:deep(.ant-popover-inner){
  padding:12px;
}
.at-popover-inner {
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;

  .at-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .at-list-item {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    cursor: pointer;
    transition: all 0.18s ease;
    text-align: left;

    &:hover,
    &.selected {
      background: #f3f3f5;
    }
  }

  .at-list-thumb {
    width: 24px;
    height: 24px;
    border-radius: 5px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .at-list-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: rgba(0, 0, 0, 0.88);
    font-size: 14px;
    line-height: 20px;
    font-weight: 500;
  }
}

@media (max-width: 1280px) {
  .model-popover-inner {
    width: min(560px, calc(100vw - 180px));

    .model-card .title {
      font-size: 15px;
      line-height: 24px;
    }
  }

  .control.smart {
    max-width: 228px;
    overflow: hidden;

    .pill-text {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
