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

const PARTICLE_COUNT = 50;
const COLORS = [
  'rgba(255, 180, 60,',   // warm amber
  'rgba(255, 140, 40,',   // orange ember
  'rgba(200, 180, 160,',  // warm gray
  'rgba(180, 160, 140,',  // dusty brown
  'rgba(255, 100, 30,',   // hot ember
];

const AtmosphericParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animFrameRef = useRef<number>(0);

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

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMouse);

    // Init particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => createParticle(canvas.width, canvas.height, true));

    let lastTime = 0;
    const targetInterval = 1000 / 30; // ~30fps

    const animate = (timestamp: number) => {
      const delta = timestamp - lastTime;
      if (delta < targetInterval) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = (mouseRef.current.x - 0.5) * 15;
      const my = (mouseRef.current.y - 0.5) * 10;

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.time += p.swaySpeed;
        p.y -= p.speedY;
        p.x += Math.sin(p.time) * p.sway + p.speedX;

        // Parallax offset
        const px = p.x + mx * (p.size / 3);
        const py = p.y + my * (p.size / 3);

        // Draw
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.opacity})`;
        ctx.fill();

        // Glow for embers
        if (p.opacity > 0.25) {
          ctx.beginPath();
          ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color} ${p.opacity * 0.15})`;
          ctx.fill();
        }

        // Reset if off screen
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
      window.removeEventListener('mousemove', handleMouse);
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
