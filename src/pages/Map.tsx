import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Filter, List, Heart, Flame } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/ui/bottom-nav";
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
            {offers.length} offres disponibles
          </Badge>
          {userLocation && (
            <Badge variant="outline" className="px-3 py-1">
              Position active
            </Badge>
          )}
        </div>
      </header>

      <div className="relative h-[calc(100vh-180px)]">
        {/* Vraie carte Mapbox */}
        <MapboxMap onLocationUpdate={handleLocationUpdate} />

        {/* Floating List Toggle */}
        {showList && (
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 max-h-80 overflow-y-auto">
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground mb-3">Offres disponibles</h3>
              {offers.map((offer) => (
                <Link key={offer.id} to={`/offer/${offer.id}`}>
                  <Card className="bg-gradient-card border-border/50 hover-lift">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{offer.title}</h4>
                          <p className="text-sm text-muted-foreground">{offer.category}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin size={12} className="text-primary" />
                              <span className="text-xs text-muted-foreground">{offer.location}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-gradient-flame text-white">
                          Voir détails
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}