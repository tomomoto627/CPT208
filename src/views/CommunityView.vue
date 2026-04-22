<script setup>
import { inject, ref } from 'vue'
import avatar1Img from '@/assets/avatar1.png'
import avatar2Img from '@/assets/avatar2.jpg'
import avatar3Img from '@/assets/avatar3.jpg'
import avatar4Img from '@/assets/avatar4.jpg'
import bookmarkSetImg from '@/assets/BookmarkSet.png'
import postcardBoxImg from '@/assets/PostcardBox.png'
import museumRouteToteImg from '@/assets/MuseumRouteTote.png'
import deskCalendarImg from '@/assets/StoryLensDeskCalendar.png'

const draftTitle = ref('')
const draftContent = ref('')
const composing = ref(false)
const selectedPost = ref(null)
const detailCommentText = ref('')
const social = inject('social', null)

const basePosts = [
  {
    id: 'c1',
    author: 'Ethan',
    avatar: avatar2Img,
    timeAgo: '12m ago',
    title: 'BookmarkSet Drop',
    text: 'BookmarkSet is now live in the store feed. The material texture looks even better in person.',
    image: bookmarkSetImg,
    likes: 32,
    comments: 3,
    saves: 13,
    liked: false,
    saved: false,
    commented: false,
    commentList: [
      {
        id: 'c1m1',
        author: 'Nora',
        avatar: avatar1Img,
        text: 'The close-up texture is amazing. Great capture.',
        timeAgo: '6m ago',
        likes: 5,
        liked: false,
      },
      {
        id: 'c1m2',
        author: 'Mia',
        avatar: avatar3Img,
        text: 'This set really matches the bronze theme.',
        timeAgo: '9m ago',
        likes: 3,
        liked: false,
      },
      {
        id: 'c1m3',
        author: 'Leo',
        avatar: avatar4Img,
        text: 'Would buy this as a gift for sure.',
        timeAgo: '11m ago',
        likes: 4,
        liked: false,
      },
    ],
  },
  {
    id: 'c2',
    author: 'Mia',
    avatar: avatar3Img,
    timeAgo: '35m ago',
    title: 'PostcardBox Color Study',
    text: 'PostcardBox matches the Hall B glaze palette nicely. Great pick for a compact gift set.',
    image: postcardBoxImg,
    likes: 27,
    comments: 2,
    saves: 10,
    liked: false,
    saved: false,
    commented: false,
    commentList: [
      {
        id: 'c2m1',
        author: 'Ethan',
        avatar: avatar2Img,
        text: 'Color tone is very elegant.',
        timeAgo: '20m ago',
        likes: 2,
        liked: false,
      },
      {
        id: 'c2m2',
        author: 'Nora',
        avatar: avatar1Img,
        text: 'Looks perfect for journaling inserts.',
        timeAgo: '26m ago',
        likes: 1,
        liked: false,
      },
    ],
  },
  {
    id: 'c3',
    author: 'Leo',
    avatar: avatar4Img,
    timeAgo: '1h ago',
    title: 'MuseumRouteTote On Route',
    text: 'Used MuseumRouteTote during today\'s gallery walk. It fits a notebook, water bottle, and guide map.',
    image: museumRouteToteImg,
    likes: 41,
    comments: 3,
    saves: 18,
    liked: false,
    saved: false,
    commented: false,
    commentList: [
      {
        id: 'c3m1',
        author: 'Mia',
        avatar: avatar3Img,
        text: 'The tote looks sturdy and roomy.',
        timeAgo: '38m ago',
        likes: 4,
        liked: false,
      },
      {
        id: 'c3m2',
        author: 'Ethan',
        avatar: avatar2Img,
        text: 'Great for route cards and notebooks.',
        timeAgo: '42m ago',
        likes: 3,
        liked: false,
      },
      {
        id: 'c3m3',
        author: 'Nora',
        avatar: avatar1Img,
        text: 'I like the neutral color palette here.',
        timeAgo: '48m ago',
        likes: 2,
        liked: false,
      },
    ],
  },
  {
    id: 'c4',
    author: 'Nora',
    avatar: avatar1Img,
    timeAgo: '2h ago',
    title: 'StoryLensDeskCalendar Preview',
    text: 'StoryLensDeskCalendar has a clean monthly layout and useful artifact timeline notes on each page.',
    image: deskCalendarImg,
    likes: 22,
    comments: 2,
    saves: 9,
    liked: false,
    saved: false,
    commented: false,
    commentList: [
      {
        id: 'c4m1',
        author: 'Leo',
        avatar: avatar4Img,
        text: 'The timeline layout is super practical.',
        timeAgo: '1h ago',
        likes: 3,
        liked: false,
      },
      {
        id: 'c4m2',
        author: 'Ethan',
        avatar: avatar2Img,
        text: 'Nice monthly overview design.',
        timeAgo: '1h ago',
        likes: 2,
        liked: false,
      },
    ],
  },
]

