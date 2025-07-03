import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

// IMPORTANT: Remplacez par votre vraie clé Mapbox publique
const MAPBOX_TOKEN = 'pk.eyJ1IjoibGludXhpZXJlIiwiYSI6ImNrOXB1aWp1YjAzeW8zbm1neXVxaGt0aTAifQ.jGMJrEqGu9fOsrIc8w6-FQ';

interface MapboxMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function MapboxMap({ onLocationUpdate }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

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

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [4.8357, 45.7640], // Lyon par défaut
      zoom: 13,
      attributionControl: false
    });

    // Ajouter les contrôles de navigation
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Obtenir la position de l'utilisateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          onLocationUpdate?.(location);
          
          if (map.current) {
            map.current.setCenter([location.lng, location.lat]);
            map.current.setZoom(14);
            
            // Ajouter un marqueur pour l'utilisateur
            const userMarker = new mapboxgl.Marker({
              color: '#3b82f6',
              scale: 1.0
            })
              .setLngLat([location.lng, location.lat])
              .addTo(map.current);
              
            // Ajouter un popup pour indiquer la position de l'utilisateur
            const userPopup = new mapboxgl.Popup({
              offset: 25,
              closeButton: false
            }).setHTML('<div class="p-2"><strong>Votre position</strong></div>');
            
            userMarker.setPopup(userPopup);
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          // Garder Lyon par défaut si la géolocalisation échoue
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }

    return () => {
      map.current?.remove();
    };
  }, [onLocationUpdate]);

  // Ajouter les marqueurs des offres
  useEffect(() => {
    if (!map.current || !offers.length) return;

    // Supprimer les anciens marqueurs
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Ajouter les nouveaux marqueurs
    offers.forEach((offer) => {
      // Pour cet exemple, on utilise des coordonnées fictives autour de Lyon
      // Dans un vrai projet, vous devriez avoir des champs lat/lng dans votre table offers
      const coords = getOfferCoordinates(offer.id);
      
      if (coords && map.current) {
        // Créer un élément HTML personnalisé pour le marqueur
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
          <div class="bg-gradient-flame text-white rounded-full p-2 shadow-lg cursor-pointer hover:scale-110 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([coords.lng, coords.lat])
          .addTo(map.current);

        // Ajouter un popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false
        }).setHTML(`
          <div class="p-3">
            <h3 class="font-semibold text-sm">${offer.title}</h3>
            <p class="text-xs text-gray-600 mt-1">${offer.category}</p>
            <p class="text-xs text-gray-500 mt-1">${offer.location}</p>
          </div>
        `);

        marker.setPopup(popup);
        markers.current.push(marker);

        // Afficher le popup au survol
        el.addEventListener('mouseenter', () => {
          popup.addTo(map.current!);
        });
        
        el.addEventListener('mouseleave', () => {
          popup.remove();
        });
      }
    });
  }, [offers]);

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
}

// Fonction pour générer des coordonnées fictives autour de Lyon
function getOfferCoordinates(offerId: string): { lat: number; lng: number } | null {
  // Coordonnées de base de Lyon
  const lyonLat = 45.7640;
  const lyonLng = 4.8357;
  
  // Générer des coordonnées aléatoires mais consistantes basées sur l'ID
  const hash = offerId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const latOffset = (hash % 200 - 100) / 10000; // ~±1km
  const lngOffset = ((hash * 7) % 200 - 100) / 10000; // ~±1km
  
  return {
    lat: lyonLat + latOffset,
    lng: lyonLng + lngOffset
  };
}