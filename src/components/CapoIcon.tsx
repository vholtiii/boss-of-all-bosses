import React from 'react';
import { motion } from 'framer-motion';

interface CapoIconProps {
  x: number;
  y: number;
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  name: string;
  level: number;
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

const CapoIcon: React.FC<CapoIconProps> = ({ 
  x, 
  y, 
  family, 
  name,
  level,
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
      {/* Capo Icon - Minimalist Silhouette */}
      <g transform={`translate(${x}, ${y})`}>
        {/* Base */}
        <rect
          x="-10"
          y="14"
          width="20"
          height="4"
          rx="2"
          fill="#404040"
          stroke="#606060"
          strokeWidth="0.5"
        />
        
        {/* Body - Solid Black Silhouette */}
        <rect
          x="-8"
          y="2"
          width="16"
          height="12"
          rx="2"
          fill="#000000"
          stroke="#333333"
          strokeWidth="0.5"
        />
        
        {/* Head - White Void */}
        <ellipse
          cx="0"
          cy="-2"
          rx="5"
          ry="6"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="1"
        />
        
        {/* Fedora Hat - Wide Brim */}
        <ellipse
          cx="0"
          cy="-8"
          rx="7"
          ry="4"
          fill="#000000"
          stroke="#333333"
          strokeWidth="0.5"
        />
        
        {/* Hat Crown */}
        <ellipse
          cx="0"
          cy="-6"
          rx="5"
          ry="3"
          fill="#000000"
          stroke="#333333"
          strokeWidth="0.5"
        />
        
        {/* Sunglasses - Large Oval */}
        <ellipse
          cx="0"
          cy="-3"
          rx="4"
          ry="2.5"
          fill="#000000"
          stroke="#000000"
          strokeWidth="0.5"
        />
        
        {/* Tie - White Contrast */}
        <rect
          x="-1.5"
          y="4"
          width="3"
          height="8"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="0.3"
        />
        
        {/* Tie Knot */}
        <rect
          x="-1"
          y="3"
          width="2"
          height="2"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="0.3"
        />
        
        {/* Family color accent on tie */}
        <rect
          x="-1.2"
          y="4.5"
          width="2.4"
          height="1"
          fill={familyColor}
          opacity="0.8"
        />
        
        {/* Player family highlight */}
        {isPlayerFamily && (
          <circle
            cx="0"
            cy="8"
            r="6"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="1"
            opacity="0.8"
          />
        )}
      </g>
      
      {/* Capo level badge */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
      >
        <circle
          cx={x + 10}
          cy={y - 10}
          r="10"
          fill={familyColor}
          stroke="#ffffff"
          strokeWidth="1"
        />
        <text
          x={x + 10}
          y={y - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#ffffff"
          fontWeight="bold"
          className="select-none"
        >
          {level}
        </text>
      </motion.g>
    </motion.g>
  );
};

export default CapoIcon;
