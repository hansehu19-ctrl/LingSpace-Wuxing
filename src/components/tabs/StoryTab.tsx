import React, { useState } from 'react';
import { BookOpen, Sparkles, ChevronRight, Clock } from 'lucide-react';
import { StoryItem } from '../../types';
import { audioEngine } from '../../utils/audioEngine';

interface StoryTabProps {
  stories: StoryItem[];
  onOpenStory: (story: StoryItem) => void;
}

export const StoryTab: React.FC<StoryTabProps> = ({ stories, onOpenStory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  const categories = ['全部', '宇宙哲思', '人生寓言', '生命启示', '心性修持'];

  const filtered = selectedCategory === '全部'
    ? stories
    : stories.filter((s) => s.category === selectedCategory);

  const handleStoryClick = (story: StoryItem) => {
    audioEngine.playChime(660);
    onOpenStory(story);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fade-in">
      {/* Element Header */}
      <div className="text-center space-y-2 pt-1">
        <div className="inline-flex items-center justify-center gap-2 text-xl font-bold text-white tracking-wide">
          <BookOpen className="w-6 h-6 text-amber-300" />
          <span>哲理故事</span>
        </div>

        {/* Five Element Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/70 border border-amber-500/30 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <span>💎</span>
            <span>金 · 物 · 内容沉淀</span>
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-300/80 max-w-xs mx-auto leading-relaxed">
          文字载道，沉淀叙事内核，为影像演绎提供本源剧本
        </p>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 font-medium'
                : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Story Cards List (Matching screenshot IMG_5462) */}
      <div className="rounded-2xl bg-[#0f1124]/80 border border-indigo-800/35 p-4 backdrop-blur-xl space-y-3 shadow-xl shadow-black/25">
        {filtered.map((story) => (
          <div
            key={story.id}
            onClick={() => handleStoryClick(story)}
            className="group relative p-3.5 rounded-xl bg-[#141833]/70 hover:bg-[#1a2044] border border-indigo-700/30 hover:border-amber-400/50 transition-all duration-300 cursor-pointer shadow-md active:scale-[0.99] space-y-2"
          >
            {/* Story Title & Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{story.icon}</span>
                <h3 className="text-sm font-semibold text-white tracking-wide group-hover:text-amber-200 transition-colors">
                  {story.title}
                </h3>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Summary excerpt */}
            <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2">
              {story.summary}
            </p>

            {/* Meta Tags Row */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/50 text-amber-300/90">
                <span>{story.category === '宇宙哲思' ? '🌌' : story.category === '人生寓言' ? '💧' : '🌱'}</span>
                <span>{story.category}</span>
              </span>

              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{story.readTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Zen Quote card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/20 via-indigo-950/30 to-purple-950/20 border border-amber-500/20 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>叙事之源</span>
        </div>
        <p className="text-[11px] text-slate-300 font-serif italic">
          “每一段文字，皆是灵魂与星汉在静寂之中的对话。”
        </p>
      </div>
    </div>
  );
};
