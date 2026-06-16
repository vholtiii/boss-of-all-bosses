import { useCallback, useRef, useEffect, useState } from 'react';

export interface SoundConfig {
  enabled: boolean;
  sfxVolume: number;    // 0-1, synthesized voices
  voiceVolume: number;  // 0-1, recorded mp3 clips
}

const STORAGE_KEY = 'mafia-sound-settings';

const DEFAULT_CONFIG: SoundConfig = {
  enabled: true,
  sfxVolume: 0.5,
  voiceVolume: 0.5,
};

const loadConfig = (): SoundConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.uiVolume !== undefined || parsed.alertVolume !== undefined || parsed.combatVolume !== undefined)) {
        const sfxVolume = Math.max(parsed.uiVolume ?? 0.5, parsed.alertVolume ?? 0.5);
        const voiceVolume = parsed.combatVolume ?? 0.5;
        const migrated: SoundConfig = {
          enabled: parsed.enabled ?? true,
          sfxVolume,
          voiceVolume,
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch {}
        return migrated;
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
};

const SOUND_FILES: Record<string, string> = {
  hit_kill: '/sounds/gunshot-hit.mp3',
  assassin_kill: '/sounds/assassin-kill.mp3',
  capo_fail: '/sounds/capo-fail.mp3',
  extort_success: '/sounds/extortion-success.mp3',
  extort_fail: '/sounds/extortion-fail-voice.mp3',
  arrest: '/sounds/police-arrest.mp3',
  construction_start: '/sounds/construction-start.wav',
  construction_complete: '/sounds/construction-complete.mp3',
  put_out_hit: '/sounds/putting-out-a-hit.mp3',
  fortify: '/sounds/fortify.wav',
};
const FILE_ONLY_SOUNDS = new Set([
  'hit_kill', 'assassin_kill', 'capo_fail', 'extort_success',
  'arrest', 'construction_start', 'construction_complete',
  'put_out_hit', 'fortify',
]);

export const useSoundSystem = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const softClipRef = useRef<WaveShaperNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const audioFileCacheRef = useRef<Record<string, HTMLAudioElement>>({});
  const [soundConfig, setSoundConfig] = useState<SoundConfig>(loadConfig);
  const soundConfigRef = useRef(soundConfig);

  useEffect(() => { soundConfigRef.current = soundConfig; }, [soundConfig]);

  // Lazy graph init — only once
  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
        // Soft-clip curve to prevent layered triggers from popping
        const shaper = ctx.createWaveShaper();
        const curve = new Float32Array(1024);
        for (let i = 0; i < curve.length; i++) {
          const x = (i / (curve.length - 1)) * 2 - 1;
          curve[i] = Math.tanh(x * 1.3); // gentle saturation
        }
        shaper.curve = curve;
        shaper.oversample = '2x';
        const master = ctx.createGain();
        master.gain.value = 0.8;
        shaper.connect(master);
        master.connect(ctx.destination);
        softClipRef.current = shaper;
        masterGainRef.current = master;
        // Pre-build a half-second white-noise buffer for impacts
        const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noiseBufferRef.current = noise;
      } catch { return null; }
    }
    return audioContextRef.current;
  }, []);

  // Resume audio context on first user interaction (browser autoplay policy)
  useEffect(() => {
    const resume = () => {
      const ctx = ensureContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener('pointerdown', resume, opts);
    window.addEventListener('keydown', resume, opts);
    window.addEventListener('touchstart', resume, opts);
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
      window.removeEventListener('touchstart', resume);
    };
  }, [ensureContext]);

  const getVoiceVolume = useCallback((): number => {
    const cfg = soundConfigRef.current;
    return cfg.enabled ? cfg.voiceVolume : 0;
  }, []);

  const getSfxVolume = useCallback((): number => {
    const cfg = soundConfigRef.current;
    return cfg.enabled ? cfg.sfxVolume : 0;
  }, []);

  // --- Synth voices --------------------------------------------------------
  // Each voice receives (ctx, dest, vol, now) and renders one shot.

  type VoiceFn = (ctx: AudioContext, dest: AudioNode, vol: number, t: number) => void;

  const tone = (
    ctx: AudioContext, dest: AudioNode,
    freq: number, type: OscillatorType,
    start: number, dur: number, peak: number,
    glideTo?: number,
  ) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), start + dur);
    }
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak, start + Math.min(0.012, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  const noiseBurst = (
    ctx: AudioContext, dest: AudioNode,
    start: number, dur: number, peak: number,
    filterFreq = 1200,
  ) => {
    const buf = noiseBufferRef.current;
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'lowpass';
    bp.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(bp); bp.connect(g); g.connect(dest);
    src.start(start);
    src.stop(start + dur + 0.02);
  };

  const VOICES: Record<string, VoiceFn> = {
    click: (ctx, d, v, t) => tone(ctx, d, 900, 'square', t, 0.05, v * 0.35),
    success: (ctx, d, v, t) => {
      tone(ctx, d, 880, 'sine', t, 0.22, v * 0.45);
      tone(ctx, d, 1320, 'sine', t + 0.04, 0.20, v * 0.30);
    },
    error: (ctx, d, v, t) => {
      tone(ctx, d, 320, 'sawtooth', t, 0.32, v * 0.32, 220);
      tone(ctx, d, 322, 'sawtooth', t, 0.32, v * 0.22, 222);
    },
    notification: (ctx, d, v, t) => tone(ctx, d, 660, 'triangle', t, 0.18, v * 0.40, 880),
    combat: (ctx, d, v, t) => {
      tone(ctx, d, 180, 'square', t, 0.25, v * 0.40, 80);
      noiseBurst(ctx, d, t, 0.18, v * 0.5, 1800);
    },
    money: (ctx, d, v, t) => {
      tone(ctx, d, 1200, 'sine', t, 0.18, v * 0.35);
      tone(ctx, d, 1800, 'sine', t + 0.03, 0.16, v * 0.25);
    },
    levelup: (ctx, d, v, t) => {
      tone(ctx, d, 660, 'sine', t, 0.16, v * 0.4);
      tone(ctx, d, 880, 'sine', t + 0.10, 0.16, v * 0.4);
      tone(ctx, d, 1320, 'sine', t + 0.20, 0.30, v * 0.45);
    },
    danger: (ctx, d, v, t) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      const samples = 16;
      const curve = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        curve[i] = 380 + Math.sin((i / samples) * Math.PI * 4) * 60;
      }
      osc.frequency.setValueCurveAtTime(curve, t, 0.8);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v * 0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
      osc.connect(g); g.connect(d);
      osc.start(t);
      osc.stop(t + 0.9);
    },
    hit_success: (ctx, d, v, t) => {
      tone(ctx, d, 160, 'square', t, 0.45, v * 0.45, 70);
      noiseBurst(ctx, d, t, 0.22, v * 0.55, 1600);
    },
    hit_fail: (ctx, d, v, t) => {
      tone(ctx, d, 240, 'sawtooth', t, 0.55, v * 0.38, 140);
      noiseBurst(ctx, d, t + 0.05, 0.20, v * 0.35, 900);
    },
    extort_success: (ctx, d, v, t) => {
      tone(ctx, d, 1400, 'sine', t, 0.22, v * 0.4);
      tone(ctx, d, 2100, 'sine', t + 0.05, 0.18, v * 0.25);
    },
    extort_fail: (ctx, d, v, t) => tone(ctx, d, 220, 'sawtooth', t, 0.38, v * 0.38, 160),
  };

  const playSound = useCallback((type: string, _frequency?: number, _duration?: number) => {
    // File-based voices (mp3) on the voice channel
    const fileUrl = SOUND_FILES[type];
    if (fileUrl) {
      const voiceVol = getVoiceVolume();
      if (voiceVol > 0) {
        try {
          let audio = audioFileCacheRef.current[type];
          if (!audio) {
            audio = new Audio(fileUrl);
            audio.preload = 'auto';
            audioFileCacheRef.current[type] = audio;
          }
          audio.volume = Math.max(0, Math.min(1, voiceVol));
          audio.currentTime = 0;
          void audio.play().catch(() => {});
        } catch {}
      }
      if (FILE_ONLY_SOUNDS.has(type)) return;
    }

    const sfxVol = getSfxVolume();
    if (sfxVol <= 0) return;
    const ctx = ensureContext();
    if (!ctx || !softClipRef.current) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const voice = VOICES[type] || VOICES.click;
    try {
      voice(ctx, softClipRef.current, sfxVol, ctx.currentTime);
    } catch {}
  }, [getVoiceVolume, getSfxVolume, ensureContext]);

  const playSoundSequence = useCallback((sounds: string[]) => {
    sounds.forEach((sound, index) => {
      setTimeout(() => playSound(sound), index * 200);
    });
  }, [playSound]);

  const updateSoundConfig = useCallback((config: Partial<SoundConfig>) => {
    setSoundConfig(prev => {
      const next = { ...prev, ...config };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return {
    playSound,
    playSoundSequence,
    updateSoundConfig,
    soundConfig,
  };
};
