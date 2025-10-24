import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlashOffer {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string;
  image_urls?: any;
  video_url?: string;
  pricing_options: any;
  business_user_id: string;
  discount_percentage: number;
  original_price: number;
  promotional_price: number;
  isFlash: boolean;
  endDate: Date;
}

export const useFlashOffers = () => {
  const [flashOffers, setFlashOffers] = useState<FlashOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlashOffers();
    // Update every minute to check for new active promotions
    const interval = setInterval(loadFlashOffers, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadFlashOffers = async () => {
    setLoading(true);
    try {
      // Get all active offers
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');

      if (offersError) throw offersError;

      // Get active regular promotions
      const { data: regularPromotions, error: regularPromotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString());

      if (regularPromotionsError) throw regularPromotionsError;

      // Get active recurring promotions
      const { data: recurringPromotions, error: recurringError } = await supabase
        .from('recurring_promotions')
        .select('*')
        .eq('is_active', true);

      if (recurringError) throw recurringError;

      // Filter recurring promotions that are currently active based on time and day
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTimeStr = now.toTimeString().slice(0, 8); // HH:MM:SS format

      console.log('Debug recurring promotions:', {
        currentDay,
        currentTime: currentTimeStr,
        totalRecurringPromotions: recurringPromotions?.length,
        recurringPromotions
      });

      const timeToMinutes = (t: string) => {
        // Accepts HH:MM or HH:MM:SS
        const [h, m, s] = t.split(':').map((x) => parseInt(x, 10));
        return (h || 0) * 60 + (m || 0);
      };

      const currentMinutes = timeToMinutes(currentTimeStr);

      const activeRecurringPromotions = (recurringPromotions || []).filter(promotion => {
        const isCorrectDay = promotion.days_of_week.includes(currentDay);
        const startMinutes = timeToMinutes(promotion.start_time);
        const endMinutes = timeToMinutes(promotion.end_time);
        const isCorrectTime = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        
        console.log(`Promo ${promotion.id}:`, {
          days_of_week: promotion.days_of_week,
          start_time: promotion.start_time,
          end_time: promotion.end_time,
          isCorrectDay,
          isCorrectTime,
          isActive: isCorrectDay && isCorrectTime
        });
        
        return isCorrectDay && isCorrectTime;
      });

      // Helper to extract a sensible base price from pricing_options
      const getBasePrice = (options: any): number => {
        try {
          if (!options) return 0;
          const arr = Array.isArray(options) ? options : [];
          if (arr.length === 0) return 0;
          const defaultOpt = arr.find((o: any) => o?.is_default === true && typeof o?.price === 'number');
          if (defaultOpt) return defaultOpt.price;
          const withPrice = arr.filter((o: any) => typeof o?.price === 'number');
          if (withPrice.length > 0) {
            // Use the lowest available price to be conservative
            return withPrice.reduce((min: number, o: any) => Math.min(min, o.price), withPrice[0].price);
          }
          return 0;
        } catch {
          return 0;
        }
      };

      // Use a map to avoid duplicates per offer (keep the best discount)
      const flashByOfferId = new Map<string, FlashOffer>();

      // Add offers with recurring promotions
      activeRecurringPromotions.forEach(promo => {
        const offer = offers?.find(o => o.id === promo.offer_id);
        if (!offer) return;
        const basePrice = getBasePrice(offer.pricing_options);
        const promotionalPrice = Math.max(basePrice - (basePrice * Number(promo.discount_percentage)) / 100, 0);
        
        // Calculate the exact end time based on the promotion's end_time
        const endDateTime = new Date();
        const [hours, minutes, seconds] = promo.end_time.split(':').map(x => parseInt(x, 10));
        endDateTime.setHours(hours || 0, minutes || 0, seconds || 0, 0);
        
        const candidate: FlashOffer = {
          ...offer,
          discount_percentage: Number(promo.discount_percentage) || 0,
          original_price: basePrice,
          promotional_price: promotionalPrice,
          isFlash: true,
          endDate: endDateTime
        };

        const existing = flashByOfferId.get(offer.id);
        if (!existing || candidate.discount_percentage > existing.discount_percentage) {
          flashByOfferId.set(offer.id, candidate);
        }
      });

      // Add regular promotions
      regularPromotions?.forEach(promo => {
        const offer = offers?.find(o => o.id === promo.offer_id);
        if (!offer) return;
        const candidate: FlashOffer = {
          ...offer,
          discount_percentage: Number(promo.discount_value) || 0,
          original_price: Number(promo.original_price) || 0,
          promotional_price: Number(promo.promotional_price) || 0,
          isFlash: true,
          endDate: new Date(promo.end_date)
        };
        const existing = flashByOfferId.get(offer.id);
        if (!existing || candidate.discount_percentage > existing.discount_percentage) {
          flashByOfferId.set(offer.id, candidate);
        }
      });

      setFlashOffers(Array.from(flashByOfferId.values()));
    } catch (error) {
      console.error('Erreur lors du chargement des offres flash:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEndOfDay = () => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return endOfDay;
  };

  return {
    flashOffers,
    loading,
    refreshFlashOffers: loadFlashOffers
  };
};

export default useFlashOffers;