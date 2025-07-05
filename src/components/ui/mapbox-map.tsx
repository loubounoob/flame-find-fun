import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Crosshair, Zap, Target } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function MapboxMap({ onLocationUpdate }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [nearbyOffers, setNearbyOffers] = useState([
    { id: 1, title: "Bowling Party", distance: "250m", type: "bowling" },
    { id: 2, title: "Laser Game", distance: "450m", type: "laser" },
    { id: 3, title: "Karaoké VIP", distance: "800m", type: "karaoke" }
  ]);

  // Fonction pour obtenir la géolocalisation
  const getCurrentLocation = () => {
    setIsLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          onLocationUpdate?.(location);
          setIsLoading(false);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          // Position par défaut (Lyon)
          const defaultLocation = { lat: 45.7640, lng: 4.8357 };
          setUserLocation(defaultLocation);
          onLocationUpdate?.(defaultLocation);
          setIsLoading(false);
        }
      );
    } else {
      console.error('Géolocalisation non supportée');
      const defaultLocation = { lat: 45.7640, lng: 4.8357 };
      setUserLocation(defaultLocation);
      onLocationUpdate?.(defaultLocation);
      setIsLoading(false);
    }
  };

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

    // Add user location marker
    getCurrentLocation();

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

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
          onClick={getCurrentLocation}
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