-- Add Stripe Connect account management for businesses
ALTER TABLE public.profiles 
ADD COLUMN stripe_connect_account_id TEXT,
ADD COLUMN stripe_connect_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN stripe_connect_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN stripe_connect_payouts_enabled BOOLEAN DEFAULT false;

-- Create a table to track Stripe payment intents and transfers
CREATE TABLE public.stripe_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  business_user_id UUID NOT NULL,
  customer_user_id UUID NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_transfer_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  business_amount INTEGER NOT NULL, -- Amount after fees, in cents
  stripe_fee INTEGER NOT NULL DEFAULT 0, -- Stripe fee in cents
  platform_fee INTEGER NOT NULL DEFAULT 0, -- Our platform fee in cents
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on stripe_transactions
ALTER TABLE public.stripe_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for stripe_transactions
CREATE POLICY "Business users can view their own transactions" 
ON public.stripe_transactions 
FOR SELECT 
USING (auth.uid() = business_user_id);

CREATE POLICY "Users can view their own transactions" 
ON public.stripe_transactions 
FOR SELECT 
USING (auth.uid() = customer_user_id);

CREATE POLICY "System can manage stripe transactions" 
ON public.stripe_transactions 
FOR ALL 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_stripe_transactions_updated_at
BEFORE UPDATE ON public.stripe_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();