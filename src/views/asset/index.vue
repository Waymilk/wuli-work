<template>
  <div class="asset-page">
    <div ref="assetContentRef" class="asset-content" @scroll="onAssetScroll">
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
            <StarOutlined />
            <span>收藏</span>
          </button>
        </div>

        <AssetTopToolbar
          v-model:query="searchQuery"
          v-model:selected-models="selectedModels"
          v-model:time-preset="timePreset"
          v-model:time-range="timeRange"
          :batch-mode="batchMode"
          :batch-action-loading="batchActionLoading"
          :model-options="modelOptions"
          :selected-count="selectedCount"
          @search="handleSearch"
          @toggle-batch="setBatchMode"
          @cancel-selection="clearSelection"
          @action="handleBatchAction"
        />
      </header>

      <main class="asset-list-wrapper">
        <div v-if="loading" class="empty-box">加载中...</div>
        <!-- <div v-else-if="loadError" class="empty-box">{{ loadError }}</div> -->
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
                @mouseenter="onAssetCardMouseEnter($event, item)"
                @mouseleave="onAssetCardMouseLeave($event, item)"
              >
                <video
                  v-if="item.type === 'VIDEO'"
                  class="asset-video"
                  :src="item.src"
                  muted
                  playsinline
                  preload="metadata"
                  @loadedmetadata="onVideoMetadataLoaded(item.id, $event)"
                />
                <img v-else :src="item.src" :alt="item.title" />
                <div v-if="item.type === 'VIDEO'" class="video-duration">{{ videoDurationMap[item.id] || '00:00' }}</div>

                <div v-if="!batchMode" class="hover-actions" @click.stop>
                  <button
                    type="button"
                    class="favorite-action"
                    :class="{ 'is-active': item.isFavorite }"
                    :aria-label="item.isFavorite ? '取消收藏' : '收藏'"
                    @click.stop="toggleAssetFavorite(item)"
                  >
                    <span class="favorite-action-star" aria-hidden="true"></span>
                  </button>
                  <!-- <button type="button" @click="noopAction">
                    <DownloadOutlined />
                  </button> -->
                  <!-- <a-popconfirm
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
                  </a-popconfirm> -->
                </div>

                <label v-if="batchMode" class="batch-check" @click.stop="toggleAssetSelection(item.id)">
                  <input type="checkbox" :checked="isSelected(item.id)" />
                </label>
              </article>
            </div>
          </section>
        </template>

        <div v-if="!loading && groupedAssets.length === 0" class="empty-box">暂无符合条件的资产</div>
        <div v-if="loadingMore" class="empty-box">加载更多中...</div>
      </main>

      <InspirationDetailModal v-model:open="detailOpen" :item="detailItem" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { StarOutlined } from '@ant-design/icons-vue'
import AssetTopToolbar from './components/AssetTopToolbar.vue'
import InspirationDetailModal, { type InspirationDetailItem } from '@/components/InspirationDetailModal.vue'
import type { BackendModelRecord } from '@/types/backend-model'
import { useModelsStore } from '@/stores/models'
import request from '@/utils/request'

type AssetType = 'IMAGE' | 'VIDEO'
type FilterType = 'ALL' | AssetType

interface AssetItem {
  date: string
  createdAt: string
  id: string
  historyId: string
  isFavorite: boolean
  model: string
  prompt: string
  src: string
  title: string
  type: AssetType
}

interface AssetHistoryPreview {
  historyId: string
  createdAt: string
  prompt: string
  model: string
  type: AssetType
  sources: string[]
}

interface ResourceQueryRequest {
  query: {
    createTimeFilter?: {
      min: number
      max: number
    }
    prompt?: string
    modelNames?: string[]
    mediaTypes?: Array<'IMAGE' | 'VIDEO'>
    star?: 1
  }
  fetch: {
    limit: number
    gmtCreate?: number
  }
}

interface ResourceQueryItem {
  id: number | string
  prompt?: string
  model_name?: string
  media_type?: 'IMAGE' | 'VIDEO' | 'MUSIC'
  result_urls?: string[]
  is_favorite?: boolean
  created_at?: string
}

interface ResourceQueryGroup {
  date: string
  items: ResourceQueryItem[]
}

