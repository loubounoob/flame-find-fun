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
    }
  }
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';

interface GoogleMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function GoogleMap({ onLocationUpdate }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [nearbyOffers, setNearbyOffers] = useState<any[]>([]);
  const { position, isLoading: locationLoading, getCurrentPosition } = useGeolocation();

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

  // Calculer la distance entre deux points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance en km
    return distance;
  };

  // Charger les offres proches
  const loadNearbyOffers = (lat: number, lng: number) => {
    const nearby = offers
      .filter(offer => offer.latitude && offer.longitude)
        .map(offer => ({
          ...offer,
          distance: calculateDistance(lat, lng, Number(offer.latitude), Number(offer.longitude))
        }))
      .filter(offer => offer.distance <= 5) // 5km radius
      .sort((a, b) => a.distance - b.distance);
    
    setNearbyOffers(nearby);
  };

  // Initialiser Google Maps
  const initializeMap = async (apiKey: string) => {
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
        zoom: 13,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Ajouter des marqueurs pour les offres
      offers.forEach(offer => {
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
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#ff6b35" stroke="white" stroke-width="2"/>
                  <path d="M16 8l2.5 5 5.5 0.5-4 4 1 5.5-5-2.5-5 2.5 1-5.5-4-4 5.5-0.5z" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32)
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h3 style="margin: 0 0 4px 0; font-weight: bold;">${offer.title}</h3>
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">${offer.category}</p>
                <p style="margin: 0; color: #333; font-size: 14px;">${offer.location}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
      });

      // Marqueur pour la position de l'utilisateur
      if (position) {
        new google.maps.Marker({
          position: position,
          map: map,
          title: 'Votre position',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#4285f4" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });

        loadNearbyOffers(position.lat, position.lng);
        onLocationUpdate?.(position);
      }

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  // Recentrer sur la position de l'utilisateur
  const recenterMap = () => {
    if (position && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(15);
    } else {
      getCurrentPosition();
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setShowApiKeyInput(false);
      initializeMap(apiKey);
    }
  };

  useEffect(() => {
    if (!showApiKeyInput && apiKey) {
      initializeMap(apiKey);
    }
  }, [offers, position]);

  if (showApiKeyInput) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Configuration Google Maps</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Entrez votre clé API Google Maps pour afficher la carte
                </p>
              </div>
              <Input
                type="text"
                placeholder="Clé API Google Maps"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Charger la carte
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Obtenez votre clé API sur{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          variant="outline"
          size="icon"
          onClick={recenterMap}
          disabled={locationLoading}
          className="bg-background/95 backdrop-blur-sm"
        >
          <Navigation size={20} />
        </Button>
      </div>

      {/* Nearby offers list */}
      {nearbyOffers.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4">
          <Card className="bg-background/95 backdrop-blur-md border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Offres à proximité</h3>
                <Badge variant="secondary" className="text-xs">
                  {nearbyOffers.length} offre{nearbyOffers.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {nearbyOffers.slice(0, 3).map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{offer.title}</p>
                      <p className="text-muted-foreground text-xs">{offer.category}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      {offer.distance < 1 
                        ? `${Math.round(offer.distance * 1000)}m`
                        : `${offer.distance.toFixed(1)}km`
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}