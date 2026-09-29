import React from 'react';
import { Landmark, MessageCircle, Music, BookOpen, Clapperboard } from 'lucide-react';
import { TABS_CONFIG } from '../data/mockData';
import { TabKey } from '../types';
import { audioEngine } from '../utils/audioEngine';
import mechaCatAvatar from '../assets/mecha_cat_avatar.jpg';

interface TopNavProps {
  activeTab: TabKey;
  onSelectTab: (key: TabKey) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onSelectTab }) => {
  const getIcon = (name: string, isActive: boolean) => {
    const iconClass = `w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-65'}`;
    switch (name) {
      case 'landmark':
        return <Landmark className={iconClass} />;
      case 'message-circle':
        return (
          <div
            className={`w-4 h-4 rounded-full overflow-hidden ring-1 ring-cyan-400/70 shrink-0 transition-transform duration-300 ${
              isActive ? 'scale-115 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'opacity-80'
            }`}
          >
            <img src={mechaCatAvatar} alt="机器猫" className="w-full h-full object-cover scale-125" />
          </div>
        );
      case 'music':
        return <Music className={iconClass} />;
      case 'book-open':
        return <BookOpen className={iconClass} />;
      case 'film':
        return <Clapperboard className={iconClass} />;
      default:
        return <Landmark className={iconClass} />;
    }
  };

  const handleTabClick = (key: TabKey) => {
    audioEngine.playChime(520 + (['earth', 'wood', 'fire', 'metal', 'water'].indexOf(key) * 70));
    onSelectTab(key);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090b14]/85 border-b border-indigo-950/60 pt-3 pb-2.5 px-2 transition-all">
      <nav aria-label="五大功能板块导航" className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        {TABS_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              aria-selected={isActive}
              role="tab"
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-300 outline-none select-none ${
                isActive
                  ? 'bg-gradient-to-b from-indigo-800/40 via-indigo-900/30 to-indigo-950/50 shadow-[0_0_18px_rgba(56,189,248,0.15)] ring-1 ring-teal-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {/* Active Ambient Glow Background */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-xl bg-gradient-to-t from-teal-500/10 to-transparent pointer-events-none"
                  aria-hidden="true"
                />
              )}

              {/* Icon container */}
              <div
                className={`mb-1 transition-colors duration-200 ${
                  isActive ? 'text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : 'text-slate-400'
                }`}
              >
                {getIcon(tab.iconName, isActive)}
              </div>

              {/* Tab Title */}
              <span
                className={`text-[12px] font-medium leading-none tracking-tight whitespace-nowrap transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.title}
              </span>

              {/* Five Elements Tag */}
              <span
                className={`text-[10px] leading-tight tracking-wider mt-1 transition-colors ${
                  isActive ? 'text-teal-300/90 font-medium' : 'text-slate-500'
                }`}
              >
                {tab.element} · {tab.tag}
              </span>

              {/* Active bottom micro-indicator */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 mt-1 shadow-[0_0_6px_#2dd4bf] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
