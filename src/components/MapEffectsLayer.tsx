import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAMILY_COLORS } from '@/lib/period-theme';
import type { MapEffect } from '@/hooks/useMapEffects';

interface Props {
  effects: MapEffect[];
  getHexPosition: (q: number, r: number) => { x: number; y: number };
  getHexPoints: (cx: number, cy: number, radius: number) => string;
  hexRadius: number;
}

const formatMoney = (n: number) => {
  if (n >= 1000) return `+$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `+$${n}`;
};

const MapEffectsLayer: React.FC<Props> = ({
  effects,
  getHexPosition,
  getHexPoints,
  hexRadius,
}) => {
  // Stable particle angles per combat effect id
  const particleAngles = useMemo(() => {
    const map = new Map<string, number[]>();
    effects.filter(e => e.type === 'combat').forEach(e => {
      if (!map.has(e.id)) {
        map.set(e.id, Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2 + (e.id.length % 7) * 0.1));
      }
    });
    return map;
  }, [effects]);

  return (
    <g className="pointer-events-none map-effects-layer">
      <AnimatePresence>
        {effects.map(fx => {
          const { x, y } = getHexPosition(fx.q, fx.r);

          if (fx.type === 'capture' || fx.type === 'territoryFlash') {
            const color = fx.type === 'territoryFlash' && !fx.gained
              ? '#EF4444'
              : (FAMILY_COLORS[fx.family] || '#D4AF37');
            return (
              <g key={fx.id}>
                <motion.polygon
                  points={getHexPoints(x, y, hexRadius)}
                  fill={color}
                  initial={{ opacity: 0.85, scale: 0.3 }}
                  animate={{ opacity: [0.85, 0.45, 0], scale: [0.3, 1.05, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                <motion.polygon
                  points={getHexPoints(x, y, hexRadius + 3)}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  initial={{ opacity: 1, scale: 0.8 }}
                  animate={{ opacity: [1, 0.4, 0], scale: [0.8, 1.25, 1.4] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
              </g>
            );
          }

          if (fx.type === 'income') {
            return (
              <motion.text
                key={fx.id}
                x={x}
                y={y}
                textAnchor="middle"
                fill="#D4AF37"
                fontSize={11}
                fontWeight={800}
                fontFamily="'Courier New', monospace"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                initial={{ opacity: 0, y }}
                animate={{ opacity: [0, 1, 1, 0], y: [y, y - 10, y - 18, y - 26] }}
                transition={{ duration: 1.2, delay: (fx.delay || 0) / 1000, ease: 'easeOut' }}
              >
                {formatMoney(fx.amount)}
              </motion.text>
            );
          }

          if (fx.type === 'combat') {
            const tint = fx.playerLost ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
            const angles = particleAngles.get(fx.id) || [];
            return (
              <g key={fx.id}>
                <motion.polygon
                  points={getHexPoints(x, y, hexRadius)}
                  fill={tint}
                  initial={{ opacity: 0.75, scale: 0.72 }}
                  animate={{ opacity: [0.75, 0.28, 0], scale: [0.72, 1.08, 1] }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                <motion.polygon
                  points={getHexPoints(x, y, hexRadius + 4)}
                  fill="none"
                  stroke={tint}
                  strokeWidth={2.5}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: [0, 1, 0.45, 0], scale: [0.88, 1.08, 1.24, 1.4] }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                {angles.map((angle, i) => {
                  const dist = hexRadius * (i % 2 === 0 ? 1.7 : 1.35);
                  const tx = x + Math.cos(angle) * dist;
                  const ty = y + Math.sin(angle) * dist;
                  return (
                    <motion.line
                      key={`${fx.id}-p${i}`}
                      x1={x + Math.cos(angle) * (hexRadius * 0.35)}
                      y1={y + Math.sin(angle) * (hexRadius * 0.35)}
                      x2={x + Math.cos(angle) * (hexRadius * 0.35)}
                      y2={y + Math.sin(angle) * (hexRadius * 0.35)}
                      stroke={tint}
                      strokeWidth={i % 2 === 0 ? 2 : 1.25}
                      strokeLinecap="round"
                      initial={{ opacity: 0, x2: x, y2: y }}
                      animate={{ opacity: [0, 1, 0], x2: tx, y2: ty }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.025 }}
                    />
                  );
                })}
              </g>
            );
          }

          return null;
        })}
      </AnimatePresence>
    </g>
  );
};

export default MapEffectsLayer;
