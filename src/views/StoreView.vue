<script setup>
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import shop1 from '@/assets/shop-1.png'
import shop2 from '@/assets/shop-2.png'
import shop3 from '@/assets/shop-3.png'
import { storeProducts } from '@/data/storeProducts'

const bannerRef = ref(null)
const categoryRef = ref(null)
const activeSlide = ref(0)
const activeCategory = ref('Featured')
const selectedProduct = ref(null)
const activeActionTab = ref('cart')
const searchQuery = ref('')
const museum = inject('museum', null)
const cartOpen = ref(false)
const cartItems = ref([])
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
  },
  {
    id: 'b2',
    image: shop2,
    title: 'Ceramic Story Series',
    subtitle: 'Museum light, glaze texture, and soft ivory tones',
  },
  {
    id: 'b3',
    image: shop3,
    title: 'Gallery Night Edition',
    subtitle: 'Limited keepsakes for guided evening routes',
  },
]

const categories = ['Featured', 'New Arrivals', 'Stationery', 'Wearables', 'Home Objects']
const products = storeProducts
const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return products.filter((item) => {
    const inCategory = item.tags?.includes(activeCategory.value)
    if (!inCategory) return false
    if (!q) return true
    return (
      String(item.name || '').toLowerCase().includes(q) ||
      String(item.source || '').toLowerCase().includes(q) ||
      (item.tags || []).join(' ').toLowerCase().includes(q)
    )
  })
})
const actionTabs = [
  { key: 'cart', label: 'Add to Cart' },
  { key: 'buy', label: 'Buy Now' },
  { key: 'redeem', label: 'Redeem Points' },
]
const productDetails = {
  'Inscribed Bookmark Set':
    'A bronze-inspired stationery set with textured metal bookmarks and tassel cords, designed to echo inscription aesthetics from ritual artifacts.',
  'Glaze Tone Postcard Box':
    'A curated postcard box featuring glaze-gradient studies from Hall B ceramics, suitable for journaling, gifting, and exhibition notes.',
  'Museum Route Tote':
    'A lightweight tote printed with the museum night-route map, sized for notebooks, guide cards, and daily carry essentials.',
  'Storylens Desk Calendar':
    'A monthly desk calendar combining artifact highlights with short timeline notes, ideal for study desks and planning corners.',
}
const activeTabDescription = computed(() => {
  if (activeActionTab.value === 'buy') {
    return 'Complete checkout with standard payment and shipping.'
  }
  if (activeActionTab.value === 'redeem') {
    return 'Use points to exchange this product in the rewards flow.'
  }
  return 'Save this item for later and continue browsing.'
})
const activeTabPrimaryLabel = computed(() => {
  if (activeActionTab.value === 'buy') return 'Proceed to Checkout'
  if (activeActionTab.value === 'redeem') return 'Redeem with Points'
  return 'Add Item to Cart'
})
const selectedProductDetail = computed(() => {
  if (!selectedProduct.value) return ''
  return productDetails[selectedProduct.value.name] || selectedProduct.value.source
})
const cartItemCount = computed(() =>
  cartItems.value.reduce((total, item) => total + item.qty, 0),
)
const cartTotalPrice = computed(() => {
  const total = cartItems.value.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  return `CNY ${total}`
})
const cartTotalPoints = computed(() =>
  cartItems.value.reduce((sum, item) => sum + (item.unitPoints || 0) * item.qty, 0),
)

function onBannerScroll() {
  const el = bannerRef.value
  if (!el) return
  const idx = Math.round(el.scrollLeft / el.clientWidth)
  activeSlide.value = Math.max(0, Math.min(idx, banners.length - 1))
}

function selectCategory(category) {
  activeCategory.value = category
}

function categoryIcon(category) {
  if (category === 'Featured') return '★'
  if (category === 'New Arrivals') return '✶'
  if (category === 'Stationery') return '✎'
  if (category === 'Wearables') return '◍'
  return '⌂'
}

function submitSearch() {
  // Query filtering is reactive via `filteredProducts`.
}

function openProductDetail(item) {
  selectedProduct.value = item
  activeActionTab.value = 'cart'
}

