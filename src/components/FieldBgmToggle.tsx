import React, { useEffect, useState } from 'react';
import { fieldBgmEngine } from '../utils/fieldBgmEngine';
import { Music2, VolumeX, Sparkles } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export const FieldBgmToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(fieldBgmEngine.getIsEnabled());
  const [isPlaying, setIsPlaying] = useState(fieldBgmEngine.getIsPlaying());

  useEffect(() => {
    const unsub = fieldBgmEngine.subscribe((enabled, playing) => {
      setIsEnabled(enabled);
      setIsPlaying(playing);
    });
    return () => unsub();
  }, []);

  const handleToggle = () => {
    audioEngine.playChime(640);
    fieldBgmEngine.toggleEnabled();
  };

  return (
    <button
      onClick={handleToggle}
      className={`group relative flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all duration-300 select-none ${
        isEnabled
          ? 'bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
          : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 border border-slate-700/50'
      }`}
      title={
        isEnabled
          ? '场域音：小提琴《沉思》Thaïs-Méditation 纯器乐版 (22%底音 · 点击静音)'
          : '场域音已关闭 (点击开启首页小提琴背景乐)'
      }
      aria-label="场域音开关"
    >
      {isEnabled ? (
        <>
          <Music2 className={`w-3 h-3 text-amber-400 ${isPlaying ? 'animate-pulse' : ''}`} />
          <span>场域音</span>
          {isPlaying ? (
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1 h-3 bg-amber-300 rounded-full animate-bounce [animation-delay:-0.1s]" />
              <span className="w-1 h-1.5 bg-amber-400 rounded-full animate-bounce" />
            </span>
          ) : (
            <span className="text-[9px] text-amber-400/80 font-mono">22%</span>
          )}
        </>
      ) : (
        <>
          <VolumeX className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
          <span>场域音 · 关</span>
        </>
      )}
    </button>
  );
};
