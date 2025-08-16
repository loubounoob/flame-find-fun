import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useGeolocation } from "./useGeolocation";

interface OfferScore {
  offerId: string;
  score: number;
  details: {
    habitScore: number;
    proximityScore: number;
    popularityScore: number;
  };
}

export function useOfferScoring() {
  const { user } = useAuth();
  const { position } = useGeolocation();
  const location = position ? { lat: position.lat, lng: position.lng } : null;

  const { data: scoredOffers = [] } = useQuery({
    queryKey: ["offer-scoring", user?.id, location],
    queryFn: async (): Promise<OfferScore[]> => {
      if (!user) return [];

      // Get all offers and promotions
      const { data: offers, error: offersError } = await supabase
        .from("offers")
        .select("*")
        .eq("status", "active");

      if (offersError) throw offersError;

      const { data: promotions, error: promotionsError } = await supabase
        .from("promotions")
        .select("offer_id")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString());

      if (promotionsError) throw promotionsError;

      // Get user booking history
      const { data: userBookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("business_user_id, created_at")
        .eq("user_id", user.id);

      if (bookingsError) throw bookingsError;

      // Get offer statistics (flames, views, bookings)
      const { data: flames, error: flamesError } = await supabase
        .from("flames")
        .select("offer_id");

      if (flamesError) throw flamesError;

      const { data: views, error: viewsError } = await supabase
        .from("offer_views")
        .select("offer_id");

      if (viewsError) throw viewsError;

      const { data: bookings, error: allBookingsError } = await supabase
        .from("bookings")
        .select("offer_id");

      if (allBookingsError) throw allBookingsError;

      // Calculate scores for each offer
      const scoredOffers: OfferScore[] = offers.map((offer) => {
        // 1. Habit Score (0-4): Based on user's booking history with this business
        const userBookingsWithBusiness = userBookings.filter(
          booking => booking.business_user_id === offer.business_user_id
        );
        
        let habitScore = 0;
        if (userBookingsWithBusiness.length > 0) {
          const lastBooking = new Date(Math.max(...userBookingsWithBusiness.map(b => new Date(b.created_at).getTime())));
          const daysSinceLastBooking = (Date.now() - lastBooking.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLastBooking <= 30) habitScore = 4;
          else if (daysSinceLastBooking <= 90) habitScore = 3;
          else if (daysSinceLastBooking <= 180) habitScore = 2;
          else habitScore = 1;
        }

        // 2. Proximity Score (0-3.5): Based on distance from user
        let proximityScore = 0;
        if (location && offer.latitude && offer.longitude) {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            parseFloat(offer.latitude.toString()),
            parseFloat(offer.longitude.toString())
          );
          
          if (distance <= 1) proximityScore = 3.5;
          else if (distance <= 5) proximityScore = 3;
          else if (distance <= 10) proximityScore = 2;
          else if (distance <= 25) proximityScore = 1;
          else proximityScore = 0.5;
        } else {
          proximityScore = 1.5; // Default score if no location
        }

        // 3. Popularity Score (0-2.5): Based on flames, views, and bookings
        const offerFlames = flames.filter(f => f.offer_id === offer.id).length;
        const offerViews = views.filter(v => v.offer_id === offer.id).length;
        const offerBookings = bookings.filter(b => b.offer_id === offer.id).length;
        
        const totalInteractions = offerFlames * 2 + offerViews + offerBookings * 3;
        let popularityScore = 0;
        
        if (totalInteractions >= 100) popularityScore = 2.5;
        else if (totalInteractions >= 50) popularityScore = 2;
        else if (totalInteractions >= 20) popularityScore = 1.5;
        else if (totalInteractions >= 5) popularityScore = 1;
        else popularityScore = 0.5;

        // 4. Promotion bonus: Add 2 points if offer has active promotion
        const hasPromotion = promotions.some(p => p.offer_id === offer.id);
        const promotionBonus = hasPromotion ? 2 : 0;

        // 5. Boost bonus: Add points for active boosts
        let boostBonus = 0;
        // This will be enhanced when we add boost data fetching

        const totalScore = habitScore + proximityScore + popularityScore + promotionBonus + boostBonus;

        return {
          offerId: offer.id,
          score: Math.min(10, totalScore),
          details: {
            habitScore,
            proximityScore,
            popularityScore
          }
        };
      });

      return scoredOffers.sort((a, b) => b.score - a.score);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { scoredOffers };
}

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