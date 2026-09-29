import React from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { SceneSetting } from '../types';
import { SCENES } from '../data/mockData';
import { audioEngine } from '../utils/audioEngine';

interface ScenePickerModalProps {
  currentScene: SceneSetting;
  onSelectScene: (scene: SceneSetting) => void;
  onClose: () => void;
}

export const ScenePickerModal: React.FC<ScenePickerModalProps> = ({
  currentScene,
  onSelectScene,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0d0f1e] border-t sm:border border-indigo-700/50 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-indigo-900/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-300" />
            <h3 className="text-base font-bold text-white tracking-wide">
              切换心灵场域 · 场景
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300/80">
          土为万物承载之所。选择不同的背景场域，体验不同的光影与微风拂动。
        </p>

        {/* Scenes Grid */}
        <div className="space-y-2.5">
          {SCENES.map((scene) => {
            const isSelected = currentScene.id === scene.id;
            return (
              <div
                key={scene.id}
                onClick={() => {
                  audioEngine.playChime(640);
                  onSelectScene(scene);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-gradient-to-r from-teal-950/60 to-indigo-950/60 border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                    : 'bg-[#13162d]/60 hover:bg-[#181c3b] border-indigo-900/40 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                    <h4 className="text-sm font-semibold text-white">
                      {scene.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{scene.weather}</span>
                    <span>·</span>
                    <span>{scene.wind}</span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition-all"
        >
          确定场域
        </button>
      </div>
    </div>
  );
};
