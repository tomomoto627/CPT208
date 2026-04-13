<script setup>
import { ref } from 'vue'
import avatarImg from '@/assets/avatar1.png'
import amphoraImg from '@/assets/storylens/amphora.png'

const draftTitle = ref('')
const draftContent = ref('')
const composing = ref(false)

const basePosts = [
  {
    id: 'c1',
    author: 'Marcus',
    timeAgo: '3h ago',
    title: 'Bronze Hall Notes',
    text: 'Found an inscription detail near the eastern showcase. The carving depth changes under side light.',
    image: amphoraImg,
    likes: 24,
    comments: 8,
    saves: 5,
    liked: false,
    saved: false,
    commented: false,
  },
  {
    id: 'c2',
    author: 'Elena',
    timeAgo: '5h ago',
    title: 'Quiet Afternoon Route',
    text: 'Best sequence today: Sculpture Wing -> Ceramics -> Ritual Gallery. Great for slow pacing and audio guide.',
    likes: 19,
    comments: 6,
    saves: 11,
    liked: false,
    saved: false,
    commented: false,
  },
  {
    id: 'c3',
    author: 'Noah',
    timeAgo: '8h ago',
    title: 'Texture Study',
    text: 'Comparing glaze reflection between two dynasties gave me a better timeline sense than labels alone.',
    likes: 31,
    comments: 12,
    saves: 14,
    liked: false,
    saved: false,
    commented: false,
  },
]

const titlePool = [
  'Hallway Discovery',
  'Ceramic Pattern Thread',
  'Stone Relief Detail',
  'Late Afternoon Walk',
  'Archive Corner Find',
  'Quiet Gallery Moment',
  'Mini Route Update',
  'Light and Shadow Note',
]

const textPool = [
  'Noticed tiny restoration marks near the lower frame; they become visible only from a side angle.',
  'The central hall felt much calmer after 4pm, perfect for listening to the full story narration.',
  'Tried comparing two exhibits by motif first, then label date. It made the timeline easier to remember.',
  'Found a hidden interpretation card beside the display case, worth checking on your next pass.',
  'The route between Ceramics and Sculpture has a small corner with great contextual maps.',
  'Spotted recurring wave symbols across different periods, likely tied to travel and trade themes.',
]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildExtraPosts(count = 8) {
  const authorPool = ['Marcus', 'Elena', 'Noah', 'Ivy', 'Luca', 'Mina', 'Leo', 'Aria']
  const timePool = ['12m ago', '28m ago', '1h ago', '2h ago', '4h ago', '6h ago']
  return Array.from({ length: count }, (_, idx) => ({
    id: `x${idx + 1}`,
    author: authorPool[randomInt(0, authorPool.length - 1)],
    timeAgo: timePool[randomInt(0, timePool.length - 1)],
    title: titlePool[randomInt(0, titlePool.length - 1)],
    text: textPool[randomInt(0, textPool.length - 1)],
    image: idx % 4 === 0 ? amphoraImg : '',
    likes: randomInt(8, 56),
    comments: randomInt(1, 16),
    saves: randomInt(2, 19),
    liked: false,
    saved: false,
    commented: false,
  }))
}

const feedItems = ref([...basePosts, ...buildExtraPosts(9)])

function onComposerEntry() {
  composing.value = true
}

function closeComposer() {
  composing.value = false
  draftTitle.value = ''
  draftContent.value = ''
}

function submitPost() {
  const content = draftContent.value.trim()
  if (!content) return
  const title = draftTitle.value.trim()

  feedItems.value.unshift({
    id: `u${Date.now()}`,
    author: 'Story Seeker',
    timeAgo: 'Just now',
    title,
    text: content,
    image: '',
    likes: 0,
    comments: 0,
    saves: 0,
    liked: false,
    saved: false,
    commented: false,
  })

  draftTitle.value = ''
  draftContent.value = ''
  composing.value = false
}

function toggleLike(item) {
  item.liked = !item.liked
  item.likes += item.liked ? 1 : -1
  if (item.likes < 0) item.likes = 0
}

