<template>
  <div class="gallery-card" @mouseenter="hovered = true" @mouseleave="hovered = false">
    <div class="media" :style="{ paddingBottom: aspectRatio }">
      <div class="preview" :style="{ background: color }"></div>
      <div v-if="type === 'video'" class="video-icon">
        <PlayCircleOutlined :style="{ fontSize: '24px', color: '#fff' }" />
      </div>
      <div class="overlay" :class="{ 'fade-in': hovered }">
        <div class="bottom-bar">
          <div class="author-info">
            <div class="avatar" :style="{ background: avatarColor }"></div>
            <span class="user-name">{{ username }}</span>
          </div>
          <div class="actions">
            <span class="action-btn">
              <HeartOutlined :style="{ fontSize: '14px' }" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlayCircleOutlined, HeartOutlined } from '@ant-design/icons-vue'

defineProps<{
  color: string
  avatarColor: string
  username: string
  type?: 'image' | 'video'
  aspectRatio: string
}>()

const hovered = ref(false)
</script>

<style scoped lang="scss">
.gallery-card {
  break-inside: avoid;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;

  .media {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 8px;
  }

  .preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
  }

  .overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 40px 12px 10px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
    opacity: 0;
    transition: opacity 0.2s;

    &.fade-in {
      opacity: 1;
    }
  }

  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .author-info {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  .user-name {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions {
    display: flex;
    align-items: center;
  }

  .action-btn {
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    padding: 4px;

    &:hover {
      color: #fff;
    }
  }
}
</style>
