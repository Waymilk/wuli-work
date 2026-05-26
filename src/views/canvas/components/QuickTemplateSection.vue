<template>
  <section class="quick-template-section">
    <div class="header">
      <span class="title">快速模板</span>
      <button type="button" class="refresh-button" :disabled="loading" @click="$emit('refresh')">
        {{ loading ? '加载中...' : '换一批' }}
      </button>
    </div>
    <div class="template-list">
      <CanvasTemplateCard
        v-for="item in templates.slice(0, columnCount)"
        :key="item.canvasUuid"
        :item="item"
        @preview="$emit('preview', $event)"
        @apply="$emit('apply', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CanvasTemplateCard from './CanvasTemplateCard.vue'
import type { CanvasTemplate } from '../types'

const props = defineProps<{
  loading: boolean
  templates: CanvasTemplate[]
}>()

defineEmits<{
  apply: [item: CanvasTemplate]
  preview: [item: CanvasTemplate]
  refresh: []
}>()

const columnCount = computed(() => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1920
  if (width >= 1920) return 6
  if (width >= 1440) return 5
  return 4
})
</script>

<style scoped lang="scss">
.quick-template-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.header {
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 24px;
  justify-content: space-between;
  overflow: hidden;
  width: 100%;
}

.title {
  color: var(--text-primary, rgba(0, 0, 0, 0.88));
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
}

.refresh-button {
  background: none;
  border: none;
  color: var(--text-primary, rgba(0, 0, 0, 0.88));
  cursor: pointer;
  font-size: 12px;
  font-weight: 400;
  line-height: 22px;
  opacity: 0.7;
  padding: 0;
  transition: opacity 0.3s ease;
  white-space: nowrap;
}

.refresh-button:hover {
  opacity: 1;
}

.template-list {
  display: grid;
  gap: 16px;
  height: 140px;
  width: 100%;
}

@media (max-width: 1439px) {
  .template-list {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1440px) and (max-width: 1919px) {
  .template-list {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1920px) {
  .template-list {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>
