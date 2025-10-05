import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';

declare global {
  interface Window {
    google: any;
    viewBusiness?: (offerId: string) => void;
    getDirections?: (lat: number, lng: number) => void;
  }
}

interface SimpleMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  onMapLoad?: (map: any) => void;
  filteredOffers?: any[];
  selectedBusiness?: any;
}

// Marqueurs iconographiques par catégorie
const CATEGORY_ICONS = {
  bowling: '🎳',
  billard: '🎱', 
  padel: '🏓',
  'escape-game': '🔓',
  karting: '🏎️',
  'laser-game': '🔫',
  tennis: '🎾',
  restaurant: '🍽️',
  bar: '🍻',
  sport: '⚽',
  wellness: '🧘',
  creative: '🎨'
};

const CATEGORY_COLORS = {
  bowling: '#ff6b35',
  billard: '#4a90e2', 
  padel: '#50c878',
  'escape-game': '#9b59b6',
  karting: '#e74c3c',
  'laser-game': '#f39c12',
  tennis: '#2ecc71',
  restaurant: '#e67e22',
  bar: '#34495e',
  sport: '#ff6b35',
  wellness: '#9b59b6',
  creative: '#e74c3c'
};

export function SimpleGoogleMap({ 
  onLocationUpdate, 
  onMapLoad, 
  filteredOffers = [],
  selectedBusiness 
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [apiKey] = useState('AIzaSyATgautsRC2yNJ6Ww5d6KqqxnIYDtrjJwM');
  
  const { position, isLoading: locationLoading } = useGeolocation();

  // Fetch businesses with simple query
  const { data: businesses = [] } = useQuery({
    queryKey: ["simple-businesses-map", filteredOffers],
    queryFn: async () => {
      if (filteredOffers && filteredOffers.length > 0) {
        return filteredOffers.filter(offer => offer.latitude && offer.longitude);
      }
      
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("status", "active")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Initialiser une carte simple et performante
  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places']
      });

      await loader.load();
      const google = (window as any).google;

      const map = new google.maps.Map(mapRef.current, {
        center: position || { lat: 48.8566, lng: 2.3522 },
        zoom: position ? 15 : 12,
        disableDefaultUI: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'greedy'
      });

      mapInstanceRef.current = map;
      onMapLoad?.(map);

      // Fix potential black map by forcing resize after initial render and recenter
      google.maps.event.addListenerOnce(map, 'idle', () => {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(position || { lat: 48.8566, lng: 2.3522 });
      });

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Créer des marqueurs simples avec icônes
      for (const offer of businesses) {
        if (offer.latitude && offer.longitude) {
          createSimpleMarker(offer, map, google);
        }
      }

      onLocationUpdate?.(position);

    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  // Créer des marqueurs simples avec icônes catégories
  const createSimpleMarker = (offer: any, map: any, google: any) => {
    const categoryIcon = CATEGORY_ICONS[offer.category as keyof typeof CATEGORY_ICONS] || '📍';
    const categoryColor = CATEGORY_COLORS[offer.category as keyof typeof CATEGORY_COLORS] || '#ff6b35';

    const marker = new google.maps.Marker({
      position: { 
        lat: Number(offer.latitude), 
        lng: Number(offer.longitude) 
      },
      map: map,
      title: offer.title,
      icon: {
        url: `data:image/svg+xml,${encodeURIComponent(`
          <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 5C13 5 7.5 10.5 7.5 17.5C7.5 25 20 45 20 45S32.5 25 32.5 17.5C32.5 10.5 27 5 20 5Z" 
                  fill="${categoryColor}" stroke="white" stroke-width="2"/>
            <circle cx="20" cy="17.5" r="8" fill="white"/>
            <text x="20" y="22" text-anchor="middle" font-size="12">${categoryIcon}</text>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(40, 50),
        anchor: new google.maps.Point(20, 50)
      }
    });

    // InfoWindow avec un design amélioré
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid ${categoryColor}; flex-shrink: 0;">
              ${offer.avatar_url ? `<img src="${offer.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" alt="${offer.business_name || offer.title}">` : `<div style="width: 100%; height: 100%; background: ${categoryColor}; display: flex; align-items: center; justify-content: center; font-size: 20px;">${categoryIcon}</div>`}
            </div>
            <div style="flex: 1; min-width: 0;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${offer.title}</h3>
              <p style="margin: 0; font-size: 12px; color: #666; text-transform: capitalize;">${offer.category.replace('-', ' ')}</p>
            </div>
          </div>
          ${offer.location ? `<p style="margin: 0; font-size: 11px; color: #888; display: flex; align-items: center; gap: 4px;"><span style="font-size: 14px;">📍</span>${offer.location}</p>` : ''}
        </div>
      `
    });

    marker.addListener('click', () => {
      markersRef.current.forEach(m => {
        if ((m as any).infoWindow) {
          (m as any).infoWindow.close();
        }
      });
      
      infoWindow.open(map, marker);
      
      // Appel global pour voir les détails business
      if ((window as any).viewBusiness) {
        (window as any).viewBusiness(offer.id);
      }
    });

    (marker as any).infoWindow = infoWindow;
    markersRef.current.push(marker);

    // Mettre en évidence le business sélectionné
    if (selectedBusiness && selectedBusiness.id === offer.id) {
      infoWindow.open(map, marker);
      map.setCenter(marker.getPosition());
      map.setZoom(16);
    }
  };

  // Initialiser la carte une seule fois
  useEffect(() => {
    if (!mapInstanceRef.current) {
      initializeMap();
    }
  }, []);

  // Mettre à jour les marqueurs quand businesses change
  useEffect(() => {
    if (mapInstanceRef.current && businesses.length > 0) {
      const google = (window as any).google;
      if (!google) return;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Créer les nouveaux marqueurs
      for (const offer of businesses) {
        if (offer.latitude && offer.longitude) {
          createSimpleMarker(offer, mapInstanceRef.current, google);
        }
      }
    }
  }, [businesses]);

  // Créer/mettre à jour le marqueur utilisateur quand la position change
  useEffect(() => {
    if (position && mapInstanceRef.current) {
      const google = (window as any).google;
      if (!google) return;

      // Supprimer l'ancien marqueur s'il existe
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }

      // Créer le nouveau marqueur utilisateur
      userMarkerRef.current = new google.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        title: 'Votre position',
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="#1a73e8" stroke="white" stroke-width="2"/>
              <circle cx="10" cy="10" r="3" fill="white"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(20, 20),
          anchor: new google.maps.Point(10, 10)
        },
        zIndex: 9999
      });

      // Centrer la carte sur la position utilisateur
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(15);
    }
  }, [position]);

  if (locationLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Localisation en cours...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
}