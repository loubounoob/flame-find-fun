-- Fix security vulnerability in offer_ratings table
-- Remove the overly permissive public read policy

DROP POLICY IF EXISTS "Users can view offer ratings" ON public.offer_ratings;

-- Create more restrictive policies
-- 1. Users can view their own ratings
CREATE POLICY "Users can view their own ratings" 
ON public.offer_ratings 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Business owners can view ratings for their offers
CREATE POLICY "Business owners can view ratings for their offers" 
ON public.offer_ratings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.offers 
    WHERE offers.id = offer_ratings.offer_id 
    AND offers.business_user_id = auth.uid()
  )
);

-- 3. Create a view for public rating display (without user IDs)
CREATE OR REPLACE VIEW public.offer_ratings_public AS
SELECT 
  id,
  offer_id,
  rating,
  comment,
  created_at,
  updated_at
FROM public.offer_ratings;

-- Grant select on the public view
GRANT SELECT ON public.offer_ratings_public TO anon, authenticated;

-- Enable RLS on the view (it inherits security from the base table)
ALTER VIEW public.offer_ratings_public SET (security_barrier = true);