interface ResourceQueryResponse {
  groups?: ResourceQueryGroup[]
  has_more?: boolean
  next_cursor?: number | null
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

const groupedAssets = ref<Array<{ date: string; items: AssetItem[] }>>([])
const hasMore = ref(false)
const nextCursor = ref<number | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const loadError = ref('')
const isBootstrapping = ref(true)
const reloadQueued = ref(false)
const assetContentRef = ref<HTMLElement | null>(null)

const activeType = ref<FilterType>('ALL')
const onlyFavorite = ref(false)
const searchQuery = ref('')
const selectedModels = ref<string[]>([])
const timePreset = ref('all')
const timeRange = ref<[number, number] | null>(null)
const batchMode = ref(false)
const selectedAssetIds = ref<string[]>([])
const batchActionLoading = ref(false)

const selectedCount = computed(() => selectedAssetIds.value.length)
const detailOpen = ref(false)
const detailItem = ref<InspirationDetailItem | null>(null)
const detailHistoryIndex = ref(-1)
const detailHistoryList = ref<AssetHistoryPreview[]>([])
const videoDurationMap = ref<Record<string, string>>({})

const isSelected = (id: string) => selectedAssetIds.value.includes(id)

const findAssetById = (id: string) => {
  for (const group of groupedAssets.value) {
    const hit = group.items.find((item) => item.id === id)
    if (hit) return hit
  }
  return null
}

const collectIdsByHistoryId = (historyId: string) => {
  const ids: string[] = []
  for (const group of groupedAssets.value) {
    for (const item of group.items) {
      if (item.historyId === historyId) ids.push(item.id)
    }
  }
  return ids
}

const toggleAssetSelection = (id: string) => {
  if (!batchMode.value) return
  const target = findAssetById(id)
  if (!target) return
  const relatedIds = collectIdsByHistoryId(target.historyId)
  if (!relatedIds.length) return
  const next = new Set(selectedAssetIds.value)
  const shouldUnselect = relatedIds.every((assetId) => next.has(assetId))
  if (shouldUnselect) {
    relatedIds.forEach((assetId) => next.delete(assetId))
  } else {
    relatedIds.forEach((assetId) => next.add(assetId))
  }
  selectedAssetIds.value = [...next]
}

const buildAssetHistorySequence = (): AssetHistoryPreview[] => {
  const historyMap = new Map<string, AssetHistoryPreview>()
  for (const group of groupedAssets.value) {
    for (const card of group.items) {
      const existing = historyMap.get(card.historyId)
      if (!existing) {
        historyMap.set(card.historyId, {
          historyId: card.historyId,
          createdAt: card.createdAt,
          prompt: card.prompt,
          model: card.model,
          type: card.type,
          sources: [card.src],
        })
        continue
      }
      if (!existing.sources.includes(card.src)) {
        existing.sources.push(card.src)
      }
    }
  }
  return Array.from(historyMap.values())
}

const openAssetDetailByHistoryIndex = (historyIndex: number, preferredSrc?: string) => {
  const history = detailHistoryList.value[historyIndex]
  if (!history || !history.sources.length) return
  const currentSrc = preferredSrc && history.sources.includes(preferredSrc) ? preferredSrc : history.sources[0]
  const thumbnails = history.sources.map((src, index) => ({
    id: `${history.historyId}-${index}`,
    src,
    type: history.type,
  }))

  detailHistoryIndex.value = historyIndex
  detailItem.value = {
    type: history.type,
    src: currentSrc,
    thumbnails,
    avatar: '/wuli-icons/avatar-default.png',
    createdAt: history.createdAt,
    prompt: history.prompt,
    model: history.model,
    primaryTag: history.type === 'VIDEO' ? '首帧' : '文生图',
    ratioOrRes: history.type === 'VIDEO' ? '3:4' : '2K',
    durationOrCount: history.type === 'VIDEO' ? '5s' : '4张',
    sizeLabel: history.type === 'VIDEO' ? '720P' : '720 x 1280',
    onPrev: () => switchAssetDetailHistory(-1),
    onNext: () => switchAssetDetailHistory(1),
  }
  detailOpen.value = true
}

const switchAssetDetailHistory = (step: -1 | 1) => {
  if (!detailHistoryList.value.length) return
  const next = (detailHistoryIndex.value + step + detailHistoryList.value.length) % detailHistoryList.value.length
  openAssetDetailByHistoryIndex(next)
}

const handleCardClick = (item: AssetItem) => {
  if (batchMode.value) {
    toggleAssetSelection(item.id)
    return
  }
  detailHistoryList.value = buildAssetHistorySequence()
  const historyIndex = detailHistoryList.value.findIndex((history) => history.historyId === item.historyId)
  if (historyIndex < 0) return
  openAssetDetailByHistoryIndex(historyIndex, item.src)
}

const formatVideoDuration = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '00:00'
  const rounded = Math.floor(totalSeconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const onVideoMetadataLoaded = (id: string, event: Event) => {
  const target = event.currentTarget as HTMLVideoElement | null
  if (!target) return
  videoDurationMap.value[id] = formatVideoDuration(target.duration)
}

const findCardVideoElement = (event: Event) => {
  const card = event.currentTarget as HTMLElement | null
  if (!card) return null
  return card.querySelector('video.asset-video') as HTMLVideoElement | null
}

const onAssetCardMouseEnter = async (event: Event, item: AssetItem) => {
  if (item.type !== 'VIDEO') return
  const video = findCardVideoElement(event)
  if (!video) return
  try {
    video.currentTime = 0
    await video.play()
  } catch {
    // noop
  }
}

const onAssetCardMouseLeave = (event: Event, item: AssetItem) => {
  if (item.type !== 'VIDEO') return
  const video = findCardVideoElement(event)
  if (!video) return
  video.pause()
  video.currentTime = 0
}

const isDateFullySelected = (items: AssetItem[]) => items.length > 0 && items.every((item) => isSelected(item.id))

const toggleDateSelection = (date: string, items: AssetItem[]) => {
  void date
  if (!items.length) return
  const historyIds = Array.from(new Set(items.map((item) => item.historyId)))
  const groupIds = historyIds.flatMap((historyId) => collectIdsByHistoryId(historyId))
  const scopedIds = Array.from(new Set(groupIds))
  if (!scopedIds.length) return
  if (isDateFullySelected(items)) {
    const ids = new Set(scopedIds)
    selectedAssetIds.value = selectedAssetIds.value.filter((id) => !ids.has(id))
    return
  }

  const next = new Set(selectedAssetIds.value)
  scopedIds.forEach((id) => next.add(id))
  selectedAssetIds.value = [...next]
}

const clearSelection = () => {
  selectedAssetIds.value = []
}

const setBatchMode = (next: boolean) => {
  batchMode.value = next
  if (!batchMode.value) clearSelection()
}

const collectSelectedHistoryIds = () => {
  const selected = new Set(selectedAssetIds.value)
  const historyIds = new Set<string>()
  for (const group of groupedAssets.value) {
    for (const item of group.items) {
      if (selected.has(item.id)) historyIds.add(item.historyId)
    }
  }
  return historyIds
}

const resolveErrorMessage = (error: unknown, fallback: string) => {
  const maybe = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
  return maybe?.response?.data?.detail || maybe?.response?.data?.message || maybe?.message || fallback
}

const confirmBatchDelete = () =>
  new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '确认删除选中的图片吗？',
      content: '删除后无法恢复',
      okText: '确定删除',
      cancelText: '取消',
      centered: true,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
      afterClose: () => resolve(false),
    })
  })

