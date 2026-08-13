import { useCallback, useRef, useEffect, useState } from 'react';

export interface SoundConfig {
  enabled: boolean;
  sfxVolume: number;       // 0-1, synthesized tones
  voiceVolume: number;     // 0-1, recorded clips / barks
  musicVolume: number;     // 0-1, menu music
  ambienceVolume: number;  // 0-1, looping city bed
}

const STORAGE_KEY = 'mafia-sound-settings';

const DEFAULT_CONFIG: SoundConfig = {
  enabled: true,
  sfxVolume: 0.5,
  voiceVolume: 0.5,
  musicVolume: 0.35,
  ambienceVolume: 0.3,
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

const loadConfig = (): SoundConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) || {};
      // Legacy shape (uiVolume / alertVolume / combatVolume)
      if (parsed.uiVolume !== undefined || parsed.alertVolume !== undefined || parsed.combatVolume !== undefined) {
        const sfxVolume = Math.max(parsed.uiVolume ?? 0.5, parsed.alertVolume ?? 0.5);
        const voiceVolume = parsed.combatVolume ?? 0.5;
        const migrated: SoundConfig = {
          enabled: parsed.enabled ?? true,
          sfxVolume: clamp01(sfxVolume),
          voiceVolume: clamp01(voiceVolume),
          musicVolume: clamp01(parsed.musicVolume ?? sfxVolume * 0.7),
          ambienceVolume: clamp01(parsed.ambienceVolume ?? 0.3),
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch {}
        return migrated;
      }
      const next: SoundConfig = {
        enabled: parsed.enabled ?? true,
        sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULT_CONFIG.sfxVolume),
        voiceVolume: clamp01(parsed.voiceVolume ?? DEFAULT_CONFIG.voiceVolume),
        // Previously music implicitly derived from sfx * 0.7
        musicVolume: clamp01(parsed.musicVolume ?? (parsed.sfxVolume ?? DEFAULT_CONFIG.sfxVolume) * 0.7),
        ambienceVolume: clamp01(parsed.ambienceVolume ?? DEFAULT_CONFIG.ambienceVolume),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
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

/**
 * Voice barks: spoken/recorded variants per event. Missing files are skipped
 * gracefully, so the layer can be filled in later without code changes.
 */
const BARKS: Record<string, string[]> = {
  hit_success: ['/sounds/barks/hit-success-1.mp3', '/sounds/barks/hit-success-2.mp3'],
  hit_fail: ['/sounds/barks/hit-fail-1.mp3', '/sounds/barks/hit-fail-2.mp3'],
  arrest: ['/sounds/barks/arrest-1.mp3', '/sounds/barks/arrest-2.mp3'],
  promotion: ['/sounds/barks/promotion-1.mp3', '/sounds/barks/promotion-2.mp3'],
  war: ['/sounds/barks/war-1.mp3', '/sounds/barks/war-2.mp3'],
};
const BARK_COOLDOWN_MS = 4000;

export const useSoundSystem = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const softClipRef = useRef<WaveShaperNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const audioFileCacheRef = useRef<Record<string, HTMLAudioElement>>({});
  const lastBarkRef = useRef<number>(0);
  const lastToneAtRef = useRef<Record<string, number>>({});
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
        const shaper = ctx.createWaveShaper();
        const curve = new Float32Array(1024);
        for (let i = 0; i < curve.length; i++) {
          const x = (i / (curve.length - 1)) * 2 - 1;
          curve[i] = Math.tanh(x * 1.3);
        }
        shaper.curve = curve;
        shaper.oversample = '2x';
        const master = ctx.createGain();
        master.gain.value = 0.8;
        shaper.connect(master);
        master.connect(ctx.destination);
        softClipRef.current = shaper;
        masterGainRef.current = master;
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
    // --- UI tone set -------------------------------------------------------
    hover: (ctx, d, v, t) => tone(ctx, d, 1500, 'sine', t, 0.03, v * 0.06),
    click: (ctx, d, v, t) => tone(ctx, d, 900, 'square', t, 0.05, v * 0.28),
    open: (ctx, d, v, t) => {
      tone(ctx, d, 420, 'triangle', t, 0.14, v * 0.28, 720);
      tone(ctx, d, 840, 'sine', t + 0.03, 0.12, v * 0.12);
    },
    close: (ctx, d, v, t) => tone(ctx, d, 700, 'triangle', t, 0.13, v * 0.24, 380),
    toggle: (ctx, d, v, t) => {
      tone(ctx, d, 620, 'square', t, 0.045, v * 0.20);
      tone(ctx, d, 980, 'square', t + 0.05, 0.05, v * 0.18);
    },
    deny: (ctx, d, v, t) => {
      tone(ctx, d, 150, 'square', t, 0.16, v * 0.40, 95);
      noiseBurst(ctx, d, t, 0.09, v * 0.22, 500);
    },

    // --- Core feedback -----------------------------------------------------
    success: (ctx, d, v, t) => {
      tone(ctx, d, 880, 'sine', t, 0.22, v * 0.45);
      tone(ctx, d, 1320, 'sine', t + 0.04, 0.20, v * 0.30);
    },
    error: (ctx, d, v, t) => {
      tone(ctx, d, 320, 'sawtooth', t, 0.32, v * 0.32, 220);
      tone(ctx, d, 322, 'sawtooth', t, 0.32, v * 0.22, 222);
    },
    notification: (ctx, d, v, t) => tone(ctx, d, 660, 'triangle', t, 0.18, v * 0.40, 880),
    bell: (ctx, d, v, t) => {
      tone(ctx, d, 1180, 'sine', t, 0.6, v * 0.30);
      tone(ctx, d, 1770, 'sine', t + 0.01, 0.45, v * 0.14);
    },
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

    // --- Turn flow ---------------------------------------------------------
    turn_start: (ctx, d, v, t) => {
      tone(ctx, d, 220, 'triangle', t, 0.45, v * 0.34);
      tone(ctx, d, 330, 'sine', t + 0.06, 0.38, v * 0.20);
    },
    turn_end: (ctx, d, v, t) => {
      tone(ctx, d, 330, 'sine', t, 0.30, v * 0.28);
      tone(ctx, d, 220, 'sine', t + 0.12, 0.40, v * 0.30);
    },

    // --- Economy -----------------------------------------------------------
    coin: (ctx, d, v, t) => {
      tone(ctx, d, 1600, 'sine', t, 0.10, v * 0.22);
      tone(ctx, d, 2400, 'sine', t + 0.05, 0.10, v * 0.16);
      tone(ctx, d, 3200, 'sine', t + 0.10, 0.12, v * 0.10);
    },
    buyout: (ctx, d, v, t) => {
      tone(ctx, d, 1500, 'square', t, 0.07, v * 0.22);
      tone(ctx, d, 900, 'sine', t + 0.06, 0.16, v * 0.28);
      noiseBurst(ctx, d, t + 0.16, 0.10, v * 0.30, 700); // stamp
      tone(ctx, d, 160, 'square', t + 0.16, 0.12, v * 0.30, 110);
    },
    upgrade: (ctx, d, v, t) => {
      tone(ctx, d, 520, 'triangle', t, 0.14, v * 0.30);
      tone(ctx, d, 780, 'triangle', t + 0.10, 0.14, v * 0.30);
      tone(ctx, d, 1040, 'sine', t + 0.20, 0.28, v * 0.34);
    },
    policy_set: (ctx, d, v, t) => {
      tone(ctx, d, 740, 'square', t, 0.05, v * 0.18);
      tone(ctx, d, 1110, 'sine', t + 0.06, 0.10, v * 0.20);
    },

    // --- Units -------------------------------------------------------------
    select: (ctx, d, v, t) => tone(ctx, d, 520, 'square', t, 0.04, v * 0.20),
    unit_move: (ctx, d, v, t) => {
      noiseBurst(ctx, d, t, 0.09, v * 0.28, 420);
      tone(ctx, d, 130, 'sine', t, 0.10, v * 0.22, 90);
    },

    // --- Threat / diplomacy ------------------------------------------------
    heat_warning: (ctx, d, v, t) => {
      tone(ctx, d, 480, 'sawtooth', t, 0.30, v * 0.28, 620);
      tone(ctx, d, 620, 'sawtooth', t + 0.28, 0.34, v * 0.26, 470);
    },
    war_declared: (ctx, d, v, t) => {
      tone(ctx, d, 110, 'sawtooth', t, 0.9, v * 0.40, 85);
      tone(ctx, d, 165, 'square', t + 0.02, 0.75, v * 0.22, 130);
      noiseBurst(ctx, d, t, 0.35, v * 0.30, 600);
    },
    pact_signed: (ctx, d, v, t) => {
      tone(ctx, d, 440, 'sine', t, 0.28, v * 0.32);
      tone(ctx, d, 660, 'sine', t + 0.10, 0.34, v * 0.30);
    },
    pact_broken: (ctx, d, v, t) => {
      tone(ctx, d, 415, 'sawtooth', t, 0.42, v * 0.30, 300);
      tone(ctx, d, 440, 'sawtooth', t, 0.42, v * 0.26, 320);
    },

    // --- Supply lines ------------------------------------------------------
    supply_connect: (ctx, d, v, t) => {
      tone(ctx, d, 180, 'sawtooth', t, 0.28, v * 0.26, 260);
      tone(ctx, d, 220, 'triangle', t + 0.18, 0.32, v * 0.30, 340);
      tone(ctx, d, 440, 'sine', t + 0.42, 0.55, v * 0.22);
    },
    supply_deal: (ctx, d, v, t) => {
      tone(ctx, d, 1600, 'square', t, 0.06, v * 0.22);
      tone(ctx, d, 1120, 'sine', t + 0.08, 0.12, v * 0.28);
      tone(ctx, d, 880, 'sine', t + 0.20, 0.18, v * 0.20);
    },

    // --- Escort ------------------------------------------------------------
    escort_attach: (ctx, d, v, t) => {
      tone(ctx, d, 620, 'square', t, 0.04, v * 0.20);
      tone(ctx, d, 820, 'square', t + 0.05, 0.04, v * 0.18);
    },
    escort_move: (ctx, d, v, t) => {
      noiseBurst(ctx, d, t, 0.08, v * 0.18, 260);
      tone(ctx, d, 160, 'sine', t + 0.02, 0.14, v * 0.22, 110);
      tone(ctx, d, 95, 'sine', t + 0.10, 0.18, v * 0.16, 70);
    },

    // --- Sitdowns ------------------------------------------------------------
    sitdown_proposed: (ctx, d, v, t) => {
      tone(ctx, d, 740, 'sine', t, 0.32, v * 0.26);
      tone(ctx, d, 1110, 'sine', t + 0.14, 0.24, v * 0.14);
    },
    sitdown_ready: (ctx, d, v, t) => {
      tone(ctx, d, 520, 'sine', t, 0.24, v * 0.28);
      tone(ctx, d, 660, 'sine', t + 0.08, 0.28, v * 0.24);
      tone(ctx, d, 880, 'sine', t + 0.18, 0.34, v * 0.20);
    },
    sitdown_accepted: (ctx, d, v, t) => {
      tone(ctx, d, 480, 'sine', t, 0.20, v * 0.32);
      tone(ctx, d, 720, 'sine', t + 0.12, 0.30, v * 0.28);
    },
    sitdown_declined: (ctx, d, v, t) => {
      tone(ctx, d, 340, 'sawtooth', t, 0.18, v * 0.26);
      tone(ctx, d, 290, 'sawtooth', t + 0.10, 0.22, v * 0.24);
    },
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
          audio.volume = clamp01(voiceVol);
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
    // Cheap de-dupe so rapid repeats (hover, move) don't stack into mush
    const now = Date.now();
    const minGap = type === 'hover' ? 60 : 25;
    if (now - (lastToneAtRef.current[type] ?? 0) < minGap) return;
    lastToneAtRef.current[type] = now;

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

  /** Random spoken variant for a big beat; rate-limited and silent if assets are absent. */
  const playBark = useCallback((event: keyof typeof BARKS | string) => {
    const variants = BARKS[event as string];
    if (!variants || variants.length === 0) return;
    const vol = getVoiceVolume();
    if (vol <= 0) return;
    const now = Date.now();
    if (now - lastBarkRef.current < BARK_COOLDOWN_MS) return;
    lastBarkRef.current = now;
    const url = variants[Math.floor(Math.random() * variants.length)];
    try {
      let audio = audioFileCacheRef.current[url];
      if (!audio) {
        audio = new Audio(url);
        audio.preload = 'auto';
        audioFileCacheRef.current[url] = audio;
      }
      audio.volume = clamp01(vol);
      audio.currentTime = 0;
      void audio.play().catch(() => {}); // missing asset → silent
    } catch {}
  }, [getVoiceVolume]);

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
    playBark,
    updateSoundConfig,
    soundConfig,
  };
};
