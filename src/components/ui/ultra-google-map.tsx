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

export function UltraGoogleMap({ 
  onLocationUpdate, 
  onMapLoad, 
  filteredOffers = [],
  selectedBusiness 
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [apiKey] = useState('AIzaSyATgautsRC2yNJ6Ww5d6KqqxnIYDtrjJwM');
  
  const { position, isLoading: locationLoading } = useGeolocation();

  // Fetch businesses with profiles
  const { data: businesses = [] } = useQuery({
    queryKey: ["simple-businesses-map", filteredOffers],
    queryFn: async () => {
      if (filteredOffers && filteredOffers.length > 0) {
        return filteredOffers.filter(offer => offer.latitude && offer.longitude);
      }
      
      // Get unique business locations with their profiles
      const { data: businessProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, business_name, first_name, last_name, avatar_url, latitude, longitude, address")
        .eq("account_type", "business")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      
      if (profileError) throw profileError;
      return businessProfiles || [];
    },
  });

  // Initialiser une carte simple et performante
  const initializeMap = async () => {
    if (!mapRef.current || !position) return;

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places']
      });

      await loader.load();
      const google = (window as any).google;

      const map = new google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        styles: [
          // Masquer tous les POI (points d'intérêt)
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }]
          },
          // Masquer COMPLÈTEMENT toutes les routes et leurs labels (y compris noms de routes)
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road",
            elementType: "labels.text.stroke",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.highway",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.highway",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.arterial",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.arterial",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.local",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.local",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
          },
          // Masquer TOUS les autres types de labels de routes
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "all",
            elementType: "labels.text.stroke",
            stylers: [{ visibility: "off" }]
          },
          // Masquer les entreprises
          {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }]
          },
          // Masquer les transports
          {
            featureType: "transit",
            stylers: [{ visibility: "off" }]
          },
          // Garder seulement les noms de villes (réactiver spécifiquement)
          {
            featureType: "administrative.locality",
            elementType: "labels.text",
            stylers: [{ visibility: "on" }]
          },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ visibility: "on" }]
          },
          // Masquer les quartiers
          {
            featureType: "administrative.neighborhood",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      mapInstanceRef.current = map;
      onMapLoad?.(map);

      // Centrer automatiquement sur la position utilisateur
      map.setCenter(position);
      
      // Marqueur utilisateur simple
      new google.maps.Marker({
        position: position,
        map: map,
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
        }
      });

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Créer des marqueurs avec photos de profil pour les entreprises
      for (const business of businesses) {
        if (business.latitude && business.longitude) {
          createBusinessMarker(business, map, google);
        }
      }

      onLocationUpdate?.(position);

    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  // Créer des marqueurs avec photos de profil pour les entreprises
  const createBusinessMarker = (business: any, map: any, google: any) => {
    const businessName = business.business_name || `${business.first_name || ''} ${business.last_name || ''}`.trim() || 'Entreprise';
    const avatarUrl = business.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(businessName)}&background=ff6b35&color=fff&size=80`;

    const marker = new google.maps.Marker({
      position: { 
        lat: Number(business.latitude), 
        lng: Number(business.longitude) 
      },
      map: map,
      title: businessName,
      icon: {
        url: `data:image/svg+xml,${encodeURIComponent(`
          <svg width="50" height="60" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="circle-clip">
                <circle cx="25" cy="20" r="15"/>
              </clipPath>
            </defs>
            <path d="M25 5C18 5 12.5 10.5 12.5 17.5C12.5 25 25 50 25 50S37.5 25 37.5 17.5C37.5 10.5 32 5 25 5Z" 
                  fill="#ff6b35" stroke="white" stroke-width="3"/>
            <circle cx="25" cy="20" r="15" fill="white"/>
            <image x="10" y="5" width="30" height="30" href="${avatarUrl}" clip-path="url(#circle-clip)"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(50, 60),
        anchor: new google.maps.Point(25, 60)
      }
    });

    // InfoWindow simple
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; max-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${avatarUrl}" alt="${businessName}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <div>
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${businessName}</h3>
              <p style="margin: 0; font-size: 11px; color: #666;">${business.address || ''}</p>
            </div>
          </div>
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
      
      // Navigation vers le profil business
      if ((window as any).viewBusiness) {
        (window as any).viewBusiness(business.user_id);
      }
    });

    (marker as any).infoWindow = infoWindow;
    markersRef.current.push(marker);

    // Mettre en évidence le business sélectionné
    if (selectedBusiness && selectedBusiness.user_id === business.user_id) {
      infoWindow.open(map, marker);
      map.setCenter(marker.getPosition());
      map.setZoom(16);
    }
  };

  // Charger la carte quand la géolocalisation est prête
  useEffect(() => {
    if (position && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [position, businesses]);

  // Recentrer la carte si position utilisateur change
  useEffect(() => {
    if (position && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(position);
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

  if (!position) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Géolocalisation non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}