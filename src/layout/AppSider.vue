<template>
  <aside class="sider">
    <div class="sider-children">
      <div class="top">
        <img src="/wuli-icons/logo.svg" alt="呜哩AI" class="logo" />
        <nav class="menu">
          <router-link
            v-for="item in menuItems"
            :key="item.key"
            :to="item.path"
            class="menu-item"
            active-class="menu-item-selected"
          >
            <span class="menu-icon">
              <img :src="activeIcon(item)" :alt="item.title" class="icon-inner" />
            </span>
            <span class="menu-title">{{ item.title }}</span>
          </router-link>
        </nav>
      </div>

      <div class="bottom">
        <div class="credit-wrapper" role="button" tabindex="0" @click="openInviteModal">
          <div class="wuli-baby-gif">
            <img src="/wuli-icons/wuli-baby.png" alt="呜哩宝宝" />
          </div>
          <div class="credit-content">
            <div class="credit">
              <img src="/wuli-icons/credit.svg" class="credit-icon" alt="credit" />
              <span class="credit-text">30</span>
            </div>
            <span class="invite-tip">邀请有礼</span>
          </div>
        </div>

        <button class="avatar-button" type="button" @click="handleAvatarClick">
          <img class="avatar" src="/wuli-icons/avatar-default.png" alt="avatar" />
        </button>

        <button class="icon-btn api-token-entry" type="button" @click="apiModalOpen = true">
          <IconFont type="icon-Outlined-API" class="icon-24" />
        </button>

        <button
          ref="messageBtnRef"
          class="icon-btn message-button"
          type="button"
          :class="{ 'is-active': messagePanelOpen }"
          @click="toggleMessagePanel"
        >
          <IconFont type="icon-Outlined-xiaoxi" class="icon-24" />
        </button>

        <a-popover
          v-model:open="morePopoverOpen"
          trigger="click"
          placement="rightBottom"
          :show-arrow="false"
          overlayClassName="sider-more-popover"
        >
          <template #content>
            <div class="more-popover-menu" @click.stop>
              <button type="button" class="more-popover-item" @click="onMoreMenuAction('agreement')">平台协议</button>
              <button type="button" class="more-popover-item" @click="onMoreMenuAction('feedback')">问题反馈</button>
              <!-- <div
                class="more-popover-item with-submenu"
                @mouseenter="openThemeSubmenu"
                @mouseleave="closeThemeSubmenuWithDelay"
                @click.stop="toggleThemeSubmenu"
              >
                <span>浅色模式</span>
                <span class="submenu-arrow">›</span>
                <div
                  v-if="themeSubmenuOpen"
                  class="theme-submenu"
                  @mouseenter="openThemeSubmenu"
                  @mouseleave="closeThemeSubmenu"
                >
                  <button type="button" class="theme-submenu-item is-active">
                    <span class="theme-item-left">◉ 浅色模式</span>
                    <span class="theme-item-check">✓</span>
                  </button>
                  <button type="button" class="theme-submenu-item">
                    <span class="theme-item-left">◉ 深色模式</span>
                  </button>
                  <button type="button" class="theme-submenu-item">
                    <span class="theme-item-left">◉ 跟随系统 · 浅色</span>
                  </button>
                </div>
              </div> -->
              <!-- <button type="button" class="more-popover-item" @click="onMoreMenuAction('experience')">体验优化计划</button> -->
              <!-- <button type="button" class="more-popover-item" @click="onMoreMenuAction('watermark')">AI生成水印设置</button> -->
              <button type="button" class="more-popover-item" @click="onMoreMenuAction('account')">账号设置</button>
              <!-- <button type="button" class="more-popover-item" @click="onMoreMenuAction('about')">关于我们</button> -->
              <button type="button" class="more-popover-item" @click="onMoreMenuAction('logout')">退出</button>
            </div>
          </template>
          <button class="icon-btn extra" type="button" :class="{ 'is-active': morePopoverOpen }">
            <IconFont type="icon-gengduoshezhi" class="icon-24" />
          </button>
        </a-popover>
      </div>
    </div>

    <transition name="message-panel-fade">
      <div v-if="messagePanelOpen" ref="messagePanelRef" class="message-panel">
        <div class="message-panel-header">
          <h4>消息中心</h4>
          <button class="mark-read" type="button">一键已读</button>
        </div>
        <div class="message-panel-empty">
          <img
            src="https://img.alicdn.com/imgextra/i4/O1CN01b1wYZA1j8fEAzEpnQ_!!6000000004500-2-tps-128-128.png"
            alt="暂无消息"
          />
          <span>暂无消息</span>
        </div>
      </div>
    </transition>

    <a-modal
      v-model:open="inviteModalOpen"
      :footer="null"
      :width="980"
      centered
      :closable="false"
      wrapClassName="sider-invite-modal"
    >
      <button class="wuli-modal-close invite-close" type="button" @click="inviteModalOpen = false">×</button>
      <div class="invite-modal-content">
        <div class="invite-user-row">
          <img class="invite-avatar" src="/wuli-icons/avatar-default.png" alt="avatar" />
          <span class="invite-username">用户3529_2654</span>
        </div>

        <div class="invite-summary-grid">
          <div class="summary-card">
            <div class="summary-head">
              <span class="summary-head-left">✦ 当前方案</span>
              <span class="summary-head-link">订阅管理 ›</span>
            </div>
            <div class="summary-value">免费</div>
            <button type="button" class="summary-action">去兑换</button>
          </div>
          <div class="summary-card">
            <div class="summary-head">
              <span class="summary-head-left">✦ 积分</span>
              <span class="summary-head-link">积分详情 ›</span>
            </div>
            <div class="summary-value">30</div>
            <button type="button" class="summary-action">去购买</button>
          </div>
          <div class="summary-banner">
            <div class="summary-banner-title">立即邀请 →</div>
            <div class="summary-banner-link">我的邀请记录 ›</div>
          </div>
        </div>

        <h3 class="plan-title">会员方案</h3>
        <div class="plan-grid">
          <div class="plan-card free-plan">
            <div class="plan-name-row">
              <h4>免费</h4>
            </div>
            <p class="plan-desc">适合初次接触的小白或入门生图用户</p>
            <div class="plan-price-row">
              <span class="plan-price">0</span>
              <span class="plan-unit">元/月</span>
            </div>
            <div class="plan-extra">永久</div>
            <button type="button" class="plan-buy-btn" disabled>免费</button>
            <ul class="plan-rights">
              <li>最多同时运行图片任务数量：1个</li>
              <li>最多同时运行视频任务数量：1个</li>
              <li>每日赠送积分</li>
            </ul>
          </div>

          <div class="plan-card">
            <div class="plan-name-row">
              <h4>轻享会员</h4>
              <span class="plan-badge">限时特惠版</span>
            </div>
            <p class="plan-desc">适合入门生图用户</p>
            <div class="plan-price-row">
              <span class="plan-price">24</span>
              <span class="plan-unit">元/月</span>
              <span class="plan-origin-price">¥39元</span>
            </div>
            <div class="plan-extra">6元/100积分</div>
            <button type="button" class="plan-buy-btn dark">购买</button>
            <div class="plan-quota-card">
              <strong>✦ 400积分/月</strong>
              <span>最多生成400张图片/或20个视频</span>
            </div>
            <div class="plan-rights-title">在免费权益基础上有如下权益:</div>
            <ul class="plan-rights">
              <li>作品去品牌水印</li>
              <li>最多同时运行图片任务数量：10个</li>
              <li>最多同时运行视频任务数量：2个</li>
              <li>
                官方Qwen Image系列图片模型
                <span class="limited-free-tag">限时免费</span>
              </li>
            </ul>
          </div>

          <div class="plan-card">
            <div class="plan-name-row">
              <h4>标准会员</h4>
              <span class="plan-badge">83折</span>
            </div>
            <p class="plan-desc">适合专业生图用户和普通视频用户</p>
            <div class="plan-price-row">
              <span class="plan-price">249</span>
              <span class="plan-unit">元/月</span>
              <span class="plan-origin-price">¥299元</span>
            </div>
            <div class="plan-extra">6.5元/100积分</div>
            <button type="button" class="plan-buy-btn dark">购买</button>
            <div class="plan-quota-card">
              <strong>✦ 3800积分/月</strong>
              <span>最多生成3800张图片/或190个视频</span>
            </div>
            <div class="plan-rights-title">在免费权益基础上有如下权益:</div>
            <ul class="plan-rights">
              <li>作品去品牌水印</li>
              <li>最多同时运行图片任务数量：10个</li>
              <li>最多同时运行视频任务数量：2个</li>
              <li>
                官方Qwen Image系列图片模型
                <span class="limited-free-tag">限时免费</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="avatarModalOpen"
      :footer="null"
      :width="412"
      centered
      :closable="false"
      wrapClassName="sider-mini-modal"
    >
      <button class="wuli-modal-close" type="button" @click="avatarModalOpen = false">×</button>
      <div class="mini-modal-content">
        <div class="avatar-edit-header">
          <img class="invite-avatar" src="/wuli-icons/avatar-default.png" alt="avatar" />
          <button type="button" class="avatar-change-btn">更改头像</button>
        </div>
        <label class="mini-input-label">用户名 *</label>
        <input class="mini-input" value="用户3529_2654" readonly />
        <div class="mini-tip">长度2-15个字符，支持中文、英文、数字、下划线、横线</div>
        <div class="mini-actions">
          <button type="button" class="btn-ghost" @click="avatarModalOpen = false">暂不修改</button>
          <button type="button" class="btn-dark" @click="avatarModalOpen = false">确定修改</button>
        </div>
      </div>
    </a-modal>

    <AuthLoginModal v-model:open="authModalOpen" />

    <a-modal
      v-model:open="apiModalOpen"
      :footer="null"
      :width="412"
      centered
      :closable="false"
      wrapClassName="sider-mini-modal"
    >
      <button class="wuli-modal-close" type="button" @click="apiModalOpen = false">×</button>
      <div class="mini-modal-content">
        <h3 class="api-title">访问令牌</h3>
        <p class="api-desc">
          访问令牌（Access Token）用于向呜哩AI验证您的身份。请勿与他人共享您的访问令牌。
        </p>
        <div class="api-token-box">•••••••••••••••••••••••••••••••••••••••</div>
        <div class="mini-actions">
          <button type="button" class="btn-ghost" @click="apiModalOpen = false">重置令牌</button>
          <button type="button" class="btn-dark" @click="apiModalOpen = false">查看API文档</button>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="feedbackModalOpen"
      :footer="null"
      :width="540"
      centered
      :closable="false"
      wrapClassName="sider-feedback-modal"
    >
      <button class="wuli-modal-close feedback-close" type="button" @click="feedbackModalOpen = false">×</button>
      <div class="feedback-modal-head">
        <h3>用户反馈</h3>
      </div>
      <div class="feedback-modal-body">
        <label class="fb-label">反馈内容 <span>*</span></label>
        <div class="fb-textarea-wrap">
          <textarea
            v-model="feedbackText"
            class="fb-textarea"
            maxlength="200"
            placeholder="请描述您的问题或建议，以便我们为您提供更好的内容"
          />
          <span class="fb-count">{{ feedbackText.length }} / 200</span>
        </div>

        <div class="fb-row-title">
          上传图片
          <span>上传问题截图可以让问题更快解决哦～</span>
        </div>
        <div class="fb-upload-line">
          <button class="fb-upload-box" type="button">
            <span>+</span>
          </button>
          <span class="fb-upload-count">0/4</span>
        </div>

        <div class="fb-contact-grid">
          <div class="fb-contact-col">
            <div class="fb-contact-title">联系方式</div>
            <a-input v-model:value="feedbackPhone" class="fb-input" placeholder="请输入手机号码" />
          </div>
          <div class="fb-contact-col">
            <div class="fb-contact-title">
              直接联系我们
              <span>你的每一条反馈，都会被认真看完~</span>
            </div>
            <div class="fb-email-box">
              <span>contact@wuli.art</span>
              <button type="button" class="fb-copy-btn" @click="copyText('contact@wuli.art')">⧉</button>
            </div>
          </div>
        </div>

        <button type="button" class="fb-submit" :disabled="feedbackText.trim().length === 0">提 交</button>
      </div>
    </a-modal>

    <a-modal
      v-model:open="accountModalOpen"
      :footer="null"
      :width="412"
      centered
      :closable="false"
      wrapClassName="sider-account-modal"
    >
      <button class="wuli-modal-close account-close" type="button" @click="accountModalOpen = false">×</button>
      <div class="account-modal-body">
        <h3 class="account-title">账号设置</h3>
        <div class="account-section-title">账号信息</div>
        <div class="account-info-card">
          <div class="account-info-row">
            <span>注册手机号</span>
            <span class="account-value">
              15768653529
              <button type="button" class="account-copy" @click="copyText('15768653529')">⧉</button>
            </span>
          </div>
          <div class="account-info-row">
            <span>注册时间</span>
            <span class="account-value">2026.05.15</span>
          </div>
        </div>
        <div class="account-section-title">注销账号</div>
        <button type="button" class="account-danger-btn">确认永久注销账号</button>
      </div>
    </a-modal>
  </aside>