const handleBatchAction = async (action: 'favorite' | 'download' | 'delete') => {
  if (!selectedAssetIds.value.length) return
  if (batchActionLoading.value) return
  const selectedHistoryIds = collectSelectedHistoryIds()
  if (!selectedHistoryIds.size) return
  if (action === 'download') return
  if (action === 'delete') {
    const confirmed = await confirmBatchDelete()
    if (!confirmed) return
  }

  batchActionLoading.value = true
  const historyIds = Array.from(selectedHistoryIds)

  try {
    if (action === 'favorite') {
      const nextFavorite = true
      const results = await Promise.allSettled(
        historyIds.map(async (historyId) => {
          const res = await request.post<unknown, { success?: boolean; is_favorite?: boolean }>(
            `/api/history/${historyId}/favorite`,
            { favorite: nextFavorite },
          )
          const isFavorite = typeof res?.is_favorite === 'boolean' ? res.is_favorite : nextFavorite
          return { historyId, isFavorite }
        }),
      )

      const succeeded: Array<{ historyId: string; isFavorite: boolean }> = []
      let failed = 0
      for (const item of results) {
        if (item.status === 'fulfilled') succeeded.push(item.value)
        else failed += 1
      }

      for (const item of succeeded) {
        applyFavoriteStateForHistory(item.historyId, item.isFavorite)
      }

      clearSelection()
      if (failed === 0) message.success(`批量收藏成功（${succeeded.length} 条）`)
      else message.warning(`批量收藏完成：成功 ${succeeded.length} 条，失败 ${failed} 条`)
      return
    }

    if (action === 'delete') {
      const results = await Promise.allSettled(
        historyIds.map(async (historyId) => {
          await request.delete(`/api/history/${historyId}`)
          return historyId
        }),
      )

      const succeeded = new Set<string>()
      let failed = 0
      for (const item of results) {
        if (item.status === 'fulfilled') succeeded.add(item.value)
        else failed += 1
      }

      if (succeeded.size) {
        groupedAssets.value = groupedAssets.value
          .map((group) => ({ ...group, items: group.items.filter((item) => !succeeded.has(item.historyId)) }))
          .filter((group) => group.items.length > 0)
      }

      clearSelection()
      if (failed === 0) message.success(`批量删除成功（${succeeded.size} 条）`)
      else message.warning(`批量删除完成：成功 ${succeeded.size} 条，失败 ${failed} 条`)
      return
    }
  } catch (error) {
    message.error(resolveErrorMessage(error, '批量操作失败'))
  } finally {
    batchActionLoading.value = false
  }
}

