/**
 * Procedural Web Audio API Cyberpunk Ambient Synthesizer & Analyser
 * Zero external MP3/audio files required - 100% mathematical procedural synthesis.
 */

class CyberpunkAudioSystem {
  private ctx: AudioContext | null = null;
  public isPlaying: boolean = false;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneOsc3: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  private timeDomainArray: Uint8Array<ArrayBuffer> | null = null;
  private freqArray: Uint8Array<ArrayBuffer> | null = null;
  private currentVolume: number = 0.16;

  public init(): boolean {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Analyser Node for the Oscilloscope & FFT Spectrum
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.82;
      this.timeDomainArray = new Uint8Array(this.analyser.fftSize);
      this.freqArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Resonant Lowpass Filter for atmospheric warm fog
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(340, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(4.2, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Sub drone 1: Deep C2 (65.41 Hz) Sawtooth
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(65.41, this.ctx.currentTime);

      // Sub drone 2: G2 (98.00 Hz) detuned triangle
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(98.25, this.ctx.currentTime);

      // Sub drone 3: Sub-octave C1 (32.7 Hz) sine for physical rumble
      this.droneOsc3 = this.ctx.createOscillator();
      this.droneOsc3.type = 'sine';
      this.droneOsc3.frequency.setValueAtTime(32.7, this.ctx.currentTime);

      // LFO for slow breathing filter sweep (Blade Runner texture)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(160, this.ctx.currentTime);
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);

      // Connect oscillators
      this.droneOsc1.connect(this.filter);
      this.droneOsc2.connect(this.filter);
      this.droneOsc3.connect(this.filter);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.droneOsc3.start();
      this.lfo.start();

      this.isPlaying = true;
      return true;
    } catch {
      return false;
    }
  }

  public toggle(): boolean {
    if (!this.ctx) {
      return this.init();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      this.isPlaying = true;
      return true;
    }
    if (this.isPlaying) {
      this.masterGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      this.isPlaying = false;
      return false;
    } else {
      this.masterGain?.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.08);
      this.isPlaying = true;
      return true;
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && this.isPlaying && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const target = muted ? 0 : this.isPlaying ? this.currentVolume : 0;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
  }

  public playPing(freq = 880, duration = 0.45) {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      else gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted
    }
  }

  public playWarp() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.65);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.65);
    } catch {
      // Ignored
    }
  }

  public playSubroutine() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.08, this.ctx!.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + idx * 0.06 + 0.4);

        osc.connect(gain);
        if (this.analyser) gain.connect(this.analyser);
        osc.start(this.ctx!.currentTime + idx * 0.06);
        osc.stop(this.ctx!.currentTime + idx * 0.06 + 0.45);
      });
    } catch {
      // Ignored
    }
  }

  public playSecretChord() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      const chord = [220, 277.18, 329.63, 440, 554.37];
      chord.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
        gain.gain.setValueAtTime(0.06, this.ctx!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 1.6);

        osc.connect(gain);
        if (this.analyser) gain.connect(this.analyser);
        osc.start();
        osc.stop(this.ctx!.currentTime + 1.65);
      });
    } catch {
      // Ignored
    }
  }

  public playLaser() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      else gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // Ignored
    }
  }

  public playExplosion() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      // Low boom oscillator + noise simulation
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      else gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.62);
    } catch {
      // Ignored
    }
  }

  public playPickup() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1174.66, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      else gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Ignored
    }
  }

  public playDamage() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      else gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch {
      // Ignored
    }
  }

  public playVictory() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.15, this.ctx!.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.12 + 0.5);

        osc.connect(gain);
        if (this.analyser) gain.connect(this.analyser);
        else gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + i * 0.12);
        osc.stop(this.ctx!.currentTime + i * 0.12 + 0.55);
      });
    } catch {
      // Ignored
    }
  }

  public getTimeDomainData(): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser || !this.isPlaying || !this.timeDomainArray) return null;
    this.analyser.getByteTimeDomainData(this.timeDomainArray);
    return this.timeDomainArray;
  }

  public getFrequencyData(): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser || !this.isPlaying || !this.freqArray) return null;
    this.analyser.getByteFrequencyData(this.freqArray);
    return this.freqArray;
  }
}

export const audioSystem = new CyberpunkAudioSystem();