</template>

<script setup lang="ts">
import { createFromIconfontCN } from '@ant-design/icons-vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AuthLoginModal from '@/components/AuthLoginModal.vue'
import { useAuthStore } from '@/stores/auth'

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/c/font_5079523_nb5cyl1zajc.js',
})

const route = useRoute()
const authStore = useAuthStore()

const menuItems = [
  {
    key: 'explore',
    title: '发现',
    path: '/explore',
    icon: '/wuli-icons/nav-explore.svg',
    activeIcon: '/wuli-icons/nav-explore-active.svg',
  },
  {
    key: 'generate',
    title: '生成',
    path: '/generate',
    icon: '/wuli-icons/nav-generate.svg',
    activeIcon: '/wuli-icons/nav-generate-active.svg',
  },
  {
    key: 'asset',
    title: '资产',
    path: '/asset',
    icon: '/wuli-icons/nav-asset.svg',
    activeIcon: '/wuli-icons/nav-asset-active.svg',
  },
  // {
  //   key: 'canvas',
  //   title: '画布',
  //   path: '/canvas',
  //   icon: '/wuli-icons/nav-canvas.svg',
  //   activeIcon: '/wuli-icons/nav-canvas-active.svg',
  // },
]

const inviteModalOpen = ref(false)
const avatarModalOpen = ref(false)
const apiModalOpen = ref(false)
const feedbackModalOpen = ref(false)
const accountModalOpen = ref(false)
const messagePanelOpen = ref(false)
const morePopoverOpen = ref(false)
const themeSubmenuOpen = ref(false)
const feedbackText = ref('')
const feedbackPhone = ref('')
let themeSubmenuTimer: ReturnType<typeof setTimeout> | null = null

