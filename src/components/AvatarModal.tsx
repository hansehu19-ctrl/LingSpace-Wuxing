import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { AvatarForm } from '../types';
import { AVATAR_FORMS } from '../data/mockData';
import { audioEngine } from '../utils/audioEngine';

interface AvatarModalProps {
  currentAvatar: AvatarForm;
  onSelectAvatar: (avatar: AvatarForm) => void;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  currentAvatar,
  onSelectAvatar,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0d0f1e] border-t sm:border border-indigo-700/50 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-indigo-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold text-white tracking-wide">
              灵伴法相 · 形象更替
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
          选择与你当下心境共鸣的灵性能量法相，伴你在此方天地安歇。
        </p>

        {/* Forms list */}
        <div className="space-y-2.5">
          {AVATAR_FORMS.map((form) => {
            const isSelected = currentAvatar.id === form.id;
            return (
              <div
                key={form.id}
                onClick={() => {
                  audioEngine.playChime(680);
                  onSelectAvatar(form);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-gradient-to-r from-teal-950/60 to-indigo-950/60 border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                    : 'bg-[#13162d]/60 hover:bg-[#181c3b] border-indigo-900/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Avatar Mini Icon */}
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-tr ${form.glowAura} shadow-md flex items-center justify-center relative shrink-0 overflow-hidden ring-1 ring-white/20`}
                  >
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt={form.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/70 blur-[1px]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">
                        {form.name}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/80 text-teal-300 border border-teal-500/30">
                        {form.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {form.description}
                    </p>
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
          确定换相
        </button>
      </div>
    </div>
  );
};
