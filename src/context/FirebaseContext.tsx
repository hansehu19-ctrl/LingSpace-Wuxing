import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  testConnection,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { ChatMessage, StoryItem, AvatarForm, SceneSetting, AudioTrack, UserStory, CrossIndexMatrix } from '../types';

interface FirebaseContextType {
  user: User | null;
  authLoading: boolean;
  isConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  saveUserProfile: (avatar: AvatarForm, scene: SceneSetting) => Promise<void>;
  syncChatMessage: (msg: { sender: 'user' | 'ai'; text: string }) => Promise<void>;
  cloudMessages: ChatMessage[];
  cloudBookmarks: string[];
  toggleBookmarkCloud: (story: StoryItem) => Promise<boolean>;
  cloudTracks: AudioTrack[];
  saveTrackToFirestore: (track: AudioTrack) => Promise<void>;
  updateTrackProgressInFirestore: (track: AudioTrack, progress: number) => Promise<void>;
  updateTrackNotesInFirestore: (track: AudioTrack, notes: string) => Promise<void>;
  updateTrackTitleInFirestore: (track: AudioTrack, title: string) => Promise<void>;
  deleteTrackFromFirestore: (trackId: string) => Promise<void>;
  cloudStories: UserStory[];
  saveGeneratedStoryToFirestore: (story: {
    storyId: string;
    title: string;
    summary: string;
    themeMoral: string;
    content: string[];
    lyricsSource?: string;
    category?: string;
  }) => Promise<boolean>;
  cloudMatrices: CrossIndexMatrix[];
  saveMatrixToFirestore: (matrix: CrossIndexMatrix) => Promise<boolean>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [cloudMessages, setCloudMessages] = useState<ChatMessage[]>([]);
  const [cloudBookmarks, setCloudBookmarks] = useState<string[]>([]);
  const [cloudTracks, setCloudTracks] = useState<AudioTrack[]>([]);
  const [cloudStories, setCloudStories] = useState<UserStory[]>([]);
  const [cloudMatrices, setCloudMatrices] = useState<CrossIndexMatrix[]>([]);

