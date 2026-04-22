<script setup>
import { computed, inject, reactive, ref } from 'vue'
import heroBg from '@/assets/loginbackground.png'
import avatarImg from '@/assets/avatar1.png'
import avatar2Img from '@/assets/avatar2.jpg'
import avatar3Img from '@/assets/avatar3.jpg'
import avatar4Img from '@/assets/avatar4.jpg'
import bookmarkSetImg from '@/assets/BookmarkSet.png'
import postcardBoxImg from '@/assets/PostcardBox.png'
import museumRouteToteImg from '@/assets/MuseumRouteTote.png'
import deskCalendarImg from '@/assets/StoryLensDeskCalendar.png'
import CollectionView from './CollectionView.vue'

const emit = defineEmits(['back'])
const social = inject('social', null)

const activeTab = ref('posts')
const selectedPost = ref(null)
const detailCommentText = ref('')
const editingProfile = ref(false)
const profileName = ref('Story Seeker')
const profileBio = ref('Collecting fragments of history, one room at a time.')
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
      avatar: avatarImg,
      timeAgo: '22m ago',
      title: 'Route Notes for New Arrivals',
      text: 'BookmarkSet and StoryLensDeskCalendar work well together as a themed museum gift pair.',
      image: deskCalendarImg,
      likes: 16,
      comments: 4,
      saves: 7,
      liked: false,
      commented: false,
      saved: false,
      isMine: true,
      commentList: [
        {
          id: 'p1m1',
          author: 'Ethan',
          avatar: avatar2Img,
          text: 'Nice pairing idea. The style is consistent.',
          timeAgo: '10m ago',
          likes: 3,
          liked: false,
        },
        {
          id: 'p1m2',
          author: 'Mia',
          avatar: avatar3Img,
          text: 'This combo would look great on a desk setup.',
          timeAgo: '16m ago',
          likes: 2,
          liked: false,
        },
      ],
    },
    {
      id: 'p2',
      author: 'Story Seeker',
      avatar: avatarImg,
      timeAgo: '3h ago',
      title: 'MuseumRouteTote Packing List',
      text: 'Tried a lightweight setup today: museum guide, notebook, bottle, and charger all fit comfortably.',
      image: museumRouteToteImg,
      likes: 20,
      comments: 5,
      saves: 9,
      liked: false,
      commented: false,
      saved: false,
      isMine: true,
      commentList: [
        {
          id: 'p2m1',
          author: 'Leo',
          avatar: avatar4Img,
          text: 'Packing list is super practical.',
          timeAgo: '2h ago',
          likes: 4,
          liked: false,
        },
        {
          id: 'p2m2',
          author: 'Ethan',
          avatar: avatar2Img,
          text: 'I use almost the same setup every visit.',
          timeAgo: '2h ago',
          likes: 1,
          liked: false,
        },
      ],
    },
  ],
  likes: [
    {
      id: 'l1',
      author: 'Ethan',
      avatar: avatar2Img,
      timeAgo: '12m ago',
      title: 'BookmarkSet Drop',
      text: 'BookmarkSet is now live in the store feed. The material texture looks even better in person.',
      image: bookmarkSetImg,
      likes: 32,
      comments: 9,
      saves: 13,
      liked: true,
      commented: false,
      saved: true,
      isMine: false,
      commentList: [
        {
          id: 'l1m1',
          author: 'Nora',
          avatar: avatarImg,
          text: 'The close-up texture is amazing. Great capture.',
          timeAgo: '6m ago',
          likes: 5,
          liked: false,
        },
        {
          id: 'l1m2',
          author: 'Mia',
          avatar: avatar3Img,
          text: 'This set really matches the bronze theme.',
          timeAgo: '9m ago',
          likes: 3,
          liked: false,
        },
      ],
    },
    {
      id: 'l2',
      author: 'Mia',
      avatar: avatar3Img,
      timeAgo: '35m ago',
      title: 'PostcardBox Color Study',
      text: 'PostcardBox matches the Hall B glaze palette nicely. Great pick for a compact gift set.',
      image: postcardBoxImg,
      likes: 27,
      comments: 7,
      saves: 10,
      liked: true,
      commented: false,
      saved: true,
      isMine: false,
      commentList: [
        {
          id: 'l2m1',
          author: 'Ethan',
          avatar: avatar2Img,
          text: 'Color tone is very elegant.',
          timeAgo: '20m ago',
          likes: 2,
          liked: false,
        },
        {
          id: 'l2m2',
          author: 'Nora',
          avatar: avatarImg,
          text: 'Looks perfect for journaling inserts.',
          timeAgo: '26m ago',
          likes: 1,
          liked: false,
        },
      ],
    },
    {
      id: 'l3',
      author: 'Leo',
      avatar: avatar4Img,
      timeAgo: '1h ago',
      title: 'MuseumRouteTote On Route',
      text: "Used MuseumRouteTote during today's gallery walk. It fits a notebook, water bottle, and guide map.",
      image: museumRouteToteImg,
      likes: 41,
      comments: 14,
      saves: 18,
      liked: true,
      commented: false,
      saved: true,
      isMine: false,
      commentList: [
        {
          id: 'l3m1',
          author: 'Mia',
          avatar: avatar3Img,
          text: 'The tote looks sturdy and roomy.',
          timeAgo: '38m ago',
          likes: 4,
          liked: false,
        },
        {
          id: 'l3m2',
          author: 'Nora',
          avatar: avatarImg,
          text: 'I like the neutral color palette here.',
          timeAgo: '48m ago',
          likes: 2,
          liked: false,
        },
      ],
    },
  ],
})