const messagePanelRef = ref<HTMLElement | null>(null)
const messageBtnRef = ref<HTMLElement | null>(null)
const authModalOpen = computed({
  get: () => authStore.authModalOpen,
  set: (value: boolean) => {
    if (value) authStore.openAuthModal()
    else authStore.closeAuthModal()
  },
})

const activeIcon = (item: { path: string; icon: string; activeIcon?: string }) =>
  route.path === item.path && item.activeIcon ? item.activeIcon : item.icon

const isLoggedIn = computed(() => authStore.isLoggedIn)

const openInviteModal = () => {
  inviteModalOpen.value = true
}

const handleAvatarClick = () => {
  if (isLoggedIn.value) {
    avatarModalOpen.value = true
    return
  }
  authStore.openAuthModal()
}

const toggleMessagePanel = () => {
  messagePanelOpen.value = !messagePanelOpen.value
}

const onMoreMenuAction = (key: string) => {
  morePopoverOpen.value = false
  themeSubmenuOpen.value = false
  if (key === 'feedback') {
    feedbackModalOpen.value = true
  }
  if (key === 'account') {
    accountModalOpen.value = true
  }
  if (key === 'logout') {
    authStore.clearAuth()
    authStore.closeAuthModal()
  }
}

const openThemeSubmenu = () => {
  if (themeSubmenuTimer) {
    clearTimeout(themeSubmenuTimer)
    themeSubmenuTimer = null
  }
  themeSubmenuOpen.value = true
}

