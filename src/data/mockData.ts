import { TabConfig, StoryItem, AudioTrack, MemoryVideoItem, AvatarForm, SceneSetting } from '../types';
import mechaCatAvatar from '../assets/mecha_cat_avatar.jpg';

export const TABS_CONFIG: TabConfig[] = [
  {
    key: 'earth',
    element: '土',
    tag: '地点',
    title: '灵性空间',
    badge: '⛰️ 土 · 地点 · 总框架容器',
    subtitle: '万物承载，为所有体验提供发生的场域与框架',
    iconName: 'landmark',
    glowColor: 'from-amber-500/20 via-teal-500/10 to-transparent',
    accentColor: '#10b981',
  },
  {
    key: 'wood',
    element: '木',
    tag: '人',
    title: '日常交互',
    badge: '🌿 木 · 人 · 人际生发',
    subtitle: '以人为核心的对话、沟通、互动、触发入口',
    iconName: 'message-circle',
    glowColor: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    accentColor: '#10b981',
  },
  {
    key: 'fire',
    element: '火',
    tag: '事',
    title: '乐律心声',
    badge: '🔥 火 · 事 · 情绪发生',
    subtitle: '以有序声韵触动人心情绪，生发当下体验之事',
    iconName: 'music',
    glowColor: 'from-rose-500/20 via-orange-500/10 to-transparent',
    accentColor: '#f43f5e',
  },
  {
    key: 'metal',
    element: '金',
    tag: '物',
    title: '哲理故事',
    badge: '💎 金 · 物 · 内容沉淀',
    subtitle: '文字载道，沉淀叙事内核，为影像演绎提供本源剧本',
    iconName: 'book-open',
    glowColor: 'from-yellow-500/20 via-amber-500/10 to-transparent',
    accentColor: '#fbbf24',
  },
  {
    key: 'water',
    element: '水',
    tag: '时间',
    title: '影像载忆',
    badge: '🌊 水 · 时间 · 记忆留存',
    subtitle: '将文字故事与音律情绪，化作可视影像，延续记忆、演绎篇章',
    iconName: 'film',
    glowColor: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    accentColor: '#38bdf8',
  },
];

