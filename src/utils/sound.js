/**
 * Hece Zinciri PRO - Stüdyo Kalitesinde Web Audio API Ses Sentezleyici & Haptic Motoru
 * Harici hiçbir .mp3 / .wav dosyası kullanmaz; tüm sesler gerçek zamanlı sentezlenir.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.musicStep = 0;
    try {
      const savedMute = localStorage.getItem('hece_zinciri_muted');
      if (savedMute !== null) {
        this.muted = JSON.parse(savedMute);
      }
    } catch {
      this.muted = false;
    }
  }

  initContext() {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  setMuted(muteState) {
    this.muted = Boolean(muteState);
    if (this.muted && this.musicPlaying) {
      this.stopAmbientMusic();
    }
    try {
      localStorage.setItem('hece_zinciri_muted', JSON.stringify(this.muted));
    } catch {
      // ignore
    }
    return this.muted;
  }

  /**
   * Web Audio API ile Gerçek Zamanlı Prosedürel Zen / Lo-Fi Arka Plan Müziği
   */
  toggleAmbientMusic() {
    if (this.musicPlaying) {
      this.stopAmbientMusic();
      return false;
    }
    if (this.muted) {
      this.setMuted(false);
    }
    this.startAmbientMusic();
    return true;
  }

  startAmbientMusic() {
    const ctx = this.initContext();
    if (!ctx) return;
    this.stopAmbientMusic();
    this.musicPlaying = true;

    // Pentatonik huzurlu akor dizisi (Am9 - Fmaj7 - Cmaj9 - G6)
    const chords = [
      [220.0, 261.63, 329.63, 392.0],
      [174.61, 220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 392.0],
      [164.81, 196.0, 246.94, 329.63]
    ];

    const playNextBar = () => {
      if (!this.musicPlaying || this.muted) return;
      const c = this.initContext();
      if (!c) return;
      try {
        const now = c.currentTime;
        const chord = chords[this.musicStep % chords.length];
        this.musicStep++;

        chord.forEach((freq, idx) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          const filter = c.createBiquadFilter();

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(520, now);

          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);

          gain.gain.setValueAtTime(0.0001, now + idx * 0.18);
          gain.gain.linearRampToValueAtTime(0.022, now + idx * 0.18 + 0.45);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + 2.6);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(c.destination);

          osc.start(now + idx * 0.18);
          osc.stop(now + 2.7);
        });
      } catch {
        // ignore
      }
    };

    playNextBar();
    this.musicTimer = setInterval(playNextBar, 2600);
  }

  stopAmbientMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMute() {
    const next = !this.muted;
    this.setMuted(next);
    if (!next) {
      this.playSelect();
    }
    return next;
  }

  vibrate(pattern) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Taş seçme / sürüklemeye başlama: kadifemsi "pop"
   */
  playSelect() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.055);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch {
      // ignore
    }
  }

  /**
   * Taş koyma: Tok, yumuşak ahşap/plastik "tık" sesi + 15ms titreşim
   */
  playPlaceTile() {
    this.vibrate(15);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(720, now);

      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(220, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(82, now + 0.068);

      bodyGain.gain.setValueAtTime(0.34, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      bodyOsc.connect(filter);
      filter.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      bodyOsc.start(now);
      bodyOsc.stop(now + 0.078);

      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();

      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(1040, now);
      clickOsc.frequency.exponentialRampToValueAtTime(380, now + 0.022);

      clickGain.gain.setValueAtTime(0.14, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);

      clickOsc.start(now);
      clickOsc.stop(now + 0.028);
    } catch {
      // ignore
    }
  }

  /**
   * Kelime Patlatma: Kombo arttıkça notası (frekansı) yükselen kristal akor çınlaması
   */
  playWordBlast(comboMultiplier = 1, wordCount = 1) {
    this.vibrate([20, 30, 40]);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const semitoneShift = Math.min((comboMultiplier - 1) * 2 + (wordCount > 1 ? 2 : 0), 14);
      const pitchFactor = Math.pow(2, semitoneShift / 12);

      const baseNotes = [523.25, 659.25, 783.99, 1046.5];
      if (comboMultiplier >= 2 || wordCount >= 2) {
        baseNotes.push(1174.66);
      }
      if (comboMultiplier >= 4) {
        baseNotes.push(1318.51);
      }

      baseNotes.forEach((baseFreq, idx) => {
        const freq = baseFreq * pitchFactor;
        const startOffset = idx * 0.04;
        const duration = 0.38 + idx * 0.05;

        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + startOffset);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq * 1.5, now + startOffset);

        gain.gain.setValueAtTime(0.001, now + startOffset);
        gain.gain.linearRampToValueAtTime(0.19, now + startOffset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + startOffset + duration);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.06, now + startOffset);
        subGain.gain.exponentialRampToValueAtTime(0.0005, now + startOffset + duration * 0.8);

        osc.connect(gain);
        subOsc.connect(subGain);
        subGain.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + startOffset);
        subOsc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.02);
        subOsc.stop(now + startOffset + duration + 0.02);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Seviye Atlama veya "Tahta Tertemiz!" (Full Clear) Fanfarı
   */
  playFanfare() {
    this.vibrate([25, 40, 25, 60]);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.06;
        const dur = i === notes.length - 1 ? 0.55 : 0.22;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur + 0.02);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Joker kullanımı, İpucu veya +1 Joker Hediye sesi
   */
  playJokerSound(type = 'refresh') {
    this.vibrate(20);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes =
        type === 'reward'
          ? [587.33, 739.99, 880, 1174.66]
          : type === 'erase'
          ? [420, 280, 180]
          : type === 'hint'
          ? [659.25, 880, 1046.5]
          : [440, 554.37, 659.25];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.05;

        osc.type = type === 'erase' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.13, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.17);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Oyun Sonu (Game Over) sesi
   */
  playGameOver() {
    this.vibrate([40, 60, 80]);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [392.0, 349.23, 329.63, 261.63];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.13;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Bomba Taş veya Son Şans 3x3 Patlama Sesi (Derin bas patlaması + parlak şok dalgası)
   */
  playExplosion() {
    this.vibrate([45, 30, 65]);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Derin sub-bass darbe
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.exponentialRampToValueAtTime(75, now + 0.35);

      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      subOsc.connect(filter);
      filter.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 0.4);

      // Parlak şok çınlaması
      [587.33, 880, 1174.66].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.04 + i * 0.03);
        g.gain.setValueAtTime(0.15, now + 0.04 + i * 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.04);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + 0.04 + i * 0.03);
        osc.stop(now + 0.38 + i * 0.04);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Hazine Sandığı Kırılma & Altın Saçılma Sesi
   */
  playChestOpen() {
    this.vibrate([20, 20, 40]);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const coinNotes = [987.77, 1318.51, 1567.98, 1975.53];
      coinNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.045;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // ignore
    }
  }

  /**
   * ❄️ Buzlu Hücre Kırılma Sesi (Kristal Cam Çatlaması)
   */
  playIceShatter() {
    this.vibrate([15, 15, 25]);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const crystalNotes = [1760, 2093, 2637, 3135.96];
      crystalNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.025;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.72, start + 0.11);

        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.13);
      });
    } catch {
      // ignore
    }
  }

  /**
   * ↩️ Hamle Geri Alma (Undo) Sesi
   */
  playUndo() {
    this.vibrate(12);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(290, now + 0.09);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
