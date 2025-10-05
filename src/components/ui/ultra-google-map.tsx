import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRecurringPromotions } from '@/hooks/useRecurringPromotions';

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
  const { applyPromotionToOffers } = useRecurringPromotions();

  // Fetch businesses with profiles and apply promotions
  const { data: businesses = [] } = useQuery({
    queryKey: ["businesses-map-with-profiles", filteredOffers],
    queryFn: async () => {
      let offersData = [];
      
      if (filteredOffers && filteredOffers.length > 0) {
        offersData = filteredOffers.filter(offer => offer.latitude && offer.longitude);
      } else {
        const { data, error } = await supabase
          .from("offers")
          .select("*")
          .eq("status", "active")
          .not("latitude", "is", null)
          .not("longitude", "is", null);
        
        if (error) throw error;
        offersData = data || [];
      }

      // Fetch business profiles with avatars
      const businessUserIds = [...new Set(offersData.map(o => o.business_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, avatar_url, business_name")
        .in("user_id", businessUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Merge offers with profiles and apply promotions
      const offersWithProfiles = offersData.map(offer => ({
        ...offer,
        business_avatar: profileMap.get(offer.business_user_id)?.avatar_url,
        business_name: profileMap.get(offer.business_user_id)?.business_name
      }));

      return applyPromotionToOffers(offersWithProfiles);
    },
  });

  // Initialiser une carte simple et performante
  const initializeMap = async () => {
    if (!mapRef.current || !position) return;

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places', 'marker']
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
          // Masquer les autoroutes complètement (routes métropolitaines/départementales)
          {
            featureType: "road.highway",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.highway.controlled_access",
            stylers: [{ visibility: "off" }]
          },
          // Masquer TOUS les labels des autoroutes (texte et icônes)
          {
            featureType: "road.highway",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.highway",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.highway",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
          },
          // Masquer TOUS les labels des routes départementales (arterial)
          {
            featureType: "road.arterial",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.arterial",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.arterial",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
          },
          // Catch-all : masquer tout icône de route (panneaux/plaques jaunes)
          {
            featureType: "road",
            elementType: "labels.icon",
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
          // Garder seulement les noms de rues locales et villes
          {
            featureType: "road.local",
            elementType: "labels.text",
            stylers: [{ visibility: "on" }]
          },
          {
            featureType: "administrative.locality",
            elementType: "labels.text",
            stylers: [{ visibility: "on" }]
          },
          {
            featureType: "administrative.neighborhood",
            elementType: "labels.text",
            stylers: [{ visibility: "on" }]
          }
        ]
      });

      mapInstanceRef.current = map;
      onMapLoad?.(map);

      // Centrer automatiquement sur la position utilisateur
      map.setCenter(position);
      
      // Marqueur utilisateur illustré et coloré avec AdvancedMarkerElement
      const userMarkerDiv = document.createElement('div');
      userMarkerDiv.innerHTML = `
        <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <!-- Ombre portée -->
          <ellipse cx="25" cy="46" rx="12" ry="3" fill="#000" opacity="0.2"/>
          <!-- Corps du personnage -->
          <circle cx="25" cy="25" r="18" fill="#667eea" stroke="white" stroke-width="3"/>
          <!-- Visage souriant -->
          <circle cx="19" cy="22" r="2.5" fill="white"/>
          <circle cx="31" cy="22" r="2.5" fill="white"/>
          <path d="M 19 30 Q 25 34 31 30" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <!-- Badge de localisation -->
          <circle cx="38" cy="15" r="8" fill="#10b981" stroke="white" stroke-width="2"/>
          <path d="M 38 11 L 38 19 M 34 15 L 42 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
      
      new google.maps.marker.AdvancedMarkerElement({
        position: position,
        map: map,
        title: 'Votre position',
        content: userMarkerDiv,
        zIndex: 1000
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

  // Créer des marqueurs circulaires avec avatars et badges de réduction
  const createSimpleMarker = (offer: any, map: any, google: any) => {
    const hasPromotion = offer.has_promotion && offer.activePromotion;
    const discountText = hasPromotion ? `-${offer.activePromotion.discount_percentage}%` : '';
    
    // Utiliser l'avatar business ou une icône par défaut
    const avatarUrl = offer.business_avatar || 'https://uxdddiaheswxgkoannri.supabase.co/storage/v1/object/public/avatars/default-business.png';
    const categoryColor = CATEGORY_COLORS[offer.category as keyof typeof CATEGORY_COLORS] || '#667eea';

    // Créer un conteneur pour le marqueur avec avatar et badge
    const markerDiv = document.createElement('div');
    markerDiv.style.cssText = `
      position: relative;
      width: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s;
    `;
    
    markerDiv.innerHTML = `
      <div style="
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: white;
        padding: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: 3px solid ${categoryColor};
      ">
        <div style="
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-image: url('${avatarUrl}');
          background-size: cover;
          background-position: center;
        "></div>
      </div>
      ${hasPromotion ? `
        <div style="
          margin-top: 4px;
          background: #ef4444;
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          white-space: nowrap;
        ">${discountText}</div>
      ` : ''}
    `;

    markerDiv.addEventListener('mouseenter', () => {
      markerDiv.style.transform = 'scale(1.1)';
    });
    
    markerDiv.addEventListener('mouseleave', () => {
      markerDiv.style.transform = 'scale(1)';
    });

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { 
        lat: Number(offer.latitude), 
        lng: Number(offer.longitude) 
      },
      map: map,
      title: offer.title,
      content: markerDiv
    });

    // InfoWindow avec info de promotion
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 240px; font-family: system-ui, -apple-system, sans-serif;">
          ${offer.business_avatar ? `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <img src="${offer.business_avatar}" 
                   style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
              <div>
                <h3 style="margin: 0; font-size: 14px; font-weight: 600;">${offer.title}</h3>
                ${offer.business_name ? `<p style="margin: 0; font-size: 11px; color: #666;">${offer.business_name}</p>` : ''}
              </div>
            </div>
          ` : `
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${offer.title}</h3>
          `}
          ${hasPromotion ? `
            <div style="
              background: linear-gradient(135deg, #ef4444, #dc2626);
              color: white;
              padding: 8px 12px;
              border-radius: 8px;
              margin-bottom: 8px;
              font-weight: 600;
              font-size: 13px;
              text-align: center;
            ">
              🔥 ${discountText} de réduction
            </div>
          ` : ''}
          <p style="margin: 0; font-size: 12px; color: #666;">${offer.category}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">${offer.location || ''}</p>
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