const closeThemeSubmenuWithDelay = () => {
  if (themeSubmenuTimer) clearTimeout(themeSubmenuTimer)
  themeSubmenuTimer = setTimeout(() => {
    themeSubmenuOpen.value = false
    themeSubmenuTimer = null
  }, 90)
}

const closeThemeSubmenu = () => {
  if (themeSubmenuTimer) {
    clearTimeout(themeSubmenuTimer)
    themeSubmenuTimer = null
  }
  themeSubmenuOpen.value = false
}

const toggleThemeSubmenu = () => {
  themeSubmenuOpen.value = !themeSubmenuOpen.value
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (_error) {
    const temp = document.createElement('textarea')
    temp.value = text
    document.body.appendChild(temp)
    temp.select()
    document.execCommand('copy')
    document.body.removeChild(temp)
  }
}

const handleGlobalPointer = (event: MouseEvent) => {
  if (!messagePanelOpen.value) return
  const target = event.target as Node | null
  if (!target) return
  const clickOnPanel = messagePanelRef.value?.contains(target)
  const clickOnButton = messageBtnRef.value?.contains(target)
  if (!clickOnPanel && !clickOnButton) {
    messagePanelOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleGlobalPointer)
})

watch(
  () => [route.path, isLoggedIn.value] as const,
  ([path, loggedIn]) => {
    if (path === '/asset' && !loggedIn) {
      authStore.openAuthModal()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleGlobalPointer)
  if (themeSubmenuTimer) {
    clearTimeout(themeSubmenuTimer)
    themeSubmenuTimer = null
  }
})
</script>

