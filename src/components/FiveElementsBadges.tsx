import React from 'react';
import { TabKey, ElementTimeRecord } from '../types';
import {
  MessageCircle,
  Music,
  Landmark,
  BookOpen,
  Film,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface FiveElementsBadgesProps {
  timeRecord: ElementTimeRecord;
  onSelectTab: (tab: TabKey) => void;
  onFastUnlockAll?: () => void;
  onResetTime?: () => void;
}

export const TARGET_SECONDS = 15; // 15 seconds to unlock each element

interface BadgeItemDef {
  key: TabKey;
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  hanzi: string;
  name: string;
  sub: string;
  icon: React.ReactNode;
  themeColor: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  activeGlow: string;
  desc: string;
}

export const FiveElementsBadges: React.FC<FiveElementsBadgesProps> = ({
  timeRecord,
  onSelectTab,
  onFastUnlockAll,
  onResetTime,
}) => {
  const badgeDefs: BadgeItemDef[] = [
    {
      key: 'wood',
      element: 'wood',
      hanzi: '木',
      name: '灵思生发',
      sub: '日常交互',
      icon: <MessageCircle className="w-4 h-4" />,
      themeColor: 'emerald',
      activeBorder: 'border-emerald-400/80',
      activeBg: 'bg-gradient-to-b from-emerald-950/80 via-emerald-900/40 to-slate-950/80',
      activeText: 'text-emerald-300',
      activeGlow: 'shadow-[0_0_18px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/40',
      desc: '在人机日常交互中交流沉浸，开启万象生机。',
    },
    {
      key: 'fire',
      element: 'fire',
      hanzi: '火',
      name: '心音共鸣',
      sub: '乐律心声',
      icon: <Music className="w-4 h-4" />,
      themeColor: 'rose',
      activeBorder: 'border-rose-400/80',
      activeBg: 'bg-gradient-to-b from-rose-950/80 via-rose-900/40 to-slate-950/80',
      activeText: 'text-rose-300',
      activeGlow: 'shadow-[0_0_18px_rgba(244,63,94,0.35)] ring-1 ring-rose-400/40',
      desc: '在纯净乐律中感受情绪共鸣，点亮心神之火。',
    },
    {
      key: 'earth',
      element: 'earth',
      hanzi: '土',
      name: '乾坤安定',
      sub: '灵性空间',
      icon: <Landmark className="w-4 h-4" />,
      themeColor: 'amber',
      activeBorder: 'border-amber-400/80',
      activeBg: 'bg-gradient-to-b from-amber-950/80 via-amber-900/40 to-slate-950/80',
      activeText: 'text-amber-300',
      activeGlow: 'shadow-[0_0_18px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40',
      desc: '在灵性空间场域驻留，厚德载物，安住当下。',
    },
    {
      key: 'metal',
      element: 'metal',
      hanzi: '金',
      name: '哲理见心',
      sub: '哲理故事',
      icon: <BookOpen className="w-4 h-4" />,
      themeColor: 'yellow',
      activeBorder: 'border-yellow-400/80',
      activeBg: 'bg-gradient-to-b from-yellow-950/80 via-amber-900/40 to-slate-950/80',
      activeText: 'text-yellow-200',
      activeGlow: 'shadow-[0_0_18px_rgba(250,204,21,0.35)] ring-1 ring-yellow-400/40',
      desc: '在哲思文字与微小说中品读，淬炼智慧纯金。',
    },
    {
      key: 'water',
      element: 'water',
      hanzi: '水',
      name: '光影澄明',
      sub: '影像载忆',
      icon: <Film className="w-4 h-4" />,
      themeColor: 'cyan',
      activeBorder: 'border-cyan-400/80',
      activeBg: 'bg-gradient-to-b from-cyan-950/80 via-cyan-900/40 to-slate-950/80',
      activeText: 'text-cyan-300',
      activeGlow: 'shadow-[0_0_18px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/40',
      desc: '在动画与流水光影中驻足，任时光清澈流转。',
    },
  ];

  const unlockedCount = badgeDefs.filter((b) => (timeRecord[b.key] || 0) >= TARGET_SECONDS).length;
  const isAllUnlocked = unlockedCount === badgeDefs.length;

  const handleBadgeClick = (b: BadgeItemDef) => {
    audioEngine.playChime(720);
    onSelectTab(b.key);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0b0e24]/95 via-[#0e122e]/90 to-[#090b1c]/95 border border-indigo-500/30 p-4 space-y-3.5 backdrop-blur-xl shadow-xl shadow-indigo-950/30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                五行成就 · 灵光徽章板
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                  isAllUnlocked
                    ? 'bg-amber-950/80 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                    : 'bg-slate-900/80 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {isAllUnlocked ? '✨ 五行大圆满' : `已点亮 ${unlockedCount}/5`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              各板块悟道满 <span className="text-cyan-300 font-mono font-semibold">{TARGET_SECONDS}秒</span> 即可点亮对应灵光
            </p>
          </div>
        </div>

        {/* Quick Testing Tools */}
        <div className="flex items-center gap-1">
          {onFastUnlockAll && !isAllUnlocked && (
            <button
              onClick={() => {
                audioEngine.playChime(850);
                onFastUnlockAll();
              }}
              title="快速预览五行全点亮效果"
              className="p-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/40 text-[10px] text-indigo-300 hover:text-white transition-all flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">全点亮体验</span>
            </button>
          )}

          {onResetTime && unlockedCount > 0 && (
            <button
              onClick={() => {
                audioEngine.playChime(500);
                onResetTime();
              }}
              title="重置悟道计时"
              className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-700/40 text-[10px] text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Five Badges Row / Responsive Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {badgeDefs.map((b) => {
          const spent = timeRecord[b.key] || 0;
          const isUnlocked = spent >= TARGET_SECONDS;
          const progressPercent = Math.min(100, Math.round((spent / TARGET_SECONDS) * 100));

          return (
            <button
              key={b.key}
              onClick={() => handleBadgeClick(b)}
              className={`group relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-xl border text-center transition-all duration-300 active:scale-95 cursor-pointer ${
                isUnlocked
                  ? `${b.activeBorder} ${b.activeBg} ${b.activeGlow}`
                  : 'border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 hover:border-slate-700/80'
              }`}
              title={`${b.name}（${b.sub}）- ${b.desc}，点击前往板块`}
            >
              {/* Element Hanzi + Icon */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 relative ${
                    isUnlocked
                      ? `${b.activeText} bg-white/10 ring-2 ring-current shadow-md`
                      : 'text-slate-500 bg-slate-900/80 border border-slate-700/50'
                  }`}
                >
                  <span className="text-base font-serif font-bold">{b.hanzi}</span>

                  {/* Lit-up checkmark indicator */}
                  {isUnlocked && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md animate-scale-in">
                      <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Subtitle / Element Name */}
                <span
                  className={`text-[11px] font-bold mt-1.5 tracking-tight ${
                    isUnlocked ? b.activeText : 'text-slate-400'
                  }`}
                >
                  {b.name}
                </span>

                <span className="text-[9px] text-slate-500 scale-95 mt-0.5">
                  {b.sub}
                </span>
              </div>

              {/* Progress Bar & Status Pill */}
              <div className="w-full mt-2 space-y-1">
                {isUnlocked ? (
                  <div
                    className={`text-[9px] font-mono font-semibold py-0.5 px-1 rounded-md bg-white/10 flex items-center justify-center gap-0.5 ${b.activeText}`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>已点亮</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500/70 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{spent}s/{TARGET_SECONDS}s</span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* All Unlocked Celebration Banner */}
      {isAllUnlocked && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-indigo-950/70 to-emerald-950/70 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between shadow-lg shadow-amber-950/30 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <span className="text-[11px] leading-relaxed">
              五行灵光融会贯通：<strong className="text-amber-100">土承载 → 木萌发 → 火共鸣 → 金淬炼 → 水流转</strong>，相生不息。
            </span>
          </div>
        </div>
      )}

      {/* Guide hint */}
      {!isAllUnlocked && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>💡 点击任一徽章即可直达该板块，驻留即可累积悟道时长</span>
          <span className="text-cyan-400/80 font-mono">相生生辉</span>
        </div>
      )}
    </div>
  );
};
