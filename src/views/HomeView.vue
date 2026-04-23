<script setup>
import { computed, nextTick, onUnmounted, reactive, ref } from "vue";
import floorPlanImage from "@/assets/museum-floor-plan.png";
import exhibitExplorerAvatar from "@/assets/exhibit-explorer-avatar.png";
import selectedRouteIcon from "@/assets/selected-route-icon.png";
import todayRouteIcon from "@/assets/today-route-icon.png";
import customizeIcon from "@/assets/customize-icon.png";
import routeAiHeaderIcon from "@/assets/route-ai-header-icon.png";
import { streamFetch } from "@/utils/api";

const zoneMeta = {
  h1: {
    roomLabel: "West Hall",
    roomRect: { left: 2, top: 13, width: 31, height: 73 },
    hotspot: { left: 18, top: 55 },
  },
  h2: {
    roomLabel: "North Route",
    roomRect: { left: 34, top: 13, width: 64, height: 34 },
    hotspot: { left: 66, top: 35 },
  },
  h3: {
    roomLabel: "South Route",
    roomRect: { left: 34, top: 58, width: 64, height: 32 },
    hotspot: { left: 69, top: 77 },
  },
};

const exhibitionZones = [
  {
    id: "h1",
    shortName: "Ancient Sculpture",
    roomLabel: "Main Hall",
    hint: "Stone figures and ancient sculptural works.",
    previewExhibits: [
      "Horus Falcon Statue",
      "Aphrodite and Eros Sculpture",
      "Preseving Buddha Statue",
      "Weeping Cow Sculpture",
      "Fragmentary Figure of Isis-Serqet",
    ],
    visitTags: ["sculpture", "ancient", "iconic"],
    bestFor: [
      "first-time visitors",
      "solo visitors",
      "highlight-focused visits",
    ],
    routeRole: "strong_start",
    pace: "medium",
    atmosphere: "dramatic",
    ...zoneMeta.h1,
  },
  {
    id: "h2",
    shortName: "Upper Route Galleries",
    roomLabel: "Upper Level",
    hint: "Porcelain, decorative objects, and quieter displays.",
    previewExhibits: ["Dragon Motif Bowl", "Fish Pond Model", "Garden Scene"],
    visitTags: ["decorative arts", "porcelain", "calm"],
    bestFor: ["reflective visits", "calmer endings", "slower-paced visits"],
    routeRole: "good_finish",
    pace: "slow",
    atmosphere: "peaceful",
    ...zoneMeta.h2,
  },
  {
    id: "h3",
    shortName: "Lower Route Galleries",
    roomLabel: "Lower Level",
    hint: "Cultural artifacts, ritual objects, and historical material.",
    previewExhibits: [
      "Statue of Ur-Ningirsu",
      "Gelede Helmet Mask",
      "Ceremonial Object",
    ],
    visitTags: ["artifacts", "history", "cultural context"],
    bestFor: [
      "deeper cultural context",
      "highlight-focused visits",
      "history-led routes",
    ],
    routeRole: "strong_middle",
    pace: "medium",
    atmosphere: "rich",
    ...zoneMeta.h3,
  },
].map((zone) => ({
  ...zone,
  exhibitCount: zone.previewExhibits.length,
  exhibits: zone.previewExhibits,
}));

const activeZoneId = ref(exhibitionZones[0]?.id || "h1");
const showRouteChat = ref(false);
const routeChatSessionId = ref("");
const routeChatInput = ref("");
const routeChatSending = ref(false);
const routeChatError = ref("");
const routeChatMessages = ref([]);
const routeChatBodyRef = ref(null);
const activeRouteIntent = ref("");
const routeChatFullscreen = ref(false);
const showRouteDetails = ref(false);
let routeChatScrollRaf = 0;

const routeSuggestedQuestions = [
  {
    key: "highlights-30",
    text: "30 min highlights",
    prompt: "I only have about 30 minutes. Show me a highlights-focused route.",
  },
  {
    key: "sculpture",
    text: "Sculpture-focused",
    prompt: "I prefer sculpture-focused exhibits. Which route fits best?",
  },
  {
    key: "family",
    text: "Family-friendly",
    prompt: "We are visiting as a family. Suggest an easy and engaging route.",
  },
  {
    key: "quiet",
    text: "A quieter route",
    prompt: "I prefer a calmer route with less rushing. What would you suggest?",
  },
];

const activeZone = computed(
  () =>
    exhibitionZones.find((zone) => zone.id === activeZoneId.value) ||
    exhibitionZones[0],
);

const shouldShowRouteSuggestions = computed(
  () => !routeChatMessages.value.some((m) => m.role === "user"),
);

function selectZone(zoneId) {
  activeZoneId.value = zoneId;
}

function openRouteDetails() {
  showRouteDetails.value = true;
}

function closeRouteDetails() {
  showRouteDetails.value = false;
}

function scheduleRouteChatScrollToBottom() {
  if (routeChatScrollRaf) return;
  routeChatScrollRaf = requestAnimationFrame(() => {
    routeChatScrollRaf = 0;
    const el = routeChatBodyRef.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  });
}

function buildAutoUserPrompt() {
  const focusedZone = String(activeZoneId.value || "h1").toUpperCase();
  return `Could you suggest a personalized route starting from ${focusedZone}?`;
}

