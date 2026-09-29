/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TabKey, AudioTrack, StoryItem, AvatarForm, SceneSetting, ElementTimeRecord } from './types';
import {
  INITIAL_STORIES,
  INITIAL_TRACKS,
  INITIAL_VIDEOS,
  AVATAR_FORMS,
  SCENES,
} from './data/mockData';
import { CosmicBackground } from './components/CosmicBackground';
import { TopNav } from './components/TopNav';
import { CloudSyncHeader } from './components/CloudSyncHeader';
import { SpaceTab } from './components/tabs/SpaceTab';
import { ChatTab } from './components/tabs/ChatTab';
import { MusicTab } from './components/tabs/MusicTab';
import { StoryTab } from './components/tabs/StoryTab';
import { VideoTab } from './components/tabs/VideoTab';
import { SpiritualAvatar } from './components/SpiritualAvatar';
import { BottomBar } from './components/BottomBar';
import { StoryReaderModal } from './components/StoryReaderModal';
import { AvatarModal } from './components/AvatarModal';
import { ScenePickerModal } from './components/ScenePickerModal';
import { audioEngine } from './utils/audioEngine';
import { fieldBgmEngine } from './utils/fieldBgmEngine';
import { trackStorage } from './utils/trackStorage';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { Smartphone, Monitor } from 'lucide-react';

