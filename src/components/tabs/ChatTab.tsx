import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Music,
  BookOpen,
  Film,
  Feather,
  Wand2,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Check,
  Cloud,
  FileText,
  Clock,
  ExternalLink,
  Layers,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  ChatMessage,
  TabKey,
  AudioTrack,
  StoryItem,
  UserStory,
  CrossIndexMatrix,
  CombinationType,
} from '../../types';
import { audioEngine } from '../../utils/audioEngine';
import { useFirebase } from '../../context/FirebaseContext';
import mechaCatAvatar from '../../assets/mecha_cat_avatar.jpg';

type ModuleKey = 'music' | 'story' | 'video';

interface ChatTabProps {
  onSelectTab: (tab: TabKey) => void;
  onPlayRecommendedMusic?: () => void;
  currentTrack?: AudioTrack;
  tracks?: AudioTrack[];
  onSaveGeneratedStory?: (story: StoryItem) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  onSelectTab,
  onPlayRecommendedMusic,
  currentTrack,
  tracks = [],
  onSaveGeneratedStory,
}) => {
  const {
    user,
    syncChatMessage,
    cloudMessages,
    toggleBookmarkCloud,
    cloudStories,
    saveGeneratedStoryToFirestore,
    cloudMatrices,
    saveMatrixToFirestore,
  } = useFirebase();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: '你好！我是你的【谷歌灵智机甲猫】灵伴机器人。我搭载谷歌 Gemini 智能大模型，并内置两套核心指令规范：\n\n1️⃣ **三界同源交叉组合索引指令**：输入 `/matrix <主题>`（例如 `/matrix 时间的流逝与古老器物的守候`），可基于「火·乐律（谷歌音乐）/ 金·故事（谷歌图书）/ 水·影像（YouTube）」自由单选、两两组合或三者全组合检索！\n2️⃣ **歌词心灵哲思故事指令**：输入 `/story <歌曲名或歌词>`，即刻生成哲理微小说并存入 Firestore。',
      timestamp: '刚刚',
      actionHint: {
        tabKey: 'fire',
        label: '挑选曲目创生故事',
      },
    },
    {
      id: 'm2',
      sender: 'user',
      text: '/matrix 三者全组合 时间的淬炼与器物的守候',
      timestamp: '刚刚',
    },
    {
      id: 'm3',
      sender: 'ai',
      text: `【组合标签】：三者全组合
▷乐律心声｜火·事
内容简述：低沉悠远的氛围纯音乐，带着燃烧的热烈与沉静，讲述一场漫长的追寻与内心情绪的淬炼。
谷歌音乐索引：【https://music.youtube.com/search?q=deep+ambient+fire+meditation】
▷哲理故事｜金·物
内容简述：一块古老金属器物，历经岁月淬炼，在安静的等待中见证世间得失与因缘聚散。
谷歌图书索引：【https://books.google.com/books?q=ancient+vessel+philosophy+time】
▷影像载忆｜水·时间
内容简述：流动水面光影，时间缓慢流逝，金属器物在水波倒影中静静伫立，如梦似幻。
YouTube索引：【https://www.youtube.com/results?search_query=flowing+water+mindful+time】
【主题匹配校验】：确认三者意境同源匹配：音乐烘托淬炼心绪，故事承载古器哲理，影像展现流水时光。`,
      timestamp: '刚刚',
      matrixCard: {
        id: 'matrix-sample-1',
        combinationType: '三者全组合',
        theme: '时间的淬炼与器物的守候',
        musicModule: {
          summary: '低沉悠远的氛围纯音乐，带着燃烧的热烈与沉静，讲述一场漫长的追寻与内心情绪的淬炼。',
          googleMusicIndex: 'https://music.youtube.com/search?q=deep+ambient+fire+meditation',
        },
        storyModule: {
          summary: '一块古老金属器物，历经岁月淬炼，在安静的等待中见证世间得失与因缘聚散。',
          googleBooksIndex: 'https://books.google.com/books?q=ancient+vessel+philosophy+time',
        },
        videoModule: {
          summary: '流动水面光影，时间缓慢流逝，金属器物在水波倒影中静静伫立，如梦似幻。',
          youtubeIndex: 'https://www.youtube.com/results?search_query=flowing+water+mindful+time',
        },
        coherenceCheck: '确认三者意境同源匹配：音乐烘托情绪，故事承载意境，影像映射光影流变。',
      },
    },
  ]);

  // Merge cloud messages if available
  useEffect(() => {
    if (cloudMessages.length > 0) {
      setMessages(cloudMessages);
    }
  }, [cloudMessages]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWorkshopOpen, setIsWorkshopOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Cross-Index Matrix Workshop State
  const [matrixCombinationType, setMatrixCombinationType] = useState<CombinationType>('三者全组合');
  const [matrixSelectedModules, setMatrixSelectedModules] = useState<('music' | 'story' | 'video')[]>([
    'music',
    'story',
    'video',
  ]);
  const [matrixThemeInput, setMatrixThemeInput] = useState<string>('时间的流转与古老器物的守候');

  const [selectedTrackId, setSelectedTrackId] = useState<string>(currentTrack?.id || tracks[0]?.id || 'default');
  const [selectedStyle, setSelectedStyle] = useState<'治愈寓言' | '东方禅意' | '星海微小说' | '奇幻童话'>('治愈寓言');
  const [customLyricsText, setCustomLyricsText] = useState<string>('');
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const [savedStoryIds, setSavedStoryIds] = useState<Set<string>>(new Set());
  const [firestoreSavedNotice, setFirestoreSavedNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selected track when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      setSelectedTrackId(currentTrack.id);
      if (currentTrack.lyrics && currentTrack.lyrics.length > 0) {
        setCustomLyricsText(currentTrack.lyrics.slice(0, 8).join('\n'));
      }
    }
  }, [currentTrack]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Track currently selected in workshop
  const activeWorkshopTrack = tracks.find((t) => t.id === selectedTrackId) || currentTrack || tracks[0];

  // Helper: Trigger Cross-Matrix Generation with Google Triad Indices
  const executeMatrixGeneration = async (
    theme: string,
    combinationType: CombinationType = matrixCombinationType,
    selectedModules: ('music' | 'story' | 'video')[] = matrixSelectedModules,
    swapModule?: 'music' | 'story' | 'video',
    existingData?: CrossIndexMatrix
  ) => {
    setIsTyping(true);
    audioEngine.playChime(680);

    const userCommandText = swapModule
      ? `/matrix 单独更换【${swapModule === 'music' ? '乐律心声' : swapModule === 'story' ? '哲理故事' : '影像载忆'}】 主题：${theme}`
      : `/matrix 【${combinationType}】 ${theme}`;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userCommandText,
      timestamp: '刚刚',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (user) {
      syncChatMessage({ sender: 'user', text: userCommandText });
    }

    try {
      const res = await fetch('/api/cross-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          combinationType,
          selectedModules,
          theme,
          swapModule,
          existingData,
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      if (data && data.matrixCard) {
        const matrixCard: CrossIndexMatrix = {
          ...data.matrixCard,
          id: `matrix-${Date.now()}`,
          combinationType,
          theme,
        };

        // Save to Firestore user records
        if (user) {
          await saveMatrixToFirestore(matrixCard);
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.text,
          timestamp: '刚刚',
          matrixCard,
        };

        setMessages((prev) => [...prev, aiMsg]);
        audioEngine.playChime(800);

        if (user) {
          syncChatMessage({ sender: 'ai', text: data.text });
        }

        setFirestoreSavedNotice(`已存入三界索引矩阵：【${combinationType}】${theme}`);
        setTimeout(() => setFirestoreSavedNotice(null), 4000);
      }
    } catch (err) {
      console.error('Matrix generation error:', err);
      setIsTyping(false);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `【组合标签】：${combinationType}\n▷乐律心声｜火·事\n内容简述：声韵悠扬，烘托内心情感。\n谷歌音乐索引：【https://music.youtube.com/search?q=ambient+meditation】\n▷哲理故事｜金·物\n内容简述：器物静穆，历经洗练见初心。\n谷歌图书索引：【https://books.google.com/books?q=ancient+philosophy】\n▷影像载忆｜水·时间\n内容简述：流水倒影，时间缓缓流逝。\nYouTube索引：【https://www.youtube.com/results?search_query=flowing+water+time】\n【主题匹配校验】：确认三者意境同源匹配。`,
        timestamp: '刚刚',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  // Helper: Execute the Gemini lyrics-story workflow and save to Firestore
  const executeStoryGenerationAndSave = async (
    targetQuery: string,
    providedLyrics?: string,
    styleChoice: string = selectedStyle
  ) => {
    setIsTyping(true);

    const cleanQuery = targetQuery.replace(/[《》]/g, '').trim();
    const matchedTrack = tracks.find(
      (t) =>
        t.title.toLowerCase() === cleanQuery.toLowerCase() ||
        t.title.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        cleanQuery.toLowerCase().includes(t.title.toLowerCase())
    );

    let lyricsPayload: string[] = [];
    if (providedLyrics && providedLyrics.trim()) {
      lyricsPayload = providedLyrics.split('\n');
    } else if (matchedTrack?.lyrics && matchedTrack.lyrics.length > 0) {
      lyricsPayload = matchedTrack.lyrics;
    } else if (cleanQuery.length > 15) {
      lyricsPayload = cleanQuery.split(/[\n，。、]/).filter(Boolean);
    } else {
      lyricsPayload = [
        `以《${cleanQuery || matchedTrack?.title || '月光之海'}》为灵感：万物静寂，心归安宁，在浮沉时光里探寻原初真我。`,
      ];
    }

    const trackTitle = matchedTrack?.title || cleanQuery || '歌词意象';
    const trackArtist = matchedTrack?.artist || '灵伴空间';

    try {
      const res = await fetch('/api/lyrics-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: lyricsPayload,
          trackTitle,
          trackArtist,
          style: styleChoice,
          prompt: `以${styleChoice}为主旨，融合五行东方哲思与歌曲歌词意境，创作一篇发人深省、富有深刻人生启迪的心灵感悟小故事`,
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      if (data && data.story) {
        const storyId = `story-${Date.now()}`;
        const storyCard = {
          ...data.story,
          storyId,
          lyricsSource: data.story.lyricsSource || `歌曲/歌词: 《${trackTitle}》`,
        };

        // Automatically save to Firestore user records
        let savedInFirestore = false;
        if (user) {
          savedInFirestore = await saveGeneratedStoryToFirestore({
            storyId,
            title: storyCard.title,
            summary: storyCard.summary,
            themeMoral: storyCard.themeMoral,
            content: storyCard.content,
            lyricsSource: storyCard.lyricsSource,
            category: '歌词哲思感悟',
          });
        }

        const replyText = `✨【谷歌灵智机甲猫 · 指令触发成功】已解析歌曲/歌词「${trackTitle}」的意象，为你创作了这篇哲理心灵感悟微小说《${storyCard.title}》：\n\n${
          savedInFirestore
            ? '💾 该小故事已自动同步保存至您的 Firestore 用户专属记录库。'
            : '💡 提示：登录 Google 账号后即可将每次创生的小故事实时永久保存在云端。'
        }`;

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          timestamp: '刚刚',
          storyCard,
          actionHint: {
            tabKey: 'metal',
            label: '前往「哲理故事」阅读沉淀',
          },
        };

        setMessages((prev) => [...prev, aiMsg]);
        setExpandedStoryId(aiMsg.id);
        setSavedStoryIds((prev) => new Set(prev).add(aiMsg.id));
        audioEngine.playChime(820);

        if (user) {
          syncChatMessage({ sender: 'ai', text: replyText });
        }

        if (savedInFirestore) {
          setFirestoreSavedNotice(`已存入 Firestore: 《${storyCard.title}》`);
          setTimeout(() => setFirestoreSavedNotice(null), 4000);
        }
      }
    } catch (err) {
      console.error('Trigger story generation error:', err);
      setIsTyping(false);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `根据「${trackTitle}」歌词创生小故事时灵弦微颤。歌词有云“心安之处即是归途”，每一个追光的人，终将在自己的心海里找到那座安详之岛。`,
        timestamp: '刚刚',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    audioEngine.playChime(620);
    setInputVal('');

    // Check for Cross-Index Triad Matrix Command (/matrix, /triad, /组合, 三界组合, 交叉组合)
    const isMatrixCommand =
      text.startsWith('/matrix') ||
      text.startsWith('/triad') ||
      text.startsWith('/组合') ||
      text.startsWith('组合：') ||
      text.startsWith('三界组合：') ||
      text.includes('三界同源') ||
      text.includes('交叉组合');

    if (isMatrixCommand) {
      let theme = text
        .replace(/^\/matrix\s*/i, '')
        .replace(/^\/triad\s*/i, '')
        .replace(/^\/组合\s*/, '')
        .replace(/^组合[：:]\s*/, '')
        .replace(/^三界组合[：:]\s*/, '')
        .trim();

      let targetType: CombinationType = '三者全组合';
      let targetModules: ('music' | 'story' | 'video')[] = ['music', 'story', 'video'];

      if (text.includes('单选') || text.includes('只调取')) {
        targetType = '单选';
        if (text.includes('音乐') || text.includes('乐律')) {
          targetModules = ['music'];
        } else if (text.includes('故事') || text.includes('哲理')) {
          targetModules = ['story'];
        } else if (text.includes('影像') || text.includes('视频')) {
          targetModules = ['video'];
        }
      } else if (text.includes('两两组合') || text.includes('音乐+故事') || text.includes('故事+影像') || text.includes('音乐+影像')) {
        targetType = '两两组合';
        if (text.includes('音乐+故事') || text.includes('乐律+故事')) {
          targetModules = ['music', 'story'];
        } else if (text.includes('音乐+影像') || text.includes('乐律+影像')) {
          targetModules = ['music', 'video'];
        } else if (text.includes('故事+影像')) {
          targetModules = ['story', 'video'];
        }
      }

      if (!theme || theme.length < 2) {
        theme = '时间的淬炼与古老器物的守候';
      }

      await executeMatrixGeneration(theme, targetType, targetModules);
      return;
    }

    // Check for /story trigger command
    const isStoryCommand =
      text.startsWith('/story') ||
      text.startsWith('/歌词故事') ||
      text.startsWith('/感悟') ||
      text.startsWith('歌词故事：') ||
      text.startsWith('故事指令：') ||
      text.includes('根据歌词生成故事') ||
      text.includes('根据歌曲生成故事');

    if (isStoryCommand) {
      let query = text
        .replace(/^\/story\s*/i, '')
        .replace(/^\/歌词故事\s*/, '')
        .replace(/^\/感悟\s*/, '')
        .replace(/^歌词故事[：:]\s*/, '')
        .replace(/^故事指令[：:]\s*/, '')
        .trim();

      if (!query) {
        query = currentTrack?.title || tracks[0]?.title || '月光之海';
      }

      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: '刚刚',
      };
      setMessages((prev) => [...prev, userMsg]);
      if (user) syncChatMessage({ sender: 'user', text });

      await executeStoryGenerationAndSave(query);
      return;
    }

    // Normal chat message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: '刚刚',
    };
    setMessages((prev) => [...prev, userMsg]);
    if (user) syncChatMessage({ sender: 'user', text });

    setIsTyping(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
          context: {
            currentTrack: currentTrack
              ? {
                  title: currentTrack.title,
                  artist: currentTrack.artist,
                  lyrics: currentTrack.lyrics,
                }
              : undefined,
            uploadedTracks: tracks
              .filter((t) => t.category === '本地上传')
              .map((t) => ({
                id: t.id,
                title: t.title,
                artist: t.artist,
                lyrics: t.lyrics,
                notes: t.notes,
              })),
          },
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      if (data && data.text) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.text,
          timestamp: '刚刚',
          actionHint: data.actionHint,
          storyCard: data.storyCard,
          matrixCard: data.matrixCard,
        };

        // If matrix card returned, save to Firestore
        if (data.matrixCard && user) {
          await saveMatrixToFirestore(data.matrixCard);
        }

        setMessages((prev) => [...prev, aiMsg]);
        audioEngine.playChime(760);

        if (user) {
          syncChatMessage({ sender: 'ai', text: data.text });
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: '风掠过灵伴空间。若想检索三界同源索引，随时输入 `/matrix 时间与器物`；想根据歌词创生小故事，输入 `/story 歌名`。',
        timestamp: '刚刚',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  const handleBookmarkStory = async (msgId: string, storyCard: ChatMessage['storyCard']) => {
    if (!storyCard) return;
    audioEngine.playChime(700);

    const storyItem: StoryItem = {
      id: `story-gen-${Date.now()}`,
      icon: '📖',
      title: storyCard.title,
      summary: storyCard.summary,
      category: '谷歌机器人歌词创生',
      readTime: '3分钟阅读',
      content: storyCard.content,
      themeMoral: storyCard.themeMoral,
    };

    if (user) {
      await toggleBookmarkCloud(storyItem);
    }

    onSaveGeneratedStory?.(storyItem);

    setSavedStoryIds((prev) => {
      const next = new Set(prev);
      next.add(msgId);
      return next;
    });
  };

  const userUploadedTracks = tracks.filter((t) => t.category === '本地上传');
  const uploadedTrack = userUploadedTracks[0];

  const quickPrompts = [
    '/matrix 【三者全组合】时间的淬炼与器物的守候',
    '/matrix 【两两组合】火·乐律 + 金·故事 流年无声',
    '/matrix 【单选】金·哲理故事（谷歌图书索引）',
    `/story 《${currentTrack?.title || '月光之海'}》`,
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-3 animate-fade-in">
      {/* Toast Notification */}
      {firestoreSavedNotice && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-400/50 text-emerald-200 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-fade-in">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium truncate max-w-[240px]">{firestoreSavedNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 shrink-0">已存入 Firestore</span>
        </div>
      )}

      {/* Google Robot Banner & Triad Index Control Hub */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0c1126]/95 via-[#0f1839]/95 to-[#0d132c]/95 border border-cyan-500/35 p-3.5 shadow-xl shadow-cyan-950/25 backdrop-blur-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)] bg-black/60">
              <img
                src={mechaCatAvatar}
                alt="谷歌智灵机器猫"
                className="w-full h-full object-cover scale-110"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0d1226] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  谷歌智灵机器猫
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-950 to-indigo-950 text-cyan-300 border border-cyan-400/40 font-mono">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/80 mt-0.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>三界同源交叉索引 · 谷歌三大资源检索</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                audioEngine.playChime(660);
                setIsHistoryDrawerOpen((prev) => !prev);
              }}
              className="flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-200 transition-all shrink-0"
              title="查看在 Firestore 中保存的组合矩阵与故事"
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>云端库 ({cloudMatrices.length + cloudStories.length})</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playChime(640);
                setIsMatrixModalOpen(true);
              }}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-semibold shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all active:scale-95 shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>三界组合工坊</span>
            </button>
          </div>
        </div>

        {/* Five Element Tri-Index Subtitle */}
        <div className="mt-2.5 pt-2 border-t border-indigo-900/40 flex items-center justify-between text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="text-rose-400">🔥火·音乐</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400">🪙金·图书</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400">💧水·影像</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-300/80">
            指令格式：<code className="text-amber-300 font-semibold">/matrix &lt;主题&gt;</code>
          </span>
        </div>
      </div>

      {/* Cloud Matrices & Stories Drawer */}
      {isHistoryDrawerOpen && (
        <div className="rounded-2xl bg-[#0b0e22]/95 border border-cyan-500/40 p-3.5 space-y-3 backdrop-blur-2xl shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-1.5 border-b border-indigo-900/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Firestore 云端三界组合库 ({cloudMatrices.length} 个组合)</span>
            </div>
            <button
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              收起
            </button>
          </div>

          {cloudMatrices.length === 0 ? (
            <div className="py-5 text-center text-xs text-slate-400 space-y-1.5">
              <p>暂无已存的三界交叉索引组合。</p>
              <p className="text-[11px] text-cyan-400">
                输入 <span className="text-amber-300 font-mono">/matrix &lt;主题&gt;</span> 或点击右上角工坊即刻生成！
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {cloudMatrices.map((mat) => (
                <div
                  key={mat.id}
                  className="p-2.5 rounded-xl bg-[#141836]/90 border border-indigo-800/40 hover:border-cyan-400/50 transition-all text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-700/40 font-mono">
                        {mat.combinationType}
                      </span>
                      <span className="truncate max-w-[180px]">{mat.theme}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {mat.createdAt ? new Date(mat.createdAt).toLocaleDateString() : '刚刚'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {mat.coherenceCheck}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-cyan-400">
                    <span className="text-slate-400">
                      已绑定：
                      {mat.musicModule ? '🔥音乐 ' : ''}
                      {mat.storyModule ? '🪙图书 ' : ''}
                      {mat.videoModule ? '💧YouTube' : ''}
                    </span>
                    <button
                      onClick={() => {
                        setIsHistoryDrawerOpen(false);
                        handleSend(`/matrix ${mat.theme}`);
                      }}
                      className="hover:underline flex items-center gap-0.5 text-cyan-300"
                    >
                      <span>在会话中展开调取</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Triad Cross-Index Matrix Workshop Modal / Drawer */}
      {isMatrixModalOpen && (
        <div className="rounded-2xl bg-[#0b0e20]/95 border border-cyan-500/40 p-4 space-y-3.5 backdrop-blur-2xl shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>三界同源交叉组合工坊（火·事 / 金·物 / 水·时间）</span>
            </div>
            <button
              onClick={() => setIsMatrixModalOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              关闭
            </button>
          </div>

          {/* Module Selector (1~3 Selection) */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-300 font-medium">选择参与组合的三界模块：</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMatrixSelectedModules((prev: ModuleKey[]) => {
                    const next: ModuleKey[] = prev.includes('music')
                      ? prev.filter((m): m is ModuleKey => m !== 'music')
                      : [...prev, 'music'];
                    if (next.length === 0) return ['music'];
                    setMatrixCombinationType(next.length === 1 ? '单选' : next.length === 2 ? '两两组合' : '三者全组合');
                    return next;
                  });
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  matrixSelectedModules.includes('music')
                    ? 'bg-rose-950/40 border-rose-400/80 text-rose-200 font-bold shadow-[0_0_10px_rgba(244,63,94,0.25)]'
                    : 'bg-slate-900/50 border-slate-700/50 text-slate-400'
                }`}
              >
                <Music className="w-4 h-4 text-rose-400" />
                <span className="text-[11px]">▷乐律心声</span>
                <span className="text-[9px] text-rose-300/80 font-mono">火·事｜谷歌音乐</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMatrixSelectedModules((prev: ModuleKey[]) => {
                    const next: ModuleKey[] = prev.includes('story')
                      ? prev.filter((m): m is ModuleKey => m !== 'story')
                      : [...prev, 'story'];
                    if (next.length === 0) return ['story'];
                    setMatrixCombinationType(next.length === 1 ? '单选' : next.length === 2 ? '两两组合' : '三者全组合');
                    return next;
                  });
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  matrixSelectedModules.includes('story')
                    ? 'bg-amber-950/40 border-amber-400/80 text-amber-200 font-bold shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                    : 'bg-slate-900/50 border-slate-700/50 text-slate-400'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-[11px]">▷哲理故事</span>
                <span className="text-[9px] text-amber-300/80 font-mono">金·物｜谷歌图书</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMatrixSelectedModules((prev: ModuleKey[]) => {
                    const next: ModuleKey[] = prev.includes('video')
                      ? prev.filter((m): m is ModuleKey => m !== 'video')
                      : [...prev, 'video'];
                    if (next.length === 0) return ['video'];
                    setMatrixCombinationType(next.length === 1 ? '单选' : next.length === 2 ? '两两组合' : '三者全组合');
                    return next;
                  });
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  matrixSelectedModules.includes('video')
                    ? 'bg-cyan-950/40 border-cyan-400/80 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900/50 border-slate-700/50 text-slate-400'
                }`}
              >
                <Film className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px]">▷影像载忆</span>
                <span className="text-[9px] text-cyan-300/80 font-mono">水·时间｜YouTube</span>
              </button>
            </div>
          </div>

          {/* Combination Type Indicator */}
          <div className="flex items-center justify-between text-[11px] bg-slate-900/80 p-2 rounded-xl border border-indigo-900/40">
            <span className="text-slate-300">当前组合模式：</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/30">
              【{matrixCombinationType}】
            </span>
          </div>

          {/* Theme Concept Input */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300 font-medium">同源主题或情绪意境：</label>
            <input
              type="text"
              value={matrixThemeInput}
              onChange={(e) => setMatrixThemeInput(e.target.value)}
              placeholder="例如：时间的流转与古老器物的守候、秋水长天、星海追光……"
              className="w-full bg-[#131733] border border-cyan-800/40 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-cyan-400"
            />
          </div>

          {/* Quick preset themes */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {[
              '时间的淬炼与古器守候',
              '星海微光与漫漫长夜',
              '春林初盛与原初宁静',
              '水木清华与生命觉醒',
            ].map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => setMatrixThemeInput(th)}
                className="shrink-0 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700"
              >
                {th}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setIsMatrixModalOpen(false);
              executeMatrixGeneration(
                matrixThemeInput.trim() || '时间的淬炼与器物的守候',
                matrixCombinationType,
                matrixSelectedModules
              );
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>执行指令生成 · 同源交叉检索并存入 Firestore</span>
          </button>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="rounded-2xl bg-[#0a0d1e]/85 border border-indigo-900/40 p-3.5 backdrop-blur-xl min-h-[300px] max-h-[440px] overflow-y-auto space-y-3.5 flex flex-col scrollbar-thin">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          const isStoryExpanded = expandedStoryId === msg.id;
          const isBookmarked = savedStoryIds.has(msg.id);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {/* Bot Avatar */}
              {isAI && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1.5 ring-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] mt-0.5 bg-black/50">
                  <img
                    src={mechaCatAvatar}
                    alt="谷歌机器猫"
                    className="w-full h-full object-cover scale-110"
                  />
                </div>
              )}

              <div className={`max-w-[88%] flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
                {isAI && (
                  <span className="text-[10px] text-cyan-400/90 mb-1 px-1 font-medium flex items-center gap-1">
                    <span>谷歌智灵机器猫</span>
                    <span className="text-[9px] text-cyan-500/60 font-mono">Gemini</span>
                  </span>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    isAI
                      ? 'bg-[#121631]/95 border border-indigo-700/40 text-slate-100 rounded-tl-xs shadow-md shadow-black/20'
                      : 'bg-gradient-to-r from-teal-800/80 to-emerald-800/80 border border-teal-500/40 text-teal-50 rounded-tr-xs shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans">{msg.text}</p>

                  {/* Render Cross-Index Triad Matrix Card */}
                  {msg.matrixCard && (
                    <div className="mt-3 rounded-xl bg-[#080a18]/95 border border-cyan-500/50 p-3.5 space-y-3 text-xs backdrop-blur-md shadow-xl">
                      {/* Top Header Tag */}
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-900/60">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span>【组合标签】：{msg.matrixCard.combinationType}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>三界同源校验完毕</span>
                        </span>
                      </div>

                      {/* Music Module: Fire */}
                      {msg.matrixCard.musicModule && (
                        <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-1">
                          <div className="flex items-center justify-between text-rose-300 font-semibold text-xs">
                            <span className="flex items-center gap-1">
                              <Music className="w-3.5 h-3.5" />
                              <span>▷ 乐律心声 ｜ 火·事</span>
                            </span>
                            <button
                              onClick={() => {
                                executeMatrixGeneration(
                                  msg.matrixCard!.theme,
                                  msg.matrixCard!.combinationType,
                                  ['music', 'story', 'video'],
                                  'music',
                                  msg.matrixCard
                                );
                              }}
                              className="text-[10px] text-rose-400/80 hover:text-rose-200 flex items-center gap-0.5 hover:underline"
                              title="单独替换乐律心声，保留另外两项"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>单独更换</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-relaxed">
                            内容简述：{msg.matrixCard.musicModule.summary}
                          </p>
                          <div className="text-[10px] text-rose-300/90 pt-0.5 flex items-center justify-between">
                            <span className="font-mono truncate max-w-[200px]">
                              谷歌音乐索引：【{msg.matrixCard.musicModule.googleMusicIndex}】
                            </span>
                            <a
                              href={
                                msg.matrixCard.musicModule.googleMusicIndex.startsWith('http')
                                  ? msg.matrixCard.musicModule.googleMusicIndex
                                  : `https://music.youtube.com/search?q=${encodeURIComponent(msg.matrixCard.theme)}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-500/40 hover:bg-rose-900 transition-colors flex items-center gap-1"
                            >
                              <span>检索原作</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Story Module: Metal */}
                      {msg.matrixCard.storyModule && (
                        <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1">
                          <div className="flex items-center justify-between text-amber-300 font-semibold text-xs">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>▷ 哲理故事 ｜ 金·物</span>
                            </span>
                            <button
                              onClick={() => {
                                executeMatrixGeneration(
                                  msg.matrixCard!.theme,
                                  msg.matrixCard!.combinationType,
                                  ['music', 'story', 'video'],
                                  'story',
                                  msg.matrixCard
                                );
                              }}
                              className="text-[10px] text-amber-400/80 hover:text-amber-200 flex items-center gap-0.5 hover:underline"
                              title="单独替换哲理故事，保留另外两项"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>单独更换</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-relaxed">
                            内容简述：{msg.matrixCard.storyModule.summary}
                          </p>
                          <div className="text-[10px] text-amber-300/90 pt-0.5 flex items-center justify-between">
                            <span className="font-mono truncate max-w-[200px]">
                              谷歌图书索引：【{msg.matrixCard.storyModule.googleBooksIndex}】
                            </span>
                            <a
                              href={
                                msg.matrixCard.storyModule.googleBooksIndex.startsWith('http')
                                  ? msg.matrixCard.storyModule.googleBooksIndex
                                  : `https://books.google.com/books?q=${encodeURIComponent(msg.matrixCard.theme)}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-500/40 hover:bg-amber-900 transition-colors flex items-center gap-1"
                            >
                              <span>检索文献</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Video Module: Water */}
                      {msg.matrixCard.videoModule && (
                        <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                          <div className="flex items-center justify-between text-cyan-300 font-semibold text-xs">
                            <span className="flex items-center gap-1">
                              <Film className="w-3.5 h-3.5" />
                              <span>▷ 影像载忆 ｜ 水·时间</span>
                            </span>
                            <button
                              onClick={() => {
                                executeMatrixGeneration(
                                  msg.matrixCard!.theme,
                                  msg.matrixCard!.combinationType,
                                  ['music', 'story', 'video'],
                                  'video',
                                  msg.matrixCard
                                );
                              }}
                              className="text-[10px] text-cyan-400/80 hover:text-cyan-200 flex items-center gap-0.5 hover:underline"
                              title="单独替换影像载忆，保留另外两项"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>单独更换</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-relaxed">
                            内容简述：{msg.matrixCard.videoModule.summary}
                          </p>
                          <div className="text-[10px] text-cyan-300/90 pt-0.5 flex items-center justify-between">
                            <span className="font-mono truncate max-w-[200px]">
                              YouTube索引：【{msg.matrixCard.videoModule.youtubeIndex}】
                            </span>
                            <a
                              href={
                                msg.matrixCard.videoModule.youtubeIndex.startsWith('http')
                                  ? msg.matrixCard.videoModule.youtubeIndex
                                  : `https://www.youtube.com/results?search_query=${encodeURIComponent(msg.matrixCard.theme)}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-900 transition-colors flex items-center gap-1"
                            >
                              <span>定位视频源</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Coherence Check Footer */}
                      <div className="p-2.5 rounded-lg bg-gradient-to-r from-indigo-950/80 to-slate-950/80 border border-indigo-800/40 text-[11px] text-slate-300 space-y-1">
                        <div className="text-amber-300 font-semibold flex items-center gap-1">
                          <span>✦</span>
                          <span>【主题匹配校验】：</span>
                        </div>
                        <p className="italic text-slate-200">{msg.matrixCard.coherenceCheck}</p>
                      </div>
                    </div>
                  )}

                  {/* Render StoryCard if generated from lyrics */}
                  {msg.storyCard && (
                    <div className="mt-3 rounded-xl bg-[#070915]/95 border border-cyan-500/40 p-3.5 space-y-2.5 text-xs backdrop-blur-md shadow-inner">
                      <div className="flex items-center justify-between pb-1.5 border-b border-indigo-900/60">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm">📖 《{msg.storyCard.title}》</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Cloud className="w-3 h-3" />
                          <span>已存入 Firestore</span>
                        </span>
                      </div>

                      {msg.storyCard.lyricsSource && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Music className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>灵感线索：{msg.storyCard.lyricsSource}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-200 italic bg-cyan-950/30 p-2 rounded-lg border border-cyan-800/25 leading-relaxed font-serif">
                        导语：{msg.storyCard.summary}
                      </p>

                      {isStoryExpanded ? (
                        <div className="space-y-2.5 pt-1 font-serif text-slate-200 text-xs leading-relaxed animate-fade-in">
                          {msg.storyCard.content.map((para, pIdx) => (
                            <p key={pIdx} className="text-justify indent-4">
                              {para}
                            </p>
                          ))}
                          <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-950/90 border border-indigo-700/50 text-xs text-amber-200 shadow-md">
                            <span className="font-semibold text-amber-300 block mb-1">
                              💡 歌词心灵哲思金句：
                            </span>
                            <span className="italic leading-relaxed">“{msg.storyCard.themeMoral}”</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {msg.storyCard.content[0]}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1.5 text-[11px] border-t border-indigo-900/40">
                        <button
                          onClick={() => setExpandedStoryId(isStoryExpanded ? null : msg.id)}
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          {isStoryExpanded ? (
                            <>
                              <span>收起正文</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>展开阅读完整故事</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleBookmarkStory(msg.id, msg.storyCard)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
                        >
                          {isBookmarked ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">已珍藏</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3 h-3" />
                              <span>珍藏本篇</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action hint button */}
                  {msg.actionHint && (
                    <button
                      onClick={() => {
                        audioEngine.playChime(680);
                        if (msg.actionHint!.tabKey === 'fire') {
                          onPlayRecommendedMusic?.();
                        }
                        onSelectTab(msg.actionHint!.tabKey);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/30 text-cyan-200 transition-colors shadow-sm"
                    >
                      {msg.actionHint.tabKey === 'fire' && <Music className="w-3.5 h-3.5 text-rose-400" />}
                      {msg.actionHint.tabKey === 'metal' && <BookOpen className="w-3.5 h-3.5 text-amber-400" />}
                      {msg.actionHint.tabKey === 'water' && <Film className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{msg.actionHint.label}</span>
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#121631]/90 border border-cyan-500/30 text-xs text-cyan-300 w-fit animate-pulse">
            <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-cyan-400">
              <img src={mechaCatAvatar} alt="机器猫" className="w-full h-full object-cover scale-110" />
            </div>
            <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>谷歌机器猫正在校验三界同源意境，并提取谷歌音乐、图书与视频索引…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Trigger Command Prompt Pills */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
          <span className="flex items-center gap-1 text-cyan-300">
            <span>🪄</span>
            <span>快捷指令（点击直接调用三界交叉检索）：</span>
          </span>
          <button
            onClick={() => setInputVal('/matrix ')}
            className="text-[10px] text-amber-300 hover:underline"
          >
            插入 /matrix
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full text-xs bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/25 text-slate-300 hover:text-cyan-200 transition-all whitespace-nowrap shadow-sm font-mono"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Box with Matrix Shortcut Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center"
      >
        <button
          type="button"
          onClick={() => {
            audioEngine.playChime(640);
            setIsMatrixModalOpen(true);
          }}
          className="absolute left-2.5 p-1.5 rounded-full text-cyan-400 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 transition-all"
          title="打开三界交叉组合工坊"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="输入 /matrix 主题 或 /story 歌名……"
          className="w-full pl-11 pr-12 py-3 rounded-full bg-[#111326] border border-indigo-700/40 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/25 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
        />

        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="absolute right-1.5 p-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 disabled:hover:from-teal-500 disabled:hover:to-cyan-500 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(20,184,166,0.4)]"
          title="发送"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