function buildRouteContext() {
  return {
    focusedZone: String(activeZoneId.value || "h1").toUpperCase(),
    selectedIntent: activeRouteIntent.value || "none",
    zones: exhibitionZones.map((zone) => ({
      id: zone.id,
      shortName: zone.shortName,
      roomLabel: zone.roomLabel,
      hint: zone.hint,
      previewExhibits: zone.previewExhibits || [],
      visitTags: zone.visitTags || [],
      bestFor: zone.bestFor || [],
      routeRole: zone.routeRole || "",
      pace: zone.pace || "",
      atmosphere: zone.atmosphere || "",
    })),
  };
}

function escapeHtml(raw) {
  return String(raw)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegExp(raw) {
  return String(raw).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const routeHighlightTerms = computed(() =>
  Array.from(
    new Set(
      exhibitionZones
        .flatMap((zone) => zone.exhibits || [])
        .filter((name) => typeof name === "string" && name.trim().length > 0),
    ),
  ).sort((a, b) => b.length - a.length),
);

function highlightRouteContent(safeLine) {
  let out = safeLine.replace(/\bH[1-3]\b/g, "<strong>$&</strong>");

  for (const term of routeHighlightTerms.value) {
    const escapedTerm = escapeHtml(term);
    const pattern = new RegExp(escapeRegExp(escapedTerm), "g");
    out = out.replace(pattern, `<strong>${escapedTerm}</strong>`);
  }

  return out;
}

function softenImperativeTone(line) {
  const trimmed = String(line).trimStart();
  const rules = [
    { pattern: /^Journey through\b/i, replace: "You could explore" },
    { pattern: /^Spend\b/i, replace: "You could spend" },
    { pattern: /^Focus on\b/i, replace: "You might focus on" },
    { pattern: /^Visit\b/i, replace: "You could visit" },
    { pattern: /^Start\b/i, replace: "You could start" },
    { pattern: /^Head to\b/i, replace: "You could head to" },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(trimmed)) {
      return line.replace(rule.pattern, rule.replace);
    }
  }
  return line;
}

function formatRouteAssistantMessage(raw) {
  const headingPrefixes = [
    "Key route:",
    "Route:",
    "Timing:",
    "Why this fits you:",
    "Do not miss:",
    "If short on time:",
    "If plans change:",
  ];

  return String(raw)
    .split("\n")
    .map((line) => {
      const softenedLine = softenImperativeTone(line);
      const safeLine = escapeHtml(softenedLine);
      const emphasizedLine = highlightRouteContent(safeLine);
      const isKeyRoute = softenedLine.trimStart().startsWith("Key route:");
      const isHeading = headingPrefixes.some((prefix) =>
        softenedLine.trimStart().startsWith(prefix),
      );
      if (isKeyRoute) {
        return `<span class="route-keyline"><strong>${emphasizedLine}</strong></span>`;
      }
      return isHeading ? `<strong>${emphasizedLine}</strong>` : emphasizedLine;
    })
    .join("<br/>");
}

function openRouteChat() {
  routeChatError.value = "";
  routeChatFullscreen.value = false;
  showRouteChat.value = true;
  if (!routeChatMessages.value.length) {
    routeChatMessages.value = [
      {
        role: "assistant",
        content:
          "Choose a quick suggestion below, or tell me what kind of visit you want.",
      },
    ];
  }
  nextTick(() => scheduleRouteChatScrollToBottom());
}

function closeRouteChat() {
  showRouteChat.value = false;
  routeChatFullscreen.value = false;
}

function toggleRouteChatFullscreen() {
  routeChatFullscreen.value = !routeChatFullscreen.value;
}

async function sendRouteChat(forcedQuestion = "") {
  const safeForcedQuestion =
    typeof forcedQuestion === "string" ? forcedQuestion : "";
  const typedQuestion = routeChatInput.value.trim();
  const q = String(
    safeForcedQuestion || typedQuestion || buildAutoUserPrompt(),
  ).trim();
  if (!safeForcedQuestion && typedQuestion) {
    activeRouteIntent.value = "";
  }
  if (routeChatSending.value) return;

  routeChatError.value = "";
  routeChatSending.value = true;
  routeChatMessages.value = routeChatMessages.value.concat({
    role: "user",
    content: q,
  });
  routeChatInput.value = "";
  scheduleRouteChatScrollToBottom();

  const aiMsg = reactive({ role: "assistant", content: "", streaming: true });
  routeChatMessages.value.push(aiMsg);
  scheduleRouteChatScrollToBottom();

  try {
    await streamFetch(
      "/api/agent/chat",
      {
        method: "POST",
        body: {
          stream: true,
          mode: "sse",
          sessionId: routeChatSessionId.value || undefined,
          agentType: "route",
          routeContext: buildRouteContext(),
          question: q,
        },
        mode: "sse",
      },
      (ch) => {
        aiMsg.content += ch;
        scheduleRouteChatScrollToBottom();
      },
      (eventName, payload) => {
        if (eventName !== "session") return;
        const sid =
          typeof payload === "string" ? payload : payload?.sessionId || "";
        if (sid) routeChatSessionId.value = sid;
      },
    );
  } catch (e) {
    routeChatError.value = e?.message || "Failed to get route recommendation.";
    aiMsg.content +=
      "\n\n(Error) " + (e?.message || "Failed to get route recommendation.");
    scheduleRouteChatScrollToBottom();
  } finally {
    aiMsg.streaming = false;
    routeChatSending.value = false;
    scheduleRouteChatScrollToBottom();
  }
}

function sendQuickRouteIntent(intent) {
  if (!intent || routeChatSending.value) return;
  activeRouteIntent.value = intent.key;
  sendRouteChat(intent.prompt);
}

onUnmounted(() => {
  if (routeChatScrollRaf) {
    cancelAnimationFrame(routeChatScrollRaf);
    routeChatScrollRaf = 0;
  }
});
</script>

<template>
  <div class="page">
    <section class="plan-shell" aria-label="Museum floor plan">
      <div class="plan-head">
        <div class="plan-title-wrap">
          <span class="plan-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5h18M5.2 9.5v8.8M9.4 9.5v8.8M14.6 9.5v8.8M18.8 9.5v8.8M2.5 19h19M4 6.9 12 4l8 2.9" />
            </svg>
          </span>
          <h2 class="plan-title">MUSEUM EXHIBITION FLOOR PLAN</h2>
        </div>
        <span class="plan-compass" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 1.8v20.4M1.8 12h20.4M8 8l8 8M16 8l-8 8" />
            <path d="m12 6 2.5 6L12 18l-2.5-6L12 6Z" />
          </svg>
        </span>
      </div>

      <div class="plan-board">
        <img
          :src="floorPlanImage"
          alt="Museum exhibition floor plan"
          class="floor-plan"
        />

        <button
          v-for="zone in exhibitionZones"
          :key="`${zone.id}-hotspot`"
          type="button"
          class="hotspot"
          :class="{ active: activeZoneId === zone.id }"
          :style="{ left: `${zone.hotspot.left}%`, top: `${zone.hotspot.top}%` }"
          :aria-label="`Focus ${zone.shortName}`"
          @click="selectZone(zone.id)"
        >
          <span class="hotspot-pulse" />
          <span class="hotspot-dot" />
          <span class="hotspot-tag">{{ zone.id.toUpperCase() }}</span>
        </button>

        <div
          v-if="activeZone"
          class="room-highlight"
          :style="{
            left: `${activeZone.roomRect.left}%`,
            top: `${activeZone.roomRect.top}%`,
            width: `${activeZone.roomRect.width}%`,
            height: `${activeZone.roomRect.height}%`,
          }"
        />
      </div>

      <div class="plan-caption">
        <span class="caption-kicker">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="2.7" />
          </svg>
          <span>Now Viewing</span>
        </span>
        <div class="caption-main">
          <strong>{{ activeZone?.shortName }}</strong>
          <span>
            {{ activeZone?.roomLabel }} - {{ activeZone?.exhibitCount }} featured
            exhibits
          </span>
        </div>
      </div>
    </section>

    <section class="selected-route-card" aria-label="Selected route details">
      <span class="selected-route-icon" aria-hidden="true">
        <img :src="selectedRouteIcon" alt="" />
      </span>
      <div class="selected-route-copy">
        <p class="selected-route-kicker">Selected Route</p>
        <h3 class="selected-route-name">{{ activeZone?.shortName }}</h3>
        <p class="selected-route-meta">
          {{ activeZone?.roomLabel }} - {{ activeZone?.exhibitCount }} featured
          exhibits
        </p>
      </div>
      <button
        type="button"
        class="selected-route-btn"
        @click="openRouteDetails"
      >
        View Details
      </button>
    </section>

    <section class="card tip route-today-card">
      <span class="today-icon" aria-hidden="true">
        <img :src="todayRouteIcon" alt="" />
      </span>
      <div class="today-copy">
        <h2 class="h2">Today's Route</h2>
        <p>
          Explore the highlights of the {{ activeZone?.roomLabel }} with a focused
          museum walk.
        </p>
        <div class="today-metrics">
          <span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7v5l3 2" />
            </svg>
            Est. time: 45-60 min
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m12 3.8 2.6 5.2 5.8.8-4.2 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.8Z" />
            </svg>
            {{ activeZone?.exhibitCount }} key exhibits
          </span>
        </div>
      </div>
      <span class="today-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="m9 5 6 7-6 7" />
        </svg>
      </span>
    </section>

    <section class="route-ai-cta" aria-label="AI route recommendation">
      <span class="route-ai-icon" aria-hidden="true">
        <img :src="customizeIcon" alt="" />
      </span>
      <div class="route-ai-copy">
        <p class="route-ai-title">Customize your visit</p>
        <p class="route-ai-sub">
          Tailor your journey by interests, time, and must-see collections.
        </p>
      </div>
      <button type="button" class="route-ai-btn" @click="openRouteChat">
        <span>Customize your visit</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 5 6 7-6 7" />
        </svg>
      </button>
    </section>

    <div
      v-if="showRouteDetails"
      class="route-detail-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Route details"
      @click.self="closeRouteDetails"
    >
      <div class="route-detail-panel">
        <div class="route-detail-head">
          <h3>{{ activeZone?.shortName }}</h3>
          <button type="button" class="route-detail-close" @click="closeRouteDetails">
            Close
          </button>
        </div>
        <p class="route-detail-meta">
          {{ activeZone?.roomLabel }} - {{ activeZone?.exhibitCount }} featured exhibits
        </p>
        <p class="route-detail-hint">{{ activeZone?.hint }}</p>
        <p class="route-detail-subtitle">Key exhibits</p>
        <ul class="route-detail-list">
          <li v-for="item in activeZone?.previewExhibits || []" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>

    <div
      v-if="showRouteChat"
      class="route-chat-sheet"
      :class="{ fullscreen: routeChatFullscreen }"
      @click.self="closeRouteChat"
    >
      <div
        class="route-chat-panel"
        :class="{ fullscreen: routeChatFullscreen }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="route-chat-title"
      >
        <div class="route-chat-head">
          <div class="route-chat-title-wrap">
            <span class="route-chat-brand" aria-hidden="true">
              <img :src="routeAiHeaderIcon" alt="" />
            </span>
            <h3 id="route-chat-title" class="route-chat-title">Exhibit Explorer</h3>
            <p class="route-chat-sub">Personalized museum guidance</p>
          </div>
          <div class="route-chat-head-actions">
            <button
              type="button"
              class="route-chat-expand"
              @click="toggleRouteChatFullscreen"
            >
              {{ routeChatFullscreen ? "Compact" : "Full view" }}
            </button>
            <button type="button" class="route-chat-close" @click="closeRouteChat">
              Close
            </button>
          </div>
        </div>

        <div
          ref="routeChatBodyRef"
          class="route-chat-body"
          :class="{ empty: shouldShowRouteSuggestions }"
          aria-label="Route chat conversation"
        >
          <div
            v-for="(m, idx) in routeChatMessages"
            :key="idx"
            class="route-message-row"
            :class="m.role === 'user' ? 'me' : 'ai'"
          >
            <img
              v-if="m.role !== 'user'"
              class="route-ai-avatar"
              :src="exhibitExplorerAvatar"
              alt="Exhibit Explorer avatar"
            />
            <div
              v-if="m.role === 'user'"
              class="route-bubble me"
            >
              {{ m.content }}
            </div>
            <div
              v-else
              class="route-bubble ai"
              v-html="formatRouteAssistantMessage(m.content)"
            />
          </div>
          <div
            v-if="shouldShowRouteSuggestions"
            class="route-suggest-row"
            aria-label="Suggested questions"
          >
            <button
              v-for="intent in routeSuggestedQuestions"
              :key="intent.key"
              type="button"
              class="route-suggest-chip"
              @click="sendQuickRouteIntent(intent)"
            >
              <span class="route-suggest-icon" aria-hidden="true">
                <svg v-if="intent.key === 'highlights-30'" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <svg v-else-if="intent.key === 'sculpture'" viewBox="0 0 24 24" fill="none">
                  <path d="M4 17.5h16M7.2 17.5V9.2M10.8 17.5V9.2M14.4 17.5V9.2M18 17.5V9.2M6 7l6-2.5L18 7" />
                </svg>
                <svg v-else-if="intent.key === 'family'" viewBox="0 0 24 24" fill="none">
                  <circle cx="8" cy="8" r="2.2" />
                  <circle cx="16" cy="8" r="2.2" />
                  <path d="M4.8 18c.3-2.8 2.1-4.5 4.5-4.5s4.2 1.7 4.5 4.5M12.8 18c.2-2.4 1.8-3.9 3.9-3.9 2.1 0 3.7 1.5 3.9 3.9" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none">
                  <path d="M3.2 12s3.3-5.2 8.8-5.2 8.8 5.2 8.8 5.2-3.3 5.2-8.8 5.2S3.2 12 3.2 12Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </span>
              {{ intent.text }}
            </button>
          </div>
          <p v-if="shouldShowRouteSuggestions" class="route-empty-hint">
            Choose a suggestion to begin your personalized route.
          </p>
          <p v-if="routeChatError" class="route-chat-error">{{ routeChatError }}</p>
        </div>

        <form class="route-chat-foot" @submit.prevent="sendRouteChat()">
          <input
            v-model="routeChatInput"
            class="route-chat-input"
            type="text"
            placeholder="Ask for a route..."
            :disabled="routeChatSending"
          />
          <button
            type="submit"
            class="route-chat-send"
            :disabled="routeChatSending"
            :aria-label="routeChatSending ? 'Sending' : 'Send message'"
          >
            <svg
              v-if="!routeChatSending"
              class="route-send-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M3.4 11.2L19.6 3.3C20.3 3 21.1 3.6 20.9 4.4L18.1 19.7C17.9 20.6 16.8 20.9 16.2 20.2L12.1 15.6L8.1 18.8C7.5 19.3 6.6 18.8 6.7 18L7.2 13.6L3.6 12.6C2.8 12.4 2.7 11.6 3.4 11.2Z"
                fill="currentColor"
              />
            </svg>
            <span v-else class="route-send-spinner" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  --home-select: #d3c2ab;
  --home-select-strong: #b49a7a;
  --home-select-text: #4a3824;
  --route-card-border: rgba(143, 168, 191, 0.34);
  --route-card-bg: #fbfcfb;
  --route-card-active-border: rgba(126, 145, 141, 0.66);
  --route-card-active-bg-top: #edf1ef;
  --route-card-active-bg-bottom: #dde5e2;
  --route-card-active-text: #374c49;
}

