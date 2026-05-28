<template>
  <div class="generate-page-wrapper">
    <div class="generate-page">
      <div class="generate-container">
        <section class="history-section">
          <div ref="scrollContainerRef" class="scroll-container" @scroll="handleScroll">
            <article v-for="item in historyItems" :key="item.taskId" class="history-item">
              <div class="prompt-section">
                <div v-if="item.inputImages.length" class="input-image-stack" style="--img-count: 1; --stack-count: 1">
                  <div class="input-image-stack-item" style="--index: 0">
                    <img class="input-image" :src="item.inputImages[0]" alt="IMAGE1" />
                    <img
                      class="input-image-check-icon"
                      src="/wuli-generate-assets/O1CN01jL39pm1uM8Dc0zKLu_!!6000000006022-55-tps-18-17.svg"
                      alt="add-icon"
                    />
                  </div>
                </div>

                <div class="prompt-text-wrap">
                  <div class="prompt-text">{{ item.prompt }}</div>
                  <div class="prompt-tags">
                    <button type="button" class="prompt-tag">
                      <IconFont type="icon-shiyongtishici" />
                      <span>使用提示词</span>
                    </button>
                    <button type="button" class="prompt-tag">
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
                <div class="meta-item"><span>{{ item.countLabel }}</span></div>
                <div class="meta-item"><span>{{ item.ratioLabel }}</span></div>
              </div>

              <div class="grid-wrap" :style="{ '--result-aspect-ratio': aspectRatioCss(item.aspectRatio || item.ratioLabel) }">
                <div
                  v-for="slotIndex in slotCount(item)"
                  :key="`${item.taskId}-slot-${slotIndex}`"
                  class="grid-item"
                  :class="[itemClass(slotIndex - 1, slotCount(item)), { 'is-loading-slot': !item.resultImages[slotIndex - 1] }]"
                  @click="item.resultImages[slotIndex - 1] ? openPreviewDetail(item.taskId, slotIndex - 1) : undefined"
                >
                  <div v-if="item.resultImages[slotIndex - 1]" class="grid-item-content">
                    <img class="grid-image" :src="item.resultImages[slotIndex - 1]" :alt="`preview-${slotIndex}`" />

                    <div class="grid-image-actions">
                      <button type="button" class="grid-image-action" aria-label="下载" @click.stop.prevent="noopAction">
                        <IconFont type="icon-xiazai" />
                      </button>
                      <button type="button" class="grid-image-action" aria-label="删除" @click.stop.prevent="noopAction">
                        <IconFont type="icon-shanchu" />
                      </button>
                      <button type="button" class="grid-image-action" aria-label="收藏" @click.stop.prevent="noopAction">
                        <IconFont type="icon-shoucang" />
                      </button>
                    </div>

                    <div class="grid-image-footer-actions">
                      <button
                        type="button"
                        class="grid-image-action grid-image-action-disabled"
                        aria-label="超分"
                        @click.stop.prevent="noopAction"
                      >
                        <IconFont type="icon-Outlined-chaofenbianshuai" />
                      </button>
                      <button type="button" class="grid-image-action" aria-label="作为参考图" @click.stop.prevent="noopAction">
                        <IconFont type="icon-zuoweicankaotu" />
                      </button>
                      <button type="button" class="grid-image-action" aria-label="图生视频" @click.stop.prevent="noopAction">
                        <IconFont type="icon-tushengshipin" />
                      </button>
                    </div>
                  </div>

                  <div v-else class="grid-item-content pending-grid-content">
                    <ASkeletonImage class="pending-skeleton-image" :active="item.status !== 'FAILED' && item.status !== 'CANCELLED'" />
                    <div class="pending-title">{{ pendingTitle(item) }}</div>
                    <div class="pending-subtitle">{{ pendingSubtitle(item) }}</div>
                    <ASpin v-if="item.status !== 'FAILED' && item.status !== 'CANCELLED'" size="small" />
                  </div>
                </div>
              </div>

              <div class="actions-row">
                <button type="button" class="action-button">
                  <IconFont type="icon-zhongxinbianji" />
                  <span>重新编辑</span>
                </button>
                <button type="button" class="action-button">
                  <IconFont type="icon-zaicishengcheng" />
                  <span>再次生成</span>
                </button>
                <button type="button" class="action-button icon-only" aria-label="删除" @click="removeHistoryItem(item.taskId)">
                  <IconFont type="icon-shanchu" />
                </button>
              </div>
            </article>
            <div v-if="!historyItems.length" class="history-empty">暂无历史任务，先去生成一条吧</div>
          </div>
        </section>

        <section class="chat-section-wrapper">
          <div class="chat-section" :class="{'mini':showMini}">
            <button type="button" class="scroll-to-bottom" :class="{'mini':showMini}" @click="scrollToBottom">
              <span>回到底部</span>
              <IconFont type="icon-down" />
            </button>
            <GenerateTabPanel
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
import { Skeleton as ASkeleton, Spin as ASpin } from 'ant-design-vue'
import GenerateTabPanel from '@/components/GenerateTabPanel.vue'
import { computed, ref } from 'vue'
import InspirationDetailModal, { type InspirationDetailItem } from '@/components/InspirationDetailModal.vue'
import { useGenerateTasksStore, type GenerateHistoryItem, type GenerateTaskCreatedPayload } from '@/stores/generateTasks'