const applyFavoriteStateForHistory = (historyId: string, isFavorite: boolean) => {
  groupedAssets.value = groupedAssets.value.map((group) => ({
    ...group,
    items: group.items.map((card) => (card.historyId === historyId ? { ...card, isFavorite } : card)),
  }))
}

const toggleAssetFavorite = async (item: AssetItem) => {
  const nextFavorite = !item.isFavorite
  try {
    const res = await request.post<unknown, { success?: boolean; is_favorite?: boolean }>(
      `/api/history/${item.historyId}/favorite`,
      { favorite: nextFavorite },
    )
    const finalFavorite = typeof res?.is_favorite === 'boolean' ? res.is_favorite : nextFavorite
    applyFavoriteStateForHistory(item.historyId, finalFavorite)
    message.success(finalFavorite ? '已收藏' : '已取消收藏')
  } catch (error) {
    message.error(resolveErrorMessage(error, '收藏操作失败'))
  }
}

const resolveModelLabel = (record: BackendModelRecord) => {
  return record.name?.trim() || ''
}

const isModelActive = (record: BackendModelRecord) => record.is_active !== false

function getMediaTypes(): Array<'IMAGE' | 'VIDEO'> {
  if (activeType.value === 'IMAGE') return ['IMAGE']
  if (activeType.value === 'VIDEO') return ['VIDEO']
  return ['IMAGE', 'VIDEO']
}

function getPresetTimeRange(preset: string): [number, number] | null {
  if (preset === 'all') return null
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  if (preset === 'week') return [now - 7 * dayMs, now]
  if (preset === 'month') return [now - 30 * dayMs, now]
  if (preset === 'quarter') return [now - 90 * dayMs, now]
  return null
}

function buildResourceQueryPayload(cursor?: number): ResourceQueryRequest {
  const query: ResourceQueryRequest['query'] = {
    mediaTypes: getMediaTypes(),
    modelNames: selectedModels.value.length ? [...selectedModels.value] : [...modelOptions.value],
  }

  const prompt = searchQuery.value.trim()
  if (prompt) query.prompt = prompt
  if (onlyFavorite.value) query.star = 1

  const range = timeRange.value || getPresetTimeRange(timePreset.value)
  if (range) {
    const [min, max] = range
    query.createTimeFilter = { min, max }
  }

  const fetch: ResourceQueryRequest['fetch'] = {
    limit: 40,
  }
  if (cursor) fetch.gmtCreate = cursor

  return { query, fetch }
}

function mapResourceItemToAssets(item: ResourceQueryItem, groupDate: string): AssetItem[] {
  const mediaType = item.media_type === 'VIDEO' ? 'VIDEO' : 'IMAGE'
  const resultUrls = Array.isArray(item.result_urls)
    ? item.result_urls.filter((url): url is string => typeof url === 'string' && url.length > 0)
    : []
  if (!resultUrls.length) return []

  return resultUrls.map((url, index) => ({
    id: `${String(item.id)}-${index}`,
    historyId: String(item.id),
    date: groupDate,
    createdAt: item.created_at || groupDate,
    type: mediaType,
    model: item.model_name || '',
    title: item.prompt || item.model_name || '生成结果',
    prompt: item.prompt || '',
    isFavorite: Boolean(item.is_favorite),
    src: url,
  }))
}