.plan-shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid rgba(190, 165, 130, 0.52);
  background: linear-gradient(180deg, #eee3d2 0%, #e3d1b8 100%);
  box-shadow: 0 10px 24px rgba(79, 59, 29, 0.1);
}

.plan-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.plan-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  justify-content: center;
}

.plan-icon,
.plan-compass {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #b98a3d;
}

.plan-icon {
  width: 34px;
  height: 34px;
  background: rgba(255, 248, 236, 0.8);
  border: 1px solid rgba(185, 138, 61, 0.25);
}

.plan-compass {
  width: 32px;
  height: 32px;
  background: rgba(255, 252, 245, 0.74);
  border: 1px solid rgba(185, 138, 61, 0.34);
}

.plan-icon svg,
.plan-compass svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.plan-title {
  margin: 0;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
  color: #2f261b;
  text-align: center;
}

.plan-board {
  position: relative;
  overflow: hidden;
  border-radius: calc(var(--mq-radius) - 7px);
  background: #f3eee4;
  isolation: isolate;
  border: 1px solid rgba(157, 136, 104, 0.22);
}

.plan-board::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 24px;
  background: #f3eee4;
  z-index: 1;
  pointer-events: none;
}

.floor-plan {
  width: 100%;
  display: block;
  object-fit: contain;
  mix-blend-mode: multiply;
  position: relative;
  z-index: 0;
}

