-- Create business_revenue_stats table required by update_revenue_stats()
CREATE TABLE IF NOT EXISTS public.business_revenue_stats (
  business_user_id uuid NOT NULL,
  stat_date date NOT NULL,
  daily_revenue numeric NOT NULL DEFAULT 0,
  booking_count integer NOT NULL DEFAULT 0,
  average_booking_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_revenue_stats_pkey PRIMARY KEY (business_user_id, stat_date)
);

-- Enable RLS
ALTER TABLE public.business_revenue_stats ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='business_revenue_stats' AND policyname='Business users can view their own revenue stats'
  ) THEN
    CREATE POLICY "Business users can view their own revenue stats"
    ON public.business_revenue_stats
    FOR SELECT
    USING (auth.uid() = business_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='business_revenue_stats' AND policyname='System can manage revenue stats'
  ) THEN
    CREATE POLICY "System can manage revenue stats"
    ON public.business_revenue_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Trigger to keep updated_at fresh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_revenue_stats_updated_at'
  ) THEN
    CREATE TRIGGER update_business_revenue_stats_updated_at
    BEFORE UPDATE ON public.business_revenue_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;