  useEffect(() => {
    testConnection().then((connected) => {
      setIsConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to cloud tracks when user is signed in
  useEffect(() => {
    if (!user) {
      setCloudTracks([]);
      return;
    }

    const tracksPath = `users/${user.uid}/tracks`;
    const tracksCol = collection(db, 'users', user.uid, 'tracks');

    const unsub = onSnapshot(
      tracksCol,
      (snapshot) => {
        const trs: AudioTrack[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          trs.push({
            id: docSnap.id,
            title: data.title || '未命名曲目',
            artist: data.artist || '未知艺术家',
            duration: typeof data.duration === 'number' ? data.duration : 240,
            fileSize: data.fileSize || '',
            category: data.category || '本地上传',
            synthPreset: (data.synthPreset || 'custom') as any,
            lyrics: Array.isArray(data.lyrics) ? data.lyrics : undefined,
            notes: data.notes || '',
            lastPlayedProgress: typeof data.lastPlayedProgress === 'number' ? data.lastPlayedProgress : 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        trs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setCloudTracks(trs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tracksPath);
      }
    );

    return () => unsub();
  }, [user]);

  // Listen to cloud messages when user is signed in
  useEffect(() => {
    if (!user) {
      setCloudMessages([]);
      return;
    }

    const messagesPath = `users/${user.uid}/messages`;
    const messagesCol = collection(db, 'users', user.uid, 'messages');

    const unsub = onSnapshot(
      messagesCol,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          msgs.push({
            id: docSnap.id,
            sender: data.sender as 'user' | 'ai',
            text: data.text,
            timestamp: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '刚刚',
          });
        });
        // Sort chronologically
        msgs.sort((a, b) => a.id.localeCompare(b.id));
        setCloudMessages(msgs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, messagesPath);
      }
    );

    return () => unsub();
  }, [user]);

  // Listen to bookmarks when user is signed in
  useEffect(() => {
    if (!user) {
      setCloudBookmarks([]);
      return;
    }

    const bookmarksPath = `users/${user.uid}/bookmarks`;
    const bookmarksCol = collection(db, 'users', user.uid, 'bookmarks');

    const unsub = onSnapshot(
      bookmarksCol,
      (snapshot) => {
        const bms: string[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          bms.push(data.storyId);
        });
        setCloudBookmarks(bms);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, bookmarksPath);
      }
    );

    return () => unsub();
  }, [user]);

  // Listen to generated stories in Firestore when user is signed in
  useEffect(() => {
    if (!user) {
      setCloudStories([]);
      return;
    }

    const storiesPath = `users/${user.uid}/stories`;
    const storiesCol = collection(db, 'users', user.uid, 'stories');

    const unsub = onSnapshot(
      storiesCol,
      (snapshot) => {
        const sts: UserStory[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          sts.push({
            id: docSnap.id,
            storyId: data.storyId || docSnap.id,
            userId: data.userId || user.uid,
            title: data.title || '歌词感悟小故事',
            summary: data.summary || '',
            themeMoral: data.themeMoral || '',
            lyricsSource: data.lyricsSource || '',
            category: data.category || '歌词哲思感悟',
            content: Array.isArray(data.content) ? data.content : [],
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt,
          });
        });
        sts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setCloudStories(sts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, storiesPath);
      }
    );

    return () => unsub();
  }, [user]);

  // Listen to cross-index matrices when user is signed in
  useEffect(() => {
    if (!user) {
      setCloudMatrices([]);
      return;
    }

    const matricesPath = `users/${user.uid}/matrices`;
    const matricesCol = collection(db, 'users', user.uid, 'matrices');

    const unsub = onSnapshot(
      matricesCol,
      (snapshot) => {
        const mats: CrossIndexMatrix[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          mats.push({
            id: docSnap.id,
            matrixId: data.matrixId || docSnap.id,
            userId: data.userId || user.uid,
            combinationType: data.combinationType || '三者全组合',
            theme: data.theme || '意境同源',
            musicModule: data.musicSummary
              ? {
                  summary: data.musicSummary,
                  googleMusicIndex: data.googleMusicIndex || '',
                }
              : undefined,
            storyModule: data.storySummary
              ? {
                  summary: data.storySummary,
                  googleBooksIndex: data.googleBooksIndex || '',
                }
              : undefined,
            videoModule: data.videoSummary
              ? {
                  summary: data.videoSummary,
                  youtubeIndex: data.youtubeIndex || '',
                }
              : undefined,
            coherenceCheck: data.coherenceCheck || '确认三者意境同源匹配',
            createdAt: data.createdAt || '',
          });
        });
        mats.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setCloudMatrices(mats);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, matricesPath);
      }
    );

    return () => unsub();
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const saveUserProfile = useCallback(async (avatar: AvatarForm, scene: SceneSetting) => {
    if (!user || !auth.currentUser || auth.currentUser.uid !== user.uid) return;
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const existingSnap = await getDoc(userRef);
      const now = new Date().toISOString();
      const existingData = existingSnap.exists() ? existingSnap.data() : null;

      const payload: Record<string, any> = {
        uid: user.uid,
        displayName: (user.displayName || '行者').slice(0, 64),
        email: (user.email || '').slice(0, 128),
        avatarFormId: (avatar.id || 'mecha-cat').slice(0, 32),
        sceneId: (scene.id || 'star-observatory').slice(0, 32),
        createdAt: existingData?.createdAt || now,
        updatedAt: now,
      };

      await setDoc(userRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const syncChatMessage = async (msg: { sender: 'user' | 'ai'; text: string }) => {
    if (!user) return;
    const path = `users/${user.uid}/messages`;
    try {
      const messagesCol = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesCol, {
        userId: user.uid,
        sender: msg.sender,
        text: msg.text,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleBookmarkCloud = async (story: StoryItem): Promise<boolean> => {
    if (!user) return false;
    const path = `users/${user.uid}/bookmarks/${story.id}`;
    const docRef = doc(db, 'users', user.uid, 'bookmarks', story.id);

    try {
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        await deleteDoc(docRef);
        return false;
      } else {
        await setDoc(docRef, {
          userId: user.uid,
          storyId: story.id,
          title: story.title,
          category: story.category,
          createdAt: new Date().toISOString(),
        });
        return true;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  };

  const saveTrackToFirestore = async (track: AudioTrack) => {
    if (!user) return;
    const path = `users/${user.uid}/tracks/${track.id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'tracks', track.id);
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        userId: user.uid,
        title: track.title.slice(0, 120),
        artist: track.artist.slice(0, 80),
        notes: (track.notes || '').slice(0, 500),
        lastPlayedProgress: Math.max(0, Math.min(86400, Math.floor(track.lastPlayedProgress || 0))),
        duration: Math.max(0, Math.min(86400, Math.floor(track.duration || 0))),
        category: (track.category || '本地上传').slice(0, 40),
        fileSize: (track.fileSize || '').slice(0, 20),
        synthPreset: (track.synthPreset || 'custom').slice(0, 32),
        createdAt: track.createdAt || now,
        updatedAt: now,
      };
      if (track.lyrics && Array.isArray(track.lyrics) && track.lyrics.length > 0) {
        payload.lyrics = track.lyrics.slice(0, 200).map((l) => String(l).slice(0, 200));
      }
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateTrackProgressInFirestore = async (track: AudioTrack, progress: number) => {
    if (!user) return;
    const path = `users/${user.uid}/tracks/${track.id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'tracks', track.id);
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        userId: user.uid,
        title: (track.title || '未命名').slice(0, 120),
        artist: (track.artist || '未知艺术家').slice(0, 80),
        notes: (track.notes || '').slice(0, 500),
        lastPlayedProgress: Math.max(0, Math.min(86400, Math.floor(progress))),
        duration: Math.max(0, Math.min(86400, Math.floor(track.duration || 0))),
        category: (track.category || '本地上传').slice(0, 40),
        fileSize: (track.fileSize || '').slice(0, 20),
        synthPreset: (track.synthPreset || 'custom').slice(0, 32),
        updatedAt: now,
      };
      if (track.createdAt) {
        payload.createdAt = track.createdAt;
      }
      if (track.lyrics && Array.isArray(track.lyrics) && track.lyrics.length > 0) {
        payload.lyrics = track.lyrics.slice(0, 200).map((l) => String(l).slice(0, 200));
      }
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateTrackNotesInFirestore = async (track: AudioTrack, notes: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tracks/${track.id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'tracks', track.id);
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        userId: user.uid,
        title: (track.title || '未命名').slice(0, 120),
        artist: (track.artist || '未知艺术家').slice(0, 80),
        notes: notes.slice(0, 500),
        lastPlayedProgress: Math.max(0, Math.min(86400, Math.floor(track.lastPlayedProgress || 0))),
        duration: Math.max(0, Math.min(86400, Math.floor(track.duration || 0))),
        category: (track.category || '本地上传').slice(0, 40),
        fileSize: (track.fileSize || '').slice(0, 20),
        synthPreset: (track.synthPreset || 'custom').slice(0, 32),
        updatedAt: now,
      };
      if (track.createdAt) {
        payload.createdAt = track.createdAt;
      }
      if (track.lyrics && Array.isArray(track.lyrics) && track.lyrics.length > 0) {
        payload.lyrics = track.lyrics.slice(0, 200).map((l) => String(l).slice(0, 200));
      }
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateTrackTitleInFirestore = async (track: AudioTrack, newTitle: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tracks/${track.id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'tracks', track.id);
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        userId: user.uid,
        title: (newTitle || '我的音频').slice(0, 120),
        artist: (track.artist || '我的音频').slice(0, 80),
        notes: (track.notes || '').slice(0, 500),
        lastPlayedProgress: Math.max(0, Math.min(86400, Math.floor(track.lastPlayedProgress || 0))),
        duration: Math.max(0, Math.min(86400, Math.floor(track.duration || 0))),
        category: (track.category || '本地上传').slice(0, 40),
        fileSize: (track.fileSize || '').slice(0, 20),
        synthPreset: (track.synthPreset || 'custom').slice(0, 32),
        updatedAt: now,
      };
      if (track.createdAt) {
        payload.createdAt = track.createdAt;
      }
      if (track.lyrics && Array.isArray(track.lyrics) && track.lyrics.length > 0) {
        payload.lyrics = track.lyrics.slice(0, 200).map((l) => String(l).slice(0, 200));
      }
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTrackFromFirestore = async (trackId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tracks/${trackId}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'tracks', trackId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const saveGeneratedStoryToFirestore = async (story: {
    storyId: string;
    title: string;
    summary: string;
    themeMoral: string;
    content: string[];
    lyricsSource?: string;
    category?: string;
  }): Promise<boolean> => {
    if (!user) return false;
    const path = `users/${user.uid}/stories/${story.storyId}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'stories', story.storyId);
      const now = new Date().toISOString();
      await setDoc(docRef, {
        userId: user.uid,
        storyId: story.storyId,
        title: (story.title || '心灵感悟故事').slice(0, 120),
        summary: (story.summary || '').slice(0, 300),
        themeMoral: (story.themeMoral || '').slice(0, 300),
        content: (story.content || []).slice(0, 20),
        lyricsSource: (story.lyricsSource || '用户歌词感悟').slice(0, 200),
        category: (story.category || '歌词哲思感悟').slice(0, 60),
        createdAt: now,
        updatedAt: now,
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  };

  const saveMatrixToFirestore = async (matrix: CrossIndexMatrix): Promise<boolean> => {
    if (!user) return false;
    const matrixId = matrix.matrixId || matrix.id || `matrix-${Date.now()}`;
    const path = `users/${user.uid}/matrices/${matrixId}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'matrices', matrixId);
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        userId: user.uid,
        matrixId,
        combinationType: (matrix.combinationType || '三者全组合').slice(0, 32),
        theme: (matrix.theme || '灵境同源').slice(0, 160),
        coherenceCheck: (matrix.coherenceCheck || '确认三者意境同源匹配').slice(0, 400),
        createdAt: matrix.createdAt || now,
      };

      if (matrix.musicModule) {
        payload.musicSummary = (matrix.musicModule.summary || '').slice(0, 400);
        payload.googleMusicIndex = (matrix.musicModule.googleMusicIndex || '').slice(0, 240);
      }
      if (matrix.storyModule) {
        payload.storySummary = (matrix.storyModule.summary || '').slice(0, 400);
        payload.googleBooksIndex = (matrix.storyModule.googleBooksIndex || '').slice(0, 240);
      }
      if (matrix.videoModule) {
        payload.videoSummary = (matrix.videoModule.summary || '').slice(0, 400);
        payload.youtubeIndex = (matrix.videoModule.youtubeIndex || '').slice(0, 240);
      }

      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authLoading,
        isConnected,
        signInWithGoogle,
        signOutUser,
        saveUserProfile,
        syncChatMessage,
        cloudMessages,
        cloudBookmarks,
        toggleBookmarkCloud,
        cloudTracks,
        saveTrackToFirestore,
        updateTrackProgressInFirestore,
        updateTrackNotesInFirestore,
        updateTrackTitleInFirestore,
        deleteTrackFromFirestore,
        cloudStories,
        saveGeneratedStoryToFirestore,
        cloudMatrices,
        saveMatrixToFirestore,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
