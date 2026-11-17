// Procedural sound: every effect is a few oscillators shaped by hand, no audio files.
// The context is created on the first user gesture and every call is guarded, so a
// browser that refuses audio (or a headless screenshot run) simply plays silent.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freqStart, freqEnd, seconds, type, gainValue, delay = 0) {
    const ctx = ensure();
    if (!ctx || ctx.state === 'suspended') return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + seconds);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + seconds + 0.05);
    } catch {
      // Sound is garnish; a failure here must never break the game.
    }
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    /** A soft two-note chime when an ember is gathered. */
    chime() {
      tone(880, 880, 0.12, 'sine', 0.12);
      tone(1318, 1318, 0.16, 'sine', 0.1, 0.07);
    },
    /** A bright shimmer when a wisp burns away. */
    banish() {
      tone(520, 180, 0.18, 'triangle', 0.1);
    },
    /** A low thud when a wisp steals light. */
    hurt() {
      tone(130, 55, 0.25, 'sine', 0.2);
    },
    /** A swell when the keeper flares. */
    flare() {
      tone(220, 440, 0.3, 'sawtooth', 0.06);
    },
    /** A rising chord when dawn breaks. */
    dawn() {
      tone(523, 523, 0.5, 'sine', 0.1, 0);
      tone(659, 659, 0.5, 'sine', 0.1, 0.12);
      tone(784, 784, 0.6, 'sine', 0.1, 0.24);
      tone(1046, 1046, 0.8, 'sine', 0.09, 0.36);
    },
    /** A UI tick for starting and restarting. */
    click() {
      tone(660, 660, 0.05, 'square', 0.05);
    },
  };
}
