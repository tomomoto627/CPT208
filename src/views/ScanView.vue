<script setup>
import {
  computed,
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
import modelRotateBadge from "@/assets/model-rotate-badge.png";

const { state, scanArtifact } = inject("museum");
const selectedId = ref("dragon-motif-bowl");
const showResult = ref(false);
const modelViewerError = ref("");
const modelViewerLoading = ref(false);

const showChat = ref(false);
const chatFullscreen = ref(false);
const chatArtifactId = ref("");
const chatSessionId = ref("");
const chatInput = ref("");
const chatSending = ref(false);
const chatError = ref("");
const chatMessages = ref([]);
const chatBodyRef = ref(null);
let chatScrollRaf = 0;

const artifactSuggestedQuestions = [
  {
    key: "function",
    text: "What was it used for?",
    prompt: "What was this artifact used for in daily life or rituals?",
  },
  {
    key: "history",
    text: "When is it from?",
    prompt: "Which historical period does this artifact belong to, and why is that period important?",
  },
  {
    key: "craft",
    text: "How was it made?",
    prompt: "How was this artifact made? Please explain the materials and craftsmanship in simple terms.",
  },
  {
    key: "meaning",
    text: "What does it symbolize?",
    prompt: "What cultural meaning or symbolism does this artifact carry?",
  },
];

const shouldShowChatSuggestions = computed(
  () => !chatMessages.value.some((m) => m.role === "user"),
);
const showArtifactPicker = ref(false);
const selectedArtifact = computed(
  () => state.artifacts.find((a) => a.id === selectedId.value) || state.artifacts[0] || null,
);

const videoRef = ref(null);
const stream = ref(null);
const cameraError = ref("");
const cameraStarting = ref(false);
const mirrorVideo = ref(false);

const storySpeaking = ref(false);
const storySpeechError = ref("");
const storyVoices = ref([]);
const selectedVoiceURI = ref(localStorage.getItem("mq_story_voice_uri") || "");
const showVoicePicker = ref(false);
const voiceSearch = ref("");
let storyUtter = null;
let voiceChangeHandler = null;

/** Incrementing token used to ignore stale getUserMedia calls during fast tab switches. */
let cameraEpoch = 0;

const VOICE_LANGUAGE_PRESETS = [
  { code: "en-US", label: "English (US)", country: "US", recommended: true },
  { code: "en-GB", label: "English (UK)", country: "GB", recommended: true },
];

function countryToFlagEmoji(countryCode) {
  const code = String(countryCode || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  const base = 0x1f1e6;
  const a = "A".charCodeAt(0);
  return String.fromCodePoint(
    base + (code.charCodeAt(0) - a),
    base + (code.charCodeAt(1) - a),
  );
}

function countryToFlagIcon(countryCode) {
  const code = String(countryCode || "").trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return "";
  return `https://flagcdn.com/w40/${code}.png`;
}

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
          /* ignore autoplay block */
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
  bindVoiceChangeListener();
  loadStoryVoices();
});

onDeactivated(() => {
  stopCamera();
});

onUnmounted(() => {
  stopCamera();
  stopStorySpeech();
  unbindVoiceChangeListener();
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
    return [];
  const vs = window.speechSynthesis.getVoices() || [];
  storyVoices.value = vs;
  if (!vs.length) return vs;

  const selectedExists = selectedVoiceURI.value
    ? vs.some((v) => v.voiceURI === selectedVoiceURI.value)
    : false;

  if (!selectedExists) {
    const best = pickDefaultEnglishVoice(vs);
    if (best?.voiceURI) selectedVoiceURI.value = best.voiceURI;
  }

  return vs;
}

function bindVoiceChangeListener() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (voiceChangeHandler) return;
  voiceChangeHandler = () => {
    loadStoryVoices();
  };
  window.speechSynthesis.addEventListener("voiceschanged", voiceChangeHandler);
}

function unbindVoiceChangeListener() {
  if (typeof window === "undefined" || !window.speechSynthesis || !voiceChangeHandler)
    return;
  window.speechSynthesis.removeEventListener("voiceschanged", voiceChangeHandler);
  voiceChangeHandler = null;
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

function findBestVoiceForLang(langCode) {
  const target = String(langCode || "").toLowerCase();
  const voices = storyVoices.value || [];
  if (!target || !voices.length) return null;

  const exact = voices.find((v) => String(v.lang || "").toLowerCase() === target);
  if (exact) return exact;

  const startsWith = voices.find((v) => String(v.lang || "").toLowerCase().startsWith(target));
  if (startsWith) return startsWith;

  const base = target.split("-")[0];
  if (!base) return null;
  return voices.find((v) => String(v.lang || "").toLowerCase().startsWith(base)) || null;
}

const availableVoiceOptions = computed(() =>
  VOICE_LANGUAGE_PRESETS.map((preset) => {
    const voice = findBestVoiceForLang(preset.code);
    return {
      ...preset,
      flag: countryToFlagEmoji(preset.country),
      flagIcon: countryToFlagIcon(preset.country),
      voice,
    };
  }).filter((item) => !!item.voice),
);

const selectedVoiceOption = computed(() => {
  const uri = selectedVoiceURI.value;
  return availableVoiceOptions.value.find((item) => item.voice?.voiceURI === uri) || null;
});

const filteredVoiceOptions = computed(() => {
  const q = voiceSearch.value.trim().toLowerCase();
  if (!q) return availableVoiceOptions.value;
  return availableVoiceOptions.value.filter((item) => {
    const voiceName = String(item.voice?.name || "").toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      String(item.code || "").toLowerCase().includes(q) ||
      voiceName.includes(q)
    );
  });
});

