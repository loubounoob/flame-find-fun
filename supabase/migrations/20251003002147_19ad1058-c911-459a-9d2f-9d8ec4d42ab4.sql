-- Update trigger to archive only when booking_date + 30 minutes has passed
-- and run a one-time data fix so users can rebook after 30 minutes.

-- 1) Replace the trigger function with the 30-minute rule
CREATE OR REPLACE FUNCTION public.archive_past_bookings_for_user_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Archive all active bookings for this user/offer if they are older than 30 minutes past the booking time
  UPDATE public.bookings
  SET is_archived = true,
      archived_at = COALESCE(archived_at, now())
  WHERE user_id = NEW.user_id
    AND offer_id = NEW.offer_id
    AND is_archived = false
    AND booking_date + INTERVAL '30 minutes' < now();

  RETURN NEW;
END;
$$;

-- 2) Ensure trigger exists (recreate to be safe)
DROP TRIGGER IF EXISTS trg_archive_past_bookings_before_insert ON public.bookings;
CREATE TRIGGER trg_archive_past_bookings_before_insert
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.archive_past_bookings_for_user_offer();

-- 3) One-time data backfill: archive past bookings older than 30 minutes
UPDATE public.bookings
SET is_archived = true,
    archived_at = COALESCE(archived_at, now())
WHERE is_archived = false
  AND booking_date + INTERVAL '30 minutes' < now();