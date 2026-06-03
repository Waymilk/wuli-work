<template>
  <a-modal
    class="purchase-credits-modal"
    :open="open"
    :footer="null"
    :width="760"
    centered
    :closable="false"
    wrapClassName="sider-invite-modal"
    @update:open="emit('update:open', $event)"
  >
    <button class="wuli-modal-close purchase-close" type="button" @click="emit('update:open', false)">×</button>

    <section class="purchase-modal-content">
      <header class="purchase-header">
        <img class="purchase-avatar" src="/wuli-icons/avatar-default.png" alt="avatar" />
        <div class="purchase-user-copy">
          <div class="purchase-hello">购买积分</div>
          <div class="purchase-username">{{ displayUsername }}</div>
        </div>
      </header>

      <div class="purchase-grid">
        <article class="purchase-card">
          <div class="purchase-card-title">激活卡密</div>
          <div class="purchase-card-subtitle">输入卡密后点击按钮获取积分</div>
          <a-input
            v-model:value="redeemCode"
            class="purchase-input"
            placeholder="请输入卡密"
            :disabled="isRedeeming"
          />
          <button
            type="button"
            class="purchase-btn"
            :disabled="isRedeeming"
            @click="handleRedeemClick"
          >
            {{ isRedeeming ? '激活中' : '获取积分' }}
          </button>
        </article>

        <article class="purchase-card">
          <div class="purchase-card-title">当前积分</div>
          <div class="purchase-card-subtitle">可用于图片/视频生成</div>
          <div class="purchase-credits">{{ displayCredits }}</div>
          <div class="purchase-buy-action">
            <div class="purchase-qr-panel">
              <img v-if="qrCodeUrl" class="purchase-qr-image" :src="qrCodeUrl" alt="充值二维码" />
              <div v-else class="purchase-qr-empty">
                {{ isLoadingRechargeInfo ? '二维码加载中' : '暂无二维码' }}
              </div>
              <span class="purchase-qr-tip">{{ qrCodeUrl ? '扫码充值' : rechargeInfoError || '可点击按钮跳转充值' }}</span>
            </div>
            <a
              :href="rechargeUrl || undefined"
              target="_blank"
              rel="noopener noreferrer"
              class="purchase-btn purchase-btn-secondary"
              :class="{ disabled: isLoadingRechargeInfo }"
              @click="handleBuyClick"
            >
              {{ isLoadingRechargeInfo ? '加载中' : '去购买' }}
            </a>
          </div>
        </article>
      </div>

      <footer class="purchase-footer-tip">卡密激活成功后将自动刷新积分显示。</footer>
    </section>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import request from '@/utils/request'

const props = defineProps<{
  open: boolean
  username: string
  credits: string | number | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'redeemed', payload: { balance?: string | number | null }): void
}>()

const displayUsername = computed(() => {
  const next = String(props.username || '').trim()
  return next || '用户3529_2654'
})

const displayCredits = computed(() => {
  if (props.credits === null || props.credits === undefined || props.credits === '') return '--'
  return String(props.credits)
})

const redeemCode = ref('')
const isRedeeming = ref(false)
const rechargeUrl = ref('')
const qrCodeUrl = ref('')
const isLoadingRechargeInfo = ref(false)
const rechargeInfoError = ref('')

interface RedeemResponse {
  success?: boolean
  credits_added?: number | string
  balance?: number | string | null
}

interface RechargeInfoResponse {
  success?: boolean
  recharge_url?: string
  rechargeUrl?: string
  qr_code_url?: string
  qrCodeUrl?: string
  data?: {
    recharge_url?: string
    rechargeUrl?: string
    qr_code_url?: string
    qrCodeUrl?: string
  }
  result?: {
    recharge_url?: string
    rechargeUrl?: string
    qr_code_url?: string
    qrCodeUrl?: string
  }
  message?: string
  detail?: string
}

const resolveErrorMessage = (error: unknown, fallback: string) => {
  const maybe = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
  return maybe?.response?.data?.detail || maybe?.response?.data?.message || maybe?.message || fallback
}

const pickRechargeUrl = (res: RechargeInfoResponse | undefined) => (
  res?.recharge_url || res?.rechargeUrl || res?.data?.recharge_url || res?.data?.rechargeUrl || res?.result?.recharge_url || res?.result?.rechargeUrl || ''
)

const pickQrCodeUrl = (res: RechargeInfoResponse | undefined) => (
  res?.qr_code_url || res?.qrCodeUrl || res?.data?.qr_code_url || res?.data?.qrCodeUrl || res?.result?.qr_code_url || res?.result?.qrCodeUrl || ''
)

