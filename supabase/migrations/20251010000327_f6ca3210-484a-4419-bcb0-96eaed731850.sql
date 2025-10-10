-- Add search_path protection to database functions to prevent schema hijacking attacks

-- Fix is_recurring_promotion_active function
CREATE OR REPLACE FUNCTION public.is_recurring_promotion_active(p_days_of_week integer[], p_start_time time without time zone, p_end_time time without time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
AS $function$
DECLARE
  curr_day integer;
  curr_time time;
BEGIN
  -- Get current day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  curr_day := EXTRACT(dow FROM CURRENT_TIMESTAMP);
  curr_time := CURRENT_TIME;
  
  -- Check if current day is in the array and current time is within range
  RETURN (curr_day = ANY(p_days_of_week)) AND (curr_time BETWEEN p_start_time AND p_end_time);
END;
$function$;

-- Fix get_offer_rating_stats function
CREATE OR REPLACE FUNCTION public.get_offer_rating_stats(offer_id_param uuid)
 RETURNS TABLE(average_rating numeric, total_reviews integer, rating_distribution jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating), 2) as average_rating,
    COUNT(*)::integer as total_reviews,
    jsonb_object_agg(rating, count) as rating_distribution
  FROM (
    SELECT 
      rating,
      COUNT(*) as count
    FROM offer_ratings 
    WHERE offer_id = offer_id_param
    GROUP BY rating
  ) rating_counts;
END;
$function$;

-- Fix create_booking_notifications trigger function
CREATE OR REPLACE FUNCTION public.create_booking_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_discount_info text := '';
BEGIN
  -- Vérifier s'il y a une promotion active pour cette réservation
  IF NEW.notes IS NOT NULL AND NEW.notes LIKE '%promotion%' THEN
    -- Extraire le pourcentage de remise des notes si présent
    v_discount_info := regexp_replace(NEW.notes, '.*(-\d+%|Réduction : \d+%).*', '\1');
    IF v_discount_info = NEW.notes THEN
      v_discount_info := '';
    END IF;
  END IF;

  -- Notification pour l'utilisateur qui réserve avec détails de l'heure et notes
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'booking_confirmation',
    'Réservation confirmée !',
    'Votre réservation a été confirmée. ' || 
    CASE 
      WHEN v_discount_info != '' THEN 'Réduction appliquée : ' || v_discount_info || '. '
      ELSE ''
    END ||
    CASE 
      WHEN NEW.notes IS NOT NULL AND NEW.notes NOT LIKE '%promotion%' THEN 'Détails: ' || NEW.notes
      ELSE 'Vous recevrez un rappel avant l''activité.'
    END,
    jsonb_build_object(
      'booking_id', NEW.id, 
      'offer_id', NEW.offer_id,
      'booking_date', NEW.booking_date,
      'participant_count', NEW.participant_count,
      'notes', NEW.notes,
      'discount_info', v_discount_info
    )
  );

  -- Notification pour l'entreprise avec détails complets
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.business_user_id,
    'new_booking',
    'Nouvelle réservation !',
    'Vous avez reçu une nouvelle réservation pour ' || NEW.participant_count || ' personne(s). ' ||
    CASE 
      WHEN v_discount_info != '' THEN 'Promotion utilisée : ' || v_discount_info || '. '
      ELSE ''
    END ||
    CASE 
      WHEN NEW.notes IS NOT NULL AND NEW.notes NOT LIKE '%promotion%' THEN 'Détails: ' || NEW.notes
      ELSE ''
    END,
    jsonb_build_object(
      'booking_id', NEW.id, 
      'offer_id', NEW.offer_id, 
      'customer_id', NEW.user_id,
      'booking_date', NEW.booking_date,
      'participant_count', NEW.participant_count,
      'notes', NEW.notes,
      'discount_info', v_discount_info
    )
  );

  RETURN NEW;
END;
$function$;

-- Fix update_business_rating trigger function
CREATE OR REPLACE FUNCTION public.update_business_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  business_user_id_val uuid;
BEGIN
  -- Get the business_user_id from the offer
  SELECT business_user_id INTO business_user_id_val
  FROM offers 
  WHERE id = NEW.offer_id;
  
  -- Update or insert business rating summary
  INSERT INTO business_ratings (business_user_id, total_rating, total_reviews, average_rating)
  VALUES (
    business_user_id_val,
    NEW.rating,
    1,
    NEW.rating
  )
  ON CONFLICT (business_user_id)
  DO UPDATE SET
    total_rating = business_ratings.total_rating + NEW.rating,
    total_reviews = business_ratings.total_reviews + 1,
    average_rating = (business_ratings.total_rating + NEW.rating) / (business_ratings.total_reviews + 1),
    updated_at = now();
    
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- Fix audit_financial_transaction trigger function
CREATE OR REPLACE FUNCTION public.audit_financial_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Log all financial transactions for audit
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    NEW.business_user_id,
    'financial_audit',
    'Financial Transaction',
    'Transaction of ' || NEW.amount || '€ - ' || NEW.transaction_type,
    jsonb_build_object(
      'transaction_id', NEW.id,
      'amount', NEW.amount,
      'type', NEW.transaction_type,
      'timestamp', NEW.created_at
    )
  );
  
  RETURN NEW;
END;
$function$;