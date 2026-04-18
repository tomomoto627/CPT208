<script setup>
import {
  ref,
  reactive,
  inject,
  onMounted,
  onActivated,
  onDeactivated,
  onUnmounted,
  nextTick,
  watch,
} from "vue";
import { buildApiUrl, streamFetch } from "@/utils/api";

const { state, scanArtifact } = inject("museum");
const selectedId = ref("porcelain-vase");
const showResult = ref(false);
const modelViewerError = ref("");
const modelViewerLoading = ref(false);

const showChat = ref(false);
const chatSessionId = ref("");
const chatInput = ref("");
const chatSending = ref(false);
const chatError = ref("");
const chatMessages = ref([]);
const chatBodyRef = ref(null);
let chatScrollRaf = 0;

const videoRef = ref(null);
const stream = ref(null);
const cameraError = ref("");
const cameraStarting = ref(false);
const mirrorVideo = ref(false);

const storySpeaking = ref(false);
const storySpeechError = ref("");
const storyVoices = ref([]);
const selectedVoiceURI = ref(localStorage.getItem("mq_story_voice_uri") || "");
let storyUtter = null;

/** 递增以作废进行中的 getUserMedia（快速切走 Tab 时避免把旧流绑回 video） */
let cameraEpoch = 0;

function stopCamera() {
  cameraEpoch++;
  mirrorVideo.value = false;
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop());
    stream.value = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
}

function cameraErrorMessage(err) {
  if (!err) return "Unable to open the camera.";
  const name = err.name || "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera access was denied. Please allow it in your browser settings.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera device was detected.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera is busy or unavailable. Close other apps and try again.";
  }
  if (name === "OverconstrainedError") {
    return "This device does not meet the requested camera settings. Trying the default camera instead.";
  }
  if (name === "SecurityError") {
    return "Camera access requires HTTPS or localhost.";
  }
  return err.message || "Unable to open the camera.";
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value =
      "This browser does not support camera access. Try a recent version of Chrome or Safari.";
    return;
  }

  if (!window.isSecureContext) {
    cameraError.value =
      "This page is not running in a secure context. Camera access only works on HTTPS or localhost.";
    return;
  }

  if (stream.value) return;

  const epoch = cameraEpoch;
  cameraStarting.value = true;
  cameraError.value = "";

  const tryConstraints = [
    {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    { video: { facingMode: "user" }, audio: false },
    { video: true, audio: false },
  ];

  let lastErr = null;
  let attemptStream = null;

  for (const constraints of tryConstraints) {
    if (epoch !== cameraEpoch) {
      if (attemptStream) {
        attemptStream.getTracks().forEach((t) => t.stop());
        attemptStream = null;
      }
      cameraStarting.value = false;
      return;
    }
    try {
      if (attemptStream) {
        attemptStream.getTracks().forEach((t) => t.stop());
        attemptStream = null;
      }
      attemptStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (epoch !== cameraEpoch) {
        attemptStream.getTracks().forEach((t) => t.stop());
        attemptStream = null;
        cameraStarting.value = false;
        return;
      }
      const s = attemptStream;
      stream.value = s;
      const track = s.getVideoTracks()[0];
      const facing = track?.getSettings?.().facingMode;
      mirrorVideo.value = facing === "user";

      await nextTick();
      const el = videoRef.value;
      if (el) {
        el.srcObject = s;
        el.setAttribute("playsinline", "");
        el.setAttribute("webkit-playsinline", "");
        el.muted = true;
        try {
          await el.play();
        } catch {
          /* 部分浏览器需用户手势，扫描按钮可再次触发 play */
        }
      }
      if (epoch !== cameraEpoch) {
        stopCamera();
        cameraStarting.value = false;
        return;
      }
      cameraError.value = "";
      cameraStarting.value = false;
      return;
    } catch (e) {
      lastErr = e;
      if (attemptStream) {
        attemptStream.getTracks().forEach((t) => t.stop());
        attemptStream = null;
      }
    }
  }

  if (epoch !== cameraEpoch) {
    cameraStarting.value = false;
    return;
  }
  cameraError.value = cameraErrorMessage(lastErr);
  cameraStarting.value = false;
}

