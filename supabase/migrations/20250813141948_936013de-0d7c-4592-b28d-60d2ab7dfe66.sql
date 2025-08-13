-- Correction des problèmes de sécurité des fonctions
CREATE OR REPLACE FUNCTION public.create_booking_notifications()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Notification pour l'utilisateur qui réserve
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'booking_confirmation',
    'Réservation confirmée !',
    'Votre réservation a été confirmée. Vous recevrez un rappel avant l''activité.',
    jsonb_build_object('booking_id', NEW.id, 'offer_id', NEW.offer_id)
  );

  -- Notification pour l'entreprise
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.business_user_id,
    'new_booking',
    'Nouvelle réservation !',
    'Vous avez reçu une nouvelle réservation.',
    jsonb_build_object('booking_id', NEW.id, 'offer_id', NEW.offer_id, 'customer_id', NEW.user_id)
  );

  RETURN NEW;
END;
$$;

-- Correction de la fonction de notification d'évaluation
CREATE OR REPLACE FUNCTION public.schedule_rating_notification(
  booking_id uuid,
  user_id uuid,
  offer_id uuid
)
RETURNS void 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    user_id,
    'rating_request',
    'Comment s''est passée votre activité ?',
    'Donnez votre avis sur cette activité pour aider les autres utilisateurs !',
    jsonb_build_object('booking_id', booking_id, 'offer_id', offer_id, 'requires_rating', true)
  );
END;
$$;