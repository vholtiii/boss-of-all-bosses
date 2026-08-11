import React from 'react';
import { motion } from 'framer-motion';
import { UNIT_SPRITES } from '@/lib/sprites';

interface CapoIconProps {
  x: number;
  y: number;
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  name: string;
  level: number;
  isPlayerFamily?: boolean;
  selected?: boolean;
  wounded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

import { FAMILY_COLORS } from '@/lib/period-theme';

const familyColors = FAMILY_COLORS;


const CapoIcon: React.FC<CapoIconProps> = ({
  x, y, family, name, level, isPlayerFamily = false, selected = false, wounded = false, onClick
}) => {
  const familyColor = familyColors[family];
  const capoImg = UNIT_SPRITES.capo;
  const size = 36;

  // Deterministic 0..1 phase offset per capo so stacks don't pulse in lockstep
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const idleDuration = wounded ? 5 : 3.8;
  const phaseDelay = -((Math.abs(h) % 1000) / 1000) * idleDuration;
  const idleAnimate = wounded
    ? { y: [0, 1, 0.6, 0], rotate: [0, 0, 0, 0], scale: [1, 1, 1, 1] }
    : { y: [0, -0.8, 0], rotate: [0, -0.4, 0], scale: [1, 1.02, 1] };


  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: selected ? 1.2 : 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* Selected pulse ring */}
      {selected && (
        <motion.circle
          cx={x} cy={y + 8} r={size / 2 + 8}
          fill="none" stroke="#FFD700" strokeWidth="2.5"
          animate={{ r: [size / 2 + 6, size / 2 + 11, size / 2 + 6], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Ground shadow */}
      <ellipse cx={x} cy={y + 11} rx={size * 0.40} ry={size * 0.15} fill="#000000" opacity="0.5" />
      {/* Family base disc */}
      <ellipse cx={x} cy={y + 11} rx={size * 0.33} ry={size * 0.12} fill={familyColor} opacity={selected ? 0.95 : 0.8} stroke="#0a0a0a" strokeWidth="0.75" />

      {/* Capo figure image with idle presence */}
      <motion.g
        animate={selected ? { y: 0, rotate: 0, scale: 1 } : idleAnimate}
        transition={selected ? { duration: 0.2 } : { duration: idleDuration, repeat: Infinity, ease: 'easeInOut', delay: phaseDelay }}
        style={{ transformOrigin: `${x}px ${y + size}px`, transformBox: 'fill-box' }}
      >
        <image
          href={capoImg}
          x={x - size / 2}
          y={y - size * 0.94}
          width={size}
          height={size * 1.25}
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: selected ? 'drop-shadow(0 0 8px #FFD700)' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.75))' }}
        />
      </motion.g>


      {/* Player family gold ring */}
      {isPlayerFamily && !selected && (
        <ellipse cx={x} cy={y + 11} rx={size * 0.42} ry={size * 0.16} fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.9" />
      )}

      {/* Level badge */}
      {level > 1 && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.4 }}
        >
          <circle cx={x + 14} cy={y - 14} r="10" fill={familyColor} stroke="#0a0a0a" strokeWidth="1.25" />
          <text x={x + 14} y={y - 10.5} textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold" className="select-none">
            {level}
          </text>
        </motion.g>
      )}

      {/* Wounded badge */}
      {wounded && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.5 }}
        >
          <circle cx={x - 14} cy={y - 14} r="10" fill="#DC2626" stroke="#0a0a0a" strokeWidth="1.25" />
          <text x={x - 14} y={y - 10.5} textAnchor="middle" fontSize="10" className="select-none">🩸</text>
        </motion.g>
      )}
    </motion.g>
  );
};

export default CapoIcon;
