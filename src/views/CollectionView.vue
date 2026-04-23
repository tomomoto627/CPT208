<script setup>
import { computed, inject, ref } from "vue";

const { collectibles } = inject("museum");
const activeThemeKey = ref("");

const THEME_CONFIG = [
  { key: "sculpture", label: "Sculpture Classics", icon: "S" },
  { key: "ceramics", label: "Ceramic Legacy", icon: "C" },
  { key: "bronze", label: "Bronze Civilization", icon: "B" },
  { key: "metalwork", label: "Precious Metal Craft", icon: "M" },
  { key: "ritual", label: "Ritual & Mask", icon: "R" },
  { key: "mesopotamia", label: "Mesopotamian Stories", icon: "E" },
];

const THEME_BY_ID = {
  "horus-falcon-statue": "sculpture",
  "aphrodite-eros-sculpture": "sculpture",
  "dragon-motif-bowl": "ceramics",
  "bronze-bull-head-ornament": "bronze",
  "silver-gilt-bowl": "metalwork",
  "gelede-helmet-mask": "ritual",
  "statue-of-ur-ningirsu": "mesopotamia",
  "preaching-buddha-statue": "sculpture",
  "weeping-cow-sculpture": "sculpture",
  "fish-pond-model": "ceramics",
  "fragmentary-isis-serqet-figure": "sculpture",
  "inscribed-clay-tablet": "mesopotamia",
};

function getThemeKey(item) {
  return THEME_BY_ID[item.id] || "sculpture";
}

const themeProgressList = computed(() =>
  THEME_CONFIG.map((theme) => {
    const items = collectibles.value.filter((c) => getThemeKey(c) === theme.key);
    const total = items.length;
    const unlocked = items.filter((c) => c.unlocked).length;
    const pct = total ? Math.round((unlocked / total) * 100) : 0;
    return { ...theme, items, total, unlocked, pct };
  }).filter((theme) => theme.total > 0),
);

function toggleTheme(key) {
  activeThemeKey.value = activeThemeKey.value === key ? "" : key;
}

function shortStory(text, limit = 86) {
  const safe = String(text || "").trim();
  if (!safe) return "";
  if (safe.length <= limit) return safe;
  return `${safe.slice(0, limit).trim()}...`;
}
</script>

<template>
  <div class="page">
    <div class="stats-grid">
      <article
        v-for="theme in themeProgressList"
        :key="theme.key"
        class="stats-card"
        :class="{ expanded: activeThemeKey === theme.key }"
      >
        <button
          type="button"
          class="stats"
          :class="{ active: activeThemeKey === theme.key }"
          @click="toggleTheme(theme.key)"
        >
          <span class="theme-icon" aria-hidden="true">
            <svg v-if="theme.key === 'sculpture'" viewBox="0 0 24 24" fill="none">
              <path d="M12 5.2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z" />
              <path d="M8.5 20v-2.5c0-1.6 1.3-2.9 2.9-2.9h1.2c1.6 0 2.9 1.3 2.9 2.9V20" />
              <path d="M7.2 11.8h9.6M9.2 14.6h5.6" />
            </svg>
            <svg v-else-if="theme.key === 'ceramics'" viewBox="0 0 24 24" fill="none">
              <path d="M8 5.6h8M7.2 5.6c0 2.2-.2 3.9-1 5.2-.8 1.3-.8 6.4 5.8 8.8 6.6-2.4 6.6-7.5 5.8-8.8-.8-1.3-1-3-1-5.2" />
              <path d="M9.5 10.6h5M9 13.4h6" />
            </svg>
            <svg v-else-if="theme.key === 'bronze'" viewBox="0 0 24 24" fill="none">
              <path d="M7.5 7.2h9M8.5 7.2v8.4h7V7.2M9.3 15.6l-1 2.2M14.7 15.6l1 2.2" />
              <path d="M8.5 9.5h-1.8M15.5 9.5h1.8M10.8 11.1h2.4" />
            </svg>
            <svg v-else-if="theme.key === 'metalwork'" viewBox="0 0 24 24" fill="none">
              <path d="M7 8.6h10M7.8 8.6c0 1.6-.2 2.7-.8 3.8-.6 1.1 1 4.8 5 6 4-1.2 5.6-4.9 5-6-.6-1.1-.8-2.2-.8-3.8" />
              <path d="M10 12.3h4M9.4 14.8h5.2" />
            </svg>
            <svg v-else-if="theme.key === 'ritual'" viewBox="0 0 24 24" fill="none">
              <path d="M7.2 9.3c0-2.2 2.2-3.9 4.8-3.9s4.8 1.7 4.8 3.9v4.2c0 1.2-.7 2.2-1.8 2.7l-3 1.4-3-1.4a3 3 0 0 1-1.8-2.7V9.3Z" />
              <path d="M10 10.8h.01M14 10.8h.01M10.2 13.5c1 .8 2.6.8 3.6 0" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <path d="M7.4 5.8h9.2v12.4H7.4zM10 9h4M10 12h4M10 15h4" />
            </svg>
          </span>

          <div class="stat-block">
            <span class="stat-label">{{ theme.label }}</span>
          </div>

          <div class="stat-right">
            <div class="progress-ring" aria-hidden="true">
              <svg class="ring-svg" viewBox="0 0 40 40">
                <circle class="ring-track" cx="20" cy="20" r="15" />
                <circle
                  class="ring-progress"
                  cx="20"
                  cy="20"
                  r="15"
                  :style="{ strokeDashoffset: `${94.25 * (1 - theme.pct / 100)}` }"
                />
              </svg>
            </div>
            <span class="stat-pct">{{ theme.pct }}%</span>
            <span class="stat-chevron" :class="{ up: activeThemeKey === theme.key }" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m7 10 5 5 5-5" />
              </svg>
            </span>
          </div>
        </button>

        <section v-show="activeThemeKey === theme.key" class="theme-inline">
          <ul class="list">
            <li
              v-for="c in theme.items"
              :key="c.id"
              class="item"
              :class="{ locked: !c.unlocked }"
            >
              <span class="item-icon" aria-hidden="true">
                <svg v-if="c.unlocked" viewBox="0 0 24 24" fill="none">
                  <path d="M5 8.8c4.3-1.2 9.7-1.2 14 0M6.8 8.8c0 2.3.4 3.9 1.3 5.2.9 1.3 2.2 2.8 3.9 4 1.7-1.2 3-2.7 3.9-4 .9-1.3 1.3-2.9 1.3-5.2" />
                  <path d="M9.5 12.2h5M9 14.8h6" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none">
                  <path d="M8 10V8.8C8 6.7 9.8 5 12 5s4 1.7 4 3.8V10M7 10h10v8H7z" />
                </svg>
              </span>

              <div class="meta">
                <span class="name">{{ c.unlocked ? c.name : "Locked Artifact" }}</span>
                <span class="hall">{{ c.hallName }}</span>
                <p v-if="c.unlocked" class="snippet">{{ shortStory(c.story) }}</p>
                <p v-else class="snippet muted">Scan this artifact to unlock its story.</p>
              </div>
            </li>
          </ul>
        </section>
      </article>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-card {
  background: #fffdf9;
  border-radius: 20px;
  border: 1px solid #e6dccb;
  box-shadow: 0 6px 18px rgba(80, 60, 30, 0.06);
  overflow: hidden;
}

