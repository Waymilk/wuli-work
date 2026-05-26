<template>
  <article class="template-card" :style="cardStyle" @click="$emit('preview', item)">
    <div class="preview-container">
      <template v-if="isVideo">
        <video class="cover-video" :src="coverUrl" muted playsinline preload="metadata" />
      </template>
      <template v-else>
        <img class="cover-image" :src="coverUrl" :alt="item.canvasName || 'template'" />
      </template>
      <div class="overlay">
        <div class="info-bar">
          <span class="title">{{ item.canvasName || '未命名模板' }}</span>
          <div class="actions">
            <button type="button" class="action-btn" @click.stop="$emit('apply', item)">
              <span class="btn-content">
                <span class="btn-text">应用</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasTemplate } from '../types'

const props = defineProps<{
  item: CanvasTemplate
}>()

defineEmits<{
  apply: [item: CanvasTemplate]
  preview: [item: CanvasTemplate]
}>()

const cover = computed(() => props.item.coverImage?.[0])
const coverUrl = computed(() => cover.value?.url || '')
const isVideo = computed(() => (cover.value?.mediaType || '').toUpperCase() === 'VIDEO')

const cardStyle = computed(() => {
  const width = cover.value?.width || 200
  const height = cover.value?.height || 200
  return {
    aspectRatio: `${width} / ${height}`,
  }
})
</script>

<style scoped lang="scss">
.template-card {
  align-items: center;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.preview-container {
  border-radius: 16px;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
  z-index: 0;
}

.cover-image,
.cover-video {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.cover-image {
  transition: transform 0.3s ease;
}

.template-card:hover .cover-image {
  transform: scale(1.05);
}

.template-card:hover .overlay {
  opacity: 1;
}

.overlay {
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.68));
  bottom: 0;
  height: 70px;
  left: 0;
  pointer-events: none;
  position: absolute;
  width: 100%;
  z-index: 1;
}

.info-bar {
  align-items: center;
  bottom: 6px;
  display: flex;
  flex-direction: row;
  gap: 4px;
  left: 8px;
  min-height: 24px;
  pointer-events: auto;
  position: absolute;
  right: 8px;
  z-index: 2;
}

.title {
  color: #fff;
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  gap: 4px;
}

.action-btn {
  align-items: center;
  backdrop-filter: blur(2px);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 24px;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 24px;
  min-width: 40px;
  padding: 0 8px;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.btn-content {
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 24px;
  justify-content: center;
  min-width: 24px;
}

.btn-text {
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  line-height: 22px;
  white-space: nowrap;
}
</style>
