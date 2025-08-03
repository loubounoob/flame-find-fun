import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Crosshair, Zap, Target } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { useEffect as useReactEffect } from 'react';

interface MapboxMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function MapboxMap({ onLocationUpdate }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('pk.eyJ1IjoibG91Ym91bm9vYiIsImEiOiJjbWNyY3h2dnYwbmdrMm1zYjFwdmRoa2JuIn0.H2zEBpzTBY0cjy1_kKBERA');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const { position: userLocation, isLoading, getCurrentPosition } = useGeolocation();
  const [nearbyOffers, setNearbyOffers] = useState([]);

  // Fonction pour calculer la distance entre deux points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance en km
    return d;
  };

  // Charger les offres à proximité basées sur la géolocalisation
  const loadNearbyOffers = async (lat: number, lng: number) => {
    try {
      const { data: offers, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      // Calculer les distances et filtrer les offres dans un rayon de 5km
      const offersWithDistance = offers
        ?.map(offer => ({
          ...offer,
          distance: calculateDistance(lat, lng, Number(offer.latitude), Number(offer.longitude))
        }))
        .filter(offer => offer.distance <= 5) // Rayon de 5km
        .sort((a, b) => a.distance - b.distance) // Trier par distance
        .slice(0, 5) // Limiter à 5 offres
        .map(offer => ({
          id: offer.id,
          title: offer.title,
          distance: offer.distance < 1 ? `${Math.round(offer.distance * 1000)}m` : `${offer.distance.toFixed(1)}km`,
          type: offer.category,
          latitude: offer.latitude,
          longitude: offer.longitude
        })) || [];

      setNearbyOffers(offersWithDistance);
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
    }
  };

  // Notifier parent du changement de position et charger les offres
  useReactEffect(() => {
    if (userLocation) {
      onLocationUpdate?.(userLocation);
      loadNearbyOffers(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, onLocationUpdate]);

  // Initialize Mapbox
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [4.8357, 45.7640], // Lyon center
      zoom: 13
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add user location control automatically
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );


    // Add markers for user and nearby offers
    if (userLocation) {
      // User location marker
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

      // Center map on user location
      map.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14 });
    }

    // Add markers for nearby offers
    nearbyOffers.forEach(offer => {
      if (offer.latitude && offer.longitude) {
        new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([Number(offer.longitude), Number(offer.latitude)])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<div><strong>${offer.title}</strong><br/>${offer.distance}</div>`)
          )
          .addTo(map.current);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation, nearbyOffers]);

  const initializeMap = (token: string) => {
    setMapboxToken(token);
    setShowTokenInput(false);
  };

  if (showTokenInput) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Configuration Mapbox</h3>
          <p className="text-sm text-muted-foreground">
            Entrez votre token Mapbox pour activer la carte.
            <br />
            Obtenez-le sur{" "}
            <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com
            </a>
          </p>
        </div>
        <div className="w-full max-w-md space-y-3">
          <Input
            placeholder="Votre token Mapbox public"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="w-full"
          />
          <Button
            onClick={() => initializeMap(mapboxToken)}
            disabled={!mapboxToken.trim()}
            className="w-full"
          >
            Activer la carte
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Vraie carte Mapbox */}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Panneau d'informations */}
      <div className="absolute bottom-4 left-4 right-4">
        <Card className="bg-background/90 backdrop-blur-md border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-poppins font-bold text-foreground">Offres à proximité</h4>
              <Badge className="bg-gradient-flame text-white">
                {nearbyOffers.length} offres
              </Badge>
            </div>
            <div className="space-y-1">
              {nearbyOffers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{offer.title}</span>
                  <span className="text-primary font-medium">{offer.distance}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton de géolocalisation */}
      <div className="absolute top-4 right-4">
        <Button
          onClick={getCurrentPosition}
          disabled={isLoading}
          size="lg"
          className="bg-gradient-primary hover:opacity-90 rounded-full w-14 h-14 p-0 shadow-lg"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation size={24} className="text-white" />
          )}
        </Button>
      </div>

      {/* Indicateur de statut */}
      <div className="absolute top-4 left-4">
        <Badge className="bg-gradient-flame text-white">
          {userLocation ? "🔥 Position active" : "📍 Localisation..."}
        </Badge>
      </div>
    </div>
  );
}