<template>
  <div class="banner-section">
    <div class="carousel-wrapper">
      <a-carousel
        ref="carouselRef"
        class="banner-carousel"
        :autoplay="true"
        :autoplay-speed="5000"
      >
        <div
          v-for="item in carouselBanners"
          :key="item.image"
          class="carousel-slide"
        >
          <a :href="item.linkUrl" class="carousel-item" :style="{ backgroundImage: `url(${item.image})` }" />
        </div>
      </a-carousel>

      <button class="prev-button" type="button" @click="prevSlide">
        <IconFont type="icon-LeftTwoTone" class="arrow-icon" />
      </button>

      <button class="next-button" type="button" @click="nextSlide">
        <IconFont type="icon-RightTwoTone" class="arrow-icon" />
      </button>
    </div>

    <div class="static-wrapper">
      <a
        v-for="item in staticBanners"
        :key="item.image"
        :href="item.linkUrl"
        class="static-item"
        :style="{ backgroundImage: `url(${item.image})` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createFromIconfontCN } from '@ant-design/icons-vue'
import request from '@/utils/request'

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/c/font_5079523_nb5cyl1zajc.js',
})

type BannerItem = {
  image: string
  linkUrl: string
}

type BannerGroup = {
  id?: number
  name?: string
  images?: unknown[]
}

type BannerResponse = {
  success?: boolean
  data?: {
    banners?: BannerGroup[]
  }
  error?: string
}

const fallbackCarouselBanners: BannerItem[] = [
  {
    image: 'https://img.alicdn.com/imgextra/i2/O1CN01pspqsJ1hQd8596HyO_!!6000000004272-2-tps-1920-400.png',
    linkUrl: '/generate',
  },
  {
    image: 'https://img.alicdn.com/imgextra/i2/O1CN014U700u26CJ8Q18uA0_!!6000000007625-2-tps-1920-400.png',
    linkUrl: '/generate',
  },
]

const fallbackStaticBanners: BannerItem[] = [
  {
    image: 'https://img.alicdn.com/imgextra/i3/O1CN01UM5CYb1l5LBFVKbeY_!!6000000004767-2-tps-1200-400.png',
    linkUrl: '/generate',
  },
  {
    image: 'https://img.alicdn.com/imgextra/i1/O1CN01jmyxVg1r3rbE95Umi_!!6000000005576-2-tps-1200-400.png',
    linkUrl: '/generate',
  },
]

const carouselBanners = ref<BannerItem[]>([...fallbackCarouselBanners])
const staticBanners = ref<BannerItem[]>([...fallbackStaticBanners])
const carouselRef = ref<{ next: () => void; prev: () => void } | null>(null)

const toBannerItems = (images: unknown[] | undefined) => (
  (images || [])
    .map((image) => String(image || '').trim())
    .filter(Boolean)
    .map((image) => ({ image, linkUrl: '/generate' }))
)

async function loadBanners() {
  try {
    const res = await request.get<unknown, BannerResponse>('/api/banner')
    if (!res?.success) return
    const groups = Array.isArray(res.data?.banners) ? res.data.banners : []
    const nextCarouselBanners = toBannerItems(groups[0]?.images)
    const nextStaticBanners = [
      toBannerItems(groups[1]?.images)[0] || fallbackStaticBanners[0],
      toBannerItems(groups[2]?.images)[0] || fallbackStaticBanners[1],
    ]

    carouselBanners.value = nextCarouselBanners.length ? nextCarouselBanners : [...fallbackCarouselBanners]
    staticBanners.value = nextStaticBanners
  } catch {
    carouselBanners.value = [...fallbackCarouselBanners]
    staticBanners.value = [...fallbackStaticBanners]
  }
}

function nextSlide() {
  carouselRef.value?.next()
}

function prevSlide() {
  carouselRef.value?.prev()
}

onMounted(() => {
  void loadBanners()
})
</script>

<style scoped lang="scss">
.banner-section {
  align-items: stretch;
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-bottom: 0;
  padding-bottom: 12px;
  width: 100%;
}

.carousel-wrapper {
  aspect-ratio: 4.8;
  border-radius: 24px;
  flex: 480;
  overflow: hidden;
  position: relative;

  .prev-button,
  .next-button {
    align-items: center;
    background: transparent;
    border: none;
    color: #333;
    cursor: pointer;
    display: flex;
    justify-content: center;
    opacity: 0.5;
    padding: 0;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transition: all 0.3s ease;
    visibility: hidden;
    z-index: 10;

    .arrow-icon {
      font-size: 24px;
    }

    &:hover {
      color: #000;
      opacity: 0.5;
      transform: translateY(-50%) scale(1.1);
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }
  }

  .prev-button {
    left: 16px;
  }

  .next-button {
    right: 16px;
  }

  &:hover .prev-button,
  &:hover .next-button {
    visibility: visible;
  }
}

:deep(.banner-carousel),
:deep(.banner-carousel .slick-slider),
:deep(.banner-carousel .slick-list),
:deep(.banner-carousel .slick-track),
:deep(.banner-carousel .slick-slide) {
  height: 100%;
}

:deep(.banner-carousel .slick-slide > div) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.slick-dots) {
 z-index: 1;
}

.carousel-slide {
  height: 100%;
}

.carousel-item {
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  cursor: pointer;
  display: block;
  height: 100%;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  width: 100%;

  &::before {
    background-image: inherit;
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
    bottom: 0;
    content: '';
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    transform: scale(1);
    transition: transform 0.3s ease;
    z-index: 1;
  }

  &:hover::before {
    transform: scale(1.05);
  }
}

.static-wrapper {
  display: flex;
  flex: 600;
  flex-direction: row;
  gap: 10px;
}

.static-item {
  aspect-ratio: 3;
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 24px;
  cursor: pointer;
  flex: 1;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;

  &::before {
    background-image: inherit;
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
    bottom: 0;
    content: '';
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    transform: scale(1);
    transition: transform 0.3s ease;
    z-index: 1;
  }

  &:hover::before {
    transform: scale(1.05);
  }
}
</style>
