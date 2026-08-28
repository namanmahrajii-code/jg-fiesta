// ========================================================
// SOUND MANAGER (Web Audio API synthetic notification chime)
// Zero external file dependencies, pleasant melodic chime
// ========================================================

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = localStorage.getItem('rock_admin_muted') === 'true';
    this.updateIcon();
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playOrderChime() {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1 (E5 - 659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2 (G#5 - 830.61Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);

      // Note 3 (B5 - 987.77Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(987.77, now + 0.24);
      gain3.gain.setValueAtTime(0.4, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.9);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  toggleSound() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('rock_admin_muted', this.isMuted);
    this.updateIcon();
    if (!this.isMuted) {
      this.playOrderChime();
    }
  }

  updateIcon() {
    const btn = document.getElementById('sound-toggle-btn');
    const icon = document.getElementById('sound-icon');
    if (!btn || !icon) return;

    if (this.isMuted) {
      btn.classList.add('muted');
      icon.textContent = '🔕';
      btn.title = 'Sound Notifications: OFF (Click to Enable)';
    } else {
      btn.classList.remove('muted');
      icon.textContent = '🔔';
      btn.title = 'Sound Notifications: ON (Click to Mute)';
    }
  }
}

const soundManager = new SoundManager();
