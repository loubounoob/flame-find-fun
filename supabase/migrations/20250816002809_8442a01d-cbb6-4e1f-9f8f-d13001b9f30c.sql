-- Drop existing constraint first
ALTER TABLE business_finances 
DROP CONSTRAINT IF EXISTS check_non_negative_balance;

-- Add constraint to prevent negative balances
ALTER TABLE business_finances 
ADD CONSTRAINT check_non_negative_balance 
CHECK (available_balance >= 0);

-- Add rate limiting table for financial operations
CREATE TABLE IF NOT EXISTS public.financial_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  operation_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE public.financial_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policy for rate limits
CREATE POLICY "rate_limits_own_data" ON public.financial_rate_limits
  FOR ALL USING (business_user_id = auth.uid());

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_business_user_id UUID,
  p_operation_type TEXT,
  p_max_operations INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_operation_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Get current window operations
  SELECT 
    COALESCE(SUM(operation_count), 0),
    MIN(window_start)
  INTO v_operation_count, v_window_start
  FROM financial_rate_limits
  WHERE business_user_id = p_business_user_id
    AND operation_type = p_operation_type
    AND window_start > now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Clean old rate limit records
  DELETE FROM financial_rate_limits
  WHERE business_user_id = p_business_user_id
    AND operation_type = p_operation_type
    AND window_start <= now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Check if limit exceeded
  IF v_operation_count >= p_max_operations THEN
    RAISE EXCEPTION 'Rate limit exceeded for operation: %. Try again later.', p_operation_type;
  END IF;

  -- Record this operation
  INSERT INTO financial_rate_limits (
    business_user_id,
    operation_type,
    operation_count,
    window_start
  ) VALUES (
    p_business_user_id,
    p_operation_type,
    1,
    now()
  );

  RETURN TRUE;
END;
$$;