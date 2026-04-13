import { reactive, computed } from 'vue'

/**
 * 同源 GLB（见 public/models/），避免从 GitHub raw 拉取在国内/移动网络被墙或超时导致黑屏。
 * 正式环境可替换为馆方模型，仍建议放在 public 或己方 CDN。
 */
const initialArtifacts = [
  {
    id: 'bronze-ding',
    name: '荷鲁斯护王像（猎隼神）',
    hallId: 'h1',
    hallName: '古代雕塑',
    story:
      '古埃及晚期的石雕作品，荷鲁斯以猎隼形象守护法老，象征王权与神祇庇佑。雕像的比例与细部刻画体现了当时对秩序与永恒的追求。',
    points: 30,
    modelGlb: '/models/HorusFalcon.glb',
  },
  {
    id: 'porcelain-vase',
    name: '龙纹碗',
    hallId: 'h2',
    hallName: '瓷韵千年',
    story:
      '高温烧造的釉面器皿，纹饰以龙为主题，寓意守护、权威与吉祥。器形与装饰的结合兼具日用与礼仪属性，是工艺、审美与社会观念的缩影。',
    points: 25,
    modelGlb: '/models/BowlWithDragons.glb',
  },
  {
    id: 'jade-bi',
    name: '阿芙罗狄忒与厄洛斯像',
    hallId: 'h1',
    hallName: '古代雕塑',
    story:
      '古典时期的石雕传统延续至希腊化/罗马世界，常以神话母题呈现爱与美的理想形象。人物姿态与衣褶处理强调体量与光影，体现古代艺术对人体比例的研究。',
    points: 20,
    modelGlb: '/models/AphroditeEros.glb',
  },
  {
    id: 'urn-ingirsu',
    name: '乌尔-宁吉尔苏像（苏美尔）',
    hallId: 'h3',
    hallName: '两河文明',
    story:
      '约公元前 2080 年的两河流域雕像，人物双手合拢呈祈祷姿，常见于神庙奉献物。简洁有力的体块与刻写信息，记录了权力、信仰与城市国家的秩序。',
    points: 28,
    modelGlb: '/models/UrNingirsuStatue.glb',
  },
  {
    id: 'bronze-bull-head',
    name: '青铜牛首饰件',
    hallId: 'h1',
    hallName: '青铜时代',
    story:
      '早期金属器上常见动物形象装饰，牛首象征力量与守护，也可能用于器物把手、挂饰或礼仪构件。铸造与打磨痕迹能直观呈现古代冶金与造型能力。',
    points: 18,
    modelGlb: '/models/BronzeBullHead.glb',
  },
  {
    id: 'silver-gilt-bowl',
    name: '鎏金银碗',
    hallId: 'h2',
    hallName: '金银工艺',
    story:
      '以银为胎、表面鎏金的器皿，兼具贵金属光泽与耐久性，常与宴飨、祭献或身份象征相关。金银器的锤揲与鎏金工艺体现了高超的金工技术与跨文化交流。',
    points: 22,
    modelGlb: '/models/SilverGiltBowl.glb',
  },
  {
    id: 'gelede-helmet-mask',
    name: '格莱德（Gẹ̀lẹ̀dẹ́）头盔面具',
    hallId: 'h3',
    hallName: '仪式与面具',
    story:
      '西非约鲁巴文化的仪式面具，多用于节庆表演与社区仪式，强调对女性力量与社会和谐的敬意。木雕与彩绘将人物与象征元素组合，呈现故事性与公共审美。',
    points: 24,
    modelGlb: '/models/GeledeHelmetMask.glb',
  },
]

/** 示例坐标：苏州工业园区独墅湖一带（可改为真实馆址） */
const initialZones = [
  {
    id: 'h1',
    name: '青铜时代',
    hint: '推荐路线起点',
    lng: 120.7388,
    lat: 31.272,
  },
  {
    id: 'h2',
    name: '瓷韵与金银工艺',
    hint: '器物细节丰富',
    lng: 120.7414,
    lat: 31.2736,
  },
  {
    id: 'h3',
    name: '雕塑与仪式',
    hint: '请留意材质纹理与刻痕',
    lng: 120.7374,
    lat: 31.2742,
  },
]

const initialShop = [
  { id: 's1', name: '馆徽金属书签', cost: 80, stock: 99 },
  { id: 's2', name: '文物明信片套装', cost: 50, stock: 200 },
  { id: 's3', name: '限定帆布袋', cost: 120, stock: 30 },
]

const initialPosts = [
  {
    id: 'p1',
    author: '探馆小能手',
    text: '二展厅转角有个隐藏扫码点，扫完送了一张「夜场券」收藏品！',
    likes: 42,
    liked: false,
  },
  {
    id: 'p2',
    author: '周末遛娃',
    text: '孩子最喜欢扫描后的故事朗读，希望能出英文版～',
    likes: 18,
    liked: false,
  },
]

export function createMuseumStore() {
  const state = reactive({
    points: 100,
    unlockedArtifactIds: ['bronze-ding'],
    redeemedShopIds: [],
    artifacts: [...initialArtifacts],
    zones: [...initialZones],
    shopItems: [...initialShop],
    posts: initialPosts.map((p) => ({ ...p })),
    lastScan: null,
    toast: '',
  })

  const collectibles = computed(() =>
    state.artifacts.map((a) => ({
      ...a,
      unlocked: state.unlockedArtifactIds.includes(a.id),
    })),
  )

  const unlockedCount = computed(
    () => state.unlockedArtifactIds.length,
  )

  let toastTimer
  function showToast(msg) {
    state.toast = msg
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      state.toast = ''
    }, 2200)
  }

  function scanArtifact(artifactId) {
    const art = state.artifacts.find((a) => a.id === artifactId)
    if (!art) return
    const already = state.unlockedArtifactIds.includes(artifactId)
    if (!already) {
      state.unlockedArtifactIds.push(artifactId)
      state.points += art.points
      showToast(`获得收藏品「${art.name}」+${art.points} 积分`)
    } else {
      state.points += 5
      showToast(`重温「${art.name}」+5 积分`)
    }
    state.lastScan = { ...art, already }
  }

  function redeem(itemId) {
    const item = state.shopItems.find((i) => i.id === itemId)
    if (!item || state.redeemedShopIds.includes(itemId)) return false
    if (state.points < item.cost) {
      showToast('积分不足')
      return false
    }
    state.points -= item.cost
    state.redeemedShopIds.push(itemId)
    showToast(`已兑换「${item.name}」`)
    return true
  }

  function toggleLike(postId) {
    const p = state.posts.find((x) => x.id === postId)
    if (!p) return
    if (p.liked) {
      p.liked = false
      p.likes = Math.max(0, p.likes - 1)
    } else {
      p.liked = true
      p.likes += 1
    }
  }

  function addPost(text) {
    const t = text.trim()
    if (!t) return
    state.posts.unshift({
      id: 'p' + Date.now(),
      author: '我',
      text: t,
      likes: 0,
      liked: false,
    })
    state.points += 5
    showToast('发布成功 +5 积分')
  }

  return {
    state,
    collectibles,
    unlockedCount,
    scanArtifact,
    redeem,
    toggleLike,
    addPost,
  }
}
