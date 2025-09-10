import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Business } from '@/types/business';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface BusinessHex {
  q: number;
  r: number;
  s: number;
  businessId: string;
  businessType: Business['category'];
  isLegal: boolean;
  income: number;
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  isExtorted?: boolean;
  heatLevel?: number;
}

interface Territory {
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  businesses: BusinessHex[];
  capo?: {
    name: string;
    loyalty: number;
    strength: number;
    family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  };
}

interface MafiaHexGridProps {
  width: number;
  height: number;
  onBusinessClick: (business: BusinessHex) => void;
  selectedBusiness?: BusinessHex | null;
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
}

const MafiaHexGrid: React.FC<MafiaHexGridProps> = ({ 
  width, 
  height, 
  onBusinessClick, 
  selectedBusiness,
  playerFamily 
}) => {
  const hexRadius = 35;
  const hexWidth = hexRadius * 2;
  const hexHeight = Math.sqrt(3) * hexRadius;
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const minZoom = 0.5;
  const maxZoom = 3;
  const zoomStep = 0.25;

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + zoomStep, maxZoom));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - zoomStep, minZoom));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  // Famous mafia figures and capos
  const mafiaFigures = [
    { name: "Lucky Luciano", family: "genovese" },
    { name: "Al Capone", family: "gambino" },
    { name: "Carlo Gambino", family: "gambino" },
    { name: "John Gotti", family: "gambino" },
    { name: "Vincent Gigante", family: "genovese" },
    { name: "Tommy Lucchese", family: "lucchese" },
    { name: "Joe Bonanno", family: "bonanno" },
    { name: "Joe Colombo", family: "colombo" },
    { name: "Frank Costello", family: "genovese" },
    { name: "Meyer Lansky", family: "lucchese" }
  ];

  const generateTerritories = (): Territory[] => {
    console.log('🏙️ Generating territories...');
    const families: ('gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo')[] = ['gambino', 'genovese', 'lucchese', 'bonanno', 'colombo'];
    const legalBusinessTypes: Business['category'][] = ['restaurant', 'laundromat', 'casino', 'construction'];
    const illegalBusinessTypes: Business['category'][] = ['drug_trafficking', 'gambling', 'prostitution', 'loan_sharking'];
    
    // Define territories with their base positions and businesses arranged in hexagonal clusters
    const territories: Territory[] = [
      // Little Italy - Center (player starts here)
      {
        district: 'Little Italy',
        family: playerFamily,
        businesses: [
          { q: 0, r: 0, s: 0, businessId: 'li_1', businessType: 'restaurant', isLegal: true, income: 3500, district: 'Little Italy', family: playerFamily },
          { q: 1, r: -1, s: 0, businessId: 'li_2', businessType: 'laundromat', isLegal: true, income: 2800, district: 'Little Italy', family: playerFamily },
          { q: 0, r: 1, s: -1, businessId: 'li_3', businessType: 'loan_sharking', isLegal: false, income: 4200, district: 'Little Italy', family: playerFamily, isExtorted: true },
          { q: -1, r: 0, s: 1, businessId: 'li_4', businessType: 'casino', isLegal: true, income: 6500, district: 'Little Italy', family: playerFamily },
          { q: 1, r: 0, s: -1, businessId: 'li_5', businessType: 'construction', isLegal: true, income: 5200, district: 'Little Italy', family: playerFamily },
          { q: 0, r: -1, s: 1, businessId: 'li_6', businessType: 'gambling', isLegal: false, income: 3800, district: 'Little Italy', family: playerFamily },
          { q: -1, r: 1, s: 0, businessId: 'li_7', businessType: 'prostitution', isLegal: false, income: 4100, district: 'Little Italy', family: playerFamily, isExtorted: true },
          { q: 2, r: -1, s: -1, businessId: 'li_8', businessType: 'restaurant', isLegal: true, income: 3200, district: 'Little Italy', family: playerFamily },
          { q: 1, r: 1, s: -2, businessId: 'li_9', businessType: 'drug_trafficking', isLegal: false, income: 7800, district: 'Little Italy', family: playerFamily },
          { q: -1, r: -1, s: 2, businessId: 'li_10', businessType: 'laundromat', isLegal: true, income: 2600, district: 'Little Italy', family: playerFamily },
          // Neutral businesses
          { q: 2, r: 0, s: -2, businessId: 'li_n1', businessType: 'restaurant', isLegal: true, income: 2100, district: 'Little Italy', family: 'neutral' },
          { q: -2, r: 0, s: 2, businessId: 'li_n2', businessType: 'laundromat', isLegal: true, income: 1800, district: 'Little Italy', family: 'neutral' },
          { q: 0, r: 2, s: -2, businessId: 'li_n3', businessType: 'restaurant', isLegal: true, income: 1900, district: 'Little Italy', family: 'neutral' },
          { q: 0, r: -2, s: 2, businessId: 'li_n4', businessType: 'construction', isLegal: true, income: 2200, district: 'Little Italy', family: 'neutral' },
          { q: 2, r: 1, s: -3, businessId: 'li_n5', businessType: 'laundromat', isLegal: true, income: 1700, district: 'Little Italy', family: 'neutral' },
          { q: -2, r: 1, s: 1, businessId: 'li_n6', businessType: 'restaurant', isLegal: true, income: 1950, district: 'Little Italy', family: 'neutral' }
        ]
      },
      
      // Manhattan - Upper Left
      {
        district: 'Manhattan',
        family: families[0],
        businesses: [
          { q: -3, r: 0, s: 3, businessId: 'man_1', businessType: 'casino', isLegal: true, income: 8500, district: 'Manhattan', family: families[0] },
          { q: -2, r: -1, s: 3, businessId: 'man_2', businessType: 'construction', isLegal: true, income: 6200, district: 'Manhattan', family: families[0] },
          { q: -4, r: 1, s: 3, businessId: 'man_3', businessType: 'gambling', isLegal: false, income: 7800, district: 'Manhattan', family: families[0], isExtorted: true },
          { q: -3, r: 1, s: 2, businessId: 'man_4', businessType: 'prostitution', isLegal: false, income: 5500, district: 'Manhattan', family: families[0] },
          { q: -4, r: 0, s: 4, businessId: 'man_5', businessType: 'restaurant', isLegal: true, income: 4800, district: 'Manhattan', family: families[0] },
          { q: -2, r: 0, s: 2, businessId: 'man_6', businessType: 'laundromat', isLegal: true, income: 3400, district: 'Manhattan', family: families[0] },
          { q: -3, r: -1, s: 4, businessId: 'man_7', businessType: 'drug_trafficking', isLegal: false, income: 9200, district: 'Manhattan', family: families[0], isExtorted: true },
          { q: -5, r: 1, s: 4, businessId: 'man_8', businessType: 'loan_sharking', isLegal: false, income: 6800, district: 'Manhattan', family: families[0] },
          { q: -4, r: 2, s: 2, businessId: 'man_9', businessType: 'casino', isLegal: true, income: 7200, district: 'Manhattan', family: families[0] },
          { q: -2, r: 1, s: 1, businessId: 'man_10', businessType: 'construction', isLegal: true, income: 5800, district: 'Manhattan', family: families[0] },
          // Neutral businesses
          { q: -5, r: 0, s: 5, businessId: 'man_n1', businessType: 'restaurant', isLegal: true, income: 2300, district: 'Manhattan', family: 'neutral' },
          { q: -1, r: -1, s: 2, businessId: 'man_n2', businessType: 'laundromat', isLegal: true, income: 2000, district: 'Manhattan', family: 'neutral' },
          { q: -3, r: 2, s: 1, businessId: 'man_n3', businessType: 'construction', isLegal: true, income: 2100, district: 'Manhattan', family: 'neutral' },
          { q: -5, r: 2, s: 3, businessId: 'man_n4', businessType: 'restaurant', isLegal: true, income: 2250, district: 'Manhattan', family: 'neutral' },
          { q: -1, r: 0, s: 1, businessId: 'man_n5', businessType: 'laundromat', isLegal: true, income: 1900, district: 'Manhattan', family: 'neutral' },
          { q: -4, r: -1, s: 5, businessId: 'man_n6', businessType: 'restaurant', isLegal: true, income: 2050, district: 'Manhattan', family: 'neutral' }
        ]
      },
      
      // Bronx - Upper Right  
      {
        district: 'Bronx',
        family: families[1],
        businesses: [
          { q: 3, r: -3, s: 0, businessId: 'bx_1', businessType: 'restaurant', isLegal: true, income: 4100, district: 'Bronx', family: families[1] },
          { q: 4, r: -3, s: -1, businessId: 'bx_2', businessType: 'drug_trafficking', isLegal: false, income: 9200, district: 'Bronx', family: families[1], isExtorted: true },
          { q: 2, r: -2, s: 0, businessId: 'bx_3', businessType: 'laundromat', isLegal: true, income: 3300, district: 'Bronx', family: families[1] },
          { q: 3, r: -2, s: -1, businessId: 'bx_4', businessType: 'gambling', isLegal: false, income: 6800, district: 'Bronx', family: families[1] },
          { q: 5, r: -4, s: -1, businessId: 'bx_5', businessType: 'casino', isLegal: true, income: 7500, district: 'Bronx', family: families[1] },
          { q: 4, r: -2, s: -2, businessId: 'bx_6', businessType: 'construction', isLegal: true, income: 5600, district: 'Bronx', family: families[1] },
          { q: 2, r: -3, s: 1, businessId: 'bx_7', businessType: 'prostitution', isLegal: false, income: 4800, district: 'Bronx', family: families[1], isExtorted: true },
          { q: 5, r: -3, s: -2, businessId: 'bx_8', businessType: 'loan_sharking', isLegal: false, income: 6200, district: 'Bronx', family: families[1] },
          { q: 3, r: -4, s: 1, businessId: 'bx_9', businessType: 'restaurant', isLegal: true, income: 3900, district: 'Bronx', family: families[1] },
          { q: 4, r: -4, s: 0, businessId: 'bx_10', businessType: 'gambling', isLegal: false, income: 7100, district: 'Bronx', family: families[1] },
          // Neutral businesses
          { q: 1, r: -2, s: 1, businessId: 'bx_n1', businessType: 'restaurant', isLegal: true, income: 2100, district: 'Bronx', family: 'neutral' },
          { q: 2, r: -4, s: 2, businessId: 'bx_n2', businessType: 'laundromat', isLegal: true, income: 1950, district: 'Bronx', family: 'neutral' },
          { q: 5, r: -2, s: -3, businessId: 'bx_n3', businessType: 'construction', isLegal: true, income: 2200, district: 'Bronx', family: 'neutral' },
          { q: 1, r: -3, s: 2, businessId: 'bx_n4', businessType: 'restaurant', isLegal: true, income: 2050, district: 'Bronx', family: 'neutral' },
          { q: 6, r: -4, s: -2, businessId: 'bx_n5', businessType: 'laundromat', isLegal: true, income: 1850, district: 'Bronx', family: 'neutral' },
          { q: 4, r: -1, s: -3, businessId: 'bx_n6', businessType: 'restaurant', isLegal: true, income: 2000, district: 'Bronx', family: 'neutral' }
        ]
      },
      
      // Brooklyn - Lower Right
      {
        district: 'Brooklyn', 
        family: families[2],
        businesses: [
          { q: 3, r: 0, s: -3, businessId: 'bk_1', businessType: 'construction', isLegal: true, income: 7200, district: 'Brooklyn', family: families[2] },
          { q: 4, r: 0, s: -4, businessId: 'bk_2', businessType: 'casino', isLegal: true, income: 8800, district: 'Brooklyn', family: families[2] },
          { q: 2, r: 1, s: -3, businessId: 'bk_3', businessType: 'loan_sharking', isLegal: false, income: 5200, district: 'Brooklyn', family: families[2] },
          { q: 3, r: 1, s: -4, businessId: 'bk_4', businessType: 'prostitution', isLegal: false, income: 4900, district: 'Brooklyn', family: families[2], isExtorted: true },
          { q: 5, r: 0, s: -5, businessId: 'bk_5', businessType: 'restaurant', isLegal: true, income: 4300, district: 'Brooklyn', family: families[2] },
          { q: 4, r: 1, s: -5, businessId: 'bk_6', businessType: 'drug_trafficking', isLegal: false, income: 8600, district: 'Brooklyn', family: families[2], isExtorted: true },
          { q: 2, r: 0, s: -2, businessId: 'bk_7', businessType: 'laundromat', isLegal: true, income: 3100, district: 'Brooklyn', family: families[2] },
          { q: 3, r: 2, s: -5, businessId: 'bk_8', businessType: 'gambling', isLegal: false, income: 6500, district: 'Brooklyn', family: families[2] },
          { q: 5, r: 1, s: -6, businessId: 'bk_9', businessType: 'casino', isLegal: true, income: 7800, district: 'Brooklyn', family: families[2] },
          { q: 4, r: 2, s: -6, businessId: 'bk_10', businessType: 'construction', isLegal: true, income: 6800, district: 'Brooklyn', family: families[2] },
          // Neutral businesses
          { q: 1, r: 0, s: -1, businessId: 'bk_n1', businessType: 'restaurant', isLegal: true, income: 2250, district: 'Brooklyn', family: 'neutral' },
          { q: 2, r: 2, s: -4, businessId: 'bk_n2', businessType: 'laundromat', isLegal: true, income: 1900, district: 'Brooklyn', family: 'neutral' },
          { q: 6, r: 0, s: -6, businessId: 'bk_n3', businessType: 'construction', isLegal: true, income: 2100, district: 'Brooklyn', family: 'neutral' },
          { q: 1, r: 1, s: -2, businessId: 'bk_n4', businessType: 'restaurant', isLegal: true, income: 2200, district: 'Brooklyn', family: 'neutral' },
          { q: 5, r: 2, s: -7, businessId: 'bk_n5', businessType: 'laundromat', isLegal: true, income: 1800, district: 'Brooklyn', family: 'neutral' },
          { q: 3, r: -1, s: -2, businessId: 'bk_n6', businessType: 'restaurant', isLegal: true, income: 2050, district: 'Brooklyn', family: 'neutral' }
        ]
      },
      
      // Queens - Right Side
      {
        district: 'Queens',
        family: families[3],
        businesses: [
          { q: 0, r: 3, s: -3, businessId: 'q_1', businessType: 'restaurant', isLegal: true, income: 3800, district: 'Queens', family: families[3] },
          { q: 1, r: 3, s: -4, businessId: 'q_2', businessType: 'laundromat', isLegal: true, income: 2900, district: 'Queens', family: families[3] },
          { q: -1, r: 4, s: -3, businessId: 'q_3', businessType: 'drug_trafficking', isLegal: false, income: 8900, district: 'Queens', family: families[3], isExtorted: true },
          { q: 0, r: 4, s: -4, businessId: 'q_4', businessType: 'casino', isLegal: true, income: 7600, district: 'Queens', family: families[3] },
          { q: 2, r: 3, s: -5, businessId: 'q_5', businessType: 'construction', isLegal: true, income: 5400, district: 'Queens', family: families[3] },
          { q: -1, r: 5, s: -4, businessId: 'q_6', businessType: 'gambling', isLegal: false, income: 6300, district: 'Queens', family: families[3] },
          { q: 1, r: 4, s: -5, businessId: 'q_7', businessType: 'prostitution', isLegal: false, income: 4600, district: 'Queens', family: families[3], isExtorted: true },
          { q: -2, r: 5, s: -3, businessId: 'q_8', businessType: 'loan_sharking', isLegal: false, income: 5800, district: 'Queens', family: families[3] },
          { q: 0, r: 5, s: -5, businessId: 'q_9', businessType: 'restaurant', isLegal: true, income: 4000, district: 'Queens', family: families[3] },
          { q: 2, r: 4, s: -6, businessId: 'q_10', businessType: 'laundromat', isLegal: true, income: 3200, district: 'Queens', family: families[3] },
          // Neutral businesses
          { q: -1, r: 3, s: -2, businessId: 'q_n1', businessType: 'restaurant', isLegal: true, income: 2100, district: 'Queens', family: 'neutral' },
          { q: 1, r: 2, s: -3, businessId: 'q_n2', businessType: 'laundromat', isLegal: true, income: 1950, district: 'Queens', family: 'neutral' },
          { q: -2, r: 4, s: -2, businessId: 'q_n3', businessType: 'construction', isLegal: true, income: 2250, district: 'Queens', family: 'neutral' },
          { q: 3, r: 3, s: -6, businessId: 'q_n4', businessType: 'restaurant', isLegal: true, income: 2000, district: 'Queens', family: 'neutral' },
          { q: 0, r: 6, s: -6, businessId: 'q_n5', businessType: 'laundromat', isLegal: true, income: 1850, district: 'Queens', family: 'neutral' },
          { q: 1, r: 5, s: -6, businessId: 'q_n6', businessType: 'restaurant', isLegal: true, income: 2150, district: 'Queens', family: 'neutral' }
        ]
      },
      
      // Staten Island - Lower Left
      {
        district: 'Staten Island',
        family: families[4],
        businesses: [
          { q: -3, r: 3, s: 0, businessId: 'si_1', businessType: 'construction', isLegal: true, income: 5800, district: 'Staten Island', family: families[4] },
          { q: -4, r: 3, s: 1, businessId: 'si_2', businessType: 'casino', isLegal: true, income: 7500, district: 'Staten Island', family: families[4] },
          { q: -2, r: 3, s: -1, businessId: 'si_3', businessType: 'gambling', isLegal: false, income: 6200, district: 'Staten Island', family: families[4] },
          { q: -3, r: 4, s: -1, businessId: 'si_4', businessType: 'restaurant', isLegal: true, income: 4200, district: 'Staten Island', family: families[4] },
          { q: -5, r: 4, s: 1, businessId: 'si_5', businessType: 'drug_trafficking', isLegal: false, income: 8400, district: 'Staten Island', family: families[4], isExtorted: true },
          { q: -4, r: 4, s: 0, businessId: 'si_6', businessType: 'laundromat', isLegal: true, income: 3000, district: 'Staten Island', family: families[4] },
          { q: -2, r: 4, s: -2, businessId: 'si_7', businessType: 'prostitution', isLegal: false, income: 4700, district: 'Staten Island', family: families[4] },
          { q: -3, r: 5, s: -2, businessId: 'si_8', businessType: 'loan_sharking', isLegal: false, income: 5900, district: 'Staten Island', family: families[4], isExtorted: true },
          { q: -5, r: 5, s: 0, businessId: 'si_9', businessType: 'casino', isLegal: true, income: 7100, district: 'Staten Island', family: families[4] },
          { q: -4, r: 5, s: -1, businessId: 'si_10', businessType: 'construction', isLegal: true, income: 6400, district: 'Staten Island', family: families[4] },
          // Neutral businesses
          { q: -1, r: 3, s: -2, businessId: 'si_n1', businessType: 'restaurant', isLegal: true, income: 2200, district: 'Staten Island', family: 'neutral' },
          { q: -2, r: 2, s: 0, businessId: 'si_n2', businessType: 'laundromat', isLegal: true, income: 1900, district: 'Staten Island', family: 'neutral' },
          { q: -5, r: 3, s: 2, businessId: 'si_n3', businessType: 'construction', isLegal: true, income: 2100, district: 'Staten Island', family: 'neutral' },
          { q: -1, r: 4, s: -3, businessId: 'si_n4', businessType: 'restaurant', isLegal: true, income: 2050, district: 'Staten Island', family: 'neutral' },
          { q: -6, r: 5, s: 1, businessId: 'si_n5', businessType: 'laundromat', isLegal: true, income: 1850, district: 'Staten Island', family: 'neutral' },
          { q: -3, r: 6, s: -3, businessId: 'si_n6', businessType: 'restaurant', isLegal: true, income: 2000, district: 'Staten Island', family: 'neutral' }
        ]
      }
    ];

    // Add capos to some territories
    territories.forEach((territory) => {
      if (Math.random() > 0.4 && territory.family !== 'neutral') {
        const availableFigures = mafiaFigures.filter(f => f.family === territory.family);
        if (availableFigures.length > 0) {
          const figure = availableFigures[Math.floor(Math.random() * availableFigures.length)];
          territory.capo = {
            name: figure.name,
            loyalty: Math.floor(Math.random() * 40) + 60,
            strength: Math.floor(Math.random() * 50) + 50,
            family: territory.family as 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo'
          };
        }
      }
    });

    console.log('🏙️ Generated territories:', territories.length);
    territories.forEach(t => {
      console.log(`📍 ${t.district}: ${t.businesses.length} businesses (${t.businesses.filter(b => b.family === 'neutral').length} neutral)`);
    });
    return territories;
  };

  const [territories, setTerritories] = useState<Territory[]>(generateTerritories);
  
  // Force refresh of territories
  useEffect(() => {
    setTerritories(generateTerritories());
  }, [playerFamily]);
  
  // Flatten all businesses for easier rendering
  const allBusinesses = territories.flatMap(t => t.businesses);
  
  console.log('🎯 Total businesses to render:', allBusinesses.length);
  console.log('🎯 Neutral businesses:', allBusinesses.filter(b => b.family === 'neutral').length);

  const hexToPixel = (business: BusinessHex) => {
    const x = hexRadius * (3/2 * business.q);
    const y = hexRadius * (Math.sqrt(3)/2 * business.q + Math.sqrt(3) * business.r);
    return { x, y };
  };

  const getFamilyColor = (family: string) => {
    switch (family) {
      case 'gambino': return 'fill-families-gambino';
      case 'genovese': return 'fill-families-genovese';
      case 'lucchese': return 'fill-families-lucchese';
      case 'bonanno': return 'fill-families-bonanno';
      case 'colombo': return 'fill-families-colombo';
      case 'neutral': return 'fill-muted';
      default: return 'fill-mafia-smoke';
    }
  };

  const getBusinessIcon = (business: BusinessHex) => {
    const icons = {
      restaurant: '🍝',
      laundromat: '🧺',
      casino: '🎰',
      construction: '🏗️',
      drug_trafficking: '💊',
      gambling: '🎲',
      prostitution: '💃',
      loan_sharking: '💰'
    };
    return icons[business.businessType];
  };

  const getBusinessBorderColor = (business: BusinessHex) => {
    if (business.isLegal) {
      return 'stroke-green-400';
    } else {
      return business.isExtorted ? 'stroke-red-500' : 'stroke-orange-400';
    }
  };

  // Get territory center for capo placement
  const getTerritoryCenter = (territory: Territory) => {
    if (territory.businesses.length === 0) return { x: 0, y: 0 };
    
    const avgQ = territory.businesses.reduce((sum, b) => sum + b.q, 0) / territory.businesses.length;
    const avgR = territory.businesses.reduce((sum, b) => sum + b.r, 0) / territory.businesses.length;
    
    const x = hexRadius * (3/2 * avgQ);
    const y = hexRadius * (Math.sqrt(3)/2 * avgQ + Math.sqrt(3) * avgR);
    return { x, y };
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-noir-dark rounded-lg border-2 border-noir-light">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoomLevel >= maxZoom}
          className="w-10 h-10 p-0 bg-background/90 hover:bg-background border-mafia-gold/30"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoomLevel <= minZoom}
          className="w-10 h-10 p-0 bg-background/90 hover:bg-background border-mafia-gold/30"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomReset}
          className="w-10 h-10 p-0 bg-background/90 hover:bg-background border-mafia-gold/30"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`-600 -500 1200 1000`}
        className="absolute inset-0"
      >
        <defs>
          <filter id="mafiaGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <pattern id="pinstripe" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="rgba(0,0,0,0.1)"/>
            <rect width="1" height="4" fill="rgba(255,255,255,0.05)"/>
          </pattern>
        </defs>
        
        {/* Zoomable content group */}
        <g transform={`scale(${zoomLevel})`}>
        
        {/* Render territory boundaries first (lighter background) */}
        {territories.map((territory, territoryIndex) => {
          const center = getTerritoryCenter(territory);
          return (
            <g key={`territory-${territoryIndex}`}>
              <circle
                cx={center.x}
                cy={center.y}
                r={hexRadius * 2.5}
                className={cn(
                  getFamilyColor(territory.family),
                  'opacity-20 stroke-noir-light stroke-1'
                )}
              />
              
              {/* Territory label with background */}
              <rect
                x={center.x - 60}
                y={center.y + hexRadius * 3 - 12}
                width="120"
                height="20"
                rx="10"
                className="fill-background/80 stroke-border stroke-1"
              />
              <text
                x={center.x}
                y={center.y + hexRadius * 3 + 2}
                textAnchor="middle"
                className="text-base fill-foreground select-none font-source font-bold drop-shadow-lg"
              >
                {territory.district}
              </text>
              
              {/* Capo indicator for territory */}
              {territory.capo && (
                <g>
                  <circle
                    cx={center.x}
                    cy={center.y - hexRadius * 2.8}
                    r="12"
                    className={cn(
                      'stroke-2',
                      `fill-families-${territory.capo.family}`,
                      `stroke-families-${territory.capo.family}`
                    )}
                  />
                  <text
                    x={center.x}
                    y={center.y - hexRadius * 2.5}
                    textAnchor="middle"
                    className="text-sm font-bold fill-background select-none"
                  >
                    👤
                  </text>
                  <text
                    x={center.x}
                    y={center.y - hexRadius * 2}
                    textAnchor="middle"
                    className="text-xs fill-foreground select-none"
                  >
                    {territory.capo.name.split(' ')[0]}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        
        {/* Render business hexagons */}
        {allBusinesses.map((business, index) => {
          const { x, y } = hexToPixel(business);
          const isSelected = selectedBusiness && 
            selectedBusiness.businessId === business.businessId;
          const isPlayerBusiness = business.family === playerFamily;
          
          return (
            <g key={business.businessId} className="cursor-pointer">
              <polygon
                points={`
                  ${x + hexRadius},${y}
                  ${x + hexRadius/2},${y + hexHeight/2}
                  ${x - hexRadius/2},${y + hexHeight/2}
                  ${x - hexRadius},${y}
                  ${x - hexRadius/2},${y - hexHeight/2}
                  ${x + hexRadius/2},${y - hexHeight/2}
                `}
                className={cn(
                  getFamilyColor(business.family),
                  'stroke-2 transition-all duration-300',
                  getBusinessBorderColor(business),
                  isSelected && 'stroke-mafia-gold stroke-4 filter brightness-125',
                  isPlayerBusiness && 'stroke-mafia-gold stroke-3',
                  'hover:stroke-mafia-gold hover:brightness-110'
                )}
                filter={isSelected ? "url(#mafiaGlow)" : undefined}
                onClick={() => onBusinessClick(business)}
              />
              
              {/* Business icon */}
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                className="text-lg select-none pointer-events-none"
              >
                {getBusinessIcon(business)}
              </text>
              
              {/* Legal/Illegal indicator */}
              <circle
                cx={x - 15}
                cy={y - 15}
                r="4"
                className={cn(
                  business.isLegal ? 'fill-green-400' : 'fill-red-400',
                  'stroke-background stroke-1'
                )}
              />
              
              {/* Extortion indicator */}
              {business.isExtorted && (
                <circle
                  cx={x + 15}
                  cy={y - 15}
                  r="4"
                  className="fill-yellow-400 stroke-background stroke-1"
                />
              )}
              
              {/* Income display */}
              <text
                x={x}
                y={y + 20}
                textAnchor="middle"
                className="text-xs fill-muted-foreground select-none opacity-70"
              >
                ${(business.income / 1000).toFixed(1)}k
              </text>
            </g>
          );
        })}
        
        {/* Territory names */}
        {territories.map((territory, territoryIndex) => {
          // Calculate center position for each territory
          const centerBusiness = territory.businesses.find(b => b.family === territory.family);
          if (!centerBusiness) return null;
          
          const centerX = (centerBusiness.q * (hexWidth * 0.75)) + width / 2;
          const centerY = (centerBusiness.r * hexHeight + centerBusiness.q * (hexHeight / 2)) + height / 2;
          
          const familyColors = {
            gambino: '#8B5A3C',
            genovese: '#1E3A8A', 
            lucchese: '#7C2D12',
            bonanno: '#166534',
            colombo: '#7C1D6F',
            neutral: '#6B7280'
          };
          
          return (
            <g key={`territory-label-${territoryIndex}`}>
              {/* Background for better text readability */}
              <rect
                x={centerX - 60}
                y={centerY - 25}
                width={120}
                height={50}
                rx={8}
                fill="rgba(0, 0, 0, 0.8)"
                stroke={familyColors[territory.family]}
                strokeWidth="1"
                className="opacity-90"
              />
              
              {/* District name */}
              <text
                x={centerX}
                y={centerY - 8}
                textAnchor="middle"
                className="fill-mafia-gold text-sm font-bold tracking-wide"
                style={{ 
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontSize: `${12 / zoomLevel}px`
                }}
              >
                {territory.district}
              </text>
              
              {/* Family name */}
              <text
                x={centerX}
                y={centerY + 8}
                textAnchor="middle"
                className="text-xs font-semibold tracking-wider uppercase"
                fill={familyColors[territory.family]}
                style={{ 
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontSize: `${10 / zoomLevel}px`
                }}
              >
                {territory.family === 'neutral' ? 'NEUTRAL' : `${territory.family.toUpperCase()} FAMILY`}
              </text>
            </g>
          );
        })}
        </g>
      </svg>
      
      {/* Vintage overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-mafia-gold/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-noir-dark/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default MafiaHexGrid;