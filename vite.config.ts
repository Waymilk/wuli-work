import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const fastStartup = process.env.FAST_STARTUP === '1'

export default defineConfig({
  plugins: [vue()],
  server: {},
  optimizeDeps: {
    entries: ['index.html'],
    noDiscovery: true,
    include: fastStartup
      ? ['vue', 'vue-router', 'pinia', 'axios']
      : ['vue', 'vue-router', 'pinia', 'axios', 'ant-design-vue', '@ant-design/icons-vue'],
    exclude: fastStartup ? ['ant-design-vue', '@ant-design/icons-vue'] : [],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
