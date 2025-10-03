-- Modifier les fonctions de revenus pour exclure les réservations archivées
-- Les réservations confirmées mais archivées ne doivent pas générer de revenus

-- 1) Mettre à jour secure_add_earning pour vérifier is_archived = false
CREATE OR REPLACE FUNCTION public.secure_add_earning(p_business_user_id uuid, p_amount numeric, p_booking_id uuid, p_description text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance NUMERIC;
  v_current_earnings NUMERIC;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount: must be positive';
  END IF;
  
  IF p_business_user_id IS NULL OR p_booking_id IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;

  -- Check if booking exists, belongs to business, is confirmed AND NOT archived
  IF NOT EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = p_booking_id 
    AND business_user_id = p_business_user_id
    AND status = 'confirmed'
    AND is_archived = false
  ) THEN
    RAISE EXCEPTION 'Invalid booking, not confirmed, or already archived';
  END IF;

  -- Check if earning already exists for this booking
  IF EXISTS (
    SELECT 1 FROM financial_transactions 
    WHERE booking_id = p_booking_id 
    AND transaction_type = 'earning'
  ) THEN
    RAISE EXCEPTION 'Earning already recorded for this booking';
  END IF;

  -- Get current finances
  SELECT available_balance, total_earnings 
  INTO v_current_balance, v_current_earnings
  FROM business_finances 
  WHERE business_user_id = p_business_user_id;

  -- Create transaction record
  INSERT INTO financial_transactions (
    business_user_id,
    transaction_type,
    amount,
    description,
    booking_id
  ) VALUES (
    p_business_user_id,
    'earning',
    p_amount,
    p_description,
    p_booking_id
  );

  -- Update finances atomically
  INSERT INTO business_finances (
    business_user_id,
    available_balance,
    total_earnings,
    total_withdrawn,
    total_boost_spent
  ) VALUES (
    p_business_user_id,
    p_amount,
    p_amount,
    0,
    0
  )
  ON CONFLICT (business_user_id)
  DO UPDATE SET
    available_balance = business_finances.available_balance + p_amount,
    total_earnings = business_finances.total_earnings + p_amount,
    updated_at = now();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to add earning: %', SQLERRM;
END;
$function$;

-- 2) Mettre à jour update_revenue_stats pour exclure les archivées
CREATE OR REPLACE FUNCTION public.update_revenue_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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