<style scoped lang="scss">
.sider {
  position: relative;
}

.sider-children {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.top {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  width: 80px;
  height: 80px;
  margin-top: 4px;
  flex: 0 0 auto;
}

.menu {
  width: 40px;
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 20px;
}

.menu-item {
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
}

.menu-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.65);
}

.icon-inner,
.icon-inner svg {
  width: 24px;
  height: 24px;
}

.menu-title {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
}

.menu-item:hover .menu-icon,
.menu-item-selected .menu-icon {
  background: #fff;
}

.menu-item-selected .menu-title {
  color: #6928fe;
}

.bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.credit-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.wuli-baby-gif {
  position: relative;
  top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s;
}

.wuli-baby-gif img {
  width: 70px;
  height: auto;
  object-fit: contain;
}

.credit-content {
  width: 76px;
  height: 66px;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: opacity 0.3s;
  background-image: url('https://img.alicdn.com/imgextra/i2/O1CN01xx49cX1gDyYGmKJub_!!6000000004109-2-tps-304-264.png');
  background-size: cover;
}

.credit-content:hover {
  background-image: url('https://img.alicdn.com/imgextra/i2/O1CN017jrqak1uKl2OSBbjo_!!6000000006019-2-tps-304-264.png');
}

.credit {
  display: flex;
  align-items: center;
  gap: 2px;
}

.credit-icon {
  width: 16px;
  height: 16px;
}

.credit-text {
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  line-height: 22px;
}

.invite-tip {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 20px;
}

