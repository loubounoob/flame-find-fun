-- Add total_price column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN total_price NUMERIC DEFAULT 0;

-- Create business_pricing_rules table for advanced pricing configurations
CREATE TABLE public.business_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id UUID NOT NULL,
  offer_id UUID,
  rule_type TEXT NOT NULL, -- 'participant_tiers', 'time_slots', 'duration_multiplier', 'seasonal', 'day_of_week'
  rule_name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  is_percentage BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_revenue_stats table for caching revenue calculations
CREATE TABLE public.business_revenue_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id UUID NOT NULL,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_revenue NUMERIC DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  average_booking_value NUMERIC DEFAULT 0,
  top_offer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_user_id, stat_date)
);

-- Enable RLS on new tables
ALTER TABLE public.business_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_revenue_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_pricing_rules
CREATE POLICY "Business users can view their own pricing rules"
ON public.business_pricing_rules
FOR SELECT
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can create their own pricing rules"
ON public.business_pricing_rules
FOR INSERT
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own pricing rules"
ON public.business_pricing_rules
FOR UPDATE
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can delete their own pricing rules"
ON public.business_pricing_rules
FOR DELETE
USING (auth.uid() = business_user_id);

-- RLS Policies for business_revenue_stats
CREATE POLICY "Business users can view their own revenue stats"
ON public.business_revenue_stats
FOR SELECT
USING (auth.uid() = business_user_id);

CREATE POLICY "System can manage revenue stats"
ON public.business_revenue_stats
FOR ALL
USING (true);

-- Create function to calculate booking price based on rules
CREATE OR REPLACE FUNCTION public.calculate_booking_price(
  p_offer_id UUID,
  p_business_user_id UUID,
  p_participant_count INTEGER,
  p_booking_date TIMESTAMP WITH TIME ZONE,
  p_booking_time TIME
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_price NUMERIC := 0;
  v_final_price NUMERIC := 0;
  v_rule_modifier NUMERIC := 0;
  v_rule RECORD;
BEGIN
  -- Get base price from offer
  SELECT COALESCE(base_price, 0) INTO v_base_price
  FROM offers 
  WHERE id = p_offer_id;
  
  -- If no base price, try to get from pricing options
  IF v_base_price = 0 THEN
    SELECT COALESCE(price, 0) INTO v_base_price
    FROM offer_pricing_options 
    WHERE offer_id = p_offer_id AND is_default = true
    LIMIT 1;
  END IF;
  
  v_final_price := v_base_price * p_participant_count;
  
  -- Apply pricing rules in priority order
  FOR v_rule IN 
    SELECT * FROM business_pricing_rules 
    WHERE business_user_id = p_business_user_id 
    AND (offer_id IS NULL OR offer_id = p_offer_id)
    AND is_active = true
    ORDER BY priority DESC
  LOOP
    v_rule_modifier := 0;
    
    -- Participant tiers rule
    IF v_rule.rule_type = 'participant_tiers' THEN
      IF p_participant_count >= COALESCE((v_rule.conditions->>'min_participants')::integer, 0)
         AND p_participant_count <= COALESCE((v_rule.conditions->>'max_participants')::integer, 999) THEN
        v_rule_modifier := v_rule.price_modifier;
      END IF;
    END IF;
    
    -- Time slots rule
    IF v_rule.rule_type = 'time_slots' THEN
      IF p_booking_time >= COALESCE((v_rule.conditions->>'start_time')::time, '00:00:00')
         AND p_booking_time <= COALESCE((v_rule.conditions->>'end_time')::time, '23:59:59') THEN
        v_rule_modifier := v_rule.price_modifier;
      END IF;
    END IF;
    
    -- Day of week rule
    IF v_rule.rule_type = 'day_of_week' THEN
      IF EXTRACT(dow FROM p_booking_date) = ANY(
        ARRAY(SELECT jsonb_array_elements_text(v_rule.conditions->'days'))::integer[]
      ) THEN
        v_rule_modifier := v_rule.price_modifier;
      END IF;
    END IF;
    
    -- Apply modifier
    IF v_rule.is_percentage THEN
      v_final_price := v_final_price * (1 + v_rule_modifier / 100.0);
    ELSE
      v_final_price := v_final_price + v_rule_modifier;
    END IF;
  END LOOP;
  
  RETURN GREATEST(v_final_price, 0); -- Ensure price is never negative
END;
$$;

-- Create function to update booking price automatically
CREATE OR REPLACE FUNCTION public.update_booking_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate and set total_price for new bookings
  NEW.total_price := public.calculate_booking_price(
    NEW.offer_id,
    NEW.business_user_id,
    NEW.participant_count,
    NEW.booking_date,
    COALESCE(NEW.booking_time, '12:00:00')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically calculate booking price
CREATE TRIGGER calculate_booking_price_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_price();

-- Create function to update revenue stats
CREATE OR REPLACE FUNCTION public.update_revenue_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stat_date DATE := CURRENT_DATE;
BEGIN
  -- Update daily revenue stats when booking is created or updated
  INSERT INTO public.business_revenue_stats (
    business_user_id,
    stat_date,
    daily_revenue,
    booking_count,
    average_booking_value
  )
  SELECT 
    NEW.business_user_id,
    v_stat_date,
    COALESCE(SUM(total_price), 0),
    COUNT(*),
    COALESCE(AVG(total_price), 0)
  FROM bookings 
  WHERE business_user_id = NEW.business_user_id 
  AND DATE(created_at) = v_stat_date
  AND status = 'confirmed'
  ON CONFLICT (business_user_id, stat_date)
  DO UPDATE SET
    daily_revenue = EXCLUDED.daily_revenue,
    booking_count = EXCLUDED.booking_count,
    average_booking_value = EXCLUDED.average_booking_value,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Create trigger to update revenue stats
CREATE TRIGGER update_revenue_stats_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_revenue_stats();

-- Create indexes for performance
CREATE INDEX idx_business_pricing_rules_business_user ON business_pricing_rules(business_user_id);
CREATE INDEX idx_business_pricing_rules_offer ON business_pricing_rules(offer_id);
CREATE INDEX idx_business_revenue_stats_business_user ON business_revenue_stats(business_user_id);
CREATE INDEX idx_business_revenue_stats_date ON business_revenue_stats(stat_date);
CREATE INDEX idx_bookings_total_price ON bookings(total_price);

-- Add updated_at trigger for new tables
CREATE TRIGGER update_business_pricing_rules_updated_at
  BEFORE UPDATE ON public.business_pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_revenue_stats_updated_at
  BEFORE UPDATE ON public.business_revenue_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();