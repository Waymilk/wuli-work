<template>
  <div ref="rootRef" class="asset-top-toolbar">
    <div v-if="!batchMode" class="capsule">
      <div class="capsule-content">
        <div class="search-shell" :class="{ expanded: searchExpanded }">
          <button v-if="!searchExpanded" type="button" class="search-trigger" @click="expandSearch">
            <SearchOutlined />
            <span>搜索</span>
          </button>
          <div v-else class="search-expanded-inner">
            <a-input
              ref="searchInputRef"
              v-model:value="queryProxy"
              class="search-input-ant"
              placeholder="搜索提示词"
              size="small"
            >
              <template #prefix>
                  <SearchOutlined class="model-search-icon" />
              </template>
              <template #suffix>
                <CloseCircleFilled v-show="queryProxy" class="search-clear-icon" @click="clearSearch" />
              </template>
          </a-input>
            <a-button
              class="search-submit-ant"
              size="small"
              :disabled="!query.trim()"
              @click="emitSearch"
            >搜索</a-button>
          </div>
        </div>

        <div class="divider" />

        <a-popover
          v-model:open="modelOpen"
          trigger="click"
          placement="bottomLeft"
          :arrow="false"
          overlayClassName="asset-popover asset-model-popover"
          :getPopupContainer="getPopupContainer"
          @openChange="onModelOpenChange"
        >
          <template #content>
            <div class="model-popover-inner">
              <a-input
                v-model:value="modelKeyword"
                class="model-search-ant"
                placeholder="搜索模型名称"
                size="small"
                clearable
              >
                <template #suffix>
                  <SearchOutlined class="model-search-icon" />
                </template>
              </a-input>

              <div class="model-option-list">
                <label
                  v-for="model in visibleModelOptions"
                  :key="model"
                  class="model-option"
                >
                  <a-checkbox
                    :checked="isModelChecked(model)"
                    @change="onModelCheckboxChange(model, $event.target.checked)"
                  >
                    <span class="model-option-text">{{ model }}</span>
                  </a-checkbox>
                </label>
              </div>
            </div>
          </template>

          <button type="button" class="filter-pill" :class="{ active: modelOpen }">
            <FilterOutlined class="pill-icon" />
            <span>模型</span>
          </button>
        </a-popover>

        <div class="divider" />

        <a-popover
          v-model:open="timeOpen"
          trigger="click"
          placement="bottomLeft"
          :arrow="false"
          overlayClassName="asset-popover asset-time-popover"
          :getPopupContainer="getPopupContainer"
          @openChange="onTimeOpenChange"
        >
          <template #content>
            <div class="time-popover-inner">
              <div class="time-range-row">
                <a-range-picker
                  class="time-input-ant"
                  :value="rangePickerValue"
                  value-format="x"
                  :placeholder="['开始时间', '结束时间']"
                  @change="onRangeChange"
                >
                </a-range-picker>
              </div>
              <div class="quick-time-grid">
                <a-button
                  v-for="option in timeOptions"
                  :key="option.key"
                  class="quick-time-item"
                  :class="{ active: option.key === timePreset }"
                  size="small"
                  @click="selectTime(option.key)"
                >
                  {{ option.label }}
                </a-button>
              </div>
            </div>
          </template>

          <button type="button" class="filter-pill" :class="{ active: timeOpen }">
            <CalendarOutlined class="pill-icon" />
            <span>时间</span>
          </button>
        </a-popover>

        <div class="divider" />

        <button type="button" class="filter-pill" @click="toggleBatch">
          <InboxOutlined class="pill-icon" />
          <span>批量</span>
        </button>
      </div>
    </div>
    <div v-if="batchMode" class="batch-actions">
      <span class="selected-count">{{ selectedCount }} 已选择</span>
      <button
        type="button"
        class="action-btn"
        :disabled="selectedCount === 0 || batchActionLoading"
        @click="emitAction('favorite')"
      >
        <StarOutlined />
        <span>收藏</span>
      </button>
      <!-- <button type="button" class="action-btn" :disabled="selectedCount === 0" @click="emitAction('download')">
        <DownloadOutlined />
        <span>下载</span>
      </button> -->
      <button
        type="button"
        class="action-btn danger"
        :disabled="selectedCount === 0 || batchActionLoading"
        @click="emitAction('delete')"
      >
        <DeleteOutlined />
        <span>删除</span>
      </button>
      <button type="button" class="cancel-btn" :disabled="batchActionLoading" @click="cancelBatchSelection">
        <CloseOutlined />
        <span>取消选择</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  CalendarOutlined,
  CloseCircleFilled,
  CloseOutlined,
  DeleteOutlined,
  FilterOutlined,
  InboxOutlined,
  SearchOutlined,
  StarOutlined,
} from '@ant-design/icons-vue'

