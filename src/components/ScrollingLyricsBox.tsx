import React, { useEffect, useRef, useState } from 'react';
import { Music, Upload, Sparkles, Play } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface ScrollingLyricsBoxProps {
  lyrics: string[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onSeek?: (seconds: number) => void;
  onReUpload?: () => void;
  trackTitle: string;
  trackArtist: string;
}

export const ScrollingLyricsBox: React.FC<ScrollingLyricsBoxProps> = ({
  lyrics,
  currentTime,
  totalDuration,
  isPlaying,
  onSeek,
  onReUpload,
  trackTitle,
  trackArtist,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fallback rich lyrics if none provided
  const displayLyrics = lyrics && lyrics.length > 0 ? lyrics : [
    '月光轻轻洒落在这片原野上',
    '如果如果是如果，风带走曾经的誓言',
    '山川无言，唯有星光长伴左右',
    '在每一个宁静的夜晚，倾听心底的回响',
    '如果时光可以倒流，愿化作一泓春水',
    '轻抚你眉宇间的疲惫与沧桑',
    '心安之处即是归途，琴声悠悠远去……',
    '心如琉璃，映照漫天星汉微茫',
    '在这方灵伴空间里，寻找内心的安宁',
    '闭上双眼，随音符在夜空中遨游',
    '放下执念，迎接初醒的晨曦之光',
  ];

  // Calculate current active lyric index based on playback progress
  const duration = Math.max(1, totalDuration || 240);
  const lineDuration = duration / displayLyrics.length;
  const activeIndex = Math.min(
    displayLyrics.length - 1,
    Math.max(0, Math.floor(currentTime / lineDuration))
  );

  // Smooth auto-scroll the active line to vertical center when playing
  useEffect(() => {
    if (isUserInteracting) return;

    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeEl = activeLineRef.current;
      const targetScroll = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeIndex, isUserInteracting]);

  // Handle user manual scroll: pause auto-scroll temporarily then resume
  const handleUserScroll = () => {
    setIsUserInteracting(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 2800);
  };

  const handleLineClick = (index: number) => {
    audioEngine.playChime(620);
    const targetSec = Math.floor(index * lineDuration);
    if (onSeek) {
      onSeek(targetSec);
    }
    audioEngine.seek(targetSec);
    setIsUserInteracting(false);
  };

  const formatLineTime = (index: number) => {
    const s = Math.floor(index * lineDuration);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="relative w-full h-[150px] rounded-2xl bg-gradient-to-b from-[#0b0d1e]/95 via-[#10132b]/95 to-[#090b18]/95 border border-teal-500/40 p-3 backdrop-blur-xl shadow-2xl shadow-teal-950/30 flex flex-col justify-between overflow-hidden animate-fade-in group">
      {/* Top Header bar with status and switch buttons */}
      <div className="relative z-20 flex items-center justify-between px-1 pb-1.5 border-b border-indigo-900/40 text-[11px]">
        <div className="flex items-center gap-1.5 text-teal-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="font-semibold text-white tracking-wide truncate max-w-[160px]">
            {trackTitle}
          </span>
          <span className="text-[10px] text-slate-400">· {trackArtist}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active status pulse indicator */}
          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-500/30 font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            {isPlaying ? '实时同步中' : '已暂停'}
          </span>

          {/* Discreet Re-upload button */}
          {onReUpload && (
            <button
              onClick={onReUpload}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-slate-800/80 hover:bg-teal-950/90 hover:text-teal-200 text-slate-300 border border-slate-700/60 hover:border-teal-500/40 transition-all"
              title="重新上传或更换音频"
            >
              <Upload className="w-2.5 h-2.5" />
              <span>更换音频</span>
            </button>
          )}
        </div>
      </div>

      {/* Vertical Scrolling Lyrics Container */}
      <div
        ref={containerRef}
        onScroll={handleUserScroll}
        className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2 text-center select-none"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      >
        <div className="space-y-2 py-8">
          {displayLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => handleLineClick(idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group/line cursor-pointer transition-all duration-500 px-3 py-1 rounded-xl mx-2 flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-950/50 via-teal-900/60 to-teal-950/50 border border-teal-400/40 text-teal-100 font-semibold font-serif text-sm sm:text-base scale-105 shadow-[0_0_15px_rgba(45,212,191,0.25)]'
                    : isHovered
                    ? 'text-slate-200 bg-white/[0.04] text-xs font-serif scale-100'
                    : 'text-slate-400/70 text-xs font-serif scale-95 hover:text-slate-300'
                }`}
              >
                {/* Active or Hover Play Action Icon */}
                {isActive ? (
                  <Music className="w-3.5 h-3.5 text-teal-300 animate-bounce shrink-0" />
                ) : isHovered ? (
                  <Play className="w-2.5 h-2.5 text-teal-400 fill-current shrink-0" />
                ) : null}

                {/* Lyrics Line Text */}
                <span className="leading-relaxed tracking-wide transition-all">
                  {line}
                </span>

                {/* Timestamp tag shown on hover or when active */}
                {(isHovered || isActive) && (
                  <span className="text-[9px] font-mono text-teal-400/80 bg-teal-950/60 px-1 py-0.2 rounded border border-teal-500/20 shrink-0">
                    {formatLineTime(idx)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Subtle Playback Progress Bar */}
      <div className="relative z-20 w-full h-[2px] bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400 transition-all duration-300"
          style={{ width: `${Math.min(100, (currentTime / duration) * 100)}%` }}
        />
      </div>
    </div>
  );
};
