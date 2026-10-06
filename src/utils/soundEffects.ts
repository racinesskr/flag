// Plays real recorded audio of children cheering ("예~!" / "Yay~!") and children groaning ("우~!" / "Boo~!")
// Uses Vite static asset imports + decoded Web Audio API AudioBuffers for 100% reliable, zero-latency playback on mobile & desktop.

import kidsYayUrl from '../assets/sounds/kids-yay.mp3';
import kidsCheeringUrl from '../assets/sounds/kids-cheering.mp3';
import kidsWooUrl from '../assets/sounds/kids-woo.mp3';

class SoundManager {
  public isMuted: boolean = false;
  private ctx: AudioContext | null = null;
  private yayBuffer: AudioBuffer | null = null;
  private yayBackupBuffer: AudioBuffer | null = null;
  private wooBuffer: AudioBuffer | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentHtmlAudio: HTMLAudioElement | null = null;
  private isPreloading: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Preload as soon as first user gesture or page load occurs
      this.initAndPreload();
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private async fetchAndDecode(url: string): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this.getContext();
      if (!ctx) return null;
      return await ctx.decodeAudioData(arrayBuffer);
    } catch {
      return null;
    }
  }

  public async initAndPreload() {
    if (this.isPreloading) return;
    this.isPreloading = true;
    const [yay, cheering, woo] = await Promise.all([
      this.fetchAndDecode(kidsYayUrl),
      this.fetchAndDecode(kidsCheeringUrl),
      this.fetchAndDecode(kidsWooUrl),
    ]);
    if (yay) this.yayBuffer = yay;
    if (cheering) this.yayBackupBuffer = cheering;
    if (woo) this.wooBuffer = woo;
  }

  public stopCurrent() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // ignore if already stopped
      }
      this.currentSource = null;
    }
    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.pause();
        this.currentHtmlAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentHtmlAudio = null;
    }
  }

  private playBufferOrUrl(
    buffer: AudioBuffer | null,
    url: string,
    volume: number
  ): boolean {
    const ctx = this.getContext();
    if (ctx && buffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        this.currentSource = source;
        return true;
      } catch {
        // fallback to HTMLAudioElement below
      }
    }

    try {
      const audio = new Audio(url);
      audio.volume = volume;
      this.currentHtmlAudio = audio;
      audio.play().catch(() => {
        // If even HTMLAudioElement fails, decode on the fly
        this.fetchAndDecode(url).then((decoded) => {
          if (decoded && !this.isMuted) {
            const c = this.getContext();
            if (c) {
              const src = c.createBufferSource();
              src.buffer = decoded;
              src.connect(c.destination);
              src.start(0);
              this.currentSource = src;
            }
          }
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  // Play real recorded children cheering "예~!" (Yay~!)
  public playKidsYay() {
    if (this.isMuted || typeof window === 'undefined') return;
    this.stopCurrent();

    const bufferToUse = this.yayBuffer || this.yayBackupBuffer;
    const urlToUse = this.yayBuffer ? kidsYayUrl : kidsCheeringUrl;
    this.playBufferOrUrl(bufferToUse, urlToUse, 1.0);
  }

  // Play real recorded children groaning/booing "우~!" (Woo~!)
  public playKidsWoo() {
    if (this.isMuted || typeof window === 'undefined') return;
    this.stopCurrent();

    this.playBufferOrUrl(this.wooBuffer, kidsWooUrl, 0.95);
  }
}

export const soundManager = new SoundManager();
