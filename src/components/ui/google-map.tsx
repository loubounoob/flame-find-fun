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
      class Point {
        constructor(x: number, y: number);
      }
    }
  }
}

import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { updateAddressCoordinates } from '@/utils/geocoding';

interface GoogleMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function GoogleMap({ onLocationUpdate }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
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

  // Récupérer les adresses d'entreprises depuis Supabase
  const { data: businessAddresses = [] } = useQuery({
    queryKey: ["business-addresses-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_addresses")
        .select("*")
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
      const google = (window as any).google;

      const defaultCenter = position || { lat: 45.7640, lng: 4.8357 }; // Lyon par défaut

      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 14,
        disableDefaultUI: true, // Interface complètement simplifiée
        gestureHandling: 'cooperative',
          styles: [
            {
              featureType: 'poi',
              elementType: 'all',
              stylers: [{ visibility: 'off' }] // Masquer tous les POI existants
            },
            {
              featureType: 'transit',
              elementType: 'all',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'road',
              elementType: 'labels.text',
              stylers: [{ visibility: 'off' }] // Masquer les noms de routes A1, M917, etc.
            },
            {
              featureType: 'administrative',
              elementType: 'labels.text',
              stylers: [{ visibility: 'simplified' }] // Garder les noms de villes visibles mais simplifiés
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
                <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="22.5" cy="22.5" r="20" fill="#ff6b35" stroke="white" stroke-width="4"/>
                  <circle cx="22.5" cy="22.5" r="16" fill="#ff6b35"/>
                  <circle cx="22.5" cy="22.5" r="8" fill="white"/>
                  <circle cx="22.5" cy="22.5" r="4" fill="#ff6b35"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(45, 45),
              anchor: new google.maps.Point(22.5, 22.5)
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

      // Ajouter des marqueurs pour les adresses d'entreprises
      businessAddresses.forEach(address => {
        if (address.latitude && address.longitude) {
          const businessName = address.address_name;
          const marker = new google.maps.Marker({
            position: { 
              lat: Number(address.latitude), 
              lng: Number(address.longitude) 
            },
            map: map,
            title: businessName,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="17" fill="#4285f4" stroke="white" stroke-width="4"/>
                  <circle cx="20" cy="20" r="13" fill="#4285f4"/>
                  <circle cx="20" cy="20" r="7" fill="white"/>
                  <circle cx="20" cy="20" r="3" fill="#4285f4"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20)
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 16px; max-width: 280px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 12px 0; font-weight: bold; color: #333; font-size: 16px;">
                  ${businessName}
                </h3>
                <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Entreprise</p>
                ${address.full_address ? `<p style="margin: 0 0 8px 0; color: #333; font-size: 14px;">📍 ${address.full_address}</p>` : ''}
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                  <button onclick="window.location.href='/business-profile?id=${address.business_user_id}'" style="
                    background: #4285f4; 
                    color: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 6px; 
                    font-size: 12px; 
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                  ">Voir le profil</button>
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
              <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="17.5" cy="17.5" r="15" fill="#1a73e8" stroke="white" stroke-width="4"/>
                <circle cx="17.5" cy="17.5" r="11" fill="#1a73e8"/>
                <circle cx="17.5" cy="17.5" r="6" fill="white"/>
                <circle cx="17.5" cy="17.5" r="3" fill="#1a73e8"/>
                <circle cx="17.5" cy="17.5" r="1" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(35, 35),
            anchor: new google.maps.Point(17.5, 17.5)
          }
        });

        onLocationUpdate?.(position);
      }

      // Activer Neighborhood Discovery
      if (google?.maps?.places) {
        const placesService = new google.maps.places.PlacesService(map);
        
        if (position) {
          const request = {
            location: position,
            radius: 2000, // 2km radius
            type: ['establishment']
          };

          placesService.nearbySearch(request, (results: any, status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              console.log('Establishments nearby:', results.length);
            }
          });
        }
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
    if (apiKey && (businesses.length >= 0 || businessAddresses.length >= 0)) {
      initializeMap();
    }
  }, [businesses, businessAddresses, position]);

  // Géolocalisation automatique au chargement et mise à jour des coordonnées
  useEffect(() => {
    getCurrentPosition();
    // Update coordinates for addresses without them
    updateAddressCoordinates();
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