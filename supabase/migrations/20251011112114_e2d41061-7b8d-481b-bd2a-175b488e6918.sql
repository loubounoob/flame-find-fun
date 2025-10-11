-- Add search_path protection to remaining database functions

-- Fix calculate_booking_price function
CREATE OR REPLACE FUNCTION public.calculate_booking_price(p_offer_id uuid, p_business_user_id uuid, p_participant_count integer, p_booking_date timestamp with time zone, p_booking_time time without time zone)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_base_price NUMERIC := 0;
  v_final_price NUMERIC := 0;
  v_rule_modifier NUMERIC := 0;
  v_rule RECORD;
  v_time time without time zone := COALESCE(p_booking_time, '12:00:00'::time);
BEGIN
  -- Get base price from offers.pricing_options JSONB (default item or first item)
  SELECT COALESCE(
    (
      SELECT (po->>'price')::numeric
      FROM jsonb_array_elements(o.pricing_options) po
      WHERE COALESCE((po->>'is_default')::boolean, false) = true
      LIMIT 1
    ),
    (
      SELECT (po->>'price')::numeric
      FROM jsonb_array_elements(o.pricing_options) po
      WHERE (po ? 'price')
      ORDER BY (po->>'price')::numeric NULLS LAST
      LIMIT 1
    ),
    0
  )
  INTO v_base_price
  FROM offers o
  WHERE o.id = p_offer_id;

  v_final_price := COALESCE(v_base_price, 0) * GREATEST(p_participant_count, 1);

  -- Apply optional pricing rules if the table exists
  IF to_regclass('public.business_pricing_rules') IS NOT NULL THEN
    FOR v_rule IN
      EXECUTE
        'SELECT rule_type, conditions, price_modifier, is_percentage
         FROM public.business_pricing_rules
         WHERE business_user_id = $1
           AND (offer_id IS NULL OR offer_id = $2)
           AND is_active = true
         ORDER BY priority DESC'
      USING p_business_user_id, p_offer_id
    LOOP
      v_rule_modifier := 0;
      
      IF v_rule.rule_type = 'participant_tiers' THEN
        IF p_participant_count >= COALESCE((v_rule.conditions->>'min_participants')::integer, 0)
           AND p_participant_count <= COALESCE((v_rule.conditions->>'max_participants')::integer, 999) THEN
          v_rule_modifier := v_rule.price_modifier;
        END IF;
      END IF;

      IF v_rule.rule_type = 'time_slots' THEN
        IF v_time >= COALESCE((v_rule.conditions->>'start_time')::time, '00:00:00')
           AND v_time <= COALESCE((v_rule.conditions->>'end_time')::time, '23:59:59') THEN
          v_rule_modifier := v_rule.price_modifier;
        END IF;
      END IF;

      IF v_rule.rule_type = 'day_of_week' THEN
        IF EXTRACT(dow FROM p_booking_date) = ANY(
          ARRAY(SELECT jsonb_array_elements_text(v_rule.conditions->'days'))::integer[]
        ) THEN
          v_rule_modifier := v_rule.price_modifier;
        END IF;
      END IF;

      IF v_rule.is_percentage THEN
        v_final_price := v_final_price * (1 + v_rule_modifier / 100.0);
      ELSE
        v_final_price := v_final_price + v_rule_modifier;
      END IF;
    END LOOP;
  END IF;

  RETURN GREATEST(v_final_price, 0);
END;
$function$;

-- Fix update_booking_price trigger function
CREATE OR REPLACE FUNCTION public.update_booking_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.total_price := public.calculate_booking_price(
    NEW.offer_id,
    NEW.business_user_id,
    NEW.participant_count,
    NEW.booking_date,
    COALESCE(NEW.booking_date::time, '12:00:00'::time)
  );
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix auto_mark_old_notifications_read function
CREATE OR REPLACE FUNCTION public.auto_mark_old_notifications_read()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE notifications 
  SET read = true
  WHERE created_at < NOW() - INTERVAL '30 days' 
    AND read = false;
END;
$function$;

-- Fix update_revenue_stats trigger function
CREATE OR REPLACE FUNCTION public.update_revenue_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_stat_date DATE := CURRENT_DATE;
BEGIN
  -- Update daily revenue stats, excluding archived bookings
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
  AND is_archived = false
  ON CONFLICT (business_user_id, stat_date)
  DO UPDATE SET
    daily_revenue = EXCLUDED.daily_revenue,
    booking_count = EXCLUDED.booking_count,
    average_booking_value = EXCLUDED.average_booking_value,
    updated_at = now();
    
  RETURN NEW;
END;
$function$;

-- Fix archive_past_bookings_for_user_offer trigger function
CREATE OR REPLACE FUNCTION public.archive_past_bookings_for_user_offer()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Archive all active bookings for this user/offer if they are older than 30 minutes past the booking time
  UPDATE public.bookings
  SET is_archived = true,
      archived_at = COALESCE(archived_at, now())
  WHERE user_id = NEW.user_id
    AND offer_id = NEW.offer_id
    AND is_archived = false
    AND booking_date + INTERVAL '30 minutes' < now();

  RETURN NEW;
END;
$function$;