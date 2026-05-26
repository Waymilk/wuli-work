<template>
  <section class="generate-panel">
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
        <label class="upload-btn" :title="isVideo ? '上传首帧' : '上传参考图'">
          <span class="upload-plus">+</span>
          <input type="file" accept="image/*" multiple />
        </label>

        <div class="editor-wrap">
          <textarea
            v-model="prompt"
            :placeholder="placeholder"
            rows="1"
            @keydown.enter.exact.prevent="onGenerate"
            @click="onTextareaFocus"
          />
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
                  <button
                    v-for="modelItem in visibleModels"
                    :key="modelItem.id"
                    class="model-card"
                    :class="{ active: modelItem.name === currentModel.name }"
                    @click="selectModel(modelItem)"
                  >
                    <img class="model-card-icon" :src="modelItem.icon" :alt="modelItem.name" />
                    <div class="meta">
                      <div class="title-row">
                        <span class="title">{{ modelItem.name }}</span>
                        <span class="tag">{{ modelItem.vendor }}</span>
                      </div>
                      <div v-if="modelItem.desc" class="desc">{{ modelItem.desc }}</div>
                      <div v-if="modelItem.tags?.length" class="cap-tags">
                        <span
                          v-for="tag in modelItem.tags"
                          :key="tag"
                          class="cap-tag"
                          :class="{ selected: isCapTagSelected(tag) }"
                        >
                          <IconFont :type="capTagIcon(tag)" class="cap-tag-icon" />
                          <span>{{ tag }}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </template>

            <button class="control model" :class="{ open: modelOpen }">
              <span class="model-selected-label">
                <img :src="currentModel.icon" :alt="currentModel.name" />
                <span class="name">{{ currentModel.name }}</span>
              </span>
              <DownOutlined class="arrow" />
            </button>
          </a-popover>

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
                <div class="block">
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
                      <span>{{ ratio }}</span>
                    </button>
                  </div>
                </div>

                <div class="block">
                  <div class="label">分辨率</div>
                  <div class="options split2">
                    <button
                      v-for="size in sizeOptions"
                      :key="size"
                      class="opt"
                      :class="{ active: size === selectedSize }"
                      @click="selectedSize = size"
                    >
                      {{ size }}
                    </button>
                  </div>
                </div>

                <div class="block">
                  <div class="label">{{ isVideo ? '视频时长' : '生成数量' }}</div>
                  <div class="options split3" :class="{ image: !isVideo }">
                    <button
                      v-for="qty in countOptions"
                      :key="qty"
                      class="opt"
                      :class="{ active: qty === selectedCount }"
                      @click="selectedCount = qty"
                    >
                      {{ qty }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <button class="control smart" :class="{ open: smartOpen }">
              <span class="pill-text">
                <span class="smart-label">
                  <IconFont type="icon-zhinengbili" class="pill-icon" />
                  <span>智能匹配</span>
                </span>
                <span class="pill-divider"></span>
                <span>{{ selectedSize }}</span>
                <span class="pill-divider"></span>
                <span>{{ selectedCount }}</span>
              </span>
              <DownOutlined class="arrow" />
            </button>
          </a-popover>

          <div v-if="isVideo" class="frame-select-wrap">
            <a-select
              v-model:value="frameMode"
              class="frame-select"
              popup-class-name="wuli-frame-select-dropdown"
              dropdown-class-name="wuli-frame-select-dropdown"
              :bordered="false"
              :placement="'bottomLeft'"
              :getPopupContainer="getPopupContainer"
              @dropdown-visible-change="onFrameDropdownVisibleChange"
            >
              <template #suffixIcon>
                <DownOutlined class="arrow" />
              </template>
              <a-select-option
                v-for="item in frameOptions"
                :key="item.value"
                :value="item.value"
                :disabled="item.disabled"
                :label="item.label"
              >
                <span
                  class="frame-option-label"
                  style="display:inline-flex;align-items:center;gap:4px;font-size:12px;line-height:20px;"
                >
                  <IconFont
                    :type="item.icon"
                    class="frame-item-icon"
                    style="font-size:16px;color:rgba(0,0,0,0.65);"
                  />
                  <span>{{ item.label }}</span>
                </span>
              </a-select-option>
            </a-select>
            <!-- <IconFont :type="currentFrameOption.icon" class="frame-select-leading-icon" /> -->
          </div>

          <a-popover
            v-if="isVideo"
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
                <IconFont type="icon-a-Outlined-" class="at-empty-icon" />
                <div class="at-empty-text">暂无图片或视频</div>
              </div>
            </template>

            <button class="control at-btn" :class="{ open: atOpen }">
              <IconFont type="icon-a-Outlined-" class="at-icon" />
            </button>
          </a-popover>
        </div>

        <div class="right-controls">
          <a-button type="text" class="translate" @click="onTranslate">
            <IconFont type="icon-fanyi" class="translate-icon" />
            <span>翻译</span>
          </a-button>

          <a-button type="primary" class="generate" :disabled="!canGenerate" @click="onGenerate">
            生成
          </a-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { DownOutlined, createFromIconfontCN } from '@ant-design/icons-vue'

type ModeKey = 'IMAGE' | 'VIDEO'
type PopoverName = 'model' | 'smart' | 'at'
type ImgModelTab = 'txt2img' | 'ref2img'
type VidModelTab = 'txt2video' | 'img2video' | 'vid2video'
type ModelTabKey = ImgModelTab | VidModelTab
type FrameMode = 'FF_2_VIDEO' | 'FLF_2_VIDEO' | 'REF_2_VIDEO'

const props = defineProps<{
  showMini?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:showMini', value: boolean): void
}>()

interface ModelItem {
  id: string
  name: string
  vendor: string
  desc: string
  icon: string
  caps: Array<'text' | 'ref' | 'video'>
  tags?: string[]
}

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/c/font_5079523_nb5cyl1zajc.js',
})
const IMAGE_ICON = 'https://img.alicdn.com/imgextra/i3/O1CN01jlGaAx1HPYBGQadnN_!!6000000000750-55-tps-16-16.svg'
const IMAGE_SELECTED_ICON = 'https://img.alicdn.com/imgextra/i2/O1CN01rrNjSw28BVfxvHmCO_!!6000000007894-55-tps-16-16.svg'
const VIDEO_ICON  = 'https://img.alicdn.com/imgextra/i4/O1CN01ynewsn217CdigVvUG_!!6000000006937-55-tps-16-16.svg'
const VIDEO_SELECTED_ICON = 'https://img.alicdn.com/imgextra/i1/O1CN01ADDbzu1mKk75ZHjet_!!6000000004936-55-tps-16-16.svg'
const QWEN_ICON = 'https://img.alicdn.com/imgextra/i1/O1CN019kduFV1WbCTG2RP8P_!!6000000002806-55-tps-16-16.svg'
const SEEDREAM_ICON = 'https://img.alicdn.com/imgextra/i4/O1CN01z9hNwL1w7mQxj6k2V_!!6000000006264-55-tps-16-16.svg'
const HAPPY_HORSE_ICON = 'https://img.alicdn.com/imgextra/i2/O1CN01CHQQzM1otcX7xR6gM_!!6000000005278-55-tps-16-16.svg'

