import { useCallback, useRef, useEffect, useState } from 'react';

export interface SoundConfig {
  enabled: boolean;
  sfxVolume: number;    // 0-1, synthesized beeps
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
      // Migrate legacy ui/alert/combat keys.
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

export const useSoundSystem = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioFileCacheRef = useRef<Record<string, HTMLAudioElement>>({});
  const [soundConfig, setSoundConfig] = useState<SoundConfig>(loadConfig);
  const soundConfigRef = useRef(soundConfig);

  useEffect(() => {
    soundConfigRef.current = soundConfig;
  }, [soundConfig]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const getVoiceVolume = useCallback((): number => {
    const cfg = soundConfigRef.current;
    return cfg.enabled ? cfg.voiceVolume : 0;
  }, []);

  const getSfxVolume = useCallback((): number => {
    const cfg = soundConfigRef.current;
    return cfg.enabled ? cfg.sfxVolume : 0;
  }, []);

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
  };

  // Sound types that should ONLY play their file (no synth fallback layered on top).
  const FILE_ONLY_SOUNDS = new Set(['hit_kill', 'assassin_kill', 'capo_fail', 'extort_success', 'arrest', 'construction_start', 'construction_complete', 'put_out_hit']);

  const playSound = useCallback((type: string, frequency?: number, duration?: number) => {
    // File-based sounds (voice channel)
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
      // Otherwise fall through to also play the synth preset for this type.
    }

    const sfxVol = getSfxVolume();
    if (sfxVol <= 0) return;
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const soundPresets: Record<string, { freq: number; duration: number; type: string }> = {
      click: { freq: 800, duration: 0.1, type: 'square' },
      success: { freq: 1000, duration: 0.3, type: 'sine' },
      error: { freq: 300, duration: 0.5, type: 'sawtooth' },
      notification: { freq: 600, duration: 0.2, type: 'triangle' },
      combat: { freq: 200, duration: 0.8, type: 'square' },
      money: { freq: 1200, duration: 0.2, type: 'sine' },
      levelup: { freq: 1500, duration: 0.5, type: 'sine' },
      danger: { freq: 400, duration: 1.0, type: 'sawtooth' },
      hit_success: { freq: 180, duration: 0.6, type: 'square' },
      hit_fail: { freq: 250, duration: 0.7, type: 'sawtooth' },
      extort_success: { freq: 1400, duration: 0.25, type: 'sine' },
      extort_fail: { freq: 200, duration: 0.4, type: 'sawtooth' },
    };

    const preset = soundPresets[type] || soundPresets.click;

    oscillator.frequency.setValueAtTime(
      frequency || preset.freq,
      audioContext.currentTime
    );
    oscillator.type = preset.type as OscillatorType;

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      sfxVol,
      audioContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + (duration || preset.duration)
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (duration || preset.duration));
  }, [getVoiceVolume, getSfxVolume]);

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
