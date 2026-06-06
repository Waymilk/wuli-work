<template>
  <div class="gallery-section" teleport=".ant-layout-content">
    <div class="filter-bar-wrapper" :class="{ scrolled: isScrolled }">
      <div class="filter-bar">
        <div class="title">灵感广场</div>
        <div class="filters">
          <button
            v-for="item in filters"
            :key="item.key"
            class="filter-item"
            :class="{ active: item.key === activeFilter }"
            type="button"
            @click="onFilterChange(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <div ref="waterfallWrapperRef" class="waterfall-wrapper">
      <div class="container">
        <transition-group
          name="waterfall-switch"
          tag="div"
          class="waterfall-container"
          :class="{ switching: switching }"
          :style="{ height: `${containerHeight}px` }"
        >
          <div
            v-for="card in positionedItems"
            :key="`${activeFilter}-${card.id}`"
            class="item"
            :style="card.positionStyle"
            @click="openDetail(card)"
          >
            <div class="gallery-card">
              <div class="preview">
                <template v-if="card.type === 'VIDEO'">
                  <video class="media" :src="card.src" muted loop autoplay playsinline preload="metadata" />
                </template>
                <img v-else :src="card.src" alt="gallery" class="media" loading="lazy" crossorigin="anonymous" />

                <IconFont v-if="card.type === 'VIDEO'" type="icon-Filled-bofang" class="video-icon" />

                <img
                  class="ai-icon"
                  src="/wuli-assets/O1CN01GPOamd1PpfgoFWaoM_!!6000000001890-2-tps-267-100.png"
                  alt="AI"
                />

                <div class="overlay">
                  <div class="bottom-bar">
                    <div class="author-info">
                      <img class="avatar" :src="card.avatar" :alt="card.username" />
                      <span class="user-name">{{ card.username }}</span>
                    </div>
                    <div class="actions">
                      <IconFont type="icon-Outlined-xihuan" class="action-btn" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>

    <InspirationDetailModal v-model:open="detailOpen" :item="activeDetail" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createFromIconfontCN } from '@ant-design/icons-vue'
import InspirationDetailModal from '@/components/InspirationDetailModal.vue'
import { filters, galleryItems } from '../data/wuliData'

type FilterKey = 'ALL' | 'IMAGE' | 'VIDEO'
type RawItem = {
  id: number
  type: 'IMAGE' | 'VIDEO'
  src: string
  style: string
}

type GalleryItem = RawItem & {
  width: number
  height: number
  username: string
  avatar: string
  prompt: string
  createdAt: string
  positionStyle?: Record<string, string>
}

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/c/font_5079523_nb5cyl1zajc.js',
})

const activeFilter = ref<FilterKey>('ALL')
const switching = ref(false)
const isScrolled = ref(false)

const detailOpen = ref(false)
const activeDetail = ref<GalleryItem | null>(null)

const maxColumnCount = 5
const maxWaterfallWidth = 1356
const minColumnWidth = 220
const gap = 4
const waterfallWrapperRef = ref<HTMLElement | null>(null)
const waterfallWrapperWidth = ref(maxWaterfallWidth)

const avatarPool = [
  '/wuli-icons/avatar-default.png',
  'https://img.alicdn.com/imgextra/i3/O1CN01j4b0wh1CX89JQ8R6f_!!6000000000070-55-tps-96-96.svg',
]

function parseSize(styleText: string) {
  const widthMatch = styleText.match(/width:\s*([\d.]+)px/)
  const heightMatch = styleText.match(/height:\s*([\d.]+)px/)
  return {
    width: widthMatch ? Number(widthMatch[1]) : 268,
    height: heightMatch ? Number(heightMatch[1]) : 300,
  }
}

