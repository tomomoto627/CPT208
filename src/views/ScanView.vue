<script setup>
import { ref, inject, onActivated, onDeactivated, onUnmounted, nextTick, watch } from 'vue'

const { state, scanArtifact } = inject('museum')
const selectedId = ref('porcelain-vase')
const showResult = ref(false)
const modelViewerError = ref('')
const modelViewerLoading = ref(false)

const videoRef = ref(null)
const stream = ref(null)
const cameraError = ref('')
const cameraStarting = ref(false)
const mirrorVideo = ref(false)

const storySpeaking = ref(false)
const storySpeechError = ref('')
const storyVoices = ref([])
const selectedVoiceURI = ref(localStorage.getItem('mq_story_voice_uri') || '')
let storyUtter = null

/** 递增以作废进行中的 getUserMedia（快速切走 Tab 时避免把旧流绑回 video） */
let cameraEpoch = 0

function stopCamera() {
  cameraEpoch++
  mirrorVideo.value = false
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop())
    stream.value = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

function cameraErrorMessage(err) {
  if (!err) return '无法打开摄像头'
  const name = err.name || ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return '已拒绝摄像头权限，请在浏览器设置中允许访问'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return '未检测到摄像头设备'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return '摄像头被占用或不可用，请关闭其他应用后重试'
  }
  if (name === 'OverconstrainedError') {
    return '当前设备不满足拍摄要求，将尝试默认摄像头'
  }
  if (name === 'SecurityError') {
    return '需要 HTTPS 或 localhost 才能使用摄像头'
  }
  return err.message || '无法打开摄像头'
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = '当前浏览器不支持摄像头（需较新 Chrome / Safari / 微信内置浏览器等）'
    return
  }

  if (stream.value) return

  const epoch = cameraEpoch
  cameraStarting.value = true
  cameraError.value = ''

  const tryConstraints = [
    {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    { video: { facingMode: 'user' }, audio: false },
    { video: true, audio: false },
  ]

  let lastErr = null
  let attemptStream = null

  for (const constraints of tryConstraints) {
    if (epoch !== cameraEpoch) {
      if (attemptStream) {
        attemptStream.getTracks().forEach((t) => t.stop())
        attemptStream = null
      }
      cameraStarting.value = false
      return
    }
    try {
      if (attemptStream) {
        attemptStream.getTracks().forEach((t) => t.stop())
        attemptStream = null
      }
      attemptStream = await navigator.mediaDevices.getUserMedia(constraints)
      if (epoch !== cameraEpoch) {
        attemptStream.getTracks().forEach((t) => t.stop())
        attemptStream = null
        cameraStarting.value = false
        return
      }
      const s = attemptStream
      stream.value = s
      const track = s.getVideoTracks()[0]
      const facing = track?.getSettings?.().facingMode
      mirrorVideo.value = facing === 'user'

      await nextTick()
      const el = videoRef.value
      if (el) {
        el.srcObject = s
        el.setAttribute('playsinline', '')
        el.setAttribute('webkit-playsinline', '')
        el.muted = true
        try {
          await el.play()
        } catch {
          /* 部分浏览器需用户手势，扫描按钮可再次触发 play */
        }
      }
      if (epoch !== cameraEpoch) {
        stopCamera()
        cameraStarting.value = false
        return
      }
      cameraError.value = ''
      cameraStarting.value = false
      return
    } catch (e) {
      lastErr = e
      if (attemptStream) {
        attemptStream.getTracks().forEach((t) => t.stop())
        attemptStream = null
      }
    }
  }

  if (epoch !== cameraEpoch) {
    cameraStarting.value = false
    return
  }
  cameraError.value = cameraErrorMessage(lastErr)
  cameraStarting.value = false
}

async function retryCamera() {
  stopCamera()
  await startCamera()
}

onActivated(() => {
  startCamera()
})

onDeactivated(() => {
  stopCamera()
})

onUnmounted(() => {
  stopCamera()
  stopStorySpeech()
})

function loadStoryVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis?.getVoices) return
  const vs = window.speechSynthesis.getVoices() || []
  storyVoices.value = vs
  if (!selectedVoiceURI.value && vs.length) {
    const best = pickDefaultChineseVoice(vs)
    if (best?.voiceURI) selectedVoiceURI.value = best.voiceURI
  }
}

