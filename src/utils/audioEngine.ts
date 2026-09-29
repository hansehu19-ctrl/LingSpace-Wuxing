/**
 * Robust Ethereal Audio Engine for Lingban Space:
 * - Persistent Web Audio Context with Analyser for Spectrum & Waveform Visualization
 * - Single-attachment persistent HTMLAudioElement for zero-leak, zero-crash audio file playback
 * - Pause / Resume / Seek support for both uploaded audio files and procedural synths
 * - Unified time synchronization for vertical scrolling lyrics
 * - Tab-switching and visualizer-switching resilience (music never cuts out unexpectedly)
 */

type SynthPreset = 'ocean' | 'stars' | 'flute' | 'lullaby' | 'custom';
type AudioMode = 'none' | 'audioFile' | 'synth';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;

  // Persistent HTMLAudioElement and its source node (bound once)
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  // Active Playback State
  private currentMode: AudioMode = 'none';
  private isPlayingState: boolean = false;
  private isPausedState: boolean = false;
  private currentPreset: SynthPreset | null = null;
  private currentTrackUrl: string | null = null;
  private masterVolume: number = 0.7;

  // Procedural Synth State & Time Tracking
  private synthGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private noiseNode: AudioNode | null = null;
  private sequencerTimer: NodeJS.Timeout | null = null;
  private synthElapsedSeconds: number = 0;
  private synthTickerTimer: NodeJS.Timeout | null = null;

  // Callbacks
  private onEndCallback: (() => void) | null = null;
  private timeListeners: Set<(currentTime: number, duration: number) => void> = new Set();
  private stateListeners: Set<(isPlaying: boolean, isPaused: boolean) => void> = new Set();

  /**
   * Initializes AudioContext, MasterGain, AnalyserNode, and MediaElementSource
   * strictly once, ensuring stable audio routing without duplicate binding errors.
   */
  async initContext(): Promise<boolean> {
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

      // Create AnalyserNode if not yet created
      if (!this.analyser && this.ctx) {
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128; // 64 frequency bins
        this.analyser.smoothingTimeConstant = 0.85;

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

        // Routing: masterGain -> analyser -> destination
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }

      // Initialize persistent HTMLAudioElement
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.preload = 'auto';

        // Connect media element once to web audio graph
        if (this.ctx && this.masterGain) {
          try {
            this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
            this.audioSourceNode.connect(this.masterGain);
          } catch (e) {
            console.warn('AudioSourceNode already connected or fallback required:', e);
          }
        }

        // Attach audio element event listeners
        this.audioElement.onended = () => {
          this.isPlayingState = false;
          this.isPausedState = false;
          this.currentMode = 'none';
          this.notifyState();
          if (this.onEndCallback) {
            this.onEndCallback();
          }
        };

        this.audioElement.ontimeupdate = () => {
          if (this.currentMode === 'audioFile' && this.audioElement) {
            this.notifyTime(this.audioElement.currentTime, this.audioElement.duration || 0);
          }
        };

        this.audioElement.onerror = (e) => {
          console.warn('HTMLAudioElement error encountered:', e);
        };
      }

      return true;
    } catch (e) {
      console.warn('AudioEngine initContext error:', e);
      return false;
    }
  }

  // --- Real-time Visualizer Analysis APIs ---
  getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(64);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(128);
    }
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  // Soft tactile UI chime
  playChime(pitch: number = 528) {
    this.initContext().then(() => {
      try {
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(pitch * 1.4, this.ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.06 * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.95);
      } catch {}
    });
  }

  // --- Audio File Playback Pipeline ---
  async playAudioFile(fileUrl: string, volume?: number, onEnd?: () => void) {
    await this.initContext();
    this.stopSynth();

    if (volume !== undefined) {
      this.setVolume(volume);
    }

    this.onEndCallback = onEnd || null;
    this.currentTrackUrl = fileUrl;
    this.currentMode = 'audioFile';

    if (this.audioElement) {
      // Avoid resetting src if resuming same track
      if (this.audioElement.src !== fileUrl) {
        this.audioElement.src = fileUrl;
        this.audioElement.currentTime = 0;
      }

      this.audioElement.volume = this.masterVolume;
      try {
        await this.audioElement.play();
        this.isPlayingState = true;
        this.isPausedState = false;
        this.notifyState();
      } catch (err) {
        console.warn('Playback play() was prevented or cancelled:', err);
      }
    }
  }

  // --- Procedural Synth Playback Pipeline ---
  async startPreset(preset: SynthPreset = 'lullaby', volume?: number) {
    await this.initContext();
    this.stopAudioFile();

    if (volume !== undefined) {
      this.setVolume(volume);
    }

    this.currentPreset = preset;
    this.currentMode = 'synth';
    this.synthElapsedSeconds = 0;

    this.startSynthGraph(preset);
    this.isPlayingState = true;
    this.isPausedState = false;
    this.notifyState();
  }

  private startSynthGraph(preset: SynthPreset) {
    if (!this.ctx || !this.masterGain) return;

    this.stopSynthNodesOnly();

    const master = this.ctx.createGain();
    master.gain.setValueAtTime(0.35, this.ctx.currentTime);
    master.connect(this.masterGain);
    this.synthGain = master;

    if (preset === 'ocean') {
      this.setupOcean(master);
    } else if (preset === 'stars') {
      this.setupStars(master);
    } else if (preset === 'flute') {
      this.setupFlute(master);
    } else {
      this.setupLullaby(master);
    }

    // Start ticker for smooth procedural time tracking
    this.synthTickerTimer = setInterval(() => {
      if (this.isPlayingState && this.currentMode === 'synth') {
        this.synthElapsedSeconds += 0.5;
        this.notifyTime(this.synthElapsedSeconds, 279);
      }
    }, 500);
  }

  // --- Procedural Melodic Lullaby (乌兰托娅 warm folk chords + pentatonic harp bells) ---
  private setupLullaby(master: GainNode) {
    if (!this.ctx) return;

    const basePitches = [130.81, 196.0, 329.63];
    basePitches.forEach((p, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(p, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0.05 / (i + 1), this.ctx!.currentTime);

      osc.connect(gain);
      gain.connect(master);
      osc.start();
      this.activeOscillators.push(osc);
      this.activeGains.push(gain);
    });

    const pentatonicNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    let step = 0;

    const playMelodyNote = () => {
      if (!this.isPlayingState || this.currentMode !== 'synth' || !this.ctx || !this.synthGain) return;
      try {
        const noteIndex = Math.floor(Math.random() * pentatonicNotes.length);
        const pitch = pentatonicNotes[noteIndex];

        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        noteOsc.type = step % 3 === 0 ? 'sine' : 'triangle';
        noteOsc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(0.12, now + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        noteOsc.connect(noteGain);
        noteGain.connect(master);

        noteOsc.start(now);
        noteOsc.stop(now + 1.9);
        step++;
      } catch {}
    };

    playMelodyNote();
    this.sequencerTimer = setInterval(playMelodyNote, 1200);
  }

  // --- Ocean Wave pink noise swell + singing bowl ---
  private setupOcean(master: GainNode) {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(master);
    whiteNoise.start();
    lfo.start();
    this.noiseNode = whiteNoise;
    this.activeOscillators.push(lfo);

    this.sequencerTimer = setInterval(() => {
      if (!this.isPlayingState || this.currentMode !== 'synth' || !this.ctx) return;
      const bowlOsc = this.ctx.createOscillator();
      const bowlGain = this.ctx.createGain();
      bowlOsc.type = 'sine';
      bowlOsc.frequency.setValueAtTime(432.0, this.ctx.currentTime);
      const now = this.ctx.currentTime;
      bowlGain.gain.setValueAtTime(0.0001, now);
      bowlGain.gain.linearRampToValueAtTime(0.09, now + 0.15);
      bowlGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
      bowlOsc.connect(bowlGain);
      bowlGain.connect(master);
      bowlOsc.start(now);
      bowlOsc.stop(now + 3.6);
    }, 4500);
  }

  // --- Stars Astral constellar shimmer ---
  private setupStars(master: GainNode) {
    if (!this.ctx) return;
    const pentatonic = [185.0, 220.0, 277.18, 329.63, 440.0, 554.37, 659.25];
    pentatonic.slice(0, 4).forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0.05 / (idx + 1), this.ctx!.currentTime);

      osc.connect(gain);
      gain.connect(master);
      osc.start();
      this.activeOscillators.push(osc);
    });

    this.sequencerTimer = setInterval(() => {
      if (!this.isPlayingState || this.currentMode !== 'synth' || !this.ctx) return;
      const arpNote = pentatonic[Math.floor(Math.random() * pentatonic.length)] * 2;
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = 'sine';
      arpOsc.frequency.setValueAtTime(arpNote, this.ctx.currentTime);
      const now = this.ctx.currentTime;
      arpGain.gain.setValueAtTime(0.001, now);
      arpGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      arpGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      arpOsc.connect(arpGain);
      arpGain.connect(master);
      arpOsc.start(now);
      arpOsc.stop(now + 1.3);
    }, 900);
  }

  // --- Flute & Zen Mountain Spring ---
  private setupFlute(master: GainNode) {
    if (!this.ctx) return;
    const freqs = [196.0, 293.66, 329.63, 392.0];
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx!.currentTime);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      this.activeOscillators.push(osc);
    });

    this.sequencerTimer = setInterval(() => {
      if (!this.isPlayingState || this.currentMode !== 'synth' || !this.ctx) return;
      const fluteNotes = [392.0, 440.0, 493.88, 587.33, 659.25, 783.99];
      const note = fluteNotes[Math.floor(Math.random() * fluteNotes.length)];
      const fOsc = this.ctx.createOscillator();
      const fGain = this.ctx.createGain();
      fOsc.type = 'sine';
      fOsc.frequency.setValueAtTime(note, this.ctx.currentTime);
      const now = this.ctx.currentTime;
      fGain.gain.setValueAtTime(0.001, now);
      fGain.gain.linearRampToValueAtTime(0.1, now + 0.15);
      fGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      fOsc.connect(fGain);
      fGain.connect(master);
      fOsc.start(now);
      fOsc.stop(now + 2.3);
    }, 1600);
  }

  // --- Transport Controls: Pause, Resume, Seek, Stop ---

  /**
   * Pauses the active audio source (preserving position and state for seamless resume)
   */
  pause() {
    this.isPlayingState = false;
    this.isPausedState = true;

    if (this.currentMode === 'audioFile' && this.audioElement) {
      this.audioElement.pause();
    } else if (this.currentMode === 'synth') {
      this.stopSynthNodesOnly();
    }
    this.notifyState();
  }

  /**
   * Resumes the paused audio source from its current position
   */
  async resume() {
    await this.initContext();
    this.isPlayingState = true;
    this.isPausedState = false;

    if (this.currentMode === 'audioFile' && this.audioElement) {
      try {
        await this.audioElement.play();
      } catch (e) {
        console.warn('Audio resume error:', e);
      }
    } else if (this.currentMode === 'synth') {
      this.startSynthGraph(this.currentPreset || 'lullaby');
    }
    this.notifyState();
  }

  /**
   * Seeks to a specific playback second without interrupting or destroying audio
   */
  seek(seconds: number) {
    const validSec = Math.max(0, isNaN(seconds) ? 0 : seconds);

    if (this.currentMode === 'audioFile' && this.audioElement) {
      try {
        this.audioElement.currentTime = validSec;
      } catch {}
    } else if (this.currentMode === 'synth') {
      this.synthElapsedSeconds = validSec;
    }
    this.notifyTime(validSec, this.getDuration());
  }

  /**
   * Stops playback and resets state
   */
  stop() {
    this.isPlayingState = false;
    this.isPausedState = false;
    this.stopAudioFile();
    this.stopSynth();
    this.currentMode = 'none';
    this.notifyState();
  }

  private stopAudioFile() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {}
    }
  }

  private stopSynth() {
    this.stopSynthNodesOnly();
    this.synthElapsedSeconds = 0;
  }

  private stopSynthNodesOnly() {
    if (this.sequencerTimer) {
      clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }
    if (this.synthTickerTimer) {
      clearInterval(this.synthTickerTimer);
      this.synthTickerTimer = null;
    }

    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activeOscillators = [];

    this.activeGains.forEach((g) => {
      try {
        g.disconnect();
      } catch {}
    });
    this.activeGains = [];

    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }

    if (this.synthGain) {
      try {
        this.synthGain.disconnect();
      } catch {}
      this.synthGain = null;
    }
  }

  // --- State Getters & Setters ---
  getCurrentTime(): number {
    if (this.currentMode === 'audioFile' && this.audioElement) {
      return this.audioElement.currentTime || 0;
    }
    if (this.currentMode === 'synth') {
      return this.synthElapsedSeconds;
    }
    return 0;
  }

  getDuration(): number {
    if (this.currentMode === 'audioFile' && this.audioElement) {
      return this.audioElement.duration || 279;
    }
    return 279;
  }

  getIsPlaying(): boolean {
    return this.isPlayingState;
  }

  isPaused(): boolean {
    return this.isPausedState;
  }

  getCurrentPreset(): SynthPreset | null {
    return this.currentPreset;
  }

  getCurrentTrackUrl(): string | null {
    return this.currentTrackUrl;
  }

  setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.masterVolume;
    }
  }

  // --- Subscriptions ---
  onTimeUpdate(listener: (currentTime: number, duration: number) => void): () => void {
    this.timeListeners.add(listener);
    return () => {
      this.timeListeners.delete(listener);
    };
  }

  onStateChange(listener: (isPlaying: boolean, isPaused: boolean) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private notifyTime(current: number, duration: number) {
    this.timeListeners.forEach((fn) => fn(current, duration));
  }

  private notifyState() {
    this.stateListeners.forEach((fn) => fn(this.isPlayingState, this.isPausedState));
  }
}

export const audioEngine = new AudioEngine();
