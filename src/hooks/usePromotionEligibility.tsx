import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecurringPromotion {
  id: string;
  offer_id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  discount_percentage: number;
  is_active: boolean;
}

interface Promotion {
  id: string;
  offer_id: string;
  discount_value: number;
  discount_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  original_price: number;
  promotional_price: number;
}

interface PromotionEligibility {
  isEligible: boolean;
  promotion: RecurringPromotion | Promotion | null;
  discountPercentage: number;
  promotionType: 'recurring' | 'regular' | null;
  scheduleInfo?: string;
}

export function usePromotionEligibility(
  offerId: string | undefined,
  bookingDate: Date | undefined,
  bookingTime: string | undefined
): PromotionEligibility {
  const { data: recurringPromotions = [] } = useQuery({
    queryKey: ["recurringPromotions", offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from("recurring_promotions")
        .select("*")
        .eq("offer_id", offerId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data as RecurringPromotion[];
    },
    enabled: !!offerId,
  });

  const { data: regularPromotions = [] } = useQuery({
    queryKey: ["promotions", offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("offer_id", offerId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data as Promotion[];
    },
    enabled: !!offerId,
  });

  if (!bookingDate || !bookingTime || !offerId) {
    return {
      isEligible: false,
      promotion: null,
      discountPercentage: 0,
      promotionType: null,
    };
  }

  // Check recurring promotions first (priority)
  for (const promo of recurringPromotions) {
    const dayOfWeek = bookingDate.getDay();
    
    if (promo.days_of_week.includes(dayOfWeek)) {
      const [startHour, startMin] = promo.start_time.split(':').map(Number);
      const [endHour, endMin] = promo.end_time.split(':').map(Number);
      const [bookingHour, bookingMin] = bookingTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const bookingMinutes = bookingHour * 60 + bookingMin;

      if (bookingMinutes >= startMinutes && bookingMinutes <= endMinutes) {
        const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const activeDays = promo.days_of_week.map(d => days[d]).join(', ');
        
        return {
          isEligible: true,
          promotion: promo,
          discountPercentage: promo.discount_percentage,
          promotionType: 'recurring',
          scheduleInfo: `Valable le ${activeDays} de ${promo.start_time.slice(0, 5)} à ${promo.end_time.slice(0, 5)}`,
        };
      }
    }
  }

  // Check regular promotions
  for (const promo of regularPromotions) {
    const promoStart = new Date(promo.start_date);
    const promoEnd = new Date(promo.end_date);
    
    if (bookingDate >= promoStart && bookingDate <= promoEnd) {
      const discountPercentage = promo.discount_type === 'percentage' 
        ? promo.discount_value 
        : 0;
      
      return {
        isEligible: true,
        promotion: promo,
        discountPercentage,
        promotionType: 'regular',
        scheduleInfo: `Valable jusqu'au ${new Date(promo.end_date).toLocaleDateString('fr-FR')}`,
      };
    }
  }

  return {
    isEligible: false,
    promotion: null,
    discountPercentage: 0,
    promotionType: null,
  };
}
