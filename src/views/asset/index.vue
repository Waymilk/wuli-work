<template>
  <div class="asset-page">
    <div class="asset-content">
      <header class="asset-filter-bar">
        <div class="left-filters">
          <div class="type-tabs" role="radiogroup" aria-label="资产类型">
            <button
              v-for="tab in typeTabs"
              :key="tab.key"
              type="button"
              class="type-tab"
              :class="{ active: activeType === tab.key }"
              @click="activeType = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <button type="button" class="fav-btn" :class="{ active: onlyFavorite }" @click="onlyFavorite = !onlyFavorite">
            <StarFilled />
            <span>收藏</span>
          </button>
        </div>

        <AssetTopToolbar
          v-model:query="searchQuery"
          v-model:selected-models="selectedModels"
          v-model:time-preset="timePreset"
          :batch-mode="batchMode"
          :model-options="modelOptions"
          :selected-count="selectedCount"
          @toggle-batch="setBatchMode"
          @cancel-selection="clearSelection"
          @action="handleBatchAction"
        />
      </header>

      <main class="asset-list-wrapper">
        <template v-for="group in groupedAssets" :key="group.date">
          <section class="asset-date-group">
            <div class="date-header">
              <strong class="date-text">{{ group.date }}</strong>
              <button
                v-if="batchMode"
                type="button"
                class="select-all-btn"
                @click="toggleDateSelection(group.date, group.items)"
              >
                {{ isDateFullySelected(group.items) ? '取消全选' : '全选' }}
              </button>
            </div>

            <div class="image-row">
              <article
                v-for="item in group.items"
                :key="item.id"
                class="asset-card"
                :class="{ selected: isSelected(item.id), batch: batchMode }"
                @click="handleCardClick(item)"
              >
                <img :src="item.src" :alt="item.title" />

                <div v-if="!batchMode" class="hover-actions" @click.stop>
                  <button type="button" @click="noopAction">
                    <StarOutlined />
                  </button>
                  <button type="button" @click="noopAction">
                    <DownloadOutlined />
                  </button>
                  <a-popconfirm
                    overlay-class-name="asset-delete-popconfirm"
                    placement="bottomLeft"
                    title="确认删除选中的图片吗？"
                    ok-text="确定删除"
                    cancel-text="取消"
                    @confirm="removeAsset(item.id)"
                  >
                    <template #description>删除后无法恢复</template>
                    <button type="button" @click.stop>
                      <DeleteOutlined />
                    </button>
                  </a-popconfirm>
                </div>

                <label v-if="batchMode" class="batch-check" @click.stop="toggleAssetSelection(item.id)">
                  <input type="checkbox" :checked="isSelected(item.id)" />
                </label>
              </article>
            </div>
          </section>
        </template>

        <div v-if="groupedAssets.length === 0" class="empty-box">暂无符合条件的资产</div>
      </main>

      <InspirationDetailModal v-model:open="detailOpen" :item="detailItem" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DeleteOutlined, DownloadOutlined, StarFilled, StarOutlined } from '@ant-design/icons-vue'
import AssetTopToolbar from './components/AssetTopToolbar.vue'
import InspirationDetailModal, { type InspirationDetailItem } from '@/components/InspirationDetailModal.vue'
import type { BackendModelRecord } from '@/types/backend-model'
import { useModelsStore } from '@/stores/models'

type AssetType = 'IMAGE' | 'VIDEO'
type FilterType = 'ALL' | AssetType

interface AssetItem {
  date: string
  id: string
  isFavorite: boolean
  model: string
  prompt: string
  src: string
  title: string
  type: AssetType
}

const typeTabs = [
  { key: 'ALL', label: '全部' },
  { key: 'IMAGE', label: '图片' },
  { key: 'VIDEO', label: '视频' },
] as const

const modelsStore = useModelsStore()
const modelOptions = computed(() => {
  const imageModels = (modelsStore.modelsResponse?.database?.image || []).filter(isModelActive).map(resolveModelLabel)
  const videoModels = (modelsStore.modelsResponse?.database?.video || []).filter(isModelActive).map(resolveModelLabel)
  return Array.from(new Set([...imageModels, ...videoModels].filter(Boolean)))
})

