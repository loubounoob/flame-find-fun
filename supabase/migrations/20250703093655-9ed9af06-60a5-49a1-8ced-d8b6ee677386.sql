-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT,
  location TEXT NOT NULL,
  max_participants INTEGER,
  image_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flames table (likes)
CREATE TABLE public.flames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);

-- Enable Row Level Security
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flames ENABLE ROW LEVEL SECURITY;

-- Create policies for offers
CREATE POLICY "Anyone can view offers" 
ON public.offers 
FOR SELECT 
USING (true);

CREATE POLICY "Business users can create their own offers" 
ON public.offers 
FOR INSERT 
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own offers" 
ON public.offers 
FOR UPDATE 
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can delete their own offers" 
ON public.offers 
FOR DELETE 
USING (auth.uid() = business_user_id);

-- Create policies for flames
CREATE POLICY "Users can view all flames" 
ON public.flames 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own flames" 
ON public.flames 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flames" 
ON public.flames 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();