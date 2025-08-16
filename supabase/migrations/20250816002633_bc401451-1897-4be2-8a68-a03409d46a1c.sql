-- Create secure database functions for financial operations

-- Function to securely add earnings from bookings
CREATE OR REPLACE FUNCTION public.secure_add_earning(
  p_business_user_id UUID,
  p_amount NUMERIC,
  p_booking_id UUID,
  p_description TEXT
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_current_earnings NUMERIC;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount: must be positive';
  END IF;
  
  IF p_business_user_id IS NULL OR p_booking_id IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;

  -- Check if booking exists and belongs to the business
  IF NOT EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = p_booking_id 
    AND business_user_id = p_business_user_id
    AND status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'Invalid booking or booking not confirmed';
  END IF;

  -- Check if earning already exists for this booking
  IF EXISTS (
    SELECT 1 FROM financial_transactions 
    WHERE booking_id = p_booking_id 
    AND transaction_type = 'earning'
  ) THEN
    RAISE EXCEPTION 'Earning already recorded for this booking';
  END IF;

  -- Get current finances
  SELECT available_balance, total_earnings 
  INTO v_current_balance, v_current_earnings
  FROM business_finances 
  WHERE business_user_id = p_business_user_id;

  -- Create transaction record
  INSERT INTO financial_transactions (
    business_user_id,
    transaction_type,
    amount,
    description,
    booking_id
  ) VALUES (
    p_business_user_id,
    'earning',
    p_amount,
    p_description,
    p_booking_id
  );

  -- Update finances atomically
  INSERT INTO business_finances (
    business_user_id,
    available_balance,
    total_earnings,
    total_withdrawn,
    total_boost_spent
  ) VALUES (
    p_business_user_id,
    p_amount,
    p_amount,
    0,
    0
  )
  ON CONFLICT (business_user_id)
  DO UPDATE SET
    available_balance = business_finances.available_balance + p_amount,
    total_earnings = business_finances.total_earnings + p_amount,
    updated_at = now();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to add earning: %', SQLERRM;
END;
$$;

-- Function to securely process withdrawals
CREATE OR REPLACE FUNCTION public.secure_request_withdrawal(
  p_business_user_id UUID,
  p_amount NUMERIC
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance NUMERIC;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid withdrawal amount: must be positive';
  END IF;
  
  IF p_business_user_id IS NULL THEN
    RAISE EXCEPTION 'Business user ID required';
  END IF;

  -- Get current balance with row lock to prevent race conditions
  SELECT available_balance 
  INTO v_current_balance
  FROM business_finances 
  WHERE business_user_id = p_business_user_id
  FOR UPDATE;

  -- Check if sufficient balance
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;

  -- Create withdrawal transaction
  INSERT INTO financial_transactions (
    business_user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    p_business_user_id,
    'withdrawal',
    -p_amount,
    'Withdrawal request of ' || p_amount || '€'
  );

  -- Update finances
  UPDATE business_finances 
  SET 
    available_balance = available_balance - p_amount,
    total_withdrawn = total_withdrawn + p_amount,
    updated_at = now()
  WHERE business_user_id = p_business_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process withdrawal: %', SQLERRM;
END;
$$;

-- Function to securely process boost payments
CREATE OR REPLACE FUNCTION public.secure_pay_for_boost(
  p_business_user_id UUID,
  p_offer_id UUID,
  p_boost_type TEXT,
  p_amount NUMERIC,
  p_duration INTEGER
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_boost_score NUMERIC;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 OR p_duration <= 0 THEN
    RAISE EXCEPTION 'Invalid amount or duration';
  END IF;
  
  IF p_business_user_id IS NULL OR p_offer_id IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;

  -- Verify offer belongs to business
  IF NOT EXISTS (
    SELECT 1 FROM offers 
    WHERE id = p_offer_id 
    AND business_user_id = p_business_user_id
  ) THEN
    RAISE EXCEPTION 'Offer not found or unauthorized';
  END IF;

  -- Calculate boost score
  v_boost_score := p_amount / 10.0; -- 1€ = 0.1 boost score
  v_end_date := now() + (p_duration || ' days')::INTERVAL;

  -- Get current balance with lock
  SELECT available_balance 
  INTO v_current_balance
  FROM business_finances 
  WHERE business_user_id = p_business_user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance for boost payment';
  END IF;

  -- Create boost record
  INSERT INTO offer_boosts (
    offer_id,
    business_user_id,
    boost_type,
    boost_score,
    end_date,
    amount_paid
  ) VALUES (
    p_offer_id,
    p_business_user_id,
    p_boost_type,
    v_boost_score,
    v_end_date,
    p_amount
  );

  -- Create transaction record
  INSERT INTO financial_transactions (
    business_user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    p_business_user_id,
    'boost_payment',
    -p_amount,
    'Boost ' || p_boost_type || ' - ' || p_duration || ' days'
  );

  -- Update finances
  UPDATE business_finances 
  SET 
    available_balance = available_balance - p_amount,
    total_boost_spent = total_boost_spent + p_amount,
    updated_at = now()
  WHERE business_user_id = p_business_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process boost payment: %', SQLERRM;
END;
$$;

-- Create audit trigger for financial transactions
CREATE OR REPLACE FUNCTION public.audit_financial_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all financial transactions for audit
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    NEW.business_user_id,
    'financial_audit',
    'Financial Transaction',
    'Transaction of ' || NEW.amount || '€ - ' || NEW.transaction_type,
    jsonb_build_object(
      'transaction_id', NEW.id,
      'amount', NEW.amount,
      'type', NEW.transaction_type,
      'timestamp', NEW.created_at
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to financial transactions
DROP TRIGGER IF EXISTS audit_financial_transactions ON financial_transactions;
CREATE TRIGGER audit_financial_transactions
  AFTER INSERT ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_financial_transaction();

-- Add constraint to prevent negative balances
ALTER TABLE business_finances 
ADD CONSTRAINT check_non_negative_balance 
CHECK (available_balance >= 0);

-- Add constraint to prevent manipulation of transaction amounts
ALTER TABLE financial_transactions 
ADD CONSTRAINT check_valid_transaction_amount 
CHECK (
  (transaction_type = 'earning' AND amount > 0) OR
  (transaction_type IN ('withdrawal', 'boost_payment') AND amount < 0)
);