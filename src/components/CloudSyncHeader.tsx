import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Cloud, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { FieldBgmToggle } from './FieldBgmToggle';

export const CloudSyncHeader: React.FC = () => {
  const { user, isConnected, signInWithGoogle, signOutUser } = useFirebase();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="w-full flex items-center justify-between px-3 py-1.5 text-xs border-b border-indigo-950/40 bg-[#060812]/90">
      {/* Brand & Connection dot */}
      <div className="flex items-center gap-1.5 text-slate-300">
        <span className="font-semibold tracking-wide text-teal-200">灵伴空间</span>
        <span className="text-[10px] text-slate-500 font-serif">· 心灵场域</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'
          }`}
          title={isConnected ? 'Firestore 数据库已连接' : '网络连接中'}
        />
      </div>

      {/* Top-Right Actions: Field BGM Switch & Cloud Sync */}
      <div className="flex items-center gap-2">
        <FieldBgmToggle />

        <div className="relative">
          {user ? (
            <button
            onClick={() => {
              audioEngine.playChime(600);
              setShowUserMenu(!showUserMenu);
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-950/70 hover:bg-teal-900/80 border border-teal-500/30 text-[11px] text-teal-200 transition-colors"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || '行者'}
                referrerPolicy="no-referrer"
                className="w-3.5 h-3.5 rounded-full object-cover"
              />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span className="truncate max-w-[80px]">{user.displayName || '行者'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          </button>
        ) : (
          <button
            onClick={() => {
              audioEngine.playChime(640);
              signInWithGoogle();
            }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 hover:bg-indigo-950 border border-indigo-600/40 text-[11px] text-slate-300 hover:text-teal-200 transition-colors"
            title="使用 Google 登录同步心境与对话"
          >
            <Cloud className="w-3 h-3 text-teal-400" />
            <span>云端同步</span>
            <LogIn className="w-2.5 h-2.5 ml-0.5 opacity-60" />
          </button>
        )}

        {/* User Popover Menu */}
        {showUserMenu && user && (
          <div className="absolute right-0 top-7 z-50 w-52 p-3 rounded-2xl bg-[#0c0e1e] border border-indigo-700/60 shadow-2xl space-y-2 animate-fade-in text-slate-200">
            <div className="pb-1.5 border-b border-indigo-900/50">
              <p className="font-semibold text-white text-xs truncate">
                {user.displayName || '行者'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <p className="flex items-center gap-1.5 text-teal-300">
                <CheckCircle2 className="w-3 h-3" />
                <span>法相与对话实时同步中</span>
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                五行场域与心境记录已加密存储于 Firebase Firestore。
              </p>
            </div>

            <button
              onClick={() => {
                signOutUser();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-200 border border-slate-700 text-xs text-slate-300 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>退出登录</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
