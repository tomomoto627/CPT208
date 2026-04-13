<script setup>
import { ref, inject, onActivated, onDeactivated, nextTick } from 'vue'
import { loadAmap, getAmapKey } from '@/utils/amap'
import '@/assets/amap-user-marker.css'

const { state } = inject('museum')

const mapContainerRef = ref(null)

const mapError = ref('')
const mapLoading = ref(false)
const followUser = ref(true)
const orientationEnabled = ref(false)
const orientationHint = ref('')

let epoch = 0
let map = null
let AMapRef = null
let userMarker = null
let beamEl = null
let hallMarkers = []
let watchId = null
let lastUserPos = null

function defaultCenter() {
  const zs = state.zones
  if (!zs.length) return [120.739, 31.273]
  const lng = zs.reduce((s, z) => s + z.lng, 0) / zs.length
  const lat = zs.reduce((s, z) => s + z.lat, 0) / zs.length
  return [lng, lat]
}

function createUserMarkerContent() {
  const root = document.createElement('div')
  root.className = 'mq-amap-user-root'
  /* 避免 content 宽高为 0 时 anchor:center 偏移异常 */
  root.style.cssText = 'width:2px;height:2px;position:relative;'
  const beam = document.createElement('div')
  beam.className = 'mq-amap-beam'
  const dot = document.createElement('div')
  dot.className = 'mq-amap-dot'
  root.appendChild(beam)
  root.appendChild(dot)
  return { root, beam }
}

function createHallMarkerContent(title) {
  const wrap = document.createElement('div')
  wrap.style.cssText =
    'display:flex;flex-direction:column;align-items:center;transform:translateY(-4px);'
  const dot = document.createElement('div')
  dot.style.cssText =
    'width:11px;height:11px;border-radius:50%;background:#c9a227;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);'
  const label = document.createElement('div')
  label.textContent = title
  label.style.cssText =
    'margin-top:4px;padding:2px 6px;border-radius:6px;font-size:11px;color:#333;background:rgba(255,255,255,.92);white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;'
  wrap.appendChild(dot)
  wrap.appendChild(label)
  return wrap
}

function setBeamHeading(deg) {
  if (!beamEl || deg == null || Number.isNaN(deg)) return
  beamEl.style.transform = `rotate(${deg}deg)`
}

function onDeviceOrientation(e) {
  let h = null
  if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
    h = e.webkitCompassHeading
  } else if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
    h = 360 - e.alpha
  }
  if (h == null) return
  h = ((h % 360) + 360) % 360
  setBeamHeading(h)
}

function detachOrientation() {
  window.removeEventListener('deviceorientationabsolute', onDeviceOrientation, true)
  window.removeEventListener('deviceorientation', onDeviceOrientation, true)
  orientationEnabled.value = false
}

async function enableOrientation() {
  orientationHint.value = ''
  try {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      const perm = await DeviceOrientationEvent.requestPermission()
      if (perm !== 'granted') {
        orientationHint.value = '未授权朝向传感器'
        return
      }
    }
    detachOrientation()
    if (typeof window.DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientationabsolute', onDeviceOrientation, true)
      window.addEventListener('deviceorientation', onDeviceOrientation, true)
    }
    orientationEnabled.value = true
    orientationHint.value = '已开启（需 HTTPS；部分安卓需校准指南针）'
  } catch {
    orientationHint.value = '无法开启朝向'
  }
}

function clearWatch() {
  if (watchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
}

function destroyMap() {
  detachOrientation()
  clearWatch()
  hallMarkers.forEach((m) => {
    try {
      m.setMap(null)
    } catch {
      /* ignore */
    }
  })
  hallMarkers = []
  userMarker = null
  beamEl = null
  if (map) {
    try {
      map.destroy()
    } catch {
      /* ignore */
    }
  }
  map = null
  AMapRef = null
}

function flyToZone(z) {
  if (!map || !AMapRef) return
  followUser.value = false
  map.setZoomAndCenter(17, [z.lng, z.lat], true, 450)
}

function recenterOnUser() {
  if (!map || !lastUserPos) return
  followUser.value = true
  map.setZoomAndCenter(17, lastUserPos, true, 450)
}

async function initMap() {
  const my = ++epoch
  mapError.value = ''

  if (!getAmapKey()) {
    mapError.value =
      '未配置高德 Key：在项目根目录复制 .env.example 为 .env，填写 VITE_AMAP_KEY 后重启 dev 服务。'
    return
  }

  mapLoading.value = true
  try {
    const AMap = await loadAmap()
    if (my !== epoch) return
    AMapRef = AMap

    await nextTick()
    if (my !== epoch || !mapContainerRef.value) return

    const center = defaultCenter()
    map = new AMap.Map(mapContainerRef.value, {
      viewMode: '2D',
      zoom: 16,
      center,
      mapStyle: 'amap://styles/normal',
    })

    map.on('dragstart', () => {
      followUser.value = false
    })

    const { root, beam } = createUserMarkerContent()
    beamEl = beam
    userMarker = new AMap.Marker({
      position: center,
      content: root,
      anchor: 'center',
      zIndex: 120,
    })
    userMarker.setMap(map)

    state.zones.forEach((z) => {
      const content = createHallMarkerContent(z.name)
      const m = new AMap.Marker({
        position: [z.lng, z.lat],
        content,
        anchor: 'bottom-center',
        zIndex: 80,
      })
      m.setMap(map)
      hallMarkers.push(m)
    })

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (my !== epoch || !map || !userMarker) return
          const lng = pos.coords.longitude
          const lat = pos.coords.latitude
          lastUserPos = [lng, lat]
          userMarker.setPosition(lastUserPos)
          if (followUser.value) {
            map.setCenter(lastUserPos)
          }
        },
        () => {
          /* 静默失败，不在地图上显示提示条 */
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
      )
    }

    await nextTick()
    map.resize()
  } catch (e) {
    if (my !== epoch) return
    mapError.value = e?.message || '地图初始化失败'
  } finally {
    if (my === epoch) mapLoading.value = false
  }
}