const handleRedeemClick = async () => {
  if (isRedeeming.value) return
  const code = redeemCode.value.trim()
  if (!code) {
    message.warning('请输入卡密')
    return
  }
  isRedeeming.value = true
  try {
    const res = await request.post<unknown, RedeemResponse>('/api/redeem', { code })
    if (res?.success === false) {
      throw new Error('卡密激活失败')
    }
    const creditsAdded = res?.credits_added
    const successText = creditsAdded !== undefined && creditsAdded !== null ? `激活成功，已增加 ${creditsAdded} 积分` : '激活成功'
    message.success(successText)
    redeemCode.value = ''
    emit('redeemed', { balance: res?.balance })
  } catch (error) {
    message.error(resolveErrorMessage(error, '卡密激活失败'))
  } finally {
    isRedeeming.value = false
  }
}

const loadRechargeInfo = async () => {
  if (isLoadingRechargeInfo.value) return
  isLoadingRechargeInfo.value = true
  rechargeInfoError.value = ''
  try {
    const res = await request.get<unknown, RechargeInfoResponse>('/api/recharge/info')
    if (res?.success === false) {
      throw new Error(resolveErrorMessage(res, '充值信息加载失败'))
    }
    rechargeUrl.value = String(pickRechargeUrl(res)).trim()
    qrCodeUrl.value = String(pickQrCodeUrl(res)).trim()
  } catch (error) {
    rechargeUrl.value = ''
    qrCodeUrl.value = ''
    rechargeInfoError.value = resolveErrorMessage(error, '充值信息加载失败')
    message.error(rechargeInfoError.value)
  } finally {
    isLoadingRechargeInfo.value = false
  }
}

const handleBuyClick = (event: MouseEvent) => {
  if (isLoadingRechargeInfo.value) {
    event.preventDefault()
    return
  }
  if (!rechargeUrl.value) {
    event.preventDefault()
    message.warning(rechargeInfoError.value || '充值链接暂不可用')
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void loadRechargeInfo()
    }
  },
)
</script>

<style scoped lang="scss">
:global(.sider-invite-modal .ant-modal-content) {
  border-radius: 16px;
  overflow: visible;
  padding: 14px 20px 20px;
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

.purchase-close {
  right: 10px;
  top: 10px;
  color: rgba(0, 0, 0, 0.35);
  font-size: 18px;
}

.purchase-modal-content {
  --gap-8: 8px;
  --gap-12: 12px;
  --gap-16: 16px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-16);
}

.purchase-header {
  align-items: center;
  display: flex;
  gap: var(--gap-12);
  min-height: 40px;
}

.purchase-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.purchase-user-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.purchase-hello {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 20px;
}

.purchase-username {
  color: rgba(0, 0, 0, 0.88);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.purchase-grid {
  display: flex;
  gap: var(--gap-16);
}

.purchase-card {
  background: #fff;
  border: 1px solid #ececef;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 198px;
  padding: var(--gap-16);
}

.purchase-card-title {
  color: rgba(0, 0, 0, 0.78);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.purchase-card-subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 18px;
  margin-top: 4px;
}

.purchase-input {
  margin-top: var(--gap-12);

  :deep(.ant-input) {
    border-color: #d9d9de;
    border-radius: 8px;
    height: 38px;
    padding: 0 12px;
  }

  :deep(.ant-input:focus),
  :deep(.ant-input-focused) {
    border-color: #6f63ff;
    box-shadow: 0 0 0 2px rgba(111, 99, 255, 0.12);
  }
}

.purchase-btn {
  align-self: flex-end;
  background: linear-gradient(180deg, #333, #282828);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  height: 38px;
  margin-top: auto;
  min-width: 108px;
  padding: 0 18px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.purchase-btn:disabled,
.purchase-btn.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.purchase-btn-secondary {
  background: #f3f3f5;
  color: rgba(0, 0, 0, 0.75);
}

.purchase-btn:not(:disabled):not(.disabled):hover {
  filter: brightness(1.03);
}

.purchase-buy-action {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-top: auto;
}

.purchase-buy-action .purchase-btn {
  margin-top: 0;
}

.purchase-qr-panel {
  width: 108px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: absolute;
  top: 91px;
  right: 35px;
}

.purchase-qr-empty {
  width: 108px;
  height: 108px;
  border-radius: 6px;
  background: #fafafd;
  border: 1px dashed #d9d9de;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.purchase-qr-image {
  width: 108px;
  height: 108px;
  border-radius: 6px;
  object-fit: cover;
}

.purchase-qr-tip {
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.purchase-credits {
  color: rgba(0, 0, 0, 0.88);
  font-size: 44px;
  font-weight: 600;
  line-height: 56px;
  margin-top: 12px;
}

.purchase-footer-tip {
  background: #fafafd;
  border: 1px solid #ececef;
  border-radius: 10px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 20px;
  min-height: 36px;
  padding: var(--gap-8) var(--gap-12);
}
</style>
