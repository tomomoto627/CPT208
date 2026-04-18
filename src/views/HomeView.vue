<script setup>
import { computed, inject, ref } from "vue";
import floorPlanImage from "@/assets/museum-floor-plan.png";

const { state } = inject("museum");

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

const exhibitionZones = computed(() =>
  (state.zones || []).map((zone, index) => {
    const meta = zoneMeta[zone.id] || {};
    return {
      ...zone,
      ...meta,
      shortName: zone.name,
      exhibitCount: zone.exhibits?.length || 0,
      previewExhibits: (zone.exhibits || []).slice(0, 3),
      accentIndex: index + 1,
    };
  }),
);

const activeZoneId = ref(exhibitionZones.value[0]?.id || "h1");

const activeZone = computed(
  () =>
    exhibitionZones.value.find((zone) => zone.id === activeZoneId.value) ||
    exhibitionZones.value[0],
);

function selectZone(zoneId) {
  activeZoneId.value = zoneId;
}
</script>

<template>
  <div class="page">
    <p class="lead">
      Tap a hotspot or a gallery card to focus the matching room on the floor
      plan.
    </p>

    <section class="plan-shell" aria-label="Museum floor plan">
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
        <span class="caption-kicker">Now Viewing</span>
        <strong>{{ activeZone?.shortName }}</strong>
        <span>
          {{ activeZone?.roomLabel }} · {{ activeZone?.exhibitCount }} featured
          exhibits
        </span>
      </div>
    </section>

    <ul class="zone-list">
      <li
        v-for="zone in exhibitionZones"
        :key="zone.id"
        class="zone-item"
        :class="{ active: activeZoneId === zone.id }"
      >
        <button
          type="button"
          class="zone-card"
          @click="selectZone(zone.id)"
        >
          <div class="zone-top">
            <div class="zone-main">
              <span class="zone-name">{{ zone.shortName }}</span>
              <span class="zone-hint">{{ zone.roomLabel }}</span>
            </div>
            <span class="zone-code">{{ zone.id.toUpperCase() }}</span>
          </div>

          <p class="zone-summary">{{ zone.hint }}</p>

          <div class="zone-footer">
            <span class="zone-count">{{ zone.exhibitCount }} exhibits</span>
            <span class="zone-preview">{{ zone.previewExhibits.join(" · ") }}</span>
          </div>
        </button>
      </li>
    </ul>

    <section class="card tip">
      <h2 class="h2">Today's Route</h2>
      <p>
        Start in {{ exhibitionZones[0]?.shortName }}, move through the upper
        route, and finish in the lower route for a compact museum walk.
      </p>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lead {
  font-size: 0.92rem;
  color: var(--mq-text-muted);
  line-height: 1.55;
}

.plan-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: var(--mq-radius);
  border: 1px solid var(--mq-border);
  background: linear-gradient(180deg, #fffdf8 0%, #f7f0e4 100%);
  box-shadow: 0 12px 28px rgba(78, 58, 28, 0.08);
}

.plan-board {
  position: relative;
  overflow: hidden;
  border-radius: calc(var(--mq-radius) - 6px);
  background: #fff;
}

.floor-plan {
  width: 100%;
  display: block;
  object-fit: contain;
}

.room-highlight {
  position: absolute;
  border: 3px solid rgba(201, 162, 39, 0.95);
  background: rgba(201, 162, 39, 0.14);
  box-shadow: 0 0 0 999px rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  pointer-events: none;
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
  width: 14px;
  height: 14px;
  background: #c9a227;
  border: 3px solid #fff8eb;
  box-shadow: 0 6px 14px rgba(112, 82, 16, 0.3);
}

.hotspot-pulse {
  width: 28px;
  height: 28px;
  background: rgba(201, 162, 39, 0.22);
}

.hotspot-tag {
  margin-left: 14px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 250, 240, 0.95);
  border: 1px solid rgba(201, 162, 39, 0.32);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hotspot.active .hotspot-dot {
  background: #8d4d1f;
}

.hotspot.active .hotspot-tag {
  background: #c9a227;
  color: #22180a;
}

.plan-caption {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 0.82rem;
  color: var(--mq-text-muted);
  line-height: 1.5;
}

.caption-kicker {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(201, 162, 39, 0.12);
  color: var(--mq-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.zone-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.zone-item {
  margin: 0;
}

.zone-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  text-align: left;
  background: var(--mq-bg-elevated);
  border-radius: var(--mq-radius);
  border: 1px solid var(--mq-border);
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease;
}

.zone-item.active .zone-card {
  border-color: rgba(201, 162, 39, 0.6);
  background: linear-gradient(180deg, #fffaf0 0%, #f7f0e4 100%);
  box-shadow: 0 10px 20px rgba(201, 162, 39, 0.12);
  transform: translateY(-1px);
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
  color: var(--mq-accent);
}

.zone-code {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(201, 162, 39, 0.12);
  color: var(--mq-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
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
  color: #5f4a2b;
  font-weight: 700;
}

.zone-preview {
  color: var(--mq-text-muted);
  line-height: 1.45;
}

.card {
  padding: 16px;
  border-radius: var(--mq-radius);
  background: var(--mq-bg-elevated);
  border: 1px solid var(--mq-border);
}

.h2 {
  font-size: 0.95rem;
  margin-bottom: 8px;
  color: var(--mq-accent);
}

.tip p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--mq-text-muted);
  line-height: 1.55;
}
</style>
