<template>
  <div class="page-title">
    <span class="welcome-text">欢迎来到呜哩</span>
    <div class="mascot-container">
      <img
        :class="['mascot-image', { 'mascot-image-fade': showVideo, 'mascot-image-visible': showImageOverlay }]"
        :src="mascotImage"
        alt="mascot"
      />
      <video
        v-if="showVideo"
        ref="videoRef"
        class="mascot-video"
        :src="mascotVideo"
        muted
        playsinline
        @ended="handleVideoEnded"
      />
    </div>
    <div class="right-text">
      <span class="canvas-gradient">无限画布</span>
      <span class="description">，想创作点什么</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const mascotImage = 'https://img.alicdn.com/imgextra/i3/O1CN01uaNpNi24nkHUE50sB_!!6000000007436-2-tps-960-960.png'
const mascotVideo = 'https://cloud.video.taobao.com/vod/k8QcHBJnW2mWTi2Mx4lI8Pp2oTxYZRyKkSHDG8xDTXY.mp4'

const showImageOverlay = ref(false)
const showVideo = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)

watch(
  () => mascotVideo,
  async () => {
    showVideo.value = true
    await nextTick()
    if (!videoRef.value) return
    videoRef.value.load()
    void videoRef.value.play().catch(() => null)
  },
  { immediate: true },
)

const handleVideoEnded = () => {
  showImageOverlay.value = true
  window.setTimeout(() => {
    showVideo.value = false
    showImageOverlay.value = false
  }, 150)
}
</script>

<style scoped lang="scss">
.page-title {
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.welcome-text {
  color: var(--text-primary, rgba(0, 0, 0, 0.88));
  font-family: 'Alimama FangYuanTi VF', 'PingFang SC', sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 34px;
  white-space: nowrap;
}

.mascot-container {
  flex-shrink: 0;
  height: 118px;
  position: relative;
  width: 118px;
}

.mascot-image {
  height: 118px;
  left: 0;
  opacity: 1;
  position: absolute;
  top: 0;
  transition: opacity 0.15s ease;
  width: 118px;
}

.mascot-image-fade {
  opacity: 0;
}

.mascot-image-visible {
  opacity: 1;
}

.mascot-video {
  height: 118px;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 118px;
}

.right-text {
  align-items: center;
  display: flex;
  flex-direction: row;
  font-family: 'Alimama FangYuanTi VF', 'PingFang SC', sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 34px;
  white-space: nowrap;
}

.canvas-gradient {
  -webkit-text-fill-color: transparent;
  background: linear-gradient(90deg, #713dea, #eb3b5d);
  -webkit-background-clip: text;
  background-clip: text;
}

.description {
  color: var(--text-primary, rgba(0, 0, 0, 0.88));
}
</style>
