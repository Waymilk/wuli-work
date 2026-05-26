<template>
  <div class="canvas-page-wrapper">
    <div class="canvas-page">
      <CanvasPageTitle class="page-title-spacing" />

      <QuickTemplateSection
        class="quick-template-spacing"
        :loading="quickLoading"
        :templates="quickTemplates"
        @refresh="refreshQuickTemplates"
        @apply="handleApplyTemplate"
        @preview="openPreview"
      />

      <div class="template-list-container">
        <section class="template-list">
          <div class="filter-bar-wrapper">
            <div class="tab-container">
              <div class="tabs">
                <div class="tab" :class="{ active: activeTab === 'my' }" @click="switchTab('my')">
                  <div class="tab-content">
                    <span class="tab-text">我的</span>
                  </div>
                </div>
                <div class="tab" :class="{ active: activeTab === 'square' }" @click="switchTab('square')">
                  <div class="tab-content">
                    <span class="tab-text">模板广场</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'square'" class="filter-bar">
              <div class="categories">
                <div
                  v-for="item in categories"
                  :key="item.value"
                  class="category-tab"
                  :class="{ active: activeCategory === item.value }"
                  @click="changeCategory(item.value)"
                >
                  <div class="category-content">
                    <span class="category-text">{{ item.label }}</span>
                  </div>
                </div>
              </div>
              <div class="search-bar">
                <a-input
                  v-model:value="keyword"
                  class="search-input"
                  placeholder="搜索项目"
                  @pressEnter="searchTemplates"
                >
                  <template #prefix>
                    <SearchOutlined class="search-icon" />
                  </template>
                </a-input>
                <button type="button" class="search-btn" @click="searchTemplates">搜索</button>
              </div>
            </div>
          </div>

          <div class="waterfall-container">
            <div v-if="activeTab === 'my'" class="my-grid">
              <article class="new-project-card" @click="createProject">
                <div class="new-card-content">
                  <PlusOutlined class="new-card-icon" />
                  <span class="new-card-text">新建空白画布</span>
                </div>
              </article>

              <article
                v-for="item in myProjects"
                :key="item.canvasUuid"
                class="project-card"
                @click="openProject(item)"
              >
                <div class="cover-container">
                  <img v-if="item.coverImage?.[0]?.url" class="cover-image" :src="item.coverImage?.[0]?.url" :alt="item.canvasName || 'project'" />
                  <div v-else class="default-cover" />
                </div>
                <div class="info-container">
                  <div class="title-row">
                    <div class="title-wrapper">
                      <span class="title">{{ item.canvasName || '未命名画布' }}</span>
                    </div>
                    <MoreOutlined class="more-icon" />
                  </div>
                  <span class="update-time">刚刚修改</span>
                </div>
              </article>
            </div>

            <div v-else class="square-grid">
              <CanvasTemplateCard
                v-for="item in squareTemplates"
                :key="item.canvasUuid"
                :item="item"
                @preview="openPreview"
                @apply="handleApplyTemplate"
              />
            </div>
          </div>
        </section>
      </div>
    </div>

    <CanvasTemplatePreviewModal
      v-model:open="previewOpen"
      :categories="categories"
      :item="previewItem"
      @apply="handleApplyTemplate(previewItem)"
    />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { MoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { onMounted, ref } from 'vue'
import CanvasPageTitle from './components/CanvasPageTitle.vue'
import CanvasTemplateCard from './components/CanvasTemplateCard.vue'
import CanvasTemplatePreviewModal from './components/CanvasTemplatePreviewModal.vue'
import QuickTemplateSection from './components/QuickTemplateSection.vue'
import { fetchCanvasCategories, fetchQuickTemplates, fetchSquareTemplates } from './api'
import type { CanvasCategory, CanvasTemplate } from './types'

const activeTab = ref<'my' | 'square'>('square')
const activeCategory = ref('ALL')
const categories = ref<CanvasCategory[]>([
  { label: '全部', value: 'ALL' },
  { label: '电商', value: 'ECOM' },
  { label: '广告', value: 'ADS' },
  { label: '生活', value: 'LIFE' },
  { label: '影视', value: 'MOVIE' },
  { label: '动漫', value: 'COMIC' },
])
const keyword = ref('')

const quickLoading = ref(false)
const quickTemplates = ref<CanvasTemplate[]>([])
const quickPage = ref(1)

const squareTemplates = ref<CanvasTemplate[]>([])
const squarePage = ref(1)
const myProjects = ref<CanvasTemplate[]>([])

const previewOpen = ref(false)
const previewItem = ref<CanvasTemplate | null>(null)

const loadCategories = async () => {
  try {
    const result = await fetchCanvasCategories()
    if (result.length) {
      categories.value = result
      if (!result.find((item) => item.value === activeCategory.value)) {
        activeCategory.value = result[0].value
      }
    }
  } catch {
    // keep local fallback
  }
}

const loadQuickTemplates = async (pageNumber: number) => {
  quickLoading.value = true
  try {
    const result = await fetchQuickTemplates(pageNumber)
    if (result.length) quickTemplates.value = result
  } finally {
    quickLoading.value = false
  }
}

const loadSquareTemplates = async () => {
  const { list } = await fetchSquareTemplates({
    pageNumber: squarePage.value,
    pageSize: 36,
    category: activeCategory.value,
    canvasName: keyword.value.trim() || undefined,
  })

  squareTemplates.value = list || []
  if (!myProjects.value.length) {
    myProjects.value = (list || []).slice(0, 7)
  }
}

const refreshQuickTemplates = async () => {
  quickPage.value += 1
  await loadQuickTemplates(quickPage.value)
}

const switchTab = (tab: 'my' | 'square') => {
  activeTab.value = tab
}

const changeCategory = async (value: string) => {
  if (activeCategory.value === value) return
  activeCategory.value = value
  squarePage.value = 1
  await loadSquareTemplates()
}

const searchTemplates = async () => {
  squarePage.value = 1
  await loadSquareTemplates()
}

const openPreview = (item: CanvasTemplate) => {
  previewItem.value = item
  previewOpen.value = true
}

const handleApplyTemplate = (item: CanvasTemplate | null) => {
  if (!item) return
  message.success(`已应用模板：${item.canvasName || '未命名模板'}`)
  previewOpen.value = false
}

const createProject = () => {
  message.info('新建画布功能待接入')
}

const openProject = (item: CanvasTemplate) => {
  message.info(`打开项目：${item.canvasName || '未命名画布'}`)
}

onMounted(async () => {
  quickPage.value = Math.floor(Math.random() * 10) + 1
  await Promise.all([loadCategories(), loadQuickTemplates(quickPage.value)])
  await loadSquareTemplates()
})
</script>

<style scoped lang="scss">
.canvas-page-wrapper {
  -ms-overflow-style: none;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  width: 100%;
}

.canvas-page-wrapper::-webkit-scrollbar {
  display: none;
}

.canvas-page {
  background: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 1280px;
  padding: 24px 64px;
  width: 100%;
}

@media (min-width: 1921px) {
  .canvas-page {
    padding-left: calc(50% - 852px);
    padding-right: calc(50% - 852px);
  }
}

.page-title-spacing {
  margin-bottom: 32px;
}

.quick-template-spacing {
  margin-bottom: 36px;
}

.template-list-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
}