async function retryCamera() {
  stopCamera();
  await startCamera();
}

onActivated(() => {
  startCamera();
});

onMounted(() => {
  startCamera();
});

onDeactivated(() => {
  stopCamera();
});

onUnmounted(() => {
  stopCamera();
  stopStorySpeech();
  if (chatScrollRaf) {
    cancelAnimationFrame(chatScrollRaf);
    chatScrollRaf = 0;
  }
});

function scheduleChatScrollToBottom() {
  if (chatScrollRaf) return;
  chatScrollRaf = requestAnimationFrame(() => {
    chatScrollRaf = 0;
    const el = chatBodyRef.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  });
}

function loadStoryVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis?.getVoices)
    return;
  const vs = window.speechSynthesis.getVoices() || [];
  storyVoices.value = vs;
  if (!selectedVoiceURI.value && vs.length) {
    const best = pickDefaultEnglishVoice(vs);
    if (best?.voiceURI) selectedVoiceURI.value = best.voiceURI;
  }
}

function pickDefaultEnglishVoice(vs) {
  const preferNaturalEnglish = (v) => {
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase();
    return (
      (lang.startsWith("en-us") || lang.startsWith("en-gb")) &&
      /natural|microsoft|google|samantha|daniel|ava|serena/i.test(name)
    );
  };

  const exact = vs.find(preferNaturalEnglish);
  if (exact) return exact;

  const isEn = (v) => (v.lang || "").toLowerCase().startsWith("en");

  const ens = vs.filter(isEn);
  const pool = ens.length ? ens : vs;

  const score = (v) => {
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase();
    let s = 0;
    if (lang.startsWith("en-us")) s += 45;
    if (lang.startsWith("en-gb")) s += 35;
    if (lang.startsWith("en")) s += 15;
    if (/natural/.test(name)) s += 40;
    if (/microsoft|edge|natural/.test(name)) s += 30;
    if (/google/.test(name)) s += 20;
    if (/siri|samantha|daniel|ava|serena|alex/.test(name)) s += 10;
    return s;
  };

  return [...pool].sort((a, b) => score(b) - score(a))[0] || null;
}

watch(showResult, async (open) => {
  if (!open) {
    modelViewerError.value = "";
    modelViewerLoading.value = false;
    stopStorySpeech();
    if (videoRef.value && stream.value) {
      try {
        await videoRef.value.play();
      } catch {
        /* ignore */
      }
    }
  } else {
    loadStoryVoices();
    const art = state.artifacts.find((a) => a.id === selectedId.value);
    if (art?.modelGlb) {
      modelViewerError.value = "";
      modelViewerLoading.value = true;
    }
  }
});

function onModelLoaded() {
  modelViewerLoading.value = false;
  modelViewerError.value = "";
}

function onModelError() {
  modelViewerLoading.value = false;
  modelViewerError.value =
    "Failed to load the 3D model. If this is deployed online, make sure the matching .glb file exists in public/models and rebuild the app.";
}

async function runScan() {
  const v = videoRef.value;
  if (v && stream.value) {
    v.play().catch(() => {});
  }
  await import("@google/model-viewer");
  scanArtifact(selectedId.value);
  showResult.value = true;
}

function closeResult() {
  showResult.value = false;
}

const currentArt = () => state.artifacts.find((a) => a.id === selectedId.value);

function openChat() {
  chatError.value = "";
  showChat.value = true;
  if (!chatMessages.value.length && currentArt()) {
    chatMessages.value = [
      {
        role: "assistant",
        content: `You can ask me about ${currentArt().name}'s function, history, craftsmanship, or cultural meaning.`,
      },
    ];
  }
  nextTick(() => scheduleChatScrollToBottom());
}