const assets = ref<AssetItem[]>([
  {
    id: 'asset-1',
    date: '2026-05-23',
    type: 'IMAGE',
    model: 'Qwen Image 2.0',
    title: '生成 q 版',
    prompt: 'Q版卡通角色',
    isFavorite: false,
    src: '/wuli-generate-assets/adfd71078ea1599faf8633d424158d96.jpeg',
  },
  {
    id: 'asset-2',
    date: '2026-05-23',
    type: 'IMAGE',
    model: 'Happy Horse 1.0',
    title: '生成 q 版',
    prompt: 'Q版角色特写',
    isFavorite: false,
    src: '/wuli-generate-assets/b4ea5a59cb84522eab89803ac07329ca.jpeg',
  },
  {
    id: 'asset-3',
    date: '2026-05-23',
    type: 'IMAGE',
    model: 'Qwen Image 25.11',
    title: '生成 q 版',
    prompt: '角色证件照',
    isFavorite: true,
    src: '/wuli-generate-assets/eb0891ddd3c640a28ae0c7008df4c184.png',
  },
  {
    id: 'asset-4',
    date: '2026-05-23',
    type: 'IMAGE',
    model: 'Qwen Image 25.12',
    title: '生成 q 版',
    prompt: 'Q版角色全身像',
    isFavorite: false,
    src: '/wuli-generate-assets/c6f4edc63aff5ae9ac2c79fcb38b01a2.jpeg',
  },
  {
    id: 'asset-5',
    date: '2026-05-22',
    type: 'IMAGE',
    model: 'Qwen Image 25.08',
    title: '生成 q 版',
    prompt: '黑底Q版角色',
    isFavorite: false,
    src: '/wuli-generate-assets/adfd71078ea1599faf8633d424158d96.jpeg',
  },
  {
    id: 'asset-6',
    date: '2026-05-22',
    type: 'IMAGE',
    model: 'Seedream 5.0 Lite',
    title: '生成 q 版',
    prompt: '暖色Q版角色',
    isFavorite: false,
    src: '/wuli-generate-assets/b4ea5a59cb84522eab89803ac07329ca.jpeg',
  },
  {
    id: 'asset-7',
    date: '2026-05-22',
    type: 'IMAGE',
    model: 'Qwen Image 2.0',
    title: '生成 q 版',
    prompt: '淡黄色角色',
    isFavorite: false,
    src: '/wuli-generate-assets/eb0891ddd3c640a28ae0c7008df4c184.png',
  },
  {
    id: 'asset-8',
    date: '2026-05-22',
    type: 'IMAGE',
    model: '可灵 3.0',
    title: '生成 q 版',
    prompt: '白底Q版角色',
    isFavorite: false,
    src: '/wuli-generate-assets/c6f4edc63aff5ae9ac2c79fcb38b01a2.jpeg',
  },
  {
    id: 'asset-9',
    date: '2026-05-16',
    type: 'IMAGE',
    model: '可灵 3.0 Omni',
    title: '生成 q 版',
    prompt: '灰白底Q版角色',
    isFavorite: false,
    src: '/wuli-generate-assets/adfd71078ea1599faf8633d424158d96.jpeg',
  },
  {
    id: 'asset-10',
    date: '2026-05-16',
    type: 'IMAGE',
    model: 'Happy Horse 1.0',
    title: '生成 q 版',
    prompt: '浅黄底Q版角色',
    isFavorite: false,
    src: '/wuli-generate-assets/b4ea5a59cb84522eab89803ac07329ca.jpeg',
  },
  {
    id: 'asset-11',
    date: '2026-05-16',
    type: 'IMAGE',
    model: 'Qwen Image 25.11',
    title: '生成 q 版',
    prompt: '深色短发角色',
    isFavorite: false,
    src: '/wuli-generate-assets/eb0891ddd3c640a28ae0c7008df4c184.png',
  },
  {
    id: 'asset-12',
    date: '2026-05-16',
    type: 'IMAGE',
    model: 'Qwen Image 2.0',
    title: '生成 q 版',
    prompt: '浅色短发角色',
    isFavorite: false,
    src: '/wuli-generate-assets/c6f4edc63aff5ae9ac2c79fcb38b01a2.jpeg',
  },
])

