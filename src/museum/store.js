import { reactive, computed } from "vue";

const initialArtifacts = [
  {
    id: "horus-falcon-statue",
    name: "Horus Falcon Statue",
    hallId: "h1",
    hallName: "Ancient Sculpture",
    story:
      "A stone sculpture from Late Ancient Egypt depicting Horus in falcon form as a guardian of the pharaoh, symbolizing kingship and divine protection. The proportions and detailed carving reflect the era's pursuit of order and eternity.",
    points: 30,
    modelGlb: "/models/HorusFalcon.glb",
  },
  {
    id: "dragon-motif-bowl",
    name: "Dragon Motif Bowl",
    hallId: "h2",
    hallName: "Millennia of Porcelain",
    story:
      "A high-fired glazed vessel decorated with dragon motifs, symbolizing protection, authority, and auspiciousness. The integration of form and ornament reflects both utilitarian and ceremonial functions, embodying craftsmanship, aesthetics, and social values.",
    points: 25,
    modelGlb: "/models/BowlWithDragons.glb",
  },
  {
    id: "aphrodite-eros-sculpture",
    name: "Aphrodite and Eros Sculpture",
    hallId: "h1",
    hallName: "Ancient Sculpture",
    story:
      "A sculptural tradition from the Classical period extending into the Hellenistic and Roman worlds, often portraying mythological themes of love and beauty. The treatment of posture and drapery emphasizes volume and light, reflecting ancient studies of human proportions.",
    points: 20,
    modelGlb: "/models/AphroditeEros.glb",
  },
  {
    id: "statue-of-ur-ningirsu",
    name: "Statue of Ur-Ningirsu (Sumerian)",
    hallId: "h3",
    hallName: "Mesopotamian Civilization",
    story:
      "A sculpture from around 2080 BCE in Mesopotamia, depicting a figure with clasped hands in a gesture of prayer, commonly used as a temple offering. Its simplified yet powerful form, along with inscriptions, documents authority, belief, and the order of city-states.",
    points: 28,
    modelGlb: "/models/UrNingirsuStatue.glb",
  },
  {
    id: "bronze-bull-head-ornament",
    name: "Bronze Bull Head Ornament",
    hallId: "h3",
    hallName: "Bronze Age",
    story:
      "Animal motifs frequently appear in early metalwork, with the bull symbolizing strength and protection. Such ornaments may have served as handles, pendants, or ritual components, showcasing ancient metallurgical and artistic capabilities.",
    points: 18,
    modelGlb: "/models/BronzeBullHead.glb",
  },
  {
    id: "silver-gilt-bowl",
    name: "Gilt Silver Bowl",
    hallId: "h2",
    hallName: "Gold and Silver Craftsmanship",
    story:
      "A vessel made of silver with a gilded surface, combining the luster of precious metals with durability. Often associated with banquets, rituals, or status display, it reflects advanced metalworking techniques and cross-cultural exchanges.",
    points: 22,
    modelGlb: "/models/SilverGiltBowl.glb",
  },
  {
    id: "gelede-helmet-mask",
    name: "Gelede Helmet Mask",
    hallId: "h3",
    hallName: "Rituals and Masks",
    story:
      "A ceremonial mask from the Yoruba culture of West Africa, used in festivals and community rituals to honor female power and social harmony. Carved wood and painted elements combine human and symbolic features, presenting narrative and communal aesthetics.",
    points: 24,
    modelGlb: "/models/GeledeHelmetMask.glb",
  },
  {
    id: "preaching-buddha-statue",
    name: "Preaching Buddha Statue",
    hallId: "h1",
    hallName: "Ancient Sculpture",
    story:
      "Depicting the Buddha in the gesture of teaching (Dharmachakra Mudra), this form represents moments of sermon and enlightenment. The treatment of drapery, hand gestures, and facial expression conveys serenity and spiritual instruction, while reflecting regional stylistic variations in Buddhist art.",
    points: 26,
    modelGlb: "/models/buddha_preaching.glb",
  },
  {
    id: "weeping-cow-sculpture",
    name: "Weeping Cow Sculpture",
    hallId: "h1",
    hallName: "Ancient Sculpture",
    story:
      "Animal sculptures are often imbued with emotional expression. This work uses exaggerated eyes, head posture, and body mass to evoke empathy, portraying themes of mourning, protection, or sacrifice, while demonstrating the sculptural capture of vitality.",
    points: 19,
    modelGlb: "/models/crying_cow_sculpture.glb",
  },
  {
    id: "fish-pond-model",
    name: "Fish Pond Model",
    hallId: "h2",
    hallName: "Gardens and Artifacts",
    story:
      "Fish pond motifs appear in gardens, decorative objects, and representations of daily life, reflecting observations of natural habitats and aspirations for abundance and vitality. The structure and arrangement of fish provide insights into spatial design and aesthetic preferences.",
    points: 17,
    modelGlb: "/models/fish-pond.glb",
  },
  {
    id: "fragmentary-isis-serqet-figure",
    name: "Fragmentary Figure of Isis-Serqet",
    hallId: "h1",
    hallName: "Ancient Sculpture",
    story:
      "Although incomplete, this fragmentary goddess figure preserves key elements of ancient Egyptian religious imagery. Posture, headdress, and surviving contours aid in identifying divine attributes, while also illustrating the processes of damage, circulation, and rediscovery over time.",
    points: 23,
    modelGlb: "/models/fragmentary_figure_of_the_goddess_isis-serqet.glb",
  },
  {
    id: "inscribed-clay-tablet",
    name: "Inscribed Clay Tablet",
    hallId: "h3",
    hallName: "Mesopotamian Civilization",
    story:
      "Clay tablets were a primary writing medium in Mesopotamia, used to record trade, rituals, administration, and legal matters. The cuneiform impressions preserve not only information but also evidence of writing tools, accounting systems, and urban governance.",
    points: 21,
    modelGlb: "/models/tablet.glb",
  },
];

