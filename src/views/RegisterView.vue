<script setup>
import { ref } from "vue";
import heroBg from "@/assets/loginbackground.png";
import { registerUser } from "@/utils/authApi";

const emit = defineEmits(["back-to-login", "registered"]);

const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const submitting = ref(false);

function clearError() {
  error.value = "";
}

function backToLogin() {
  emit("back-to-login");
}

async function submit() {
  if (submitting.value) return;
  clearError();

  const name = fullName.value.trim();
  const mail = email.value.trim();
  const pwd = password.value;
  const confirm = confirmPassword.value;

  if (!name || !mail || !pwd || !confirm) {
    error.value = "Please complete all fields.";
    return;
  }
  if (pwd.length < 6) {
    error.value = "Password should be at least 6 characters.";
    return;
  }
  if (pwd !== confirm) {
    error.value = "Passwords do not match.";
    return;
  }

  submitting.value = true;
  try {
    await registerUser({ name, email: mail, password: pwd });
    emit("registered", { username: mail });
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Registration failed.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-screen">
    <section class="auth-hero" aria-label="Create account">
      <div
        class="hero-bg"
        :style="{ backgroundImage: `url(${heroBg})` }"
        aria-hidden="true"
      />
      <div class="hero-copy">
        <p class="welcome">Join Storylens</p>
        <h1 class="hero-title">Create your account</h1>
        <p class="hero-desc">Save favorites, track collections, and start scanning.</p>
      </div>
    </section>

    <section class="auth-form-section" aria-label="Register form">
      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="label">Full name</span>
          <div class="input-wrap">
            <input
              v-model="fullName"
              class="input"
              type="text"
              autocomplete="name"
              placeholder="Your name"
              @input="clearError"
            />
          </div>
        </label>

        <label class="field">
          <span class="label">Email</span>
          <div class="input-wrap">
            <input
              v-model="email"
              class="input"
              type="email"
              autocomplete="email"
              placeholder="name@university.edu"
              @input="clearError"
            />
          </div>
        </label>

        <label class="field">
          <span class="label">Password</span>
          <div class="input-wrap">
            <input
              v-model="password"
              class="input"
              type="password"
              autocomplete="new-password"
              placeholder="At least 6 characters"
              @input="clearError"
            />
          </div>
        </label>

        <label class="field">
          <span class="label">Confirm password</span>
          <div class="input-wrap">
            <input
              v-model="confirmPassword"
              class="input"
              type="password"
              autocomplete="new-password"
              placeholder="Re-enter password"
              @input="clearError"
            />
          </div>
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <button type="submit" class="primary" :disabled="submitting">
          {{ submitting ? "Creating..." : "Create Account" }}
        </button>

        <p class="switch-tip">
          Already have an account?
          <button type="button" class="link-btn" @click="backToLogin">Log In</button>
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
  font-size: 1.02rem;
  font-weight: 700;
}

.primary:disabled {
  opacity: 0.75;
}

.switch-tip {
  margin: 6px 0 0;
  text-align: center;
  font-size: 0.9rem;
  color: #3f382f;
}

.link-btn {
  margin-left: 6px;
  border: 0;
  background: none;
  padding: 0;
  color: #b17d26;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
