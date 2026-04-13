<script setup>
import { onUnmounted, ref } from 'vue'
import shop1 from '@/assets/shop-1.png'
import shop2 from '@/assets/shop-2.png'
import shop3 from '@/assets/shop-3.png'
import { storeProducts } from '@/data/storeProducts'

const bannerRef = ref(null)
const categoryRef = ref(null)
const activeSlide = ref(0)
const dragState = {
  active: false,
  startX: 0,
  startLeft: 0,
  el: null,
}

const banners = [
  {
    id: 'b1',
    image: shop1,
    title: 'Bronze Echo Collection',
    subtitle: 'Inspired by ritual vessels and engraved linework',
    cta: 'Explore Set',
  },
  {
    id: 'b2',
    image: shop2,
    title: 'Ceramic Story Series',
    subtitle: 'Museum light, glaze texture, and soft ivory tones',
    cta: 'View Highlights',
  },
  {
    id: 'b3',
    image: shop3,
    title: 'Gallery Night Edition',
    subtitle: 'Limited keepsakes for guided evening routes',
    cta: 'See Limited',
  },
]

const categories = ['Featured', 'New Arrivals', 'Stationery', 'Wearables', 'Home Objects']
const products = storeProducts

function onBannerScroll() {
  const el = bannerRef.value
  if (!el) return
  const idx = Math.round(el.scrollLeft / el.clientWidth)
  activeSlide.value = Math.max(0, Math.min(idx, banners.length - 1))
}

function startMouseDrag(event, target) {
  if (event.button !== 0) return
  const el = target === 'banner' ? bannerRef.value : categoryRef.value
  if (!el) return

  dragState.active = true
  dragState.startX = event.clientX
  dragState.startLeft = el.scrollLeft
  dragState.el = el
  el.classList.add('is-dragging')
  window.addEventListener('mousemove', onMouseDrag)
  window.addEventListener('mouseup', endMouseDrag, { once: true })
}

function onMouseDrag(event) {
  if (!dragState.active || !dragState.el) return
  const delta = event.clientX - dragState.startX
  dragState.el.scrollLeft = dragState.startLeft - delta
}

function endMouseDrag() {
  if (dragState.el) {
    dragState.el.classList.remove('is-dragging')
  }
  dragState.active = false
  dragState.el = null
  window.removeEventListener('mousemove', onMouseDrag)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseDrag)
})
</script>

<template>
  <div class="page">
    <section class="banner-section" aria-label="Shop campaigns">
      <div
        ref="bannerRef"
        class="banner-track"
        @scroll.passive="onBannerScroll"
        @mousedown="startMouseDrag($event, 'banner')"
      >
        <article v-for="b in banners" :key="b.id" class="banner-card">
          <img class="banner-image" :src="b.image" :alt="b.title" />
          <div class="banner-overlay">
            <p class="banner-title">{{ b.title }}</p>
            <p class="banner-subtitle">{{ b.subtitle }}</p>
            <button type="button" class="banner-cta">{{ b.cta }}</button>
          </div>
        </article>
      </div>

      <div class="pager" aria-hidden="true">
        <span v-for="(b, i) in banners" :key="b.id" class="dot" :class="{ on: i === activeSlide }" />
      </div>
    </section>

    <section
      ref="categoryRef"
      class="category-row"
      aria-label="Shop categories"
      @mousedown="startMouseDrag($event, 'category')"
    >
      <button v-for="c in categories" :key="c" type="button" class="category-pill">
        {{ c }}
      </button>
    </section>

    <section class="goods-section" aria-label="Cultural products">
      <ul class="goods-list">
        <li v-for="item in products" :key="item.id" class="goods-card">
          <img class="goods-image" :src="item.image" :alt="item.name" />
          <div class="goods-copy">
            <h3 class="goods-name">{{ item.name }}</h3>
            <p class="goods-source">{{ item.source }}</p>
            <div class="goods-price-row">
              <p class="goods-price">{{ item.price }}</p>
              <p class="goods-redeem">兑换价 {{ item.redeemPoints }} 积分</p>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.banner-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.banner-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-radius: 16px;
  touch-action: pan-x;
  overscroll-behavior-x: contain;
  cursor: grab;
}

.banner-track::-webkit-scrollbar {
  display: none;
}

.banner-track.is-dragging {
  cursor: grabbing;
}

.banner-card {
  position: relative;
  min-width: 100%;
  aspect-ratio: 587 / 357;
  border-radius: 16px;
  overflow: hidden;
  scroll-snap-align: start;
  border: 1px solid rgba(130, 112, 88, 0.2);
  background: #efe3d5;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #efe3d5;
}

.banner-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px;
  background: linear-gradient(180deg, rgba(26, 18, 10, 0) 0%, rgba(26, 18, 10, 0.58) 90%);
  color: #fff8ec;
}

.banner-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
}

.banner-subtitle {
  margin: 3px 0 0;
  font-size: 0.78rem;
  opacity: 0.92;
}

.banner-cta {
  margin-top: 8px;
  min-height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid rgba(255, 241, 216, 0.62);
  background: rgba(255, 241, 216, 0.22);
  color: #fff6e6;
  font-size: 0.75rem;
  font-weight: 650;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(143, 116, 70, 0.35);
}

.dot.on {
  width: 16px;
  background: #b48a4e;
}

.category-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 2px;
  touch-action: pan-x;
  overscroll-behavior-x: contain;
  cursor: grab;
}

.category-row::-webkit-scrollbar {
  display: none;
}

.category-row.is-dragging {
  cursor: grabbing;
}

.category-pill {
  flex-shrink: 0;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(130, 112, 88, 0.25);
  background: #f7f0e3;
  color: #7a6b59;
  font-size: 0.8rem;
  font-weight: 600;
  touch-action: pan-x;
}

.goods-section {
  display: flex;
}

.goods-list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goods-card {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  background: #fffdf8;
  border: 1px solid rgba(130, 112, 88, 0.17);
}

.goods-image {
  width: 108px;
  aspect-ratio: 587 / 357;
  border-radius: 10px;
  object-fit: contain;
  flex-shrink: 0;
  border: 1px solid rgba(130, 112, 88, 0.14);
  background: #efe3d5;
}

.goods-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.goods-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #3f372f;
}

.goods-source {
  margin: 6px 0 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: #7a6f62;
}

.goods-price {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #9b753f;
}

.goods-price-row {
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.goods-redeem {
  margin: 0;
  font-size: 0.76rem;
  color: #8a6b3a;
  font-weight: 600;
}
</style>
