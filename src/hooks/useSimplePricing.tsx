import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SimplePriceCalculation {
  basePrice: number;
  finalPrice: number;
  pricePerUnit: number;
  totalUnits: number;
  pricingType: string;
  breakdown: Array<{
    description: string;
    amount: number;
  }>;
}

export function useSimplePricing(
  offerId: string,
  businessUserId: string,
  participantCount: number,
  unitsCount: number = 1 // parties, heures, sessions selon l'activité
) {
  const [priceCalculation, setPriceCalculation] = useState<SimplePriceCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!offerId || !businessUserId || participantCount <= 0 || unitsCount <= 0) {
      setPriceCalculation(null);
      return;
    }

    calculatePrice();
  }, [offerId, businessUserId, participantCount, unitsCount]);

  const calculatePrice = async () => {
    setIsCalculating(true);
    try {
      // Get pricing options for this offer
      const { data: pricingOptions, error: pricingError } = await supabase
        .from('offer_pricing_options')
        .select('*')
        .eq('offer_id', offerId)
        .eq('is_default', true)
        .single();

      let basePrice = 0;
      let pricingType = 'per_person';

      if (!pricingError && pricingOptions) {
        basePrice = pricingOptions.price;
        // Determine pricing type from option name or description
        if (pricingOptions.option_name.toLowerCase().includes('partie') || 
            pricingOptions.option_name.toLowerCase().includes('game')) {
          pricingType = 'per_game';
        } else if (pricingOptions.option_name.toLowerCase().includes('heure') || 
                   pricingOptions.option_name.toLowerCase().includes('hour')) {
          pricingType = 'per_hour';
        } else if (pricingOptions.option_name.toLowerCase().includes('session')) {
          pricingType = 'per_session';
        }
      } else {
        // Fallback to business pricing
        const { data: businessPricing, error: businessError } = await supabase
          .from('business_pricing')
          .select('price_amount, price_type')
          .eq('business_user_id', businessUserId)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(1)
          .single();

        if (!businessError && businessPricing) {
          basePrice = businessPricing.price_amount;
          pricingType = businessPricing.price_type;
        }
      }

      // Calculate final price based on pricing type
      let finalPrice = 0;
      let pricePerUnit = basePrice;
      let totalUnits = unitsCount;

      const breakdown: SimplePriceCalculation['breakdown'] = [];

      switch (pricingType) {
        case 'per_game':
        case 'per_partie':
          // Prix par partie, multiplié par le nombre de parties et participants
          finalPrice = basePrice * unitsCount * participantCount;
          breakdown.push({
            description: `${unitsCount} partie${unitsCount > 1 ? 's' : ''} × ${participantCount} participant${participantCount > 1 ? 's' : ''}`,
            amount: finalPrice
          });
          break;
          
        case 'per_hour':
        case 'per_heure':
          // Prix par heure pour l'ensemble du groupe
          finalPrice = basePrice * unitsCount;
          breakdown.push({
            description: `${unitsCount} heure${unitsCount > 1 ? 's' : ''} (jusqu'à ${participantCount} joueurs)`,
            amount: finalPrice
          });
          break;
          
        case 'per_session':
          // Prix par session selon le nombre de participants
          finalPrice = basePrice * participantCount;
          breakdown.push({
            description: `Session pour ${participantCount} participant${participantCount > 1 ? 's' : ''}`,
            amount: finalPrice
          });
          break;
          
        default:
          // Prix par personne (défaut)
          finalPrice = basePrice * participantCount * unitsCount;
          breakdown.push({
            description: `${participantCount} participant${participantCount > 1 ? 's' : ''} × ${unitsCount} unité${unitsCount > 1 ? 's' : ''}`,
            amount: finalPrice
          });
      }

      setPriceCalculation({
        basePrice,
        finalPrice,
        pricePerUnit,
        totalUnits,
        pricingType,
        breakdown,
      });
    } catch (error) {
      console.error('Error calculating price:', error);
      setPriceCalculation(null);
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    priceCalculation,
    isCalculating,
    recalculate: calculatePrice,
  };
}