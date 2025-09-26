-- Create recurring_promotions table for automatic time-based promotions
CREATE TABLE public.recurring_promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  days_of_week integer[] NOT NULL, -- Array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
  start_time time NOT NULL,
  end_time time NOT NULL,
  discount_percentage numeric NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recurring_promotions_valid_times CHECK (start_time < end_time)
);

-- Enable RLS
ALTER TABLE public.recurring_promotions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business users can manage their own recurring promotions"
ON public.recurring_promotions
FOR ALL
USING (auth.uid() = business_user_id)
WITH CHECK (auth.uid() = business_user_id);

-- Anyone can view active recurring promotions (needed for automatic flash offers)
CREATE POLICY "Anyone can view active recurring promotions"
ON public.recurring_promotions
FOR SELECT
USING (is_active = true);

-- Add updated_at trigger
CREATE TRIGGER update_recurring_promotions_updated_at
BEFORE UPDATE ON public.recurring_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if a recurring promotion is currently active
CREATE OR REPLACE FUNCTION public.is_recurring_promotion_active(
  p_days_of_week integer[],
  p_start_time time,
  p_end_time time
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  curr_day integer;
  curr_time time;
BEGIN
  -- Get current day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  curr_day := EXTRACT(dow FROM CURRENT_TIMESTAMP);
  curr_time := CURRENT_TIME;
  
  -- Check if current day is in the array and current time is within range
  RETURN (curr_day = ANY(p_days_of_week)) AND (curr_time BETWEEN p_start_time AND p_end_time);
END;
$$;