<template>
  <a-layout class="app-layout">
    <a-layout-sider class="sider">
      <AppSider />
    </a-layout-sider>
    <a-layout-content class="content">
      <router-view :key="contentViewKey" />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSider from './AppSider.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const contentViewKey = computed(() => `${route.fullPath}::${authStore.pageRefreshKey}`)
</script>

<style scoped lang="scss">
.app-layout {
  height: 100vh;
  overflow: hidden;
  width: 100vw;
  background: linear-gradient(180deg, #f9fffe, #f2f3fe 37%, #fdf9fe);
  .sider {
    background: transparent;
    flex: 0 0 auto;
    max-width: 88px !important;
    min-width: 88px !important;
    position: relative;
    width: 88px !important;
    z-index: 999;
    height: 100vh;
  }

  .content{
      background-color:#fff;
      border-bottom-left-radius: 24px;
      border-top-left-radius: 24px;
      display: flex;
      flex: 1 1 auto;
      height: 100%;
      overflow: hidden;
  }
}
</style>
