-- Fix the security definer view issue
-- Drop the problematic view and create a proper solution

DROP VIEW IF EXISTS public.offer_ratings_public;

-- Instead, we'll update components to use the restricted table directly
-- and create a function for public rating aggregates only

-- Create a secure function to get rating statistics for offers
CREATE OR REPLACE FUNCTION public.get_offer_rating_stats(offer_id_param uuid)
RETURNS TABLE (
  average_rating numeric,
  total_reviews integer,
  rating_distribution jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating), 2) as average_rating,
    COUNT(*)::integer as total_reviews,
    jsonb_object_agg(rating, count) as rating_distribution
  FROM (
    SELECT 
      rating,
      COUNT(*) as count
    FROM offer_ratings 
    WHERE offer_id = offer_id_param
    GROUP BY rating
  ) rating_counts;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_offer_rating_stats(uuid) TO anon, authenticated;