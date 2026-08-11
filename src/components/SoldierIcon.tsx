import React from 'react';
import { motion } from 'framer-motion';
import { UNIT_SPRITES } from '@/lib/sprites';

interface SoldierIconProps {
  x: number;
  y: number;
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  count: number;
  isPlayerFamily?: boolean;
  selected?: boolean;
  markedForDeath?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

import { FAMILY_COLORS } from '@/lib/period-theme';

const familyColors = FAMILY_COLORS;



const SoldierIcon: React.FC<SoldierIconProps> = ({
  x, y, family, count, isPlayerFamily = false, selected = false, markedForDeath = false, onClick
}) => {
  const familyColor = familyColors[family];
  const soldierImg = UNIT_SPRITES.soldier;
  const size = 26;

  // Deterministic 0..1 phase offset so stacked units don't pulse in lockstep
  const seedStr = `${family}-${x}-${y}`;
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  const idleDuration = 3.2;
  const phaseDelay = -((Math.abs(h) % 1000) / 1000) * idleDuration;


  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: selected ? 1.25 : 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* Selected pulse ring */}
      {selected && (
        <motion.circle
          cx={x} cy={y + 6} r={size / 2 + 7}
          fill="none" stroke="#FFD700" strokeWidth="2"
          animate={{ r: [size / 2 + 5, size / 2 + 9, size / 2 + 5], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Ground shadow */}
      <ellipse cx={x} cy={y + 9} rx={size * 0.42} ry={size * 0.16} fill="#000000" opacity="0.45" />
      {/* Family base disc */}
      <ellipse cx={x} cy={y + 9} rx={size * 0.34} ry={size * 0.13} fill={familyColor} opacity={selected ? 0.95 : 0.75} stroke="#0a0a0a" strokeWidth="0.75" />

      {/* Soldier figure image with idle breathing */}
      <motion.g
        animate={selected ? { y: 0, scale: 1 } : { y: [0, -0.6, 0], scale: [1, 1.015, 1] }}
        transition={selected ? { duration: 0.2 } : { duration: idleDuration, repeat: Infinity, ease: 'easeInOut', delay: phaseDelay }}
        style={{ transformOrigin: `${x}px ${y + size}px`, transformBox: 'fill-box' }}
      >
        <image
          href={soldierImg}
          x={x - size / 2}
          y={y - size * 0.92}
          width={size}
          height={size * 1.23}
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: selected ? 'drop-shadow(0 0 6px #FFD700)' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}
        />
      </motion.g>


      {/* Player family gold ring */}
      {isPlayerFamily && !selected && (
        <ellipse cx={x} cy={y + 9} rx={size * 0.44} ry={size * 0.17} fill="none" stroke="#D4AF37" strokeWidth="1.25" opacity="0.85" />
      )}

      {/* Soldier count badge */}
      {count > 1 && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.4 }}
        >
          <circle cx={x + 12} cy={y - 12} r="8" fill={familyColor} stroke="#0a0a0a" strokeWidth="1.25" />
          <text x={x + 12} y={y - 8.5} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold" className="select-none">
            {count}
          </text>
        </motion.g>
      )}

      {/* Marked for death skull badge */}
      {markedForDeath && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <circle cx={x - 12} cy={y - 12} r="8" fill="#8B0000" stroke="#0a0a0a" strokeWidth="1.25" />
          <text x={x - 12} y={y - 8.5} textAnchor="middle" fontSize="9" className="select-none">
            ☠️
          </text>
        </motion.g>
      )}
    </motion.g>
  );
};

export default SoldierIcon;
