<script setup>
import { computed, reactive, ref } from 'vue'
import heroBg from '@/assets/loginbackground.png'
import amphoraImg from '@/assets/storylens/amphora.png'
import avatarImg from '@/assets/avatar1.png'
import CollectionView from './CollectionView.vue'

const emit = defineEmits(['back'])

const activeTab = ref('posts')
const tabs = [
  { key: 'posts', label: 'Posts' },
  { key: 'collection', label: 'Collection' },
  { key: 'likes', label: 'Likes' },
]

const dataMap = reactive({
  posts: [
    {
      id: 'p1',
      author: 'Story Seeker',
      timeAgo: '3h ago',
      title: 'Bronze Hall Notes',
      text: 'Found an inscription detail near the eastern showcase. The carving depth changes under side light.',
      image: amphoraImg,
      likes: 24,
      comments: 8,
      saves: 5,
      liked: false,
      commented: false,
      saved: false,
    },
    {
      id: 'p2',
      author: 'Story Seeker',
      timeAgo: '6h ago',
      title: 'Quiet Afternoon Route',
      text: 'Best sequence today: Sculpture Wing -> Ceramics -> Ritual Gallery. Great for slow pacing and audio guide.',
      likes: 19,
      comments: 6,
      saves: 11,
      liked: false,
      commented: false,
      saved: false,
    },
    {
      id: 'p3',
      author: 'Story Seeker',
      timeAgo: '9h ago',
      title: 'Texture Study',
      text: 'Comparing glaze reflection between two dynasties gave me a better timeline sense than labels alone.',
      likes: 31,
      comments: 12,
      saves: 14,
      liked: false,
      commented: false,
      saved: false,
    },
  ],
  likes: [
    {
      id: 'l1',
      author: 'Marcus',
      timeAgo: '4d ago',
      title: 'Saved: Marble Portrait Thread',
      text: 'Excellent breakdown of facial proportion conventions in Roman-era portrait sculpture.',
      likes: 56,
      comments: 14,
      saves: 23,
      liked: false,
      commented: false,
      saved: false,
    },
    {
      id: 'l2',
      author: 'Elena',
      timeAgo: '5d ago',
      title: 'Saved: Ceramics Color Atlas',
      text: 'A practical visual glossary for identifying glaze families and kiln atmosphere outcomes.',
      image: amphoraImg,
      likes: 48,
      comments: 11,
      saves: 29,
      liked: false,
      commented: false,
      saved: false,
    },
    {
      id: 'l3',
      author: 'Noah',
      timeAgo: '1w ago',
      title: 'Saved: Guided Reflection Prompt',
      text: 'Three short questions that make each exhibit stop more memorable without spending extra time.',
      likes: 21,
      comments: 3,
      saves: 9,
      liked: false,
      commented: false,
      saved: false,
    },
  ],
})

const activeItems = computed(() =>
  activeTab.value === 'collection' ? [] : dataMap[activeTab.value] || [],
)

function toggleLike(item) {
  item.liked = !item.liked
  item.likes += item.liked ? 1 : -1
  if (item.likes < 0) item.likes = 0
}

function toggleComment(item) {
  item.commented = !item.commented
  item.comments += item.commented ? 1 : -1
  if (item.comments < 0) item.comments = 0
}

function toggleSave(item) {
  item.saved = !item.saved
  item.saves += item.saved ? 1 : -1
  if (item.saves < 0) item.saves = 0
}

function socialProof(item) {
  const group = Math.max(5, Math.floor(item.likes / 4))
  return `${item.author} 等 ${group} 人刚刚点赞了这条故事`
}
</script>

<template>
  <div class="profile-page">
    <section class="profile-header">
      <div class="header-bg" :style="{ backgroundImage: `url(${heroBg})` }" aria-hidden="true" />

      <div class="header-top">
        <button type="button" class="leave-btn" aria-label="Go back" @click="emit('back')">
          <svg class="leave-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6 9 12l6 6" />
          </svg>
        </button>
        <button type="button" class="edit-btn">Edit</button>
      </div>

      <div class="identity">
        <img class="avatar" :src="avatarImg" alt="Story Seeker avatar" />
        <p class="name">Story Seeker</p>
        <p class="bio">Collecting fragments of history, one room at a time.</p>
      </div>
    </section>

    <section class="profile-sheet" aria-label="Profile content">
      <div class="tab-header">
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="feed">
        <CollectionView v-if="activeTab === 'collection'" class="embedded-collection" />
        <article v-for="item in activeItems" :key="item.id" class="card">
          <div class="post-head">
            <div class="post-author">
              <img class="post-avatar" :src="avatarImg" alt="" />
              <span class="author-name">{{ item.author }}</span>
            </div>
            <span class="post-time">{{ item.timeAgo }}</span>
          </div>
          <div v-if="item.image" class="thumb-wrap">
            <img :src="item.image" class="thumb" alt="" />
          </div>
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-text">{{ item.text }}</p>
          <div class="meta">
            <button type="button" class="meta-btn" :class="{ on: item.liked }" @click="toggleLike(item)">
              {{ item.liked ? '♥' : '♡' }} {{ item.likes }}
            </button>
            <button type="button" class="meta-btn" :class="{ on: item.commented }" @click="toggleComment(item)">
              {{ item.commented ? '●' : '◌' }} {{ item.comments }}
            </button>
            <button type="button" class="meta-btn" :class="{ on: item.saved }" @click="toggleSave(item)">
              {{ item.saved ? '★' : '☆' }} {{ item.saves }}
            </button>
          </div>
          <p class="social-proof">{{ socialProof(item) }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f6efe4;
  color: #2f2a24;
}

.profile-header {
  position: relative;
  flex: 0 0 39%;
  min-height: 220px;
  padding: 16px 16px 18px;
  overflow: hidden;
  isolation: isolate;
}

.header-bg {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: right top;
  opacity: 0.12;
  z-index: 0;
}

.header-top,
.identity {
  position: relative;
  z-index: 1;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.edit-btn {
  min-height: 30px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #9b753f;
  font-size: 0.9rem;
  font-weight: 650;
}

.leave-btn {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #3a332b;
  font-size: 1rem;
  font-weight: 650;
  padding: 0;
}

.leave-icon {
  width: 18px;
  height: 18px;
  display: block;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.identity {
  margin-top: 16px;
  text-align: center;
}

.avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  margin: 0 auto;
  display: block;
  object-fit: cover;
  background: #f3e5cf;
  border: 1px solid rgba(176, 143, 86, 0.38);
}

.name {
  margin: 10px 0 0;
  font-size: 1.02rem;
  font-weight: 650;
}

.bio {
  margin: 6px auto 0;
  max-width: 290px;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #6f655a;
}

.profile-sheet {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #faf5ec;
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  border-top: 1px solid rgba(130, 112, 88, 0.14);
}

.tab-header {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #f9f3e9;
  border-bottom: 1px solid rgba(130, 112, 88, 0.14);
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: stretch;
  padding: 0 6px;
  background: rgba(249, 243, 233, 0.97);
}

.tab-btn {
  min-height: 46px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #857766;
  font-size: 0.9rem;
  font-weight: 560;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-btn.active {
  color: #3f372f;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 0;
  height: 2px;
  border-radius: 999px;
  background: #b48a4e;
}

.feed {
  padding: 12px 14px calc(18px + var(--mq-safe-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.embedded-collection {
  padding-bottom: 2px;
}

.card {
  border-radius: 14px;
  border: 1px solid rgba(130, 112, 88, 0.17);
  background: #fffdf8;
  padding: 12px;
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