.room-highlight {
  position: absolute;
  border: 3px solid #b08a34;
  background: rgba(176, 138, 52, 0.14);
  box-shadow: 0 0 0 999px rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  pointer-events: none;
  z-index: 2;
  transition:
    left 180ms ease,
    top 180ms ease,
    width 180ms ease,
    height 180ms ease;
}

.hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3b2d14;
  z-index: 2;
}

.hotspot-dot,
.hotspot-pulse {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  border-radius: 999px;
}

.hotspot-dot {
  width: 16px;
  height: 16px;
  background: #7f9189;
  border: 2px solid #fff8eb;
  box-shadow:
    0 0 0 2px rgba(233, 221, 189, 0.78),
    0 6px 14px rgba(66, 85, 82, 0.22);
}

.hotspot-pulse {
  width: 32px;
  height: 32px;
  background: rgba(233, 221, 189, 0.38);
}

.hotspot-tag {
  margin-left: 14px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 250, 240, 0.95);
  border: 1px solid rgba(180, 154, 122, 0.45);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hotspot.active .hotspot-dot {
  background: #6f837f;
}

.hotspot.active .hotspot-tag {
  background: var(--home-select);
  color: var(--home-select-text);
}

.plan-caption {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 44px;
  padding-top: 2px;
  font-size: 0.8rem;
  color: #5e6f86;
  line-height: 1.35;
}

