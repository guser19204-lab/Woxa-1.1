/**
 * Procedural Web Audio Engine for realistic horror immersion.
 * Generates dynamic spatial atmospheric drones, heartbeats, glass shattering,
 * flashlight electrical sparks, ghost whispers, footsteps, and terrifying stingers.
 */

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private heartbeatInterval: number | null = null;
  private currentBpm: number = 70;
  private isHeartbeatPlaying: boolean = false;
  private isInitialized: boolean = false;

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.isInitialized = true;
      this.startAmbientDrone();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(muted ? 0 : 0.25, this.ctx.currentTime, 0.2);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Start low-frequency sinister museum atmospheric drone
   */
  public startAmbientDrone() {
    if (!this.ctx || this.isMuted) return;

    try {
      if (this.ambientOsc1) {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
      }
      if (this.ambientOsc2) {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
      }

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.droneFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      // Low frequency detuned sub-drones
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sawtooth';
      this.ambientOsc1.frequency.setValueAtTime(48, this.ctx.currentTime); // Sub-bass G1

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(51.5, this.ctx.currentTime); // Detuned beat frequency

      // Low frequency modulation (LFO) for breathing drone
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(40, this.ctx.currentTime);
      lfo.connect(this.droneFilter.frequency);
      lfo.start();

      this.ambientOsc1.connect(this.droneFilter);
      this.ambientOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
    } catch (e) {
      console.warn('Ambient drone start error:', e);
    }
  }

  /**
   * Modulate ambient intensity based on danger
   */
  public setTensionLevel(level: number) { // 0 to 1
    if (!this.ctx || !this.droneFilter || !this.ambientGain || this.isMuted) return;
    const targetFreq = 120 + level * 350;
    const targetGain = 0.15 + level * 0.35;
    this.droneFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);
    this.ambientGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
  }

  /**
   * Flashlight switch click with mechanical snap
   */
  public playFlashlightClick(isOn: boolean) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isOn ? 1200 : 800, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Flashlight electrical sputter / flicker buzzing
   */
  public playFlashlightFlicker() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // White noise burst
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 + Math.random() * 800, now);
      filter.Q.setValueAtTime(6, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.08);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Violent Glass Shatter sound (Crucial horror alert: "Glass starts breaking, you know you're not alone.")
   */
  public playGlassBreak() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 1.6;

      // 1. Initial High Transient Impact (White Noise Crack)
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Granular bursts representing falling shards
        const envelope = Math.exp(-i / (this.ctx.sampleRate * 0.3));
        const debrisRandom = Math.random() < 0.15 ? Math.random() : Math.random() * 0.2;
        data[i] = (Math.random() * 2 - 1) * (envelope + debrisRandom * 0.3);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const highFilter = this.ctx.createBiquadFilter();
      highFilter.type = 'highpass';
      highFilter.frequency.setValueAtTime(2500, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(highFilter);
      highFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noiseSource.start(now);

      // 2. High Metallic Clatter & Resonant Glass Tones (multiple ringing frequencies)
      const frequencies = [3400, 4800, 6200, 7800, 9200];
      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 200, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.8 + idx * 0.1);

        oscGain.gain.setValueAtTime(0.3 / (idx + 1), now + idx * 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7 + idx * 0.15);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + 1.2);
      });

      // 3. Heavy Low-End Thump (The impact that broke the glass)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      subGain.gain.setValueAtTime(0.8, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.4);
    } catch (e) {
      console.warn('Glass break sound failed:', e);
    }
  }

  /**
   * Chilling Presence Event Whisper / Cold Breath (Signals: "You feel a presence behind you... DO NOT MOVE")
   */
  public playPresenceWhisper() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 4.0;

      // Binaural spectral cold breath
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.ctx.sampleRate;
        const breathMod = Math.sin(t * Math.PI * 1.5) ** 2;
        left[i] = (Math.random() * 2 - 1) * breathMod * 0.4;
        right[i] = (Math.random() * 2 - 1) * breathMod * 0.45;
      }

      const breathSource = this.ctx.createBufferSource();
      breathSource.buffer = buffer;

      const formantFilter = this.ctx.createBiquadFilter();
      formantFilter.type = 'bandpass';
      formantFilter.frequency.setValueAtTime(650, now);
      formantFilter.frequency.exponentialRampToValueAtTime(1200, now + 2.0);
      formantFilter.frequency.exponentialRampToValueAtTime(450, now + 4.0);
      formantFilter.Q.setValueAtTime(7.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.65, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      breathSource.connect(formantFilter);
      formantFilter.connect(gain);
      gain.connect(this.ctx.destination);

      breathSource.start(now);
      breathSource.stop(now + duration);

      // Low creepy descending spectral tone
      const toneOsc = this.ctx.createOscillator();
      const toneGain = this.ctx.createGain();
      toneOsc.type = 'sine';
      toneOsc.frequency.setValueAtTime(110, now);
      toneOsc.frequency.exponentialRampToValueAtTime(55, now + 3.5);

      toneGain.gain.setValueAtTime(0.2, now);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

      toneOsc.connect(toneGain);
      toneGain.connect(this.ctx.destination);
      toneOsc.start(now);
      toneOsc.stop(now + 4.0);
    } catch (e) {
      console.warn('Presence whisper failed:', e);
    }
  }

  /**
   * Heartbeat sound with dynamic BPM
   */
  public setHeartbeatState(active: boolean, bpm: number = 75) {
    this.currentBpm = bpm;
    if (active && !this.isHeartbeatPlaying) {
      this.isHeartbeatPlaying = true;
      this.scheduleHeartbeats();
    } else if (!active && this.isHeartbeatPlaying) {
      this.isHeartbeatPlaying = false;
      if (this.heartbeatInterval) {
        window.clearTimeout(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
  }

  private scheduleHeartbeats() {
    if (!this.isHeartbeatPlaying) return;

    this.playSingleHeartbeat();

    const intervalMs = (60 / this.currentBpm) * 1000;
    this.heartbeatInterval = window.setTimeout(() => {
      this.scheduleHeartbeats();
    }, intervalMs);
  }

  private playSingleHeartbeat() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Lub (First thump)
      this.playThump(now, 58, 0.45);
      // Dub (Second thump, 0.14s later)
      this.playThump(now + 0.14, 52, 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  private playThump(time: number, freq: number, volume: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(25, time + 0.12);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  /**
   * Footsteps sound (Marble echo)
   */
  public playFootstep() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Sudden terrifying jumpscare stinger (Triggered on death / caught / moving during presence)
   */
  public playJumpscareStinger() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 2.5;

      // 1. Violent Dissonant Cluster Screech (multiple detuned harsh sawtooths)
      const freqs = [330, 349, 440, 466, 698, 740, 1174];
      freqs.forEach((f) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f * 1.8, now + 0.4);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      });

      // 2. White Noise Roar
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.75, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 3. Sub Impact Drop
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(160, now);
      sub.frequency.exponentialRampToValueAtTime(25, now + 0.8);

      subGain.gain.setValueAtTime(0.9, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 1.0);
    } catch (e) {
      console.warn('Jumpscare sound failed:', e);
    }
  }

  /**
   * Cursed Relic / Journal pickup chime
   */
  public playRelicPickup() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 1.3);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Hiding breath holding / cloth rustle
   */
  public playHideTransition(isHiding: boolean) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHiding ? 280 : 150, now);
      osc.frequency.exponentialRampToValueAtTime(isHiding ? 80 : 260, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      console.warn(e);
    }
  }
}

export const audioEngine = new HorrorAudioEngine();
