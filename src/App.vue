<script setup>
import { ref, provide, computed } from 'vue'
import { createMuseumStore } from './museum/store'
import HomeView from './views/HomeView.vue'
import ScanView from './views/ScanView.vue'
import CollectionView from './views/CollectionView.vue'
import StoreView from './views/StoreView.vue'
import CommunityView from './views/CommunityView.vue'
import LoginView from './views/LoginView.vue'

const museum = createMuseumStore()
provide('museum', museum)

const authed = ref(localStorage.getItem('mq_authed') === '1')

const tabs = [
  { key: 'home', label: '探索', icon: '◇' },
  { key: 'scan', label: '扫描', icon: '◎' },
  { key: 'collection', label: '收藏', icon: '☆' },
  { key: 'store', label: '商店', icon: '◆' },
  { key: 'community', label: '社区', icon: '≡' },
]

const current = ref('home')

const views = {
  home: HomeView,
  scan: ScanView,
  collection: CollectionView,
  store: StoreView,
  community: CommunityView,
}

const ActiveView = computed(() => views[current.value] || HomeView)

function onLoginSuccess(payload) {
  authed.value = true
  localStorage.setItem('mq_authed', '1')
  if (payload?.username) localStorage.setItem('mq_user', payload.username)
}
</script>

<template>
  <LoginView v-if="!authed" @success="onLoginSuccess" />

  <div v-else class="shell">
    <header class="top-bar">
      <h1 class="title">Museum Quest</h1>
      <div class="points" aria-live="polite">
        <span class="points-label">积分</span>
        <span class="points-value">{{ museum.state.points }}</span>
      </div>
    </header>

    <main class="main">
      <KeepAlive>
        <component :is="ActiveView" />
      </KeepAlive>
    </main>

    <nav class="tab-bar" aria-label="主导航">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="tab"
        :class="{ active: current === t.key }"
        :aria-current="current === t.key ? 'page' : undefined"
        @click="current = t.key"
      >
        <span class="tab-icon" aria-hidden="true">{{ t.icon }}</span>
        <span class="tab-label">{{ t.label }}</span>
      </button>
    </nav>

    <div v-if="museum.state.toast" class="toast" role="status">
      {{ museum.state.toast }}
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding-top: var(--mq-safe-top);
  background: linear-gradient(165deg, #15221c 0%, var(--mq-bg) 45%);
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 10px;
  border-bottom: 1px solid var(--mq-border);
  flex-shrink: 0;
}

.title {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--mq-text);
}

.points {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--mq-accent-soft);
  border: 1px solid rgba(201, 162, 39, 0.35);
}

.points-label {
  font-size: 0.75rem;
  color: var(--mq-text-muted);
}

.points-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--mq-accent);
  font-variant-numeric: tabular-nums;
}

.main {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 16px calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 20px);
}

.tab-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  min-height: calc(var(--mq-nav-h) + var(--mq-safe-bottom));
  padding-bottom: var(--mq-safe-bottom);
  background: rgba(15, 23, 20, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--mq-border);
  z-index: 50;
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: var(--mq-tap-min);
  padding: 6px 4px;
  color: var(--mq-text-muted);
  font-size: 0.65rem;
}

.tab.active {
  color: var(--mq-accent);
}

.tab-icon {
  font-size: 1.1rem;
  line-height: 1;
  opacity: 0.9;
}

.tab-label {
  letter-spacing: 0.02em;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 16px);
  transform: translateX(-50%);
  max-width: min(90%, 320px);
  padding: 12px 18px;
  border-radius: 12px;
  background: var(--mq-surface);
  color: var(--mq-text);
  font-size: 0.9rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  z-index: 60;
  pointer-events: none;
}
</style>
