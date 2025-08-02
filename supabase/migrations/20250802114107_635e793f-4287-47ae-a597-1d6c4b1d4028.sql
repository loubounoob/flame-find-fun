-- Create function to archive old bookings
CREATE OR REPLACE FUNCTION archive_old_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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