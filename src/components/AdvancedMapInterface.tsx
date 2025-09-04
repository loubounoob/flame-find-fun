import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedFilterSystem } from "@/components/UnifiedFilterSystem";
import { 
  MapPin, 
  Navigation, 
  Star, 
  Euro,
  Users,
  Heart,
  Flame,
  MapIcon,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { UltraGoogleMap } from "@/components/ui/ultra-google-map";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UnifiedFilters {
  search: string;
  category: string;
  maxDistance: number;
  priceRange: [number, number];
  rating: number;
  openNow: boolean;
  hasPromotion: boolean;
  participants: number;
  timeSlot: string;
}

export default function AdvancedMapInterface() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showBusinessPanel, setShowBusinessPanel] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFilters] = useState<UnifiedFilters>({
    search: "",
    category: "all",
    maxDistance: 10,
    priceRange: [0, 200],
    rating: 0,
    openNow: false,
    hasPromotion: false,
    participants: 1,
    timeSlot: "all"
  });

  // Fetch offers with business pricing data for better filtering
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["enhanced-offers-map", filters],
    queryFn: async () => {
      const { data: offersData, error: offersError } = await supabase
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
      
      if (offersError) throw offersError;

      // Enrich with business pricing data
      const enrichedOffers = await Promise.all(
        (offersData || []).map(async (offer) => {
          const { data: pricing } = await supabase
            .from("business_pricing")
            .select("price_amount, price_type")
            .eq("business_user_id", offer.business_user_id)
            .eq("is_active", true)
            .order("display_order", { ascending: true })
            .limit(1)
            .single();

          return {
            ...offer,
            pricing_info: pricing
          };
        })
      );
      
      return enrichedOffers;
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Enhanced filtering logic  
  const filteredOffers = offers.filter(offer => {
    // Search filter
    if (filters.search && !offer.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !offer.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Category filter - check if offer category contains or matches filter category
    if (filters.category !== "all") {
      const offerCategory = offer.category?.toLowerCase() || '';
      const filterCategory = filters.category.toLowerCase();
      if (!offerCategory.includes(filterCategory) && offerCategory !== filterCategory) {
        return false;
      }
    }

    // Distance filter (if user location available)
    if (filters.maxDistance && userLocation && offer.latitude && offer.longitude) {
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng, 
        Number(offer.latitude), Number(offer.longitude)
      );
      if (distance > filters.maxDistance) return false;
    }

    // Price filter - now uses business pricing data
    if (offer.pricing_info?.price_amount) {
      const price = Number(offer.pricing_info.price_amount);
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
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

  // Calculate distance between two points using Haversine formula
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setUserLocation(location);
  };

  const handleMapLoad = useCallback((mapInstance: any) => {
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

  const handleFiltersChange = (newFilters: UnifiedFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Enhanced Header with Unified Filter System */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gradient-primary">Découvrir</h1>
            <div className="text-sm text-muted-foreground">
              {filteredOffers.length} résultat{filteredOffers.length > 1 ? 's' : ''}
            </div>
          </div>
          
          <UnifiedFilterSystem 
            onFiltersChange={handleFiltersChange}
            showQuickCategories={true}
            showAdvancedToggle={true}
          />
        </div>
      </header>


      {/* Map Container */}
      <div className="h-screen pt-40">
        <UltraGoogleMap 
          onLocationUpdate={handleLocationUpdate}
          onMapLoad={handleMapLoad}
          filteredOffers={filteredOffers}
          selectedBusiness={selectedBusiness}
        />
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

                {/* Price Info - Now uses business pricing */}
                {selectedBusiness.pricing_info?.price_amount && (
                  <div className="flex items-center gap-2 mb-4">
                    <Euro size={16} className="text-primary" />
                    <span className="font-semibold text-lg">
                      À partir de {selectedBusiness.pricing_info.price_amount}€
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {selectedBusiness.pricing_info.price_type}
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
                <Link to={`/storefront/${selectedBusiness.id}`}>
                  Voir la boutique
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