import React, { useState, useRef, useEffect } from 'react';
import { Film, Play, Pause, RotateCcw, Maximize2, Sparkles } from 'lucide-react';
import { MemoryVideoItem } from '../../types';
import { audioEngine } from '../../utils/audioEngine';

interface VideoTabProps {
  videos: MemoryVideoItem[];
}

export const VideoTab: React.FC<VideoTabProps> = ({ videos }) => {
  const [activeVideo, setActiveVideo] = useState<MemoryVideoItem>(videos[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Playback progress ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            audioEngine.stop();
            return 0;
          }
          return prev + 0.8;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Generative Canvas Visualizer for the Video Player
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = Math.round(width * (9 / 16)));

    let frame = 0;

    const render = () => {
      frame++;
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      if (activeVideo.themePreset === 'stars') {
        // Swirling Nebula & Cosmic Dust Galaxy
        const starCount = 80;
        for (let i = 0; i < starCount; i++) {
          const angle = (i * 0.2) + (isPlaying ? frame * 0.015 : frame * 0.003);
          const dist = (i * 2.2) % (width * 0.45);
          const x = cx + Math.cos(angle) * dist;
          const y = cy + Math.sin(angle) * (dist * 0.55);

          ctx.beginPath();
          ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#e0e7ff';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#38bdf8';
          ctx.fill();
        }

        // Center glowing stellar core
        const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 40);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.6)');
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeVideo.themePreset === 'river') {
        // Flowing River & Ripples
        ctx.lineWidth = 2.5;
        for (let line = 0; line < 5; line++) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.3 + line * 0.15})`;
          for (let x = 0; x < width; x += 10) {
            const wave = Math.sin(x * 0.02 + (isPlaying ? frame * 0.05 : 0) + line) * 15;
            const y = cy - 20 + line * 12 + wave;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (activeVideo.themePreset === 'seed') {
        // Sprouting Seed of Light
        ctx.beginPath();
        ctx.arc(cx, cy + 20, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();

        // Upward growing light vines
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 20);
        const curve = Math.sin(frame * 0.03) * 10;
        ctx.quadraticCurveTo(cx + curve, cy - 20, cx, cy - 50);
        ctx.stroke();
      } else {
        // Winter twilight snow
        for (let s = 0; s < 45; s++) {
          const sx = (s * 33 + frame * 0.5) % width;
          const sy = (s * 27 + (isPlaying ? frame * 1.2 : frame * 0.3)) % height;
          ctx.beginPath();
          ctx.arc(sx, sy, (s % 2) + 1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(224, 231, 255, 0.7)';
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [activeVideo, isPlaying]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioEngine.stop();
    } else {
      setIsPlaying(true);
      audioEngine.playChime(750);
      if (activeVideo.themePreset === 'stars') {
        audioEngine.startPreset('stars', 0.6);
      } else if (activeVideo.themePreset === 'river') {
        audioEngine.startPreset('ocean', 0.6);
      } else {
        audioEngine.startPreset('flute', 0.6);
      }
    }
  };

  const handleSelectVideo = (vid: MemoryVideoItem) => {
    audioEngine.playChime(640);
    setActiveVideo(vid);
    setProgress(0);
    setIsPlaying(true);
    if (vid.themePreset === 'stars') {
      audioEngine.startPreset('stars', 0.6);
    } else if (vid.themePreset === 'river') {
      audioEngine.startPreset('ocean', 0.6);
    } else {
      audioEngine.startPreset('flute', 0.6);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fade-in">
      {/* Element Header */}
      <div className="text-center space-y-2 pt-1">
        <div className="inline-flex items-center justify-center gap-2 text-xl font-bold text-white tracking-wide">
          <Film className="w-6 h-6 text-cyan-400" />
          <span>影像载忆</span>
        </div>

        {/* Five Element Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-950/70 border border-cyan-500/30 text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
            <span>🌊</span>
            <span>水 · 时间 · 记忆留存</span>
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-300/80 max-w-xs mx-auto leading-relaxed">
          将文字故事与音律情绪，化作可视影像，延续记忆、演绎篇章
        </p>
      </div>

      {/* Main Video Viewport (Matching screenshot IMG_5463) */}
      <div className="rounded-2xl bg-[#0f1124]/80 border border-indigo-800/35 p-4 backdrop-blur-xl space-y-3 shadow-xl shadow-black/25">
        <div className="relative rounded-xl overflow-hidden aspect-video bg-[#060814] border border-cyan-500/20 group">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Big Center Play/Pause button */}
          <button
            onClick={handleTogglePlay}
            className={`absolute inset-0 m-auto w-14 h-14 rounded-full bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-400/50 flex items-center justify-center text-cyan-200 shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all ${
              isPlaying ? 'opacity-0 group-hover:opacity-90' : 'opacity-100 scale-105'
            }`}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Bottom Video Progress Scrub Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/60">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Video meta info */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {activeVideo.title} · {activeVideo.format}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeVideo.durationStr} · {activeVideo.category}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setProgress(0);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="重头播放"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (canvasRef.current?.requestFullscreen) {
                  canvasRef.current.requestFullscreen();
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="全屏"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Memory Timeline (Matching screenshot IMG_5463) */}
      <div className="rounded-2xl bg-[#0f1124]/80 border border-indigo-800/35 p-4 backdrop-blur-xl space-y-3 shadow-xl shadow-black/25">
        <div className="text-center pb-1">
          <span className="text-xs text-slate-400 font-medium tracking-wider">
            — 记忆时间线 —
          </span>
        </div>

        {/* Timeline Items */}
        <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-indigo-700/50">
          {videos.map((vid) => {
            const isSelected = activeVideo.id === vid.id;
            return (
              <div
                key={vid.id}
                onClick={() => handleSelectVideo(vid)}
                className="relative cursor-pointer group"
              >
                {/* Node dot on timeline line */}
                <div
                  className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border transition-all ${
                    isSelected
                      ? 'bg-cyan-400 border-white ring-4 ring-cyan-500/20 shadow-[0_0_8px_#38bdf8]'
                      : 'bg-indigo-900 border-indigo-600 group-hover:bg-cyan-600'
                  }`}
                />

                {/* Season & Year */}
                <span className="text-[11px] text-slate-500 font-mono">
                  {vid.year} · {vid.season}
                </span>

                {/* Video Card Title */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Film className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <h4 className={`text-sm font-semibold transition-colors ${isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'}`}>
                    {vid.title}
                  </h4>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-0.5">
                  {vid.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory Philosophy Footer */}
      <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-center">
        <p className="text-[11px] text-cyan-200/90 font-serif">
          “时光如逝水，影像为舟桥。每一个定格的瞬间，皆在此地长存。”
        </p>
      </div>
    </div>
  );
};
