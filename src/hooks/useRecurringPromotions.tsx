import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecurringPromotion {
  id: string;
  offer_id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  discount_percentage: number;
  is_active: boolean;
}

interface OfferWithPromotion {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url?: string;
  video_url?: string;
  pricing_options: any;
  business_user_id: string;
  has_promotion: boolean;
  activePromotion?: {
    discount_percentage: number;
    original_price: number;
    promotional_price: number;
  };
}

export const useRecurringPromotions = () => {
  const [activePromotions, setActivePromotions] = useState<RecurringPromotion[]>([]);

  useEffect(() => {
    loadActivePromotions();
    
    // Check for active promotions every minute
    const interval = setInterval(loadActivePromotions, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadActivePromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_promotions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Filter promotions that are currently active based on time and day
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      const currentlyActivePromotions = (data || []).filter(promotion => {
        const isCorrectDay = promotion.days_of_week.includes(currentDay);
        const isCorrectTime = currentTime >= promotion.start_time && currentTime <= promotion.end_time;
        
        return isCorrectDay && isCorrectTime;
      });

      setActivePromotions(currentlyActivePromotions);
    } catch (error) {
      console.error('Erreur lors du chargement des promotions actives:', error);
    }
  };

  const applyPromotionToOffers = (offers: any[]): OfferWithPromotion[] => {
    return offers.map(offer => {
      const activePromotion = activePromotions.find(promo => promo.offer_id === offer.id);
      
      if (activePromotion) {
        // Get the base price from pricing_options
        const basePrice = offer.pricing_options?.[0]?.price || 0;
        const discountAmount = (basePrice * activePromotion.discount_percentage) / 100;
        const promotionalPrice = basePrice - discountAmount;

        return {
          ...offer,
          has_promotion: true,
          activePromotion: {
            discount_percentage: activePromotion.discount_percentage,
            original_price: basePrice,
            promotional_price: promotionalPrice
          }
        };
      }

      return {
        ...offer,
        has_promotion: false
      };
    });
  };

  const isOfferCurrentlyPromoted = (offerId: string): boolean => {
    return activePromotions.some(promo => promo.offer_id === offerId);
  };

  const getPromotionForOffer = (offerId: string): RecurringPromotion | null => {
    return activePromotions.find(promo => promo.offer_id === offerId) || null;
  };

  return {
    activePromotions,
    applyPromotionToOffers,
    isOfferCurrentlyPromoted,
    getPromotionForOffer,
    refreshPromotions: loadActivePromotions
  };
};

export default useRecurringPromotions;