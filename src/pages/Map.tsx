import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Filter, List, Heart, Flame } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MapboxMap } from "@/components/ui/mapbox-map";
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

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0 lg:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 lg:px-8 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl lg:text-3xl font-poppins font-bold text-gradient-primary">
              Carte
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowList(!showList)} className="lg:w-12 lg:h-12">
                <List size={20} className="lg:w-6 lg:h-6" />
              </Button>
              <Button variant="outline" size="icon" className="lg:w-12 lg:h-12">
                <Filter size={20} className="lg:w-6 lg:h-6" />
              </Button>
            </div>
          </div>
          
          <div className="mt-3 lg:mt-4 flex gap-2">
            <Badge variant="secondary" className="px-3 py-1 flex-1 justify-center lg:text-sm">
              {offers.length} offres disponibles
            </Badge>
            {userLocation && (
              <Badge variant="outline" className="px-3 py-1 lg:text-sm">
                Position active
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="relative h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
        <MapboxMap 
          offers={offers}
          onLocationUpdate={handleLocationUpdate}
          className="w-full h-full"
        />
        
        {/* Floating action button */}
        <div className="absolute bottom-4 right-4">
          <Button 
            size="icon" 
            className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-primary shadow-lg"
            onClick={() => {
              // Get user location
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setUserLocation({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    });
                  },
                  (error) => {
                    console.error('Error getting location:', error);
                  }
                );
              }
            }}
          >
            <Navigation size={20} className="lg:w-6 lg:h-6" />
          </Button>
        </div>
      </div>

      {/* List overlay */}
      {showList && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-30 lg:relative lg:bg-transparent lg:backdrop-blur-none">
          <div className="p-4 lg:p-8 max-h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-lg lg:text-xl font-poppins font-semibold">Offres à proximité</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowList(false)} className="lg:hidden">
                <span className="text-2xl">×</span>
              </Button>
            </div>
            
            <div className="space-y-3 lg:space-y-4">
              {nearbyOffers.map((offer) => (
                <Link key={offer.id} to={`/offer/${offer.id}`}>
                  <Card className="bg-gradient-card border-border/50 hover-lift">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-start gap-3 lg:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 lg:mb-2">
                            <h3 className="font-semibold text-foreground lg:text-lg">{offer.title}</h3>
                            <Badge variant="secondary" className="text-xs lg:text-sm">
                              {offer.category}
                            </Badge>
                          </div>
                          <p className="text-sm lg:text-base text-muted-foreground mb-2 lg:mb-3">{offer.business}</p>
                          <div className="flex items-center gap-4 text-xs lg:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin size={12} className="lg:w-4 lg:h-4" />
                              <span>{offer.location}</span>
                            </div>
                            <span>{offer.distance}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 lg:gap-3">
                          <div className="flex items-center gap-1 bg-orange-500 text-white rounded-full px-2 py-1 text-xs font-semibold lg:px-3 lg:py-1.5 lg:text-sm">
                            <Flame size={12} className="fill-current lg:w-4 lg:h-4" />
                            {offer.flames}
                          </div>
                          <Badge className="bg-gradient-flame text-white text-xs lg:text-sm">
                            {offer.discount}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}