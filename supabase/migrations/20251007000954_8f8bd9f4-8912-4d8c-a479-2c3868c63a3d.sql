-- Create offer_schedules table
CREATE TABLE public.offer_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
  business_user_id UUID NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business users can manage their own schedules"
ON public.offer_schedules
FOR ALL
TO authenticated
USING (auth.uid() = business_user_id)
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Anyone can view active schedules"
ON public.offer_schedules
FOR SELECT
TO authenticated
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_offer_schedules_updated_at
BEFORE UPDATE ON public.offer_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();