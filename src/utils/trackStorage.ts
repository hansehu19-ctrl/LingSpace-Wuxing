/**
 * IndexedDB persistence for user uploaded audio tracks and lyrics.
 * Ensures uploaded songs are permanently memorized and available across refreshes.
 * Hardened against connection closure and browser lifecycle events.
 */
import { AudioTrack } from '../types';

const DB_NAME = 'LingbanAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_audio_tracks';

interface StoredTrackRecord {
  id: string;
  title: string;
  artist: string;
  duration: number;
  fileSize: string;
  category: string;
  synthPreset?: string;
  lyrics?: string[];
  notes?: string;
  lastPlayedProgress?: number;
  audioBlob?: Blob;
  createdAt: number;
}

class TrackStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          db.onclose = () => {
            this.dbPromise = null;
          };
          db.onversionchange = () => {
            try {
              db.close();
            } catch {}
            this.dbPromise = null;
          };
          resolve(db);
        };

        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error);
        };
      } catch (err) {
        this.dbPromise = null;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  private async getFreshDB(): Promise<IDBDatabase> {
    try {
      return await this.openDB();
    } catch {
      this.dbPromise = null;
      return await this.openDB();
    }
  }

  async saveTrack(track: AudioTrack, audioBlob?: Blob): Promise<AudioTrack> {
    let attempt = 0;
    while (attempt < 2) {
      attempt++;
      try {
        const db = await this.getFreshDB();
        let blobToSave = audioBlob;
        if (!blobToSave) {
          const existingRec = await this.getRecord(track.id);
          if (existingRec && existingRec.audioBlob) {
            blobToSave = existingRec.audioBlob;
          }
        }

        const record: StoredTrackRecord = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          fileSize: track.fileSize || '未知大小',
          category: track.category || '本地上传',
          synthPreset: track.synthPreset,
          lyrics: track.lyrics,
          notes: track.notes,
          lastPlayedProgress: track.lastPlayedProgress,
          audioBlob: blobToSave,
          createdAt: Date.now(),
        };

        return await new Promise<AudioTrack>((resolve) => {
          try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(record);

            tx.oncomplete = () => {
              if (blobToSave) {
                track.fileUrl = URL.createObjectURL(blobToSave);
              }
              resolve(track);
            };

            tx.onerror = () => {
              resolve(track);
            };
          } catch (txErr: any) {
            if (String(txErr).includes('closing') || String(txErr).includes('closed')) {
              this.dbPromise = null;
              throw txErr;
            }
            resolve(track);
          }
        });
      } catch (e: any) {
        this.dbPromise = null;
        if (attempt >= 2) {
          console.warn('TrackStorage save error:', e);
          return track;
        }
      }
    }
    return track;
  }

  async getRecord(id: string): Promise<StoredTrackRecord | null> {
    let attempt = 0;
    while (attempt < 2) {
      attempt++;
      try {
        const db = await this.getFreshDB();
        return await new Promise((resolve) => {
          try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          } catch (txErr: any) {
            if (String(txErr).includes('closing') || String(txErr).includes('closed')) {
              this.dbPromise = null;
              throw txErr;
            }
            resolve(null);
          }
        });
      } catch {
        this.dbPromise = null;
        if (attempt >= 2) return null;
      }
    }
    return null;
  }

  async getBlob(id: string): Promise<Blob | undefined> {
    const rec = await this.getRecord(id);
    return rec?.audioBlob;
  }

  async getSavedTracks(): Promise<AudioTrack[]> {
    let attempt = 0;
    while (attempt < 2) {
      attempt++;
      try {
        const db = await this.getFreshDB();
        return await new Promise((resolve) => {
          try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
              const records: StoredTrackRecord[] = request.result || [];
              records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

              const tracks: AudioTrack[] = records.map((rec) => {
                let url = '';
                if (rec.audioBlob) {
                  url = URL.createObjectURL(rec.audioBlob);
                }
                return {
                  id: rec.id,
                  title: rec.title,
                  artist: rec.artist,
                  duration: rec.duration,
                  fileSize: rec.fileSize,
                  category: rec.category,
                  synthPreset: rec.synthPreset as any,
                  lyrics: rec.lyrics,
                  notes: rec.notes,
                  lastPlayedProgress: rec.lastPlayedProgress,
                  fileUrl: url,
                };
              });

              resolve(tracks);
            };

            request.onerror = () => {
              resolve([]);
            };
          } catch (txErr: any) {
            if (String(txErr).includes('closing') || String(txErr).includes('closed')) {
              this.dbPromise = null;
              throw txErr;
            }
            resolve([]);
          }
        });
      } catch (e) {
        this.dbPromise = null;
        if (attempt >= 2) {
          console.warn('TrackStorage load error:', e);
          return [];
        }
      }
    }
    return [];
  }

  async deleteTrack(id: string): Promise<void> {
    let attempt = 0;
    while (attempt < 2) {
      attempt++;
      try {
        const db = await this.getFreshDB();
        return await new Promise((resolve) => {
          try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          } catch (txErr: any) {
            if (String(txErr).includes('closing') || String(txErr).includes('closed')) {
              this.dbPromise = null;
              throw txErr;
            }
            resolve();
          }
        });
      } catch {
        this.dbPromise = null;
        if (attempt >= 2) return;
      }
    }
  }
}

export const trackStorage = new TrackStorage();
