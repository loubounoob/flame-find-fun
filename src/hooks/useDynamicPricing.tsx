import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceCalculation {
  basePrice: number;
  finalPrice: number;
  appliedRules: Array<{
    rule_name: string;
    modifier: number;
    is_percentage: boolean;
    savings?: number;
  }>;
  totalSavings: number;
  breakdown: Array<{
    description: string;
    amount: number;
  }>;
}

export function useDynamicPricing(
  offerId: string,
  businessUserId: string,
  participantCount: number,
  bookingDate?: string,
  bookingTime?: string
) {
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!offerId || !businessUserId || participantCount <= 0) {
      setPriceCalculation(null);
      return;
    }

    calculatePrice();
  }, [offerId, businessUserId, participantCount, bookingDate, bookingTime]);

  const calculatePrice = async () => {
    setIsCalculating(true);
    try {
      // First try to get base price from business pricing
      const { data: businessPricing, error: businessPricingError } = await supabase
        .from('business_pricing')
        .select('price_amount, price_type')
        .eq('business_user_id', businessUserId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      let basePrice = 0;
      
      if (!businessPricingError && businessPricing) {
        basePrice = businessPricing.price_amount;
      } else {
        // Fallback to offer-specific pricing
        const { data: offer, error: offerError } = await supabase
          .from('offers')
          .select('base_price, pricing_options')
          .eq('id', offerId)
          .single();

        if (offerError) throw offerError;

        basePrice = offer.base_price || 0;

        // If still no base price, get from pricing options
        if (basePrice === 0) {
          const { data: pricingOptions, error: pricingError } = await supabase
            .from('offer_pricing_options')
            .select('price')
            .eq('offer_id', offerId)
            .eq('is_default', true)
            .single();

          if (!pricingError && pricingOptions) {
            basePrice = pricingOptions.price;
          }
        }
      }

      // Get applicable pricing rules
      const { data: rules, error: rulesError } = await supabase
        .from('business_pricing_rules')
        .select('*')
        .eq('business_user_id', businessUserId)
        .or(`offer_id.eq.${offerId},offer_id.is.null`)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;

      let finalPrice = basePrice * participantCount;
      const appliedRules: PriceCalculation['appliedRules'] = [];
      const breakdown: PriceCalculation['breakdown'] = [
        { description: `Prix de base (${participantCount} participants)`, amount: finalPrice }
      ];

      // Apply rules
      for (const rule of rules || []) {
        let shouldApply = false;
        let ruleModifier = 0;

        switch (rule.rule_type) {
          case 'participant_tiers':
            const conditions = rule.conditions as any;
            const minParticipants = conditions?.min_participants || 0;
            const maxParticipants = conditions?.max_participants || 999;
            shouldApply = participantCount >= minParticipants && participantCount <= maxParticipants;
            break;

          case 'time_slots':
            if (bookingTime) {
              const timeConditions = rule.conditions as any;
              const startTime = timeConditions?.start_time || '00:00:00';
              const endTime = timeConditions?.end_time || '23:59:59';
              shouldApply = bookingTime >= startTime && bookingTime <= endTime;
            }
            break;

          case 'day_of_week':
            if (bookingDate) {
              const dayOfWeek = new Date(bookingDate).getDay();
              const dayConditions = rule.conditions as any;
              const allowedDays = dayConditions?.days || [];
              shouldApply = Array.isArray(allowedDays) && allowedDays.includes(dayOfWeek);
            }
            break;

          default:
            shouldApply = false;
        }

        if (shouldApply) {
          const originalPrice = finalPrice;
          
          if (rule.is_percentage) {
            ruleModifier = finalPrice * (rule.price_modifier / 100);
            finalPrice = finalPrice * (1 + rule.price_modifier / 100);
          } else {
            ruleModifier = rule.price_modifier;
            finalPrice = finalPrice + rule.price_modifier;
          }

          const savings = originalPrice - finalPrice;
          
          appliedRules.push({
            rule_name: rule.rule_name,
            modifier: rule.price_modifier,
            is_percentage: rule.is_percentage,
            savings: savings > 0 ? savings : undefined,
          });

          breakdown.push({
            description: rule.rule_name,
            amount: ruleModifier,
          });
        }
      }

      // Ensure price is never negative
      finalPrice = Math.max(finalPrice, 0);

      const totalSavings = appliedRules
        .filter(rule => rule.savings && rule.savings > 0)
        .reduce((sum, rule) => sum + (rule.savings || 0), 0);

      setPriceCalculation({
        basePrice,
        finalPrice,
        appliedRules,
        totalSavings,
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