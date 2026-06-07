<template>
  <a-modal
    class="wuli-auth-modal"
    :open="props.open"
    :footer="null"
    :width="1020"
    centered
    :closable="true"
    wrapClassName="wuli-auth-modal-wrap"
    @update:open="emit('update:open', $event)"
  >
    <div class="auth-modal-shell">
      <section class="auth-left-panel">
        <img
          class="auth-main-logo"
          src="/public/wuli-assets/logo_title.png"
          alt="wuli"
        />
        <!-- <div class="auth-left-tip">创意设计生产力平台</div> -->

        <div class="auth-feature-layer">
          <img
            class="auth-star auth-star-one"
            src="https://img.alicdn.com/imgextra/i4/O1CN01uWWXkw27ary8DHXml_!!6000000007814-55-tps-14-14.svg"
            alt=""
          />
          <img
            class="auth-star auth-star-two"
            src="https://img.alicdn.com/imgextra/i4/O1CN01uWWXkw27ary8DHXml_!!6000000007814-55-tps-14-14.svg"
            alt=""
          />
          <img
            class="auth-dot auth-dot-one"
            src="https://img.alicdn.com/imgextra/i2/O1CN01rXEcBs1hTNTq4y3GS_!!6000000004278-55-tps-8-8.svg"
            alt=""
          />
          <img
            class="auth-dot auth-dot-two"
            src="https://img.alicdn.com/imgextra/i2/O1CN01rXEcBs1hTNTq4y3GS_!!6000000004278-55-tps-8-8.svg"
            alt=""
          />
          <img
            class="auth-dot auth-dot-three"
            src="https://img.alicdn.com/imgextra/i2/O1CN01rXEcBs1hTNTq4y3GS_!!6000000004278-55-tps-8-8.svg"
            alt=""
          />

          <div class="auth-deco-layer" aria-hidden="true">
            <img class="auth-deco deco-edit" src="https://img.alicdn.com/imgextra/i3/O1CN01Ypf7GE1wrqsgY8Fo3_!!6000000006362-2-tps-412-176.png" alt="" />
            <img class="auth-deco deco-lumin" src="https://img.alicdn.com/imgextra/i3/O1CN01lHkdJR29HIGvMpuit_!!6000000008042-2-tps-624-176.png" alt="" />
            <img class="auth-deco deco-wuxian" src="https://img.alicdn.com/imgextra/i4/O1CN01ujRVGf1WCvTpJrrXF_!!6000000002753-2-tps-664-176.png" alt="" />
            <img class="auth-deco deco-chaokuai" src="https://img.alicdn.com/imgextra/i4/O1CN01gzIHGJ1QQJMOv5U4q_!!6000000001970-2-tps-352-176.png" alt="" />
            <img class="auth-deco deco-aigc" src="https://img.alicdn.com/imgextra/i2/O1CN01i1Imbz1L65nTLcJXK_!!6000000001249-2-tps-308-176.png" alt="" />
            <img class="auth-deco deco-jisu" src="https://img.alicdn.com/imgextra/i3/O1CN01MMJmVX1L08eEECaJJ_!!6000000001236-2-tps-540-176.png" alt="" />
            <img class="auth-deco deco-yizhan" src="https://img.alicdn.com/imgextra/i1/O1CN01ReMqQk1pM459f3uuH_!!6000000005345-2-tps-604-176.png" alt="" />
            <img class="auth-deco deco-wuli" src="https://img.alicdn.com/imgextra/i3/O1CN01OzBwkH1SbQCRuhFBA_!!6000000002265-2-tps-684-176.png" alt="" />
            <img class="auth-deco deco-linggan" src="https://img.alicdn.com/imgextra/i4/O1CN016ilgOF1K0JBArYHRE_!!6000000001101-2-tps-492-176.png" alt="" />
            <img class="auth-deco deco-lingxing" src="https://img.alicdn.com/imgextra/i3/O1CN01qBWgDJ1Wo1Yr5FZqM_!!6000000002834-55-tps-70-70.svg" alt="" />
            <img class="auth-deco deco-arrow" src="https://img.alicdn.com/imgextra/i3/O1CN01JNvPJD26K5qTafmcj_!!6000000007642-55-tps-31-33.svg" alt="" />
            <img class="auth-deco deco-circle-one" src="https://img.alicdn.com/imgextra/i2/O1CN01b1UX4z1Di5jOGD5e2_!!6000000000249-55-tps-54-54.svg" alt="" />
            <img class="auth-deco deco-circle-two" src="https://img.alicdn.com/imgextra/i2/O1CN01ZONDdh26Eb5nXiuDb_!!6000000007630-55-tps-40-40.svg" alt="" />
          </div>
        </div>
      </section>

      <section class="auth-right-panel">
        <div class="auth-form-panel">
          <h3 class="auth-title">{{ isRegister ? '欢迎到访闪帧' : '欢迎回到闪帧' }}</h3>

          <a-form layout="vertical" class="auth-form" @submit.prevent>
            <a-form-item>
              <a-input v-model:value="username" class="auth-input" placeholder="请输入用户名" />
            </a-form-item>

            <a-form-item v-if="isRegister">
              <a-input v-model:value="email" class="auth-input" placeholder="请输入邮箱" />
            </a-form-item>

            <a-form-item>
              <a-input v-model:value="password" class="auth-input" type="password" placeholder="请输入密码" />
            </a-form-item>

            <a-form-item v-if="isRegister">
              <a-input v-model:value="confirmPassword" class="auth-input" type="password" placeholder="请确认密码" />
            </a-form-item>

            <a-form-item v-if="errorMessage">
              <div class="auth-error-text">{{ errorMessage }}</div>
            </a-form-item>

          </a-form>

          <a-checkbox v-model:checked="agreed" class="auth-agreement">
            <span>
              我已阅读并同意
              <button class="auth-agreement-link" type="button" @click.stop="openAgreementModal">《用户协议》</button>
              和
              <button class="auth-agreement-link" type="button" @click.stop="openAgreementModal">《隐私政策》</button>
            </span>
          </a-checkbox>

          <a-button class="auth-submit-btn" type="primary" :disabled="!canSubmit || isSubmitting" :loading="isSubmitting" block @click="handleSubmit">
            {{ isRegister ? '注 册' : '登 录' }}
          </a-button>

          <div class="auth-switch-row">
            <button class="auth-switch-btn" type="button" @click="toggleMode">
              {{ isRegister ? '已有账号? 去登录' : '还没有账号? 去注册' }}
              <span class="auth-switch-icon">›</span>
            </button>
          </div>
        </div>
      </section>
    </div>
    <PlatformAgreementModal v-model:open="agreementModalOpen" />
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import request from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import PlatformAgreementModal from '@/components/PlatformAgreementModal.vue'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

