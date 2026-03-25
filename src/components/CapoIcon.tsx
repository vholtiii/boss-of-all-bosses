import React from 'react';
import { motion } from 'framer-motion';
import capoImg from '@/assets/capo-figure.png';

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

const familyColors = {
  gambino: '#42D3F2',
  genovese: '#2AA63E',
  lucchese: '#4169E1',
  bonanno: '#DC143C',
  colombo: '#8A2BE2',
};

const CapoIcon: React.FC<CapoIconProps> = ({ 
  x, y, family, name, level, isPlayerFamily = false, selected = false, wounded = false, onClick 
}) => {
  const familyColor = familyColors[family];
  const size = 32;
  
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
          cx={x} cy={y + 2} r={size / 2 + 8}
          fill="none" stroke="#FFD700" strokeWidth="2.5"
          animate={{ r: [size / 2 + 6, size / 2 + 11, size / 2 + 6], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Family color glow */}
      <circle cx={x} cy={y + 2} r={size / 2 + 3} fill={familyColor} opacity={selected ? 0.5 : 0.3} />
      
      {/* Capo figure image */}
      <image
        href={capoImg}
        x={x - size / 2}
        y={y - size / 2 - 6}
        width={size}
        height={size * 1.4}
        style={{ filter: `drop-shadow(0 0 ${selected ? '8' : '4'}px ${selected ? '#FFD700' : familyColor})` }}
      />
      
      {/* Player family gold ring */}
      {isPlayerFamily && !selected && (
        <circle cx={x} cy={y + 2} r={size / 2 + 5} fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.8" />
      )}
      
      {/* Level badge */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
      >
        <circle cx={x + 14} cy={y - 14} r="10" fill={familyColor} stroke="#ffffff" strokeWidth="1" />
        <text x={x + 14} y={y - 10.5} textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold" className="select-none">
          {level}
        </text>
      </motion.g>
    </motion.g>
  );
};

export default CapoIcon;