const activeType = ref<FilterType>('ALL')
const onlyFavorite = ref(false)
const searchQuery = ref('')
const selectedModels = ref<string[]>([])
const timePreset = ref('all')
const batchMode = ref(false)
const selectedAssetIds = ref<string[]>([])

const selectedCount = computed(() => selectedAssetIds.value.length)
const detailOpen = ref(false)
const detailItem = ref<InspirationDetailItem | null>(null)

const filteredAssets = computed(() => {
  const now = new Date('2026-05-23T00:00:00+08:00').getTime()

  return assets.value.filter((item) => {
    if (activeType.value !== 'ALL' && item.type !== activeType.value) return false
    if (onlyFavorite.value && !item.isFavorite) return false

    if (selectedModels.value.length) {
      if (!selectedModels.value.includes(item.model)) return false
    }

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase()
      const target = `${item.prompt} ${item.model} ${item.title}`.toLowerCase()
      if (!target.includes(query)) return false
    }

    if (timePreset.value !== 'all') {
      const date = new Date(`${item.date}T00:00:00+08:00`).getTime()
      const diffDay = (now - date) / (1000 * 60 * 60 * 24)
      if (timePreset.value === 'week' && diffDay > 7) return false
      if (timePreset.value === 'month' && diffDay > 30) return false
      if (timePreset.value === 'quarter' && diffDay > 90) return false
    }

    return true
  })
})

const groupedAssets = computed(() => {
  const map = new Map<string, AssetItem[]>()
  filteredAssets.value.forEach((item) => {
    if (!map.has(item.date)) map.set(item.date, [])
    map.get(item.date)!.push(item)
  })

  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
})

const isSelected = (id: string) => selectedAssetIds.value.includes(id)

const toggleAssetSelection = (id: string) => {
  if (!batchMode.value) return
  if (isSelected(id)) {
    selectedAssetIds.value = selectedAssetIds.value.filter((item) => item !== id)
    return
  }
  selectedAssetIds.value = [...selectedAssetIds.value, id]
}

const handleCardClick = (item: AssetItem) => {
  if (batchMode.value) {
    toggleAssetSelection(item.id)
    return
  }

  detailItem.value = {
    type: item.type,
    src: item.src,
    avatar: '/wuli-icons/avatar-default.png',
    createdAt: `${item.date} 10:45:20`,
    prompt: item.prompt,
    model: item.model,
    primaryTag: item.type === 'VIDEO' ? '首帧' : '文生图',
    ratioOrRes: item.type === 'VIDEO' ? '3:4' : '2K',
    durationOrCount: item.type === 'VIDEO' ? '5s' : '4张',
    sizeLabel: item.type === 'VIDEO' ? '720P' : '720 x 1280',
  }
  detailOpen.value = true
}

const isDateFullySelected = (items: AssetItem[]) => items.length > 0 && items.every((item) => isSelected(item.id))

const toggleDateSelection = (date: string, items: AssetItem[]) => {
  void date
  if (!items.length) return
  if (isDateFullySelected(items)) {
    const ids = new Set(items.map((item) => item.id))
    selectedAssetIds.value = selectedAssetIds.value.filter((id) => !ids.has(id))
    return
  }

  const next = new Set(selectedAssetIds.value)
  items.forEach((item) => next.add(item.id))
  selectedAssetIds.value = [...next]
}

const clearSelection = () => {
  selectedAssetIds.value = []
}

const setBatchMode = (next: boolean) => {
  batchMode.value = next
  if (!batchMode.value) clearSelection()
}

const removeAsset = (id: string) => {
  assets.value = assets.value.filter((item) => item.id !== id)
  selectedAssetIds.value = selectedAssetIds.value.filter((item) => item !== id)
}

const handleBatchAction = (action: 'favorite' | 'download' | 'delete') => {
  if (!selectedAssetIds.value.length) return
  if (action === 'delete') {
    const selected = new Set(selectedAssetIds.value)
    assets.value = assets.value.filter((item) => !selected.has(item.id))
    clearSelection()
    return
  }

  if (action === 'favorite') {
    const selected = new Set(selectedAssetIds.value)
    assets.value = assets.value.map((item) =>
      selected.has(item.id) ? { ...item, isFavorite: true } : item,
    )
  }
}

