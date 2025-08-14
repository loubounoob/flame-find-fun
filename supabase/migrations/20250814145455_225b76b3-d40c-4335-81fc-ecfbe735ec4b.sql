-- Fix function search path issues for all functions
-- Update existing functions to have proper search path

-- Fix the update_business_rating function
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix other functions with search path issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$function$;