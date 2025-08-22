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
import { FilterModal } from "@/components/ui/filter-modal";

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
  const [filters, setFilters] = useState({
    category: "all",
    maxDistance: [10],
    priceRange: [0, 100],
    participants: "all",
    timeSlot: "all"
  });

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

  // Apply filters to offers
  const filteredOffers = offers.filter(offer => {
    // Category filter
    if (filters.category !== "all" && offer.category?.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    
    // Price filter - extract numeric value from price string
    if (offer.price) {
      const priceMatch = offer.price.match(/\d+/);
      if (priceMatch) {
        const price = parseInt(priceMatch[0]);
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
          return false;
        }
      }
    }
    
    return true;
  });

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setUserLocation(location);
  };

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsLoaded(true);
    
    // Add global functions for info window buttons
    (window as any).viewBusiness = (businessId: string) => {
      console.log('View business:', businessId);
      // Navigate to business profile or offers
    };
    
    (window as any).getDirections = (lat: number, lng: number) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = `${lat},${lng}`;
          const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
          window.open(url, '_blank');
        });
      } else {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
      }
    };
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
            Carte des entreprises
          </h1>
          <FilterModal 
            onFiltersChange={setFilters}
            currentFilters={filters}
          />
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

        {/* Recentering Button */}
        <div className="absolute top-20 right-4 z-10">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg"
            onClick={() => {
              if (userLocation && map) {
                (map as any).panTo(userLocation);
                (map as any).setZoom(15);
              }
            }}
            disabled={!userLocation}
          >
            <Navigation size={16} />
          </Button>
        </div>

        {/* Sliding Activities Panel */}
        <div className={`absolute bottom-0 left-0 right-0 transform transition-transform duration-300 ${showList ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'}`}>
          <div className="bg-background/95 backdrop-blur-md border-t border-border/50">
            {/* Handle */}
            <div 
              className="p-4 cursor-pointer flex items-center justify-center"
              onClick={() => setShowList(!showList)}
            >
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
            </div>
            
            {/* Content */}
          <div className="px-4 pb-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-foreground text-center mb-3">Activités à proximité</h3>
              
              {/* Real offers data */}
              <div className="space-y-3">
                {filteredOffers.slice(0, 3).map((offer) => (
                  <div 
                    key={offer.id} 
                    className="bg-background/50 rounded-lg p-3 border border-border/30 cursor-pointer hover:bg-background/70 transition-colors"
                    onClick={() => window.location.href = `/offer/${offer.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 overflow-hidden rounded-full flex-shrink-0">
                        {offer.image_url ? (
                          <img 
                            src={offer.image_url} 
                            alt={offer.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                            <span className="text-white font-bold text-xs">{offer.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm truncate">{offer.title}</h4>
                            <p className="text-xs text-muted-foreground">{offer.location}</p>
                            <p className="text-xs text-muted-foreground">{offer.category}</p>
                          </div>
                          {offer.latitude && offer.longitude && (
                            <span className="text-xs text-primary font-medium ml-2">
                              {/* Distance will be calculated */}
                              ~1km
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          {offer.price && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {offer.price}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Flame size={12} className="text-orange-500" />
                            <span className="text-xs text-muted-foreground">0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}