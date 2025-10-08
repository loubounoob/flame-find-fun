-- Ajouter support pour plusieurs images dans les offres
ALTER TABLE offers ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb;

-- Migrer les images existantes vers le nouveau format
UPDATE offers 
SET image_urls = jsonb_build_array(image_url::text)
WHERE image_url IS NOT NULL AND image_url != '';

-- Modifier la fonction de notification pour inclure les informations de promotion
CREATE OR REPLACE FUNCTION public.create_booking_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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