const mode = ref<ModeKey>('IMAGE')
const prompt = ref('')

const modelOpen = ref(false)
const smartOpen = ref(false)
const atOpen = ref(false)

const imageModelTab = ref<ImgModelTab>('txt2img')
const videoModelTab = ref<VidModelTab>('txt2video')

const frameOptions = [
  { value: 'FF_2_VIDEO' as FrameMode, label: '首帧', icon: 'icon-Outlined-shouzhen', disabled: false },
  { value: 'FLF_2_VIDEO' as FrameMode, label: '首尾帧', icon: 'icon-Outlined-shouweizhen', disabled: true },
  { value: 'REF_2_VIDEO' as FrameMode, label: '全能参考', icon: 'icon-Outlined-quannengcankao', disabled: false },
]
const frameMode = ref<FrameMode>('FF_2_VIDEO')

const selectedRatio = ref('智能')
const selectedSize = ref('高清2K')
const selectedCount = ref('4张')

const imageModelTabs: Array<{ key: ImgModelTab; label: string; icon: string }> = [
  { key: 'txt2img', label: '文生图', icon: 'icon-Outlined-wensheng' },
  { key: 'ref2img', label: '参考生图', icon: 'icon-zuoweicankaotu' },
]
const videoModelTabs: Array<{ key: VidModelTab; label: string; icon: string }> = [
  { key: 'txt2video', label: '文生视频', icon: 'icon-Outlined-wensheng' },
  { key: 'img2video', label: '图生视频', icon: 'icon-a-Outlined-' },
  { key: 'vid2video', label: '视频生视频', icon: 'icon-down' },
]

