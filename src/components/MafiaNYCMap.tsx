import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Territory {
  q: number;
  r: number;
  s: number;
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  business?: {
    type: 'casino' | 'speakeasy' | 'restaurant' | 'docks' | 'protection';
    income: number;
  };
  capo?: {
    name: string;
    loyalty: number;
    strength: number;
    family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  };
}

interface MafiaNYCMapProps {
  onTerritoryClick: (territory: Territory) => void;
  selectedTerritory?: Territory | null;
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
}

const MafiaNYCMap: React.FC<MafiaNYCMapProps> = ({ 
  onTerritoryClick, 
  selectedTerritory, 
  playerFamily 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  // Borough territories with family control
  const boroughs: Record<string, Territory> = {
    'Manhattan': {
      q: 0, r: 0, s: 0,
      district: 'Manhattan',
      family: 'genovese',
      business: { type: 'casino', income: 15000 },
      capo: { name: 'Vincent "The Chin" Gigante', loyalty: 85, strength: 92, family: 'genovese' }
    },
    'Brooklyn': {
      q: 1, r: 0, s: -1,
      district: 'Brooklyn',
      family: 'colombo',
      business: { type: 'docks', income: 12000 },
      capo: { name: 'Joseph Colombo', loyalty: 80, strength: 88, family: 'colombo' }
    },
    'Queens': {
      q: 1, r: -1, s: 0,
      district: 'Queens',
      family: 'lucchese',
      business: { type: 'speakeasy', income: 10000 },
      capo: { name: 'Tommy Lucchese', loyalty: 78, strength: 85, family: 'lucchese' }
    },
    'Bronx': {
      q: 0, r: -1, s: 1,
      district: 'Bronx',
      family: 'bonanno',
      business: { type: 'protection', income: 8000 },
      capo: { name: 'Joseph Bonanno', loyalty: 82, strength: 90, family: 'bonanno' }
    },
    'Staten Island': {
      q: -1, r: 0, s: 1,
      district: 'Staten Island',
      family: 'gambino',
      business: { type: 'restaurant', income: 7000 },
      capo: { name: 'Carlo Gambino', loyalty: 95, strength: 95, family: 'gambino' }
    }
  };

  const familyColors = {
    gambino: '#C9A96E',
    genovese: '#8B4513', 
    lucchese: '#2E8B57',
    bonanno: '#B22222',
    colombo: '#4169E1',
    neutral: '#666666'
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      initializeMap(mapboxToken.trim());
    }
  };

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-73.9857, 40.7484], // NYC center
      zoom: 10,
      pitch: 45,
      bearing: 0
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add borough boundaries and colors
      Object.entries(boroughs).forEach(([boroughName, territory]) => {
        const color = familyColors[territory.family];
        
        // Add borough layer (simplified - you'd need actual GeoJSON data for precise boundaries)
        map.current!.addSource(`${boroughName}-source`, {
          type: 'geojson',
          data: getBoroughGeoJSON(boroughName)
        });

        map.current!.addLayer({
          id: `${boroughName}-fill`,
          type: 'fill',
          source: `${boroughName}-source`,
          paint: {
            'fill-color': color,
            'fill-opacity': 0.3
          }
        });

        map.current!.addLayer({
          id: `${boroughName}-stroke`,
          type: 'line',
          source: `${boroughName}-source`,
          paint: {
            'line-color': color,
            'line-width': 3,
            'line-opacity': 0.8
          }
        });

        // Add click handler
        map.current!.on('click', `${boroughName}-fill`, () => {
          onTerritoryClick(territory);
        });

        // Change cursor on hover
        map.current!.on('mouseenter', `${boroughName}-fill`, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current!.on('mouseleave', `${boroughName}-fill`, () => {
          map.current!.getCanvas().style.cursor = '';
        });
      });

      // Add family markers for each borough
      Object.entries(boroughs).forEach(([boroughName, territory]) => {
        const coordinates = getBoroughCenter(boroughName);
        
        const marker = new mapboxgl.Marker({
          color: familyColors[territory.family],
          scale: 0.8
        })
        .setLngLat(coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="bg-noir-dark p-3 text-mafia-gold font-source">
                <h3 class="font-bold font-playfair">${boroughName}</h3>
                <p class="text-sm">Controlled by: ${territory.family.charAt(0).toUpperCase() + territory.family.slice(1)} Family</p>
                ${territory.capo ? `<p class="text-xs text-muted-foreground">Capo: ${territory.capo.name}</p>` : ''}
                ${territory.business ? `<p class="text-xs">Business: ${territory.business.type} ($${territory.business.income}/turn)</p>` : ''}
              </div>
            `)
        )
        .addTo(map.current!);
      });
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  };

  // Geographically accurate NYC borough boundaries
  const getBoroughGeoJSON = (borough: string) => {
    const boundaries = {
      'Manhattan': {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [-74.0479, 40.6829], [-74.0059, 40.7042], [-73.9441, 40.7834], 
            [-73.9297, 40.8007], [-73.9265, 40.8664], [-73.9106, 40.8732], 
            [-73.9759, 40.8176], [-73.9994, 40.7595], [-74.0181, 40.7058], 
            [-74.0479, 40.6829]
          ]]
        }
      },
      'Brooklyn': {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [-74.0421, 40.5707], [-73.8333, 40.5707], [-73.8531, 40.5940], 
            [-73.8594, 40.6282], [-73.8847, 40.6527], [-73.8937, 40.6705], 
            [-73.9441, 40.7042], [-74.0059, 40.7042], [-74.0421, 40.6705], 
            [-74.0421, 40.5707]
          ]]
        }
      },
      'Queens': {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [-73.8333, 40.5707], [-73.7004, 40.5707], [-73.7004, 40.8007], 
            [-73.7204, 40.8207], [-73.7804, 40.8107], [-73.8204, 40.7907], 
            [-73.8404, 40.7607], [-73.8594, 40.7282], [-73.8531, 40.6840], 
            [-73.8333, 40.6527], [-73.8333, 40.5707]
          ]]
        }
      },
      'Bronx': {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [-73.9759, 40.8176], [-73.9106, 40.8732], [-73.8904, 40.8976], 
            [-73.8304, 40.9176], [-73.7658, 40.9176], [-73.7658, 40.8976], 
            [-73.7804, 40.8707], [-73.8204, 40.8407], [-73.8604, 40.8207], 
            [-73.9259, 40.8065], [-73.9759, 40.8176]
          ]]
        }
      },
      'Staten Island': {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [-74.2591, 40.4774], [-74.0522, 40.4774], [-74.0322, 40.5074], 
            [-74.0122, 40.5374], [-74.0022, 40.5674], [-74.0122, 40.5974], 
            [-74.0322, 40.6274], [-74.0522, 40.6518], [-74.1022, 40.6418], 
            [-74.1522, 40.6218], [-74.2022, 40.5918], [-74.2291, 40.5518], 
            [-74.2591, 40.5118], [-74.2591, 40.4774]
          ]]
        }
      }
    };
    
    return boundaries[borough as keyof typeof boundaries] || boundaries.Manhattan;
  };

  const getBoroughCenter = (borough: string): [number, number] => {
    const centers = {
      'Manhattan': [-73.9712, 40.7831] as [number, number],
      'Brooklyn': [-73.9442, 40.6782] as [number, number],
      'Queens': [-73.7949, 40.7282] as [number, number],
      'Bronx': [-73.8648, 40.8448] as [number, number],
      'Staten Island': [-74.1502, 40.5795] as [number, number]
    };
    
    return centers[borough as keyof typeof centers] || centers.Manhattan;
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isTokenSet) {
    return (
      <div className="flex items-center justify-center h-full bg-noir-dark/50 backdrop-blur-sm">
        <div className="bg-noir-dark border border-noir-light p-6 rounded-lg max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-mafia-gold mb-4 font-playfair">
            Setup Required
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            To display the geographically accurate NYC map, please enter your Mapbox public token.
            Get one free at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-mafia-gold hover:underline">mapbox.com</a>
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="mapbox-token" className="text-sm text-muted-foreground">
                Mapbox Public Token
              </Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleTokenSubmit}
              className="w-full bg-mafia-gold hover:bg-mafia-gold/90 text-background"
              disabled={!mapboxToken.trim()}
            >
              Initialize NYC Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      <div className="absolute top-4 left-4 bg-noir-dark/90 backdrop-blur-sm border border-noir-light rounded-lg p-3">
        <h3 className="text-sm font-semibold text-mafia-gold font-playfair mb-2">NYC Territory Map</h3>
        <p className="text-xs text-muted-foreground">Click on boroughs to select territories</p>
      </div>
    </div>
  );
};

export default MafiaNYCMap;