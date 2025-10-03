-- Fix duplicate constraint so archived bookings don't block new ones
-- 1) Replace partial unique index to also exclude archived bookings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'unique_user_offer_booking_not_cancelled'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.unique_user_offer_booking_not_cancelled';
  END IF;
END $$;

-- Recreate the unique index excluding cancelled AND archived bookings
CREATE UNIQUE INDEX unique_user_offer_booking_not_cancelled
ON public.bookings (user_id, offer_id)
WHERE (status <> 'cancelled' AND COALESCE(is_archived, false) = false);

-- 2) Backfill: archive past confirmed bookings older than 30 minutes
UPDATE public.bookings
SET is_archived = true,
    archived_at = COALESCE(archived_at, now())
WHERE status = 'confirmed'
  AND COALESCE(is_archived, false) = false
  AND booking_date <= (now() - interval '30 minutes');