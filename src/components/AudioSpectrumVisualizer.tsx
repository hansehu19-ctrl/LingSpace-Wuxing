import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../utils/audioEngine';
import { Activity, Radio, Sparkles } from 'lucide-react';

interface AudioSpectrumVisualizerProps {
  isPlaying: boolean;
}

// Five Elements Acoustic Color Spectrum definitions
export const FIVE_ELEMENTS = [
  {
    key: 'earth',
    element: '土',
    name: '土黄',
    role: '地脉厚重',
    bandLabel: '低频 30-150Hz',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    gradFrom: '#f59e0b',
    gradTo: '#b45309',
    peakColor: '#fde68a',
  },
  {
    key: 'wood',
    element: '木',
    name: '木绿',
    role: '生发舒展',
    bandLabel: '中低频 150-600Hz',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.7)',
    gradFrom: '#34d399',
    gradTo: '#059669',
    peakColor: '#a7f3d0',
  },
  {
    key: 'water',
    element: '水',
    name: '水蓝',
    role: '润泽奔流',
    bandLabel: '中频 600-2kHz',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    gradFrom: '#38bdf8',
    gradTo: '#0284c7',
    peakColor: '#bae6fd',
  },
  {
    key: 'fire',
    element: '火',
    name: '火红',
    role: '心神照彻',
    bandLabel: '中高频 2k-6kHz',
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.7)',
    gradFrom: '#fb7185',
    gradTo: '#e11d48',
    peakColor: '#fecdd3',
  },
  {
    key: 'metal',
    element: '金',
    name: '金白',
    role: '清澈明亮',
    bandLabel: '高频 6k-16kHz',
    color: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 0.85)',
    gradFrom: '#ffffff',
    gradTo: '#fef08a',
    peakColor: '#ffffff',
  },
] as const;

