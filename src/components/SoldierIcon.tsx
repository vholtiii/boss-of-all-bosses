import React from 'react';
import { motion } from 'framer-motion';

interface SoldierIconProps {
  x: number;
  y: number;
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  count: number;
  isPlayerFamily?: boolean;
  onClick?: () => void;
}

const familyColors = {
  gambino: '#42D3F2', // Light Blue
  genovese: '#2AA63E', // Green
  lucchese: '#4169E1', // Royal Blue
  bonanno: '#DC143C', // Crimson
  colombo: '#8A2BE2', // Blue Violet
};

const SoldierIcon: React.FC<SoldierIconProps> = ({ 
  x, 
  y, 
  family, 
  count, 
  isPlayerFamily = false,
  onClick 
}) => {
  const familyColor = familyColors[family];
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* Soldier Icon - Masked Figure */}
      <g transform={`translate(${x}, ${y})`}>
        {/* Base */}
        <rect
          x="-8"
          y="12"
          width="16"
          height="4"
          rx="2"
          fill="#404040"
          stroke="#606060"
          strokeWidth="0.5"
        />
        
        {/* Body */}
        <ellipse
          cx="0"
          cy="8"
          rx="6"
          ry="8"
          fill="#666666"
          stroke="#888888"
          strokeWidth="0.5"
        />
        
        {/* Head */}
        <ellipse
          cx="0"
          cy="0"
          rx="5"
          ry="6"
          fill="#666666"
          stroke="#888888"
          strokeWidth="0.5"
        />
        
        {/* Mask */}
        <ellipse
          cx="0"
          cy="-1"
          rx="4"
          ry="4"
          fill="#000000"
          stroke="#333333"
          strokeWidth="0.5"
        />
        
        {/* Eye holes */}
        <ellipse
          cx="-1.5"
          cy="-2"
          rx="1"
          ry="1.5"
          fill="#CCCCCC"
        />
        <ellipse
          cx="1.5"
          cy="-2"
          rx="1"
          ry="1.5"
          fill="#CCCCCC"
        />
        
        {/* Family color accent */}
        <circle
          cx="0"
          cy="8"
          r="3"
          fill={familyColor}
          opacity="0.3"
        />
        
        {/* Player family highlight */}
        {isPlayerFamily && (
          <circle
            cx="0"
            cy="8"
            r="4"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="1"
            opacity="0.8"
          />
        )}
      </g>
      
      {/* Soldier count badge */}
      {count > 1 && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.4 }}
        >
          <circle
            cx={x + 8}
            cy={y - 8}
            r="8"
            fill={familyColor}
            stroke="#ffffff"
            strokeWidth="1"
          />
          <text
            x={x + 8}
            y={y - 5}
            textAnchor="middle"
            fontSize="8"
            fill="#ffffff"
            fontWeight="bold"
            className="select-none"
          >
            {count}
          </text>
        </motion.g>
      )}
    </motion.g>
  );
};

export default SoldierIcon;