const activeItems = computed(() => {
  if (activeTab.value === 'collection') return []
  if (activeTab.value === 'likes') return social?.state?.savedPosts || []
  return dataMap[activeTab.value] || []
})

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
  if (item.saved) {
    social?.savePost?.(item)
  } else {
    social?.unsavePost?.(item.id)
  }
}

function toggleCommentLike(comment) {
  comment.liked = !comment.liked
  comment.likes += comment.liked ? 1 : -1
  if (comment.likes < 0) comment.likes = 0
}

function socialProof(item) {
  const group = Math.max(5, Math.floor(item.likes / 4))
  return `${item.author} and ${group} others just liked this story`
}

function openPost(item) {
  selectedPost.value = item
  detailCommentText.value = ''
}

function closePost() {
  selectedPost.value = null
  detailCommentText.value = ''
}

function setActiveTab(tabKey) {
  activeTab.value = tabKey
  selectedPost.value = null
  detailCommentText.value = ''
}

function toggleProfileEdit() {
  if (editingProfile.value) {
    profileName.value = profileName.value.trim() || 'Story Seeker'
    profileBio.value = profileBio.value.trim() || 'Collecting fragments of history, one room at a time.'
    editingProfile.value = false
    return
  }
  editingProfile.value = true
}

function submitDetailComment() {
  if (!selectedPost.value) return
  const text = detailCommentText.value.trim()
  if (!text) return

  if (!selectedPost.value.commentList) {
    selectedPost.value.commentList = []
  }

  selectedPost.value.commentList.unshift({
    id: `pm${Date.now()}`,
    author: 'Story Seeker',
    avatar: avatarImg,
    text,
    timeAgo: 'Just now',
    likes: 0,
    liked: false,
    isMine: true,
  })

  selectedPost.value.comments += 1
  detailCommentText.value = ''
}

function removeComment(post, commentId) {
  if (!post?.commentList) return
  const idx = post.commentList.findIndex((comment) => comment.id === commentId)
  if (idx === -1) return
  post.commentList.splice(idx, 1)
  post.comments = Math.max(0, (post.comments || 0) - 1)
}