.caption-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(201, 162, 39, 0.18);
  color: #9b753f;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  white-space: nowrap;
  align-self: center;
}

.caption-kicker svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.caption-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.caption-main strong {
  color: #4a653f;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.2;
}

.caption-main span {
  color: #6d6a64;
  font-size: 0.74rem;
  line-height: 1.3;
}

@media (max-width: 430px) {
  .plan-title {
    font-size: 0.94rem;
  }

  .plan-icon {
    width: 30px;
    height: 30px;
  }

  .plan-compass {
    width: 28px;
    height: 28px;
  }

  .plan-icon svg,
  .plan-compass svg {
    width: 18px;
    height: 18px;
  }

  .plan-caption {
    gap: 10px;
  }

  .caption-main strong {
    font-size: 0.84rem;
  }

  .caption-main span {
    font-size: 0.7rem;
  }
}

.selected-route-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  min-height: 0;
  border-radius: 18px;
  border: 1px solid rgba(139, 160, 136, 0.32);
  background: #f4f5ef;
  box-shadow: 0 6px 16px rgba(57, 80, 54, 0.08);
}

.selected-route-icon {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  overflow: hidden;
}

.selected-route-icon img {
  width: 154%;
  height: 154%;
  display: block;
  object-fit: cover;
  border-radius: 50%;
}

.selected-route-copy {
  min-width: 0;
}

.selected-route-kicker {
  margin: 0;
  color: #5b7151;
  font-size: 0.84rem;
  font-weight: 700;
}

.selected-route-name {
  margin: 0 0 2px;
  color: #2f2922;
  font-size: 0.86rem;
  line-height: 1.3;
  font-weight: 700;
}

.selected-route-meta {
  margin: 0;
  color: #5b6572;
  font-size: 0.8rem;
  line-height: 1.3;
}

.selected-route-btn {
  min-height: 34px;
  border-radius: 999px;
  padding: 0 12px;
  border: 1px solid rgba(106, 129, 94, 0.52);
  background: #eff3ea;
  color: #546d48;
  font-size: 0.8rem;
  font-weight: 700;
}

.route-today-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 118px;
}

