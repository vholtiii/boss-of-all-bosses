/**
 * Shared framer-motion presets. Keeps timing and easing consistent across
 * modals, panels, toasts, and docks. Use these instead of inline
 * initial/animate/exit objects for any new motion surface.
 *
 * All durations are tuned to feel snappy on a desktop game UI (~180-240ms).
 */

const EASE_OUT = [0.22, 1, 0.36, 1] as const; // crisp ease-out cubic-bezier

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: EASE_OUT },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.2, ease: EASE_OUT },
};

export const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.22, ease: EASE_OUT },
};

export const slideDown = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: EASE_OUT },
};

export const panelSlideLeft = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.24, ease: EASE_OUT },
};

export const panelSlideRight = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: { duration: 0.24, ease: EASE_OUT },
};