function closeChat() {
  showChat.value = false;
}

async function sendChat() {
  const q = chatInput.value.trim();
  if (!q || chatSending.value) return;

  const art = currentArt();
  chatError.value = "";
  chatSending.value = true;
  chatMessages.value = chatMessages.value.concat({ role: "user", content: q });
  chatInput.value = "";
  scheduleChatScrollToBottom();

  // 插入占位的 assistant 消息，流式接收时逐字符追加
  const aiMsg = reactive({ role: "assistant", content: "", streaming: true });
  chatMessages.value.push(aiMsg);
  scheduleChatScrollToBottom();

  try {
    await streamFetch(
      "/api/agent/chat",
      {
        method: "POST",
        body: {
          stream: true,
          mode: "sse",
          sessionId: chatSessionId.value || undefined,
          artifact: art
            ? {
                id: art.id,
                name: art.name,
                hallName: art.hallName,
                story: art.story,
              }
            : undefined,
          question: q,
        },
        mode: "sse", // 若后端是 SSE，则改为 'sse'
      },
      (ch) => {
        aiMsg.content += ch;
        scheduleChatScrollToBottom();
      },
    );
  } catch (e) {
    chatError.value = e?.message || "Failed to send the message.";
    aiMsg.content +=
      "\n\n(Error) " + (e?.message || "Failed to send the message.");
    scheduleChatScrollToBottom();
  } finally {
    aiMsg.streaming = false;
    chatSending.value = false;
    scheduleChatScrollToBottom();
  }
}

function stopStorySpeech() {
  storySpeechError.value = "";
  storySpeaking.value = false;
  storyUtter = null;
  try {
    window.speechSynthesis?.cancel?.();
  } catch {
    /* ignore */
  }
}

function onVoiceChange() {
  localStorage.setItem("mq_story_voice_uri", selectedVoiceURI.value || "");
  if (storySpeaking.value) {
    stopStorySpeech();
    toggleStorySpeech();
  }
}

function toggleStorySpeech() {
  storySpeechError.value = "";
  const art = currentArt();
  const text = art?.story?.trim?.() || "";
  if (!text) return;

  if (storySpeaking.value) {
    stopStorySpeech();
    return;
  }

  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    !window.SpeechSynthesisUtterance
  ) {
    storySpeechError.value = "This browser does not support speech playback.";
    return;
  }

  stopStorySpeech();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  const v = storyVoices.value.find(
    (x) => x.voiceURI === selectedVoiceURI.value,
  );
  if (v) u.voice = v;
  u.rate = 1;
  u.pitch = 1;
  u.volume = 1;
  u.onend = () => {
    storySpeaking.value = false;
    storyUtter = null;
  };
  u.onerror = () => {
    storySpeaking.value = false;
    storyUtter = null;
    storySpeechError.value =
      "Speech playback failed. It may be blocked by the system or browser.";
  };
  storyUtter = u;
  storySpeaking.value = true;
  try {
    window.speechSynthesis.speak(u);
  } catch {
    storySpeaking.value = false;
    storyUtter = null;
    storySpeechError.value = "Speech playback failed.";
  }
}
</script>

