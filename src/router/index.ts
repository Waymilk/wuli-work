import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layout/AppLayout.vue'),
      redirect: '/explore',
      children: [
        {
          path: 'explore',
          name: 'explore',
          component: () => import('@/views/explore/index.vue'),
        },
        {
          path: 'generate',
          name: 'generate',
          component: () => import('@/views/generate/index.vue'),
        },
        {
          path: 'asset',
          name: 'asset',
          component: () => import('@/views/asset/index.vue'),
        },
        {
          path: 'canvas',
          name: 'canvas',
          component: () => import('@/views/canvas/index.vue'),
        }
      ],
    },
  ],
})

export default router
