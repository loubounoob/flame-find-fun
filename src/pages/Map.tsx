import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapboxMap } from "@/components/ui/mapbox-map";
import { Input } from "@/components/ui/input";
import { useRecurringPromotions } from "@/hooks/useRecurringPromotions";
import { OfferCard } from "@/components/ui/offer-card";
import { Search, MapPin } from "lucide-react";
import { BottomNav } from "@/components/ui/bottom-nav";

interface Offer {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  business_user_id: string;
  profiles?: {
    avatar_url: string | null;
    business_name: string | null;
    business_type: string | null;
  };
}

export default function Map() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { applyPromotionToOffers } = useRecurringPromotions();

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch offers
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['offers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data: offersData, error: offersError } = await query;

      if (offersError) {
        console.error('Error fetching offers:', offersError);
        throw offersError;
      }

      // Fetch profiles for all business users
      const businessUserIds = [...new Set(offersData?.map(o => o.business_user_id) || [])];
      
      if (businessUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, avatar_url, business_name, business_type')
          .in('user_id', businessUserIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Join profiles data with offers
        const offersWithProfiles = offersData?.map(offer => ({
          ...offer,
          profiles: profilesData?.find(p => p.user_id === offer.business_user_id)
        }));

        return offersWithProfiles as Offer[];
      }

      return offersData as Offer[];
    }
  });

  // Filter offers with valid coordinates for map display
  const offersWithCoords = offers.filter(offer => 
    offer.latitude !== null && offer.longitude !== null
  );

  // Apply recurring promotions to offers
  const offersWithPromotions = applyPromotionToOffers(offersWithCoords);


  // Convert offers to map markers
  const markers = offersWithCoords.map(offer => ({
    id: offer.id,
    position: { lat: offer.latitude!, lng: offer.longitude! },
    title: offer.title,
    info: `${offer.category} - ${offer.location}`
  }));

  return (
    <div className="h-screen flex flex-col pb-20">
      {/* Header */}
      <div className="bg-background border-b p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Carte des activités</h1>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une activité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map full screen */}
      <div className="flex-1">
        <MapboxMap
          filteredOffers={offersWithPromotions}
        />
      </div>
      <BottomNav />
    </div>
  );
}