interface Props {
  batchMode: boolean
  batchActionLoading?: boolean
  modelOptions: string[]
  query: string
  selectedCount: number
  selectedModels: string[]
  timePreset: string
  timeRange?: [number, number] | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'action': [action: 'favorite' | 'download' | 'delete']
  'search': []
  'toggle-batch': [next: boolean]
  'update:query': [value: string]
  'update:selectedModels': [models: string[]]
  'update:timePreset': [value: string]
  'update:timeRange': [value: [number, number] | null]
  'cancel-selection': []
}>()

const rootRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<{ focus?: () => void } | null>(null)

const searchExpanded = ref(false)
const modelOpen = ref(false)
const timeOpen = ref(false)
const modelKeyword = ref('')

const queryProxy = computed({
  get: () => props.query,
  set: (value: string) => emit('update:query', value),
})

const timeOptions = [
  { key: 'all', label: '全 部' },
  { key: 'week', label: '最近一周' },
  { key: 'month', label: '最近一个月' },
  { key: 'quarter', label: '最近三个月' },
]

const allModelOptions = computed(() => ['全部', ...props.modelOptions])

const visibleModelOptions = computed(() => {
  const keyword = modelKeyword.value.trim().toLowerCase()
  if (!keyword) return allModelOptions.value
  return allModelOptions.value.filter((model) => model.toLowerCase().includes(keyword))
})

const getPresetTimeRange = (preset: string): [number, number] | null => {
  if (preset === 'all') return null
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  if (preset === 'week') return [now - 7 * dayMs, now]
  if (preset === 'month') return [now - 30 * dayMs, now]
  if (preset === 'quarter') return [now - 90 * dayMs, now]
  return null
}

const rangePickerValue = computed<[string, string] | undefined>(() => {
  const range = props.timeRange ?? getPresetTimeRange(props.timePreset)
  if (!range) return undefined
  const [min, max] = range
  return [String(min), String(max)]
})

const emitSearch = () => {
  if (!props.query.trim()) return
  emit('search')
}

const clearSearch = () => {
  queryProxy.value = ''
  emitSearch()
}

const expandSearch = async () => {
  if (!searchExpanded.value) {
    searchExpanded.value = true
    await nextTick()
    searchInputRef.value?.focus?.()
    return
  }

  if (props.query.trim()) {
    emitSearch()
    return
  }

  searchExpanded.value = false
}

const isModelChecked = (model: string) => {
  if (model === '全部') {
    if (!props.modelOptions.length) return false
    return (
      props.selectedModels.length === props.modelOptions.length &&
      props.modelOptions.every((item) => props.selectedModels.includes(item))
    )
  }
  return props.selectedModels.includes(model)
}

const onModelCheckboxChange = (model: string, checked: boolean) => {
  if (model === '全部') {
    emit('update:selectedModels', checked ? [...props.modelOptions] : [])
    return
  }

  const next = new Set(props.selectedModels)
  if (checked) next.add(model)
  else next.delete(model)
  emit('update:selectedModels', [...next])
}

const onModelOpenChange = (open: boolean) => {
  modelOpen.value = open
  if (open) {
    timeOpen.value = false
    // if (!props.query.trim()) searchExpanded.value = false
  }
}

const onTimeOpenChange = (open: boolean) => {
  timeOpen.value = open
  if (open) {
    modelOpen.value = false
    // if (!props.query.trim()) searchExpanded.value = false
  }
}

const selectTime = (preset: string) => {
  emit('update:timePreset', preset)
  emit('update:timeRange', getPresetTimeRange(preset))
}

const onRangeChange = (_dates: unknown, dateStrings: [string, string] | string[]) => {
  const [start, end] = Array.isArray(dateStrings) ? dateStrings : []
  const hasStart = start !== undefined && start !== null && String(start).trim() !== ''
  const hasEnd = end !== undefined && end !== null && String(end).trim() !== ''
  if (!hasStart || !hasEnd) {
    emit('update:timePreset', 'all')
    emit('update:timeRange', null)
    return
  }

  const min = Number(start)
  const max = Number(end)
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    emit('update:timePreset', 'all')
    emit('update:timeRange', null)
    return
  }
  emit('update:timePreset', 'all')
  emit('update:timeRange', [min, max])
}

const toggleBatch = () => {
  searchExpanded.value = false
  modelOpen.value = false
  timeOpen.value = false
  emit('toggle-batch', true)
}

const emitAction = (action: 'favorite' | 'download' | 'delete') => {
  emit('action', action)
}

const cancelBatchSelection = () => {
  emit('cancel-selection')
  emit('toggle-batch', false)
}

const getPopupContainer = () => rootRef.value || document.body

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target || !rootRef.value || rootRef.value.contains(target)) return
  if (!props.query.trim()) searchExpanded.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped lang="scss">