const recommendedVoiceOptions = computed(() =>
  filteredVoiceOptions.value.filter((item) => item.recommended),
);

function toggleVoicePicker() {
  if (!showVoicePicker.value) {
    loadStoryVoices();
  }
  showVoicePicker.value = !showVoicePicker.value;
}

function selectVoice(uri) {
  selectedVoiceURI.value = uri || "";
  onVoiceChange();
  showVoicePicker.value = false;
}

watch(showResult, async (open) => {
  if (!open) {
    modelViewerError.value = "";
    modelViewerLoading.value = false;
    showVoicePicker.value = false;
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

watch(selectedId, (nextId, prevId) => {
  if (!nextId || nextId === prevId) return;
  showArtifactPicker.value = false;
  showVoicePicker.value = false;
  resetChatForArtifact();
  if (showChat.value) {
    showChat.value = false;
    chatFullscreen.value = false;
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
  showArtifactPicker.value = false;
  const v = videoRef.value;
  if (v && stream.value) {
    v.play().catch(() => {});
  }
  await import("@google/model-viewer");
  scanArtifact(selectedId.value);
  resetChatForArtifact();
  showResult.value = true;
}

function toggleArtifactPicker() {
  showArtifactPicker.value = !showArtifactPicker.value;
}

function chooseArtifact(id) {
  selectedId.value = id;
  showArtifactPicker.value = false;
}

function closeResult() {
  showResult.value = false;
}

const currentArt = () => state.artifacts.find((a) => a.id === selectedId.value);

function resetChatForArtifact() {
  const art = currentArt();
  const nextArtifactId = art?.id || "";
  if (!nextArtifactId) return;
  if (chatArtifactId.value === nextArtifactId) return;

  chatArtifactId.value = nextArtifactId;
  chatSessionId.value = "";
  chatInput.value = "";
  chatError.value = "";
  chatMessages.value = [
    {
      role: "assistant",
      content:
        "Choose a quick suggestion below, or ask about function, history, craftsmanship, or meaning.",
    },
  ];
}

function openChat() {
  resetChatForArtifact();
  chatError.value = "";
  chatFullscreen.value = false;
  showChat.value = true;
  if (!chatMessages.value.length && currentArt()) {
    chatMessages.value = [
      {
        role: "assistant",
        content: "Choose a quick suggestion below, or ask about function, history, craftsmanship, or meaning.",
      },
    ];
  }
  nextTick(() => scheduleChatScrollToBottom());
}

function closeChat() {
  showChat.value = false;
  chatFullscreen.value = false;
}

function toggleChatFullscreen() {
  chatFullscreen.value = !chatFullscreen.value;
}

async function sendChat(forcedQuestion = "") {
  const safeForcedQuestion =
    typeof forcedQuestion === "string" ? forcedQuestion : "";
  const q = String(safeForcedQuestion || chatInput.value.trim()).trim();
  if (!q || chatSending.value) return;

  const art = currentArt();
  chatError.value = "";
  chatSending.value = true;
  chatMessages.value = chatMessages.value.concat({ role: "user", content: q });
  chatInput.value = "";
  scheduleChatScrollToBottom();

  // Insert a placeholder assistant message and progressively append streamed chunks.
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
        mode: "sse",
      },
      (ch) => {
        aiMsg.content += ch;
        scheduleChatScrollToBottom();
      },
      (eventName, payload) => {
        if (eventName !== "session") return;
        const sid =
          typeof payload === "string" ? payload : payload?.sessionId || "";
        if (sid) chatSessionId.value = sid;
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

function sendQuickArtifactIntent(intent) {
  if (!intent || chatSending.value) return;
  sendChat(intent.prompt);
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
  const loadedVoices = loadStoryVoices();
  const u = new SpeechSynthesisUtterance(text);
  const v =
    (loadedVoices || []).find((x) => x.voiceURI === selectedVoiceURI.value) ||
    pickDefaultEnglishVoice(loadedVoices || []);
  if (v) {
    u.voice = v;
    u.lang = v.lang || "en-US";
    if (selectedVoiceURI.value !== v.voiceURI) {
      selectedVoiceURI.value = v.voiceURI;
      onVoiceChange();
    }
  } else {
    u.lang = "en-US";
  }
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
    </div>

    <p class="scan-tip">
      <span class="scan-tip-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 10v5M12 7.2h.01" />
        </svg>
      </span>
      <span>Place the QR code or artifact in the frame, then tap Scan.</span>
    </p>
    <div class="scan-controls">
      <div class="artifact-picker">
        <button
          type="button"
          class="artifact-picker-trigger"
          :aria-expanded="showArtifactPicker ? 'true' : 'false'"
          @click="toggleArtifactPicker"
        >
          <span class="artifact-picker-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5h18M5.2 9.5v8.8M9.4 9.5v8.8M14.6 9.5v8.8M18.8 9.5v8.8M2.5 19h19M4 6.9 12 4l8 2.9" />
            </svg>
          </span>
          <span class="artifact-picker-copy">
            <span class="artifact-picker-kicker">Selected artifact</span>
            <span
              class="artifact-picker-line"
              :title="selectedArtifact ? `${selectedArtifact.name} - ${selectedArtifact.hallName}` : 'Select artifact'"
            >
              {{ selectedArtifact?.name || "Select artifact" }}
              <template v-if="selectedArtifact?.hallName"> - {{ selectedArtifact.hallName }}</template>
            </span>
          </span>
          <span class="artifact-picker-arrow" :class="{ open: showArtifactPicker }" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>

        <div class="artifact-menu-slot">
          <button
            v-if="showArtifactPicker"
            type="button"
            class="artifact-menu-backdrop"
            aria-label="Close artifact list"
            @click="showArtifactPicker = false"
          />
          <div v-if="showArtifactPicker" class="artifact-menu" role="listbox" aria-label="Artifact list">
            <button
              v-for="a in state.artifacts"
              :key="a.id"
              type="button"
              class="artifact-option"
              :class="{ selected: selectedId === a.id }"
              @click="chooseArtifact(a.id)"
            >
              <span class="artifact-option-line" :title="`${a.name} - ${a.hallName}`">
                {{ a.name }} - {{ a.hallName }}
              </span>
              <span v-if="selectedId === a.id" class="artifact-option-check" aria-hidden="true">&#10003;</span>
            </button>
          </div>
        </div>
      </div>

      <button type="button" class="scan-btn" @click="runScan">
        <span class="scan-btn-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3M7.5 12h9" />
          </svg>
        </span>
        <span>Scan</span>
      </button>
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
            <div class="voice">
              <button
                type="button"
                class="voice-select"
                :disabled="!availableVoiceOptions.length"
                :aria-expanded="showVoicePicker ? 'true' : 'false'"
                @click="toggleVoicePicker"
              >
                <span class="voice-select-flag" aria-hidden="true">
                  <img
                    v-if="selectedVoiceOption?.flagIcon"
                    :src="selectedVoiceOption.flagIcon"
                    alt=""
                  />
                  <span v-else>{{ selectedVoiceOption?.flag || "\uD83C\uDF10" }}</span>
                </span>
                <span class="voice-select-label">
                  {{ selectedVoiceOption?.label || "Choose language" }}
                </span>
                <span class="voice-select-caret" :class="{ open: showVoicePicker }" aria-hidden="true">&#9662;</span>
              </button>

              <button
                v-if="showVoicePicker"
                type="button"
                class="voice-menu-backdrop"
                aria-label="Close language list"
                @click="showVoicePicker = false"
              />
              <div v-if="showVoicePicker" class="voice-menu">
                <div class="voice-search">
                  <span class="voice-search-icon" aria-hidden="true">&#128269;</span>
                  <input
                    v-model="voiceSearch"
                    type="text"
                    class="voice-search-input"
                    placeholder="Search language"
                  />
                </div>

                <p class="voice-section-title">Recommended</p>
                <div class="voice-options">
                  <button
                    v-for="opt in recommendedVoiceOptions"
                    :key="opt.code"
                    type="button"
                    class="voice-option"
                    :class="{ selected: selectedVoiceURI === opt.voice.voiceURI }"
                    @click="selectVoice(opt.voice.voiceURI)"
                  >
                    <span class="voice-option-flag" aria-hidden="true">
                      <img v-if="opt.flagIcon" :src="opt.flagIcon" alt="" />
                      <span v-else>{{ opt.flag }}</span>
                    </span>
                    <span class="voice-option-label">{{ opt.label }}</span>
                    <span v-if="selectedVoiceURI === opt.voice.voiceURI" class="voice-option-check" aria-hidden="true">&#10003;</span>
                  </button>
                  <p v-if="!recommendedVoiceOptions.length" class="voice-empty">
                    No matched voices
                  </p>
                </div>
              </div>
            </div>

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
        </div>        <p class="sheet-sub">
          <span class="sheet-sub-hall">
            <span class="sheet-sub-hall-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 8h16M6 8v9M10 8v9M14 8v9M18 8v9M3 19h18M2 21h20M12 3l9 4H3l9-4Z" />
              </svg>
            </span>
            <span>{{ currentArt().hallName }}</span>
          </span>
          <span class="sheet-sub-dot" aria-hidden="true">&bull;</span>
          <span class="sheet-sub-points">
            <span aria-hidden="true">&#11088;</span>
            <span>+{{ currentArt().points }} pts on first scan</span>
          </span>
        </p>

        <div v-if="currentArt().modelGlb" class="model-block">
          <p class="model-hint">
            Drag with one finger to rotate. Pinch with two fingers to zoom. Explore from the top and bottom.
          </p>
          <div class="model-viewer-wrap">
            <span class="model-badge" aria-hidden="true">
              <img :src="modelRotateBadge" alt="" />
            </span>
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
          <button type="button" class="btn-back" @click="closeResult">
            <span class="action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m15.5 6.5-6 5.5 6 5.5M9.8 12h8.7" />
              </svg>
            </span>
            <span>Back</span>
          </button>
          <button type="button" class="btn-guide" @click="openChat">
            <span class="action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 7.5a2.5 2.5 0 0 1 2.5-2.5h7a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 1 14.5 15H10l-3.5 3v-3H7.5A2.5 2.5 0 0 1 5 12.5v-5Z" />
                <path d="M10.2 8.8h4.6M10.2 11.4h3.2" />
                <path d="M18.4 4.8v3.2M16.8 6.4h3.2" />
              </svg>
            </span>
            <span>Ask the Guide</span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showChat"
      class="chat-sheet"
      :class="{ fullscreen: chatFullscreen }"
      @click.self="closeChat"
    >
      <div
        class="chat-panel"
        :class="{ fullscreen: chatFullscreen }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        <div class="chat-head">
          <div class="chat-title-wrap">
            <span class="chat-brand" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5h18M5.2 9.5v8.8M9.4 9.5v8.8M14.6 9.5v8.8M18.8 9.5v8.8M2.5 19h19M4 6.9 12 4l8 2.9" />
                <path d="m12 11.2 4.8-2.5-2.6 4.9-4.8 2.5 2.6-4.9Z" />
              </svg>
            </span>
            <h3 id="chat-title" class="chat-title">Artifact Guide</h3>
            <p class="chat-sub">Context-aware museum object guidance</p>
            <p class="chat-artifact-tag">Current artifact: {{ currentArt()?.name }}</p>
          </div>
          <div class="chat-head-actions">
            <button
              type="button"
              class="chat-expand"
              @click="toggleChatFullscreen"
            >
              {{ chatFullscreen ? "Compact" : "Full view" }}
            </button>
            <button type="button" class="chat-close" @click="closeChat">
              Close
            </button>
          </div>
        </div>

        <div
          ref="chatBodyRef"
          class="chat-body"
          :class="{ empty: shouldShowChatSuggestions }"
          aria-label="Conversation"
        >
          <div
            v-for="(m, idx) in chatMessages"
            :key="idx"
            class="message-row"
            :class="m.role === 'user' ? 'me' : 'ai'"
          >
            <span
              v-if="m.role !== 'user'"
              class="ai-avatar"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5h18M5.2 9.5v8.8M9.4 9.5v8.8M14.6 9.5v8.8M18.8 9.5v8.8M2.5 19h19M4 6.9 12 4l8 2.9" />
                <circle cx="12" cy="12" r="2.1" />
              </svg>
            </span>
            <div class="chat-bubble" :class="m.role === 'user' ? 'me' : 'ai'">
              {{ m.content }}
            </div>
          </div>
          <div
            v-if="shouldShowChatSuggestions"
            class="chat-suggest-row"
            aria-label="Suggested questions"
          >
            <button
              v-for="intent in artifactSuggestedQuestions"
              :key="intent.key"
              type="button"
              class="chat-suggest-chip"
              @click="sendQuickArtifactIntent(intent)"
            >
              {{ intent.text }}
            </button>
          </div>
          <p v-if="shouldShowChatSuggestions" class="chat-empty-hint">
            Choose a suggestion to start exploring this artifact.
          </p>
          <p v-if="chatError" class="chat-error">{{ chatError }}</p>
        </div>

        <form class="chat-foot" @submit.prevent="sendChat">
          <input
            v-model="chatInput"
            class="chat-input"
            type="text"
            placeholder="Ask about this artifact..."
            :disabled="chatSending"
          />
          <button
            type="submit"
            class="chat-send"
            :disabled="chatSending || !chatInput.trim()"
            :aria-label="chatSending ? 'Sending' : 'Send message'"
          >
            <svg
              v-if="!chatSending"
              class="chat-send-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M3.4 11.2L19.6 3.3C20.3 3 21.1 3.6 20.9 4.4L18.1 19.7C17.9 20.6 16.8 20.9 16.2 20.2L12.1 15.6L8.1 18.8C7.5 19.3 6.6 18.8 6.7 18L7.2 13.6L3.6 12.6C2.8 12.4 2.7 11.6 3.4 11.2Z"
                fill="currentColor"
              />
            </svg>
            <span v-else class="chat-send-spinner" aria-hidden="true" />
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
  gap: 12px;
  min-height: calc(var(--mq-vh, 1vh) * 100);
  padding: 14px 16px calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 18px);
  box-sizing: border-box;
  background: #f7f4ee;
}

.camera {
  position: relative;
  width: min(100%, 430px);
  margin: 2px auto 0;
  min-height: 228px;
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  background: linear-gradient(160deg, #3f352f 0%, #2c2522 58%, #1f1a18 100%);
  border: 1px solid #d7be86;
  overflow: hidden;
  box-shadow: 0 12px 26px rgba(72, 54, 34, 0.2);
}

.video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(1);
  opacity: 0.94;
}

/* Mirror only when front-facing camera is used. */
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
    rgba(0, 0, 0, 0.06) 0%,
    rgba(0, 0, 0, 0.22) 100%
  );
}

.camera-frame {
  position: relative;
  width: min(84%, 346px);
  aspect-ratio: 16 / 10;
  border: 1px solid rgba(215, 190, 134, 0.36);
  border-radius: 18px;
}

.corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border-color: #c9a13b;
  border-style: solid;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.corner.tl {
  top: -1px;
  left: -1px;
  border-width: 3px 0 0 3px;
  border-radius: 11px 0 0 0;
}

.corner.tr {
  top: -1px;
  right: -1px;
  border-width: 3px 3px 0 0;
  border-radius: 0 11px 0 0;
}

.corner.bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 3px 3px;
  border-radius: 0 0 0 11px;
}

.corner.br {
  bottom: -1px;
  right: -1px;
  border-width: 0 3px 3px 0;
  border-radius: 0 0 11px 0;
}

.scan-tip {
  width: min(100%, 430px);
  margin: 4px auto 2px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 2px;
  color: #6f7d68;
  font-size: 0.86rem;
  line-height: 1.45;
}

.scan-tip-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #8e9b86;
  flex: 0 0 auto;
}

.scan-tip-icon svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.camera-status {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: rgba(35, 29, 24, 0.72);
  font-size: 0.88rem;
  color: #f7f0df;
  text-align: center;
  z-index: 4;
}

.camera-status.error {
  color: #f8f1e6;
}

.retry-btn {
  min-height: 42px;
  padding: 0 20px;
  border-radius: 12px;
  background: #fbf8f2;
  color: #6f7d68;
  font-weight: 700;
  border: 1px solid #d7be86;
}

.scan-controls {
  position: relative;
  width: min(100%, 430px);
  margin: 2px auto 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: clamp(220px, 30vh, 320px);
  z-index: 10;
}

.artifact-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.artifact-picker-trigger {
  width: 100%;
  min-height: 62px;
  border-radius: 16px;
  border: 1px solid #d7be86;
  background: #fbf8f2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  text-align: left;
  color: #5a4636;
  box-shadow: 0 8px 16px rgba(92, 70, 44, 0.11);
  position: relative;
  z-index: 62;
}

.artifact-picker-icon {
  width: 24px;
  height: 24px;
  color: #6f7d68;
  flex: 0 0 24px;
}

.artifact-picker-icon svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.artifact-picker-copy {
  min-width: 0;
  flex: 1;
}

.artifact-picker-kicker {
  display: block;
  margin-bottom: 2px;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #8a7a61;
  text-transform: uppercase;
}

.artifact-picker-line {
  display: block;
  font-size: 0.92rem;
  font-weight: 700;
  color: #5a4636;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artifact-picker-arrow {
  width: 18px;
  height: 18px;
  color: #8f7c59;
  transition: transform 180ms ease;
}

.artifact-picker-arrow.open {
  transform: rotate(180deg);
}

.artifact-picker-arrow svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.artifact-menu-backdrop {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 59;
}

.artifact-menu-slot {
  position: relative;
  min-height: clamp(120px, 18vh, 220px);
}

.artifact-menu {
  position: relative;
  max-height: min(320px, 100%);
  overflow-y: auto;
  background: #fbf8f2;
  border: 1px solid #d7be86;
  border-radius: 14px;
  box-shadow: 0 10px 20px rgba(72, 54, 34, 0.12);
  padding: 6px;
  z-index: 60;
}

.artifact-option {
  width: 100%;
  min-height: 46px;
  border-radius: 10px;
  border: none;
  background: transparent;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  text-align: left;
  color: #5a4636;
}

.artifact-option-line {
  display: block;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artifact-option-check {
  font-size: 0.84rem;
  font-weight: 800;
}

.artifact-option.selected {
  background: #7a8868;
  color: #ffffff;
}

.scan-btn {
  position: relative;
  z-index: 61;
  min-height: 54px;
  border-radius: 14px;
  background: linear-gradient(180deg, #d6b65f 0%, #c29d3a 100%);
  color: #3b3b3b;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid #c7a753;
  box-shadow: 0 8px 18px rgba(184, 141, 35, 0.28);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: auto;
}

.scan-btn-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.scan-btn-icon svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sheet {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(247, 243, 236, 0.62);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: max(16px, var(--mq-safe-bottom));
}

.sheet-panel {
  width: 100%;
  max-width: 440px;
  max-height: calc(var(--mq-vh, 1vh) * 88);
  overflow: auto;
  border-radius: 18px 18px 14px 14px;
  background: #f7f3ec;
  border: 1px solid #d7be86;
  padding: 20px 18px 18px;
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 14px 30px rgba(88, 67, 43, 0.14);
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
  position: relative;
  display: inline-flex;
  align-items: center;
}

.voice-select {
  min-height: 36px;
  max-width: 168px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f7f3ec;
  border: 1px solid rgba(122, 136, 104, 0.48);
  color: #3b3b3b;
  font-size: 0.78rem;
  font-weight: 600;
  display: inline-grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  text-align: left;
}

.voice-select-flag {
  width: 22px;
  height: 16px;
  border-radius: 3px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.92rem;
  line-height: 1;
}

.voice-select-flag img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.voice-select-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-select-caret {
  font-size: 0.8rem;
  color: #6f7d68;
  transition: transform 0.2s ease;
}

.voice-select-caret.open {
  transform: rotate(180deg);
}

.voice-select:disabled {
  opacity: 0.55;
}

.voice-menu {
  position: fixed;
  top: max(88px, calc(env(safe-area-inset-top) + 72px));
  left: 50%;
  transform: translateX(-50%);
  width: min(360px, calc(100vw - 24px));
  max-height: min(70vh, 560px);
  background: #fbf8f2;
  border: 1px solid #d7be86;
  border-radius: 14px;
  box-shadow: 0 12px 24px rgba(72, 54, 34, 0.16);
  padding: 10px;
  display: flex;
  flex-direction: column;
  z-index: 140;
}

.voice-menu-backdrop {
  position: fixed;
  inset: 0;
  background: transparent;
  border: 0;
  z-index: 130;
}

.voice-search {
  min-height: 38px;
  border: 1px solid rgba(122, 136, 104, 0.3);
  border-radius: 12px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: #f7f3ec;
}

.voice-search-icon {
  font-size: 0.9rem;
  opacity: 0.74;
}

.voice-search-input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #3b3b3b;
  font-size: 0.85rem;
}

.voice-search-input::placeholder {
  color: #8a968f;
}

.voice-section-title {
  margin: 10px 2px 6px;
  color: #6f7d68;
  font-size: 0.76rem;
  font-weight: 700;
}

.voice-options {
  border: 1px solid rgba(215, 190, 134, 0.56);
  border-radius: 10px;
  overflow: hidden;
  background: #f7f3ec;
}

.voice-option {
  width: 100%;
  min-height: 40px;
  border: none;
  border-bottom: 1px solid rgba(215, 190, 134, 0.38);
  background: transparent;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  text-align: left;
  color: #3b3b3b;
  font-size: 0.9rem;
}

.voice-option:last-child {
  border-bottom: none;
}

.voice-option.selected {
  background: rgba(122, 136, 104, 0.2);
}

.voice-option-flag {
  min-width: 24px;
  width: 24px;
  height: 16px;
  border-radius: 3px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  text-align: center;
  font-size: 1rem;
  line-height: 1;
  font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
}

.voice-option-flag img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.voice-option-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-option-check {
  color: #5f744f;
  font-weight: 800;
}

.voice-empty {
  margin: 8px 10px;
  color: #8a968f;
  font-size: 0.82rem;
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
  font-size: 1.32rem;
  font-weight: 800;
  color: #2f3e2f;
  margin-bottom: 0;
}

.story-btn {
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f7f3ec;
  border: 1px solid rgba(122, 136, 104, 0.48);
  color: #2f4a32;
  font-size: 0.78rem;
  font-weight: 700;
}

.story-btn.on {
  background: rgba(122, 136, 104, 0.16);
  border-color: rgba(122, 136, 104, 0.35);
  color: #2f4a32;
}

.sheet-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.85rem;
  color: #8c6b2e;
  margin-bottom: 12px;
}

.sheet-sub-hall {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #8c6b2e;
}

.sheet-sub-hall-icon {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9a7222;
}

.sheet-sub-hall-icon svg {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sheet-sub-dot {
  color: rgba(140, 107, 46, 0.7);
  line-height: 1;
}

.sheet-sub-points {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #9a7222;
  font-weight: 700;
}

.model-block {
  margin-bottom: 14px;
}

.model-hint {
  font-size: 0.72rem;
  color: #5f645f;
  margin-bottom: 8px;
  line-height: 1.45;
}

.model-viewer-wrap {
  position: relative;
  width: 100%;
  min-height: 220px;
  height: min(42vh, 300px);
  border-radius: 16px;
  border: 1px solid #e0d3bb;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #f6efe3 0%, #fbf8f2 72%);
}

.model-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}

.model-badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 999px;
  transform: scale(1.42);
  transform-origin: center;
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
  color: #3b3b3b;
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

.btn-back,
.btn-guide {
  flex: 1;
  min-height: var(--mq-tap-min);
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-back {
  justify-content: center;
  padding-left: 0;
  background: #f7f3ec;
  color: #52654d;
  border: 1px solid rgba(82, 101, 77, 0.46);
  box-shadow: 0 2px 6px rgba(68, 58, 46, 0.06);
}

.btn-guide {
  background: #5f6f53;
  color: #f7f3ec;
  border: 1px solid rgba(76, 92, 67, 0.8);
  box-shadow: 0 5px 12px rgba(58, 73, 50, 0.24);
}

.action-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-icon svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.btn-back .action-icon {
  position: static;
  width: 16px;
  height: 16px;
  margin-right: 2px;
}

.chat-sheet {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(31, 27, 20, 0.42);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: max(16px, var(--mq-safe-bottom));
}

.chat-sheet.fullscreen {
  align-items: stretch;
  justify-content: center;
  padding: 0;
  background: #f7f4ed;
}

.chat-panel {
  width: 100%;
  max-width: 520px;
  height: min(calc(var(--mq-vh, 1vh) * 74), 560px);
  border-radius: 18px 18px 14px 14px;
  background: #f7f3ec;
  border: 1px solid #d7be86;
  box-shadow: 0 22px 46px rgba(54, 44, 31, 0.22);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-panel.fullscreen {
  width: min(100vw, 480px);
  max-width: 480px;
  height: calc(var(--mq-vh, 1vh) * 100);
  border-radius: 0;
  border: none;
}

.chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 96px;
  padding: 16px;
  border-bottom: 1px solid rgba(122, 136, 104, 0.44);
  background: #8b9776;
}

.chat-panel.fullscreen .chat-head {
  padding-top: max(16px, var(--mq-safe-top));
}

.chat-title-wrap {
  display: grid;
  grid-template-columns: 56px 1fr;
  column-gap: 14px;
  align-items: center;
  min-width: 0;
}

.chat-brand {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: inline-flex;
  overflow: hidden;
  background: #f7f3ec;
  border: 1px solid rgba(214, 182, 95, 0.58);
  grid-row: 1 / span 3;
}

.chat-brand svg {
  width: 30px;
  height: 30px;
  stroke: #6f7d68;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  margin: auto;
}

.chat-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #f7f3ec;
}

.chat-sub {
  margin: 4px 0 0;
  font-size: 0.72rem;
  color: rgba(247, 243, 236, 0.88);
}

.chat-artifact-tag {
  margin: 6px 0 0;
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  color: #f7f3ec;
  background: rgba(247, 243, 236, 0.16);
  border: 1px solid rgba(247, 243, 236, 0.38);
}

.chat-close {
  min-height: 36px;
  padding: 0 13px;
  border-radius: 12px;
  background: #f7f3ec;
  color: #2f4a32;
  border: 1px solid #d7cebb;
  font-weight: 700;
  font-size: 0.78rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(40, 52, 35, 0.06);
}

.chat-head-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.chat-expand {
  min-height: 36px;
  padding: 0 13px;
  border-radius: 12px;
  background: #f7f3ec;
  color: #2f4a32;
  border: 1px solid #d7cebb;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(40, 52, 35, 0.06);
}

.chat-body {
  flex: 1;
  overflow: auto;
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f7f3ec;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

.chat-body > * {
  position: relative;
  z-index: 1;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 9px;
}

.message-row.me {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 78%;
  padding: 18px 20px;
  border-radius: 20px;
  font-size: 0.93rem;
  line-height: 1.62;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #ded3c0;
  box-shadow: 0 8px 16px rgba(74, 59, 40, 0.1);
  position: relative;
}

.chat-bubble.ai {
  border-radius: 20px 20px 20px 12px;
  background: #fbf8f2;
  color: #3b3b3b;
  border-color: #d9c9a9;
}

.chat-bubble.ai::after {
  content: "";
  position: absolute;
  left: -7px;
  bottom: 10px;
  width: 12px;
  height: 12px;
  background: #fbf8f2;
  border-left: 1px solid #ded3c0;
  border-bottom: 1px solid #ded3c0;
  transform: rotate(45deg);
}

.chat-bubble.me {
  border-radius: 20px 20px 12px 20px;
  background: #7a8868;
  color: #f7f4eb;
  border-color: #657355;
}

.chat-bubble.me::after {
  content: "";
  position: absolute;
  right: -7px;
  bottom: 10px;
  width: 12px;
  height: 12px;
  background: #7a9365;
  border-right: 1px solid #6a8256;
  border-bottom: 1px solid #6a8256;
  transform: rotate(45deg);
}

.ai-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f7f3ec;
  border: 1px solid #d8ccb8;
  box-shadow: 0 5px 10px rgba(84, 68, 47, 0.14);
}

.ai-avatar svg {
  width: 18px;
  height: 18px;
  stroke: #6f7d68;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chat-suggest-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 2px 0 6px;
}

.chat-suggest-chip {
  min-height: 38px;
  border-radius: 999px;
  padding: 0 16px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #f8f4ea;
  background: #7a8868;
  border: 1px solid #687557;
  box-shadow: 0 1px 4px rgba(47, 62, 40, 0.14);
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.chat-empty-hint {
  margin: 2px 0 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #6e7c7a;
  text-align: center;
  opacity: 0.82;
}

.chat-error {
  margin: 0;
  font-size: 0.75rem;
  color: #bf6a6a;
}

.chat-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid rgba(122, 136, 104, 0.42);
  background: #8b9776;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.chat-panel.fullscreen .chat-foot {
  padding-bottom: max(12px, var(--mq-safe-bottom));
}

.chat-input {
  flex: 1;
  min-height: 56px;
  border-radius: 28px;
  padding: 0 18px;
  background: #f7f3ec;
  border: 1px solid rgba(122, 136, 104, 0.4);
  color: #3b3b3b;
  font-size: 0.95rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.chat-input::placeholder {
  color: #9aa29f;
}

.chat-input:focus {
  outline: none;
  border-color: rgba(126, 151, 109, 0.72);
  box-shadow: 0 0 0 3px rgba(126, 151, 109, 0.24);
}

.chat-send {
  flex-shrink: 0;
  width: 56px;
  min-height: 56px;
  padding: 0;
  border-radius: 999px;
  background: #7a8868;
  color: #f7f3ec;
  font-weight: 800;
  border: 1px solid #687557;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(52, 67, 45, 0.16);
}

.chat-send:disabled {
  opacity: 0.55;
}

.chat-send-icon {
  width: 18px;
  height: 18px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12));
}