<template>
  <div class="page">
    <div class="camera" aria-label="Camera preview">
      <video
        ref="videoRef"
        class="video"
        :class="{ mirror: mirrorVideo }"
        autoplay
        muted
        playsinline
        webkit-playsinline
      />

      <div class="camera-overlay">
        <div class="camera-frame">
          <span class="corner tl" />
          <span class="corner tr" />
          <span class="corner bl" />
          <span class="corner br" />
        </div>
      </div>

      <div v-if="cameraStarting && !stream" class="camera-status">
        Starting camera...
      </div>
      <div v-else-if="cameraError" class="camera-status error">
        <p>{{ cameraError }}</p>
        <button type="button" class="retry-btn" @click="retryCamera">
          Retry
        </button>
      </div>
      <p v-else class="camera-hint">
        Place the QR code or artifact inside the frame and tap Scan.
      </p>
    </div>

    <div class="scan-controls">
      <label class="field">
        <select v-model="selectedId" class="select">
          <option v-for="a in state.artifacts" :key="a.id" :value="a.id">
            {{ a.name }} · {{ a.hallName }}
          </option>
        </select>
      </label>

      <button type="button" class="scan-btn" @click="runScan">Scan</button>
    </div>

    <div
      v-if="showResult && currentArt()"
      class="sheet"
      @click.self="closeResult"
    >
      <div
        class="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-title"
      >
        <div class="sheet-head">
          <h2 id="scan-title" class="sheet-title">{{ currentArt().name }}</h2>
          <div class="head-tools">
            <label class="voice">
              <span class="sr-only">Narration voice</span>
              <select
                v-model="selectedVoiceURI"
                class="voice-select"
                :disabled="!storyVoices.length"
                @change="onVoiceChange"
                @mousedown="loadStoryVoices"
                @touchstart.passive="loadStoryVoices"
              >
                <option value="" disabled>
                  {{ storyVoices.length ? "Choose voice" : "No voices available" }}
                </option>
                <option
                  v-for="v in storyVoices"
                  :key="v.voiceURI"
                  :value="v.voiceURI"
                >
                  {{ v.name }} ({{ v.lang }})
                </option>
              </select>
            </label>

            <button
              type="button"
              class="story-btn"
              :class="{ on: storySpeaking }"
              :aria-pressed="storySpeaking ? 'true' : 'false'"
              @click="toggleStorySpeech"
            >
              {{ storySpeaking ? "Stop" : "Play Story" }}
            </button>
          </div>
        </div>
        <p class="sheet-sub">
          {{ currentArt().hallName }} · +{{ currentArt().points }} pts on first scan
        </p>

        <div v-if="currentArt().modelGlb" class="model-block">
          <p class="model-hint">
            Drag with one finger to rotate. Pinch with two fingers to zoom. Explore from the top and bottom.
          </p>
          <div class="model-viewer-wrap">
            <div
              v-if="modelViewerLoading && !modelViewerError"
              class="model-loading"
            >
              Loading model...
            </div>
            <p v-if="modelViewerError" class="model-error">
              {{ modelViewerError }}
            </p>
            <model-viewer
              :key="currentArt().id + '-' + showResult"
              class="artifact-model"
              :class="{ hidden: modelViewerError }"
              :src="currentArt().modelGlb"
              :alt="currentArt().name"
              camera-controls
              touch-action="none"
              interaction-prompt="none"
              exposure="1"
              shadow-intensity="1"
              min-camera-orbit="auto 0deg auto"
              max-camera-orbit="auto 180deg auto"
              @load="onModelLoaded"
              @error="onModelError"
            />
          </div>
        </div>

        <p class="sheet-story">{{ currentArt().story }}</p>
        <p v-if="storySpeechError" class="story-error" role="status">
          {{ storySpeechError }}
        </p>
        <div class="sheet-actions">
          <button type="button" class="btn-secondary" @click="closeResult">
            Close
          </button>
          <button type="button" class="btn-secondary" @click="openChat">
            Ask AI
          </button>
        </div>
      </div>
    </div>

    <div v-if="showChat" class="chat-sheet" @click.self="closeChat">
      <div
        class="chat-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        <div class="chat-head">
          <div class="chat-title-wrap">
            <h3 id="chat-title" class="chat-title">AI Guide</h3>
            <p class="chat-sub">Current Artifact: {{ currentArt()?.name }}</p>
          </div>
          <button type="button" class="chat-close" @click="closeChat">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span class="sr-only">Back</span>
          </button>
        </div>

        <div ref="chatBodyRef" class="chat-body" aria-label="Conversation">
          <div
            v-for="(m, idx) in chatMessages"
            :key="idx"
            class="bubble"
            :class="m.role === 'user' ? 'me' : 'ai'"
          >
            {{ m.content }}
          </div>
          <p v-if="chatError" class="chat-error">{{ chatError }}</p>
        </div>

        <form class="chat-foot" @submit.prevent="sendChat">
          <input
            v-model="chatInput"
            class="chat-input"
            type="text"
            placeholder="Ask something, for example: What was it used for?"
            :disabled="chatSending"
          />
          <button
            type="submit"
            class="chat-send"
            :disabled="chatSending || !chatInput.trim()"
          >
            {{ chatSending ? "Sending..." : "Send" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  min-height: 0;
  padding-bottom: 0;
  box-sizing: border-box;
}

.camera {
  position: relative;
  flex: 0 0 min(33vh, 360px);
  width: calc(100% - 44px);
  max-width: 420px;
  min-height: 260px;
  margin: 42px auto 0;
  border-radius: var(--mq-radius);
  background: #faf3e9;
  border: 1px solid var(--mq-border);
  overflow: hidden;
}

.video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(1);
}

