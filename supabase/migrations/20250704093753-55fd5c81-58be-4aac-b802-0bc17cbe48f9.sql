-- Add booking status for archiving old bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add a unique constraint to prevent multiple bookings from same user for same offer
ALTER TABLE public.bookings 
ADD CONSTRAINT unique_user_offer_booking 
UNIQUE (user_id, offer_id);

-- Create a view count table for offers
CREATE TABLE IF NOT EXISTS public.offer_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for offer_views
ALTER TABLE public.offer_views ENABLE ROW LEVEL SECURITY;

-- Create policy for offer views
CREATE POLICY "Anyone can create offer views" 
ON public.offer_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view offer views" 
ON public.offer_views 
FOR SELECT 
USING (true);