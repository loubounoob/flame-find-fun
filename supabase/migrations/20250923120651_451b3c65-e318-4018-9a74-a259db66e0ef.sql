-- Fix bookings insert errors by aligning triggers and columns
-- 1) Ensure total_price column exists
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total_price numeric NOT NULL DEFAULT 0;

-- 2) Make update_booking_price function compatible without booking_time column
CREATE OR REPLACE FUNCTION public.update_booking_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate and set total_price for new or updated bookings
  NEW.total_price := public.calculate_booking_price(
    NEW.offer_id,
    NEW.business_user_id,
    NEW.participant_count,
    NEW.booking_date,
    COALESCE(NEW.booking_date::time, '12:00:00'::time)
  );
  RETURN NEW;
END;
$$;