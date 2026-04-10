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
  const targetVolume = soundConfig.enabled ? soundConfig.uiVolume * 0.4 : 0; // keep music subtle

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [src]);

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

  // Start playing & fade in on mount, fade out on unmount
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tryPlay = () => {
      audio.play().then(() => {
        fadeTo(targetVolume, fadeInMs);
      }).catch(() => {
        // Autoplay blocked — retry on first user interaction
        const handler = () => {
          audio.play().then(() => fadeTo(targetVolume, fadeInMs)).catch(() => {});
          document.removeEventListener('click', handler);
          document.removeEventListener('keydown', handler);
        };
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('keydown', handler, { once: true });
      });
    };

    tryPlay();

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.pause();
      audio.volume = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to volume/mute changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (targetVolume <= 0) {
      fadeTo(0, 300);
    } else if (!audio.paused) {
      fadeTo(targetVolume, 300);
    } else {
      audio.play().then(() => fadeTo(targetVolume, 300)).catch(() => {});
    }
  }, [targetVolume, fadeTo]);
};
