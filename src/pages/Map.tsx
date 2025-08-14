import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Filter, List, Heart, Flame } from "lucide-react";
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";
import { GoogleMap } from "@/components/ui/google-map";
import { BusinessMapMarkers } from "@/components/BusinessMapMarkers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const nearbyOffers = [
  {
    id: "map-1",
    title: "Bowling Party",
    business: "Strike Zone",
    location: "15 Rue de la République",
    distance: "250m",
    discount: "Une partie gratuite",
    category: "Bowling",
    flames: 247,
    coords: { lat: 45.7640, lng: 4.8357 }
  },
  {
    id: "map-2",
    title: "Laser Game Epic",
    business: "Galaxy Arena",
    location: "Centre Commercial Part-Dieu",
    distance: "1.2km",
    discount: "50% de réduction",
    category: "Laser Game",
    flames: 189,
    coords: { lat: 45.7606, lng: 4.8566 }
  },
  {
    id: "map-3",
    title: "Karaoké VIP",
    business: "Sing & Dance",
    location: "Quartier Bellecour",
    distance: "800m",
    discount: "Salon gratuit",
    category: "Karaoké",
    flames: 156,
    coords: { lat: 45.7578, lng: 4.8320 }
  }
];

export default function Map() {
  const [showList, setShowList] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  // Récupérer les vraies offres depuis Supabase
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

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setUserLocation(location);
  };

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsLoaded(true);
  }, []);

  const handleBusinessSelect = useCallback((business: any) => {
    setSelectedBusiness(business);
    setShowList(true);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
            Carte
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowList(!showList)}>
              <List size={20} />
            </Button>
            <Button variant="outline" size="icon">
              <Filter size={20} />
            </Button>
          </div>
        </div>
        
        <div className="mt-3 flex gap-2">
          <Badge variant="secondary" className="px-3 py-1 flex-1 justify-center">
            Entreprises du réseau
          </Badge>
          {userLocation && (
            <Badge variant="outline" className="px-3 py-1">
              Position active
            </Badge>
          )}
          {selectedBusiness && (
            <Badge variant="default" className="px-3 py-1">
              {selectedBusiness.business_name}
            </Badge>
          )}
        </div>
      </header>

      <div className="relative h-[calc(100vh-180px)]">
        {/* Carte Google Maps */}
        <GoogleMap 
          onLocationUpdate={handleLocationUpdate}
          onMapLoad={handleMapLoad}
        />
        
        {/* Business Markers */}
        <BusinessMapMarkers 
          map={map}
          isLoaded={isLoaded}
          onMarkerClick={handleBusinessSelect}
        />

        {/* Floating List Toggle */}
        {showList && selectedBusiness && (
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 max-h-80 overflow-y-auto">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{selectedBusiness.business_name}</h3>
                <Button variant="outline" size="sm" onClick={() => setShowList(false)}>
                  Fermer
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-sm text-muted-foreground">{selectedBusiness.address}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Flame size={14} className="text-flame" />
                    <span className="text-sm">{selectedBusiness.total_flames} flames</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{selectedBusiness.total_offers} offres actives</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedBusiness.business_type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}