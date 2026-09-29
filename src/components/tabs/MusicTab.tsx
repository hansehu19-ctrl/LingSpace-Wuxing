import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  Cloud,
  BookOpen,
  RotateCcw,
  Save,
  Check,
  Edit2,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { AudioTrack } from '../../types';
import { audioEngine } from '../../utils/audioEngine';
import { trackStorage } from '../../utils/trackStorage';
import { fieldBgmEngine } from '../../utils/fieldBgmEngine';
import { AudioSpectrumVisualizer } from '../AudioSpectrumVisualizer';
import { ScrollingLyricsBox } from '../ScrollingLyricsBox';
import { useFirebase } from '../../context/FirebaseContext';

interface MusicTabProps {
  tracks: AudioTrack[];
  onAddTrack: (track: AudioTrack, file?: File | Blob) => void;
  onRemoveTrack: (id: string) => void;
  currentTrack: AudioTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectTrack: (track: AudioTrack) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onUpdateTrackTitle?: (id: string, title: string) => Promise<void>;
  onUpdateTrackNotes?: (id: string, notes: string) => Promise<void>;
  onUpdateTrackProgress?: (id: string, progress: number) => Promise<void>;
}

export const MusicTab: React.FC<MusicTabProps> = ({
  tracks,
  onAddTrack,
  onRemoveTrack,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onSelectTrack,
  onNextTrack,
  onPrevTrack,
  onUpdateTrackTitle,
  onUpdateTrackNotes,
  onUpdateTrackProgress,
}) => {
  const { user, signInWithGoogle, cloudTracks } = useFirebase();

  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [currentTime, setCurrentTime] = useState(1);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'all' | 'one' | 'shuffle'>('all');

  // Track title editing state
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>(currentTrack.title);
  const [isTitleSaved, setIsTitleSaved] = useState<boolean>(false);

  // Track notes editing state
  const [notesInput, setNotesInput] = useState<string>(currentTrack.notes || '');
  const [isNotesSaved, setIsNotesSaved] = useState<boolean>(false);
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync title and notes when currentTrack changes
  useEffect(() => {
    setTitleInput(currentTrack.title);
    setIsEditingTitle(false);
    setNotesInput(currentTrack.notes || '');
    setIsNotesSaved(false);
  }, [currentTrack.id, currentTrack.title, currentTrack.notes]);

  // Upload box visibility state: automatically hidden once music is uploaded
  const [showUploadBox, setShowUploadBox] = useState<boolean>(() => !tracks.some((t) => t.category === '本地上传'));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lrcInputRef = useRef<HTMLInputElement>(null);

  // Direct real-time synchronization with audioEngine for lyrics and progress
  useEffect(() => {
    const initialTime = Math.floor(audioEngine.getCurrentTime());
    setCurrentTime(initialTime);

    const unsubTime = audioEngine.onTimeUpdate((curr, dur) => {
      setCurrentTime(Math.floor(curr));
      if (dur > 0 && Math.abs(currentTrack.duration - dur) > 2) {
        currentTrack.duration = Math.floor(dur);
      }
    });

    return () => unsubTime();
  }, [currentTrack.id]);

  // Automatic periodic progress persistence to Firestore (every 3 seconds when playing)
  useEffect(() => {
    if (!isPlaying || !currentTrack.id) return;

    const timer = setInterval(() => {
      const cur = Math.floor(audioEngine.getCurrentTime());
      if (cur > 1 && onUpdateTrackProgress) {
        onUpdateTrackProgress(currentTrack.id, cur);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [isPlaying, currentTrack.id, onUpdateTrackProgress]);

  // Save progress on pause or track change
  const handleSaveProgress = (prog: number) => {
    if (onUpdateTrackProgress && currentTrack.id) {
      onUpdateTrackProgress(currentTrack.id, Math.floor(prog));
    }
  };

  // Track completion handling
  useEffect(() => {
    if (currentTime >= currentTrack.duration && currentTrack.duration > 0 && isPlaying) {
      handleSaveProgress(0); // Reset progress on completion
      if (repeatMode === 'one') {
        audioEngine.seek(0);
        setCurrentTime(0);
      } else {
        onNextTrack();
      }
    }
  }, [currentTime, currentTrack.duration, isPlaying, repeatMode, onNextTrack]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Audio file upload with immediate Firestore persistence
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');

    const customLyrics = [
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

    const newTrack: AudioTrack = {
      id: `custom-${Date.now()}`,
      title: cleanName,
      artist: '我的音频',
      duration: 279,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
      category: '本地上传',
      synthPreset: 'custom',
      fileUrl: objectUrl,
      lyrics: customLyrics,
      notes: '上传于灵伴空间 · 云端永久记忆',
      lastPlayedProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddTrack(newTrack, file);
    onSelectTrack(newTrack);
    audioEngine.playChime(640);
    fieldBgmEngine.stop(); // Turn off field BGM so uploaded song has exclusive audio

    setShowUploadBox(false);
  };

  const handleLrcUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const lines = text
          .split('\n')
          .map((l) => l.replace(/\[\d{2}:\d{2}(\.\d{2,3})?\]/g, '').trim())
          .filter((l) => l.length > 0 && !l.startsWith('[ti:') && !l.startsWith('[ar:') && !l.startsWith('[al:'));
        if (lines.length > 0) {
          currentTrack.lyrics = lines;
          trackStorage.saveTrack(currentTrack);
          audioEngine.playChime(700);
        }
      }
    };
    reader.readAsText(file);
  };

  // Title update with automatic Firestore persistence
  const handleSaveTitle = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === currentTrack.title) {
      setIsEditingTitle(false);
      return;
    }
    audioEngine.playChime(660);
    if (onUpdateTrackTitle && currentTrack.id) {
      await onUpdateTrackTitle(currentTrack.id, trimmed);
      setIsTitleSaved(true);
      setTimeout(() => setIsTitleSaved(false), 2000);
    }
    setIsEditingTitle(false);
  };

  // Notes update with automatic debounced Firestore persistence
  const handleNotesChange = (val: string) => {
    setNotesInput(val);

    // Clear existing timeout
    if (notesSaveTimeoutRef.current) {
      clearTimeout(notesSaveTimeoutRef.current);
    }

    // Debounced automatic save to Firestore after 1200ms of inactivity
    notesSaveTimeoutRef.current = setTimeout(async () => {
      if (onUpdateTrackNotes && currentTrack.id) {
        await onUpdateTrackNotes(currentTrack.id, val.trim());
        setIsNotesSaved(true);
        setTimeout(() => setIsNotesSaved(false), 2400);
      }
    }, 1200);
  };

  const handleManualSaveNotes = async () => {
    if (notesSaveTimeoutRef.current) {
      clearTimeout(notesSaveTimeoutRef.current);
    }
    audioEngine.playChime(680);
    if (onUpdateTrackNotes && currentTrack.id) {
      await onUpdateTrackNotes(currentTrack.id, notesInput.trim());
      setIsNotesSaved(true);
      setTimeout(() => setIsNotesSaved(false), 2400);
    }
  };

  // Resume from memory progress stored in Firestore
  const handleResumeFromLastProgress = (lastSec: number) => {
    audioEngine.playChime(600);
    const target = Math.max(0, Math.min(currentTrack.duration - 2, lastSec));
    setCurrentTime(target);
    audioEngine.seek(target);
    if (!isPlaying) {
      onTogglePlay();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    audioEngine.setVolume(newVol);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.7);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  const rawFiltered =
    categoryFilter === '全部'
      ? tracks
      : tracks.filter((t) => t.category === categoryFilter);

  const filteredTracks = rawFiltered.filter(
    (t, index, self) => index === self.findIndex((item) => item.id === t.id)
  );

  const userUploadedTracksCount = tracks.filter((t) => t.category === '本地上传').length;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fade-in">
      {/* Element Header */}
      <div className="text-center space-y-2 pt-1">
        <div className="inline-flex items-center justify-center gap-2 text-xl font-bold text-white tracking-wide">
          <Music className="w-6 h-6 text-rose-400" />
          <span>乐律心声</span>
        </div>

        {/* Five Element Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-950/70 border border-rose-500/30 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
            <span>🔥</span>
            <span>火 · 事 · 情绪发生与乐律疗愈</span>
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-300/80 max-w-xs mx-auto leading-relaxed">
          以有序声韵触动人心情绪，音频及名称、备注、播放进度全自动持久化存入云端
        </p>
      </div>

      {/* Main Music Player Container */}
      <div className="rounded-2xl bg-[#0f1124]/85 border border-indigo-800/35 p-4 backdrop-blur-xl space-y-4 shadow-xl shadow-black/25">
        {/* Firestore Memory Hub Banner (持久化云端记忆中枢) */}
        <div className="rounded-xl bg-gradient-to-r from-[#0c1228]/95 via-[#101938]/95 to-[#0e142d]/95 border border-cyan-500/35 p-3 space-y-2 text-xs shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Cloud className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Firestore 云端记忆中枢</span>
            </div>
            {user ? (
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>持久化记忆已联结</span>
              </span>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-medium transition-all"
              >
                登录开启云端持久化
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {user ? (
              <>
                已为账号 <span className="text-cyan-200 font-mono font-medium">{user.email || '用户'}</span> 持久化{' '}
                <span className="text-amber-300 font-bold">{cloudTracks.length}</span> 首音频及关联元信息（包含
                <strong className="text-cyan-300">音频名称、心得备注、最后播放进度与歌词</strong>）。下次访问时自动加载，不再依赖本地临时内存。
              </>
            ) : (
              <>
                当前检测到已加载 <span className="text-amber-300 font-bold">{userUploadedTracksCount}</span> 首本地音频。登录后将全自动将关联信息持久化至 Firestore 数据库，实现跨设备与跨会话自动还原。
              </>
            )}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-[#171a36] text-slate-200 border border-indigo-700/40 rounded-lg pl-2.5 pr-7 py-1 text-xs outline-none cursor-pointer"
            >
              <option value="全部">🎵 全部分类</option>
              <option value="本地上传">📁 本地上传 ({userUploadedTracksCount})</option>
              <option value="抒情民谣">抒情民谣</option>
              <option value="冥想静心">冥想静心</option>
              <option value="宇宙白噪">宇宙白噪</option>
              <option value="国风空灵">国风空灵</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          <span className="text-xs font-mono text-cyan-400">
            {filteredTracks.length} 首可播放曲目
          </span>
        </div>

        {/* Hidden File Inputs for Audio and LRC */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={lrcInputRef}
          type="file"
          accept=".lrc,.txt"
          onChange={handleLrcUpload}
          className="hidden"
        />

        {/* Audio upload dropzone or Vertical Scrolling Lyrics Container */}
        {showUploadBox ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative cursor-pointer border-2 border-dashed border-indigo-600/40 hover:border-teal-400/60 rounded-2xl p-4 flex flex-col items-center justify-center bg-indigo-950/20 hover:bg-indigo-950/40 transition-all text-center min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-teal-300" />
            </div>
            <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
              拖拽音频文件到此处，或点击上传新曲目
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              支持 MP3 / WAV / M4A · 自动将名称、备注与最后进度持久化至 Firestore
            </p>

            {/* Toggle to lyrics if track is ready */}
            {currentTrack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUploadBox(false);
                }}
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-teal-300 hover:text-white px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 transition-colors shadow-sm"
              >
                <span>查看当前歌词字幕</span>
              </button>
            )}
          </div>
        ) : (
          <ScrollingLyricsBox
            lyrics={currentTrack.lyrics || []}
            currentTime={currentTime}
            totalDuration={currentTrack.duration}
            isPlaying={isPlaying}
            onSeek={(sec) => {
              setCurrentTime(sec);
              audioEngine.seek(sec);
              handleSaveProgress(sec);
            }}
            onReUpload={() => fileInputRef.current?.click()}
            trackTitle={currentTrack.title}
            trackArtist={currentTrack.artist}
          />
        )}

        {/* Tracks Table Header */}
        <div className="grid grid-cols-12 text-[11px] text-slate-500 px-2 font-medium">
          <span className="col-span-6">曲目名称与备注</span>
          <span className="col-span-3 text-center">最后进度 (云端记忆)</span>
          <span className="col-span-2 text-right">大小</span>
          <span className="col-span-1"></span>
        </div>

        {/* Tracks List */}
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
          {filteredTracks.map((track) => {
            const isCurrent = currentTrack.id === track.id;
            const isUploaded = track.category === '本地上传';

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`grid grid-cols-12 items-center text-xs p-2 rounded-xl cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-teal-950/50 border border-teal-500/30 text-teal-200 shadow-sm'
                    : 'hover:bg-white/[0.04] text-slate-300'
                }`}
              >
                <div className="col-span-6 flex flex-col justify-center gap-0.5 truncate pr-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Music
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCurrent ? 'text-teal-400 animate-pulse' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate font-medium">{track.title}</span>
                    {isUploaded && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 shrink-0 font-mono">
                        云端已存
                      </span>
                    )}
                  </div>
                  {track.notes && (
                    <span className="text-[10px] text-amber-300/85 truncate pl-5">
                      📝 {track.notes}
                    </span>
                  )}
                </div>

                <div className="col-span-3 text-center text-[10px] font-mono">
                  {track.lastPlayedProgress && track.lastPlayedProgress > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30 flex items-center justify-center gap-0.5 mx-auto w-fit">
                      <Cloud className="w-2.5 h-2.5 text-teal-400" />
                      <span>{formatTime(track.lastPlayedProgress)}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </div>

                <div className="col-span-2 text-right text-[10px] text-slate-400 font-mono">
                  {track.fileSize || '8.5MB'}
                </div>

                <div className="col-span-1 flex justify-end">
                  {tracks.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                      title="移除曲目"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Currently playing title & Name Editing Form */}
        <div className="pt-2 border-t border-indigo-900/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 flex-1 pr-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  placeholder="修改曲目名称并存入云端…"
                  className="w-full text-xs bg-black/60 border border-cyan-400/60 rounded-lg px-2 py-1 text-white outline-none"
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-2 py-1 rounded-md bg-teal-500 text-slate-950 font-bold text-[11px] shrink-0"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="px-1.5 py-1 text-slate-400 hover:text-white text-[11px]"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 truncate">
                <Music className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs font-semibold text-white truncate">
                  {currentTrack.title}
                </span>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-slate-400 hover:text-cyan-300 p-1"
                  title="修改曲目名称（自动保存至 Firestore）"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                {isTitleSaved && (
                  <span className="text-[10px] text-emerald-400 animate-fade-in">
                    已保存至云端
                  </span>
                )}
              </div>
            )}

            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-500/30 shrink-0">
              {isPlaying ? '▶ 播放中' : '⏸ 已暂停'}
            </span>
          </div>

          {/* Quick Memory Resume Pill */}
          {currentTrack.lastPlayedProgress && currentTrack.lastPlayedProgress > 3 && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  已记忆最后播放进度：
                  <strong className="text-white font-mono ml-1">
                    {formatTime(currentTrack.lastPlayedProgress)}
                  </strong>
                </span>
              </span>
              <button
                onClick={() => handleResumeFromLastProgress(currentTrack.lastPlayedProgress!)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 border border-amber-400/40 text-[11px] font-medium transition-colors shadow-sm"
              >
                <RotateCcw className="w-3 h-3" />
                <span>从进度续播</span>
              </button>
            </div>
          )}
        </div>

        {/* Persistent Memory & Remarks Card (Firestore 持久化记忆) */}
        <div className="rounded-xl bg-[#090b17]/85 border border-indigo-900/40 p-3 space-y-2 text-xs backdrop-blur-md shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-300 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>曲目心得备注（自动持久化到 Firestore）</span>
            </div>

            {isNotesSaved && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 animate-fade-in font-mono">
                <Check className="w-3 h-3" />
                <span>已同步到云端</span>
              </span>
            )}
          </div>

          {/* Notes textarea with Firestore Sync */}
          <div className="space-y-1.5">
            <textarea
              value={notesInput}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="写下你对这首曲子的随笔感悟、情绪备注（如：深夜冥想、舒缓静心...），支持自动防抖保存，下次访问直接还原"
              maxLength={500}
              rows={2}
              className="w-full text-xs bg-black/50 border border-indigo-950/90 focus:border-teal-500/50 rounded-lg p-2 text-slate-200 placeholder:text-slate-500 outline-none resize-none transition-colors"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>{notesInput.length}/500 字 · 自动持久化存储</span>
              <button
                onClick={handleManualSaveNotes}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition-all shadow-sm"
              >
                <Save className="w-3 h-3" />
                <span>立刻保存至云端</span>
              </button>
            </div>
          </div>
        </div>

        {/* Web Audio API Dynamic Spectrum Visualizer */}
        <AudioSpectrumVisualizer isPlaying={isPlaying} />

        {/* Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={currentTrack.duration}
            value={currentTime}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentTime(val);
              audioEngine.seek(val);
              handleSaveProgress(val);
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="flex items-center justify-center gap-6 py-1">
          {/* Prev */}
          <button
            onClick={() => {
              handleSaveProgress(currentTime);
              onPrevTrack();
            }}
            className="p-2 text-slate-300 hover:text-white active:scale-95 transition-all"
            title="上一首"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Big Play / Pause Circle */}
          <button
            onClick={() => {
              handleSaveProgress(currentTime);
              onTogglePlay();
            }}
            className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-400 active:scale-90 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => {
              handleSaveProgress(currentTime);
              onNextTrack();
            }}
            className="p-2 text-slate-300 hover:text-white active:scale-95 transition-all"
            title="下一首"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat mode */}
          <button
            onClick={() => {
              setRepeatMode((prev) => (prev === 'all' ? 'one' : prev === 'one' ? 'shuffle' : 'all'));
            }}
            className={`p-2 transition-all ${
              repeatMode === 'one' ? 'text-teal-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title={`循环模式: ${repeatMode === 'all' ? '列表循环' : repeatMode === 'one' ? '单曲循环' : '随机播放'}`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Slider Row */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <button onClick={toggleMute} className="text-slate-400 hover:text-slate-200">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
        </div>

        {/* Cloud Persistence Guarantee Footnote */}
        <p className="text-[10px] text-center text-slate-500 font-sans pt-1">
          ☁️ 音频名称、备注及最后播放进度实时持久化到 Firestore · 下次访问自动还原
        </p>
      </div>
    </div>
  );
};
