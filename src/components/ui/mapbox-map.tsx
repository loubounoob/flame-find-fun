import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Crosshair, Zap, Target } from "lucide-react";

interface MapboxMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function MapboxMap({ onLocationUpdate }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-lg overflow-hidden">
      {/* Interface style Snapchat Map avec cercles concentriques */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Cercles concentriques animés */}
        <div className="absolute w-80 h-80 border-2 border-primary/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute w-60 h-60 border-2 border-secondary/40 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-40 h-40 border-2 border-flame/50 rounded-full animate-ping" style={{ animationDuration: '1s' }} />
        
        {/* Centre utilisateur */}
        <div className="relative w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center z-10 animate-pulse-glow">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-gradient-primary rounded-full" />
          </div>
        </div>

        {/* Offres positionnées autour */}
        <div className="absolute top-20 left-20">
          <div className="w-12 h-12 bg-gradient-flame rounded-full flex items-center justify-center animate-bounce">
            <Zap size={20} className="text-white" />
          </div>
          <div className="text-xs text-center mt-1 font-semibold">250m</div>
        </div>

        <div className="absolute bottom-20 right-20">
          <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <Target size={20} className="text-white" />
          </div>
          <div className="text-xs text-center mt-1 font-semibold">450m</div>
        </div>

        <div className="absolute top-32 right-16">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
            <MapPin size={20} className="text-white" />
          </div>
          <div className="text-xs text-center mt-1 font-semibold">800m</div>
        </div>
      </div>

      {/* Panneau d'informations style Snapchat */}
      <div className="absolute bottom-4 left-4 right-4">
        <Card className="bg-background/90 backdrop-blur-md border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-poppins font-bold text-foreground">Découverte en cours...</h4>
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

      {/* Bouton de géolocalisation style Snapchat */}
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
        <Badge className="bg-gradient-flame text-white animate-pulse">
          {userLocation ? "🔥 Connecté" : "📍 Localisation..."}
        </Badge>
      </div>
    </div>
  );
}