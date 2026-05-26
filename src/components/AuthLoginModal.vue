<template>
  <a-modal
    class="wuli-auth-modal"
    :open="open"
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
          src="https://img.alicdn.com/imgextra/i2/O1CN01UkIs9Q1RMTezxzVH8_!!6000000002097-2-tps-1480-680.png"
          alt="wuli"
        />
        <div class="auth-left-tip">AIGC驱动的创意设计生产力平台</div>

        <div class="auth-slogan-line">
          <img
            class="auth-slogan-star"
            src="https://img.alicdn.com/imgextra/i3/O1CN01C2KtPS1LCVLGonjeW_!!6000000001263-55-tps-15-14.svg"
            alt=""
          />
          <div class="auth-slogan-text">呜哩一下 创意开花</div>
          <img
            class="auth-slogan-star"
            src="https://img.alicdn.com/imgextra/i3/O1CN01C2KtPS1LCVLGonjeW_!!6000000001263-55-tps-15-14.svg"
            alt=""
          />
        </div>

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
          <h3 class="auth-title">{{ isRegister ? '欢迎到访呜哩星球' : '欢迎回到呜哩星球' }}</h3>

          <a-form layout="vertical" class="auth-form" @submit.prevent>
            <a-form-item>
              <a-input v-model:value="phone" class="auth-input" placeholder="请输入手机号">
                <template #prefix>
                  <div class="auth-phone-prefix">
                    <span class="auth-country-code">+86</span>
                    <span class="auth-prefix-divider"></span>
                  </div>
                </template>
              </a-input>
            </a-form-item>

            <a-form-item v-if="isRegister" class="auth-invite-item">
              <a-input v-model:value="inviteCode" class="auth-input auth-invite-input" placeholder="请输入邀请码(可选)" />
            </a-form-item>

            <a-form-item>
              <a-input v-model:value="code" class="auth-input" placeholder="请输入验证码">
                <template #suffix>
                  <a-button class="auth-code-btn" type="primary" :disabled="!phone.trim()">获取短信验证码</a-button>
                </template>
              </a-input>
            </a-form-item>
          </a-form>

          <a-checkbox v-model:checked="agreed" class="auth-agreement">
            <span>
              我已阅读并同意
              <a
                href="https://terms.alicdn.com/legal-agreement/terms/c_platform_service_agreement/20251222124515217/20251222124515217.html"
                target="_blank"
                rel="noopener noreferrer"
              >《用户协议》</a>
              和
              <a
                href="https://terms.alicdn.com/legal-agreement/terms/privacy_policy_full/20251222121419502/20251222121419502.html"
                target="_blank"
                rel="noopener noreferrer"
              >《隐私政策》</a>
            </span>
          </a-checkbox>

          <a-button class="auth-submit-btn" type="primary" :disabled="!canSubmit" block>
            {{ isRegister ? '注 册' : '登 录' }}
          </a-button>

          <div class="auth-switch-row">
            <button class="auth-switch-btn" type="button" @click="isRegister = !isRegister">
              {{ isRegister ? '已有账号? 去登录' : '还没有账号? 去注册' }}
              <span class="auth-switch-icon">›</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const isRegister = ref(true)
const phone = ref('')
const inviteCode = ref('')
const code = ref('')
const agreed = ref(false)

const canSubmit = computed(() => {
  return phone.value.trim().length > 0 && code.value.trim().length > 0 && agreed.value
})
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
  margin-top: -20px;
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

.auth-form :deep(.ant-form-item) {
  margin-bottom: 16px;
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

.auth-agreement a {
  color: #6928fe;
}

.auth-agreement a:hover {
  color: #8b52ff;
}

.auth-agreement a:active {
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