interface AuthUser {
  id: number
  username: string
  email?: string
}

interface AuthResponse {
  token: string
  user: AuthUser
}

const isRegister = ref(false)
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreed = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const agreementModalOpen = ref(false)
const authStore = useAuthStore()

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const canSubmit = computed(() => {
  if (!agreed.value) return false
  if (username.value.trim().length < 3) return false
  if (password.value.trim().length < 6) return false
  if (!isRegister.value) return true
  if (!emailRegex.test(email.value.trim())) return false
  return confirmPassword.value.trim().length >= 6
})

function resetForm() {
  username.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  agreed.value = false
  errorMessage.value = ''
}

function toggleMode() {
  isRegister.value = !isRegister.value
  errorMessage.value = ''
  password.value = ''
  confirmPassword.value = ''
}

function openAgreementModal() {
  agreementModalOpen.value = true
}

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return
  errorMessage.value = ''

  const cleanedUsername = username.value.trim()
  const cleanedPassword = password.value.trim()
  const cleanedEmail = email.value.trim()

  if (isRegister.value && cleanedPassword !== confirmPassword.value.trim()) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  isSubmitting.value = true
  try {
    let response: AuthResponse
    if (isRegister.value) {
      response = await request.post<unknown, AuthResponse>('/api/auth/register', {
        username: cleanedUsername,
        email: cleanedEmail,
        password: cleanedPassword,
      })
    } else {
      response = await request.post<unknown, AuthResponse>('/api/auth/login', {
        username: cleanedUsername,
        password: cleanedPassword,
      })
    }

    if (!response?.token || !response?.user?.id) {
      throw new Error('登录响应缺少必要字段')
    }

    authStore.setAuth(response.token, response.user)
    authStore.refreshCurrentPage()
    authStore.closeAuthModal()
    emit('update:open', false)
    message.success(isRegister.value ? '注册成功' : '登录成功')
    resetForm()
  } catch (error: unknown) {
    const maybe = error as {
      response?: { data?: { detail?: string; message?: string } }
      message?: string
    }
    errorMessage.value = maybe?.response?.data?.detail || maybe?.response?.data?.message || maybe?.message || '操作失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      errorMessage.value = ''
      return
    }
    resetForm()
    isRegister.value = false
  },
)
</script>