function pickDefaultChineseVoice(vs) {
  const preferGoogleMandarinCN = (v) => {
    const name = (v.name || '').toLowerCase()
    const lang = (v.lang || '').toLowerCase()
    const isGoogle = name.includes('google')
    const isMandarin =
      /普通话|中國大陸|中国大陆|mandarin/i.test(v.name || '') || name.includes('putonghua')
    return isGoogle && isMandarin && lang.startsWith('zh-cn')
  }

  const exact = vs.find(preferGoogleMandarinCN)
  if (exact) return exact

  const isZh = (v) =>
    (v.lang || '').toLowerCase().startsWith('zh') ||
    /zh|中文|普通话|國語|国语|mandarin/i.test(v.name || '')

  const zhs = vs.filter(isZh)
  const pool = zhs.length ? zhs : vs

  const score = (v) => {
    const name = (v.name || '').toLowerCase()
    const lang = (v.lang || '').toLowerCase()
    let s = 0
    if (lang.startsWith('zh-cn')) s += 40
    if (lang.startsWith('zh')) s += 10
    if (/xiaoxiao|yunxi|yunyang|xiaoyi|xiaohan|xiaomo|xiaorui|xiaoqiu/.test(name)) s += 60
    if (/microsoft|edge|natural/.test(name)) s += 30
    if (/google/.test(name)) s += 20
    if (/siri|ting-ting|meijia|li-mu/.test(name)) s += 10
    return s
  }

  return [...pool].sort((a, b) => score(b) - score(a))[0] || null
}

watch(showResult, async (open) => {
  if (!open) {
    modelViewerError.value = ''
    modelViewerLoading.value = false
    stopStorySpeech()
    if (videoRef.value && stream.value) {
      try {
        await videoRef.value.play()
      } catch {
        /* ignore */
      }
    }
  } else {
    loadStoryVoices()
    const art = state.artifacts.find((a) => a.id === selectedId.value)
    if (art?.modelGlb) {
      modelViewerError.value = ''
      modelViewerLoading.value = true
    }
  }
})

function onModelLoaded() {
  modelViewerLoading.value = false
  modelViewerError.value = ''
}

function onModelError() {
  modelViewerLoading.value = false
  modelViewerError.value =
    '3D 模型加载失败。若已部署线上，请确认已上传 public/models 下对应 .glb，并重新构建/发布。'
}

async function runScan() {
  const v = videoRef.value
  if (v && stream.value) {
    v.play().catch(() => {})
  }
  await import('@google/model-viewer')
  scanArtifact(selectedId.value)
  showResult.value = true
}

function closeResult() {
  showResult.value = false
}

const currentArt = () =>
  state.artifacts.find((a) => a.id === selectedId.value)

function stopStorySpeech() {
  storySpeechError.value = ''
  storySpeaking.value = false
  storyUtter = null
  try {
    window.speechSynthesis?.cancel?.()
  } catch {
    /* ignore */
  }
}

function onVoiceChange() {
  localStorage.setItem('mq_story_voice_uri', selectedVoiceURI.value || '')
  if (storySpeaking.value) {
    stopStorySpeech()
    toggleStorySpeech()
  }
}

function toggleStorySpeech() {
  storySpeechError.value = ''
  const art = currentArt()
  const text = art?.story?.trim?.() || ''
  if (!text) return

  if (storySpeaking.value) {
    stopStorySpeech()
    return
  }

  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    storySpeechError.value = '当前浏览器不支持语音播放'
    return
  }

  stopStorySpeech()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  const v = storyVoices.value.find((x) => x.voiceURI === selectedVoiceURI.value)
  if (v) u.voice = v
  u.rate = 1
  u.pitch = 1
  u.volume = 1
  u.onend = () => {
    storySpeaking.value = false
    storyUtter = null
  }
  u.onerror = () => {
    storySpeaking.value = false
    storyUtter = null
    storySpeechError.value = '语音播放失败（可能被系统/浏览器限制）'
  }
  storyUtter = u
  storySpeaking.value = true
  try {
    window.speechSynthesis.speak(u)
  } catch {
    storySpeaking.value = false
    storyUtter = null
    storySpeechError.value = '语音播放失败'
  }
}
</script>

