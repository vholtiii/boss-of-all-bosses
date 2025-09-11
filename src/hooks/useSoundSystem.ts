import { useCallback, useRef, useEffect } from 'react';

export interface SoundConfig {
  volume: number;
  enabled: boolean;
}

export const useSoundSystem = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundConfigRef = useRef<SoundConfig>({ volume: 0.5, enabled: true });

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Generate sound using Web Audio API
  const playSound = useCallback((type: string, frequency?: number, duration?: number) => {
    if (!soundConfigRef.current.enabled || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Sound presets
    const soundPresets = {
      click: { freq: 800, duration: 0.1, type: 'square' },
      success: { freq: 1000, duration: 0.3, type: 'sine' },
      error: { freq: 300, duration: 0.5, type: 'sawtooth' },
      notification: { freq: 600, duration: 0.2, type: 'triangle' },
      combat: { freq: 200, duration: 0.8, type: 'square' },
      money: { freq: 1200, duration: 0.2, type: 'sine' },
      levelup: { freq: 1500, duration: 0.5, type: 'sine' },
      danger: { freq: 400, duration: 1.0, type: 'sawtooth' },
    };

    const preset = soundPresets[type as keyof typeof soundPresets] || soundPresets.click;
    
    oscillator.frequency.setValueAtTime(
      frequency || preset.freq, 
      audioContext.currentTime
    );
    oscillator.type = preset.type as OscillatorType;

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      soundConfigRef.current.volume, 
      audioContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001, 
      audioContext.currentTime + (duration || preset.duration)
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (duration || preset.duration));
  }, []);

  // Play multiple sounds in sequence
  const playSoundSequence = useCallback((sounds: string[]) => {
    sounds.forEach((sound, index) => {
      setTimeout(() => playSound(sound), index * 200);
    });
  }, [playSound]);

  // Update sound configuration
  const updateSoundConfig = useCallback((config: Partial<SoundConfig>) => {
    soundConfigRef.current = { ...soundConfigRef.current, ...config };
  }, []);

  return {
    playSound,
    playSoundSequence,
    updateSoundConfig,
    soundConfig: soundConfigRef.current,
  };
};