// Helper to prevent duplicate track keys in playlist state
const deduplicateTracks = (list: AudioTrack[]): AudioTrack[] => {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

function SpaceApp() {
  const {
    user,
    isConnected,
    saveUserProfile,
    cloudTracks,
    saveTrackToFirestore,
    deleteTrackFromFirestore,
    updateTrackNotesInFirestore,
    updateTrackTitleInFirestore,
    updateTrackProgressInFirestore,
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<TabKey>('earth');
  const [currentAvatar, setCurrentAvatar] = useState<AvatarForm>(AVATAR_FORMS[0]);
  const [currentScene, setCurrentScene] = useState<SceneSetting>(SCENES[0]);

  // Audio system state
  const [tracks, setTracks] = useState<AudioTrack[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Stories & Reading state
  const [stories] = useState<StoryItem[]>(INITIAL_STORIES);
  const [readingStory, setReadingStory] = useState<StoryItem | null>(null);

  // Modals
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [isSceneModalOpen, setIsSceneModalOpen] = useState<boolean>(false);

  // Desktop frame mode (Mobile view vs Expand view)
  const [isDeviceFrame, setIsDeviceFrame] = useState<boolean>(true);

  // Five Elements Active Time Tracking
  const [elementTimes, setElementTimes] = useState<ElementTimeRecord>(() => {
    try {
      const stored = localStorage.getItem('wuxing_time_spent_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  });

  // Track active time per tab whenever user is in that tab
  useEffect(() => {
    const timer = setInterval(() => {
      setElementTimes((prev) => {
        const next = {
          ...prev,
          [activeTab]: (prev[activeTab] || 0) + 1,
        };
        try {
          localStorage.setItem('wuxing_time_spent_v1', JSON.stringify(next));
        } catch (e) {
          // ignore
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab]);

  const handleFastUnlockAll = () => {
    const full: ElementTimeRecord = {
      wood: 20,
      fire: 20,
      earth: 20,
      metal: 20,
      water: 20,
    };
    setElementTimes(full);
    try {
      localStorage.setItem('wuxing_time_spent_v1', JSON.stringify(full));
    } catch (e) {
      // ignore
    }
  };

  const handleResetElementTimes = () => {
    const reset: ElementTimeRecord = {
      wood: 0,
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0,
    };
    setElementTimes(reset);
    try {
      localStorage.setItem('wuxing_time_spent_v1', JSON.stringify(reset));
    } catch (e) {
      // ignore
    }
  };

  // Sync avatar and scene changes to user profile in Firestore
  useEffect(() => {
    if (user && isConnected) {
      saveUserProfile(currentAvatar, currentScene);
    }
  }, [user, isConnected, currentAvatar.id, currentScene.id, saveUserProfile]);

  // Load archived uploaded audio tracks from IndexedDB on startup
  useEffect(() => {
    trackStorage.getSavedTracks().then((saved) => {
      if (saved && saved.length > 0) {
        setTracks(deduplicateTracks([...saved, ...INITIAL_TRACKS]));
      }
    });
  }, []);

  // Merge cloudTracks from Firestore with local audio blobs and initial preset tracks
  useEffect(() => {
    if (cloudTracks && cloudTracks.length > 0) {
      Promise.all(
        cloudTracks.map(async (ct) => {
          const blob = await trackStorage.getBlob(ct.id);
          if (blob) {
            return {
              ...ct,
              fileUrl: URL.createObjectURL(blob),
            };
          }
          return ct;
        })
      ).then((resolvedCloudTracks) => {
        setTracks((prev) => {
          const cloudIds = new Set(resolvedCloudTracks.map((t) => t.id));
          const localOnly = prev.filter((t) => t.category === '本地上传' && !cloudIds.has(t.id));
          const nonCloudInitial = INITIAL_TRACKS.filter((t) => !cloudIds.has(t.id));
          return deduplicateTracks([...resolvedCloudTracks, ...localOnly, ...nonCloudInitial]);
        });

        // Sync currentTrack with Firestore values if matching, or load the latest cloud track on next visit
        setCurrentTrack((prev) => {
          const matched = resolvedCloudTracks.find((t) => t.id === prev.id);
          if (matched) {
            return {
              ...prev,
              title: matched.title,
              notes: matched.notes,
              lastPlayedProgress: matched.lastPlayedProgress,
              lyrics: matched.lyrics || prev.lyrics,
              fileUrl: matched.fileUrl || prev.fileUrl,
            };
          }
          if (prev.id === INITIAL_TRACKS[0].id && resolvedCloudTracks.length > 0) {
            return resolvedCloudTracks[0];
          }
          return prev;
        });
      });
    }
  }, [cloudTracks]);

  // Manage Field BGM (Thaïs Méditation solo violin pure instrumental)
  useEffect(() => {
    fieldBgmEngine.handleTabChange(activeTab);
  }, [activeTab]);

  // Initial field BGM launch with user-gesture unlock for browser autoplay policy
  useEffect(() => {
    if (activeTab === 'earth') {
      fieldBgmEngine.start();
    }

    const handleFirstGesture = () => {
      fieldBgmEngine.resumeIfBlocked();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Subscribe to audio engine state changes
  useEffect(() => {
    const unsub = audioEngine.onStateChange((playing) => {
      setIsPlaying(playing);
    });
    return () => unsub();
  }, []);

  // Toggle Music Playback
  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      // Yield field BGM to MusicTab player
      fieldBgmEngine.stop();
      await audioEngine.initContext();
      if (audioEngine.isPaused()) {
        await audioEngine.resume();
        setIsPlaying(true);
      } else {
        if (currentTrack.fileUrl) {
          await audioEngine.playAudioFile(currentTrack.fileUrl, 0.8, () => {
            setIsPlaying(false);
          });
        } else {
          await audioEngine.startPreset(currentTrack.synthPreset || 'lullaby', 0.7);
        }
        setIsPlaying(true);
      }
    }
  };

  const handleSelectTrack = async (track: AudioTrack) => {
    // Yield field BGM to MusicTab player
    fieldBgmEngine.stop();
    setCurrentTrack(track);
    await audioEngine.initContext();
    if (track.fileUrl) {
      audioEngine.playAudioFile(track.fileUrl, 0.8, () => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    } else {
      audioEngine.startPreset(track.synthPreset || 'lullaby', 0.7);
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handleSelectTrack(tracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handleSelectTrack(tracks[prevIndex]);
  };

  const handleAddTrack = async (newTrack: AudioTrack, file?: File | Blob) => {
    await trackStorage.saveTrack(newTrack, file);
    if (user) {
      await saveTrackToFirestore(newTrack);
    }
    setTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)]);
  };

  const handleRemoveTrack = async (id: string) => {
    await trackStorage.deleteTrack(id);
    if (user) {
      await deleteTrackFromFirestore(id);
    }
    setTracks((prev) => prev.filter((t) => t.id !== id));
    if (currentTrack.id === id) {
      const remaining = tracks.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setCurrentTrack(remaining[0]);
      }
    }
  };

  const handleUpdateTrackNotes = async (id: string, notes: string) => {
    const target = tracks.find((t) => t.id === id);
    if (!target) return;
    const updated = { ...target, notes };

    setTracks((prev) =>
      prev.map((t) => (t.id === id ? updated : t))
    );
    if (currentTrack.id === id) {
      setCurrentTrack(updated);
    }
    await trackStorage.saveTrack(updated);
    if (user) {
      await updateTrackNotesInFirestore(updated, notes);
    }
  };

  const handleUpdateTrackProgress = async (id: string, progress: number) => {
    const target = tracks.find((t) => t.id === id);
    if (!target) return;
    const updated = { ...target, lastPlayedProgress: progress };

    setTracks((prev) =>
      prev.map((t) => (t.id === id ? updated : t))
    );
    if (currentTrack.id === id) {
      setCurrentTrack(updated);
    }
    await trackStorage.saveTrack(updated);
    if (user) {
      await updateTrackProgressInFirestore(updated, progress);
    }
  };

  const handleUpdateTrackTitle = async (id: string, title: string) => {
    const target = tracks.find((t) => t.id === id);
    if (!target) return;
    const updated = { ...target, title };

    setTracks((prev) =>
      prev.map((t) => (t.id === id ? updated : t))
    );
    if (currentTrack.id === id) {
      setCurrentTrack(updated);
    }
    await trackStorage.saveTrack(updated);
    if (user) {
      await updateTrackTitleInFirestore(updated, title);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-x-hidden font-sans text-slate-100 selection:bg-teal-500/30 selection:text-teal-200">
      {/* Animated Starlight & Nebula Canvas Background */}
      <CosmicBackground scene={currentScene} />

      {/* Desktop view switcher toggle */}
      <div className="hidden lg:flex fixed top-3 right-4 z-50 items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-indigo-700/40 backdrop-blur-md text-xs text-slate-300 shadow-lg">
        <span className="text-[11px] text-slate-400">视图模式:</span>
        <button
          onClick={() => setIsDeviceFrame(true)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
            isDeviceFrame ? 'bg-teal-500 text-slate-950 font-semibold' : 'hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>手机原型 (390px)</span>
        </button>
        <button
          onClick={() => setIsDeviceFrame(false)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
            !isDeviceFrame ? 'bg-teal-500 text-slate-950 font-semibold' : 'hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>广角展示</span>
        </button>
      </div>

      {/* Main Container: Mobile phone viewport by default (375px~430px) or responsive */}
      <div
        className={`relative z-10 w-full min-h-screen flex flex-col transition-all duration-500 ${
          isDeviceFrame
            ? 'max-w-[430px] my-0 sm:my-3 sm:rounded-[36px] sm:ring-1 sm:ring-indigo-700/50 sm:shadow-[0_0_50px_rgba(15,23,42,0.8)] overflow-hidden bg-[#090b16]/90'
            : 'max-w-2xl bg-[#090b16]/80'
        }`}
      >
        {/* Firebase Cloud Sync Header */}
        <CloudSyncHeader />

        {/* Top 5-Segment Five Elements Navigation */}
        <TopNav activeTab={activeTab} onSelectTab={(key) => setActiveTab(key)} />

        {/* Dynamic Tab Body View */}
        <main className="flex-1 pb-28 pt-2">
          {activeTab === 'earth' && (
            <SpaceTab
              onSelectTab={(key) => setActiveTab(key)}
              timeRecord={elementTimes}
              onFastUnlockAll={handleFastUnlockAll}
              onResetTime={handleResetElementTimes}
            />
          )}

          {activeTab === 'wood' && (
            <ChatTab
              onSelectTab={(key) => setActiveTab(key)}
              currentTrack={currentTrack}
              tracks={tracks}
              onPlayRecommendedMusic={() => {
                const oceanTrack = tracks.find((t) => t.id === 'track-2') || tracks[0];
                handleSelectTrack(oceanTrack);
              }}
              onSaveGeneratedStory={(newStory) => {
                setReadingStory(newStory);
              }}
            />
          )}

          {activeTab === 'fire' && (
            <MusicTab
              tracks={tracks}
              onAddTrack={handleAddTrack}
              onRemoveTrack={handleRemoveTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onSelectTrack={handleSelectTrack}
              onNextTrack={handleNextTrack}
              onPrevTrack={handlePrevTrack}
              onUpdateTrackTitle={handleUpdateTrackTitle}
              onUpdateTrackNotes={handleUpdateTrackNotes}
              onUpdateTrackProgress={handleUpdateTrackProgress}
            />
          )}

          {activeTab === 'metal' && (
            <StoryTab
              stories={stories}
              onOpenStory={(story) => setReadingStory(story)}
            />
          )}

          {activeTab === 'water' && (
            <VideoTab videos={INITIAL_VIDEOS} />
          )}

          {/* Living Spiritual Avatar & Scene Indicator (Present in bottom area of all tabs) */}
          <SpiritualAvatar
            avatar={currentAvatar}
            scene={currentScene}
            onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
            onOpenSceneModal={() => setIsSceneModalOpen(true)}
            onOpenChat={() => setActiveTab('wood')}
          />
        </main>

        {/* Bottom Floating Action Bar: ✦ 形象 | 💬 对话 */}
        <BottomBar
          onOpenAvatar={() => setIsAvatarModalOpen(true)}
          onOpenChat={() => setActiveTab('wood')}
          isChatActive={activeTab === 'wood'}
        />
      </div>

      {/* Story Fullscreen Reading Modal */}
      {readingStory && (
        <StoryReaderModal
          story={readingStory}
          onClose={() => setReadingStory(null)}
        />
      )}

      {/* Avatar Form Switcher Modal */}
      {isAvatarModalOpen && (
        <AvatarModal
          currentAvatar={currentAvatar}
          onSelectAvatar={(avatar) => {
            setCurrentAvatar(avatar);
            setIsAvatarModalOpen(false);
          }}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}

      {/* Scene Atmosphere Switcher Modal */}
      {isSceneModalOpen && (
        <ScenePickerModal
          currentScene={currentScene}
          onSelectScene={(scene) => {
            setCurrentScene(scene);
            setIsSceneModalOpen(false);
          }}
          onClose={() => setIsSceneModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <SpaceApp />
    </FirebaseProvider>
  );
}