const ASkeletonImage = ASkeleton.Image

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/c/font_5079523_nb5cyl1zajc.js',
})

const scrollContainerRef = ref<HTMLElement | null>(null)
const showMini = ref(false)
const detailOpen = ref(false)
const detailItem = ref<InspirationDetailItem | null>(null)
const generateTasksStore = useGenerateTasksStore()
const historyItems = computed(() => generateTasksStore.items)

const handleScroll = () => {
  if (scrollContainerRef.value) {
    const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.value
    showMini.value = scrollTop + clientHeight < scrollHeight - 1
  }
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

const pendingTitle = (item: GenerateHistoryItem) => {
  if (item.status === 'FAILED' || item.status === 'CANCELLED') return '生成失败'
  if (item.resultImages.length > 0) return '继续生成中...'
  return '生成中...'
}

const pendingSubtitle = (item: GenerateHistoryItem) => {
  if (item.status === 'FAILED' || item.status === 'CANCELLED') {
    return item.errorMessage || '任务执行失败'
  }
  return item.progressText || '任务正在处理'
}

const aspectRatioCss = (ratioLabel: string) => {
  const match = String(ratioLabel || '').match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/)
  if (!match) return '1/1'
  return `${match[1]}/${match[2]}`
}

const openPreviewDetail = (taskId: string, idx: number) => {
  const item = historyItems.value.find((row) => row.taskId === taskId)
  if (!item || !item.resultImages.length) return

  const thumbnails = item.resultImages.map((src, imageIndex) => ({
    id: `preview-${imageIndex}`,
    src,
    type: 'IMAGE' as const,
  }))

  detailItem.value = {
    type: 'IMAGE',
    src: item.resultImages[idx] || item.resultImages[0],
    thumbnails,
    avatar: item.inputImages[0],
    createdAt: item.createdAt,
    prompt: item.prompt,
    model: item.modelLabel,
    primaryTag: '文生图',
    ratioOrRes: item.ratioLabel,
    durationOrCount: item.countLabel,
    sizeLabel: item.sizeLabel,
  }
  detailOpen.value = true
}

const removeHistoryItem = (taskId: string) => {
  generateTasksStore.removeTask(taskId)
}

const noopAction = () => {}
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
  --img-width: 48px;
  --img-height: 48px;
  --img-offset: 10px;
  --img-degree: 10deg;
  --img-x-offset: 3px;
  --img-y-offset: 1px;
  flex-shrink: 0;
  height: var(--img-height);
  margin-right: 16px;
  position: relative;
  transition: all 0.3s ease;
  width: calc(var(--img-width) + var(--img-offset) * (var(--stack-count) - 1));
}

.input-image-stack-item {
  height: var(--img-height);
  left: 0;
  position: absolute;
  transform: translateX(calc(var(--img-x-offset) * 0)) translateY(calc(var(--img-y-offset) * 0 * -1)) rotate(calc(var(--img-degree) * 0));
  transform-origin: right bottom;
  transition: all 0.3s ease;
  width: var(--img-width);
  z-index: 5;
}

.input-image {
  border: 1px solid #fff;
  border-radius: 12px;
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
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
}

.prompt-text {
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  box-sizing: content-box;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
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
  font-size: 14px;
  gap: 4px;
  height: 28px;
  line-height: 20px;
  padding: 0 12px;
}

.meta-icon {
  height: 16px;
  width: 16px;
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

.grid-item {
  aspect-ratio: var(--result-aspect-ratio);
  border-radius: 8px;
  min-width: 0;
  position: relative;
  user-select: none;
  width: 100%;
}

.pending-grid-content {
  align-items: center;
  background: linear-gradient(135deg, #f8f8fc 0%, #f1f1f8 100%);
  cursor: default;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  padding: 20px 16px;
  text-align: center;
}

.pending-skeleton-image {
  :deep(.ant-skeleton-image) {
    border-radius: 8px;
    height: min(42%, 160px);
    width: min(72%, 200px);
  }
}

.pending-title {
  color: rgba(0, 0, 0, 0.88);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.pending-subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  line-height: 20px;
  margin-top: -2px;
  max-width: 80%;
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

.grid-item :deep(.anticon) {
  color: #fff;
  font-size: 16px;
}

.grid-image-actions,
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

.grid-image-actions {
  top: 8px;
}

.grid-image-footer-actions {
  bottom: 8px;
}

.grid-item:hover .grid-image-actions,
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

.chat-section-wrapper {
  bottom: 24px;
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
  font-size: 14px;
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
  bottom: 4px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 10px;
  left: 0;
  line-height: 20px;
  position: fixed;
  right: 0;
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