.today-icon {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  overflow: hidden;
}

.today-icon img {
  width: 154%;
  height: 154%;
  display: block;
  object-fit: cover;
  border-radius: 50%;
}

.today-copy {
  min-width: 0;
}

.today-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 6px;
}

.today-metrics span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  color: #7c725f;
}

.today-metrics svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.today-arrow {
  color: #3d372f;
}

.today-arrow svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.zone-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.zone-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.zone-name {
  font-weight: 700;
  font-size: 0.98rem;
  color: var(--mq-text);
}

.zone-hint {
  font-size: 0.76rem;
  color: #5e7387;
}

.zone-code {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(143, 168, 191, 0.18);
  color: #4f6578;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.zone-item.active .zone-name {
  color: var(--route-card-active-text);
}

.zone-item.active .zone-hint {
  color: #5a716e;
}

.zone-item.active .zone-code {
  background: rgba(126, 145, 141, 0.24);
  color: #44615e;
}

.zone-item.active .zone-count {
  color: #415e5b;
}

.zone-summary {
  margin: 0;
  font-size: 0.84rem;
  color: var(--mq-text-muted);
  line-height: 1.45;
}

.zone-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  font-size: 0.78rem;
}

.zone-count {
  color: #445f73;
  font-weight: 700;
}

.zone-preview {
  color: var(--mq-text-muted);
  line-height: 1.45;
}

.card {
  padding: 12px;
  border-radius: 18px;
  background: #f5eee2;
  border: 1px solid #dcc9a8;
}

.h2 {
  font-size: 0.86rem;
  margin-bottom: 4px;
  color: #a97b2f;
}

.tip p {
  margin: 0;
  font-size: 0.8rem;
  color: #5e6f86;
  line-height: 1.4;
}

.route-ai-cta {
  margin-top: 2px;
  padding: 12px;
  min-height: 118px;
  border-radius: 18px;
  border: 1px solid #cdd7d4;
  background: #f7f8f7;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.route-ai-icon {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  overflow: hidden;
}

.route-ai-icon img {
  width: 154%;
  height: 154%;
  display: block;
  object-fit: cover;
  border-radius: 50%;
}

.route-ai-copy {
  min-width: 0;
}

.route-ai-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: #48613d;
}

.route-ai-sub {
  margin: 4px 0 0;
  color: #626e7c;
  font-size: 0.78rem;
  line-height: 1.45;
}

.route-ai-btn {
  width: min(100%, 220px);
  min-height: 40px;
  border-radius: 14px;
  margin-top: 0;
  background: #738a65;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
  box-shadow: 0 5px 12px rgba(73, 93, 63, 0.18);
}

.route-ai-btn:hover {
  background: #687d5b;
}

.route-ai-btn:active {
  background: #607252;
}

.route-ai-btn svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-detail-sheet {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(20, 16, 11, 0.35);
  padding: 12px;
  padding-bottom: max(12px, var(--mq-safe-bottom));
}

.route-detail-panel {
  width: 100%;
  max-width: 480px;
  max-height: min(calc(var(--mq-vh, 1vh) * 72), 520px);
  overflow-y: auto;
  border-radius: 16px;
  background: #fffdf8;
  border: 1px solid rgba(130, 112, 88, 0.26);
  padding: 14px;
  box-shadow: 0 10px 28px rgba(48, 34, 15, 0.2);
}

.route-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.route-detail-head h3 {
  margin: 0;
  font-size: 1rem;
  color: #3d342b;
}

.route-detail-close {
  min-height: 30px;
  border-radius: 999px;
  padding: 0 10px;
  border: 1px solid rgba(117, 107, 94, 0.28);
  background: #f4efe6;
  color: #5f5448;
  font-size: 0.8rem;
  font-weight: 600;
}

.route-detail-meta {
  margin: 8px 0 0;
  color: #6c655d;
  font-size: 0.82rem;
}

.route-detail-hint {
  margin: 8px 0 0;
  color: #4f5f75;
  font-size: 0.86rem;
  line-height: 1.45;
}

.route-detail-subtitle {
  margin: 10px 0 6px;
  color: #6b5940;
  font-size: 0.8rem;
  font-weight: 700;
}

.route-detail-list {
  margin: 0;
  padding-left: 18px;
  color: #4e453b;
  font-size: 0.82rem;
  line-height: 1.5;
}

