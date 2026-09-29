import React from 'react';
import { Sparkles } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import mechaCatAvatar from '../assets/mecha_cat_avatar.jpg';

interface BottomBarProps {
  onOpenAvatar: () => void;
  onOpenChat: () => void;
  isChatActive: boolean;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  onOpenAvatar,
  onOpenChat,
  isChatActive,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 pb-safe pt-2 pb-3 px-4 backdrop-blur-xl bg-[#080a13]/85 border-t border-indigo-950/60">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
        {/* Avatar Form Switch Button */}
        <button
          onClick={() => {
            audioEngine.playChime(580);
            onOpenAvatar();
          }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-slate-900/70 hover:bg-slate-800/80 active:scale-[0.98] border border-indigo-500/25 text-slate-200 hover:text-white font-medium text-sm transition-all shadow-lg shadow-black/20"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>✦ 形象</span>
        </button>

        {/* Chat Switch / Open Button with Cyber Mecha Cat Icon */}
        <button
          onClick={() => {
            audioEngine.playChime(720);
            onOpenChat();
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-medium text-sm transition-all shadow-lg active:scale-[0.98] ${
            isChatActive
              ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-300 text-slate-950 font-bold shadow-[0_0_20px_rgba(45,212,191,0.5)] ring-2 ring-cyan-300'
              : 'bg-gradient-to-r from-teal-800/80 via-cyan-800/80 to-indigo-800/80 hover:from-teal-700 hover:to-cyan-700 border border-cyan-400/40 text-white shadow-teal-900/30'
          }`}
        >
          {/* Compressed Futuristic Mecha Cat Avatar */}
          <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.7)] bg-black/40">
            <img
              src={mechaCatAvatar}
              alt="谷歌机器猫"
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <span>对话</span>
        </button>
      </div>
    </footer>
  );
};
