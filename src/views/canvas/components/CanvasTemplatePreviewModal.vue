<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :width="1200"
    :centered="true"
    :destroy-on-close="true"
    wrap-class-name="wuli-canvas-preview-modal"
    @cancel="$emit('update:open', false)"
  >
    <div class="modal-content">
      <div class="left">
        <img class="preview-image" :src="coverUrl" :alt="item?.canvasName || 'template'" />
      </div>
      <div class="right">
        <button type="button" class="close-btn" @click="$emit('update:open', false)">关闭</button>
        <div class="title">{{ item?.canvasName || '未命名模板' }}</div>
        <div class="meta">
          <span class="tag">{{ categoryLabel }}</span>
          <span class="tag">{{ item?.gmtModified || '-' }}</span>
        </div>
        <button type="button" class="apply-btn" @click="$emit('apply')">应用</button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasCategory, CanvasTemplate } from '../types'

const props = defineProps<{
  categories: CanvasCategory[]
  item: CanvasTemplate | null
  open: boolean
}>()

defineEmits<{
  apply: []
  'update:open': [value: boolean]
}>()

const coverUrl = computed(() => props.item?.coverImage?.[0]?.url || '')
const categoryLabel = computed(() => {
  const value = props.item?.canvasCategory
  return props.categories.find((c) => c.value === value)?.label || value || '全部'
})
</script>

<style scoped lang="scss">
.modal-content {
  display: flex;
  gap: 24px;
  height: 680px;
}

.left {
  align-items: center;
  background: #f8f8f9;
  border-radius: 16px;
  display: flex;
  flex: 1;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.right {
  display: flex;
  flex-direction: column;
  width: 320px;
}

.close-btn {
  align-self: flex-end;
  background: transparent;
  border: none;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  font-size: 14px;
  height: 32px;
  line-height: 22px;
}

.title {
  color: rgba(0, 0, 0, 0.88);
  font-size: 20px;
  font-weight: 600;
  line-height: 30px;
  margin-top: 8px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  background: #f3f3f5;
  border-radius: 999px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  line-height: 20px;
  padding: 2px 10px;
}

.apply-btn {
  background: linear-gradient(180deg, #333, #282828);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  height: 40px;
  line-height: 22px;
  margin-top: auto;
}
</style>

<style lang="scss">
.wuli-canvas-preview-modal .ant-modal-content {
  border-radius: 24px;
  padding: 24px;
}

.wuli-canvas-preview-modal .ant-modal-body {
  padding: 0;
}
</style>