<style scoped lang="scss">
:global(.wuli-auth-modal-wrap .ant-modal) {
  max-width: 1020px;
}

:global(.wuli-auth-modal-wrap .ant-modal-content) {
  border-radius: 24px;
  overflow: hidden;
  padding: 0;
}

:global(.wuli-auth-modal-wrap .ant-modal-body) {
  padding: 0;
}

:global(.wuli-auth-modal-wrap .ant-modal-close) {
  border-radius: 8px;
}

.auth-modal-shell {
  background: #fff;
  display: flex;
  height: 680px;
  position: relative;
  width: 1020px;
}

.auth-left-panel {
  align-items: center;
  background: url('https://img.alicdn.com/imgextra/i2/O1CN01ZV9qax1EHMECyFe80_!!6000000000326-2-tps-2040-2720.png');
  background-size: cover;
  display: flex;
  flex: 1 1 510px;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.auth-main-logo {
  margin-top: 100px;
  width: 260px;
}

.auth-left-tip {
  color: #fff;
  font-size: 14px;
  height: 20px;
  margin-top: 20px;
}

.auth-slogan-line {
  align-items: center;
  column-gap: 12px;
  display: flex;
  margin-top: 13px;
}

.auth-slogan-star {
  height: 14px;
  width: 15px;
}

.auth-slogan-text {
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  align-items: center;
  background: linear-gradient(341deg, #d2a9fc 8%, rgba(210, 169, 252, 0) 34%), linear-gradient(165deg, #d2a9fc 13%, #fff 40%);
  display: flex;
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
}

.auth-feature-layer {
  height: 224px;
  margin-top: 161px;
  position: relative;
  width: 475px;
  z-index: 0;
}

.auth-star,
.auth-dot {
  opacity: 1;
  position: absolute;
  z-index: 1;
}

.auth-star {
  height: 14px;
  width: 14px;
}

.auth-star-one {
  left: 50px;
  top: 0;
}

.auth-star-two {
  bottom: 70px;
  right: 0;
}

.auth-dot-one {
  border-radius: 3px;
  height: 6px;
  left: 203px;
  top: 95px;
  width: 6px;
}

.auth-dot-two {
  border-radius: 4px;
  bottom: 8px;
  height: 8px;
  left: 114px;
  width: 8px;
}

.auth-dot-three {
  border-radius: 3px;
  height: 5px;
  right: 47px;
  top: 9px;
  width: 5px;
}

.auth-deco-layer {
  height: 100%;
  left: 0;
  overflow: hidden;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 10;
}

.auth-deco {
  left: 0;
  object-fit: cover;
  pointer-events: none;
  position: absolute;
  top: 0;
  transform-origin: center center;
  will-change: transform;
}

.deco-edit { height: 44px; transform: translate(42.4644px, 543.744px) rotate(3.82801rad); }
.deco-lumin { height: 44px; transform: translate(179.188px, 495.23px) rotate(0.708317rad); }
.deco-wuxian { height: 44px; transform: translate(247.868px, 481.07px) rotate(0.515619rad); }
.deco-chaokuai { height: 44px; transform: translate(146.021px, 566.459px) rotate(0.467238rad); }
.deco-aigc { height: 44px; transform: translate(39.9516px, 616.074px) rotate(-0.0012168rad); }
.deco-jisu { height: 44px; transform: translate(247.36px, 576.132px) rotate(-0.800857rad); }
.deco-yizhan { height: 44px; transform: translate(325.096px, 616.325px) rotate(0.0005541rad); }
.deco-wuli { height: 44px; transform: translate(302.198px, 440.439px) rotate(0.268388rad); }
.deco-linggan { height: 44px; transform: translate(174.992px, 536.471px) rotate(0.705805rad); }
.deco-lingxing { height: 70px; transform: translate(394.497px, 541.249px) rotate(0.175921rad); }
.deco-arrow { height: 32px; transform: translate(47.4781px, 582.566px) rotate(0.0400859rad); }
.deco-circle-one { height: 54px; width: 54px; transform: translate(123.91px, 597.29px) rotate(0.450357rad); }
.deco-circle-two { height: 40px; width: 40px; transform: translate(426.842px, 503.684px) rotate(0.17785rad); }

.auth-right-panel {
  align-items: center;
  display: flex;
  flex: 1 1 510px;
  flex-direction: column;
  height: 100%;
  justify-content: flex-start;
  overflow: hidden;
}

.auth-form-panel {
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 390px;
}

.auth-title {
  font-size: 28px;
  font-weight: 600;
  height: 36px;
  line-height: 36px;
  margin: 150px 0 0;
}

.auth-form {
  margin-top: 48px;
  width: 100%;
}

:deep(.ant-form-item-row) {
  width: 100%;
}

.auth-input {
  background: transparent !important;
  border: 1px solid #e8e7ea;
  border-radius: 8px;
  font-size: 14px;
  height: 48px;
  line-height: 22px;
  width: 100%;
}

.auth-input :deep(.ant-input) {
  color: rgba(0, 0, 0, 0.88) !important;
}

.auth-input :deep(.ant-input::placeholder) {
  color: rgba(0, 0, 0, 0.25) !important;
}

.auth-input:hover,
.auth-input:focus,
.auth-input:focus-within,
.auth-input:deep(.ant-input-affix-wrapper-focused),
.auth-input :deep(.ant-input:focus),
.auth-input :deep(.ant-input:focus-visible) {
  background: transparent !important;
  border-color: #8b52ff !important;
  box-shadow: none !important;
}

.auth-phone-prefix {
  align-items: center;
  display: flex;
}

.auth-country-code {
  color: rgba(0, 0, 0, 0.88) !important;
}

.auth-prefix-divider {
  background: #e8e7ea;
  height: 12px;
  margin: 0 12px;
  transform: rotate(180deg);
  width: 1px;
}

.auth-invite-item {
  align-items: center;
  display: flex;
  width: 100%;
}

.auth-code-btn {
  background: linear-gradient(180deg, #333, #282828) !important;
  border: none !important;
  border-radius: 6px !important;
  color: #fff !important;
  font-size: 12px !important;
  height: 32px !important;
  padding: 0 12px !important;
}

.auth-code-btn:hover {
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), linear-gradient(180deg, #333, #282828) !important;
}

.auth-code-btn:disabled,
.auth-code-btn:disabled:hover {
  background: rgba(0, 0, 0, 0.15) !important;
  border: none !important;
  color: rgba(255, 255, 255, 1) !important;
}

.auth-agreement {
  font-size: 12px;
  line-height: 20px;
  width: 100%;
}

.auth-error-text {
  color: #ff4d4f;
  font-size: 12px;
  line-height: 20px;
  margin-top: -8px;
}

.auth-agreement-link {
  background: transparent;
  border: none;
  color: #6928fe;
  cursor: pointer;
  font: inherit;
  padding: 0;
}

.auth-agreement-link:hover {
  color: #8b52ff;
}

.auth-agreement-link:active {
  color: #4b18d9;
}

.auth-submit-btn {
  background: linear-gradient(180deg, #333, #282828) !important;
  border: none !important;
  border-radius: 8px !important;
  color: #fff !important;
  height: 48px !important;
  margin-top: 24px;
  width: 100% !important;
}

.auth-submit-btn:hover {
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), linear-gradient(180deg, #333, #282828) !important;
  color: #fff !important;
}

.auth-submit-btn:disabled,
.auth-submit-btn:disabled:hover {
  background: rgba(0, 0, 0, 0.15) !important;
  border: none !important;
  color: #fff !important;
}

.auth-switch-row {
  margin-top: 16px;
  width: 100%;
}

.auth-switch-btn {
  align-items: center;
  background: transparent;
  border: 0;
  color: #6928fe;
  cursor: pointer;
  display: flex;
  font-size: 12px;
  gap: 2px;
  line-height: 20px;
  padding: 0;
}

.auth-switch-btn:hover {
  color: #8b52ff;
}

.auth-switch-btn:active {
  color: #4b18d9;
}

.auth-switch-icon {
  font-size: 16px;
}
</style>
