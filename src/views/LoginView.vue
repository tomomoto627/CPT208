<script setup>
import { ref } from "vue";
import heroBg from "@/assets/loginbackground.png";

const emit = defineEmits(["success"]);

const username = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

function clearError() {
  error.value = "";
}

async function submit() {
  if (submitting.value) return;
  clearError();

  const u = username.value.trim();
  const p = password.value;

  if (!u || !p) {
    error.value = "Please enter email and password.";
    return;
  }

  submitting.value = true;
  try {
    await new Promise((r) => setTimeout(r, 180));
    if (u === "test" && p === "123456") {
      emit("success", { username: u });
      return;
    }
    error.value = "Invalid credentials. Try test / 123456.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="login-screen">
    <section class="login-hero" aria-label="Welcome">
      <div
        class="hero-bg"
        :style="{ backgroundImage: `url(${heroBg})` }"
        aria-hidden="true"
      />
      <div class="hero-copy">
        <p class="welcome">Welcome back</p>
        <h1 class="hero-title">Log in to continue</h1>
        <p class="hero-desc">Access your collections and continue exploring.</p>
      </div>
    </section>

    <section class="login-form-section" aria-label="Login form">
      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="label">Email</span>
          <div class="input-wrap">
            <span class="left-icon" aria-hidden="true">
              <svg class="icon-svg" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M4 8l8 6 8-6" />
              </svg>
            </span>
            <input
              v-model="username"
              class="input"
              type="text"
              inputmode="email"
              autocomplete="username"
              placeholder="name@university.edu"
              @input="clearError"
              @keydown.enter.prevent="submit"
            />
          </div>
        </label>

        <div class="row-head">
          <span class="label">Password</span>
          <button type="button" class="link-btn">Forgot password?</button>
        </div>
        <label class="field">
          <div class="input-wrap">
            <span class="left-icon" aria-hidden="true">
              <svg class="icon-svg" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
              </svg>
            </span>
            <input
              v-model="password"
              class="input"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              @input="clearError"
              @keydown.enter.prevent="submit"
            />
            <span class="right-icon" aria-hidden="true">
              <svg class="icon-svg" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                />
                <circle cx="12" cy="12" r="2.75" />
              </svg>
            </span>
          </div>
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <button type="submit" class="primary" :disabled="submitting">
          {{ submitting ? "Logging in..." : "Log In" }}
        </button>

        <div class="divider" aria-hidden="true"><span>or</span></div>

        <button type="button" class="social">
          <span class="g">G</span>
          <span>Continue with Google</span>
        </button>

        <p class="signup">
          Don't have an account?
          <button type="button" class="link-btn signup-btn">Sign Up</button>
        </p>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login-screen {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #f4eee3;
  color: #2f2a24;
  overflow: hidden;
}

.login-hero {
  position: relative;
  flex: 0 0 42%;
  min-height: 260px;
  padding: max(30px, calc(var(--mq-safe-top) + 18px)) 18px 18px;
  display: flex;
  align-items: flex-start;
  overflow: hidden;
  isolation: isolate;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-size: 118% auto;
  background-position: right top;
  opacity: 0.23;
  pointer-events: none;
  z-index: 0;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 56%;
  margin-left: 24px;
  margin-top: 22px;
}

.welcome {
  margin: 0;
  font-size: 0.95rem;
  color: #b17d26;
  font-weight: 600;
}

.hero-title {
  margin: 8px 0 0;
  font-size: 2.35rem;
  line-height: 1.03;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.hero-desc {
  margin: 10px 0 0;
  font-size: 0.95rem;
  line-height: 1.4;
  color: #5b5246;
}

.login-form-section {
  position: relative;
  z-index: 2;
  flex: 1;
  background: #f8f3ea;
  border-top: 1px solid rgba(130, 112, 88, 0.15);
  border-radius: 24px 24px 0 0;
  padding: 20px 16px max(16px, var(--mq-safe-bottom));
  display: flex;
}

.form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row-head {
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  font-size: 0.94rem;
  font-weight: 600;
  color: #2f2a24;
}

.link-btn {
  border: 0;
  background: none;
  padding: 0;
  color: #b17d26;
  font-size: 0.82rem;
  font-weight: 600;
}

.input-wrap {
  min-height: 48px;
  border: 1px solid rgba(130, 112, 88, 0.24);
  border-radius: 10px;
  background: #f9f5ee;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.left-icon,
.right-icon {
  color: #b08f56;
  font-size: 0.84rem;
  line-height: 1;
  flex-shrink: 0;
}

.right-icon {
  margin-left: auto;
}

.icon-svg {
  width: 20px;
  height: 20px;
  display: block;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: #2f2a24;
  min-width: 0;
  font-size: 0.95rem;
}

.input::placeholder {
  color: #9a8d7d;
}

.error {
  margin: 0;
  font-size: 0.84rem;
  color: #b14545;
  line-height: 1.35;
}

.primary {
  margin-top: 2px;
  min-height: 50px;
  border-radius: 10px;
  border: 0;
  background: #b9822c;
  color: #fff;
  font-size: 1.08rem;
  font-weight: 700;
}

.primary:disabled {
  opacity: 0.75;
}

.divider {
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #76695b;
  font-size: 0.88rem;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(130, 112, 88, 0.28);
}

.social {
  min-height: 48px;
  border-radius: 10px;
  border: 1px solid rgba(130, 112, 88, 0.45);
  background: #f8f3ea;
  color: #2f2a24;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 500;
}

.g {
  color: #4285f4;
  font-weight: 700;
}

.signup {
  margin: 2px 0 0;
  text-align: center;
  font-size: 0.88rem;
  color: #3f382f;
}

.signup-btn {
  margin-left: 4px;
  font-size: 0.9rem;
}
</style>
