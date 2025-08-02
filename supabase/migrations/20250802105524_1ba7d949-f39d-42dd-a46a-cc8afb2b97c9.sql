-- Add booking_date and booking_time fields to bookings table
ALTER TABLE bookings 
ADD COLUMN booking_time TIME,
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

-- Update existing bookings to set a default time
UPDATE bookings 
SET booking_time = '18:00:00' 
WHERE booking_time IS NULL;