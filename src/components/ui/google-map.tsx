import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: HTMLElement, opts?: any);
        setCenter(latlng: any): void;
        setZoom(zoom: number): void;
      }
      class Marker {
        constructor(opts?: any);
        addListener(eventName: string, handler: Function): void;
      }
      class InfoWindow {
        constructor(opts?: any);
        open(map?: Map, anchor?: Marker): void;
      }
      class Size {
        constructor(width: number, height: number);
      }
      namespace places {
        class PlacesService {
          constructor(map: Map);
          nearbySearch(request: any, callback: (results: any[], status: any) => void): void;
        }
        enum PlacesServiceStatus {
          OK = 'OK'
        }
      }
    }
  }
}

import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';

interface GoogleMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function GoogleMap({ onLocationUpdate }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [apiKey] = useState('AIzaSyATgautsRC2yNJ6Ww5d6KqqxnIYDtrjJwM');
  const { position, isLoading: locationLoading, getCurrentPosition } = useGeolocation();

  // Récupérer les offres avec coordonnées depuis Supabase
  const { data: businesses = [] } = useQuery({
    queryKey: ["businesses-map"],
    queryFn: async () => {
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

  // Initialiser Google Maps avec Neighborhood Discovery
  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      await loader.load();

      const defaultCenter = position || { lat: 45.7640, lng: 4.8357 }; // Lyon par défaut

      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 14,
        disableDefaultUI: true, // Interface simplifiée pour mobile
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [
          {
            featureType: 'poi.business',
            elementType: 'all',
            stylers: [{ visibility: 'on' }]
          },
          {
            featureType: 'poi.government',
            elementType: 'all',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Ajouter des marqueurs pour toutes les offres/entreprises
      businesses.forEach(offer => {
        if (offer.latitude && offer.longitude) {
          const marker = new google.maps.Marker({
            position: { 
              lat: Number(offer.latitude), 
              lng: Number(offer.longitude) 
            },
            map: map,
            title: offer.title,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#ff6b35" stroke="white" stroke-width="3"/>
                  <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">🏢</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40)
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 16px; max-width: 280px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 12px 0; font-weight: bold; color: #333; font-size: 16px;">
                  ${offer.title}
                </h3>
                <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${offer.category}</p>
                ${offer.location ? `<p style="margin: 0 0 8px 0; color: #333; font-size: 14px;">📍 ${offer.location}</p>` : ''}
                ${offer.price ? `<p style="margin: 0 0 12px 0; color: #ff6b35; font-size: 14px; font-weight: bold;">${offer.price}</p>` : ''}
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                  <button onclick="window.location.href='/offer/${offer.id}'" style="
                    background: #ff6b35; 
                    color: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 6px; 
                    font-size: 12px; 
                    font-weight: bold;
                    cursor: pointer;
                    flex: 1;
                  ">Voir l'offre</button>
                  <button onclick="window.location.href='/business-profile?id=${offer.business_user_id}'" style="
                    background: transparent; 
                    color: #ff6b35; 
                    border: 1px solid #ff6b35; 
                    padding: 8px 16px; 
                    border-radius: 6px; 
                    font-size: 12px; 
                    font-weight: bold;
                    cursor: pointer;
                    flex: 1;
                  ">Profil</button>
                </div>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
      });

      // Marqueur pour la position de l'utilisateur (plus visible sur mobile)
      if (position) {
        new google.maps.Marker({
          position: position,
          map: map,
          title: 'Votre position',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="12" fill="#4285f4" stroke="white" stroke-width="3"/>
                <circle cx="15" cy="15" r="5" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(30, 30)
          }
        });

        onLocationUpdate?.(position);
      }

      // Activer Neighborhood Discovery
      const placesService = new google.maps.places.PlacesService(map);
      
      if (position) {
        const request = {
          location: position,
          radius: 2000, // 2km radius
          type: ['establishment']
        };

        placesService.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Optionnel: traiter les résultats des établissements à proximité
            console.log('Establishments nearby:', results.length);
          }
        });
      }

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  // Recentrer sur la position de l'utilisateur
  const recenterMap = () => {
    if (position && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(16);
    } else {
      getCurrentPosition();
    }
  };

  useEffect(() => {
    if (apiKey && businesses.length >= 0) {
      initializeMap();
    }
  }, [businesses, position]);

  // Géolocalisation automatique au chargement
  useEffect(() => {
    getCurrentPosition();
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Bouton de recentrage optimisé pour mobile */}
      <div className="absolute bottom-6 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={recenterMap}
          disabled={locationLoading}
          className="bg-background/95 backdrop-blur-sm shadow-lg w-12 h-12"
        >
          <Navigation size={24} />
        </Button>
      </div>
    </div>
  );
}