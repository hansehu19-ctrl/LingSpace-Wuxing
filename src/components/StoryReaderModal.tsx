import React, { useState, useEffect } from 'react';
import { StoryItem } from '../types';
import { X, Volume2, Bookmark, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { useFirebase } from '../context/FirebaseContext';

interface StoryReaderModalProps {
  story: StoryItem | null;
  onClose: () => void;
}

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({ story, onClose }) => {
  const { user, cloudBookmarks, toggleBookmarkCloud } = useFirebase();
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlayingAmbient, setIsPlayingAmbient] = useState(false);

  useEffect(() => {
    if (story) {
      if (cloudBookmarks.includes(story.id)) {
        setIsBookmarked(true);
      } else {
        setIsBookmarked(false);
      }
    }
  }, [story, cloudBookmarks]);

  if (!story) return null;

  const toggleAmbientSound = () => {
    if (isPlayingAmbient) {
      audioEngine.stop();
      setIsPlayingAmbient(false);
    } else {
      audioEngine.startPreset('flute', 0.5);
      setIsPlayingAmbient(true);
    }
  };

  const handleBookmarkToggle = async () => {
    audioEngine.playChime(700);
    if (user) {
      const newState = await toggleBookmarkCloud(story);
      setIsBookmarked(newState);
    } else {
      setIsBookmarked(!isBookmarked);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-xs leading-6';
      case 'lg':
        return 'text-base leading-8';
      default:
        return 'text-sm leading-7';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-[#0c0e1e] border border-indigo-700/50 shadow-2xl shadow-indigo-950 overflow-hidden text-slate-100">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-indigo-900/60 bg-[#12152d]/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">{story.icon}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
              {story.category}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAmbientSound}
              className={`p-1.5 rounded-full border transition-all ${
                isPlayingAmbient
                  ? 'bg-teal-500 text-slate-950 border-teal-400'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="禅境空灵配乐"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setFontSize(fontSize === 'base' ? 'lg' : fontSize === 'lg' ? 'sm' : 'base')}
              className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 hover:text-white"
              title="调节字体字号"
            >
              {fontSize === 'lg' ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            <button
              onClick={handleBookmarkToggle}
              className={`p-1.5 rounded-full border transition-all ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="收藏本篇"
            >
              {isBookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (isPlayingAmbient) audioEngine.stop();
                onClose();
              }}
              className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Story Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          <div className="space-y-1.5 text-center pb-2 border-b border-indigo-900/40">
            <h2 className="text-xl font-bold font-serif text-white tracking-wide">
              {story.title}
            </h2>
            <p className="text-xs text-slate-400">阅读时长约 {story.readTime}</p>
          </div>

          {/* Story Paragraphs */}
          <div className={`space-y-4 font-serif text-slate-200/90 ${getFontSizeClass()}`}>
            {story.content.map((p, idx) => (
              <p key={idx} className="indent-6 tracking-wide">
                {p}
              </p>
            ))}
          </div>

          {/* Moral takeaway */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-indigo-950/40 to-slate-950/30 border border-amber-400/30 space-y-1.5">
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <span>✦</span>
              <span>哲思寄语</span>
            </div>
            <p className="text-xs text-slate-300 font-serif leading-relaxed">
              {story.themeMoral}
            </p>
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-3 border-t border-indigo-900/40 bg-[#0d1024] flex items-center justify-between text-xs text-slate-400">
          <span>金 · 物 · 内容沉淀</span>
          <button
            onClick={() => {
              if (isPlayingAmbient) audioEngine.stop();
              onClose();
            }}
            className="px-4 py-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors"
          >
            领悟归元
          </button>
        </div>
      </div>
    </div>
  );
};
