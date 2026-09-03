import { useEffect, useRef } from 'react';
import type { SoundConfig } from './useSoundSystem';
import {
  computeAmbienceMix,
  computeAmbienceStingers,
  NEUTRAL_AMBIENCE,
  type AmbienceState,
  type AmbienceMix,
  type AmbienceStingers,
} from '@/lib/ambience-state';

interface UseAmbienceOptions {
  soundConfig: SoundConfig;
  /** Live game signals driving the mix */
  ambience?: Partial<AmbienceState>;
  /** Set false to fade the bed out (e.g. game over / back to menu) */
  active?: boolean;
  /** Optional stinger flags for one-shot turn-start accents */
  stingers?: Partial<AmbienceStingers>;
}

/**
 * Procedural city ambience bed. Fully synthesized (no assets), it loops
 * seamlessly and continuously re-mixes itself from the live game state:
 * heat drives sirens and a police throb, war/tension add distant gunfire and a
 * sub drone, prosperity swaps cold wind for crowd murmur, territory and
 * soldiers add crowd density / racket chatter, and industrial/dock districts
 * add a metallic clang layer.
 */
export const useAmbience = ({ soundConfig, ambience, active = true, stingers = {} }: UseAmbienceOptions) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  // Layer gain nodes
  const gainsRef = useRef<Record<string, GainNode | null>>({});
  const sirenTimerRef = useRef<number | null>(null);
  const gunTimerRef = useRef<number | null>(null);
  const clangTimerRef = useRef<number | null>(null);

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

      // --- Crowd murmur / distant radio (prosperity + turf + soldiers)
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

      // --- Industrial clang (factories / docks)
      const clangBus = ctx.createGain();
      clangBus.gain.value = m.industrial;
      const clangFilter = ctx.createBiquadFilter();
      clangFilter.type = 'bandpass';
      clangFilter.frequency.value = 2400;
      clangFilter.Q.value = 1.2;
      clangBus.connect(clangFilter); clangFilter.connect(master);
      gains.industrial = clangBus;

      // --- Gangster chatter / racket buzz (owned territory + soldiers)
      const chatterSrc = makeNoise(ctx, false);
      const chatterFilter = ctx.createBiquadFilter();
      chatterFilter.type = 'bandpass';
      chatterFilter.frequency.value = 680;
      chatterFilter.Q.value = 2.8;
      const chatterWobble = ctx.createOscillator();
      chatterWobble.type = 'sine';
      chatterWobble.frequency.value = 0.31;
      const chatterWobbleGain = ctx.createGain();
      chatterWobbleGain.gain.value = 90;
      chatterWobble.connect(chatterWobbleGain); chatterWobbleGain.connect(chatterFilter.frequency);
      const chatterGain = ctx.createGain();
      chatterGain.gain.value = m.chatter;
      chatterSrc.connect(chatterFilter); chatterFilter.connect(chatterGain); chatterGain.connect(master);
      chatterSrc.start(); chatterWobble.start();
      gains.chatter = chatterGain;

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

      const clangOnce = () => {
        const c = ctxRef.current;
        if (!c || disposed) return;
        const t = c.currentTime;
        const fundamental = 180 + Math.random() * 90;
        const clang = c.createOscillator();
        clang.type = 'sawtooth';
        clang.frequency.setValueAtTime(fundamental, t);
        const clangG = c.createGain();
        clangG.gain.setValueAtTime(0, t);
        clangG.gain.linearRampToValueAtTime(0.12, t + 0.02);
        clangG.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        const clangF = c.createBiquadFilter();
        clangF.type = 'bandpass';
        clangF.frequency.value = 1200;
        clangF.Q.value = 2.5;
        clang.connect(clangF); clangF.connect(clangG); clangG.connect(clangBus);
        clang.start(t); clang.stop(t + 1.6);
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

      const scheduleClang = () => {
        const baseGap = 12000;
        clangTimerRef.current = window.setTimeout(() => {
          if (disposed) return;
          if (mixRef.current.industrial > 0.02) clangOnce();
          scheduleClang();
        }, baseGap * (0.5 + Math.random() * 1.5));
      };
      scheduleClang();

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
      if (clangTimerRef.current) { clearTimeout(clangTimerRef.current); clangTimerRef.current = null; }
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
    ramp(gains.industrial, m.industrial, 3);
    ramp(gains.chatter, m.chatter, 3.5);
  }, [mixKey]);

  // --- One-shot accents when the environment *changes state* ---
  const prevRef = useRef<AmbienceState | null>(null);
  const stingerRef = useRef<AmbienceStingers | null>(null);
  const heatTier = (h: number) => (h >= 90 ? 4 : h >= 80 ? 3 : h >= 60 ? 2 : h >= 40 ? 1 : 0);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state;
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!prev || !ctx || !master || levelRef.current <= 0 || !reactive) return;

    const now = ctx.currentTime;

    /** Doppler siren sweeping past */
    const sirenPass = () => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(430, now + 2.6);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1200;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.7);
      g.gain.linearRampToValueAtTime(0.0001, now + 2.8);
      osc.connect(lp); lp.connect(g); g.connect(master);
      osc.start(now); osc.stop(now + 2.9);
    };

    /** Low transition hit (war on/off) */
    const transitionHit = (up: boolean) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(up ? 48 : 96, now);
      osc.frequency.exponentialRampToValueAtTime(up ? 96 : 40, now + 1.6);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.22, now + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      osc.connect(g); g.connect(master);
      osc.start(now); osc.stop(now + 2.3);
    };

    /** The city audibly opens up on a milestone */
    const citySwell = () => {
      const gains = gainsRef.current;
      const node = gains.crowd;
      if (!node) return;
      try {
        const target = mixRef.current.crowd;
        node.gain.cancelScheduledValues(now);
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.linearRampToValueAtTime(Math.min(0.6, target + 0.22), now + 1.2);
        node.gain.linearRampToValueAtTime(target, now + 5);
      } catch { /* noop */ }
    };

    /** Wind gust when things go cold */
    const windSurge = () => {
      const node = gainsRef.current.wind;
      if (!node) return;
      try {
        const target = mixRef.current.wind;
        node.gain.cancelScheduledValues(now);
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.linearRampToValueAtTime(Math.min(0.5, target + 0.25), now + 1.5);
        node.gain.linearRampToValueAtTime(target, now + 6);
      } catch { /* noop */ }
    };

    /** Metallic scrape when territory is lost */
    const territoryLostStinger = () => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 1.8);
      f.type = 'lowpass';
      f.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.16, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      osc.connect(f); f.connect(g); g.connect(master);
      osc.start(now); osc.stop(now + 2.4);
    };

    /** Bottle-clink / brief cheer for a recruit wave */
    const recruitWaveStinger = () => {
      const node = gainsRef.current.crowd;
      if (!node) return;
      try {
        const target = mixRef.current.crowd;
        node.gain.cancelScheduledValues(now);
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.linearRampToValueAtTime(Math.min(0.75, target + 0.35), now + 0.4);
        node.gain.linearRampToValueAtTime(target, now + 4);
      } catch { /* noop */ }
    };

    if (heatTier(state.heat) > heatTier(prev.heat)) sirenPass();
    if (state.atWar !== prev.atWar) transitionHit(state.atWar);
    if (state.phase > prev.phase) citySwell();
    if (prev.prosperity - state.prosperity > 0.18) windSurge();

    // Turn-start stingers passed from the parent
    const stingersNow = computeAmbienceStingers(state);
    const stingersPrev = stingerRef.current;
    stingerRef.current = stingersNow;
    if (stingersPrev) {
      if (stingersNow.warDeclared && !stingersPrev.warDeclared) transitionHit(true);
      if (stingersNow.territoryLost && !stingersPrev.territoryLost) territoryLostStinger();
      if (stingersNow.recruitWave && !stingersPrev.recruitWave) recruitWaveStinger();
      if (stingersNow.heatCritical && !stingersPrev.heatCritical) sirenPass();
      if (stingersNow.ricoStarted && !stingersPrev.ricoStarted) sirenPass();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.heat, state.atWar, state.phase, state.prosperity, state.ricoActive, state.lostTerritoryThisTurn, state.recruitedThisTurn, state.warDeclaredThisTurn]);
};
