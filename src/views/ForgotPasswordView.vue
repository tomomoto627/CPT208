<script setup>
import { ref } from "vue";
import heroBg from "@/assets/loginbackground.png";
import { requestPasswordReset } from "@/utils/authApi";

const emit = defineEmits(["back-to-login"]);

const email = ref("");
const code = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const step = ref(1);
const sendingCode = ref(false);
const resetting = ref(false);
const info = ref("");
const error = ref("");

function clearMessages() {
  info.value = "";
  error.value = "";
}

function backToLogin() {
  emit("back-to-login");
}

async function sendCode() {
  if (sendingCode.value) return;
  clearMessages();
  const mail = email.value.trim();
  if (!mail) {
    error.value = "Please enter your email first.";
    return;
  }

  sendingCode.value = true;
  try {
    await requestPasswordReset({ email: mail });
    info.value = "Verification code sent. Please check your inbox.";
    step.value = 2;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to send code.";
  } finally {
    sendingCode.value = false;
  }
}

async function resetPassword() {
  if (resetting.value) return;
  clearMessages();

  const mail = email.value.trim();
  if (!mail || !code.value || !newPassword.value || !confirmPassword.value) {
    error.value = "Please complete all fields.";
    return;
  }
  if (newPassword.value.length < 6) {
    error.value = "New password should be at least 6 characters.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  resetting.value = true;
  try {
    await requestPasswordReset({
      email: mail,
      code: code.value,
      newPassword: newPassword.value,
    });
    info.value = "Password reset successful. You can now log in.";
    step.value = 3;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Password reset failed.";
  } finally {
    resetting.value = false;
  }
}
</script>

<template>
  <div class="auth-screen">
    <section class="auth-hero" aria-label="Forgot password">
      <div
        class="hero-bg"
        :style="{ backgroundImage: `url(${heroBg})` }"
        aria-hidden="true"
      />
      <div class="hero-copy">
        <p class="welcome">Account Recovery</p>
        <h1 class="hero-title">Forgot your password?</h1>
        <p class="hero-desc">Verify your email and set a new password securely.</p>
      </div>
    </section>

    <section class="auth-form-section" aria-label="Forgot password form">
      <form class="form" @submit.prevent>
        <label class="field">
          <span class="label">Email</span>
          <div class="input-wrap">
            <input
              v-model="email"
              class="input"
              type="email"
              autocomplete="email"
              placeholder="name@university.edu"
              :disabled="step === 3"
              @input="clearMessages"
            />
          </div>
        </label>

        <button
          v-if="step === 1"
          type="button"
          class="primary"
          :disabled="sendingCode"
          @click="sendCode"
        >
          {{ sendingCode ? "Sending..." : "Send Verification Code" }}
        </button>

        <template v-if="step >= 2 && step !== 3">
          <label class="field">
            <span class="label">Verification code</span>
            <div class="input-wrap">
              <input
                v-model="code"
                class="input"
                type="text"
                inputmode="numeric"
                placeholder="6-digit code"
                @input="clearMessages"
              />
            </div>
          </label>

          <label class="field">
            <span class="label">New password</span>
            <div class="input-wrap">
              <input
                v-model="newPassword"
                class="input"
                type="password"
                autocomplete="new-password"
                placeholder="At least 6 characters"
                @input="clearMessages"
              />
            </div>
          </label>

          <label class="field">
            <span class="label">Confirm new password</span>
            <div class="input-wrap">
              <input
                v-model="confirmPassword"
                class="input"
                type="password"
                autocomplete="new-password"
                placeholder="Re-enter new password"
                @input="clearMessages"
              />
            </div>
          </label>

          <button
            type="button"
            class="primary"
            :disabled="resetting"
            @click="resetPassword"
          >
            {{ resetting ? "Updating..." : "Reset Password" }}
          </button>
        </template>

        <p v-if="info" class="info" role="status">{{ info }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <p class="switch-tip">
          <button type="button" class="link-btn" @click="backToLogin">Back to Log In</button>
        </p>
      </form>
    </section>
  </div>
</template>

<style scoped>
.auth-screen {
  min-height: calc(var(--mq-vh, 1vh) * 100);
  display: flex;
  flex-direction: column;
  background: #f4eee3;
  color: #2f2a24;
  overflow: hidden;
}

.auth-hero {
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
  max-width: 62%;
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
  margin: 6px 0 0;
  color: #2a241f;
}

.hero-desc {
  margin: 10px 0 0;
  font-size: 0.95rem;
  line-height: 1.4;
  color: #5b5246;
}

.auth-form-section {
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

.label {
  font-size: 0.94rem;
  font-weight: 600;
  color: #2f2a24;
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

.primary {
  margin-top: 2px;
  min-height: 50px;
  border-radius: 10px;
  border: 0;
  background: #b9822c;
  color: #fff;
  font-size: 1.02rem;
  font-weight: 700;
}

.primary:disabled {
  opacity: 0.75;
}

.info {
  margin: 0;
  font-size: 0.88rem;
  color: #5a7632;
}

.error {
  margin: 0;
  font-size: 0.84rem;
  color: #b14545;
}

.switch-tip {
  margin: 2px 0 0;
  text-align: center;
}

.link-btn {
  border: 0;
  background: none;
  padding: 0;
  color: #b17d26;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
