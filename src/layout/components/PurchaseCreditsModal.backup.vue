<template>
  <a-modal
    class="purchase-credits-modal"
    :open="open"
    :footer="null"
    :width="980"
    centered
    :closable="false"
    wrapClassName="sider-invite-modal"
    @update:open="emit('update:open', $event)"
  >
    <button class="wuli-modal-close invite-close" type="button" @click="emit('update:open', false)">×</button>
    <div class="invite-modal-content">
      <div class="invite-user-row">
        <img class="invite-avatar" src="/wuli-icons/avatar-default.png" alt="avatar" />
        <span class="invite-username">{{ displayUsername }}</span>
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
          <div class="summary-value">{{ displayCredits }}</div>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  open: boolean
  username: string
  credits: string | number | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const displayUsername = computed(() => {
  const next = String(props.username || '').trim()
  return next || '用户3529_2654'
})

const displayCredits = computed(() => {
  if (props.credits === null || props.credits === undefined || props.credits === '') return '--'
  return String(props.credits)
})
</script>

<style scoped lang="scss">
:global(.sider-invite-modal .ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
  padding: 14px 20px 18px;
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
</style>