const normalizedItems = computed<GalleryItem[]>(() => {
  return (galleryItems as RawItem[]).map((item, idx) => {
    const size = parseSize(item.style)
    return {
      ...item,
      width: size.width,
      height: size.height,
      username: `创作者${idx + 1}`,
      avatar: avatarPool[idx % avatarPool.length],
      prompt:
        item.type === 'VIDEO'
          ? 'Slight handheld camera shake. The girl slowly tilts her head and smiles toward the camera under intense backlighting, her eyes gentle and hair swaying slightly in the golden halo. Blurred figures in the background show subtle movement. Luminous Tyndall light beams pulse and flicker, with tiny dust motes dancing in the air. Warm and soft color palette, ultra-slow and smooth motion, no physical distortion'
          : 'Cinematic portrait of a young character in warm backlight, crisp skin texture and natural expression, clean composition, soft highlights, subtle atmosphere, high-quality details.',
      createdAt: '2026-04-28 10:45:20',
    }
  })
})

const filteredItems = computed(() => {
  if (activeFilter.value === 'ALL') return normalizedItems.value
  return normalizedItems.value.filter((item) => item.type === activeFilter.value)
})

const activeColumnCount = computed(() => {
  const availableWidth = Math.max(waterfallWrapperWidth.value, minColumnWidth)
  const count = Math.floor((availableWidth + gap) / (minColumnWidth + gap))
  return Math.max(1, Math.min(maxColumnCount, count))
})

const activeColumnWidth = computed(() => {
  const columns = activeColumnCount.value
  const availableWidth = Math.max(waterfallWrapperWidth.value, minColumnWidth)
  return (availableWidth - gap * (columns - 1)) / columns
})

