-- 1) Supprimer l'ancienne contrainte unique qui bloque les nouvelles réservations
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS unique_user_offer_booking_not_cancelled;

-- 2) Créer un index unique partiel: un seul booking actif (non archivé et non annulé) par user/offer
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_booking_per_user_offer
ON public.bookings (user_id, offer_id)
WHERE (is_archived = false AND status <> 'cancelled');

-- 3) Fonction: archiver automatiquement les anciennes réservations de ce user/offer avant une nouvelle insertion
CREATE OR REPLACE FUNCTION public.archive_past_bookings_for_user_offer()
RETURNS trigger AS $$
BEGIN
  -- Archive toutes les réservations passées pour ce couple user/offer encore actives
  UPDATE public.bookings
  SET is_archived = true,
      archived_at = now()
  WHERE user_id = NEW.user_id
    AND offer_id = NEW.offer_id
    AND is_archived = false
    AND booking_date < now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 4) Déclencheur: s'exécute avant chaque insertion
DROP TRIGGER IF EXISTS trg_archive_past_bookings_before_insert ON public.bookings;
CREATE TRIGGER trg_archive_past_bookings_before_insert
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.archive_past_bookings_for_user_offer();