.asset-top-toolbar {
  position: relative;
}

.capsule {
  border-radius: 20px;
  background: #efeff2;
  border: 1px solid rgba(5, 5, 5, 0.04);
  height: 40px;
  padding: 4px 5px;
}

.capsule-content {
  display: flex;
  align-items: center;
  border-radius: 16px;
  height: 32px;
}

.search-shell {
  width: 64px;
  height: 32px;
  border-radius: 12px;
  overflow: hidden;
  transition: width 0.26s cubic-bezier(0.4, 0, 0.2, 1);

  &.expanded {
    width: 238px;
  }
}

.search-trigger {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  :deep(svg) {
    font-size: 14px;
  }
}

.search-expanded-inner {
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 4px 0 8px;
  gap: 6px;
  
}

.search-input-ant {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  border-inline-end-width:0;
  box-shadow: none;
  padding: 0;
  :deep(.ant-input-affix-wrapper) {
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    border-radius: 0;
  }

  :deep(.ant-input) {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.88);
    background: transparent;
  }
}

.search-submit-ant{
  height: 32px;
  border-radius: 100px;
  background: #000;
  font-size: 14px;
  font-weight: 500;
  padding: 0 12px;
  color: #fff;
  cursor: pointer;
  &:hover{
    color: #fff;
  }
  &:disabled {
    background: #fff;
    color: rgba(0, 0, 0, 0.45);
  }
}

.divider {
  width: 1px;
  height: 13px;
  background: rgba(5, 5, 5, 0.06);
}

.filter-pill {
  border: none;
  background: transparent;
  border-radius: 10px;
  height: 32px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  cursor: pointer;

  &:hover,
  &.active {
    background: #f5f5f7;
  }

  .pill-icon {
    font-size: 14px;
  }

  .arrow {
    font-size: 9px;
    color: rgba(0, 0, 0, 0.35);
  }
}

.batch-actions {
  height: 40px;
  border-radius: 20px;
  background: #efeff2;
  border: 1px solid rgba(5, 5, 5, 0.04);
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  gap: 10px;
}

.selected-count {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.action-btn,
.cancel-btn {
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  font-size: 13px;

  :deep(svg) {
    font-size: 14px;
  }

  &:disabled {
    color: rgba(0, 0, 0, 0.25);
    cursor: not-allowed;
  }
}

.action-btn.danger {
  color: #f25858;
}

.cancel-btn {
  color: rgba(0, 0, 0, 0.45);
}

:global(.asset-popover .ant-popover-inner) {
  border-radius: 10px;
  border: 1px solid rgba(5, 5, 5, 0.05);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.11);
  padding: 16px 0;
}

:global(.asset-time-popover .ant-popover-inner){
  padding: 12px;
}

.model-popover-inner {
  padding: 0 16px;
  width: 232px;
   :deep(.ant-input-affix-wrapper) {
    background:#f8f8f9;
    border: none !important;
    border-radius: 8px;
    padding: 8px;
  }
}

.model-search-ant {
  :deep(.ant-input-affix-wrapper) {
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(5, 5, 5, 0.05);
    background: #f3f3f5;
    box-shadow: none;
    padding: 0 8px;
  }

  :deep(.ant-input) {
    font-size: 14px;
    background: transparent;
  }
 
}

.model-search-icon {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.35);
}
.search-clear-icon{
  font-size: 14px;
  color: rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.model-option-list {
  margin-top: 8px;
  max-height: 284px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  &::-webkit-scrollbar{
    display: none;
  }
}

.model-option {
  font-size: 14px;
  gap: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    background: #f3f3f5;
  }

  :deep(.ant-checkbox-wrapper) {
    width: 100%;
    margin: 0;
    color: rgba(0, 0, 0, 0.88);
  }

  :deep(.ant-checkbox) {
    top: 0;
  }

  :deep(.ant-checkbox-inner) {
    width: 14px;
    height: 14px;
    border-radius: 3px;
  }
}

.model-option-text {
  color: rgba(0, 0, 0, 0.78);
}

.time-popover-inner {
  // padding: 0 16px;
}

.time-range-row {
  gap: 6px;
  align-items: center;
}

.time-input-ant {
  :deep(.ant-input) {
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(5, 5, 5, 0.05);
    background: #f3f3f5;
    padding: 0 8px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.35);
  }
}

.time-to {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.35);
}

.quick-time-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.quick-time-item {
  height: 40px;
  border-radius: 8px;
  background: #fff;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  box-shadow: none;
  padding: 0;

  &:hover {
    background: #f3f3f5;
    color: rgba(0, 0, 0, 0.88);
    border-color: transparent;
  }

  &.active {
    border-color: transparent;
    color: #6928fe;
    font-weight: 700;
    background: #f3f3f5;
  }
}
</style>