.chat-send-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(247, 244, 236, 0.45);
  border-top-color: #f7f4ec;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 430px) {
  .page {
    padding-left: 12px;
    padding-right: 12px;
    gap: 10px;
  }

  .camera {
    min-height: 206px;
    border-radius: 20px;
  }

  .camera-frame {
    width: min(88%, 320px);
  }

  .scan-tip {
    width: 100%;
    font-size: 0.82rem;
  }

  .scan-controls {
    width: 100%;
    min-height: 0;
    gap: 10px;
  }

  .artifact-picker-trigger {
    min-height: 58px;
    padding: 8px 12px;
  }

  .artifact-picker-line {
    font-size: 0.86rem;
  }

  .artifact-menu-slot {
    min-height: 96px;
  }

  .scan-btn {
    min-height: 50px;
    font-size: 0.96rem;
  }

  .sheet {
    padding: 8px;
    padding-bottom: max(8px, var(--mq-safe-bottom));
  }

  .sheet-panel {
    max-width: none;
    height: auto;
    max-height: calc(var(--mq-vh, 1vh) * 100 - 16px - var(--mq-safe-bottom));
    padding: 12px 12px 14px;
    border-radius: 16px 16px 12px 12px;
  }

  .sheet-head {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-bottom: 4px;
  }

  .sheet-title {
    font-size: 1.02rem;
    line-height: 1.2;
  }

  .head-tools {
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .voice {
    width: 100%;
    min-width: 0;
  }

  .voice-select {
    width: 100%;
    max-width: none;
    min-height: 34px;
    padding: 0 8px;
    font-size: 0.72rem;
  }

  .story-btn {
    width: 100%;
    min-height: 34px;
    padding: 0 10px;
    font-size: 0.72rem;
    min-width: 0;
    justify-self: stretch;
  }

  .sheet-sub {
    margin-bottom: 8px;
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .sheet-sub-hall {
    min-width: 0;
  }

  .sheet-sub-hall span:last-child {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
  }

  .model-block {
    margin-bottom: 10px;
  }

  .model-hint {
    font-size: 0.68rem;
    margin-bottom: 6px;
  }

  .model-viewer-wrap {
    min-height: 180px;
    height: min(34vh, 240px);
    border-radius: 14px;
  }

  .sheet-story {
    font-size: 0.88rem;
    line-height: 1.55;
    margin-bottom: 14px;
  }

  .story-error {
    margin-bottom: 12px;
  }

  .sheet-actions {
    flex-direction: column;
  }

  .btn-back,
  .btn-guide {
    width: 100%;
    min-height: 46px;
    font-size: 0.92rem;
  }

  .chat-sheet {
    padding: 8px;
    padding-bottom: max(8px, var(--mq-safe-bottom));
  }

  .chat-panel {
    width: 100%;
    max-width: none;
    height: auto;
    max-height: calc(var(--mq-vh, 1vh) * 100 - 16px - var(--mq-safe-bottom));
    border-radius: 16px;
  }

  .chat-panel.fullscreen {
    width: 100vw;
    max-width: 100vw;
    height: calc(var(--mq-vh, 1vh) * 100);
  }

  .chat-head {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-height: auto;
    padding: 12px;
  }

  .chat-title-wrap {
    width: 100%;
    flex: 1 1 auto;
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 8px;
    row-gap: 2px;
  }

  .chat-brand {
    width: 40px;
    height: 40px;
  }

  .chat-title {
    font-size: 0.95rem;
    line-height: 1.15;
  }

  .chat-sub {
    font-size: 0.66rem;
    line-height: 1.25;
  }

  .chat-artifact-tag {
    margin-top: 4px;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.66rem;
  }

  .chat-head-actions {
    width: auto;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chat-close,
  .chat-expand {
    min-height: 32px;
    padding: 0 10px;
    font-size: 0.72rem;
  }

  .chat-body {
    padding: 10px 10px 8px;
    gap: 10px;
    min-height: 0;
    flex: 0 1 auto;
    max-height: min(calc(var(--mq-vh, 1vh) * 36), 280px);
    overflow: auto;
  }

  .message-row {
    gap: 7px;
  }

  .chat-bubble {
    max-width: 84%;
    padding: 12px 14px;
    font-size: 0.86rem;
    line-height: 1.55;
  }

  .chat-suggest-chip {
    min-height: 34px;
    padding: 0 14px;
    font-size: 0.73rem;
  }

  .chat-empty-hint {
    font-size: 0.72rem;
  }

  .chat-foot {
    padding: 10px 10px max(10px, var(--mq-safe-bottom));
    gap: 8px;
  }

  .chat-input {
    min-height: 50px;
    border-radius: 25px;
    padding: 0 14px;
    font-size: 0.88rem;
  }

  .chat-send {
    width: 50px;
    min-height: 50px;
  }
}

</style>