function closeProductDetail() {
  selectedProduct.value = null
}

function parsePriceValue(priceText) {
  const value = Number.parseInt(String(priceText).replace(/[^\d]/g, ''), 10)
  return Number.isNaN(value) ? 0 : value
}

function parsePointsValue(pointsText) {
  const value = Number.parseInt(String(pointsText).replace(/[^\d]/g, ''), 10)
  return Number.isNaN(value) ? 0 : value
}

function addToCart(product) {
  const existing = cartItems.value.find((item) => item.id === product.id)
  if (existing) {
    existing.qty += 1
    return
  }

  cartItems.value.push({
    id: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    unitPrice: parsePriceValue(product.price),
    unitPoints: parsePointsValue(product.redeemPoints),
    qty: 1,
  })
}

function removeCartItem(productId) {
  cartItems.value = cartItems.value.filter((item) => item.id !== productId)
}

function decrementCartQty(productId) {
  const item = cartItems.value.find((entry) => entry.id === productId)
  if (!item) return
  if (item.qty <= 1) return
  item.qty -= 1
}

function incrementCartQty(productId) {
  const item = cartItems.value.find((entry) => entry.id === productId)
  if (!item) return
  item.qty += 1
}

function handlePrimaryAction() {
  if (!selectedProduct.value) return

  if (activeActionTab.value === 'cart') {
    addToCart(selectedProduct.value)
    cartOpen.value = true
    return
  }

  closeProductDetail()
}

function toggleCartPanel() {
  cartOpen.value = !cartOpen.value
}

function handleCartBuy() {
  if (!cartItems.value.length) return
  cartOpen.value = false
}

function handleOpenStoreProduct(event) {
  const productId = event?.detail?.productId
  if (!productId) return
  const target = products.find((item) => item.id === productId)
  if (!target) return
  openProductDetail(target)
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
  window.removeEventListener('mq-open-store-product', handleOpenStoreProduct)
})

onMounted(() => {
  window.addEventListener('mq-open-store-product', handleOpenStoreProduct)
})
</script>