@media (max-width: 430px) {
  .selected-route-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .selected-route-btn {
    grid-column: 1 / -1;
    justify-self: end;
  }

  .selected-route-card,
  .route-today-card,
  .route-ai-cta {
    min-height: 0;
  }

  .route-today-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .today-arrow {
    display: none;
  }

  .route-ai-cta {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .route-ai-btn {
    grid-column: 1 / -1;
    width: 100%;
    justify-self: stretch;
  }

  .route-detail-sheet {
    padding: 8px;
    padding-bottom: max(8px, var(--mq-safe-bottom));
  }

  .route-detail-panel {
    max-width: none;
    max-height: calc(var(--mq-vh, 1vh) * 100 - 16px - var(--mq-safe-bottom));
    padding: 12px;
    border-radius: 14px;
  }

  .route-detail-head h3 {
    font-size: 0.95rem;
  }

  .route-detail-meta,
  .route-detail-hint,
  .route-detail-list {
    font-size: 0.8rem;
  }

  .route-chat-sheet {
    padding: 8px;
    padding-bottom: max(8px, var(--mq-safe-bottom));
  }

  .route-chat-panel {
    max-width: none;
    height: auto;
    max-height: calc(var(--mq-vh, 1vh) * 100 - 16px - var(--mq-safe-bottom));
    border-radius: 16px;
  }

  .route-chat-panel.fullscreen {
    width: 100vw;
    max-width: 100vw;
    height: calc(var(--mq-vh, 1vh) * 100);
  }

  .route-chat-head {
    min-height: auto;
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .route-chat-title-wrap {
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 8px;
    row-gap: 2px;
  }

  .route-chat-brand {
    width: 40px;
    height: 40px;
  }

  .route-chat-title {
    font-size: 0.96rem;
    line-height: 1.12;
  }

  .route-chat-sub {
    font-size: 0.66rem;
    line-height: 1.22;
  }

  .route-chat-head-actions {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
  }

  .route-chat-close,
  .route-chat-expand {
    min-height: 32px;
    padding: 0 10px;
    font-size: 0.72rem;
  }

  .route-chat-body {
    padding: 10px 10px 8px;
    gap: 10px;
    min-height: 0;
    flex: 0 1 auto;
    max-height: min(calc(var(--mq-vh, 1vh) * 40), 300px);
    overflow: auto;
  }

  .route-bubble {
    max-width: 86%;
    padding: 12px 14px;
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .route-suggest-row {
    gap: 8px;
    padding: 0;
  }

  .route-suggest-chip {
    min-height: 34px;
    padding: 0 14px;
    font-size: 0.74rem;
  }

  .route-chat-foot {
    padding: 10px 10px max(10px, var(--mq-safe-bottom));
    gap: 8px;
  }

  .route-chat-input {
    min-height: 50px;
    border-radius: 25px;
    padding: 0 14px;
    font-size: 0.88rem;
  }

  .route-chat-send {
    width: 50px;
    min-height: 50px;
  }

}

.route-chat-sheet {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: max(16px, var(--mq-safe-bottom));
}

.route-chat-sheet.fullscreen {
  align-items: stretch;
  justify-content: center;
  padding: 0;
  background: #f7f4ec;
}

.route-chat-panel {
  width: 100%;
  max-width: 520px;
  height: min(calc(var(--mq-vh, 1vh) * 74), 560px);
  border-radius: 18px 18px 14px 14px;
  background: #fbf8f2;
  border: 1px solid #d8d1bf;
  box-shadow: 0 16px 40px rgba(43, 52, 40, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.route-chat-panel.fullscreen {
  width: min(100vw, 480px);
  max-width: 480px;
  height: calc(var(--mq-vh, 1vh) * 100);
  border-radius: 0;
  border: none;
}

.route-chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 96px;
  padding: 16px;
  border-bottom: 1px solid #6b8457;
  background: #7a9365;
}

.route-chat-panel.fullscreen .route-chat-head {
  padding-top: max(14px, var(--mq-safe-top));
}

.route-chat-title-wrap {
  display: grid;
  grid-template-columns: 56px 1fr;
  column-gap: 14px;
  align-items: center;
}

.route-chat-brand {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: inline-flex;
  overflow: hidden;
  background: #f3ebdb;
  border: 1px solid #d8ccb8;
  grid-row: 1 / span 2;
}

.route-chat-brand img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1.32);
  transform-origin: center;
}

.route-chat-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #f7f3e9;
  text-shadow: 0 1px 0 rgba(26, 35, 20, 0.3);
}

.route-chat-sub {
  margin: 4px 0 0;
  font-size: 0.72rem;
  color: rgba(247, 243, 233, 0.82);
}

.route-chat-close {
  min-height: 36px;
  padding: 0 13px;
  border-radius: 12px;
  background: #ece8d9;
  border: 1px solid #d7cebb;
  color: #2f4a32;
  font-size: 0.78rem;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(40, 52, 35, 0.06);
}

.route-chat-head-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.route-chat-expand {
  min-height: 36px;
  padding: 0 13px;
  border-radius: 12px;
  background: #ece8d9;
  border: 1px solid #d7cebb;
  color: #2f4a32;
  font-size: 0.78rem;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(40, 52, 35, 0.06);
}

.route-chat-body {
  flex: 1;
  overflow: auto;
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f7f4ed;
  position: relative;
}

.route-chat-body > * {
  position: relative;
  z-index: 1;
}

.route-message-row {
  display: flex;
  align-items: flex-end;
  gap: 7px;
}

.route-message-row.me {
  justify-content: flex-end;
}

.route-ai-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid #d8ccb8;
  background: #f6f1e7;
}

.route-bubble {
  max-width: 78%;
  position: relative;
  padding: 18px 20px;
  border-radius: 20px;
  font-size: 0.93rem;
  line-height: 1.62;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #ded3c0;
}

.route-bubble.ai {
  background: #fbf8f2;
  color: #23343b;
  border-top-left-radius: 12px;
}

.route-bubble.ai::after {
  content: "";
  position: absolute;
  left: -6px;
  bottom: 10px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 7px solid #fbf8f2;
}

