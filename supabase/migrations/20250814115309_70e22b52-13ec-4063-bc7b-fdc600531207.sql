-- Create function to automatically link ratings to business instead of just offer
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER AS $$
DECLARE
  business_user_id_val uuid;
BEGIN
  -- Get the business_user_id from the offer
  SELECT business_user_id INTO business_user_id_val
  FROM offers 
  WHERE id = NEW.offer_id;
  
  -- Update or insert business rating summary
  INSERT INTO business_ratings (business_user_id, total_rating, total_reviews, average_rating)
  VALUES (
    business_user_id_val,
    NEW.rating,
    1,
    NEW.rating
  )
  ON CONFLICT (business_user_id)
  DO UPDATE SET
    total_rating = business_ratings.total_rating + NEW.rating,
    total_reviews = business_ratings.total_reviews + 1,
    average_rating = (business_ratings.total_rating + NEW.rating) / (business_ratings.total_reviews + 1),
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create business_ratings table to store aggregated ratings
CREATE TABLE IF NOT EXISTS public.business_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_user_id UUID NOT NULL UNIQUE,
  total_rating INTEGER NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view business ratings" 
ON public.business_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage business ratings" 
ON public.business_ratings 
FOR ALL
USING (true);

-- Create trigger for when ratings are added
CREATE TRIGGER trigger_update_business_rating
  AFTER INSERT ON public.offer_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_rating();

-- Create trigger for automatic timestamps
CREATE TRIGGER update_business_ratings_updated_at
  BEFORE UPDATE ON public.business_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();