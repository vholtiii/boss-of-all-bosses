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
  const startedRef = useRef(false);
  const musicLevel = soundConfig.musicVolume ?? soundConfig.sfxVolume * 0.7;
  const targetVolume = soundConfig.enabled ? musicLevel : 0;
  const targetVolumeRef = useRef(targetVolume);
  targetVolumeRef.current = targetVolume;

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
    startedRef.current = false;

    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0;
    audio.preload = 'auto';
    audio.src = src;
    audio.load();
    audioRef.current = audio;

    let unlockClick: ((e: Event) => void) | null = null;
    let unlockKey: ((e: Event) => void) | null = null;
    let unlockTouch: ((e: Event) => void) | null = null;

    const removeUnlockHandlers = () => {
      if (unlockClick) document.removeEventListener('click', unlockClick);
      if (unlockKey) document.removeEventListener('keydown', unlockKey);
      if (unlockTouch) document.removeEventListener('touchstart', unlockTouch);
      unlockClick = null;
      unlockKey = null;
      unlockTouch = null;
    };

    const tryPlay = () => {
      if (disposedRef.current || startedRef.current) return;
      const a = audioRef.current;
      if (!a || a !== audio) return;
      const p = a.play();
      if (!p) return;
      p.then(() => {
        if (disposedRef.current) return;
        startedRef.current = true;
        removeUnlockHandlers();
        fadeTo(targetVolumeRef.current, fadeInMs);
      }).catch(() => {
        // Autoplay blocked — wait for user interaction
        if (disposedRef.current || startedRef.current) return;
        if (unlockClick) return; // already listening
        const handler = () => {
          removeUnlockHandlers();
          tryPlay();
        };
        unlockClick = handler;
        unlockKey = handler;
        unlockTouch = handler;
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('keydown', handler, { once: true });
        document.addEventListener('touchstart', handler, { once: true });
      });
    };

    // Start immediately, but also once media is ready in case first play() rejected due to not-loaded
    tryPlay();
    const onCanPlay = () => tryPlay();
    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('loadeddata', onCanPlay);

    return () => {
      disposedRef.current = true;
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('loadeddata', onCanPlay);
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

  // React to volume/mute changes — only after playback has actually started
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || disposedRef.current) return;
    if (!startedRef.current) return; // mount effect will apply initial fade-in
    if (targetVolume <= 0) {
      fadeTo(0, 300);
    } else if (audio.paused) {
      audio.play().then(() => {
        if (disposedRef.current) return;
        fadeTo(targetVolume, 300);
      }).catch(() => {});
    } else {
      fadeTo(targetVolume, 300);
    }
  }, [targetVolume, fadeTo]);

  // One-shot fade-out (does not mutate user soundConfig)
  const fadeOut = useCallback((durationMs: number = 1000) => {
    fadeTo(0, durationMs);
  }, [fadeTo]);

  return { fadeOut };
};
