-- Configure custom email webhook for authentication emails
CREATE OR REPLACE FUNCTION public.send_custom_auth_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be called when authentication events happen
  -- The actual email sending is handled by the edge function
  RETURN NEW;
END;
$$;