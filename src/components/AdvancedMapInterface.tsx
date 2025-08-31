import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Navigation, 
  Filter, 
  Search, 
  Star, 
  Clock, 
  Euro,
  Users,
  Heart,
  Flame,
  Phone,
  Globe,
  MapIcon,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { GoogleMap } from "@/components/ui/google-map";
import { BusinessMapMarkers } from "@/components/BusinessMapMarkers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdvancedFilters {
  search: string;
  category: string;
  maxDistance: number;
  priceRange: [number, number];
  rating: number;
  openNow: boolean;
  hasPromotion: boolean;
  participants: number;
}

export default function AdvancedMapInterface() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBusinessPanel, setShowBusinessPanel] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<AdvancedFilters>({
    search: "",
    category: "all",
    maxDistance: 10,
    priceRange: [0, 200],
    rating: 0,
    openNow: false,
    hasPromotion: false,
    participants: 1
  });

  // Fetch offers and businesses with enhanced data
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["enhanced-offers-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          *,
          business_ratings (
            average_rating,
            total_reviews
          ),
          promotions (
            discount_value,
            discount_type,
            end_date
          )
        `)
        .eq("status", "active");
      
      if (error) throw error;
      return data;
    },
  });

  // Enhanced filtering logic
  const filteredOffers = offers.filter(offer => {
    // Search filter
    if (filters.search && !offer.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !offer.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Category filter
    if (filters.category !== "all" && offer.category?.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }

    // Price filter
    if (offer.base_price) {
      if (offer.base_price < filters.priceRange[0] || offer.base_price > filters.priceRange[1]) {
        return false;
      }
    }

    // Rating filter
    if (filters.rating > 0) {
      const businessRating = offer.business_ratings?.[0] as any;
      if (!businessRating || !businessRating.average_rating || businessRating.average_rating < filters.rating) {
        return false;
      }
    }

    // Promotion filter
    if (filters.hasPromotion && !offer.promotions?.length) {
      return false;
    }

    // Max participants filter
    if (filters.participants > 1 && offer.max_participants && offer.max_participants < filters.participants) {
      return false;
    }

    return true;
  });

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setUserLocation(location);
  };

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsLoaded(true);
    
    // Enhanced global functions
    (window as any).viewBusiness = (businessId: string) => {
      const business = offers.find(offer => offer.id === businessId);
      if (business) {
        setSelectedBusiness(business);
        setShowBusinessPanel(true);
      }
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
  }, [offers]);

  const handleBusinessSelect = useCallback((business: any) => {
    setSelectedBusiness(business);
    setShowBusinessPanel(true);
  }, []);

  const toggleFavorite = (offerId: string) => {
    setFavorites(prev => 
      prev.includes(offerId) 
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    );
  };

  const recenterMap = () => {
    if (userLocation && map) {
      (map as any).panTo(userLocation);
      (map as any).setZoom(15);
    }
  };

  const categories = [
    "all", "Sport", "Culture", "Restauration", "Wellness", "Divertissement", 
    "Formation", "Aventure", "Art", "Technologie"
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Enhanced Header with Search */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gradient-primary">Découvrir</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter size={16} />
                Filtres
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Rechercher une activité, entreprise..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10"
            />
          </div>

          {/* Quick Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <Button
                key={category}
                variant={filters.category === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters({...filters, category})}
                className="whitespace-nowrap"
              >
                {category === "all" ? "Tous" : category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="absolute top-0 left-0 right-0 bottom-0 z-40 bg-background/95 backdrop-blur-md">
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Filtres avancés</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Distance */}
              <div className="space-y-3">
                <Label>Distance maximale: {filters.maxDistance}km</Label>
                <Slider
                  value={[filters.maxDistance]}
                  onValueChange={(value) => setFilters({...filters, maxDistance: value[0]})}
                  max={50}
                  step={1}
                />
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label>Gamme de prix: {filters.priceRange[0]}€ - {filters.priceRange[1]}€</Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => setFilters({...filters, priceRange: value as [number, number]})}
                  max={500}
                  step={10}
                />
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <Label>Note minimum: {filters.rating} étoiles</Label>
                <Slider
                  value={[filters.rating]}
                  onValueChange={(value) => setFilters({...filters, rating: value[0]})}
                  max={5}
                  step={0.5}
                />
              </div>

              {/* Participants */}
              <div className="space-y-3">
                <Label>Nombre de participants: {filters.participants}</Label>
                <Slider
                  value={[filters.participants]}
                  onValueChange={(value) => setFilters({...filters, participants: value[0]})}
                  max={20}
                  step={1}
                  min={1}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ouvert maintenant</Label>
                  <Switch 
                    checked={filters.openNow}
                    onCheckedChange={(checked) => setFilters({...filters, openNow: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Avec promotions</Label>
                  <Switch 
                    checked={filters.hasPromotion}
                    onCheckedChange={(checked) => setFilters({...filters, hasPromotion: checked})}
                  />
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {filteredOffers.length} résultat(s) trouvé(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="h-screen pt-32">
        <GoogleMap 
          onLocationUpdate={handleLocationUpdate}
          onMapLoad={handleMapLoad}
        />
        
        <BusinessMapMarkers 
          map={map}
          isLoaded={isLoaded}
          onMarkerClick={handleBusinessSelect}
        />

        {/* Floating Controls */}
        <div className="absolute top-40 right-4 z-20 space-y-2">
          <Button
            variant="outline"
            size="icon"
            onClick={recenterMap}
            disabled={!userLocation}
            className="bg-background/90 backdrop-blur-sm shadow-lg"
          >
            <Navigation size={16} />
          </Button>
        </div>
      </div>

      {/* Business Detail Panel */}
      {showBusinessPanel && selectedBusiness && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-background border-t border-border/50 max-h-[70vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">{selectedBusiness.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(selectedBusiness.id)}
                  >
                    <Heart 
                      size={16} 
                      className={favorites.includes(selectedBusiness.id) ? "fill-red-500 text-red-500" : ""} 
                    />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {selectedBusiness.location}
                  </div>
                  {selectedBusiness.business_ratings?.[0] && typeof selectedBusiness.business_ratings[0] === 'object' && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      {selectedBusiness.business_ratings[0].average_rating?.toFixed(1)}
                      <span>({selectedBusiness.business_ratings[0].total_reviews})</span>
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="mb-3">
                  {selectedBusiness.category}
                </Badge>

                {selectedBusiness.description && (
                  <p className="text-sm mb-4">{selectedBusiness.description}</p>
                )}

                {/* Promotions */}
                {selectedBusiness.promotions?.length > 0 && (
                  <div className="mb-4">
                    <Badge variant="destructive" className="mb-2">
                      Promotion active
                    </Badge>
                    <p className="text-sm text-green-600">
                      {selectedBusiness.promotions[0].discount_value}% de réduction
                    </p>
                  </div>
                )}

                {/* Price Info */}
                {selectedBusiness.base_price && (
                  <div className="flex items-center gap-2 mb-4">
                    <Euro size={16} className="text-primary" />
                    <span className="font-semibold text-lg">
                      À partir de {selectedBusiness.base_price}€
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBusinessPanel(false)}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link to={`/offer/${selectedBusiness.id}`}>
                  Voir détails
                </Link>
              </Button>
              <Button 
                variant="outline"
                onClick={() => (window as any).getDirections(selectedBusiness.latitude, selectedBusiness.longitude)}
              >
                <MapIcon size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des activités...</p>
          </div>
        </div>
      )}
    </div>
  );
}