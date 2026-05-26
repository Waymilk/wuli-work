<template>
  <div class="filter-bar">
    <div class="categories">
      <div
        v-for="cat in categories"
        :key="cat.value"
        class="category-tab"
        :class="{ active: activeCategory === cat.value }"
        @click="activeCategory = cat.value"
      >
        <span class="category-text">{{ cat.label }}</span>
      </div>
    </div>
    <div class="search-bar">
      <a-input
        v-model:value="searchText"
        placeholder="搜索作品"
        class="search-input"
        allow-clear
      >
        <template #prefix>
          <SearchOutlined style="color: rgba(0,0,0,0.45)" />
        </template>
      </a-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

const activeCategory = ref('all')
const searchText = ref('')

const categories = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
]
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 0;
  background: #fff;

  .categories {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .category-tab {
    padding: 6px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;

    &:hover {
      background: #ececf2;
    }

    &.active {
      background: #e8e8ee;

      .category-text {
        color: rgba(0, 0, 0, 0.88);
        font-weight: 500;
      }
    }
  }

  .category-text {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
    line-height: 1.4;
  }

  .search-bar {
    width: 200px;
  }

  .search-input {
    :deep(.ant-input-affix-wrapper) {
      background: #fff;
      border: 1px solid #e6e6eb;
      border-radius: 20px;
      color: rgba(0, 0, 0, 0.88);
    }

    :deep(.ant-input) {
      background: transparent;
      color: rgba(0, 0, 0, 0.88);

      &::placeholder {
        color: rgba(0, 0, 0, 0.35);
      }
    }
  }
}
</style>
