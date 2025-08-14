-- Create promotions table for flash offers
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id UUID NOT NULL,
  offer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_item', 'buy_x_get_y')),
  discount_value NUMERIC NOT NULL,
  discount_text TEXT NOT NULL, -- "1h gratuite", "-30%", etc.
  original_price NUMERIC NOT NULL,
  promotional_price NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on promotions table
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Create policies for promotions
CREATE POLICY "Anyone can view active promotions" 
ON public.promotions 
FOR SELECT 
USING (is_active = true AND NOW() >= start_date AND NOW() <= end_date);

CREATE POLICY "Business users can view their own promotions" 
ON public.promotions 
FOR SELECT 
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can create their own promotions" 
ON public.promotions 
FOR INSERT 
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own promotions" 
ON public.promotions 
FOR UPDATE 
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can delete their own promotions" 
ON public.promotions 
FOR DELETE 
USING (auth.uid() = business_user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add pricing options to offers table
ALTER TABLE public.offers ADD COLUMN pricing_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.offers ADD COLUMN base_price NUMERIC;
ALTER TABLE public.offers ADD COLUMN has_promotion BOOLEAN DEFAULT false;