function removePost(postId) {
  ;['posts', 'likes'].forEach((tabKey) => {
    const list = dataMap[tabKey]
    if (!Array.isArray(list)) return
    const idx = list.findIndex((post) => post.id === postId)
    if (idx !== -1) list.splice(idx, 1)
  })
  if (selectedPost.value?.id === postId) {
    closePost()
  }
  social?.unsavePost?.(postId)
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
        <button type="button" class="edit-btn" @click="toggleProfileEdit">
          {{ editingProfile ? 'Save' : 'Edit' }}
        </button>
      </div>

      <div class="identity">
        <img class="avatar" :src="avatarImg" alt="Story Seeker avatar" />
        <input
          v-if="editingProfile"
          v-model="profileName"
          class="profile-input name-input"
          type="text"
          maxlength="36"
          placeholder="Your name"
        />
        <p v-else class="name">{{ profileName }}</p>
        <textarea
          v-if="editingProfile"
          v-model="profileBio"
          class="profile-input bio-input"
          rows="2"
          maxlength="120"
          placeholder="Write your bio"
        />
        <p v-else class="bio">{{ profileBio }}</p>
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
            @click="setActiveTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="feed">
        <CollectionView v-if="activeTab === 'collection'" class="embedded-collection" />
        <article v-for="item in activeItems" v-else :key="item.id" class="card" @click="openPost(item)">
          <div class="post-head">
            <div class="post-author">
              <img class="post-avatar" :src="item.avatar || avatarImg" alt="" />
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
            <button type="button" class="meta-btn" :class="{ on: item.liked }" @click.stop="toggleLike(item)">
              {{ item.liked ? '♥' : '♡' }} {{ item.likes }}
            </button>
            <button type="button" class="meta-btn" :class="{ on: item.commented }" @click.stop="toggleComment(item)">
              {{ item.commented ? '●' : '◌' }} {{ item.comments }}
            </button>
            <button type="button" class="meta-btn" :class="{ on: item.saved }" @click.stop="toggleSave(item)">
              {{ item.saved ? '★' : '☆' }} {{ item.saves }}
            </button>
          </div>
          <p class="social-proof">{{ socialProof(item) }}</p>
        </article>
        <p v-if="activeTab !== 'collection' && activeItems.length === 0" class="empty-state">
          No posts here yet.
        </p>
      </div>
    </section>

    <section v-if="selectedPost" class="profile-detail-overlay" aria-label="Profile post detail">
      <div class="detail-page">
        <header class="detail-top">
          <button type="button" class="back-btn" aria-label="Back to profile list" @click="closePost">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6 9 12l6 6" />
            </svg>
          </button>
          <img class="detail-avatar detail-top-avatar" :src="selectedPost.avatar || avatarImg" alt="" />
          <p class="detail-author">{{ selectedPost.author }}</p>
        </header>

        <div class="detail-body">
          <div class="detail-image-wrap">
            <img v-if="selectedPost.image" :src="selectedPost.image" class="detail-image" alt="" />
            <div v-else class="detail-image-placeholder" />
          </div>
          <h3 class="detail-title">{{ selectedPost.title || 'Untitled story' }}</h3>
          <p class="detail-time">{{ selectedPost.timeAgo }}</p>
          <p class="detail-text">{{ selectedPost.text }}</p>
          <div v-if="selectedPost.isMine" class="detail-post-actions">
            <button
              type="button"
              class="post-delete-btn"
              aria-label="Delete post"
              @click="removePost(selectedPost.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16" />
                <path d="M9.5 7V5.8c0-.5.4-.8.9-.8h3.2c.5 0 .9.3.9.8V7" />
                <path d="M7.8 7l.6 10.4c0 .9.7 1.6 1.6 1.6h4c.9 0 1.6-.7 1.6-1.6L16.2 7" />
                <path d="M10.2 10.2v5.4M13.8 10.2v5.4" />
              </svg>
            </button>
          </div>

          <div class="detail-input-row">
            <img class="detail-avatar detail-input-avatar" :src="avatarImg" alt="" />
            <input
              v-model="detailCommentText"
              type="text"
              class="detail-input"
              maxlength="180"
              placeholder="Share your opinion here"
              @keydown.enter.prevent="submitDetailComment"
            />
            <button
              type="button"
              class="detail-send-btn"
              :disabled="!detailCommentText.trim()"
              @click="submitDetailComment"
            >
              Send
            </button>
          </div>

          <div class="detail-comments">
            <article v-for="comment in selectedPost.commentList || []" :key="comment.id" class="comment-item">
              <img class="comment-avatar" :src="comment.avatar || avatarImg" alt="" />
              <div class="comment-main">
                <div class="comment-top">
                  <p class="comment-author">{{ comment.author }}</p>
                  <p class="comment-time">{{ comment.timeAgo }}</p>
                </div>
                <p class="comment-text">{{ comment.text }}</p>
              </div>
              <button
                v-if="comment.isMine"
                type="button"
                class="comment-delete-btn"
                aria-label="Delete comment"
                @click="removeComment(selectedPost, comment.id)"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16" />
                  <path d="M9.5 7V5.8c0-.5.4-.8.9-.8h3.2c.5 0 .9.3.9.8V7" />
                  <path d="M7.8 7l.6 10.4c0 .9.7 1.6 1.6 1.6h4c.9 0 1.6-.7 1.6-1.6L16.2 7" />
                  <path d="M10.2 10.2v5.4M13.8 10.2v5.4" />
                </svg>
              </button>
              <button
                type="button"
                class="comment-like-btn"
                :class="{ on: comment.liked }"
                @click="toggleCommentLike(comment)"
              >
                {{ comment.liked ? '♥' : '♡' }} {{ comment.likes }}
              </button>
            </article>
          </div>
        </div>
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
  background: #f7f3ec;
  color: #2f241c;
  position: relative;
  overflow: hidden;
}

