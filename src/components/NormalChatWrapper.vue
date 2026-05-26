<template>
  <div class="normal-chat-wrapper">
    <!-- 聊天消息区域 -->
    <div class="chat-messages-container">
      <a-spin :spinning="loading" tip="加载中...">
        <div class="messages-list">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message-item', message.role]"
          >
            <!-- 用户头像 -->
            <div class="message-avatar">
              <a-avatar :size="32">
                <template #icon>
                  <UserOutlined v-if="message.role === 'user'" />
                  <RobotOutlined v-else />
                </template>
              </a-avatar>
            </div>

            <!-- 消息内容 -->
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">{{ message.role === 'user' ? '你' : 'AI助手' }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-text">
                {{ message.content }}
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <a-empty
            v-if="messages.length === 0 && !loading"
            description="开始对话吧"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
      </a-spin>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-container">
      <div class="input-wrapper">
        <a-textarea
          v-model:value="inputValue"
          :placeholder="placeholder"
          :auto-size="{ minRows: 1, maxRows: 4 }"
          :disabled="loading"
          @pressEnter="handleSend"
          class="chat-input"
        />
        <div class="input-actions">
          <a-button
            type="text"
            :icon="h(PaperClipOutlined)"
            @click="handleAttachment"
            :disabled="loading"
          />
          <a-button
            type="primary"
            :icon="h(SendOutlined)"
            @click="handleSend"
            :loading="loading"
            :disabled="!inputValue.trim()"
          >
            发送
          </a-button>
        </div>
      </div>
      <div class="input-tips">
        <span class="tip-text">按 Enter 发送，Shift + Enter 换行</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import {
  UserOutlined,
  RobotOutlined,
  SendOutlined,
  PaperClipOutlined
} from '@ant-design/icons-vue'
import { Empty, message as antMessage } from 'ant-design-vue'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Props {
  placeholder?: string
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入消息...',
  maxLength: 2000
})

const emit = defineEmits<{
  send: [content: string]
  attachment: []
}>()

// 状态
const messages = ref<Message[]>([])
const inputValue = ref('')
const loading = ref(false)

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 发送消息
const handleSend = (e: KeyboardEvent) => {
  // Shift + Enter 换行
  if (e.shiftKey) {
    return
  }

  e.preventDefault()

  const content = inputValue.value.trim()
  if (!content || loading.value) {
    return
  }

  if (content.length > props.maxLength) {
    antMessage.warning(`消息长度不能超过${props.maxLength}字符`)
    return
  }

  // 添加用户消息
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: Date.now()
  })

  emit('send', content)
  inputValue.value = ''
}

// 附件处理
const handleAttachment = () => {
  emit('attachment')
}

// 添加消息方法（供父组件调用）
const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
  messages.value.push({
    ...message,
    id: Date.now().toString(),
    timestamp: Date.now()
  })
}

// 设置加载状态
const setLoading = (value: boolean) => {
  loading.value = value
}

// 清空消息
const clearMessages = () => {
  messages.value = []
}

defineExpose({
  addMessage,
  setLoading,
  clearMessages
})
</script>

<style scoped lang="scss">
.normal-chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;

  // 消息区域
  .chat-messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    background: #fafafa;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 3px;

      &:hover {
        background: #bfbfbf;
      }
    }
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 900px;
    margin: 0 auto;
  }

  // 消息项
  .message-item {
    display: flex;
    gap: 12px;
    animation: messageSlideIn 0.3s ease-out;

    &.user .message-text {
      background: #e6f4ff;
      color: #262626;
      border: 1px solid #91caff;
    }

    &.assistant .message-text {
      background: #ffffff;
      color: #262626;
      border: 1px solid #d9d9d9;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
  }

  .message-avatar {
    flex-shrink: 0;
  }

  .message-content {
    flex: 1;
    min-width: 0;
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .message-role {
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }

  .message-time {
    font-size: 14px;
    color: #8c8c8c;
  }

  .message-text {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  // 输入区域
  .chat-input-container {
    flex-shrink: 0;
    padding: 16px 24px;
    background: #ffffff;
    border-top: 1px solid #f0f0f0;
  }

  .input-wrapper {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .chat-input {
    flex: 1;
    border-radius: 8px;
    font-size: 14px;

    :deep(.ant-input) {
      padding: 10px 12px;
      border-radius: 8px;
    }
  }

  .input-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .input-tips {
    max-width: 900px;
    margin: 8px auto 0;
    text-align: right;
  }

  .tip-text {
    font-size: 14px;
    color: #8c8c8c;
  }

  @media (max-width: 768px) {
    .chat-messages-container {
      padding: 16px;
    }

    .chat-input-container {
      padding: 12px 16px;
    }

    .messages-list {
      gap: 16px;
    }

    .message-text {
      padding: 10px 12px;
      font-size: 13px;
    }
  }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