<template>
  <div class="page">
    <p class="lead">
      进入本页会自动请求摄像头权限（后置优先）。识别结果仍可用下方下拉模拟，便于对接后端前演示流程。
    </p>

    <div class="camera" aria-label="相机预览">
      <video
        ref="videoRef"
        class="video"
        :class="{ mirror: mirrorVideo }"
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

      <div v-if="cameraStarting && !stream" class="camera-status">正在开启摄像头…</div>
      <div v-else-if="cameraError" class="camera-status error">
        <p>{{ cameraError }}</p>
        <button type="button" class="retry-btn" @click="retryCamera">重试</button>
      </div>
      <p v-else class="camera-hint">将二维码或展品置于框内 · 点「扫描」完成识别</p>
    </div>

    <label class="field">
      <span class="field-label">模拟识别目标（无真实识别时）</span>
      <select v-model="selectedId" class="select">
        <option v-for="a in state.artifacts" :key="a.id" :value="a.id">
          {{ a.name }} · {{ a.hallName }}
        </option>
      </select>
    </label>

    <button type="button" class="scan-btn" @click="runScan">扫描</button>

    <div v-if="showResult && currentArt()" class="sheet" @click.self="closeResult">
      <div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="scan-title">
        <div class="sheet-head">
          <h2 id="scan-title" class="sheet-title">{{ currentArt().name }}</h2>
          <div class="head-tools">
            <label class="voice">
              <span class="sr-only">朗读声音</span>
              <select
                v-model="selectedVoiceURI"
                class="voice-select"
                :disabled="!storyVoices.length"
                @change="onVoiceChange"
                @mousedown="loadStoryVoices"
                @touchstart.passive="loadStoryVoices"
              >
                <option value="" disabled>
                  {{ storyVoices.length ? '选择声音' : '无可用语音' }}
                </option>
                <option v-for="v in storyVoices" :key="v.voiceURI" :value="v.voiceURI">
                  {{ v.name }}（{{ v.lang }}）
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
              {{ storySpeaking ? '停止' : '播放故事' }}
            </button>
          </div>
        </div>
        <p class="sheet-sub">{{ currentArt().hallName }} · +{{ currentArt().points }} 积分（首次）</p>

        <div v-if="currentArt().modelGlb" class="model-block">
          <p class="model-hint">单指拖动旋转视角 · 双指捏合缩放 · 可转到顶部、底部观察</p>
          <div class="model-viewer-wrap">
            <div v-if="modelViewerLoading && !modelViewerError" class="model-loading">
              模型加载中…
            </div>
            <p v-if="modelViewerError" class="model-error">{{ modelViewerError }}</p>
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
        <p v-if="storySpeechError" class="story-error" role="status">{{ storySpeechError }}</p>
        <div class="sheet-actions">
          <button type="button" class="btn-secondary" @click="closeResult">关闭</button>
          <button type="button" class="btn-primary" @click="closeResult">收入收藏</button>
        </div>
      </div>
    </div>
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
  line-height: 1.5;
}

.camera {
  position: relative;
  height: 240px;
  border-radius: var(--mq-radius);
  background: #FAF3E9;
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
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: rgba(250, 243, 233, 0.9);
  font-size: 0.88rem;
  color: var(--mq-text-muted);
  text-align: center;
  z-index: 2;
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

.field-label {
  font-size: 0.85rem;
  color: var(--mq-text-muted);
}

.select {
  min-height: var(--mq-tap-min);
  padding: 0 14px;
  border-radius: 10px;
  background: var(--mq-bg-elevated);
  border: 1px solid var(--mq-border);
  color: var(--mq-text);
  appearance: none;
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
  background: radial-gradient(ellipse at center, #f5ece0 0%, #FAF3E9 70%);
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
  background: var(--mq-surface-soft);
  color: var(--mq-text);
}

.btn-primary {
  background: var(--mq-accent-soft);
  color: var(--mq-accent);
  border: 1px solid rgba(201, 162, 39, 0.4);
}
</style>