.stats-card.expanded {
  border-color: rgba(159, 184, 150, 0.9);
  background: #f4f8f1;
}

.stats {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 88px;
  padding: 12px 14px;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.stats.active {
  background: #f3f9ee;
}

.theme-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e6dccb;
  background: #fffdf9;
  color: #9b753f;
  flex-shrink: 0;
}

.theme-icon svg {
  width: 28px;
  height: 28px;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.stat-block {
  min-width: 0;
}

.stat-label {
  font-size: 0.98rem;
  font-weight: 620;
  color: #3a332b;
  line-height: 1.35;
}

.stat-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.progress-ring {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ring-svg {
  width: 44px;
  height: 44px;
  transform: rotate(-90deg);
}

.ring-track,
.ring-progress {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}

.ring-track {
  stroke: #d8e3d1;
}

.ring-progress {
  stroke: #9ab889;
  stroke-dasharray: 94.25;
  transition: stroke-dashoffset 0.35s ease;
}

.stat-pct {
  min-width: 44px;
  text-align: right;
  font-size: 0.96rem;
  font-weight: 650;
  color: #5a5146;
}

.stat-chevron {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #8f7f6a;
  transition: transform 0.2s ease;
}

.stat-chevron.up {
  transform: rotate(180deg);
}

.stat-chevron svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.theme-inline {
  padding: 0 12px 12px;
  background: #f3f9ee;
}

.list {
  list-style: none;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid rgba(126, 151, 109, 0.24);
  border-radius: 14px;
  background: #f7fbf4;
}

.item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  padding: 12px 8px;
  border-bottom: 1px solid #eee5d7;
}

.item:last-child {
  border-bottom: 0;
}

.item.locked {
  opacity: 0.72;
}

.item-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 1px solid #e4d4b8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #b1852f;
  background: #fffcf6;
  flex-shrink: 0;
}

.item-icon svg {
  width: 28px;
  height: 28px;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.name {
  font-weight: 680;
  font-size: 0.96rem;
  color: #2f241c;
}

.hall {
  font-size: 0.86rem;
  color: #b1843d;
}

.snippet {
  font-size: 0.82rem;
  color: #7b6a58;
  line-height: 1.45;
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.snippet.muted {
  font-style: italic;
}

@media (max-width: 380px) {
  .stats {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: center;
  }

  .stat-right {
    grid-column: 1 / -1;
    justify-self: end;
  }
}
</style>
