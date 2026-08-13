import { useEffect, useRef } from 'react';
import type { SoundConfig } from './useSoundSystem';

interface UseAmbienceOptions {
  soundConfig: SoundConfig;
  /** 0-100 police heat; higher = more sirens in the bed */
  heat?: number;
  /** Set false to fade the bed out (e.g. game over / back to menu) */
  active?: boolean;
}

/**
 * Procedural city ambience bed: rain-ish filtered noise, low traffic rumble and
 * occasional distant sirens. Fully synthesized, so it needs no audio asset and
 * loops seamlessly.
 */
export const useAmbience = ({ soundConfig, heat = 0, active = true }: UseAmbienceOptions) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const sirenGainRef = useRef<GainNode | null>(null);
  const sirenTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  const level = soundConfig.enabled && active ? (soundConfig.ambienceVolume ?? 0) : 0;
  const levelRef = useRef(level);
  levelRef.current = level;
  const heatRef = useRef(heat);
  heatRef.current = heat;

  useEffect(() => {
    let disposed = false;

    const start = () => {
      if (disposed || startedRef.current) return;
      if (levelRef.current <= 0) return;
      let ctx: AudioContext;
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch { return; }
      ctxRef.current = ctx;
      startedRef.current = true;

      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      masterRef.current = master;

      // --- Rain / street hiss: looping filtered noise
      const len = Math.floor(ctx.sampleRate * 4);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02; // brownish noise
        data[i] = last * 3.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const hiss = ctx.createBiquadFilter();
      hiss.type = 'bandpass';
      hiss.frequency.value = 900;
      hiss.Q.value = 0.4;
      const hissGain = ctx.createGain();
      hissGain.gain.value = 0.35;
      noise.connect(hiss); hiss.connect(hissGain); hissGain.connect(master);
      noise.start();

      // --- Low traffic rumble
      const rumble = ctx.createOscillator();
      rumble.type = 'sine';
      rumble.frequency.value = 58;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.12;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain); lfoGain.connect(rumbleGain.gain);
      rumble.connect(rumbleGain); rumbleGain.connect(master);
      rumble.start(); lfo.start();

      // --- Distant sirens bus
      const sirenBus = ctx.createGain();
      sirenBus.gain.value = 0;
      const sirenFilter = ctx.createBiquadFilter();
      sirenFilter.type = 'lowpass';
      sirenFilter.frequency.value = 1400;
      sirenBus.connect(sirenFilter); sirenFilter.connect(master);
      sirenGainRef.current = sirenBus;

      const wailOnce = () => {
        const c = ctxRef.current;
        if (!c || disposed) return;
        const t = c.currentTime;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, t);
        for (let i = 0; i < 4; i++) {
          osc.frequency.linearRampToValueAtTime(880, t + i * 0.9 + 0.45);
          osc.frequency.linearRampToValueAtTime(620, t + i * 0.9 + 0.9);
        }
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.8);
        g.gain.linearRampToValueAtTime(0, t + 3.6);
        osc.connect(g); g.connect(sirenBus);
        osc.start(t); osc.stop(t + 3.7);
      };

      const scheduleSiren = () => {
        const h = Math.max(0, Math.min(100, heatRef.current));
        // 55s between wails when cool, ~14s when the city is boiling
        const gap = 55000 - (h / 100) * 41000;
        sirenTimerRef.current = window.setTimeout(() => {
          if (disposed) return;
          const bus = sirenGainRef.current;
          if (bus) bus.gain.value = 0.25 + (heatRef.current / 100) * 0.75;
          wailOnce();
          scheduleSiren();
        }, gap * (0.6 + Math.random() * 0.8));
      };
      scheduleSiren();

      // Fade in
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(levelRef.current * 0.6, ctx.currentTime + 3);
    };

    // Autoplay policy: start on first interaction if needed
    const onInteract = () => start();
    start();
    window.addEventListener('pointerdown', onInteract, { passive: true });
    window.addEventListener('keydown', onInteract, { passive: true });

    return () => {
      disposed = true;
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      if (sirenTimerRef.current) { clearTimeout(sirenTimerRef.current); sirenTimerRef.current = null; }
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (ctx && master) {
        try {
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
          master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        } catch {}
        setTimeout(() => { ctx.close().catch(() => {}); }, 800);
      }
      ctxRef.current = null;
      masterRef.current = null;
      sirenGainRef.current = null;
      startedRef.current = false;
    };
  }, []);

  // React to volume / mute changes
  useEffect(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(level * 0.6, ctx.currentTime + 0.5);
    } catch {}
    if (level > 0 && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }, [level]);
};
