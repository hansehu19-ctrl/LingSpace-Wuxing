import React, { useState } from 'react';
import { AvatarForm, SceneSetting } from '../types';
import { Sparkles, Wind, Moon } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface SpiritualAvatarProps {
  avatar: AvatarForm;
  scene: SceneSetting;
  onOpenAvatarModal: () => void;
  onOpenSceneModal: () => void;
  onOpenChat: () => void;
}

export const SpiritualAvatar: React.FC<SpiritualAvatarProps> = ({
  avatar,
  scene,
  onOpenAvatarModal,
  onOpenSceneModal,
}) => {
  const [whisper, setWhisper] = useState<string | null>(null);
  const [isSparkling, setIsSparkling] = useState(false);

  const whispers = [
    '“心静下来，万物自会向你走来。”',
    '“在微光之中，倾听星宿的絮语。”',
    '“当下的呼吸，便是最辽阔的彼岸。”',
    '“你若安好，这方天地便常驻春山。”',
    '“无论外界如何喧嚣，灵伴始终守候于此。”',
  ];

  const handleInteract = () => {
    audioEngine.playChime(660);
    setIsSparkling(true);
    const randomWhisper = whispers[Math.floor(Math.random() * whispers.length)];
    setWhisper(randomWhisper);

    setTimeout(() => {
      setIsSparkling(false);
    }, 1800);

    setTimeout(() => {
      setWhisper(null);
    }, 4500);
  };

  return (
    <div className="relative w-full max-w-md mx-auto my-4 px-4 select-none">
      {/* Scene indicator button (matching screenshot: 🟢 月光花海) */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onOpenSceneModal}
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-teal-500/25 backdrop-blur-md transition-all text-xs font-medium text-teal-200 hover:text-white"
        >
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span>{scene.name}</span>
          <span className="text-[10px] text-teal-400/60 group-hover:text-teal-300">切换</span>
        </button>

        {/* Ambient environment weather tag */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400/80">
          <span className="inline-flex items-center gap-1">
            <Moon className="w-3 h-3 text-indigo-300" />
            {scene.weather}
          </span>
          <span className="text-slate-600">·</span>
          <span className="inline-flex items-center gap-1">
            <Wind className="w-3 h-3 text-slate-400" />
            {scene.wind}
          </span>
        </div>
      </div>

      {/* Spirit orb canvas container */}
      <div className="relative flex flex-col items-center justify-center py-6 min-h-[160px] overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-950/20 via-purple-950/15 to-transparent border border-indigo-900/30 backdrop-blur-md">
        {/* Whisper speech bubble */}
        {whisper && (
          <div className="absolute top-2 z-20 max-w-[85%] px-3.5 py-2 rounded-xl bg-slate-900/90 border border-teal-400/40 text-xs text-teal-100 shadow-[0_4px_20px_rgba(45,212,191,0.2)] animate-fade-in text-center font-serif leading-relaxed">
            {whisper}
          </div>
        )}

        {/* Floating Living Spirit Avatar */}
        <div
          onClick={handleInteract}
          className="relative cursor-pointer group flex items-center justify-center p-4"
          title="点击与灵伴感应"
        >
          {/* Ambient outer glow halo */}
          <div
            className={`absolute w-36 h-36 rounded-full bg-gradient-to-r ${avatar.glowAura} opacity-30 blur-2xl transition-all duration-700 group-hover:opacity-50 animate-pulse`}
          />

          {/* Orbiting celestial rings */}
          <div className="absolute w-28 h-28 rounded-full border border-teal-300/20 animate-spin-slow pointer-events-none" />
          <div className="absolute w-20 h-20 rounded-full border border-indigo-300/30 animate-spin-reverse pointer-events-none" />

          {/* Central Core Spirit Ball */}
          <div
            className={`relative w-16 h-16 rounded-full bg-gradient-to-tr ${avatar.glowAura} shadow-[0_0_30px_rgba(56,189,248,0.5)] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 active:scale-95 animate-float overflow-hidden ring-2 ring-cyan-300/60`}
          >
            {avatar.imageUrl ? (
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              /* Inner crystalline nucleus */
              <div className="w-10 h-10 rounded-full bg-white/70 blur-[1px] flex items-center justify-center shadow-inner">
                <Sparkles
                  className={`w-5 h-5 text-indigo-900 transition-all ${
                    isSparkling ? 'scale-125 rotate-45 text-teal-800' : ''
                  }`}
                />
              </div>
            )}

            {/* Orbiting light mote */}
            <div className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
          </div>
        </div>

        {/* Avatar name & form prompt */}
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5">
            <span>{avatar.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
              {avatar.title}
            </span>
          </p>
          <button
            onClick={onOpenAvatarModal}
            className="text-[11px] text-teal-400/70 hover:text-teal-300 underline underline-offset-2 transition-colors mt-0.5"
          >
            轻触变换法相
          </button>
        </div>
      </div>
    </div>
  );
};