.avatar-button {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  line-height: 0;
  cursor: pointer;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

// .icon-btn:hover,
// .icon-btn.is-active {
//   background: #f3f3f5;
// }


.api-token-entry,
.message-button,
.extra {
  margin-top: 12px;
}

.extra {
  margin-bottom: 16px;
}

.icon-24 {
  font-size: 24px;
}

.message-panel {
  position: fixed;
  left: 88px;
  top: 0;
  width: 384px;
  height: 100vh;
  background: #fff;
  border-radius: 0 24px 24px 0;
  box-shadow: 8px 0 8px 0 rgba(0, 0, 0, .03), 16px 0 16px 0 rgba(0, 0, 0, .03), 32px 0 32px 0 rgba(0, 0, 0, .03);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  padding:28px 16px 0;
}

.message-panel-header {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  margin-bottom: 24px;
  width: 100%;

  h4 {
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    color: rgba(0, 0, 0, 0.88);
  }
}

.mark-read {
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.25);
  font-size: 14px;
  cursor: default;
  padding: 0 15px;
}

.message-panel-empty {
  margin-top: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(0, 0, 0, 0.25);
  font-size: 16px;

  img {
    width: 64px;
    height: 64px;
    margin-bottom: 8px;
  }
}

.message-panel-fade-enter-active,
.message-panel-fade-leave-active {
  transition: all 0.24s ease;
}

.message-panel-fade-enter-from,
.message-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

:global(.sider-more-popover .ant-popover-inner) {
  padding: 6px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);

}

:global(.sider-more-popover .ant-popover-arrow) {
  display: none;
}

.more-popover-menu {
  position: relative;
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.more-popover-item {
  align-items: center;
  border-radius: 20px;
  box-sizing: border-box;
  color: rgba(0,0,0,.65);
  cursor: pointer;
  display: flex;
  height: 48px;
  justify-content: space-between;
  padding: 8px 12px;
  width: 100%;
  border: none;
   background-color: transparent;
}

.more-popover-item:hover {
  background: #f5f5f5;
}

.submenu-arrow {
  color: rgba(0, 0, 0, 0.32);
  font-size: 13px;
  transform: translateX(1px);
}

.theme-submenu {
  position: absolute;
  top: 0;
  left: calc(100% + 2px);
  width: 142px;
  padding: 6px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  background: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1px;
  z-index: 3;
}

.theme-submenu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 37px;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 0 10px;
  text-align: left;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
}

.theme-submenu-item:hover,
.theme-submenu-item.is-active {
  background: #f5f5f5;
}

.theme-item-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.theme-item-check {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

:global(.sider-invite-modal .ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
  padding: 14px 20px 18px;
}

:global(.sider-mini-modal .ant-modal-content) {
  border-radius: 16px;
  padding: 20px;
}

:global(.sider-feedback-modal .ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
}

:global(.sider-feedback-modal .ant-modal-body) {
  padding: 0;
}

:global(.sider-account-modal .ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
}

:global(.sider-account-modal .ant-modal-body) {
  padding: 0;
}

.wuli-modal-close {
  position: absolute;
  right: 16px;
  top: 10px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(0, 0, 0, 0.45);
  font-size: 20px;
  line-height: 28px;
  cursor: pointer;
}

.feedback-close,
.account-close {
  right: 14px;
  top: 10px;
  z-index: 2;
  color: rgba(0, 0, 0, 0.35);
  font-size: 18px;
}

.feedback-modal-head {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(99deg, rgba(165, 252, 224, 0.45) 0%, rgba(208, 228, 255, 0.5) 44%, rgba(244, 208, 255, 0.5) 100%);

  h3 {
    margin: 0;
    font-size: 36px;
    font-weight: 600;
    line-height: 46px;
    color: rgba(0, 0, 0, 0.88);
  }
}

.feedback-modal-body {
  padding: 18px 24px 16px;
}

.fb-label {
  display: block;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  font-weight: 600;
  line-height: 22px;

  span {
    color: #ff4d4f;
  }
}

.fb-textarea-wrap {
  margin-top: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 10px 22px;
  position: relative;
}

.fb-textarea {
  width: 100%;
  height: 94px;
  border: none;
  outline: none;
  resize: none;
  font-size: 12px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.88);
}

