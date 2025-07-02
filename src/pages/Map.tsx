import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Filter, List, Heart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
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
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={getCurrentLocation}
            className="flex-1"
          >
            <Navigation size={16} className="mr-2" />
            Ma position
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {nearbyOffers.length} offres près de toi
          </Badge>
        </div>
      </header>

      <div className="relative h-[calc(100vh-180px)]">
        {/* Map Placeholder */}
        <div className="w-full h-full bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center relative overflow-hidden">
          {/* Map pins */}
          {nearbyOffers.map((offer, index) => (
            <div
              key={offer.id}
              className={`absolute animate-bounce-in`}
              style={{
                left: `${20 + index * 25}%`,
                top: `${30 + index * 15}%`,
                animationDelay: `${index * 0.2}s`
              }}
            >
              <Button
                variant="flame"
                size="icon"
                className="rounded-full shadow-lg animate-pulse-glow"
              >
                <MapPin size={20} />
              </Button>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {offer.business}
              </div>
            </div>
          ))}

          {/* User location */}
          {userLocation && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-info rounded-full animate-ping"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-info rounded-full"></div>
            </div>
          )}

          <div className="text-center text-muted-foreground">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Carte interactive</p>
            <p className="text-sm">Découvre les offres autour de toi</p>
          </div>
        </div>

        {/* Floating List Toggle */}
        {showList && (
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 max-h-80 overflow-y-auto">
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground mb-3">Offres à proximité</h3>
              {nearbyOffers.map((offer) => (
                <Link key={offer.id} to={`/offer/${offer.id}`}>
                  <Card className="bg-gradient-card border-border/50 hover-lift">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{offer.title}</h4>
                          <p className="text-sm text-muted-foreground">{offer.business}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin size={12} className="text-primary" />
                              <span className="text-xs text-muted-foreground">{offer.distance}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart size={12} className="text-flame" />
                              <span className="text-xs text-muted-foreground">{offer.flames}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-gradient-flame text-white">
                          {offer.discount}
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
    </div>
  );
}