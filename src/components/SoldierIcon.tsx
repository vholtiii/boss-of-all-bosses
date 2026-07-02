import React from 'react';
import { motion } from 'framer-motion';
import soldierGambino from '@/assets/units/soldier-gambino.png';
import soldierGenovese from '@/assets/units/soldier-genovese.png';
import soldierLucchese from '@/assets/units/soldier-lucchese.png';
import soldierBonanno from '@/assets/units/soldier-bonanno.png';
import soldierColombo from '@/assets/units/soldier-colombo.png';

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

const soldierImages = {
  gambino: soldierGambino,
  genovese: soldierGenovese,
  lucchese: soldierLucchese,
  bonanno: soldierBonanno,
  colombo: soldierColombo,
};

const SoldierIcon: React.FC<SoldierIconProps> = ({
  x, y, family, count, isPlayerFamily = false, selected = false, markedForDeath = false, onClick
}) => {
  const familyColor = familyColors[family];
  const soldierImg = soldierImages[family];
  const size = 20;

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
          cx={x} cy={y + 2} r={size / 2 + 7}
          fill="none" stroke="#FFD700" strokeWidth="2"
          animate={{ r: [size / 2 + 5, size / 2 + 9, size / 2 + 5], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Family color glow */}
      <circle cx={x} cy={y + 2} r={size / 2 + 2} fill={familyColor} opacity={selected ? 0.5 : 0.25} />

      {/* Soldier figure image with idle breathing */}
      <motion.g
        animate={selected ? { y: 0, scale: 1 } : { y: [0, -0.6, 0], scale: [1, 1.015, 1] }}
        transition={selected ? { duration: 0.2 } : { duration: idleDuration, repeat: Infinity, ease: 'easeInOut', delay: phaseDelay }}
        style={{ transformOrigin: `${x}px ${y + size}px`, transformBox: 'fill-box' }}
      >
        <image
          href={soldierImg}
          x={x - size / 2}
          y={y - size / 2 - 4}
          width={size}
          height={size * 1.5}
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: `drop-shadow(0 0 ${selected ? '6' : '3'}px ${selected ? '#FFD700' : familyColor})` }}
        />
      </motion.g>


      {/* Player family gold ring */}
      {isPlayerFamily && !selected && (
        <circle cx={x} cy={y + 2} r={size / 2 + 4} fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.8" />
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