.fb-textarea::placeholder {
  color: rgba(0, 0, 0, 0.25);
}

.fb-count {
  position: absolute;
  right: 10px;
  bottom: 6px;
  font-size: 11px;
  line-height: 16px;
  color: rgba(0, 0, 0, 0.25);
}

.fb-row-title {
  margin-top: 14px;
  font-size: 14px;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-size: 11px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.25);
  }
}

.fb-upload-line {
  margin-top: 8px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.fb-upload-box {
  width: 56px;
  height: 56px;
  border: 1px dashed #ebebeb;
  border-radius: 8px;
  background: #fafafa;
  color: rgba(0, 0, 0, 0.35);
  font-size: 22px;
  line-height: 1;
}

.fb-upload-count {
  font-size: 11px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.25);
}

.fb-contact-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.fb-contact-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);
  margin-bottom: 6px;

  span {
    margin-left: 8px;
    font-size: 11px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.25);
  }
}

:deep(.fb-input .ant-input) {
  height: 32px;
  border-radius: 8px;
  border-color: #f0f0f0;
  font-size: 12px;
}

.fb-email-box {
  height: 32px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #f0f0f0;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
}

.fb-copy-btn,
.account-copy {
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.35);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.fb-submit {
  margin: 16px auto 0;
  display: block;
  width: 144px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: #1f1f1f;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.fb-submit:disabled {
  background: #d9d9d9;
  color: #fff;
}

.account-modal-body {
  padding: 16px 20px 20px;
}

.account-title {
  margin: 0;
  text-align: center;
  font-size: 26px;
  line-height: 34px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.account-section-title {
  margin-top: 14px;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 22px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.account-info-card {
  border-radius: 8px;
  background: #f7f7fb;
  overflow: hidden;
}

.account-info-row {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}

.account-info-row + .account-info-row {
  border-top: 1px solid #f0f0f0;
}

.account-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(0, 0, 0, 0.88);
}

.account-danger-btn {
  width: 100%;
  height: 38px;
  border: none;
  border-radius: 8px;
  background: #f4f4f9;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  font-weight: 600;
}

.invite-close {
  right: 10px;
  top: 10px;
  color: rgba(0, 0, 0, 0.35);
  font-size: 18px;
}

.invite-modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-user-row {
  align-items: center;
  display: flex;
  gap: 10px;
  height: 36px;
}

.invite-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.invite-username {
  color: rgba(0, 0, 0, 0.88);
  font-size: 28px;
  font-weight: 600;
  line-height: 36px;
}

.invite-summary-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr 1.45fr;
}

.summary-card {
  border: 1px solid #ececef;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: 102px;
  padding: 12px 14px;
}