.route-bubble.ai :deep(strong) {
  font-weight: 800;
}

.route-bubble.ai :deep(.route-keyline) {
  display: block;
  margin: 4px 0 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #edf2e6;
  border: 1px solid #cad2bd;
  color: #314d34;
}

.route-bubble.me {
  background: #7a9365;
  color: #f8f5ed;
  border-color: #6a8256;
  border-top-right-radius: 12px;
}

.route-bubble.me::after {
  content: "";
  position: absolute;
  right: -6px;
  bottom: 10px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 7px solid #849b74;
}

.route-chat-error {
  margin: 0;
  font-size: 0.75rem;
  color: #b65e56;
}

.route-chat-foot {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #ddd4c0;
  background: #f7f3ea;
}

.route-chat-panel.fullscreen .route-chat-foot {
  padding-bottom: max(12px, var(--mq-safe-bottom));
}

.route-suggest-row {
  display: flex;
  flex-wrap: wrap;
  overflow-x: visible;
  gap: 10px;
  padding: 2px 0 6px;
  background: transparent;
  scrollbar-width: none;
}

.route-suggest-chip {
  flex: 0 0 auto;
  min-height: 38px;
  border-radius: 999px;
  padding: 0 16px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #f8f4ea;
  background: #7a9365;
  border: 1px solid #6a8357;
  box-shadow: 0 1px 4px rgba(47, 62, 40, 0.14);
  text-align: left;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.route-suggest-row::-webkit-scrollbar {
  height: 0;
}

.route-suggest-icon {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.92;
}

.route-suggest-icon svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-empty-hint {
  margin: 2px 0 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #6e7c7a;
  text-align: center;
  opacity: 0.82;
}

.route-chat-input {
  flex: 1;
  min-height: 56px;
  border-radius: 28px;
  padding: 0 18px;
  background: #fbf8f2;
  border: 1px solid #d8ccb8;
  color: #3c372f;
  font-size: 0.95rem;
}

.route-chat-input::placeholder {
  color: #9aa29f;
}

.route-chat-input:focus {
  outline: none;
  border-color: #8ea67d;
  box-shadow: 0 0 0 2px rgba(142, 166, 125, 0.24);
}

.route-chat-send {
  flex-shrink: 0;
  width: 56px;
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 999px;
  background: #7a9365;
  color: #f8f5ed;
  font-weight: 800;
  border: 1px solid #667f52;
  box-shadow: 0 4px 10px rgba(52, 67, 45, 0.16);
}

.route-send-icon {
  width: 18px;
  height: 18px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12));
}

.route-send-spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(248, 255, 243, 0.4);
  border-top-color: #f8fff3;
  animation: route-spin 700ms linear infinite;
}

@keyframes route-spin {
  to {
    transform: rotate(360deg);
  }
}

.route-chat-send:disabled {
  opacity: 0.55;
}

@media (max-width: 430px) {
  .route-chat-sheet {
    padding: 8px;
    padding-bottom: max(8px, var(--mq-safe-bottom));
  }

  .route-chat-panel {
    max-width: none;
    height: auto;
    max-height: calc(var(--mq-vh, 1vh) * 100 - 16px - var(--mq-safe-bottom));
    border-radius: 16px;
  }

  .route-chat-panel.fullscreen {
    width: 100vw;
    max-width: 100vw;
    height: calc(var(--mq-vh, 1vh) * 100);
  }

  .route-chat-head {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-height: 0;
    padding: 12px;
  }

  .route-chat-title-wrap {
    flex: 1 1 auto;
    min-width: 0;
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 8px;
    row-gap: 2px;
  }

  .route-chat-brand {
    width: 40px;
    height: 40px;
  }

  .route-chat-title {
    font-size: 0.95rem;
    line-height: 1.1;
  }

  .route-chat-sub {
    font-size: 0.64rem;
    line-height: 1.15;
  }

  .route-chat-head-actions {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .route-chat-close,
  .route-chat-expand {
    min-height: 30px;
    padding: 0 10px;
    font-size: 0.7rem;
  }

  .route-chat-body {
    flex: 0 1 auto;
    min-height: 0;
    max-height: min(calc(var(--mq-vh, 1vh) * 36), 280px);
    overflow: auto;
    padding: 10px 10px 8px;
    gap: 10px;
  }

  .route-message-row {
    gap: 6px;
  }

  .route-bubble {
    max-width: 84%;
    padding: 12px 14px;
    font-size: 0.85rem;
    line-height: 1.48;
  }

  .route-suggest-row {
    gap: 8px;
    padding: 0;
  }

  .route-suggest-chip {
    min-height: 34px;
    padding: 0 14px;
    font-size: 0.73rem;
  }

  .route-empty-hint {
    margin-top: 2px;
    font-size: 0.72rem;
  }

  .route-chat-foot {
    padding: 10px 10px max(10px, var(--mq-safe-bottom));
    gap: 8px;
  }

  .route-chat-input {
    min-height: 48px;
    border-radius: 24px;
    padding: 0 14px;
    font-size: 0.87rem;
  }

  .route-chat-send {
    width: 48px;
    min-height: 48px;
  }
}

</style>
