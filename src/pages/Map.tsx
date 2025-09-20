import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UltraGoogleMap } from "@/components/ui/ultra-google-map";
import { Input } from "@/components/ui/input";
import { UnifiedFilterSystem } from "@/components/UnifiedFilterSystem";
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
}

export default function Map() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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
    queryKey: ['offers', searchQuery, selectedCategories, selectedLocation],
    queryFn: async () => {
      let query = supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      if (selectedCategories.length > 0) {
        query = query.in('category', selectedCategories);
      }

      if (selectedLocation) {
        query = query.ilike('location', `%${selectedLocation}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching offers:', error);
        throw error;
      }

      return data as Offer[];
    }
  });

  // Filter offers with valid coordinates for map display
  const offersWithCoords = offers.filter(offer => 
    offer.latitude !== null && offer.longitude !== null
  );

  // Get unique categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('category')
        .eq('status', 'active');

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map(item => item.category))];
      return uniqueCategories;
    }
  });

  // Convert offers to map markers
  const markers = offersWithCoords.map(offer => ({
    id: offer.id,
    position: { lat: offer.latitude!, lng: offer.longitude! },
    title: offer.title,
    info: `${offer.category} - ${offer.location}`
  }));

  return (
    <div className="h-screen flex flex-col pb-20">
      {/* Header with search and filters */}
      <div className="bg-background border-b p-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une activité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <UnifiedFilterSystem
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          availableCategories={categories}
        />
      </div>

      {/* Map and sidebar */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1 relative">
          <UltraGoogleMap
            markers={markers}
            center={userLocation || { lat: 48.8566, lng: 2.3522 }} // Default to Paris
            zoom={userLocation ? 12 : 10}
            className="w-full h-full"
          />
        </div>

        {/* Sidebar with offers */}
        <div className="w-96 border-l bg-background overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Activités trouvées ({offers.length})
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : offers.length > 0 ? (
              offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  id={offer.id}
                  title={offer.title}
                  description={offer.description}
                  category={offer.category}
                  location={offer.location}
                  imageUrl={offer.image_url}
                  businessUserId={offer.business_user_id}
                />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    Aucune activité trouvée avec ces critères
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategories([]);
                      setSelectedLocation("");
                    }}
                    className="mt-4"
                  >
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}