const initialZones = [
  {
    id: "h1",
    name: "Ancient Sculpture",
    hint: "Largest hall on the west side of the floor plan",
    summary:
      "This gallery gathers major figurative and animal sculptures from several ancient traditions and serves as the anchor room of the exhibition.",
    exhibits: [
      "Horus Falcon Statue",
      "Aphrodite and Eros Sculpture",
      "Preaching Buddha Statue",
      "Weeping Cow Sculpture",
      "Fragmentary Figure of Isis-Serqet",
    ],
    lng: 120.7388,
    lat: 31.272,
  },
  {
    id: "h2",
    name: "Upper Route Galleries",
    hint: "Porcelain, metalwork, and garden displays",
    summary:
      "The upper route combines Millennia of Porcelain, Gold and Silver Craftsmanship, and Gardens and Artifacts into a sequence of decorative arts rooms.",
    exhibits: ["Dragon Motif Bowl", "Gilt Silver Bowl", "Fish Pond Model"],
    lng: 120.7414,
    lat: 31.2736,
  },
  {
    id: "h3",
    name: "Lower Route Galleries",
    hint: "Mesopotamia, ritual culture, and Bronze Age works",
    summary:
      "The lower route links writing, ritual, and early metallurgy through Mesopotamian Civilization, Rituals and Masks, and Bronze Age.",
    exhibits: [
      "Statue of Ur-Ningirsu (Sumerian)",
      "Inscribed Clay Tablet",
      "Gelede Helmet Mask",
      "Bronze Bull Head Ornament",
    ],
    lng: 120.7374,
    lat: 31.2742,
  },
];

const initialShop = [
  { id: "s1", name: "Museum Crest Bookmark", cost: 80, stock: 99 },
  { id: "s2", name: "Postcard Set", cost: 50, stock: 200 },
  { id: "s3", name: "Limited Canvas Tote", cost: 120, stock: 30 },
];

const initialPosts = [
  {
    id: "p1",
    author: "Gallery Explorer",
    text:
      "The Ancient Sculpture hall is the best place to start if you want the quickest overview of the whole exhibition.",
    likes: 42,
    liked: false,
  },
  {
    id: "p2",
    author: "Weekend Visitor",
    text:
      "The floor plan makes it much easier to connect the bowl, mask, and bronze pieces across different halls.",
    likes: 18,
    liked: false,
  },
];

export function createMuseumStore() {
  const state = reactive({
    points: 100,
    unlockedArtifactIds: ["horus-falcon-statue"],
    redeemedShopIds: [],
    artifacts: [...initialArtifacts],
    zones: [...initialZones],
    shopItems: [...initialShop],
    posts: initialPosts.map((p) => ({ ...p })),
    lastScan: null,
    toast: "",
  });

  const collectibles = computed(() =>
    state.artifacts.map((a) => ({
      ...a,
      unlocked: state.unlockedArtifactIds.includes(a.id),
    })),
  );

  const unlockedCount = computed(() => state.unlockedArtifactIds.length);

  let toastTimer;
  function showToast(msg) {
    state.toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      state.toast = "";
    }, 2200);
  }

  function scanArtifact(artifactId) {
    const art = state.artifacts.find((a) => a.id === artifactId);
    if (!art) return;
    const already = state.unlockedArtifactIds.includes(artifactId);
    if (!already) {
      state.unlockedArtifactIds.push(artifactId);
      state.points += art.points;
      showToast(`Unlocked ${art.name} +${art.points} pts`);
    } else {
      state.points += 5;
      showToast(`Revisited ${art.name} +5 pts`);
    }
    state.lastScan = { ...art, already };
  }

  function redeem(itemId) {
    const item = state.shopItems.find((i) => i.id === itemId);
    if (!item || state.redeemedShopIds.includes(itemId)) return false;
    if (state.points < item.cost) {
      showToast("Not enough points");
      return false;
    }
    state.points -= item.cost;
    state.redeemedShopIds.push(itemId);
    showToast(`Redeemed ${item.name}`);
    return true;
  }

  function toggleLike(postId) {
    const p = state.posts.find((x) => x.id === postId);
    if (!p) return;
    if (p.liked) {
      p.liked = false;
      p.likes = Math.max(0, p.likes - 1);
    } else {
      p.liked = true;
      p.likes += 1;
    }
  }

  function addPost(text) {
    const t = text.trim();
    if (!t) return;
    state.posts.unshift({
      id: "p" + Date.now(),
      author: "You",
      text: t,
      likes: 0,
      liked: false,
    });
    state.points += 5;
    showToast("Post published +5 pts");
  }

  return {
    state,
    collectibles,
    unlockedCount,
    scanArtifact,
    redeem,
    toggleLike,
    addPost,
  };
}