.profile-header {
  position: relative;
  flex: 0 0 39%;
  min-height: 220px;
  padding: 16px 16px 20px;
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
  padding: 0 10px;
  border: 1px solid #e6dccb;
  border-radius: 999px;
  background: rgba(255, 253, 249, 0.8);
  color: #7b6a58;
  font-size: 0.82rem;
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
  border: 1px solid #e6dccb;
  box-shadow: 0 4px 12px rgba(80, 60, 30, 0.08);
}

.name {
  margin: 10px 0 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: #2f241c;
}

.bio {
  margin: 6px auto 0;
  max-width: 290px;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #8b8b8b;
}

.profile-input {
  width: min(290px, 100%);
  margin: 8px auto 0;
  border: 1px solid rgba(130, 112, 88, 0.24);
  border-radius: 10px;
  background: #fffdf8;
  color: #3f372f;
  text-align: center;
}

.name-input {
  min-height: 40px;
  padding: 0 12px;
  font-size: 1rem;
  font-weight: 650;
}

.bio-input {
  min-height: 56px;
  padding: 8px 12px;
  font-size: 0.84rem;
  line-height: 1.35;
  resize: none;
}

.profile-sheet {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #f7f3ec;
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  border-top: 1px solid #e6dccb;
  scrollbar-width: thin;
  scrollbar-color: rgba(123, 106, 88, 0.32) transparent;
}

.profile-sheet::-webkit-scrollbar {
  width: 6px;
}

.profile-sheet::-webkit-scrollbar-thumb {
  background: rgba(123, 106, 88, 0.28);
  border-radius: 999px;
}

.tab-header {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #f7f3ec;
  border-bottom: 1px solid #e6dccb;
  padding: 8px 12px 6px;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: stretch;
  gap: 4px;
  padding: 4px;
  border: 1px solid #e6dccb;
  border-radius: 12px;
  background: #fffdf9;
}

.tab-btn {
  min-height: 42px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #7b6a58;
  font-size: 0.9rem;
  font-weight: 580;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-btn.active {
  color: #2f241c;
  font-weight: 700;
  background: #f3e6c7;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  left: 28%;
  right: 28%;
  bottom: 4px;
  height: 2.5px;
  border-radius: 999px;
  background: #c89b3c;
}

.feed {
  padding: 12px 16px calc(18px + var(--mq-safe-bottom));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.embedded-collection {
  padding-bottom: 2px;
}

.card {
  border-radius: 12px;
  border: 1px solid #e6dccb;
  background: #f9f7f1;
  padding: 12px;
  box-shadow: 0 6px 18px rgba(80, 60, 30, 0.06);
  cursor: pointer;
}

.post-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
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
  font-weight: 700;
  color: #2f241c;
}

.post-time {
  font-size: 0.75rem;
  color: #8b8b8b;
  flex-shrink: 0;
}

.thumb-wrap {
  margin-bottom: 10px;
  border-radius: 12px;
  overflow: hidden;
  background: #f2e7d5;
  border: 1px solid #e6dccb;
}

.thumb {
  width: 100%;
  height: 138px;
  object-fit: cover;
  display: block;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #2f241c;
  line-height: 1.25;
}

.card-text {
  margin-top: 6px;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #8b8b8b;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6e6255;
}

.meta-btn {
  min-height: 24px;
  padding: 0;
  border-radius: 0;
  border: 0;
  background: transparent;
  color: #6e6255;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: transform 0.16s ease, color 0.16s ease;
}

.meta-btn.on {
  color: #b99953;
  transform: translateY(-1px);
  animation: meta-pop 0.2s ease;
}

.social-proof {
  margin-top: 8px;
  font-size: 0.74rem;
  color: #8b8b8b;
  line-height: 1.35;
}

.empty-state {
  margin: 4px 0 0;
  text-align: center;
  font-size: 0.82rem;
  color: #7a6f62;
}

.detail-page {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #faf3e9;
}

.profile-detail-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: #faf3e9;
}

