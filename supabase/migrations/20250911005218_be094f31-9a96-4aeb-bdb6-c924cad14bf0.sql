-- Add payment-related columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session_id ON bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(status) WHERE status IN ('pending_payment', 'confirmed');

-- Update existing bookings to have payment_confirmed = true for confirmed bookings
UPDATE bookings 
SET payment_confirmed = true 
WHERE status = 'confirmed' AND payment_confirmed IS NULL;