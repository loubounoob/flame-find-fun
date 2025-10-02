-- Modifier la fonction pour archiver les réservations 30 minutes après l'heure de réservation
CREATE OR REPLACE FUNCTION public.archive_old_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE bookings 
  SET is_archived = true
  WHERE booking_date IS NOT NULL 
    AND booking_date + INTERVAL '30 minutes' < NOW()
    AND is_archived = false;
END;
$function$;