.detail-top {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0e0bf;
  border-bottom: 1px solid rgba(117, 84, 34, 0.25);
}

.back-btn {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #60461f;
}

.back-btn svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.detail-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  background: #b5b5b5;
}

.detail-top-avatar {
  width: 32px;
  height: 32px;
}

.detail-input-avatar {
  width: 28px;
  height: 28px;
}

.detail-author {
  margin: 0;
  font-size: 0.78rem;
  color: #5d4520;
}

.detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 0;
}

.detail-image-wrap {
  width: 100%;
  border-top: 1px solid rgba(117, 84, 34, 0.16);
  border-bottom: 1px solid rgba(117, 84, 34, 0.16);
  background: #e6c88d;
}

.detail-image,
.detail-image-placeholder {
  width: 100%;
  height: 300px;
  display: block;
}

.detail-image {
  object-fit: cover;
}

.detail-image-placeholder {
  background: #e0c180;
}

.detail-title {
  margin: 12px 12px 0;
  font-size: 1.06rem;
  font-weight: 700;
  color: #101010;
}

.detail-time {
  margin: 2px 12px 0;
  font-size: 0.72rem;
  color: #8b8b8b;
}

.detail-text {
  margin: 4px 12px 0;
  font-size: 0.82rem;
  line-height: 1.4;
  color: #5f5f5f;
}

.detail-post-actions {
  margin: 2px 12px 0;
  display: flex;
  justify-content: flex-end;
}

.post-delete-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #9a7c4a;
}

.post-delete-btn svg {
  width: 17px;
  height: 17px;
  display: block;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.detail-input-row {
  margin: 10px 12px 0;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid rgba(130, 112, 88, 0.22);
  border-bottom: 1px solid rgba(130, 112, 88, 0.22);
}

.detail-input {
  flex: 1;
  min-height: 26px;
  border-radius: 6px;
  border: 1px solid rgba(117, 84, 34, 0.2);
  background: #f3e5c8;
  color: #947b53;
  font-size: 0.72rem;
  padding: 0 8px;
}

.detail-input::placeholder {
  color: #947b53;
}

.detail-send-btn {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(117, 84, 34, 0.26);
  background: #e7d1a3;
  color: #6b4a1e;
  font-size: 0.72rem;
  font-weight: 650;
}

.detail-send-btn:disabled {
  opacity: 0.5;
}

.detail-comments {
  margin-top: 10px;
  padding: 0 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid rgba(130, 112, 88, 0.22);
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 0;
}

.comment-item + .comment-item {
  border-top: 1px solid rgba(130, 112, 88, 0.22);
}

.comment-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-main {
  min-width: 0;
  flex: 1;
}

.comment-top {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.comment-author {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 650;
  color: #574324;
}

.comment-time {
  margin: 0;
  font-size: 0.68rem;
  color: #8a7350;
}

.comment-text {
  margin: 2px 0 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: #5f564b;
}

.comment-like-btn {
  min-height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8e7a59;
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1;
  flex-shrink: 0;
}

.comment-like-btn.on {
  color: #b1843d;
  animation: meta-pop 0.2s ease;
}

.comment-delete-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #9a7c4a;
  flex-shrink: 0;
}

.comment-delete-btn svg {
  width: 16px;
  height: 16px;
  display: block;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
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
