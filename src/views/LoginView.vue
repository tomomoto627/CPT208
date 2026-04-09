<script setup>
import { ref } from 'vue'

const emit = defineEmits(['success'])

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

function clearError() {
  error.value = ''
}

async function submit() {
  if (submitting.value) return
  clearError()

  const u = username.value.trim()
  const p = password.value

  if (!u || !p) {
    error.value = '请输入账号和密码'
    return
  }

  submitting.value = true
  try {
    await new Promise((r) => setTimeout(r, 180))
    if (u === 'test' && p === '123456') {
      emit('success', { username: u })
      return
    }
    error.value = '账号或密码错误（提示：test / 123456）'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="hero">
      <div class="brand">
        <div class="badge" aria-hidden="true">◇</div>
        <div class="brand-text">
          <h1 class="title">Museum Quest</h1>
          <p class="subtitle">登录后开始你的博物馆探索</p>
        </div>
      </div>
    </div>

    <section class="card" aria-label="登录表单">
      <label class="field">
        <span class="label">账号</span>
        <input
          v-model="username"
          class="input"
          type="text"
          inputmode="text"
          autocomplete="username"
          placeholder="请输入账号（test）"
          @input="clearError"
          @keydown.enter.prevent="submit"
        />
      </label>

      <label class="field">
        <span class="label">密码</span>
        <input
          v-model="password"
          class="input"
          type="password"
          autocomplete="current-password"
          placeholder="请输入密码（123456）"
          @input="clearError"
          @keydown.enter.prevent="submit"
        />
      </label>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button type="button" class="primary" :disabled="submitting" @click="submit">
        {{ submitting ? '正在登录…' : '登录' }}
      </button>

      <p class="hint">
        仅前端演示：账号 <span class="mono">test</span>，密码 <span class="mono">123456</span>
      </p>
    </section>
  </div>
</template>

<style scoped>
.login {
  min-height: 100dvh;
  padding: max(20px, var(--mq-safe-top)) 16px max(28px, var(--mq-safe-bottom));
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  background: radial-gradient(900px 520px at 20% 0%, rgba(201, 162, 39, 0.15), transparent 55%),
    linear-gradient(165deg, #15221c 0%, var(--mq-bg) 55%);
}

.hero {
  padding: 8px 4px 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--mq-accent);
  background: rgba(201, 162, 39, 0.14);
  border: 1px solid rgba(201, 162, 39, 0.22);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
  font-size: 1.25rem;
}

.title {
  font-size: 1.35rem;
  letter-spacing: 0.02em;
}

.subtitle {
  margin-top: 2px;
  font-size: 0.88rem;
  color: var(--mq-text-muted);
}

.card {
  padding: 18px;
  border-radius: 18px;
  background: rgba(26, 38, 34, 0.72);
  border: 1px solid var(--mq-border);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 0.85rem;
  color: var(--mq-text-muted);
}

.input {
  min-height: var(--mq-tap-min);
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--mq-border);
  background: rgba(36, 51, 48, 0.92);
  color: var(--mq-text);
  outline: none;
}

.input::placeholder {
  color: var(--mq-text-muted);
  opacity: 0.75;
}

.input:focus {
  border-color: rgba(201, 162, 39, 0.45);
  box-shadow: 0 0 0 3px rgba(201, 162, 39, 0.12);
}

.error {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 138, 138, 0.1);
  border: 1px solid rgba(255, 138, 138, 0.22);
  color: rgba(255, 205, 205, 0.95);
  font-size: 0.88rem;
  line-height: 1.45;
}

.primary {
  min-height: 52px;
  border-radius: 14px;
  background: linear-gradient(180deg, #d4b03a, var(--mq-accent));
  color: #1a1508;
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow: 0 4px 20px rgba(201, 162, 39, 0.35);
}

.primary:disabled {
  opacity: 0.7;
}

.hint {
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--mq-text-muted);
  text-align: center;
}

.mono {
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  color: var(--mq-text);
}
</style>