function toggleSave(item) {
  item.saved = !item.saved
  item.saves += item.saved ? 1 : -1
  if (item.saves < 0) item.saves = 0
}

function toggleComment(item) {
  item.commented = !item.commented
  item.comments += item.commented ? 1 : -1
  if (item.comments < 0) item.comments = 0
}

function socialProof(item) {
  const group = Math.max(5, Math.floor(item.likes / 4))
  return `${item.author} 等 ${group} 人刚刚点赞了这条故事`
}
</script>

<template>
  <div class="community-page" :class="{ expanded: composing }">
    <section class="community-top-fixed">
      <h2 class="top-title">Community Feed</h2>
      <p class="top-subtitle">Explore & Share more story</p>
      <div class="composer-layer">
        <div class="composer-card" :class="{ expanded: composing }" @click="!composing && onComposerEntry()">
          <div class="composer-row">
            <img class="avatar" :src="avatarImg" alt="User avatar" />
            <div class="composer-copy">
              <p class="composer-title">Share your story</p>
              <p class="composer-hint">What classic story did you find today?</p>
            </div>
            <button type="button" class="composer-btn" aria-label="Open composer" @click.stop="onComposerEntry">
              <svg class="composer-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="7" width="16" height="11" rx="2" />
                <circle cx="12" cy="12.5" r="2.6" />
                <path d="M8.5 7 9.8 5.4h4.4L15.5 7" />
              </svg>
            </button>
          </div>

          <div v-if="composing" class="composer-expanded" @click.stop>
            <input
              v-model="draftTitle"
              class="composer-title-input"
              type="text"
              maxlength="60"
              placeholder="Title (optional)"
            />
            <textarea
              v-model="draftContent"
              class="composer-textarea"
              rows="3"
              maxlength="280"
              placeholder="Share a moment, detail, or story you discovered..."
            />
            <div class="composer-actions">
              <span class="count">{{ draftContent.length }}/280</span>
              <div class="actions-right">
                <button type="button" class="ghost-btn" @click="closeComposer">Cancel</button>
                <button type="button" class="publish-btn" :disabled="!draftContent.trim()" @click="submitPost">
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="feed-layer" aria-label="Community feed">
      <ul class="feed-list">
        <li v-for="p in feedItems" :key="p.id" class="post-card">
          <div class="post-head">
            <div class="post-author">
              <img class="post-avatar" :src="avatarImg" alt="" />
              <span class="author-name">{{ p.author }}</span>
            </div>
            <span class="post-time">{{ p.timeAgo }}</span>
          </div>
          <div v-if="p.image" class="thumb-wrap">
            <img :src="p.image" class="thumb" alt="" />
          </div>
          <h3 v-if="p.title" class="card-title">{{ p.title }}</h3>
          <p class="card-text">{{ p.text }}</p>
          <div class="meta" aria-hidden="true">
            <button type="button" class="meta-btn" :class="{ on: p.liked }" @click="toggleLike(p)">
              {{ p.liked ? '♥' : '♡' }} {{ p.likes }}
            </button>
            <button type="button" class="meta-btn" :class="{ on: p.commented }" @click="toggleComment(p)">
              {{ p.commented ? '●' : '◌' }} {{ p.comments }}
            </button>
            <button type="button" class="meta-btn" :class="{ on: p.saved }" @click="toggleSave(p)">
              {{ p.saved ? '★' : '☆' }} {{ p.saves }}
            </button>
          </div>
          <p class="social-proof">{{ socialProof(p) }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.community-page {
  --top-fixed-h: 152px;
  display: flex;
  min-height: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.community-page.expanded {
  --top-fixed-h: 326px;
}

.community-top-fixed {
  position: fixed;
  top: var(--mq-safe-top);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  z-index: 40;
  padding: 6px 0 0;
  background: #faf3e9;
  border-bottom: 1px solid rgba(130, 112, 88, 0.08);
  box-sizing: border-box;
}

.top-title {
  margin: 0;
  font-size: 1.14rem;
  font-weight: 700;
  color: #3f372f;
  text-align: center;
}

.top-subtitle {
  margin: 2px 0 10px;
  font-size: 0.8rem;
  color: #84786a;
  text-align: center;
}

.composer-layer {
  background: transparent;
  padding: 0 12px;
  margin-bottom: -24px;
}

.composer-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fffaf1;
  border: 1px solid rgba(130, 112, 88, 0.16);
  box-shadow: 0 6px 14px rgba(86, 65, 35, 0.08);
}

.composer-card.expanded {
  padding: 12px;
}

.community-page.expanded .composer-layer {
  margin-bottom: 0;
}

.composer-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(176, 143, 86, 0.28);
  flex-shrink: 0;
}