export const INITIAL_STORIES: StoryItem[] = [
  {
    id: 'story-1',
    icon: '✨',
    title: '星辰与尘埃',
    summary: '一粒尘埃仰望星空，问风：我如此渺小，存在有何意义？风不语，只是托起它，让它飞向银河深处……',
    category: '宇宙哲思',
    readTime: '3 分钟',
    themeMoral: '浩瀚与微渺本出同源，每一粒微尘里，都沉睡着整座星河的梦境。',
    content: [
      '在无垠天幕的下沿，一粒微茫的尘埃在长夜的缝隙中苏醒。它低头看着自己几近透明的轮廓，又抬头望向苍穹中燃烧千亿年的恒星。',
      '它问过往的长风：“风啊，星辰炽热永恒，照耀千重世界，而我轻若无物，稍纵即逝。我的存在，究竟有何意义？”',
      '风没有说话。它只是放慢了穿行虚空的羽翼，轻轻兜起尘埃，向上、再向上升腾。穿过云层，穿过寂静的大气，直至跃入冰蓝色的银河深渊。',
      '在那里，恒星正在坍缩与初生。风轻声说：“看吧，那撕裂虚空的璀璨光芒，正是亿万像你一样的微尘聚合所成。没有一粒尘埃的归位，星河便是一片荒芜的虚空。”',
      '尘埃闭上眼，终于感受到体内那来自创世之初的星核余温。原来，它不是星空的看客，它本身就是尚未苏醒的光。'
    ]
  },
  {
    id: 'story-2',
    icon: '🌊',
    title: '河与岸的对话',
    summary: '河水问岸：你为何总是阻我前行？岸答：我只为护你，不让你迷失在荒野之中。河流不息，岸亦永恒相伴。',
    category: '人生寓言',
    readTime: '4 分钟',
    themeMoral: '真正的自由从来不是决堤的放纵，而是在守望的河道里，奔向汪洋大地的从容。',
    content: [
      '滔滔河水奔流了不知几千个昼夜。它撞击着两旁的青石与泥岸，发出一阵阵沉重的叹息。',
      '“岸啊，你为何日夜横亘在我身旁，束缚我的双臂？若没有你，我本可以漫过整片原野，拥抱无尽的大地。”河水愤愤地问。',
      '岸沉默良久，任由水浪拍打出细碎的白沫，而后温和作答：“我的孩子，若没有这重重石崖的约束，当烈日炙烤时，你散漫的涓滴会在半日内蒸发殆尽；当你漫入沙漠，便会化为无痕的泥沼。”',
      '“我立在此处，不是为了阻断你的自由，而是为了凝聚你的势能，引你穿过重峦叠嶂，最终完整地投入大海的怀抱。”',
      '河水渐渐平静下来，倒映出两岸依依的垂柳与星月。它终于懂得，最深沉的陪伴，是为你筑起奔向广阔的界限。'
    ]
  },
  {
    id: 'story-3',
    icon: '🌱',
    title: '种子的旅程',
    summary: '一颗种子被风吹落岩缝，黑暗、干涸、孤寂。它向内缩了又缩，却发现那里有一滴千年不化的泉水……',
    category: '生命启示',
    readTime: '3 分钟',
    themeMoral: '绝境是向内生长的契机，最坚韧的破土，往往始于暗夜深处的自洽。',
    content: [
      '那是一颗很小很硬的种子，被骤雨后的疾风卷起，无情地抛入了万丈绝壁的夹缝中。',
      '这里没有沃土，没有和煦的日光，只有刺骨的寒风和冷硬的玄武岩。种子在缝隙里瑟缩着，感到了前所未有的绝望与枯竭。',
      '它试着向外张望，却只看到深不见底的深渊。痛苦之中，它不再试图向外挣扎，而是缓缓合拢所有的呼吸，向自己的核心探寻。',
      '就在那最深、最冷沉的内核处，它忽然触碰到了潜藏已久的一缕清润——那是大地地脉深处凝结在岩隙里的甘露，等待了上千年。',
      '“原来生机从未在远方，它始终深藏在我的寂静之中。”种子在暗夜中悄然吐出第一根白须，顺着岩缝扎入石骨。第二年春天，绝壁之巅多了一株傲雪的青松。'
    ]
  },
  {
    id: 'story-4',
    icon: '🪞',
    title: '止水明镜',
    summary: '旅人行至深谷，见幽泉如镜。风掠水起涟漪，万物皆散；风止泉平，天地复归澄明。',
    category: '心性修持',
    readTime: '2 分钟',
    themeMoral: '心若止水，波澜不惊；物来则应，过去不留。',
    content: [
      '一位满身尘土的行者来到深山隐泉边。他心烦意乱，双眼布满血丝，在泉水中只能看到自己扭曲破碎的面容。',
      '山风掠过水面，泛起圈圈褶皱，将岸边的古木、飞鸟与高山撕得粉碎。行者急躁地伸手去按抚水面，水波却激荡得更加剧烈。',
      '老禅僧在旁静坐，轻道：“息手，静待。”行者缩回手，收敛呼吸，端坐于青苔岩上。',
      '不知过了多久，狂风止息，树叶归根。池水一点一点抚平了褶痕，如同一面剔透的寒镜。行者再看水面，不仅看清了自己的面容，更清晰照见了苍穹中悠然漂浮的白云。'
    ]
  }
];

export const INITIAL_TRACKS: AudioTrack[] = [
  {
    id: 'track-1',
    title: '如果如果是如果',
    artist: '乌兰托娅',
    duration: 279, // 4:39
    fileSize: '10.7MB',
    category: '抒情民谣',
    synthPreset: 'lullaby',
    lyrics: [
      '月光轻轻洒落在这片原野上',
      '如果如果是如果，风带走曾经的誓言',
      '山川无言，唯有星光长伴左右',
      '在每一个宁静的夜晚，倾听心底的回响',
      '如果时光可以倒流，愿化作一泓春水',
      '轻抚你眉宇间的疲惫与沧桑',
      '心安之处即是归途，琴声悠悠远去……'
    ]
  },
  {
    id: 'track-2',
    title: '月光之海',
    artist: '灵伴治愈工坊',
    duration: 312,
    fileSize: '8.4MB',
    category: '冥想静心',
    synthPreset: 'ocean',
    lyrics: [
      '潮水轻拍记忆的沙滩',
      '月影溶于深蓝色的波涛',
      '放下尘世的一切繁杂喧嚣',
      '在海浪的呼吸中，找回久违的安宁',
      '吸气，接纳这一刻的存在',
      '呼气，释放所有的执念与重担'
    ]
  },
  {
    id: 'track-3',
    title: '星汉长流',
    artist: '空灵天籁',
    duration: 254,
    fileSize: '7.2MB',
    category: '宇宙白噪',
    synthPreset: 'stars',
    lyrics: [
      '恒星的低吟跨越亿万光年',
      '我们皆是星尘凝结的旅人',
      '漫步在幽静的银河之畔',
      '聆听宇宙最深处的呼吸'
    ]
  },
  {
    id: 'track-4',
    title: '幽涧清泉',
    artist: '禅心古韵',
    duration: 218,
    fileSize: '6.1MB',
    category: '国风空灵',
    synthPreset: 'flute',
    lyrics: [
      '石上清泉流，竹林晚风凉',
      '松子随风落，禅意满空山',
      '心无挂碍处，处处是桃源'
    ]
  }
];