.summary-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.summary-head-left {
  color: rgba(0, 0, 0, 0.78);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.summary-head-link {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 18px;
}

.summary-value {
  color: rgba(0, 0, 0, 0.88);
  font-size: 40px;
  font-weight: 600;
  line-height: 48px;
  margin-top: 4px;
}

.summary-action {
  align-self: flex-end;
  background: linear-gradient(180deg, #333, #282828);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  height: 30px;
  margin-top: auto;
  width: 64px;
}

.summary-banner {
  background: url('https://img.alicdn.com/imgextra/i2/O1CN01UYxv2x1hoNpkdA0as_!!6000000004326-2-tps-1056-376.png') center / cover no-repeat;
  border-radius: 12px;
  color: #111;
  min-height: 102px;
  padding: 14px 20px;
}

.summary-banner-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.2px;
  line-height: 58px;
}

.summary-banner-link {
  color: rgba(0, 0, 0, 0.5);
  font-size: 13px;
  line-height: 20px;
}

.plan-title {
  color: rgba(0, 0, 0, 0.88);
  font-size: 24px;
  font-weight: 600;
  line-height: 50px;
  margin: 2px 0 0;
  text-align: center;
}

.plan-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.plan-card {
  border: 1px solid #efeff2;
  border-radius: 12px;
  min-height: 330px;
  padding: 14px 14px 12px;
}

.plan-name-row {
  align-items: center;
  display: flex;
  gap: 8px;

  h4 {
    color: rgba(0, 0, 0, 0.88);
    font-size: 30px;
    font-weight: 600;
    line-height: 38px;
    margin: 0;
  }
}

.plan-badge {
  background: #efe7ff;
  border-radius: 6px;
  color: #7e52ea;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  padding: 1px 6px;
}

.plan-desc {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 18px;
  margin: 3px 0 0;
}

.plan-price-row {
  align-items: baseline;
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.plan-price {
  color: rgba(0, 0, 0, 0.88);
  font-size: 44px;
  font-weight: 600;
  line-height: 52px;
}

.plan-unit {
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 22px;
}

.plan-origin-price {
  color: rgba(0, 0, 0, 0.25);
  font-size: 12px;
  line-height: 18px;
  text-decoration: line-through;
}

.plan-extra {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 18px;
}

.plan-buy-btn {
  background: #f2f2f2;
  border: none;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.25);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  height: 36px;
  margin-top: 8px;
  width: 100%;

  &.dark {
    background: linear-gradient(180deg, #333, #282828);
    color: #fff;
  }
}

.plan-buy-btn:disabled {
  cursor: default;
}

.plan-quota-card {
  align-items: flex-start;
  background: #f7f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
  padding: 8px 10px;

  strong {
    color: rgba(0, 0, 0, 0.88);
    font-size: 16px;
    font-weight: 600;
    line-height: 22px;
  }

  span {
    color: rgba(0, 0, 0, 0.35);
    font-size: 11px;
    line-height: 16px;
  }
}

.plan-rights-title {
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  line-height: 18px;
  margin-top: 8px;
}

.plan-rights {
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
  margin: 8px 0 0;
  padding: 0;

  li {
    align-items: center;
    color: rgba(0, 0, 0, 0.65);
    display: flex;
    font-size: 12px;
    line-height: 18px;
    position: relative;

    &::before {
      color: rgba(0, 0, 0, 0.45);
      content: '✓';
      font-size: 11px;
      margin-right: 6px;
    }
  }
}

.limited-free-tag {
  background: linear-gradient(90deg, #daff8f, #9ef4cf);
  border-radius: 999px;
  color: #2f3133;
  font-size: 10px;
  line-height: 16px;
  margin-left: 6px;
  padding: 0 6px;
}

.free-plan {
  .plan-rights {
    margin-top: 12px;
  }
}

.mini-modal-content {
  padding-top: 8px;
}

.avatar-edit-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.avatar-edit-header .invite-avatar {
  width: 56px;
  height: 56px;
}

.avatar-change-btn {
  width: 64px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #ececec;
  background: #fff;
  color: rgba(0, 0, 0, 0.65);
}

.mini-input-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
}

.mini-input {
  width: 100%;
  height: 34px;
  border: 1px solid #ebebeb;
  border-radius: 8px;
  background: #fafafa;
  padding: 0 12px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.mini-tip {
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 18px;
}

.api-title {
  margin: 6px 0 10px;
  text-align: center;
  font-size: 24px;
  line-height: 32px;
  color: rgba(0, 0, 0, 0.88);
}

.api-desc {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 20px;
}

.api-token-box {
  height: 32px;
  border-radius: 8px;
  background: #f5f5f7;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 32px;
  padding: 0 10px;
  margin-top: 12px;
}

.mini-actions {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  button {
    height: 36px;
    border-radius: 8px;
    font-size: 14px;
    border: none;
  }

  .btn-ghost {
    border: 1px solid #ececec;
    background: #fff;
    color: rgba(0, 0, 0, 0.65);
  }

  .btn-dark {
    background: #1f1f1f;
    color: #fff;
  }
}
</style>
