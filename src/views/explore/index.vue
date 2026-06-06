<template>
  <div class="explore-page">
    <PageTitle />
    <GenerateTabPanel pollMode="external" modelsFetchMode="explore" @task-created="onTaskCreated" />
    <BannerSection />
    <GallerySection />
  </div>
</template>

<script setup lang="ts">
import GenerateTabPanel from '@/components/GenerateTabPanel.vue'
import type { GenerateTaskCreatedPayload } from '@/stores/generateTasks'
import { useGenerateTasksStore } from '@/stores/generateTasks'
import { useRouter } from 'vue-router'
import PageTitle from './components/PageTitle.vue'
import BannerSection from './components/BannerSection.vue'
import GallerySection from './components/GallerySection.vue'

const router = useRouter()
const generateTasksStore = useGenerateTasksStore()

function onTaskCreated(payload: GenerateTaskCreatedPayload) {
  generateTasksStore.enqueueTask(payload)
  void router.push('/generate')
}
</script>

<style scoped lang="scss">
.explore-page {
    box-sizing: border-box;
    overflow-y: auto;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    max-width: 1492px;
    min-width: 0;
    padding-left: clamp(16px, 4vw, 68px);
    padding-right: clamp(16px, 4vw, 68px);
    scrollbar-width: none;
}

@media (max-width: 1280px) {
  .explore-page {
    overflow-y: auto;
    width: 100%;
  }
}
</style>
