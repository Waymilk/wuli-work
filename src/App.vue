<template>
  <a-config-provider
    :theme="{
      algorithm: defaultAlgorithm,
    }"
  >
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { theme } from 'ant-design-vue'

const { defaultAlgorithm } = theme
</script>
