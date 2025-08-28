-- Create business_earnings table to track all business earnings
CREATE TABLE IF NOT EXISTS public.business_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_user_id UUID NOT NULL,
  booking_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business users can view their own earnings" 
ON public.business_earnings 
FOR SELECT 
USING (auth.uid() = business_user_id);

CREATE POLICY "System can manage earnings" 
ON public.business_earnings 
FOR ALL 
USING (true);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business users can view their own withdrawal requests" 
ON public.withdrawal_requests 
FOR SELECT 
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can create withdrawal requests" 
ON public.withdrawal_requests 
FOR INSERT 
WITH CHECK (auth.uid() = business_user_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_earnings_updated_at BEFORE UPDATE ON public.business_earnings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();