const positionedItems = computed<GalleryItem[]>(() => {
  const columns = activeColumnCount.value
  const columnWidth = activeColumnWidth.value
  const colHeights = Array.from({ length: columns }, () => 0)

  return filteredItems.value.map((item) => {
    let targetCol = 0
    for (let i = 1; i < columns; i += 1) {
      if (colHeights[i] < colHeights[targetCol]) targetCol = i
    }

    const left = targetCol * (columnWidth + gap)
    const top = colHeights[targetCol]
    const aspectRatio = item.width > 0 ? item.height / item.width : 1
    const scaledHeight = columnWidth * aspectRatio
    colHeights[targetCol] += scaledHeight + gap

    return {
      ...item,
      width: columnWidth,
      height: scaledHeight,
      positionStyle: {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${columnWidth}px`,
        height: `${scaledHeight}px`,
      },
    }
  })
})

const containerHeight = computed(() => {
  return positionedItems.value.reduce((max, item) => {
    const top = Number(item.positionStyle?.top?.replace('px', '') || 0)
    return Math.max(max, top + item.height)
  }, 0)
})

function onFilterChange(next: string) {
  if (activeFilter.value === next) return
  switching.value = true
  activeFilter.value = next as FilterKey
  window.setTimeout(() => {
    switching.value = false
  }, 220)
}

function openDetail(item: GalleryItem) {
  activeDetail.value = item
  detailOpen.value = true
}

let scrollHost: HTMLElement | null = null
let waterfallResizeObserver: ResizeObserver | null = null
const onScroll = () => {
  if (!scrollHost) return
  isScrolled.value = scrollHost.scrollTop > 8
}

const updateWaterfallWidth = () => {
  const nextWidth = waterfallWrapperRef.value?.getBoundingClientRect().width || maxWaterfallWidth
  waterfallWrapperWidth.value = Math.max(0, Math.floor(nextWidth))
}

onMounted(() => {
  scrollHost = document.querySelector('.explore-page') as HTMLElement | null
  if (scrollHost) {
    scrollHost.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

  updateWaterfallWidth()
  if (waterfallWrapperRef.value && typeof ResizeObserver !== 'undefined') {
    waterfallResizeObserver = new ResizeObserver(updateWaterfallWidth)
    waterfallResizeObserver.observe(waterfallWrapperRef.value)
  } else {
    window.addEventListener('resize', updateWaterfallWidth, { passive: true })
  }
})

onBeforeUnmount(() => {
  if (scrollHost) scrollHost.removeEventListener('scroll', onScroll)
  if (waterfallResizeObserver) {
    waterfallResizeObserver.disconnect()
    waterfallResizeObserver = null
  } else {
    window.removeEventListener('resize', updateWaterfallWidth)
  }
})
</script>

<style scoped lang="scss">

.gallery-section {
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 1356px;
  min-width: 0;
  position: relative;
  width: 100%;

  .filter-bar-wrapper {
    background: #fff;
    position: sticky;
    top: 0;
    transition: box-shadow 0.3s ease;
    z-index: 11;

    &.scrolled {
      // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  .filter-bar {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .title {
    color: rgba(0, 0, 0, 0.88);
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    margin-bottom: 12px;
    padding-top: 24px;
  }

  .filters {
    align-items: center;
    display: flex;
    gap: 2px;
    padding-bottom: 8px;
  }

  .filter-item {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 24px;
    color: rgba(0, 0, 0, 0.45);
    cursor: pointer;
    display: flex;
    font-size: 14px;
    font-weight: 500;
    justify-content: center;
    line-height: 22px;
    min-height: 32px;
    min-width: 60px;
    padding: 5px 16px;
    transition: all 0.3s ease;

    &:hover {
      color: rgba(0, 0, 0, 0.88);
    }

    &.active {
      background: #f3f3f5;
      color: rgba(0, 0, 0, 0.88);
    }
  }

  .waterfall-wrapper {
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    width: 100%;
  }

  .container {
    width: 100%;
  }

  .waterfall-container {
    position: relative;
    width: 100%;
    transition: opacity 0.22s ease, transform 0.22s ease;

    &.switching {
      opacity: 0.4;
      transform: translateY(6px);
    }
  }

  .item {
    position: absolute;
  }

  .waterfall-switch-enter-active,
  .waterfall-switch-leave-active {
    transition: opacity 0.22s ease, transform 0.22s ease;
  }

  .waterfall-switch-enter-from,
  .waterfall-switch-leave-to {
    opacity: 0;
    transform: translateY(8px);
  }

  .waterfall-switch-leave-active {
    position: absolute;
  }

  .gallery-card {
    cursor: pointer;
    height: 100%;
    overflow: hidden;
    position: relative;
    transition: box-shadow 0.3s ease;
    width: 100%;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

      .media {
        transform: scale(1.05);
      }

      .overlay {
        opacity: 1;
      }
    }
  }

  .preview {
    height: 100%;
    overflow: hidden;
    position: relative;
    width: 100%;
  }

  .media {
    display: block;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    width: 100%;
  }

  .video-icon {
    color: #fff;
    font-size: 16px;
    opacity: 0.5;
    pointer-events: none;
    position: absolute;
    right: 8px;
    top: 8px;
    z-index: 1;
  }

  .ai-icon {
    height: 10px;
    left: 8px;
    pointer-events: none;
    position: absolute;
    top: 8px;
    width: auto;
    z-index: 1;
  }

  .overlay {
    animation: fadeIn 0.3s ease;
    background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.6));
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    left: 0;
    opacity: 0;
    padding: 12px;
    position: absolute;
    right: 0;
    top: 0;
    transition: opacity 0.2s ease;
    z-index: 1;
  }

  .bottom-bar {
    align-items: center;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .author-info {
    align-items: center;
    display: flex;
    gap: 4px;
  }

  .avatar {
    border-radius: 50%;
    height: 24px;
    object-fit: cover;
    width: 24px;
  }

  .user-name {
    color: #fff;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  }

  .actions {
    align-items: center;
    display: flex;
  }

  .action-btn {
    background: transparent;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
    height: 20px;
    padding: 2px;
    transition: background 0.3s ease;
    width: 20px;

    &:hover {
      background: rgba(52, 50, 58, 0.4);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
