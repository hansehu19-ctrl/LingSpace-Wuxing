export type TabKey = 'earth' | 'wood' | 'fire' | 'metal' | 'water';

export interface TabConfig {
  key: TabKey;
  element: string; // 土, 木, 火, 金, 水
  tag: string; // 地点, 人, 事, 物, 时间
  title: string; // 灵性空间, 日常交互, 乐律心声, 哲理故事, 影像载忆
  badge: string; // e.g. ⛰️ 土 · 地点 · 总框架容器
  subtitle: string;
  iconName: string;
  glowColor: string;
  accentColor: string;
}

export interface ElementTimeRecord {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface ElementAchievement {
  element: TabKey;
  hanzi: string;
  name: string;
  role: string;
  tabKey: TabKey;
  targetSeconds: number;
  timeSpent: number;
  isUnlocked: boolean;
  desc: string;
}

export type CombinationType = '单选' | '两两组合' | '三者全组合';

export interface CrossIndexMatrix {
  id: string;
  matrixId?: string;
  userId?: string;
  combinationType: CombinationType;
  theme: string;
  musicModule?: {
    summary: string;
    googleMusicIndex: string;
  };
  storyModule?: {
    summary: string;
    googleBooksIndex: string;
  };
  videoModule?: {
    summary: string;
    youtubeIndex: string;
  };
  coherenceCheck: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionHint?: {
    tabKey: TabKey;
    label: string;
  };
  storyCard?: {
    title: string;
    summary: string;
    themeMoral: string;
    content: string[];
    lyricsSource?: string;
  };
  matrixCard?: CrossIndexMatrix;
}

export interface StoryItem {
  id: string;
  icon: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  content: string[];
  themeMoral: string;
}

export interface UserStory {
  id: string;
  storyId: string;
  userId: string;
  title: string;
  summary: string;
  themeMoral: string;
  content: string[];
  lyricsSource?: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  fileSize?: string;
  category: string;
  synthPreset: 'ocean' | 'stars' | 'flute' | 'lullaby' | 'custom';
  fileUrl?: string; // If user uploaded
  lyrics?: string[];
  notes?: string; // 备注
  lastPlayedProgress?: number; // 最后播放进度 (秒)
  createdAt?: string;
  updatedAt?: string;
}

export interface MemoryVideoItem {
  id: string;
  season: string;
  year: string;
  title: string;
  desc: string;
  format: string; // 动画短片, 连环画, 图文影像
  durationStr: string;
  category: string;
  themePreset: 'stars' | 'river' | 'seed' | 'winter';
}

export interface AvatarForm {
  id: string;
  name: string;
  element: string;
  title: string;
  description: string;
  glowAura: string;
  sparkColor: string;
  imageUrl?: string;
}

export interface SceneSetting {
  id: string;
  name: string;
  weather: string;
  wind: string;
  ambientLight: string;
  bgGradient: string;
}
