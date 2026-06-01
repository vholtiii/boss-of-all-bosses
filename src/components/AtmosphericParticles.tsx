import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
  sway: number;
  swaySpeed: number;
  time: number;
}

const PARTICLE_COUNT = 25;
const COLORS = [
  'rgba(255, 180, 60,',
  'rgba(255, 140, 40,',
  'rgba(200, 180, 160,',
  'rgba(180, 160, 140,',
  'rgba(255, 100, 30,',
];

interface Props {
  /** Pause the animation loop (e.g. during transitions). */
  paused?: boolean;
}

const AtmosphericParticles: React.FC<Props> = ({ paused = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(canvas.width, canvas.height, true)
    );

    let lastTime = 0;
    const targetInterval = 1000 / 30;

    const animate = (timestamp: number) => {
      // Skip work entirely when paused or tab is hidden.
      if (pausedRef.current || document.hidden) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      const delta = timestamp - lastTime;
      if (delta < targetInterval) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.time += p.swaySpeed;
        p.y -= p.speedY;
        p.x += Math.sin(p.time) * p.sway + p.speedX;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.opacity})`;
        ctx.fill();

        if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particlesRef.current[i] = createParticle(canvas.width, canvas.height, false);
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
};

function createParticle(w: number, h: number, scatter: boolean): Particle {
  const isEmber = Math.random() < 0.3;
  return {
    x: Math.random() * w,
    y: scatter ? Math.random() * h : h + Math.random() * 20,
    size: isEmber ? 1 + Math.random() * 1.5 : 0.5 + Math.random() * 1,
    speedY: 0.2 + Math.random() * 0.6,
    speedX: (Math.random() - 0.5) * 0.15,
    opacity: isEmber ? 0.2 + Math.random() * 0.2 : 0.08 + Math.random() * 0.15,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    sway: 0.3 + Math.random() * 0.5,
    swaySpeed: 0.005 + Math.random() * 0.01,
    time: Math.random() * Math.PI * 2,
  };
}

export default AtmosphericParticles;
