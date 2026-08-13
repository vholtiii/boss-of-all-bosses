import { useEffect, useRef } from 'react';
import type { SoundConfig } from './useSoundSystem';
import {
  computeAmbienceMix,
  NEUTRAL_AMBIENCE,
  type AmbienceState,
  type AmbienceMix,
} from '@/lib/ambience-state';

interface UseAmbienceOptions {
  soundConfig: SoundConfig;
  /** Live game signals driving the mix */
  ambience?: Partial<AmbienceState>;
  /** Set false to fade the bed out (e.g. game over / back to menu) */
  active?: boolean;
}

/**
 * Procedural city ambience bed. Fully synthesized (no assets), it loops
 * seamlessly and continuously re-mixes itself from the live game state:
 * heat drives sirens and a police throb, war/tension add distant gunfire and a
 * sub drone, prosperity swaps cold wind for crowd murmur, and the progression
 * phase scales overall city density.
 */
export const useAmbience = ({ soundConfig, ambience, active = true }: UseAmbienceOptions) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  // Layer gain nodes
  const gainsRef = useRef<Record<string, GainNode | null>>({});
  const sirenTimerRef = useRef<number | null>(null);
  const gunTimerRef = useRef<number | null>(null);

  const level = soundConfig.enabled && active ? (soundConfig.ambienceVolume ?? 0) : 0;
  const levelRef = useRef(level);
  levelRef.current = level;

  const reactive = soundConfig.ambienceReactive !== false;
  const state: AmbienceState = reactive
    ? { ...NEUTRAL_AMBIENCE, ...(ambience || {}) }
    : NEUTRAL_AMBIENCE;
  const mix = computeAmbienceMix(state);
  const mixRef = useRef<AmbienceMix>(mix);
  mixRef.current = mix;

  useEffect(() => {
    let disposed = false;

    const ramp = (node: GainNode | null | undefined, value: number, secs = 3) => {
      const ctx = ctxRef.current;
      if (!ctx || !node) return;
      try {
        node.gain.cancelScheduledValues(ctx.currentTime);
        node.gain.setValueAtTime(node.gain.value, ctx.currentTime);
        node.gain.linearRampToValueAtTime(value, ctx.currentTime + secs);
      } catch { /* noop */ }
    };

    const makeNoise = (ctx: AudioContext, brown: boolean) => {
      const len = Math.floor(ctx.sampleRate * 4);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        if (brown) {
          last = (last + 0.02 * white) / 1.02;
          data[i] = last * 3.5;
        } else {
          data[i] = white * 0.6;
        }
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      return src;
    };

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

      const m = mixRef.current;
      const gains: Record<string, GainNode> = {};

      // --- Rain / street hiss
      const noise = makeNoise(ctx, true);
      const hissFilter = ctx.createBiquadFilter();
      hissFilter.type = 'bandpass';
      hissFilter.frequency.value = 900;
      hissFilter.Q.value = 0.4;
      const hissGain = ctx.createGain();
      hissGain.gain.value = m.hiss;
      noise.connect(hissFilter); hissFilter.connect(hissGain); hissGain.connect(master);
      noise.start();
      gains.hiss = hissGain;

      // --- Low traffic rumble
      const rumble = ctx.createOscillator();
      rumble.type = 'sine';
      rumble.frequency.value = 58;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = m.rumble;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain); lfoGain.connect(rumbleGain.gain);
      rumble.connect(rumbleGain); rumbleGain.connect(master);
      rumble.start(); lfo.start();
      gains.rumble = rumbleGain;

      // --- Crowd murmur / distant radio (prosperity)
      const crowdSrc = makeNoise(ctx, false);
      const crowdFilter = ctx.createBiquadFilter();
      crowdFilter.type = 'bandpass';
      crowdFilter.frequency.value = 420;
      crowdFilter.Q.value = 3.5;
      const crowdWobble = ctx.createOscillator();
      crowdWobble.type = 'sine';
      crowdWobble.frequency.value = 0.23;
      const crowdWobbleGain = ctx.createGain();
      crowdWobbleGain.gain.value = 130;
      crowdWobble.connect(crowdWobbleGain); crowdWobbleGain.connect(crowdFilter.frequency);
      const crowdGain = ctx.createGain();
      crowdGain.gain.value = m.crowd;
      crowdSrc.connect(crowdFilter); crowdFilter.connect(crowdGain); crowdGain.connect(master);
      crowdSrc.start(); crowdWobble.start();
      gains.crowd = crowdGain;

      // --- Cold wind (poverty / losing)
      const windSrc = makeNoise(ctx, false);
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'highpass';
      windFilter.frequency.value = 620;
      const windSweep = ctx.createOscillator();
      windSweep.type = 'sine';
      windSweep.frequency.value = 0.05;
      const windSweepGain = ctx.createGain();
      windSweepGain.gain.value = 260;
      windSweep.connect(windSweepGain); windSweepGain.connect(windFilter.frequency);
      const windGain = ctx.createGain();
      windGain.gain.value = m.wind;
      windSrc.connect(windFilter); windFilter.connect(windGain); windGain.connect(master);
      windSrc.start(); windSweep.start();
      gains.wind = windGain;

      // --- Tension drone (sub bass)
      const drone = ctx.createOscillator();
      drone.type = 'sawtooth';
      drone.frequency.value = 41;
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 180;
      const droneGain = ctx.createGain();
      droneGain.gain.value = m.drone;
      drone.connect(droneFilter); droneFilter.connect(droneGain); droneGain.connect(master);
      drone.start();
      gains.drone = droneGain;

      // --- Police pulse (slow throb at critical heat / RICO)
      const pulse = ctx.createOscillator();
      pulse.type = 'sine';
      pulse.frequency.value = 74;
      const pulseShape = ctx.createGain();
      pulseShape.gain.value = 0;
      const pulseLfo = ctx.createOscillator();
      pulseLfo.type = 'sine';
      pulseLfo.frequency.value = 0.55;
      const pulseLfoGain = ctx.createGain();
      pulseLfoGain.gain.value = 1;
      pulseLfo.connect(pulseLfoGain); pulseLfoGain.connect(pulseShape.gain);
      const pulseGain = ctx.createGain();
      pulseGain.gain.value = m.policePulse;
      pulse.connect(pulseShape); pulseShape.connect(pulseGain); pulseGain.connect(master);
      pulse.start(); pulseLfo.start();
      gains.policePulse = pulseGain;

      // --- Distant sirens bus
      const sirenBus = ctx.createGain();
      sirenBus.gain.value = m.siren;
      const sirenFilter = ctx.createBiquadFilter();
      sirenFilter.type = 'lowpass';
      sirenFilter.frequency.value = 1400;
      sirenBus.connect(sirenFilter); sirenFilter.connect(master);
      gains.siren = sirenBus;

      // --- Distant gunfire bus
      const gunBus = ctx.createGain();
      gunBus.gain.value = m.gunfire;
      const gunFilter = ctx.createBiquadFilter();
      gunFilter.type = 'lowpass';
      gunFilter.frequency.value = 900;
      gunBus.connect(gunFilter); gunFilter.connect(master);
      gains.gunfire = gunBus;

      gainsRef.current = gains;

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

      const burstOnce = () => {
        const c = ctxRef.current;
        if (!c || disposed) return;
        const shots = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < shots; i++) {
          const t = c.currentTime + i * (0.12 + Math.random() * 0.18);
          const src = makeNoise(c, false);
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          src.connect(g); g.connect(gunBus);
          src.start(t); src.stop(t + 0.32);
        }
      };

      const scheduleSiren = () => {
        const gap = Math.max(6000, mixRef.current.sirenGapMs);
        sirenTimerRef.current = window.setTimeout(() => {
          if (disposed) return;
          wailOnce();
          scheduleSiren();
        }, gap * (0.6 + Math.random() * 0.8));
      };
      scheduleSiren();

      const scheduleGunfire = () => {
        const gap = mixRef.current.gunfireGapMs;
        const wait = Number.isFinite(gap) ? Math.max(8000, gap) : 20000;
        gunTimerRef.current = window.setTimeout(() => {
          if (disposed) return;
          if (Number.isFinite(mixRef.current.gunfireGapMs)) burstOnce();
          scheduleGunfire();
        }, wait * (0.6 + Math.random() * 0.8));
      };
      scheduleGunfire();

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
      if (gunTimerRef.current) { clearTimeout(gunTimerRef.current); gunTimerRef.current = null; }
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (ctx && master) {
        try {
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
          master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        } catch { /* noop */ }
        setTimeout(() => { ctx.close().catch(() => {}); }, 800);
      }
      ctxRef.current = null;
      masterRef.current = null;
      gainsRef.current = {};
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
    } catch { /* noop */ }
    if (level > 0 && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }, [level]);

  // Re-mix layers whenever the game environment shifts
  const mixKey = JSON.stringify(mix);
  useEffect(() => {
    const ctx = ctxRef.current;
    const gains = gainsRef.current;
    if (!ctx || !gains) return;
    const m = mixRef.current;
    const ramp = (node: GainNode | null | undefined, value: number, secs: number) => {
      if (!node) return;
      try {
        node.gain.cancelScheduledValues(ctx.currentTime);
        node.gain.setValueAtTime(node.gain.value, ctx.currentTime);
        node.gain.linearRampToValueAtTime(value, ctx.currentTime + secs);
      } catch { /* noop */ }
    };
    ramp(gains.hiss, m.hiss, 4);
    ramp(gains.rumble, m.rumble, 4);
    ramp(gains.crowd, m.crowd, 3.5);
    ramp(gains.wind, m.wind, 3.5);
    ramp(gains.drone, m.drone, 2.5);
    ramp(gains.policePulse, m.policePulse, 2.5);
    ramp(gains.siren, m.siren, 2);
    ramp(gains.gunfire, m.gunfire, 2);
  }, [mixKey]);
};