const imageModels: ModelItem[] = [
  { id: 'gemini-3.1-flash', name: 'Nano Banana 2', vendor: 'Google', desc: '支持图生图、文生图', icon: QWEN_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'gemini-3-pro', name: 'Nano Banana Pro', vendor: 'Google', desc: '支持图生图、文生图', icon: QWEN_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'gemini-2.5-flash', name: 'Nano Banana', vendor: 'Google', desc: '支持图生图、文生图', icon: QWEN_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'gpt-image-2', name: 'GPT Image 2', vendor: 'OpenAI', desc: '支持图生图、文生图', icon: QWEN_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'gpt-image-1.5', name: 'GPT Image 1.5', vendor: 'OpenAI', desc: '支持图生图、文生图', icon: QWEN_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'grok-imagine', name: 'Grok Imagine', vendor: 'xAI', desc: '支持图生图、文生图', icon: QWEN_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'gen-4-turbo', name: 'Gen-4 Turbo', vendor: 'Runway', desc: '支持图生图', icon: SEEDREAM_ICON, caps: ['ref'], tags: ['参考生图'] },
  { id: 'gen-4', name: 'Gen-4', vendor: 'Runway', desc: '支持图生图、文生图', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'bfl-flux-2-max', name: 'FLUX.2 Max', vendor: 'BFL', desc: '支持图生图、文生图', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'bfl-flux-2-klein', name: 'FLUX.2 Klein', vendor: 'BFL', desc: '支持图生图、文生图', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
  { id: 'seedream-5', name: 'Seedream 5.0', vendor: '字节', desc: '支持图生图、文生图', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生图', '参考生图'] },
]

const videoModels: ModelItem[] = [
  { id: 'happy-horse-1', name: 'Happy Horse 1.0', vendor: '阿里巴巴', desc: '支持图生视频、文生视频', icon: HAPPY_HORSE_ICON, caps: ['text', 'ref'], tags: ['文生视频', '图生视频'] },
  { id: 'seedance-2', name: 'Seedance 2.0', vendor: '字节', desc: '支持视频生视频、图生视频、文生视频', icon: SEEDREAM_ICON, caps: ['text', 'ref', 'video'], tags: ['文生视频', '图生视频', '视频生视频'] },
  { id: 'gen-4-5', name: 'Gen-4.5', vendor: 'Runway', desc: '支持图生视频、文生视频', icon: QWEN_ICON, caps: ['text', 'ref'], tags: ['文生视频', '图生视频'] },
  { id: 'gen-4-turbo', name: 'Gen-4 Turbo', vendor: 'Runway', desc: '支持图生视频', icon: QWEN_ICON, caps: ['ref'], tags: ['图生视频'] },
  { id: 'gen-4', name: 'Gen-4', vendor: 'Runway', desc: '支持图生视频', icon: QWEN_ICON, caps: ['ref'], tags: ['图生视频'] },
  { id: 'kling-o3-4k', name: 'Kling O3 4K', vendor: 'Kling', desc: '支持图生视频、文生视频', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生视频', '图生视频'] },
  { id: 'kling-o3-pro', name: 'Kling O3 Pro', vendor: 'Kling', desc: '支持图生视频、文生视频', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生视频', '图生视频'] },
  { id: 'kling-o3-standard', name: 'Kling O3 Standard', vendor: 'Kling', desc: '支持图生视频、文生视频', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生视频', '图生视频'] },
  { id: 'kling-3-0-4k', name: 'Kling 3.0 4K', vendor: 'Kling', desc: '支持图生视频、文生视频', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生视频', '图生视频'] },
  { id: 'kling-3-0-pro', name: 'Kling 3.0 Pro', vendor: 'Kling', desc: '支持图生视频、文生视频', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生视频', '图生视频'] },
  { id: 'kling-3-0-standard', name: 'Kling 3.0 Standard', vendor: 'Kling', desc: '支持图生视频、文生视频', icon: SEEDREAM_ICON, caps: ['text', 'ref'], tags: ['文生视频', '图生视频'] },
  { id: 'wan-2-6', name: 'WAN 2.6', vendor: 'WAN', desc: '支持图生视频', icon: QWEN_ICON, caps: ['ref'], tags: ['图生视频'] },
  { id: 'wan-2-6-flash', name: 'WAN 2.6 Flash', vendor: 'WAN', desc: '支持图生视频', icon: QWEN_ICON, caps: ['ref'], tags: ['图生视频'] },
]

const currentModel = ref<ModelItem>(imageModels[0])

const isVideo = computed(() => mode.value === 'VIDEO')
const placeholder = computed(() => isVideo.value
  ? '试试描述一段简短的故事情节（按 Enter 发送，Shift+Enter 换行）'
  : '请输入你的创意（按 Enter 发送，Shift+Enter 换行）')

const activeModelTab = computed<ModelTabKey>(() => (mode.value === 'IMAGE' ? imageModelTab.value : videoModelTab.value))

const visibleModels = computed(() => {
  if (mode.value === 'IMAGE') {
    return imageModels.filter((item) => (imageModelTab.value === 'txt2img' ? item.caps.includes('text') : item.caps.includes('ref')))
  }
  if (videoModelTab.value === 'txt2video') return videoModels.filter((item) => item.caps.includes('text'))
  if (videoModelTab.value === 'img2video') return videoModels.filter((item) => item.caps.includes('ref'))
  return videoModels.filter((item) => item.caps.includes('video'))
})

const ratioOptions = computed(() => (isVideo.value
  ? ['智能', '9:16', '3:4', '1:1', '4:3', '16:9']
  : ['智能', '9:21', '9:16', '2:3', '3:4', '1:1', '4:3', '3:2', '16:9', '21:9']))

const sizeOptions = computed(() => (isVideo.value ? ['720P', '1080P'] : ['高清2K', '超清4K']))
const countOptions = computed(() => (isVideo.value ? ['5s', '10s', '15s'] : ['1张', '2张', '3张', '4张']))
const canGenerate = computed(() => prompt.value.trim().length > 0)

function getPopupContainer(trigger: HTMLElement): HTMLElement {
  return trigger.parentElement || document.body
}

function ratioIconType(ratio: string) {
  const imageMap: Record<string, string> = {
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
    智能: 'icon-zhinengbili',
    '9:16': 'icon-a-916',
    '3:4': 'icon-a-34',
    '1:1': 'icon-a-11',
    '4:3': 'icon-a-43',
    '16:9': 'icon-a-169',
  }
  return (isVideo.value ? videoMap : imageMap)[ratio] || 'icon-zhinengbili'
}

function capTagIcon(tag: string) {
  if (tag.includes('参考')) return 'icon-zuoweicankaotu'
  if (tag.includes('图生')) return 'icon-a-Outlined-'
  if (tag.includes('视频生视频')) return 'icon-down'
  return 'icon-Outlined-wensheng'
}

function isCapTagSelected(tag: string) {
  if (mode.value === 'IMAGE') {
    return imageModelTab.value === 'txt2img' ? tag.includes('文生图') : tag.includes('参考生图')
  }
  if (videoModelTab.value === 'txt2video') return tag.includes('文生视频')
  if (videoModelTab.value === 'img2video') return tag.includes('图生视频')
  return tag.includes('视频生视频')
}

function closeAll(except?: PopoverName) {
  if (except !== 'model') modelOpen.value = false
  if (except !== 'smart') smartOpen.value = false
  if (except !== 'at') atOpen.value = false
}

function onPopoverChange(name: PopoverName, open: boolean) {
  if (open) closeAll(name)
  if (name === 'model') modelOpen.value = open
  if (name === 'smart') smartOpen.value = open
  if (name === 'at') atOpen.value = open
}

function onFrameDropdownVisibleChange(open: boolean) {
  if (open) closeAll()
}

function onModeChange(next: string | number) {
  console.log('切换模式', next)
  const resolved = next === 'VIDEO' ? 'VIDEO' : 'IMAGE'
  if (mode.value === resolved) return
  mode.value = resolved
  closeAll()

  if (resolved === 'VIDEO') {
    currentModel.value = videoModels[0]
    selectedRatio.value = '智能'
    selectedSize.value = '720P'
    selectedCount.value = '5s'
    frameMode.value = 'FF_2_VIDEO'
  } else {
    currentModel.value = imageModels[0]
    selectedRatio.value = '智能'
    selectedSize.value = '高清2K'
    selectedCount.value = '4张'
  }
}

function setModelTab(key: ModelTabKey) {
  if (mode.value === 'IMAGE') {
    imageModelTab.value = key as ImgModelTab
  } else {
    videoModelTab.value = key as VidModelTab
  }
}

function selectModel(modelItem: ModelItem) {
  currentModel.value = modelItem
  modelOpen.value = false
}

function onTranslate() {
  if (!prompt.value.trim()) {
    message.warning('请输入内容后再翻译')
    return
  }
  message.success('翻译完成')
}

function onGenerate() {
  if (!canGenerate.value) return
  message.success(isVideo.value ? '已提交视频生成任务' : '已提交图片生成任务')
}

function onTextareaFocus() {
  if (props.showMini) emit('update:showMini', false)
}
</script>

<style scoped lang="scss">
.generate-panel {
  // position: sticky;
  // top: 18px;
  // z-index: 30;
  margin-bottom: 18px;
  // background: #fff;
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
  z-index: 2;
  display: flex;
  flex-direction: column;
  &.mini{
    flex-direction: row;
    .input-row{
      flex:1;
      .upload-btn{
        width: 50px;
        height: 50px;
        border:none;
      }
      .editor-wrap{
        flex:1;
        padding:0;
        textarea{
          min-height: 50px;
          line-height: 50px;
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
  gap: 12px;

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

    &:hover {
      background: #f3f3f5;
    }

    .upload-plus {
      font-size: 26px;
      line-height: 1;
      color: rgba(0, 0, 0, 0.65);
    }

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
  }

  .editor-wrap {
    flex: 1;
    min-width: 0;
    max-height: 140px;
    padding: 4px 0 12px;

    textarea {
      width: 100%;
      min-height: 92px;
      max-height: 126px;
      padding: 0;
      border: none;
      outline: none;
      resize: none;
      background: transparent;
      color: rgba(0, 0, 0, 0.88);
      font-family: 'PingFang SC', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      overflow-y: auto;

      &::placeholder {
        color: rgba(0, 0, 0, 0.25);
      }

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background: #e8e7ea;
      }
    }
  }
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

  &:hover,
  &.open {
    background: #f3f3f5;
    border-color: #e3e4e8;
  }

  .arrow {
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
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
      font-size: 14px;
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
      font-size: 14px;
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

.frame-select-wrap {
  position: relative;

  .frame-select-leading-icon {
    color: rgba(0, 0, 0, 0.65);
    font-size: 16px;
    left: 9px;
    pointer-events: none;
    position: absolute;
    top: 10px;
    z-index: 2;
  }

  :deep(.frame-select) {
    min-width: 84px;
  }

  :deep(.frame-select .ant-select-selector) {
    align-items: center;
    background: #fff !important;
    border: 1px solid #e8e7ea !important;
    border-radius: 18px !important;
    box-shadow: none !important;
    display: flex;
    height: 36px !important;
    padding: 0 24px 0 29px !important;
  }

  :deep(.frame-select.ant-select:hover .ant-select-selector),
  :deep(.frame-select.ant-select.ant-select-open .ant-select-selector) {
    background: #f3f3f5 !important;
    border-color: #e3e4e8 !important;
  }

  :deep(.frame-select .ant-select-selection-item) {
    color: rgba(0, 0, 0, 0.88);
    font-size: 14px;
    line-height: 20px;
  }

  :deep(.frame-select .ant-select-arrow) {
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    right: 8px;
  }

  :deep(.frame-select.ant-select-open .ant-select-arrow) {
    transform: rotate(180deg);
  }
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

  .generate {
    width: 60px;
    min-width: 60px;
    height: 36px;
    border-radius: 20px;
    padding: 0 12px;
    font-size: 14px;
    font-weight: 500;
    background: #6928fe;
    border: none;

    &:hover:not(:disabled) {
      background: #7a43ff;
    }

    &:disabled {
      background: #f2f2f2;
      color: rgba(255, 255, 255, 0.9);
    }
  }
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
:deep(.frame-item-icon) {
    color: rgba(0, 0, 0, 0.65);
    font-size: 16px;
  }
:global(.wuli-frame-select-dropdown .ant-select-item-option-state) {
  display: none;
}

:global(.wuli-frame-select-dropdown .ant-select-item) {
  border-radius: 8px;
  min-height: 28px;
  padding: 4px 8px;
}

:global(.wuli-frame-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled)) {
  background: #f5f5f6;
}

:global(.wuli-frame-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled)) {
  background: #f3f3f5;
  color: rgba(0, 0, 0, 0.88);
  font-weight: 400;
}

:global(.wuli-frame-select-dropdown .ant-select-item-option-content) {
  align-items: center;
  display: flex;
}

:global(.wuli-frame-select-dropdown .ant-select-item-option-content .frame-option-label) {
  align-items: center;
  display: inline-flex;
  gap: 4px;
  font-size: 14px;
  line-height: 20px;
}

:global(.wuli-frame-select-dropdown .ant-select-item-option-content .frame-item-icon) {
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
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
      gap: 8px;
    }

    .title {
      font-size: 14px;
      line-height: 22px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.88);
    }

    .tag {
      height: 20px;
      line-height: 20px;
      border-radius: 999px;
      padding: 0 8px;
      font-size: 14px;
      color: #7a59ff;
      background: #ede7ff;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
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
      font-size: 14px;
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

    .cap-tag.selected {
      color: #4f49d8;
      border-color: #a9a8d8;
      background: #f3f3ff;
    }

    .cap-tag.selected .cap-tag-icon {
      color: #6a63db;
    }
  }
}

.smart-popover-inner {
  background: #fff;
  width: 262px;

  &.is-image {
    width: 438px;
    padding: 16px;
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
    display: grid;
    gap: 2px;

    &.ratio {
      display: flex;
      justify-content: space-around;
      align-items: center;
      &.image {
        max-width: 100%;
      }
    }

    &.split2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &.split3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));

      &.image {
        grid-template-columns: repeat(4, minmax(0, 1fr));
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

.at-popover-inner {
  background: #fff;
  width: 92px;
  height: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .at-empty-icon {
    font-size: 28px;
    color: rgba(0, 0, 0, 0.35);
  }

  .at-empty-text {
    font-size: 14px;
    line-height: 16px;
    color: rgba(0, 0, 0, 0.45);
    white-space: nowrap;
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
