-- Create business finances table for earnings, withdrawals and boosts
CREATE TABLE public.business_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_user_id UUID NOT NULL,
  available_balance DECIMAL(10,2) DEFAULT 0.00,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
  total_boost_spent DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create financial transactions table for tracking all money movements
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earning', 'withdrawal', 'boost_payment'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  booking_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create offer boosts table for tracking paid boosts
CREATE TABLE public.offer_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL,
  business_user_id UUID NOT NULL,
  boost_type TEXT NOT NULL, -- 'priority', 'featured', 'homepage_pin'
  boost_score DECIMAL(5,2) DEFAULT 0.00,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pricing options table for custom offer pricing
CREATE TABLE public.offer_pricing_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL,
  option_name TEXT NOT NULL, -- 'Par heure', 'Par partie', 'Forfait 2h', etc.
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_pricing_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_finances
CREATE POLICY "Business users can view their own finances"
ON public.business_finances FOR SELECT
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own finances"
ON public.business_finances FOR UPDATE
USING (auth.uid() = business_user_id);

CREATE POLICY "System can manage finances"
ON public.business_finances FOR ALL
USING (true);

-- RLS Policies for financial_transactions
CREATE POLICY "Business users can view their own transactions"
ON public.financial_transactions FOR SELECT
USING (auth.uid() = business_user_id);

CREATE POLICY "System can insert transactions"
ON public.financial_transactions FOR INSERT
WITH CHECK (true);

-- RLS Policies for offer_boosts
CREATE POLICY "Business users can view their own boosts"
ON public.offer_boosts FOR SELECT
USING (auth.uid() = business_user_id);

CREATE POLICY "Business users can create their own boosts"
ON public.offer_boosts FOR INSERT
WITH CHECK (auth.uid() = business_user_id);

CREATE POLICY "Business users can update their own boosts"
ON public.offer_boosts FOR UPDATE
USING (auth.uid() = business_user_id);

CREATE POLICY "Anyone can view active boosts for scoring"
ON public.offer_boosts FOR SELECT
USING (is_active = true AND now() BETWEEN start_date AND end_date);

-- RLS Policies for offer_pricing_options
CREATE POLICY "Anyone can view pricing options"
ON public.offer_pricing_options FOR SELECT
USING (true);

CREATE POLICY "Business users can manage pricing for their offers"
ON public.offer_pricing_options FOR ALL
USING (EXISTS (
  SELECT 1 FROM offers 
  WHERE offers.id = offer_pricing_options.offer_id 
  AND offers.business_user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_business_finances_updated_at
  BEFORE UPDATE ON public.business_finances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.offer_pricing_options
ADD CONSTRAINT fk_offer_pricing_options_offer
FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE;

ALTER TABLE public.offer_boosts
ADD CONSTRAINT fk_offer_boosts_offer
FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE;

-- Update offers table to require images
ALTER TABLE public.offers
ADD COLUMN requires_images BOOLEAN DEFAULT true;