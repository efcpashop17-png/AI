// Web Audio API Sound Service - Crisp, subtle, futuristic cyber tones
// No external assets required, 100% offline-ready with zero latency.

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check saved mute preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sound_effects_enabled');
      this.isMuted = saved !== null ? saved === 'false' : false;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => null);
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_effects_enabled', muted ? 'false' : 'true');
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    const newState = !this.isMuted;
    this.setMuted(newState);
    if (!newState) {
      // Play a quick subtle pop to confirm unmute
      this.playNotificationSound();
    }
    return newState;
  }

  /**
   * Successful Transaction Sound:
   * A warm, uplifting 3-note ascending cyber chord (C5 -> E5 -> G5 -> C6)
   * Perfect for checkout, payment verification, and credit top-up.
   */
  public playSuccessSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const noteDelay = 0.06;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * noteDelay);

        // Smooth volume envelope with subtle presence
        const startTime = now + idx * noteDelay;
        const noteDuration = 0.35;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      });
    } catch {
      // Ignore audio synthesis errors on locked environments
    }
  }

  /**
   * Order Status Update Sound:
   * A clean, modern affirmative two-tone chime (D5 -> A5)
   * Perfect for order status changes (processing, completed, delivery proof attached).
   */
  public playStatusUpdateSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 587.33, delay: 0, duration: 0.22, vol: 0.12 }, // D5
        { freq: 880.00, delay: 0.08, duration: 0.35, vol: 0.14 }, // A5
      ];

      notes.forEach(({ freq, delay, duration, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Triangle wave gives a softer, warmer tactile chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        const startTime = now + delay;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(vol, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // Ignore audio errors
    }
  }

  /**
   * System Notification Sound:
   * A delicate, crystal glass ping (E5 with harmonic sparkle)
   * Perfect for toast alerts and messages.
   */
  public playNotificationSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Base note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Higher harmonic sparkle
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.03); // E6

      gain2.gain.setValueAtTime(0.001, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.25);
    } catch {
      // Ignore audio errors
    }
  }

  /**
   * Error or Warning Sound:
   * Soft descending tone for invalid actions or warnings.
   */
  public playErrorSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.2); // C4

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio errors
    }
  }
}

export const soundService = new SoundService();
