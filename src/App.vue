<script setup>
import { computed, provide, ref } from "vue";
import avatarImg from "@/assets/avatar1.png";
import { createMuseumStore } from "./museum/store";
import { createSocialStore } from "./museum/socialStore";
import CommunityView from "./views/CommunityView.vue";
import ForgotPasswordView from "./views/ForgotPasswordView.vue";
import HomeView from "./views/HomeView.vue";
import LoginView from "./views/LoginView.vue";
import ProfileView from "./views/ProfileView.vue";
import RegisterView from "./views/RegisterView.vue";
import ScanView from "./views/ScanView.vue";
import SplashPage from "./views/SplashPage.vue";
import StoreView from "./views/StoreView.vue";

const museum = createMuseumStore();
provide("museum", museum);
const social = createSocialStore();
provide("social", social);

const stage = ref("splash");
const current = ref("home");
const previousTab = ref("home");

const tabs = [
  { key: "home", label: "Home" },
  { key: "scan", label: "Scan" },
  { key: "profile", label: "Profile" },
  { key: "store", label: "Store" },
  { key: "community", label: "Community" },
];

const views = {
  home: HomeView,
  scan: ScanView,
  store: StoreView,
  community: CommunityView,
  profile: ProfileView,
};

const ActiveView = computed(() => views[current.value] || HomeView);

function onLoginSuccess(payload) {
  stage.value = "app";
  localStorage.setItem("mq_authed", "1");
  if (payload?.username) localStorage.setItem("mq_user", payload.username);
}

function onSplashDone() {
  stage.value = "login";
}

function openRegister() {
  stage.value = "register";
}

function openForgotPassword() {
  stage.value = "forgot-password";
}

function backToLogin() {
  stage.value = "login";
}

function onRegisterSuccess(payload) {
  stage.value = "app";
  localStorage.setItem("mq_authed", "1");
  if (payload?.username) localStorage.setItem("mq_user", payload.username);
}

function switchTab(key) {
  if (!key || key === current.value) return;
  if (current.value !== "profile") {
    previousTab.value = current.value;
  }
  current.value = key;
}

function leaveProfile() {
  current.value = previousTab.value || "home";
}
</script>

<template>
  <div class="app-screen">
    <SplashPage v-if="stage === 'splash'" @done="onSplashDone" />
    <LoginView
      v-else-if="stage === 'login'"
      @success="onLoginSuccess"
      @open-register="openRegister"
      @open-forgot-password="openForgotPassword"
    />
    <RegisterView
      v-else-if="stage === 'register'"
      @back-to-login="backToLogin"
      @registered="onRegisterSuccess"
    />
    <ForgotPasswordView
      v-else-if="stage === 'forgot-password'"
      @back-to-login="backToLogin"
    />

    <div v-else class="shell">
      <main
        class="main"
        :class="{
          'main-profile': current === 'profile',
          'main-community': current === 'community',
          'main-scan': current === 'scan',
          'main-store': current === 'store',
        }"
      >
        <KeepAlive>
          <component :is="ActiveView" @back="leaveProfile" />
        </KeepAlive>
      </main>

      <nav class="tab-bar" aria-label="Primary navigation">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          class="tab"
          :class="{
            active: current === t.key,
            'tab-profile': t.key === 'profile',
          }"
          :aria-current="current === t.key ? 'page' : undefined"
          :aria-label="t.label"
          @click="switchTab(t.key)"
        >
          <svg
            v-if="t.key === 'home'"
            class="tab-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 11.5L12 5l8 6.5V20H4v-8.5Z" />
            <path d="M9.5 20v-5h5v5" />
          </svg>
          <svg
            v-else-if="t.key === 'scan'"
            class="tab-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3"
            />
            <rect x="8" y="8" width="8" height="8" rx="1.5" />
          </svg>
          <img
            v-else-if="t.key === 'profile'"
            class="tab-avatar"
            :src="avatarImg"
            alt=""
            aria-hidden="true"
          />
          <svg
            v-else-if="t.key === 'store'"
            class="tab-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M5 8h14l-1 11H6L5 8Z" />
            <path d="M8 8a4 4 0 1 1 8 0" />
          </svg>
          <svg
            v-else
            class="tab-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8.2" cy="9" r="2.3" />
            <circle cx="15.8" cy="9" r="2.3" />
            <path d="M3.8 18a4.4 4.4 0 0 1 8.8 0M11.4 18a4.4 4.4 0 0 1 8.8 0" />
          </svg>
          <span v-if="t.key !== 'profile'" class="tab-label">{{
            t.label
          }}</span>
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
  min-height: calc(var(--mq-vh, 1vh) * 100);
  background: #ffffff;
  --mq-bg: #ffffff;
}

.shell {
  display: flex;
  flex-direction: column;
  min-height: calc(var(--mq-vh, 1vh) * 100);
  padding-top: var(--mq-safe-top);
  background: #ffffff;
}

.main {
  flex: 1;
  min-height: 0;
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
  padding: 0 0 calc(var(--mq-nav-h) + var(--mq-safe-bottom));
}

.main.main-scan {
  overflow: hidden;
  padding: 0;
}

.main.main-store {
  padding-top: 8px;
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
  background: linear-gradient(180deg, #dbc39e 0%, #caaa79 100%);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(120, 89, 47, 0.24);
  box-shadow: 0 -8px 18px rgba(86, 61, 30, 0.14);
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
  color: #6f5638;
}

.tab.active {
  color: #8a6227;
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
  border: 1px solid rgba(120, 89, 47, 0.3);
  background: #f6ead8;
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