/* 前置摄像头镜像，更符合自拍习惯；后置保持正常 */
.video.mirror {
  transform: scaleX(-1);
}

.camera-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    ellipse at center,
    transparent 30%,
    rgba(250, 243, 233, 0.45) 100%
  );
}

.camera-frame {
  position: relative;
  width: 72%;
  max-width: 260px;
  aspect-ratio: 3 / 4;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: var(--mq-accent);
  border-style: solid;
}
.corner.tl {
  top: -1px;
  left: -1px;
  border-width: 3px 0 0 3px;
  border-radius: 8px 0 0 0;
}
.corner.tr {
  top: -1px;
  right: -1px;
  border-width: 3px 3px 0 0;
  border-radius: 0 8px 0 0;
}
.corner.bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 3px 3px;
  border-radius: 0 0 0 8px;
}
.corner.br {
  bottom: -1px;
  right: -1px;
  border-width: 0 3px 3px 0;
  border-radius: 0 0 8px 0;
}

.camera-hint {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  text-align: center;
  font-size: 0.75rem;
  color: rgba(232, 235, 233, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

.camera-status {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: rgba(250, 243, 233, 0.92);
  font-size: 0.88rem;
  color: var(--mq-text-muted);
  text-align: center;
  z-index: 20;
}

.camera-status.error {
  color: var(--mq-text);
}

.retry-btn {
  min-height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  background: var(--mq-accent-soft);
  color: var(--mq-accent);
  font-weight: 600;
  border: 1px solid rgba(201, 162, 39, 0.4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scan-controls {
  position: fixed;
  width: min(68%, 360px);
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 46px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 52;
}

.select {
  min-height: var(--mq-tap-min);
  padding: 0 14px;
  border-radius: 10px;
  background: rgba(250, 243, 233, 0.45);
  border: 1px solid rgba(205, 188, 163, 0.6);
  color: #3d352b;
  appearance: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%239aa8a2' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}

.scan-btn {
  min-height: 52px;
  border-radius: 12px;
  background: linear-gradient(180deg, #d4b03a, var(--mq-accent));
  color: #1a1508;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  box-shadow: 0 4px 20px rgba(201, 162, 39, 0.35);
}

.sheet {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(250, 243, 233, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: max(16px, var(--mq-safe-bottom));
}

.sheet-panel {
  width: 100%;
  max-width: 440px;
  max-height: 88vh;
  overflow: auto;
  border-radius: 18px 18px 14px 14px;
  background: var(--mq-bg-elevated);
  border: 1px solid var(--mq-border);
  padding: 20px 18px 18px;
  -webkit-overflow-scrolling: touch;
}

.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.head-tools {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.voice {
  display: inline-flex;
  align-items: center;
}

.voice-select {
  min-height: 36px;
  max-width: 150px;
  padding: 0 34px 0 10px;
  border-radius: 999px;
  background: var(--mq-surface);
  border: 1px solid var(--mq-border);
  color: var(--mq-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%239aa8a2' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.voice-select:disabled {
  opacity: 0.55;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sheet-title {
  font-size: 1.25rem;
  margin-bottom: 0;
}

.story-btn {
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--mq-surface);
  border: 1px solid var(--mq-border);
  color: var(--mq-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.story-btn.on {
  background: rgba(201, 162, 39, 0.18);
  border-color: rgba(201, 162, 39, 0.35);
  color: var(--mq-accent);
}

.sheet-sub {
  font-size: 0.85rem;
  color: var(--mq-accent);
  margin-bottom: 12px;
}

.model-block {
  margin-bottom: 14px;
}

.model-hint {
  font-size: 0.72rem;
  color: var(--mq-text-muted);
  margin-bottom: 8px;
  line-height: 1.45;
}

.model-viewer-wrap {
  position: relative;
  width: 100%;
  min-height: 220px;
  height: min(42vh, 300px);
  border-radius: 12px;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #f5ece0 0%, #faf3e9 70%);
}

.model-loading,
.model-error {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--mq-text-muted);
  pointer-events: none;
}

.model-error {
  color: #e8a598;
  line-height: 1.5;
  z-index: 2;
}

.artifact-model {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 220px;
  border-radius: 12px;
  background: transparent;
  outline: none;
  touch-action: none;
}

.artifact-model.hidden {
  opacity: 0;
  pointer-events: none;
}

.sheet-story {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--mq-text-muted);
  margin-bottom: 20px;
}

.story-error {
  margin-top: -10px;
  margin-bottom: 16px;
  font-size: 0.8rem;
  color: #e8a598;
  line-height: 1.45;
}

.sheet-actions {
  display: flex;
  gap: 10px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  min-height: var(--mq-tap-min);
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-secondary {
  background: #b98a3d;
  color: #fffdf8;
  border: 1px solid #b98a3d;
}

.btn-primary {
  background: var(--mq-accent-soft);
  color: var(--mq-accent);
  border: 1px solid rgba(201, 162, 39, 0.4);
}

.chat-sheet {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: max(16px, var(--mq-safe-bottom));
}

.chat-panel {
  width: 100%;
  max-width: 520px;
  height: min(78vh, 560px);
  border-radius: 18px 18px 14px 14px;
  background: var(--mq-bg-elevated);
  border: 1px solid var(--mq-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--mq-border);
}

.chat-title {
  margin: 0;
  font-size: 1rem;
}

.chat-sub {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--mq-text-muted);
}

.chat-close {
  width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: #4f4334;
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chat-close svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chat-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-overflow-scrolling: touch;
}

.bubble {
  max-width: 88%;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid var(--mq-border);
}

.bubble.ai {
  align-self: flex-start;
  background: var(--mq-surface);
  color: var(--mq-text);
}

.bubble.me {
  align-self: flex-end;
  background: rgba(201, 162, 39, 0.16);
  color: var(--mq-text);
  border-color: rgba(201, 162, 39, 0.25);
}

.chat-error {
  margin: 0;
  font-size: 0.75rem;
  color: #e8a598;
}

.chat-foot {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid var(--mq-border);
  background: rgba(250, 243, 233, 0.94);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.chat-input {
  flex: 1;
  min-height: 44px;
  border-radius: 12px;
  padding: 0 12px;
  background: rgba(255, 253, 248, 0.88);
  border: 1px solid rgba(185, 138, 61, 0.28);
  color: #4a3f33;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.chat-input::placeholder {
  color: #9a8567;
}

.chat-input:focus {
  outline: none;
  border-color: #ffffff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.45);
}

.chat-send {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  background: #9f712c;
  color: #fffdf8;
  font-weight: 800;
  border: 1px solid #9f712c;
}

.chat-send:disabled {
  opacity: 0.55;
}
</style>