const noopAction = () => undefined

const resolveModelLabel = (record: BackendModelRecord) => {
  return record.name?.trim() || ''
}

const isModelActive = (record: BackendModelRecord) => record.is_active !== false

async function loadModelOptions() {
  await modelsStore.ensureForOtherPage()
  selectedModels.value = selectedModels.value.filter((item) => modelOptions.value.includes(item))
}

onMounted(() => {
  void loadModelOptions()
})
</script>

<style scoped lang="scss">
.asset-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
}

.asset-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding:24px;
}

.asset-filter-bar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 2px;
}

.left-filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-tabs {
  height: 36px;
  border-radius: 18px;
  background: #efeff2;
  display: flex;
  align-items: center;
  padding: 3px;

  gap: 4px;
}

.type-tab {
  border: none;
  height: 32px;
  border-radius: 15px;
  background: transparent;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;

  &.active {
    background: rgba(5, 5, 5, 0.9);
    color: #fff;
    font-weight: 500;
  }
}

.fav-btn {
  border: none;
  height: 36px;
  border-radius: 18px;
  background: #efeff2;
  border: 1px solid rgba(5, 5, 5, 0.04);
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);

  :deep(svg) {
    font-size: 13px;
  }

  &.active {
    color: #fff;
    background: rgb(0, 0, 0);
  }
}

.asset-list-wrapper {
  padding-top: 8px;
}

.asset-date-group {
  margin-bottom: 26px;
}

.date-header {
  height: 31px;
  display: flex;
  align-items: center;
  gap: 12px;
 
}

.date-text {
  line-height: 31px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  letter-spacing: -0.1px;
  font-size: 16px;
}

.select-all-btn {
  height: 20px;
  border-radius: 10px;
  border: 1px solid rgba(5, 5, 5, 0.06);
  background: #fff;
  color: rgba(0, 0, 0, 0.45);
  padding: 0 8px;
  font-size: 14px;
  cursor: pointer;
}

.image-row {
  margin-top: 2px;
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  row-gap: 2px;
}

.asset-card {
  width: 128px;
  height: 128px;
  border-radius: 0;
  position: relative;
  overflow: hidden;
  background: #ebebef;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.12);
    opacity: 0;
    transition: opacity 0.18s ease;
    z-index: 1;
    pointer-events: none;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  &.batch::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.08);
  }

  &.selected {
    box-shadow: inset 0 0 0 2px #6928fe;
  }
}

.hover-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 0;
  height: 18px;
  border-radius: 9px;
  background: rgba(15, 15, 15, 0.62);
  padding: 0 2px;
  opacity: 0;
  transform: translateY(-1px);
  transition: opacity 0.18s ease, transform 0.18s ease;
  z-index: 2;

  button {
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.16);
    }

    :deep(svg) {
      font-size: 10px;
    }
  }
}

.asset-card:hover .hover-actions {
  opacity: 1;
  transform: translateY(0);
}

.asset-card:hover::before {
  opacity: 1;
}

.asset-card:hover img {
  transform: scale(1.012);
  filter: saturate(0.95);
}

.batch-check {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  width: 14px;
  height: 14px;

  input {
    width: 14px;
    height: 14px;
    margin: 0;
    accent-color: #6928fe;
  }
}

.empty-box {
  margin-top: 80px;
  text-align: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

:global(.asset-delete-popconfirm .ant-popover-inner) {
  border-radius: 12px;
  padding: 12px 12px 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
}

:global(.asset-delete-popconfirm .ant-popconfirm-message-title) {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
}

:global(.asset-delete-popconfirm .ant-popconfirm-description) {
  font-size: 14px;
  line-height: 18px;
  color: rgba(0, 0, 0, 0.45);
}

:global(.asset-delete-popconfirm .ant-popconfirm-buttons .ant-btn) {
  height: 28px;
  border-radius: 14px;
  font-size: 14px;
  padding: 0 14px;
}

:global(.asset-delete-popconfirm .ant-popconfirm-buttons .ant-btn-primary) {
  background: #6928fe;
  border-color: #6928fe;
}
</style>