const feedItems = ref(
  basePosts.map((post) => ({
    ...post,
    saved: social?.isSaved?.(post.id) || false,
  })),
)

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
    avatar: avatar1Img,
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
    commentList: [
      {
        id: `u${Date.now()}m1`,
        author: 'Nora',
        avatar: avatar1Img,
        text: 'Thanks for sharing this update.',
        timeAgo: 'Just now',
        likes: 0,
        liked: false,
      },
    ],
    isMine: true,
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
  if (item.saved) {
    social?.savePost?.(item)
  } else {
    social?.unsavePost?.(item.id)
  }
}

function toggleComment(item) {
  item.commented = !item.commented
  item.comments += item.commented ? 1 : -1
  if (item.comments < 0) item.comments = 0
}

function socialProof(item) {
  const group = Math.max(5, Math.floor(item.likes / 4))
  return `${item.author} and ${group} others just liked this story`
}

function toggleCommentLike(comment) {
  comment.liked = !comment.liked
  comment.likes += comment.liked ? 1 : -1
  if (comment.likes < 0) comment.likes = 0
}

function openPost(item) {
  selectedPost.value = item
  composing.value = false
  detailCommentText.value = ''
}

function closePost() {
  selectedPost.value = null
  detailCommentText.value = ''
}

function submitDetailComment() {
  if (!selectedPost.value) return
  const text = detailCommentText.value.trim()
  if (!text) return

  if (!selectedPost.value.commentList) {
    selectedPost.value.commentList = []
  }

  selectedPost.value.commentList.unshift({
    id: `cm${Date.now()}`,
    author: 'Story Seeker',
    avatar: avatar1Img,
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
  const idx = feedItems.value.findIndex((post) => post.id === postId)
  if (idx === -1) return
  feedItems.value.splice(idx, 1)
  if (selectedPost.value?.id === postId) {
    closePost()
  }
}

function postBadge(item) {
  if (!item) return ''
  if ((item.likes || 0) >= 30) return 'Popular'
  if ((item.likes || 0) >= 18) return 'Museum Pick'
  return ''
}
</script>

<template>
  <div class="community-page" :class="{ expanded: composing && !selectedPost }">
    <section v-if="!selectedPost" class="community-top-fixed">
      <h2 class="top-title">Community Feed</h2>
      <p class="top-subtitle">Explore & Share more story</p>
      <div class="composer-layer">
        <div class="composer-card" :class="{ expanded: composing }" @click="!composing && onComposerEntry()">
          <div class="composer-row">
            <img class="avatar" :src="avatar1Img" alt="User avatar" />
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

    <section v-if="!selectedPost" class="feed-layer" aria-label="Community feed">
      <ul class="feed-list">
        <li v-for="p in feedItems" :key="p.id" class="post-card" @click="openPost(p)">
          <div class="post-head">
            <div class="post-author">
              <img class="post-avatar" :src="p.avatar || avatar1Img" alt="" />
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
            <button type="button" class="meta-btn" :class="{ on: p.liked }" @click.stop="toggleLike(p)">
              {{ p.liked ? '♥' : '♡' }} {{ p.likes }}
            </button>
            <button type="button" class="meta-btn" :class="{ on: p.commented }" @click.stop="toggleComment(p)">
              {{ p.commented ? '●' : '◌' }} {{ p.comments }}
            </button>
            <button type="button" class="meta-btn" :class="{ on: p.saved }" @click.stop="toggleSave(p)">
              {{ p.saved ? '★' : '☆' }} {{ p.saves }}
            </button>
          </div>
          <span v-if="postBadge(p)" class="post-badge">{{ postBadge(p) }}</span>
          <p class="social-proof">{{ socialProof(p) }}</p>
        </li>
      </ul>
    </section>

    <section v-else class="detail-page" aria-label="Post detail">
      <header class="detail-top">
        <button type="button" class="back-btn" aria-label="Back to community feed" @click="closePost">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6 9 12l6 6" />
          </svg>
        </button>
        <img class="detail-avatar detail-top-avatar" :src="selectedPost.avatar || avatar1Img" alt="" />
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
          <img class="detail-avatar detail-input-avatar" :src="avatar1Img" alt="" />
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
            <img class="comment-avatar" :src="comment.avatar || avatar1Img" alt="" />
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
            <button type="button" class="comment-like-btn" :class="{ on: comment.liked }" @click="toggleCommentLike(comment)">
              {{ comment.liked ? '♥' : '♡' }} {{ comment.likes }}
            </button>
          </article>
        </div>
      </div>
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
  background: #f8f2e7;
  padding: 0 12px;
  margin-bottom: -24px;
  border-radius: 16px;
}

.composer-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fffdf8;
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
  gap: 12px;
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
  color: #8b8b8b;
  line-height: 1.35;
  text-align: center;
}