export const INITIAL_VIDEOS: MemoryVideoItem[] = [
  {
    id: 'vid-1',
    season: '春',
    year: '2025',
    title: '星辰与尘埃',
    desc: '一粒尘埃的银河之旅 · 动画短片',
    format: '动画短片',
    durationStr: '2分18秒',
    category: '宇宙哲思系列',
    themePreset: 'stars'
  },
  {
    id: 'vid-2',
    season: '夏',
    year: '2025',
    title: '河与岸的对话',
    desc: '河流与永恒的相伴 · 连环画',
    format: '连环画',
    durationStr: '3分12秒',
    category: '生命启示系列',
    themePreset: 'river'
  },
  {
    id: 'vid-3',
    season: '秋',
    year: '2025',
    title: '种子的旅程',
    desc: '岩缝中的千年泉水 · 图文影像',
    format: '图文影像',
    durationStr: '2分45秒',
    category: '心性修持系列',
    themePreset: 'seed'
  },
  {
    id: 'vid-4',
    season: '冬',
    year: '2025',
    title: '归途微光',
    desc: '岁末静谧时的自性回望 · 动态画卷',
    format: '动态画卷',
    durationStr: '4分02秒',
    category: '岁月静好系列',
    themePreset: 'winter'
  }
];

export const AVATAR_FORMS: AvatarForm[] = [
  {
    id: 'cyber-mecha-cat',
    name: '谷歌智灵机器猫',
    element: '金',
    title: '未来科技伴侣 · 歌词创生者',
    description: '披挂未来战甲与全息灵羽的赛博智灵猫，搭载谷歌 Gemini AI 超脑，善解声韵，具备根据歌词创作唯美哲思微故事的通感神力。',
    glowAura: 'from-cyan-400 via-sky-500 to-indigo-600',
    sparkColor: '#00f2fe',
    imageUrl: mechaCatAvatar,
  },
  {
    id: 'spirit-orb',
    name: '幻光灵魄',
    element: '水',
    title: '初醒之灵',
    description: '纯粹的灵性能量聚合成的幽蓝明珠，随呼吸散发抚平心神的光晕。',
    glowAura: 'from-cyan-400 via-indigo-500 to-purple-600',
    sparkColor: '#38bdf8'
  },
  {
    id: 'celestial-fox',
    name: '琉璃仙狐',
    element: '火',
    title: '伴生明火',
    description: '通体如琉璃晶莹的九尾灵狐，跳跃间化作暖橙色星火，驱散长夜阴霾。',
    glowAura: 'from-amber-400 via-rose-500 to-orange-600',
    sparkColor: '#fb923c'
  },
  {
    id: 'astral-traveler',
    name: '星芒旅者',
    element: '金',
    title: '星穹引路人',
    description: '身披星芒织成的流光羽衣，怀抱指引迷途灵魂归家的金色罗盘。',
    glowAura: 'from-yellow-300 via-amber-400 to-emerald-500',
    sparkColor: '#facc15'
  },
  {
    id: 'dew-guardian',
    name: '微光守望者',
    element: '木',
    title: '碧波守护神',
    description: '诞生于初生草叶尖端的一滴晨露，散发着安抚生灵的温润青芒。',
    glowAura: 'from-emerald-400 via-teal-500 to-cyan-500',
    sparkColor: '#34d399'
  }
];

export const SCENES: SceneSetting[] = [
  {
    id: 'scene-moon-flowers',
    name: '月光花海',
    weather: '现实夜色',
    wind: '8 km/h 微风',
    ambientLight: 'rgba(56, 189, 248, 0.15)',
    bgGradient: 'from-[#080811] via-[#0d1024] to-[#120e29]'
  },
  {
    id: 'scene-starfield',
    name: '星野之境',
    weather: '星空澄澈',
    wind: '4 km/h 幽风',
    ambientLight: 'rgba(168, 85, 247, 0.18)',
    bgGradient: 'from-[#05060f] via-[#0a0d20] to-[#140b25]'
  },
  {
    id: 'scene-mist-mountain',
    name: '苍山浮云',
    weather: '空山微雨',
    wind: '12 km/h 穿林风',
    ambientLight: 'rgba(16, 185, 129, 0.15)',
    bgGradient: 'from-[#060e12] via-[#081720] to-[#0c1f24]'
  },
  {
    id: 'scene-twilight-boat',
    name: '暮色归舟',
    weather: '烟霞初降',
    wind: '6 km/h 晚风',
    ambientLight: 'rgba(244, 63, 94, 0.15)',
    bgGradient: 'from-[#120814] via-[#1a0c24] to-[#20101c]'
  }
];
