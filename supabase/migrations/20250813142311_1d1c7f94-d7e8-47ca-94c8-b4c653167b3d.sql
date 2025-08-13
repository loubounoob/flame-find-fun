-- Correction de la dernière fonction manquante
CREATE OR REPLACE FUNCTION public.archive_old_bookings()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE bookings 
  SET is_archived = true
  WHERE booking_date IS NOT NULL 
    AND booking_time IS NOT NULL
    AND (booking_date + booking_time::time + INTERVAL '3 hours') < NOW()
    AND is_archived = false;
END;
$$;