onActivated(() => {
  initMap().then(() => {
    nextTick(() => map?.resize())
  })
})

onDeactivated(() => {
  epoch++
  destroyMap()
})
</script>

<template>
  <div class="page">
    <p class="lead">
      接入高德地图与浏览器定位；蓝点与浅蓝扇区为实时位置与朝向（朝向需 HTTPS，iOS
      需点「开启朝向」授权）。
    </p>

    <section class="map-shell" aria-label="地图">
      <div ref="mapContainerRef" class="amap-host" />

      <div v-if="mapLoading" class="map-overlay muted">地图加载中…</div>
      <div v-else-if="mapError" class="map-overlay error">
        {{ mapError }}
      </div>

      <div class="float-tools">
        <button type="button" class="tool-btn" title="回到我的位置" @click="recenterOnUser">
          <span class="tool-icon" aria-hidden="true">⌖</span>
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ on: orientationEnabled }"
          title="指南针扇形（需授权）"
          @click="enableOrientation"
        >
          <span class="tool-icon" aria-hidden="true">▲</span>
        </button>
      </div>

      <p v-if="orientationHint" class="map-subhint">{{ orientationHint }}</p>
    </section>

    <ul class="zone-list">
      <li v-for="z in state.zones" :key="z.id" class="zone-item">
        <div class="zone-main">
          <span class="zone-name">{{ z.name }}</span>
          <span class="zone-hint">{{ z.hint }}</span>
        </div>
        <button type="button" class="go-btn" @click="flyToZone(z)">去这里</button>
      </li>
    </ul>

    <section class="card tip">
      <h2 class="h2">今日推荐</h2>
      <p>先完成「扫描」页一次模拟识别，可解锁积分与收藏品，再到「商店」试试兑换。</p>
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
  font-size: 0.95rem;
  color: var(--mq-text-muted);
  line-height: 1.55;
}

.map-shell {
  position: relative;
  border-radius: var(--mq-radius);
  border: 1px solid var(--mq-border);
  overflow: hidden;
  background: var(--mq-bg-elevated);
}

.amap-host {
  width: 100%;
  height: min(52vh, 380px);
  min-height: 260px;
}

.map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  font-size: 0.88rem;
  z-index: 5;
  pointer-events: none;
}

.map-overlay.error {
  background: rgba(250, 243, 233, 0.92);
  color: var(--mq-text);
  line-height: 1.5;
  pointer-events: auto;
}

.map-overlay.muted {
  background: rgba(250, 243, 233, 0.72);
  color: var(--mq-text-muted);
}

.float-tools {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  color: #333;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn.on {
  background: rgba(201, 162, 39, 0.25);
  color: var(--mq-accent);
  box-shadow: 0 4px 16px rgba(201, 162, 39, 0.2);
}

.tool-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.map-subhint {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 8px;
  z-index: 9;
  padding: 6px 10px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.zone-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zone-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--mq-bg-elevated);
  border-radius: var(--mq-radius);
  border: 1px solid var(--mq-border);
}

.zone-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.zone-name {
  font-weight: 600;
  font-size: 1rem;
}

.zone-hint {
  font-size: 0.8rem;
  color: var(--mq-text-muted);
}

.go-btn {
  flex-shrink: 0;
  min-height: var(--mq-tap-min);
  padding: 0 16px;
  border-radius: 10px;
  background: var(--mq-surface-soft);
  color: var(--mq-accent);
  font-size: 0.85rem;
  font-weight: 600;
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
  font-size: 0.88rem;
  color: var(--mq-text-muted);
  line-height: 1.55;
}
</style>
