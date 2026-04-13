<script setup>
import { computed, provide, ref } from 'vue'
import avatarImg from '@/assets/avatar1.png'
import { storeProducts } from '@/data/storeProducts'
import { createMuseumStore } from './museum/store'
import CommunityView from './views/CommunityView.vue'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import ProfileView from './views/ProfileView.vue'
import ScanView from './views/ScanView.vue'
import SplashPage from './views/SplashPage.vue'
import StoreView from './views/StoreView.vue'

const museum = createMuseumStore()
provide('museum', museum)

const stage = ref('splash')
const current = ref('home')
const previousTab = ref('home')

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'scan', label: 'Scan' },
  { key: 'profile', label: 'Profile' },
  { key: 'store', label: 'Store' },
  { key: 'community', label: 'Community' },
]

const views = {
  home: HomeView,
  scan: ScanView,
  store: StoreView,
  community: CommunityView,
  profile: ProfileView,
}

const ActiveView = computed(() => views[current.value] || HomeView)
const topTitle = computed(() => (current.value === 'community' ? 'Community Feed' : 'Museum Quest'))

const storeSearch = ref('')
const storeSearchFocused = ref(false)

const matchedProducts = computed(() => {
  const keyword = storeSearch.value.trim().toLowerCase()
  if (!keyword) return []

  return storeProducts
    .map((item) => {
      const n = item.name.toLowerCase()
      const s = item.source.toLowerCase()
      const score = (n.startsWith(keyword) ? 2 : 0) + (n.includes(keyword) ? 1 : 0) + (s.includes(keyword) ? 1 : 0)
      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.item)
})

const showStoreMatches = computed(
  () => current.value === 'store' && storeSearchFocused.value && matchedProducts.value.length > 0,
)

function onLoginSuccess(payload) {
  stage.value = 'app'
  localStorage.setItem('mq_authed', '1')
  if (payload?.username) localStorage.setItem('mq_user', payload.username)
}

function onSplashDone() {
  stage.value = 'login'
}

function switchTab(key) {
  if (!key || key === current.value) return
  if (current.value !== 'profile') {
    previousTab.value = current.value
  }
  current.value = key
}

function leaveProfile() {
  current.value = previousTab.value || 'home'
}

function onStoreSearchBlur() {
  window.setTimeout(() => {
    storeSearchFocused.value = false
  }, 120)
}

function pickStoreProduct(name) {
  storeSearch.value = name
  storeSearchFocused.value = false
}

function confirmStoreSearch() {
  storeSearchFocused.value = true
}
</script>

<template>
  <div class="app-screen">
    <SplashPage v-if="stage === 'splash'" @done="onSplashDone" />
    <LoginView v-else-if="stage === 'login'" @success="onLoginSuccess" />

    <div v-else class="shell">
      <header v-if="current !== 'profile' && current !== 'community'" class="top-bar">
        <div v-if="current === 'store'" class="store-search-wrap">
          <div class="store-search-top">
            <div class="store-search">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                v-model="storeSearch"
                type="search"
                class="search-input"
                placeholder="Search museum gifts and stories"
                @focus="storeSearchFocused = true"
                @blur="onStoreSearchBlur"
                @keydown.enter.prevent="confirmStoreSearch"
              />
            </div>
            <button type="button" class="search-confirm-btn" @click="confirmStoreSearch">Go</button>
            <div class="store-points-chip" aria-label="Current points">
              <span class="store-points-num">{{ museum.state.points }}</span>
              <span class="store-points-unit">pts</span>
            </div>
          </div>

          <ul v-if="showStoreMatches" class="search-match-list">
            <li v-for="item in matchedProducts" :key="item.id">
              <button type="button" class="search-match-item" @mousedown.prevent="pickStoreProduct(item.name)">
                <img :src="item.image" :alt="item.name" class="search-match-thumb" />
                <span class="search-match-copy">
                  <span class="search-match-name">{{ item.name }}</span>
                  <span class="search-match-meta">{{ item.price }} / {{ item.redeemPoints }} pts</span>
                </span>
              </button>
            </li>
          </ul>
        </div>
        <h1 v-else class="title">{{ topTitle }}</h1>
      </header>

      <main
        class="main"
        :class="{ 'main-profile': current === 'profile', 'main-community': current === 'community' }"
      >
        <KeepAlive>
          <component :is="ActiveView" @back="leaveProfile" />
        </KeepAlive>
      </main>

      <nav class="tab-bar" aria-label="主导航">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          class="tab"
          :class="{ active: current === t.key, 'tab-profile': t.key === 'profile' }"
          :aria-current="current === t.key ? 'page' : undefined"
          :aria-label="t.label"
          @click="switchTab(t.key)"
        >
          <svg v-if="t.key === 'home'" class="tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 11.5L12 5l8 6.5V20H4v-8.5Z" />
            <path d="M9.5 20v-5h5v5" />
          </svg>
          <svg v-else-if="t.key === 'scan'" class="tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3" />
            <rect x="8" y="8" width="8" height="8" rx="1.5" />
          </svg>
          <img v-else-if="t.key === 'profile'" class="tab-avatar" :src="avatarImg" alt="" aria-hidden="true" />
          <svg v-else-if="t.key === 'store'" class="tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 8h14l-1 11H6L5 8Z" />
            <path d="M8 8a4 4 0 1 1 8 0" />
          </svg>
          <svg v-else class="tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="8.2" cy="9" r="2.3" />
            <circle cx="15.8" cy="9" r="2.3" />
            <path d="M3.8 18a4.4 4.4 0 0 1 8.8 0M11.4 18a4.4 4.4 0 0 1 8.8 0" />
          </svg>
          <span v-if="t.key !== 'profile'" class="tab-label">{{ t.label }}</span>
        </button>
      </nav>

      <div v-if="museum.state.toast" class="toast" role="status">
        {{ museum.state.toast }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-screen {
  min-height: 100dvh;
  background: #faf3e9;
  --mq-bg: #faf3e9;
}

.shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding-top: var(--mq-safe-top);
  background: #faf3e9;
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

.store-search-wrap {
  width: 100%;
  position: relative;
}

.store-search-top {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px 72px;
  gap: 8px;
  align-items: center;
}

.store-search {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(130, 112, 88, 0.24);
  background: #fbf6ee;
}

.search-confirm-btn {
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(130, 112, 88, 0.24);
}

.store-points-chip {
  min-height: 40px;
}

.search-confirm-btn {
  font-size: 0.86rem;
  font-weight: 650;
  color: #fffdf8;
  border-color: #a17434;
  background: #a17434;
}

.store-points-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #6b4a1e;
  border: 0;
  background: transparent;
  min-height: 40px;
}

.store-points-num {
  font-size: 1.32rem;
  line-height: 1;
  font-weight: 900;
}

.store-points-unit {
  font-size: 0.62rem;
  line-height: 1;
  font-weight: 680;
  opacity: 0.9;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: #8a7350;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #463d34;
  font-size: 0.92rem;
}

.search-input::placeholder {
  color: #8f8374;
}

.search-match-list {
  list-style: none;
  margin: 6px 80px 0 0;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(130, 112, 88, 0.2);
  background: #fffdf8;
  box-shadow: 0 6px 18px rgba(78, 58, 27, 0.12);
}

.search-match-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: 10px;
  text-align: left;
}

