<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import logoSrc from "@/assets/storylens/logo.png";
import amphoraSrc from "@/assets/storylens/amphora.png";

const emit = defineEmits(["done"]);

const timerId = ref(null);
const finished = ref(false);

function goNext() {
  if (finished.value) return;
  finished.value = true;
  if (timerId.value) {
    clearTimeout(timerId.value);
    timerId.value = null;
  }
  emit("done");
}

onMounted(() => {
  timerId.value = setTimeout(goNext, 2000);
});

onBeforeUnmount(() => {
  if (timerId.value) {
    clearTimeout(timerId.value);
    timerId.value = null;
  }
});
</script>

<template>
  <section
    class="splash"
    role="button"
    tabindex="0"
    @click="goNext"
    @keydown.enter.prevent="goNext"
  >
    <div class="mobile-screen splash-inner">
      <header class="brand-wrap">
        <div class="brand-logo-clip">
          <img class="brand-logo" :src="logoSrc" alt="Storylens" />
        </div>
        <p class="tagline">Stories within reach.</p>
      </header>

      <main class="visual-wrap" aria-hidden="true">
        <img class="amphora" :src="amphoraSrc" alt="" />
      </main>

      <footer class="copy-wrap">
        <p class="line-one">Explore. Discover.</p>
        <p class="line-two">Connect with cultural stories around you.</p>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.splash {
  padding: 0;
  display: grid;
  place-items: center;
  background: #faf3e9;
  color: #3a352f;
  animation: fade-in 420ms ease-out both;
  cursor: pointer;
}

.splash-inner {
  width: min(100%, 400px);
  min-height: 100dvh;
  padding: max(76px, calc(var(--mq-safe-top) + 56px)) 26px
    max(84px, calc(var(--mq-safe-bottom) + 58px));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
}

.brand-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.brand-logo-clip {
  width: min(86vw, 340px);
  height: clamp(96px, 26vw, 136px);
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.brand-logo {
  width: 100%;
  display: block;
  margin-top: clamp(-210px, -18vw, -150px);
  height: auto;
  object-fit: contain;
}

.tagline {
  margin: -45px 0 0;
  font-size: clamp(0.88rem, 1.7vw, 0.96rem);
  font-weight: 300;
  line-height: 1.22;
  letter-spacing: 0.005em;
  color: #7a736b;
}

.amphora {
  width: min(64vw, 258px);
  height: auto;
  object-fit: contain;
  opacity: 0.74;
  margin-top: 24px;
}

.copy-wrap {
  margin-top: 32px;
}

.line-one,
.line-two {
  margin: 0;
  color: #6c655d;
}

.line-one {
  font-size: clamp(0.82rem, 1.55vw, 0.9rem);
  font-weight: 300;
  letter-spacing: 0.005em;
  line-height: 1.22;
}

.line-two {
  margin-top: 4px;
  font-size: clamp(0.78rem, 1.45vw, 0.86rem);
  font-weight: 300;
  line-height: 1.25;
}

@keyframes fade-in {
  from {
    opacity: 0.28;
  }
  to {
    opacity: 1;
  }
}
</style>
