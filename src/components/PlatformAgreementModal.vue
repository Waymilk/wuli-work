<template>
  <a-modal
    :open="props.open"
    :footer="null"
    :width="720"
    centered
    :closable="false"
    wrapClassName="platform-agreement-modal"
    @update:open="emit('update:open', $event)"
  >
    <button class="agreement-close" type="button" @click="emit('update:open', false)">×</button>
    <div class="agreement-modal-body">
      <h3 class="agreement-title">平台协议</h3>
      <div class="agreement-content">
        <p
          v-for="(line, index) in agreementLines"
          :key="`${index}-${line.text}`"
          class="agreement-line"
          :class="{ 'agreement-line-title': line.isTitle, 'agreement-line-empty': !line.text }"
        >
          {{ line.text || '\u00a0' }}
        </p>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { platformAgreementText } from '@/layout/constants/platformAgreement'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
}>()

const agreementLines = computed(() =>
  platformAgreementText.split(/\r?\n/).map((rawLine) => {
    const trimmedLine = rawLine.replace(/\s+$/g, '')
    const titleMatch = trimmedLine.match(/^\*\*(.+?)\*\*\s*$/)
    return {
      text: titleMatch ? titleMatch[1].trim() : trimmedLine.replace(/\*\*/g, '').trimEnd(),
      isTitle: Boolean(titleMatch),
    }
  }),
)
</script>

<style scoped lang="scss">
:global(.platform-agreement-modal .ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
}

:global(.platform-agreement-modal .ant-modal-body) {
  padding: 0;
}

.agreement-close {
  background: transparent;
  border: none;
  border-radius: 50%;
  color: rgba(0, 0, 0, 0.35);
  cursor: pointer;
  font-size: 18px;
  height: 28px;
  line-height: 28px;
  position: absolute;
  right: 14px;
  top: 10px;
  width: 28px;
  z-index: 2;
}

.agreement-modal-body {
  display: flex;
  flex-direction: column;
  max-height: 78vh;
}

.agreement-title {
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  color: rgba(0, 0, 0, 0.88);
  display: flex;
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 600;
  height: 64px;
  justify-content: center;
  line-height: 26px;
  margin: 0;
}

.agreement-content {
  color: rgba(0, 0, 0, 0.72);
  flex: 1 1 auto;
  font-size: 14px;
  line-height: 1.8;
  max-height: 70vh;
  overflow-y: auto;
  padding: 22px 28px 28px;
  scrollbar-width: thin;
}

.agreement-line {
  margin: 0 0 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.agreement-line-title {
  color: rgba(0, 0, 0, 0.88);
  font-size: 15px;
  font-weight: 600;
  margin: 18px 0 10px;
}

.agreement-line:first-child {
  margin-top: 0;
  text-align: center;
}

.agreement-line-empty {
  line-height: 8px;
  margin-bottom: 6px;
}
</style>
