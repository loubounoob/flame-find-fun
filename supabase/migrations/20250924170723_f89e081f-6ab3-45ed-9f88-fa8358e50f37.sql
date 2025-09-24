-- Booking system fix: pricing function and triggers
-- 1) Ensure total_price column exists
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total_price numeric NOT NULL DEFAULT 0;

-- 2) Rework calculate_booking_price to use offers.pricing_options JSONB instead of non-existent base_price/offer_pricing_options
CREATE OR REPLACE FUNCTION public.calculate_booking_price(
  p_offer_id uuid,
  p_business_user_id uuid,
  p_participant_count integer,
  p_booking_date timestamp with time zone,
  p_booking_time time without time zone
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3) Keep update_booking_price aligned
CREATE OR REPLACE FUNCTION public.update_booking_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 4) Create the necessary triggers on bookings
DROP TRIGGER IF EXISTS trg_bookings_before_price ON public.bookings;
CREATE TRIGGER trg_bookings_before_price
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_booking_price();

DROP TRIGGER IF EXISTS trg_bookings_after_notifications ON public.bookings;
CREATE TRIGGER trg_bookings_after_notifications
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.create_booking_notifications();

DROP TRIGGER IF EXISTS trg_bookings_after_revenue ON public.bookings;
CREATE TRIGGER trg_bookings_after_revenue
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_revenue_stats();