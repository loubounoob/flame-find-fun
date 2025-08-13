-- Créer une table pour les médias des profils business
CREATE TABLE public.business_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_media ENABLE ROW LEVEL SECURITY;

-- Policies pour business_media
CREATE POLICY "Business users can view their own media"
ON public.business_media
FOR SELECT
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can create their own media"
ON public.business_media
FOR INSERT
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own media"
ON public.business_media
FOR UPDATE
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can delete their own media"
ON public.business_media
FOR DELETE
USING (auth.uid() = business_user_id);

-- Créer une table pour les tarifs et formules des entreprises
CREATE TABLE public.business_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT,
  price_type TEXT NOT NULL CHECK (price_type IN ('per_hour', 'per_game', 'per_person', 'fixed', 'per_day', 'custom')),
  price_amount DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER, -- pour les tarifs à l'heure
  max_participants INTEGER,
  min_participants INTEGER DEFAULT 1,
  special_conditions TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_pricing ENABLE ROW LEVEL SECURITY;

-- Policies pour business_pricing
CREATE POLICY "Business users can view their own pricing"
ON public.business_pricing
FOR SELECT
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can create their own pricing"
ON public.business_pricing
FOR INSERT
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own pricing"
ON public.business_pricing
FOR UPDATE
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can delete their own pricing"
ON public.business_pricing
FOR DELETE
USING (auth.uid() = business_user_id);

-- Permettre aux utilisateurs de voir les tarifs publics
CREATE POLICY "Anyone can view active pricing"
ON public.business_pricing
FOR SELECT
USING (is_active = true);

-- Trigger pour updated_at
CREATE TRIGGER update_business_media_updated_at
BEFORE UPDATE ON public.business_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_pricing_updated_at
BEFORE UPDATE ON public.business_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();