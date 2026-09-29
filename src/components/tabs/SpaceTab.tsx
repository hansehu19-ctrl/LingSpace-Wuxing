import React, { useState, useEffect } from 'react';
import { TabKey, ElementTimeRecord } from '../../types';
import { MessageCircle, Music, BookOpen, Film, Landmark, Sparkles, RefreshCw } from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';
import { FiveElementsBadges } from '../FiveElementsBadges';

interface SpaceTabProps {
  onSelectTab: (tab: TabKey) => void;
  timeRecord?: ElementTimeRecord;
  onFastUnlockAll?: () => void;
  onResetTime?: () => void;
}

export const SpaceTab: React.FC<SpaceTabProps> = ({
  onSelectTab,
  timeRecord: externalTimeRecord,
  onFastUnlockAll,
  onResetTime,
}) => {
  const [selectedCycleElement, setSelectedCycleElement] = useState<string | null>(null);

  // Fallback local tracking if not supplied from parent
  const [localTimeRecord, setLocalTimeRecord] = useState<ElementTimeRecord>(() => {
    try {
      const stored = localStorage.getItem('wuxing_time_spent_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  });

  const activeTimeRecord = externalTimeRecord || localTimeRecord;

  const quickLinks: {
    key: TabKey;
    icon: React.ReactNode;
    title: string;
    sub: string;
    glow: string;
  }[] = [
    {
      key: 'wood',
      icon: <MessageCircle className="w-6 h-6 text-emerald-300" />,
      title: '日常交互',
      sub: '人机对话 · 需求触发',
      glow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    },
    {
      key: 'fire',
      icon: <Music className="w-6 h-6 text-rose-300" />,
      title: '乐律心声',
      sub: '音乐音律 · 情绪体验',
      glow: 'hover:border-rose-500/40 hover:shadow-rose-500/10',
    },
    {
      key: 'metal',
      icon: <BookOpen className="w-6 h-6 text-amber-300" />,
      title: '哲理故事',
      sub: '文字叙事 · 内容沉淀',
      glow: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
    },
    {
      key: 'water',
      icon: <Film className="w-6 h-6 text-cyan-300" />,
      title: '影像载忆',
      sub: '影视动画 · 记忆留存',
      glow: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10',
    },
  ];

  const fiveElementsCycle = [
    { element: '土', role: '空间场域', desc: '厚德载物，孕育万象生发的原点', color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
    { element: '金', role: '文字实物', desc: '百炼成纯，沉淀智慧与叙事本源', color: 'text-yellow-200 border-yellow-500/40 bg-yellow-500/10' },
    { element: '水', role: '影像时间', desc: '善利万物，时间奔流中留存记忆', color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10' },
    { element: '木', role: '人际生发', desc: '生生不息，以人为本的连接与对话', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
    { element: '火', role: '乐律心绪', desc: '照亮幽冥，化作有序音律拨动心弦', color: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
  ];

  const handleCardClick = (key: TabKey) => {
    audioEngine.playChime(640);
    onSelectTab(key);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fade-in">
      {/* Element Header */}
      <div className="text-center space-y-2 pt-1">
        <div className="inline-flex items-center justify-center gap-2 text-xl font-bold text-white tracking-wide">
          <Landmark className="w-6 h-6 text-teal-300" />
          <span>灵性空间</span>
        </div>

        {/* Five Element Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 border border-teal-500/30 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.15)]">
            <span>⛰️</span>
            <span>土 · 地点 · 总框架容器</span>
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-300/80 max-w-xs mx-auto leading-relaxed">
          万物承载，为所有体验提供发生的场域与框架
        </p>
      </div>

      {/* Hero Glass Card (Matching screenshot) */}
      <div className="relative rounded-2xl bg-gradient-to-b from-indigo-950/40 via-purple-950/20 to-slate-950/40 border border-indigo-700/30 p-5 backdrop-blur-xl shadow-xl shadow-indigo-950/30 space-y-3">
        <p className="text-sm text-slate-200 text-center font-medium leading-relaxed">
          整站、全系统的总入口、总框架、总场域。
        </p>
        <p className="text-xs text-slate-300/90 text-center leading-relaxed">
          所有交互、音乐、故事、影像，全部生长、存放、运行在这个空间之内。
        </p>
      </div>

      {/* Five Elements Achievement Badges Board */}
      <FiveElementsBadges
        timeRecord={activeTimeRecord}
        onSelectTab={onSelectTab}
        onFastUnlockAll={onFastUnlockAll}
        onResetTime={onResetTime}
      />

      {/* Quick Entry Section Title */}
      <div className="text-center pt-1">
        <span className="text-xs text-slate-400 font-medium tracking-wider">
          — 五大板块快捷入口 —
        </span>
      </div>

      {/* 2x2 Grid (Matching screenshot) */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((item) => (
          <button
            key={item.key}
            onClick={() => handleCardClick(item.key)}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0f1122]/70 hover:bg-[#151933]/90 border border-indigo-800/30 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-black/20 ${item.glow}`}
          >
            <div className="p-2.5 rounded-xl bg-white/[0.04] mb-2.5 transition-transform duration-300 group-hover:scale-110">
              {item.icon}
            </div>
            <h3 className="text-sm font-semibold text-white tracking-wide mb-1">
              {item.title}
            </h3>
            <p className="text-[11px] text-slate-400 text-center leading-tight">
              {item.sub}
            </p>
          </button>
        ))}
      </div>

      {/* Interactive Five Elements Wheel / 相生闭环 */}
      <div className="rounded-2xl bg-[#0d0f1e]/80 border border-indigo-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-200">
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span>五行相生 · 闭环生发运转</span>
          </div>
          <span className="text-[10px] text-slate-400">点击探析</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {fiveElementsCycle.map((elem) => (
            <button
              key={elem.element}
              onClick={() => {
                audioEngine.playChime(600);
                setSelectedCycleElement(selectedCycleElement === elem.element ? null : elem.element);
              }}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                selectedCycleElement === elem.element
                  ? 'ring-2 ring-teal-400 scale-105 ' + elem.color
                  : elem.color + ' opacity-80 hover:opacity-100'
              }`}
            >
              <span className="text-base font-bold font-serif">{elem.element}</span>
              <span className="text-[9px] scale-90 whitespace-nowrap mt-0.5">{elem.role}</span>
            </button>
          ))}
        </div>

        {selectedCycleElement && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-teal-500/30 text-xs text-slate-300 animate-fade-in flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-teal-200">
                {selectedCycleElement}行之意：
              </span>{' '}
              {fiveElementsCycle.find((e) => e.element === selectedCycleElement)?.desc}
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400 text-center font-mono leading-relaxed pt-1">
          空间（土）→ 人（木）→ 情绪（火）→ 文字（金）→ 影像（水）
        </div>
      </div>
    </div>
  );
};
