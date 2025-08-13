-- Créer la table pour les évaluations d'offres
CREATE TABLE public.offer_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);

-- Créer la table pour les notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.offer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour offer_ratings
CREATE POLICY "Users can view offer ratings" 
ON public.offer_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own ratings" 
ON public.offer_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.offer_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Politiques RLS pour notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fonction pour créer des notifications automatiques
CREATE OR REPLACE FUNCTION public.create_booking_notifications()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger pour les notifications de réservation
CREATE TRIGGER booking_notifications_trigger
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_notifications();

-- Fonction pour programmer les notifications d'évaluation (sera appelée par un edge function)
CREATE OR REPLACE FUNCTION public.schedule_rating_notification(
  booking_id uuid,
  user_id uuid,
  offer_id uuid
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;