import React from 'react';
import { motion } from 'framer-motion';
import soldierImg from '@/assets/soldier-figure.png';

interface SoldierIconProps {
  x: number;
  y: number;
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  count: number;
  isPlayerFamily?: boolean;
  onClick?: () => void;
}

const familyColors = {
  gambino: '#42D3F2',
  genovese: '#2AA63E',
  lucchese: '#4169E1',
  bonanno: '#DC143C',
  colombo: '#8A2BE2',
};

const SoldierIcon: React.FC<SoldierIconProps> = ({ 
  x, y, family, count, isPlayerFamily = false, onClick 
}) => {
  const familyColor = familyColors[family];
  const size = 28;
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* Family color glow */}
      <circle cx={x} cy={y + 2} r={size / 2 + 2} fill={familyColor} opacity="0.25" />
      
      {/* Soldier figure image */}
      <image
        href={soldierImg}
        x={x - size / 2}
        y={y - size / 2 - 4}
        width={size}
        height={size * 1.5}
        style={{ filter: `drop-shadow(0 0 3px ${familyColor})` }}
      />
      
      {/* Player family gold ring */}
      {isPlayerFamily && (
        <circle cx={x} cy={y + 2} r={size / 2 + 4} fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.8" />
      )}
      
      {/* Soldier count badge */}
      {count > 1 && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.4 }}
        >
          <circle cx={x + 12} cy={y - 12} r="8" fill={familyColor} stroke="#ffffff" strokeWidth="1" />
          <text x={x + 12} y={y - 8.5} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold" className="select-none">
            {count}
          </text>
        </motion.g>
      )}
    </motion.g>
  );
};

export default SoldierIcon;