.composer-copy {
  min-width: 0;
  flex: 1;
  text-align: center;
}

.composer-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 650;
  color: #473f35;
}

.composer-hint {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #7a6f62;
  line-height: 1.35;
  text-align: center;
}

.composer-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid rgba(176, 143, 86, 0.35);
  background: #b98a3d;
  color: #fff6e6;
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.composer-icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.composer-expanded {
  border-top: 1px solid rgba(130, 112, 88, 0.12);
  padding-top: 10px;
}

.composer-title-input {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(130, 112, 88, 0.2);
  background: #fffdf8;
  color: #3a332b;
  margin-bottom: 8px;
}

.composer-title-input::placeholder {
  color: #8a7d6d;
}

.composer-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(130, 112, 88, 0.2);
  background: #fffdf8;
  color: #3a332b;
  min-height: 84px;
  line-height: 1.45;
  resize: vertical;
}

.composer-textarea::placeholder {
  color: #8a7d6d;
}

.composer-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.actions-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.count {
  font-size: 0.75rem;
  color: #7a6f62;
}

.ghost-btn,
.publish-btn {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 650;
}

.ghost-btn {
  border: 1px solid rgba(130, 112, 88, 0.22);
  background: #f8f1e3;
  color: #7a6f62;
}

.publish-btn {
  border: 1px solid rgba(176, 143, 86, 0.35);
  background: #f3e9d8;
  color: #9b753f;
}

.publish-btn:disabled {
  opacity: 0.45;
}

.feed-layer {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: calc(var(--top-fixed-h) + 4px);
  padding-bottom: calc(10px + var(--mq-safe-bottom));
}

.feed-list {
  list-style: none;
  margin: 0;
  padding: 0 3px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.post-card {
  padding: 12px;
  border-radius: var(--mq-radius);
  background: #fffdf8;
  border: 1px solid rgba(130, 112, 88, 0.17);
}

.post-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.post-author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.post-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(130, 112, 88, 0.25);
  flex-shrink: 0;
}

.author-name {
  font-size: 0.9rem;
  font-weight: 650;
  color: #3a332b;
}

.post-time {
  font-size: 0.75rem;
  color: #8f8374;
  flex-shrink: 0;
}

.thumb-wrap {
  margin-bottom: 10px;
  border-radius: 10px;
  overflow: hidden;
  background: #f2e7d5;
  border: 1px solid rgba(130, 112, 88, 0.14);
}

.thumb {
  width: 100%;
  height: 132px;
  object-fit: cover;
  display: block;
}

.card-title {
  font-size: 1.12rem;
  font-weight: 700;
  color: #3a332b;
  line-height: 1.25;
}

.card-text {
  margin-top: 6px;
  font-size: 0.84rem;
  line-height: 1.46;
  color: #5f564b;
}

.meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8e7a59;
}

.meta-btn {
  min-height: 24px;
  padding: 0;
  border-radius: 0;
  border: 0;
  background: transparent;
  color: #8e7a59;
  font-size: 0.8rem;
  font-weight: 550;
  line-height: 1;
  transition: transform 0.16s ease, color 0.16s ease;
}

.meta-btn.on {
  color: #b1843d;
  transform: translateY(-1px);
  animation: meta-pop 0.2s ease;
}

.social-proof {
  margin-top: 8px;
  font-size: 0.74rem;
  color: #8e7a59;
  line-height: 1.35;
}

@keyframes meta-pop {
  0% {
    transform: scale(0.96);
  }
  60% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}
</style>
