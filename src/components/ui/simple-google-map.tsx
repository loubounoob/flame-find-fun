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
  const [apiKey] = useState('AIzaSyATgautsRC2yNJ6Ww5d6KqqxnIYDtrjJwM');
  
  const { position, isLoading: locationLoading } = useGeolocation();

  // Fetch businesses with profile data (avatar)
  const { data: businesses = [] } = useQuery({
    queryKey: ["simple-businesses-map", filteredOffers],
    queryFn: async () => {
      if (filteredOffers && filteredOffers.length > 0) {
        // Get business profiles for filtered offers
        const businessIds = filteredOffers.map(o => o.business_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, avatar_url, business_name")
          .in("user_id", businessIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        return filteredOffers
          .filter(offer => offer.latitude && offer.longitude)
          .map(offer => ({
            ...offer,
            avatar_url: profileMap.get(offer.business_user_id)?.avatar_url,
            business_name: profileMap.get(offer.business_user_id)?.business_name
          }));
      }
      
      // Fetch offers and profiles separately
      const { data: offers, error: offersError } = await supabase
        .from("offers")
        .select("*")
        .eq("status", "active")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      
      if (offersError) throw offersError;
      if (!offers || offers.length === 0) return [];
      
      // Get all business user IDs
      const businessIds = offers.map(o => o.business_user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, avatar_url, business_name")
        .in("user_id", businessIds);
      
      if (profilesError) throw profilesError;
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return offers.map(offer => ({
        ...offer,
        avatar_url: profileMap.get(offer.business_user_id)?.avatar_url,
        business_name: profileMap.get(offer.business_user_id)?.business_name
      }));
    },
  });

  // Initialiser une carte simple et performante
  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places', 'marker']
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
        gestureHandling: 'greedy',
        styles: [
          // Hide all POIs
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          { featureType: 'poi.park', stylers: [{ visibility: 'off' }] },
          // Hide transit
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          // Hide highways completely (routes métropolitaines/départementales)
          { featureType: 'road.highway', stylers: [{ visibility: 'off' }] },
          { featureType: 'road.highway.controlled_access', stylers: [{ visibility: 'off' }] },
          // Hide ALL highway labels (text and icons/shields)
          { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { featureType: 'road.highway', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
          // Hide ALL arterial road labels (routes départementales)
          { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { featureType: 'road.arterial', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
          // EXTRA: Hide any road shields/icons globally (catch-all)
          { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          // Keep only local street names visible
          { featureType: 'road.local', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
          // Keep city/locality names visible
          { featureType: 'administrative.locality', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
          { featureType: 'administrative.neighborhood', elementType: 'labels.text', stylers: [{ visibility: 'on' }] }
        ]
      });

      mapInstanceRef.current = map;
      onMapLoad?.(map);

      // Centrer automatiquement
      map.setCenter(position || { lat: 48.8566, lng: 2.3522 });
      
      // Marqueur utilisateur simple (si géolocalisation disponible)
      if (position) {
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
      }

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

  // Créer des marqueurs circulaires avec photo de profil
  const createSimpleMarker = (offer: any, map: any, google: any) => {
    const categoryColor = CATEGORY_COLORS[offer.category as keyof typeof CATEGORY_COLORS] || '#ff6b35';
    const avatarUrl = offer.avatar_url || '/placeholder.svg';

    // Créer un élément HTML personnalisé pour le marqueur
    const markerDiv = document.createElement('div');
    markerDiv.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 4px solid ${categoryColor};
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      background: white;
      transition: transform 0.2s;
    `;
    
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    img.onerror = () => {
      img.src = '/placeholder.svg';
    };
    
    markerDiv.appendChild(img);
    
    // Effet hover
    markerDiv.addEventListener('mouseenter', () => {
      markerDiv.style.transform = 'scale(1.1)';
    });
    markerDiv.addEventListener('mouseleave', () => {
      markerDiv.style.transform = 'scale(1)';
    });

    // Utiliser AdvancedMarkerElement
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { 
        lat: Number(offer.latitude), 
        lng: Number(offer.longitude) 
      },
      map: map,
      title: offer.title,
      content: markerDiv
    });

    // InfoWindow améliorée
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 250px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <img src="${avatarUrl}" 
                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
                 onerror="this.src='/placeholder.svg'">
            <div>
              <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold;">${offer.business_name || offer.title}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${offer.category}</p>
            </div>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #888;">${offer.location || ''}</p>
        </div>
      `
    });

    markerDiv.addEventListener('click', () => {
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
      map.setCenter(marker.position);
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


  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}