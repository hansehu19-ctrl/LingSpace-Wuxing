/**
 * Field Background Music Engine for Lingban Space:
 * Jules Massenet - 《泰伊斯冥想曲》(Thaïs: Méditation) Pure Instrumental Solo Violin & Harp
 *
 * Requirements:
 * - Pure acoustic violin & harp instrumental (zero human vocal/singing)
 * - Default volume 22% (0.22) as subtle ambient spiritual field BGM
 * - Plays automatically on 'earth' (灵性空间首页)
 * - Smooth fade out on 'wood' (日常交互), 'metal' (哲理故事), 'water' (影像载忆)
 * - Complete cutoff on 'fire' (乐律心声) to yield to music player
 * - Smooth fade in back to 22% when returning to 'earth'
 * - User controllable with dedicated top-right 【场域音】 switch
 */

import { TabKey } from '../types';

// Note frequencies in Hz for Thaïs Méditation in D Major
const NOTE_FREQS: Record<string, number> = {
  'D3': 146.83, 'F#3': 185.00, 'A3': 220.00, 'B3': 246.94, 'C#4': 277.18,
  'D4': 293.66, 'E4': 329.63, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C#5': 554.37, 'D5': 587.33, 'E5': 659.25, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00,
  'B5': 987.77, 'C#6': 1108.73, 'D6': 1174.66,
  'REST': 0
};

// Jules Massenet - Thaïs: Méditation expressive violin melody sequence
// [note, durationInSeconds]
const THAIS_VIOLIN_MELODY: Array<[string, number]> = [
  // Measure 1 - 4: Devotional exposition
  ['D5', 2.8],
  ['E5', 0.9],
  ['F#5', 0.9],
  ['A5', 2.2],
  ['G5', 0.8],
  ['F#5', 1.0],
  ['E5', 1.6],
  ['D5', 2.6],
  ['C#5', 1.2],
  ['D5', 0.8],
  ['E5', 1.0],
  ['F#5', 2.4],
  ['E5', 1.0],
  ['D5', 1.8],

  // Measure 5 - 8: Emotional yearning & ascent
  ['B4', 1.4],
  ['A4', 1.2],
  ['F#4', 1.2],
  ['G4', 1.2],
  ['A4', 2.6],
  ['D5', 1.6],
  ['F#5', 1.6],
  ['A5', 2.4],
  ['D6', 3.2], // High soaring spiritual peak
  ['C#6', 1.2],
  ['B5', 1.4],
  ['A5', 2.2],
  ['F#5', 1.6],
  ['G5', 1.2],
  ['E5', 2.0],

  // Measure 9 - 12: Gentle contemplative descent & resolution
  ['D5', 2.8],
  ['C#5', 1.4],
  ['B4', 1.4],
  ['A4', 2.2],
  ['G4', 1.2],
  ['F#4', 1.8],
  ['E4', 2.0],
  ['D4', 3.6], // Long peaceful resting note

  // Peaceful breath pause before loop
  ['REST', 1.8],
];

// Ethereal broken harp chords (D major, G major, A7, Bm)
const HARP_CHORDS = [
  ['D3', 'F#3', 'A3', 'D4'],
  ['G3', 'B3', 'D4', 'G4'],
  ['A3', 'C#4', 'E4', 'A4'],
  ['D3', 'F#3', 'A3', 'D4'],
  ['B3', 'D4', 'F#4', 'B4'],
  ['G3', 'B3', 'D4', 'G4'],
  ['A3', 'C#4', 'E4', 'G4'],
  ['D3', 'F#3', 'A3', 'D4'],
];

class FieldBgmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private violinGain: GainNode | null = null;
  private harpGain: GainNode | null = null;
  private padGain: GainNode | null = null;

  // Active state
  private isEnabled: boolean = true;
  private isPlaying: boolean = false;
  private currentTab: TabKey = 'earth';
  private targetVolume: number = 0.22; // 22% as specified

  // Timers and active nodes
  private melodyTimer: NodeJS.Timeout | null = null;
  private harpTimer: NodeJS.Timeout | null = null;
  private activeNodes: Array<AudioNode> = [];

  // Listeners
  private listeners: Set<(isEnabled: boolean, isPlaying: boolean) => void> = new Set();

  constructor() {
    // Read persisted preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lingban_field_bgm_enabled');
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    }
  }

  private async getOrCreateContext(): Promise<AudioContext | null> {
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      if (!this.masterGain && this.ctx) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Sub gains
        this.violinGain = this.ctx.createGain();
        this.violinGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.violinGain.connect(this.masterGain);

        this.harpGain = this.ctx.createGain();
        this.harpGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.harpGain.connect(this.masterGain);

        this.padGain = this.ctx.createGain();
        this.padGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        this.padGain.connect(this.masterGain);
      }

      return this.ctx;
    } catch (e) {
      console.warn('FieldBgmEngine init error:', e);
      return null;
    }
  }

  /**
   * Starts playback of Thaïs Méditation solo violin & harp
   */
  async start() {
    if (!this.isEnabled) return;
    const ctx = await this.getOrCreateContext();
    if (!ctx || !this.masterGain) return;

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Start background orchestral string pad drone (D2 & A2)
    this.startPadDrone();

    // Start violin melody sequencer
    this.startViolinMelody();

    // Start rolling harp arpeggios
    this.startHarpArpeggios();

    // Smooth fade in to 22% (0.22)
    this.fadeIn(this.targetVolume, 1.8);
    this.notify();
  }

  /**
   * Procedural Violin synthesis for a single expressive lyrical note
   */
  private playViolinNote(freq: number, duration: number) {
    if (!this.ctx || !this.violinGain || freq === 0 || !this.isPlaying) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 1. Dual oscillator for rich bowed string timbre (Sawtooth body + Triangle warm core)
    const oscSaw = ctx.createOscillator();
    const oscTri = ctx.createOscillator();
    oscSaw.type = 'sawtooth';
    oscTri.type = 'triangle';

    // 2. Violin vibrato LFO (5.3 Hz with delayed depth for singing expressive vibrato)
    const vibrato = ctx.createOscillator();
    vibrato.frequency.setValueAtTime(5.3, now);
    const vibratoGain = ctx.createGain();
    // Vibrato swells gently after bow contacts string
    vibratoGain.gain.setValueAtTime(0.2, now);
    vibratoGain.gain.linearRampToValueAtTime(Math.min(3.5, freq * 0.007), now + 0.35);

    vibrato.connect(vibratoGain);
    vibratoGain.connect(oscSaw.frequency);
    vibratoGain.connect(oscTri.frequency);

    oscSaw.frequency.setValueAtTime(freq, now);
    oscTri.frequency.setValueAtTime(freq, now);

    // 3. Acoustic body resonance filter (Wooden acoustic violin body simulation)
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.setValueAtTime(Math.min(3200, freq * 2.2), now);
    bodyFilter.Q.setValueAtTime(2.2, now);

    // Highpass to eliminate muddy sub rumble
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(180, now);

    // 4. Bowing envelope (gentle attack, sustained devotional tone, soft bow release)
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    const attack = Math.min(0.22, duration * 0.18);
    const release = Math.min(0.35, duration * 0.22);
    const sustainTime = Math.max(0.05, duration - attack - release);

    noteGain.gain.linearRampToValueAtTime(0.28, now + attack);
    noteGain.gain.setValueAtTime(0.28, now + attack + sustainTime);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.15);

    // Routing
    oscSaw.connect(bodyFilter);
    oscTri.connect(bodyFilter);
    bodyFilter.connect(highpass);
    highpass.connect(noteGain);
    noteGain.connect(this.violinGain);

    oscSaw.start(now);
    oscTri.start(now);
    vibrato.start(now);

    const stopTime = now + duration + 0.2;
    oscSaw.stop(stopTime);
    oscTri.stop(stopTime);
    vibrato.stop(stopTime);

    this.activeNodes.push(oscSaw, oscTri, vibrato, noteGain, bodyFilter, highpass);
  }

  /**
   * Loops through Thaïs Méditation melody notes seamlessly
   */
  private startViolinMelody() {
    let noteIdx = 0;

    const playNext = () => {
      if (!this.isPlaying) return;

      const [noteName, duration] = THAIS_VIOLIN_MELODY[noteIdx];
      const freq = NOTE_FREQS[noteName] || 0;

      if (freq > 0) {
        this.playViolinNote(freq, duration);
      }

      noteIdx = (noteIdx + 1) % THAIS_VIOLIN_MELODY.length;
      this.melodyTimer = setTimeout(playNext, duration * 1000);
    };

    playNext();
  }

  /**
   * Rolling delicate harp arpeggios
   */
  private startHarpArpeggios() {
    let chordIdx = 0;

    const playHarpChord = () => {
      if (!this.isPlaying || !this.ctx || !this.harpGain) return;

      const chord = HARP_CHORDS[chordIdx];
      chord.forEach((noteName, i) => {
        const freq = NOTE_FREQS[noteName];
        if (!freq) return;

        const delay = i * 0.12;
        setTimeout(() => {
          if (!this.isPlaying || !this.ctx || !this.harpGain) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

          osc.connect(gain);
          gain.connect(this.harpGain);

          osc.start(now);
          osc.stop(now + 2.3);
          this.activeNodes.push(osc, gain);
        }, delay * 1000);
      });

      chordIdx = (chordIdx + 1) % HARP_CHORDS.length;
      this.harpTimer = setTimeout(playHarpChord, 3800);
    };

    playHarpChord();
  }

  /**
   * Warm low string pedal tone (D2 & A2)
   */
  private startPadDrone() {
    if (!this.ctx || !this.padGain) return;
    const now = this.ctx.currentTime;

    const d2 = this.ctx.createOscillator();
    const a2 = this.ctx.createOscillator();
    const lowFilter = this.ctx.createBiquadFilter();

    d2.type = 'sine';
    a2.type = 'sine';
    d2.frequency.setValueAtTime(73.42, now); // D2
    a2.frequency.setValueAtTime(110.00, now); // A2

    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(160, now);

    d2.connect(lowFilter);
    a2.connect(lowFilter);
    lowFilter.connect(this.padGain);

    d2.start(now);
    a2.start(now);
    this.activeNodes.push(d2, a2, lowFilter);
  }

  /**
   * Smooth volume fade in
   */
  fadeIn(targetVol: number = 0.22, durationSec: number = 1.5) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    const current = Math.max(0.0001, this.masterGain.gain.value);
    this.masterGain.gain.setValueAtTime(current, now);
    this.masterGain.gain.linearRampToValueAtTime(targetVol, now + durationSec);
  }

  /**
   * Smooth volume fade out
   */
  fadeOut(durationSec: number = 1.2, stopAfter: boolean = false) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    const current = Math.max(0.0001, this.masterGain.gain.value);
    this.masterGain.gain.setValueAtTime(current, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    if (stopAfter) {
      setTimeout(() => {
        this.stopNodes();
        this.isPlaying = false;
        this.notify();
      }, durationSec * 1000 + 50);
    }
  }

  /**
   * Completely stops playback
   */
  stop() {
    this.stopNodes();
    this.isPlaying = false;
    this.notify();
  }

  private stopNodes() {
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
    if (this.harpTimer) {
      clearTimeout(this.harpTimer);
      this.harpTimer = null;
    }

    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
  }

  /**
   * Handles tab switching according to requirements:
   * - 'earth': restore/fade in Thaïs Méditation pure violin BGM
   * - 'wood', 'metal', 'water': smooth fade out (quiet reading/conversation/video)
   * - 'fire': complete stop to let MusicTab have full audio control
   */
  handleTabChange(newTab: TabKey) {
    this.currentTab = newTab;

    if (newTab === 'earth') {
      if (this.isEnabled) {
        if (!this.isPlaying) {
          this.start();
        } else {
          this.fadeIn(this.targetVolume, 1.5);
        }
      }
    } else if (newTab === 'fire') {
      // Complete cutoff immediately when entering Music Tab
      this.fadeOut(0.3, true);
    } else {
      // Wood, Metal, Water: gentle fade out so user can read/talk quietly
      this.fadeOut(1.2, true);
    }
  }

  /**
   * User toggles the field BGM switch in top-right UI
   */
  toggleEnabled(): boolean {
    const next = !this.isEnabled;
    this.isEnabled = next;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lingban_field_bgm_enabled', next ? 'true' : 'false');
    }

    if (next) {
      if (this.currentTab === 'earth') {
        this.start();
      }
    } else {
      this.fadeOut(0.8, true);
    }

    this.notify();
    return this.isEnabled;
  }

  /**
   * Unlock AudioContext if browser held it in suspended state prior to first click
   */
  async resumeIfBlocked() {
    if (this.isEnabled && this.currentTab === 'earth') {
      if (!this.isPlaying || (this.ctx && this.ctx.state === 'suspended')) {
        await this.start();
      }
    }
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  subscribe(listener: (isEnabled: boolean, isPlaying: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isEnabled, this.isPlaying));
  }
}

export const fieldBgmEngine = new FieldBgmEngine();