export const AudioSpectrumVisualizer: React.FC<AudioSpectrumVisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualMode, setVisualMode] = useState<'wave' | 'bars' | 'ring'>('wave');
  const [activeElementFilter, setActiveElementFilter] = useState<string>('all');
  const animationFrameRef = useRef<number | null>(null);

  // Peak tracking for 30 bars
  const totalBars = 30;
  const peaksRef = useRef<number[]>(new Array(totalBars).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = 92);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 92;
    };
    window.addEventListener('resize', handleResize);

    let idlePhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Web Audio API frequency data and time domain waveform
      const freqData = audioEngine.getFrequencyData();
      const timeData = audioEngine.getTimeDomainData();

      // Check if actual sound waves are running through the analyser
      let maxSignal = 0;
      for (let i = 0; i < freqData.length; i++) {
        if (freqData[i] > maxSignal) maxSignal = freqData[i];
      }
      const hasRealSignal = maxSignal > 8;

      idlePhase += 0.04;

      // Extract energies for 5 frequency bands:
      // Band 0 (Earth - 土): bins 1-3 (~40-150Hz)
      // Band 1 (Wood - 木): bins 4-8 (~150-600Hz)
      // Band 2 (Water - 水): bins 9-16 (~600-2000Hz)
      // Band 3 (Fire - 火): bins 17-26 (~2000-6000Hz)
      // Band 4 (Metal - 金): bins 27-40 (~6000-16000Hz)
      const elementEnergies = [0, 0, 0, 0, 0];
      const bandRanges = [
        [1, 3],
        [4, 8],
        [9, 16],
        [17, 26],
        [27, 40],
      ];

      for (let e = 0; e < 5; e++) {
        const [start, end] = bandRanges[e];
        let sum = 0;
        let count = 0;
        for (let i = start; i <= end && i < freqData.length; i++) {
          sum += freqData[i];
          count++;
        }
        if (isPlaying && hasRealSignal) {
          elementEnergies[e] = (sum / (count || 1)) / 255;
        } else if (isPlaying) {
          // Harmonic fallback rhythm pulse
          elementEnergies[e] =
            0.2 + 0.45 * Math.abs(Math.sin(idlePhase * 1.5 + e * 0.9) * Math.cos(idlePhase * 0.8 + e * 0.4));
        } else {
          // Resting serene breath
          elementEnergies[e] = 0.06 + 0.04 * Math.sin(idlePhase + e * 0.7);
        }
      }

      // ==========================================
      // MODE 1: 五行相生波形律动 (Five Elements Waves)
      // ==========================================
      if (visualMode === 'wave') {
        const wavesToRender =
          activeElementFilter === 'all'
            ? FIVE_ELEMENTS
            : FIVE_ELEMENTS.filter((e) => e.key === activeElementFilter);

        wavesToRender.forEach((elem, elemIdx) => {
          const globalIdx = FIVE_ELEMENTS.findIndex((e) => e.key === elem.key);
          const energy = elementEnergies[globalIdx];
          const speedMultiplier = 0.8 + globalIdx * 0.35;
          const phaseOffset = idlePhase * speedMultiplier + globalIdx * 1.25;

          ctx.beginPath();
          ctx.lineWidth = activeElementFilter === 'all' ? 2 : 2.8;
          ctx.strokeStyle = elem.color;
          ctx.shadowColor = elem.glowColor;
          ctx.shadowBlur = isPlaying ? 10 : 2;

          const centerY = height / 2 + (globalIdx - 2) * 4;
          const amplitude = isPlaying
            ? Math.max(6, (height * 0.32) * energy)
            : 4 * (1 + 0.3 * Math.sin(idlePhase + globalIdx));

          const steps = 40;
          for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * width;
            // Real audio time-domain influence
            const timeSample = (timeData[Math.floor((i / steps) * (timeData.length - 1))] - 128) / 128;
            const waveY =
              centerY +
              Math.sin((i / steps) * Math.PI * 3.5 + phaseOffset) * amplitude +
              (isPlaying ? timeSample * amplitude * 0.6 : 0);

            if (i === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.stroke();

          // Subtle area luminescence under wave
          if (activeElementFilter !== 'all' || elemIdx === 2) {
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = elem.glowColor.replace('0.7', '0.07');
            ctx.fill();
          }

          ctx.shadowBlur = 0;
        });
      }

      // ==========================================
      // MODE 2: 五行频谱柱 (Five Elements Spectrum Bars)
      // ==========================================
      else if (visualMode === 'bars') {
        const barWidth = Math.max(3, (width - (totalBars - 1) * 2.5) / totalBars);
        const maxHeight = height - 16;
        const barsPerElement = totalBars / 5; // 6 bars per element

        for (let i = 0; i < totalBars; i++) {
          const elementIndex = Math.floor(i / barsPerElement);
          const elem = FIVE_ELEMENTS[elementIndex];

          // Skip if filtered to single element
          if (activeElementFilter !== 'all' && elem.key !== activeElementFilter) {
            continue;
          }

          const x = i * (barWidth + 2.5);
          const rawEnergy = elementEnergies[elementIndex];
          // Local variance per bar in this band
          const subBarVariance = Math.sin(i * 1.1 + idlePhase * 3) * 0.18;
          const val = Math.max(0.06, Math.min(0.98, rawEnergy + (isPlaying ? subBarVariance : 0)));

          const barHeight = Math.max(4, val * maxHeight);
          const y = height - barHeight - 4;

          // Update peak drops
          if (barHeight > peaksRef.current[i]) {
            peaksRef.current[i] = barHeight;
          } else {
            peaksRef.current[i] = Math.max(0, peaksRef.current[i] - 0.65);
          }

          // Bar Gradient with Five Elements Color
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, `${elem.color}33`);
          grad.addColorStop(0.5, `${elem.color}cc`);
          grad.addColorStop(1, elem.color);

          ctx.fillStyle = grad;
          ctx.shadowColor = elem.glowColor;
          ctx.shadowBlur = isPlaying ? 6 : 0;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2.5, 2.5, 0, 0]);
          ctx.fill();

          // Peak Cap dot
          const peakY = height - peaksRef.current[i] - 6;
          ctx.fillStyle = elem.peakColor;
          ctx.shadowColor = elem.color;
          ctx.shadowBlur = isPlaying ? 8 : 1;
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, Math.max(3, peakY), 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ==========================================
      // MODE 3: 五行相生共振环 (Mandala Rings)
      // ==========================================
      else {
        const cx = width / 2;
        const cy = height / 2;

        // Draw 5 concentric Five Element resonant rings: 土 -> 金 -> 水 -> 木 -> 火
        const ringOrder = [0, 4, 2, 1, 3]; // 土生金，金生水，水生木，木生火，火生土
        ringOrder.forEach((elemIdx, orderIdx) => {
          const elem = FIVE_ELEMENTS[elemIdx];
          const energy = elementEnergies[elemIdx];
          const baseR = 12 + orderIdx * 7;
          const dynamicR = baseR + (isPlaying ? energy * 10 : Math.sin(idlePhase + orderIdx) * 2);

          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(2, dynamicR), 0, Math.PI * 2);
          ctx.strokeStyle = elem.color;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = elem.glowColor;
          ctx.shadowBlur = isPlaying ? 8 : 1;
          ctx.stroke();

          // Resonant particle nodes along the ring
          if (isPlaying) {
            const angle = idlePhase * (1 + orderIdx * 0.4) + (orderIdx * Math.PI) / 2.5;
            const px = cx + Math.cos(angle) * dynamicR;
            const py = cy + Math.sin(angle) * dynamicR;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = elem.peakColor;
            ctx.fill();
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, visualMode, activeElementFilter]);

  return (
    <div className="w-full rounded-2xl bg-[#090b17]/90 border border-indigo-900/50 p-3 space-y-2 backdrop-blur-xl shadow-xl shadow-black/30">
      {/* Top Controls: Mode Switcher & Live Pulse */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Activity
            className={`w-4 h-4 transition-colors ${
              isPlaying ? 'text-teal-400 animate-pulse' : 'text-slate-500'
            }`}
          />
          <span>五行动态波形频谱</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
              isPlaying
                ? 'bg-teal-950 text-teal-300 border border-teal-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isPlaying ? 'LIVE' : 'STANDBY'}
          </span>
        </div>

        {/* Visual Mode Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVisualMode('wave')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              visualMode === 'wave'
                ? 'bg-teal-500/25 text-teal-200 border border-teal-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="五行相生流光波形"
          >
            波形
          </button>
          <button
            onClick={() => setVisualMode('bars')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              visualMode === 'bars'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="五行频段柱状谱"
          >
            柱谱
          </button>
          <button
            onClick={() => setVisualMode('ring')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              visualMode === 'ring'
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="五行相生共鸣环"
          >
            <Radio className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full h-[92px] overflow-hidden rounded-xl bg-black/60 border border-indigo-950/80 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Five Elements Color Legend & Filter Pills */}
      <div className="grid grid-cols-6 gap-1 pt-0.5 text-[10px]">
        {/* All Elements view button */}
        <button
          onClick={() => setActiveElementFilter('all')}
          className={`py-1 px-1 rounded-lg border text-center transition-all ${
            activeElementFilter === 'all'
              ? 'bg-white/10 text-white border-white/40 font-semibold'
              : 'text-slate-400 border-transparent hover:bg-white/[0.04]'
          }`}
        >
          五行全景
        </button>

        {/* 5 Individual Elements */}
        {FIVE_ELEMENTS.map((elem) => {
          const isSelected = activeElementFilter === elem.key;
          return (
            <button
              key={elem.key}
              onClick={() => setActiveElementFilter(isSelected ? 'all' : elem.key)}
              style={{
                borderColor: isSelected ? elem.color : 'transparent',
                color: isSelected ? elem.color : '#94a3b8',
              }}
              className={`py-1 px-1 rounded-lg border text-center flex items-center justify-center gap-1 transition-all ${
                isSelected ? 'bg-white/[0.08] font-semibold' : 'hover:bg-white/[0.04]'
              }`}
              title={`${elem.name} · ${elem.role} (${elem.bandLabel})`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: elem.color, boxShadow: `0 0 6px ${elem.color}` }}
              />
              <span className="truncate">{elem.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