function mergeGroups(existing: Array<{ date: string; items: AssetItem[] }>, incoming: Array<{ date: string; items: AssetItem[] }>) {
  const map = new Map<string, AssetItem[]>()
  for (const group of existing) {
    map.set(group.date, [...group.items])
  }
  for (const group of incoming) {
    const current = map.get(group.date) || []
    const dedup = new Map<string, AssetItem>()
    for (const item of [...current, ...group.items]) {
      dedup.set(item.id, item)
    }
    map.set(group.date, Array.from(dedup.values()))
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
}

async function fetchResourceGroups(mode: 'replace' | 'append') {
  if (mode === 'replace') {
    loading.value = true
    loadError.value = ''
  } else {
    loadingMore.value = true
  }

  try {
    const payload = buildResourceQueryPayload(mode === 'append' ? (nextCursor.value || undefined) : undefined)
    const res = await request.post<unknown, ResourceQueryResponse>('/api/resource/query', payload)
    const incomingGroups = (res.groups || []).map((group) => ({
      date: group.date,
      items: (group.items || []).reduce<AssetItem[]>((acc, item) => {
        acc.push(...mapResourceItemToAssets(item, group.date))
        return acc
      }, []),
    }))

    groupedAssets.value = mode === 'append'
      ? mergeGroups(groupedAssets.value, incomingGroups)
      : incomingGroups

    hasMore.value = Boolean(res.has_more)
    nextCursor.value = res.next_cursor ?? null
  } catch (error) {
    if (mode === 'replace') {
      groupedAssets.value = []
      hasMore.value = false
      nextCursor.value = null
      loadError.value = '资产加载失败，请稍后重试'
    }
    console.error('load /api/resource/query failed', error)
  } finally {
    if (mode === 'replace') loading.value = false
    else loadingMore.value = false
  }
}

async function loadInitialResourceGroups() {
  nextCursor.value = null
  hasMore.value = false
  clearSelection()
  await fetchResourceGroups('replace')
}

async function loadMoreResourceGroups() {
  if (!hasMore.value || loading.value || loadingMore.value) return
  await fetchResourceGroups('append')
}

function onAssetScroll() {
  const el = assetContentRef.value
  if (!el || loadingMore.value || loading.value || !hasMore.value) return
  const remain = el.scrollHeight - (el.scrollTop + el.clientHeight)
  if (remain < 120) {
    void loadMoreResourceGroups()
  }
}

async function loadModelOptions() {
  await modelsStore.ensureForOtherPage()
  selectedModels.value = [...modelOptions.value]
}

function handleSearch() {
  if (isBootstrapping.value) return
  void loadInitialResourceGroups()
}

function queueReload() {
  if (isBootstrapping.value || reloadQueued.value) return
  reloadQueued.value = true
  Promise.resolve().then(() => {
    reloadQueued.value = false
    if (isBootstrapping.value) return
    void loadInitialResourceGroups()
  })
}

watch(
  [activeType, onlyFavorite, selectedModels, timePreset, timeRange],
  () => {
    queueReload()
  },
  { deep: true },
)

watch(modelOptions, (options) => {
  if (!options.length) {
    selectedModels.value = []
    return
  }
  if (!selectedModels.value.length) {
    selectedModels.value = [...options]
    return
  }
  selectedModels.value = selectedModels.value.filter((item) => options.includes(item))
  if (!selectedModels.value.length) {
    selectedModels.value = [...options]
  }
})

onMounted(() => {
  void (async () => {
    await loadModelOptions()
    isBootstrapping.value = false
    await loadInitialResourceGroups()
  })()
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

  img,
  .asset-video {
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

.video-duration {
  position: absolute;
  left: 6px;
  bottom: 6px;
  z-index: 2;
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.62);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
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

  }
}

.favorite-action-star {
  align-items: center;
  display: inline-flex;
  font-size: 12px;
  height: 12px;
  justify-content: center;
  line-height: 1;
  width: 12px;
}

.favorite-action-star::before {
  color: rgba(255, 255, 255, 0.92);
  content: '☆';
  transition: transform 0.2s ease, color 0.2s ease;
}

.favorite-action:hover .favorite-action-star::before {
  transform: scale(1.08);
}

.favorite-action.is-active .favorite-action-star::before {
  color: #fff;
  content: '★';
}

.asset-card:hover .hover-actions {
  opacity: 1;
  transform: translateY(0);
}

.asset-card:hover::before {
  opacity: 1;
}

.asset-card:hover img,
.asset-card:hover .asset-video {
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