.composer-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid rgba(176, 143, 86, 0.35);
  background: #f6efe2;
  box-shadow: 0 4px 10px rgba(80, 60, 30, 0.14);
  color: #b99953;
  border-color: rgba(185, 153, 83, 0.5);
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
  background: #f9f6f1;
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
  background: #f9f6f1;
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
  border: 1px solid rgba(185, 153, 83, 0.45);
  background: #f1e8d8;
  color: #9b7a43;
}

.publish-btn:disabled {
  opacity: 1;
  background: #ece6da;
  color: #a79b8a;
  border-color: rgba(163, 149, 130, 0.35);
  cursor: not-allowed;
}

.publish-btn:not(:disabled) {
  background: #b99953;
  color: #fffdf8;
  border-color: #b99953;
}

.feed-layer {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #f6f2ea;
  padding-top: calc(var(--top-fixed-h) + 4px);
  padding-bottom: calc(10px + var(--mq-safe-bottom));
}

.feed-list {
  list-style: none;
  margin: 0;
  padding: 0 3px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.post-card {
  position: relative;
  padding: 12px;
  border-radius: var(--mq-radius);
  background: #fffcf7;
  border: 1px solid rgba(130, 112, 88, 0.17);
  box-shadow: 0 4px 12px rgba(80, 60, 30, 0.06);
  cursor: pointer;
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
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(130, 112, 88, 0.25);
  box-shadow: 0 1px 3px rgba(80, 60, 30, 0.1);
  flex-shrink: 0;
}

.author-name {
  font-size: 0.9rem;
  font-weight: 650;
  color: #3a332b;
}

.post-time {
  font-size: 0.75rem;
  color: #9f9a92;
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
  gap: 10px;
  color: #b99953;
}

.meta-btn {
  min-height: 24px;
  padding: 0;
  border-radius: 0;
  border: 0;
  background: transparent;
  color: #b99953;
  font-size: 0.8rem;
  font-weight: 550;
  line-height: 1;
  transition: transform 0.16s ease, color 0.16s ease;
}

.meta-btn.on {
  color: #a8802f;
  transform: translateY(-1px);
  animation: meta-pop 0.2s ease;
}

.post-badge {
  position: absolute;
  right: 12px;
  bottom: 30px;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(185, 153, 83, 0.45);
  background: #f3e9d3;
  color: #967338;
  font-size: 0.67rem;
  font-weight: 650;
  display: inline-flex;
  align-items: center;
}

.social-proof {
  margin-top: 8px;
  font-size: 0.74rem;
  color: #8b8b8b;
  line-height: 1.35;
}

.detail-page {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
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
  border-radius: 0;
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
  font-size: 0.72rem;
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
