import { useEffect, useRef, useCallback } from 'react';
import type { SoundConfig } from './useSoundSystem';

interface UseBgMusicOptions {
  src: string;
  soundConfig: SoundConfig;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export const useBgMusic = ({
  src,
  soundConfig,
  fadeInMs = 2000,
  fadeOutMs = 1000,
}: UseBgMusicOptions) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const disposedRef = useRef(false);
  const musicLevel = soundConfig.musicVolume ?? soundConfig.sfxVolume * 0.7;
  const targetVolume = soundConfig.enabled ? musicLevel : 0;

  // Fade helper
  const fadeTo = useCallback((target: number, durationMs: number) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    const audio = audioRef.current;
    if (!audio) return;

    const steps = 20;
    const stepMs = durationMs / steps;
    const diff = (target - audio.volume) / steps;

    let step = 0;
    fadeIntervalRef.current = window.setInterval(() => {
      step++;
      if (step >= steps) {
        audio.volume = Math.max(0, Math.min(1, target));
        if (target === 0) audio.pause();
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        return;
      }
      audio.volume = Math.max(0, Math.min(1, audio.volume + diff));
    }, stepMs);
  }, []);

  // Single mount effect: own the audio + autoplay-unlock listeners atomically
  useEffect(() => {
    disposedRef.current = false;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    let unlockClick: ((e: Event) => void) | null = null;
    let unlockKey: ((e: Event) => void) | null = null;

    const removeUnlockHandlers = () => {
      if (unlockClick) document.removeEventListener('click', unlockClick);
      if (unlockKey) document.removeEventListener('keydown', unlockKey);
      unlockClick = null;
      unlockKey = null;
    };

    audio.play().then(() => {
      if (disposedRef.current) return;
      fadeTo(targetVolume, fadeInMs);
    }).catch(() => {
      // Autoplay blocked — retry on first user interaction
      const handler = () => {
        removeUnlockHandlers();
        if (disposedRef.current) return;
        const a = audioRef.current;
        if (!a || a !== audio) return; // stale mount, skip
        a.play().then(() => {
          if (disposedRef.current) return;
          fadeTo(targetVolume, fadeInMs);
        }).catch(() => {});
      };
      unlockClick = handler;
      unlockKey = handler;
      document.addEventListener('click', handler, { once: true });
      document.addEventListener('keydown', handler, { once: true });
    });

    return () => {
      disposedRef.current = true;
      removeUnlockHandlers();
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // React to volume/mute changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || disposedRef.current) return;
    if (targetVolume <= 0) {
      fadeTo(0, 300);
    } else if (!audio.paused) {
      fadeTo(targetVolume, 300);
    } else {
      audio.play().then(() => {
        if (disposedRef.current) return;
        fadeTo(targetVolume, 300);
      }).catch(() => {});
    }
  }, [targetVolume, fadeTo]);

  // One-shot fade-out (does not mutate user soundConfig)
  const fadeOut = useCallback((durationMs: number = 1000) => {
    fadeTo(0, durationMs);
  }, [fadeTo]);

  return { fadeOut };
};
