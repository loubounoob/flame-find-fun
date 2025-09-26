import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlashOffer {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url?: string;
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
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      const activeRecurringPromotions = (recurringPromotions || []).filter(promotion => {
        const isCorrectDay = promotion.days_of_week.includes(currentDay);
        const isCorrectTime = currentTime >= promotion.start_time && currentTime <= promotion.end_time;
        return isCorrectDay && isCorrectTime;
      });

      const allFlashOffers: FlashOffer[] = [];

      // Add offers with recurring promotions
      activeRecurringPromotions.forEach(promo => {
        const offer = offers?.find(o => o.id === promo.offer_id);
        if (offer && offer.pricing_options && Array.isArray(offer.pricing_options) && offer.pricing_options.length > 0) {
          const pricingOptions = offer.pricing_options as Array<{price?: number}>;
          const basePrice = pricingOptions[0]?.price || 0;
          const discountAmount = (basePrice * promo.discount_percentage) / 100;
          const promotionalPrice = basePrice - discountAmount;

          allFlashOffers.push({
            ...offer,
            discount_percentage: promo.discount_percentage,
            original_price: basePrice,
            promotional_price: promotionalPrice,
            isFlash: true,
            endDate: getEndOfDay() // Recurring promotions end at end of day
          });
        }
      });

      // Add regular promotions
      regularPromotions?.forEach(promo => {
        const offer = offers?.find(o => o.id === promo.offer_id);
        if (offer) {
          allFlashOffers.push({
            ...offer,
            discount_percentage: promo.discount_value,
            original_price: promo.original_price,
            promotional_price: promo.promotional_price,
            isFlash: true,
            endDate: new Date(promo.end_date)
          });
        }
      });

      setFlashOffers(allFlashOffers);
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