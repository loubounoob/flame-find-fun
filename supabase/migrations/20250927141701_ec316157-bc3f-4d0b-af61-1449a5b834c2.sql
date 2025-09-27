-- Update notification function to include booking time and notes details
CREATE OR REPLACE FUNCTION public.create_booking_notifications()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Notification pour l'utilisateur qui réserve avec détails de l'heure et notes
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'booking_confirmation',
    'Réservation confirmée !',
    'Votre réservation a été confirmée. ' || 
    CASE 
      WHEN NEW.notes IS NOT NULL THEN 'Détails: ' || NEW.notes
      ELSE 'Vous recevrez un rappel avant l''activité.'
    END,
    jsonb_build_object(
      'booking_id', NEW.id, 
      'offer_id', NEW.offer_id,
      'booking_date', NEW.booking_date,
      'participant_count', NEW.participant_count,
      'notes', NEW.notes
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
      WHEN NEW.notes IS NOT NULL THEN 'Détails: ' || NEW.notes
      ELSE ''
    END,
    jsonb_build_object(
      'booking_id', NEW.id, 
      'offer_id', NEW.offer_id, 
      'customer_id', NEW.user_id,
      'booking_date', NEW.booking_date,
      'participant_count', NEW.participant_count,
      'notes', NEW.notes
    )
  );

  RETURN NEW;
END;
$function$;