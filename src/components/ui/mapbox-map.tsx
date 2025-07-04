import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface MapboxMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function MapboxMap({ onLocationUpdate }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Récupérer les offres depuis Supabase
  const { data: offers = [] } = useQuery({
    queryKey: ["offers-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("status", "active");
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBDaeWicvigtP9xPv919E-RNoxfvC-Hqik&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = () => {
        initializeMap();
      };
      
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current || !window.google) return;

    // Default to Lyon, France
    const defaultCenter = { lat: 45.7640, lng: 4.8357 };

    map.current = new window.google.maps.Map(mapContainer.current, {
      center: defaultCenter,
      zoom: 13,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          setUserLocation(userLoc);
          map.current.setCenter(userLoc);
          onLocationUpdate?.(userLoc);

          // Add user location marker
          new window.google.maps.Marker({
            position: userLoc,
            map: map.current,
            title: 'Votre position',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 12)
            }
          });

          // Add offer markers around user location
          addOfferMarkers(userLoc);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Lyon if geolocation fails
          onLocationUpdate?.(defaultCenter);
          addOfferMarkers(defaultCenter);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      addOfferMarkers(defaultCenter);
    }
  };

  const addOfferMarkers = (userLoc: { lat: number; lng: number }) => {
    offers.forEach((offer, index) => {
      // Generate coordinates around user location
      const coords = getOfferCoordinates(offer.id, userLoc);
      
      const marker = new window.google.maps.Marker({
        position: coords,
        map: map.current,
        title: offer.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#FF6B6B" stroke="white" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🎯</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${offer.title}</h3>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${offer.category}</p>
            <p style="margin: 0 0 8px 0; color: #888; font-size: 12px;">${offer.location}</p>
            <button onclick="window.location.href='/offer/${offer.id}'" 
                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           color: white; border: none; padding: 8px 16px; 
                           border-radius: 6px; cursor: pointer; font-size: 14px;">
              Voir l'offre
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map.current, marker);
      });
    });
  };

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
}

// Fonction pour générer des coordonnées fictives autour de la position de l'utilisateur
function getOfferCoordinates(offerId: string, userLocation: { lat: number; lng: number }): { lat: number; lng: number } {
  // Générer des coordonnées aléatoires mais consistantes basées sur l'ID
  const hash = offerId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const latOffset = (hash % 200 - 100) / 5000; // ~±2km
  const lngOffset = ((hash * 7) % 200 - 100) / 5000; // ~±2km
  
  return {
    lat: userLocation.lat + latOffset,
    lng: userLocation.lng + lngOffset
  };
}