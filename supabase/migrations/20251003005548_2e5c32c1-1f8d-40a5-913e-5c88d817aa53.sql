-- Supprimer le trigger dupliqué qui cause les notifications doubles
DROP TRIGGER IF EXISTS booking_notifications_trigger ON public.bookings;

-- Garder seulement trg_bookings_after_notifications qui fonctionne correctement