.search-match-item:hover {
  background: rgba(180, 138, 78, 0.09);
}

.search-match-thumb {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(130, 112, 88, 0.18);
}

.search-match-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.search-match-name {
  font-size: 0.86rem;
  font-weight: 620;
  color: #40382f;
}

.search-match-meta {
  font-size: 0.74rem;
  color: #907550;
}

.main {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 16px calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 20px);
}

.main.main-profile {
  overflow: hidden;
  padding: 0 0 calc(var(--mq-nav-h) + var(--mq-safe-bottom));
}

.main.main-community {
  overflow: hidden;
}

.tab-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 12px;
  min-height: calc(var(--mq-nav-h) + var(--mq-safe-bottom));
  padding-left: 12px;
  padding-right: 12px;
  padding-bottom: var(--mq-safe-bottom);
  background: #faf3e9;
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--mq-border);
  z-index: 50;
}

.tab {
  flex: 0 0 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: var(--mq-tap-min);
  padding: 3px 0 2px;
  color: var(--mq-text-muted);
}

.tab.active {
  color: var(--mq-accent);
}

.tab-icon {
  width: 20px;
  height: 20px;
  display: block;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tab-label {
  font-size: 0.68rem;
  letter-spacing: 0.01em;
  line-height: 1;
}

.tab-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(130, 112, 88, 0.34);
  background: #f3e5cf;
}

.tab-profile {
  justify-content: center;
}

.tab-profile .tab-avatar {
  transform: none;
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
