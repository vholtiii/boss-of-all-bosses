import { useCallback, useRef, useEffect, useState } from 'react';

export interface SoundConfig {
  enabled: boolean;
  uiVolume: number;      // 0-1
  alertVolume: number;    // 0-1
  combatVolume: number;   // 0-1
}

const STORAGE_KEY = 'mafia-sound-settings';

const DEFAULT_CONFIG: SoundConfig = {
  enabled: true,
  uiVolume: 0.5,
  alertVolume: 0.5,
  combatVolume: 0.5,
};

const loadConfig = (): SoundConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONFIG;
};

type SoundCategory = 'ui' | 'alert' | 'combat';

const SOUND_CATEGORIES: Record<string, SoundCategory> = {
  click: 'ui',
  success: 'alert',
  error: 'alert',
  notification: 'alert',
  danger: 'alert',
  combat: 'combat',
  hit_success: 'combat',
  hit_fail: 'combat',
  extort_success: 'combat',
  extort_fail: 'combat',
  money: 'combat',
  levelup: 'combat',
};

export const useSoundSystem = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundConfig, setSoundConfig] = useState<SoundConfig>(loadConfig);
  const soundConfigRef = useRef(soundConfig);

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    soundConfigRef.current = soundConfig;
  }, [soundConfig]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const getVolumeForSound = useCallback((type: string): number => {
    const cfg = soundConfigRef.current;
    if (!cfg.enabled) return 0;
    const category = SOUND_CATEGORIES[type] || 'ui';
    switch (category) {
      case 'ui': return cfg.uiVolume;
      case 'alert': return cfg.alertVolume;
      case 'combat': return cfg.combatVolume;
      default: return 0.5;
    }
  }, []);

  const playSound = useCallback((type: string, frequency?: number, duration?: number) => {
    const volume = getVolumeForSound(type);
    if (volume <= 0 || !audioContextRef.current) return;

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
      volume,
      audioContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + (duration || preset.duration)
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (duration || preset.duration));
  }, [getVolumeForSound]);

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