.template-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
}

.filter-bar-wrapper {
  align-items: flex-end;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
  padding-top: 12px;
  position: sticky;
  top: 0;
  z-index: 11;
}

.tab-container {
  display: flex;
  flex-direction: column;
  height: 36px;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}

.tabs {
  background: #f5f5f5;
  border-radius: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: 2px;
  min-height: 36px;
  min-width: 168px;
  padding: 2px 3px;
  width: fit-content;
}

.tab {
  align-items: center;
  border-radius: 24px;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 32px;
  min-width: 64px;
  padding: 0 16px;
  transition: all 0.3s ease;
  width: fit-content;
}

.tab.active {
  background: linear-gradient(180deg, #333, #282828);
}

.tab.active .tab-text {
  color: #fff !important;
}

.tab-content {
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 32px;
  justify-content: center;
  min-width: 32px;
  width: fit-content;
}

.tab-text {
  color: rgba(0, 0, 0, 0.88);
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
}

.filter-bar {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  height: 32px;
  justify-content: space-between;
  padding: 0 1px 0 0;
  width: 100%;
}

.categories {
  border-radius: 24px;
  display: flex;
  flex-direction: row;
  gap: 2px;
  min-height: 32px;
  min-width: 370px;
  width: fit-content;
}

.category-tab {
  align-items: center;
  border-radius: 24px;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 32px;
  min-width: 60px;
  padding: 5px 16px;
  transition: all 0.3s ease;
  width: fit-content;
}

.category-content {
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 22px;
  justify-content: center;
  min-width: 28px;
  width: fit-content;
}

.category-text {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  transition: color 0.3s ease;
  white-space: nowrap;
}

.category-tab:hover .category-text {
  color: rgba(0, 0, 0, 0.88);
}

.category-tab.active {
  background: #f3f3f5;
}

.category-tab.active .category-text {
  color: rgba(0, 0, 0, 0.88);
}

.search-bar {
  align-items: center;
  background: #f8f8f9;
  border-radius: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: 8px;
  height: 40px;
  min-width: 368px;
  padding: 4px;
  width: fit-content;
}

.search-input {
  background: transparent;
  border: none;
  border-radius: 24px;
  color: rgba(0, 0, 0, 0.88);
  flex: 1;
  font-size: 14px;
  font-weight: 400;
  height: 32px;
  line-height: 22px;
  padding: 0 12px;
}

.search-input:deep(.ant-input) {
  background: transparent;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
}

.search-input:deep(.ant-input-affix-wrapper) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.search-input:deep(.ant-input-prefix) {
  margin-right: 4px;
}

.search-icon {
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
}

.search-btn {
  background: linear-gradient(hsla(0, 0%, 100%, 0.1), hsla(0, 0%, 100%, 0.1)), linear-gradient(180deg, #333, #282828);
  border: none;
  border-radius: 24px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  height: 32px;
  line-height: 22px;
  min-width: 52px;
  padding: 0 12px;
  transition: all 0.3s ease;
}

.search-btn:hover {
  background: linear-gradient(hsla(0, 0%, 100%, 0.2), hsla(0, 0%, 100%, 0.2)), linear-gradient(180deg, #333, #282828);
}

.waterfall-container {
  width: 100%;
}

.my-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.square-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

@media (max-width: 1919px) {
  .my-grid,
  .square-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1439px) {
  .my-grid,
  .square-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.new-project-card {
  align-items: flex-end;
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px #e8e7ea;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  min-width: 232px;
  padding: 8px;
  transition: all 0.3s ease;
  width: 100%;
}

.new-project-card:hover {
  background: #f3f3f5;
  box-shadow: inset 0 0 0 1px #f3f3f5;
}

.new-card-content {
  align-items: center;
  background: #f3f3f5;
  border-radius: 8px;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  position: relative;
  transition: background 0.3s ease;
  width: 100%;
}

.new-card-icon {
  color: rgba(0, 0, 0, 0.45);
  font-size: 24px;
  margin-bottom: 8px;
}

.new-card-text {
  color: rgba(0, 0, 0, 0.88);
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
  white-space: nowrap;
  width: 86px;
}

.project-card {
  align-items: flex-end;
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px #e8e7ea;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
  min-width: 232px;
  padding: 8px;
  transition: all 0.3s ease;
  width: 100%;
}

.project-card:hover {
  background: #f3f3f5;
  box-shadow: inset 0 0 0 1px #f3f3f5;
}

.project-card:hover .more-icon {
  opacity: 1;
}

.cover-container {
  border-radius: 8px;
  flex: 1;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.cover-image {
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  width: 100%;
}

.default-cover {
  background-image: url('https://img.alicdn.com/imgextra/i4/O1CN01X2keIP1qfabGLVRZe_!!6000000005523-2-tps-1132-600.png');
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  height: 100%;
  transition: transform 0.3s ease;
  width: 100%;
}

.project-card:hover .cover-image,
.project-card:hover .default-cover {
  transform: scale(1.05);
}

.info-container {
  display: flex;
  flex-direction: column;
  height: 40px;
  width: 100%;
}

.title-row {
  align-items: center;
  display: flex;
  height: 20px;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.title-wrapper {
  flex: 1;
  overflow: hidden;
}

.title {
  color: rgba(0, 0, 0, 0.88);
  display: block;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-icon {
  align-items: center;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
  display: flex;
  font-size: 16px;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.update-time {
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  opacity: 0.6;
  white-space: nowrap;
}
</style>