<template>
  <div class="page">
    <section class="store-topbar" aria-label="Store search and points">
      <div class="store-search">
        <span class="store-search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        </span>
        <input
          v-model="searchQuery"
          class="store-search-input"
          type="text"
          placeholder="Search museum gifts and stories"
          @keydown.enter.prevent="submitSearch"
        />
      </div>
      <button type="button" class="store-go-btn" @click="submitSearch">Go</button>
      <div class="store-points">
        <span class="store-points-icon" aria-hidden="true">☆</span>
        <span>{{ museum?.state?.points ?? 0 }} pts</span>
      </div>
    </section>

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
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="category-pill"
        :class="{ active: c === activeCategory }"
        @click="selectCategory(c)"
      >
        <span class="category-icon" aria-hidden="true">{{ categoryIcon(c) }}</span>
        {{ c }}
      </button>
    </section>

    <section class="goods-section" aria-label="Cultural products">
      <ul class="goods-list">
        <li v-for="item in filteredProducts" :key="item.id" class="goods-card" @click="openProductDetail(item)">
          <img class="goods-image" :src="item.image" :alt="item.name" />
          <div class="goods-copy">
            <h3 class="goods-name">{{ item.name }}</h3>
            <p class="goods-source">{{ item.source }}</p>
            <div class="goods-price-row">
              <p class="goods-price">
                <span class="goods-price-icon" aria-hidden="true">◍</span>
                <span>{{ item.price }}</span>
              </p>
              <span class="goods-price-divider" aria-hidden="true" />
              <p class="goods-redeem">
                <span class="goods-redeem-icon" aria-hidden="true">◎</span>
                <span>Redeem: {{ item.redeemPoints }} points</span>
              </p>
            </div>
          </div>
          <span class="goods-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </span>
        </li>
      </ul>

      <p v-if="filteredProducts.length === 0" class="empty-state">No products available in this category.</p>
    </section>

    <div v-if="selectedProduct" class="detail-mask" @click="closeProductDetail">
      <section class="detail-modal" aria-label="Product detail" @click.stop>
        <button type="button" class="detail-close" aria-label="Close product detail" @click="closeProductDetail">
          ×
        </button>
        <img class="detail-image" :src="selectedProduct.image" :alt="selectedProduct.name" />
        <h3 class="detail-name">{{ selectedProduct.name }}</h3>
        <p class="detail-copy">{{ selectedProductDetail }}</p>
        <div class="detail-price-row">
          <span class="detail-price">{{ selectedProduct.price }}</span>
          <span class="detail-points">{{ selectedProduct.redeemPoints }} points</span>
        </div>

        <div class="detail-tabs" role="tablist" aria-label="Purchase options">
          <button
            v-for="tab in actionTabs"
            :key="tab.key"
            type="button"
            class="detail-tab"
            :class="{ active: tab.key === activeActionTab }"
            @click="activeActionTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <p class="detail-tab-copy">{{ activeTabDescription }}</p>
        <button type="button" class="detail-primary-btn" @click="handlePrimaryAction">
          {{ activeTabPrimaryLabel }}
        </button>
      </section>
    </div>

    <button type="button" class="cart-fab" aria-label="Open cart list" @click="toggleCartPanel">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.5 5.5h2l1.2 9.2a1 1 0 0 0 1 .8h7.8a1 1 0 0 0 1-.8l1-6.6H7.1" />
        <circle cx="10" cy="18.5" r="1.4" />
        <circle cx="16" cy="18.5" r="1.4" />
      </svg>
      <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
    </button>

    <section v-if="cartOpen" class="cart-panel" aria-label="Shopping cart list">
      <div class="cart-head">
        <h3 class="cart-title">Your Cart</h3>
        <button type="button" class="cart-close" aria-label="Close cart list" @click="cartOpen = false">×</button>
      </div>

      <ul v-if="cartItems.length > 0" class="cart-list">
        <li v-for="item in cartItems" :key="item.id" class="cart-item">
          <img :src="item.image" :alt="item.name" class="cart-thumb" />
          <div class="cart-copy">
            <p class="cart-name">{{ item.name }}</p>
            <div class="cart-meta-row">
              <p class="cart-meta">{{ item.price }} · Qty {{ item.qty }}</p>
              <div class="cart-qty" aria-label="Adjust quantity">
                <button
                  type="button"
                  class="qty-btn"
                  aria-label="Decrease quantity"
                  :disabled="item.qty <= 1"
                  @click="decrementCartQty(item.id)"
                >
                  −
                </button>
                <span class="qty-value">{{ item.qty }}</span>
                <button
                  type="button"
                  class="qty-btn"
                  aria-label="Increase quantity"
                  @click="incrementCartQty(item.id)"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <button type="button" class="cart-remove" aria-label="Remove item" @click="removeCartItem(item.id)">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16" />
              <path d="M9.5 7V5.8c0-.5.4-.8.9-.8h3.2c.5 0 .9.3.9.8V7" />
              <path d="M7.8 7l.6 10.4c0 .9.7 1.6 1.6 1.6h4c.9 0 1.6-.7 1.6-1.6L16.2 7" />
              <path d="M10.2 10.2v5.4M13.8 10.2v5.4" />
            </svg>
          </button>
        </li>
      </ul>
      <p v-else class="cart-empty">No items in cart yet.</p>

      <div class="cart-foot">
        <div class="cart-foot-left">
          <span class="cart-total-label">Total</span>
          <span class="cart-total-value">{{ cartTotalPrice }}</span>
          <span class="cart-total-points">{{ cartTotalPoints }} pts</span>
        </div>
        <button type="button" class="cart-buy-btn" :disabled="cartItems.length === 0" @click="handleCartBuy">
          Buy
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.store-topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  padding: 10px 10px 0;
}

.store-search {
  min-height: 44px;
  border-radius: 18px;
  border: 1px solid rgba(205, 180, 138, 0.48);
  background: #fffdf9;
  box-shadow: 0 4px 10px rgba(80, 60, 30, 0.08);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.store-search-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #8f795b;
}

.store-search-icon svg {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.store-search-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #4a3c2b;
  font-size: 0.86rem;
}

.store-search-input::placeholder {
  color: #8f7d69;
}

.store-go-btn {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(198, 145, 57, 0.7);
  background: linear-gradient(180deg, #c89b3c 0%, #ae7922 100%);
  color: #fffaf0;
  font-size: 0.86rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(125, 87, 35, 0.2);
}

.store-points {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(205, 180, 138, 0.52);
  background: #f7ecd8;
  color: #493a2a;
  font-size: 0.88rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.store-points-icon {
  color: #b5852f;
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
  border-radius: 18px;
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
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(143, 116, 70, 0.35);
}

.dot.on {
  width: 22px;
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
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(190, 164, 124, 0.44);
  background: #faf5ea;
  color: #7a6b59;
  font-size: 0.8rem;
  font-weight: 600;
  touch-action: pan-x;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.category-pill.active {
  border-color: #c89b3c;
  background: #f5e7c8;
  color: #7a5421;
}

.category-icon {
  font-size: 0.84rem;
  opacity: 0.86;
}

.goods-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goods-list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goods-card {
  display: flex;
  gap: 10px;
  padding: 11px;
  border-radius: 16px;
  background: #fffdf9;
  border: 1px solid rgba(195, 172, 135, 0.35);
  box-shadow: 0 5px 14px rgba(80, 60, 30, 0.06);
  cursor: pointer;
  align-items: center;
}

.goods-image {
  width: 102px;
  aspect-ratio: 587 / 357;
  border-radius: 11px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(130, 112, 88, 0.14);
  background: transparent;
}

.goods-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.goods-name {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 700;
  color: #3f372f;
}

.goods-source {
  margin: 6px 0 0;
  font-size: 0.8rem;
  line-height: 1.35;
  color: #7a6f62;
}

.goods-price {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #9b753f;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.goods-price-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.goods-redeem {
  margin: 0;
  font-size: 0.76rem;
  color: #8a6b3a;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.goods-price-divider {
  width: 1px;
  height: 15px;
  background: rgba(168, 140, 97, 0.35);
}

.goods-arrow {
  margin-left: auto;
  width: 20px;
  height: 20px;
  color: #8b7555;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.goods-arrow svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.goods-price-icon,
.goods-redeem-icon {
  color: #b5852f;
}

.empty-state {
  margin: 0;
  text-align: center;
  font-size: 0.82rem;
  color: #7a6f62;
}

.detail-mask {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(32, 24, 14, 0.48);
  display: flex;
  align-items: flex-end;
}

.detail-modal {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  background: #fff8ec;
  border-top: 1px solid rgba(130, 112, 88, 0.2);
  padding: 14px 14px calc(14px + var(--mq-safe-bottom));
  position: relative;
}

.detail-close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(130, 112, 88, 0.22);
  background: #f7efde;
  color: #7f6d57;
  font-size: 1rem;
  line-height: 1;
}

.detail-image {
  width: 100%;
  aspect-ratio: 587 / 357;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(130, 112, 88, 0.2);
  background: #efe3d5;
}

.detail-name {
  margin: 12px 0 0;
  font-size: 1.05rem;
  font-weight: 750;
  color: #3f372f;
}

.detail-copy {
  margin: 6px 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #6f6356;
}

.detail-price-row {
  margin-top: 10px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-price {
  font-size: 1rem;
  font-weight: 750;
  color: #9b753f;
}

.detail-points {
  font-size: 0.78rem;
  font-weight: 650;
  color: #8a6b3a;
}

.detail-tabs {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.detail-tab {
  min-height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(130, 112, 88, 0.24);
  background: #f7f0e3;
  color: #7a6b59;
  font-size: 0.74rem;
  font-weight: 650;
}

.detail-tab.active {
  border-color: #b48a4e;
  background: #fff3dc;
  color: #7c5418;
}

.detail-tab-copy {
  margin: 10px 0 0;
  font-size: 0.78rem;
  color: #6f6356;
}

.detail-primary-btn {
  margin-top: 10px;
  width: 100%;
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(160, 119, 54, 0.34);
  background: #e7d2a7;
  color: #6f4d1f;
  font-size: 0.86rem;
  font-weight: 700;
}

.cart-fab {
  position: fixed;
  right: 18px;
  bottom: calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 88px);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid rgba(130, 112, 88, 0.26);
  background: #fff4de;
  color: #8d6a33;
  box-shadow: 0 8px 18px rgba(72, 52, 21, 0.18);
  display: grid;
  place-items: center;
  z-index: 110;
}

.cart-fab svg {
  width: 21px;
  height: 21px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -3px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #b9853f;
  color: #fff9ef;
  font-size: 0.65rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cart-panel {
  position: fixed;
  right: 14px;
  bottom: calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 146px);
  width: min(320px, calc(100vw - 28px));
  max-height: 320px;
  border-radius: 14px;
  border: 1px solid rgba(130, 112, 88, 0.24);
  background: #fff9ef;
  box-shadow: 0 14px 24px rgba(67, 49, 22, 0.2);
  z-index: 115;
  display: flex;
  flex-direction: column;
}

.cart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(130, 112, 88, 0.14);
}

.cart-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #4a4035;
}

.cart-close {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(130, 112, 88, 0.2);
  background: #f7efde;
  color: #7f6d57;
  line-height: 1;
}

.cart-list {
  list-style: none;
  margin: 0;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid rgba(130, 112, 88, 0.16);
  background: #fffcf6;
}

.cart-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(130, 112, 88, 0.16);
}

.cart-copy {
  min-width: 0;
  flex: 1;
}

.cart-name {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 650;
  color: #4a4035;
}

.cart-meta {
  margin: 2px 0 0;
  font-size: 0.7rem;
  color: #867460;
}

.cart-meta-row {
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cart-qty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.qty-btn {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(141, 106, 51, 0.45);
  background: #fff9ef;
  color: #8d6a33;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.qty-btn:disabled {
  opacity: 0.45;
}

.qty-value {
  min-width: 12px;
  text-align: center;
  font-size: 0.72rem;
  color: #7a6b59;
  font-weight: 700;
}

.cart-remove {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8d6a33;
  display: grid;
  place-items: center;
}

.cart-remove svg {
  width: 16px;
  height: 16px;
  display: block;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cart-empty {
  margin: 0;
  padding: 18px 12px;
  text-align: center;
  color: #877665;
  font-size: 0.78rem;
}

.cart-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-top: 1px solid rgba(130, 112, 88, 0.14);
  background: #f9f1e1;
}

.cart-foot-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.cart-total-label {
  font-size: 0.76rem;
  color: #867460;
}

.cart-total-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #7c5418;
}

.cart-total-points {
  font-size: 0.76rem;
  font-weight: 600;
  color: #8a6b3a;
}

.cart-buy-btn {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #b98a3d;
  background: #b98a3d;
  color: #fffdf8;
  font-size: 0.76rem;
  font-weight: 700;
}

.cart-buy-btn:disabled {
  opacity: 0.5;
}

@media (max-width: 400px) {
  .cart-fab {
    right: 12px;
    bottom: calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 82px);
    width: 46px;
    height: 46px;
  }

  .cart-panel {
    right: 10px;
    width: calc(100vw - 20px);
    max-height: min(56vh, 360px);
    bottom: calc(var(--mq-nav-h) + var(--mq-safe-bottom) + 132px);
    border-radius: 12px;
  }

  .cart-head {
    padding: 9px 10px;
  }

  .cart-list {
    padding: 7px 8px;
    gap: 7px;
  }

  .cart-item {
    gap: 7px;
    padding: 6px;
  }

  .cart-thumb {
    width: 40px;
    height: 40px;
  }

  .cart-name {
    font-size: 0.74rem;
  }

  .cart-meta {
    font-size: 0.66rem;
  }

  .cart-foot {
    padding: 8px 10px;
  }

  .cart-buy-btn {
    min-height: 28px;
    padding: 0 10px;
    font-size: 0.72rem;
  }
}
</style>
